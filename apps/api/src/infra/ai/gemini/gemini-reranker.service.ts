import { GenerationConfig, SchemaType, Schema } from '@google/generative-ai';
import { CatalogReranker, CatalogRerankerInput } from '../../../domain/ai/interfaces';
import { RerankResult, RerankResultSchema, AiError, AiErrorCode } from '../../../domain/ai/schemas';
import { RERANK_SYSTEM_PROMPT, buildRerankUserPrompt } from './prompts/rerank-v1';
import { createGeminiClient } from './client';
import { env } from '../../../config/env';

/**
 * Strict Schema for Gemini Structured Outputs
 */
const RERANK_RESPONSE_SCHEMA: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        results: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    id: { type: SchemaType.STRING },
                    reasons: {
                        type: SchemaType.ARRAY,
                        items: { type: SchemaType.STRING }
                    }
                },
                required: ["id", "reasons"]
            },
            description: "List of candidates, ordered by relevance"
        }
    },
    required: ["results"]
};

export class GeminiCatalogReranker implements CatalogReranker {
    async rerank(input: CatalogRerankerInput): Promise<RerankResult> {
        const { signals, candidates, prompt, apiKey, config, requestId } = input;

        if (candidates.length === 0) {
            return { rankedIds: [], reasons: {} };
        }

        try {
            const genAI = createGeminiClient(apiKey);
            const model = genAI.getGenerativeModel({
                model: env.GEMINI_MODEL_RERANK,
                systemInstruction: RERANK_SYSTEM_PROMPT
            });

            const generationConfig: GenerationConfig = {
                temperature: config?.temperature ?? 0.1,
                maxOutputTokens: config?.maxOutputTokens ?? 2000,
                responseMimeType: 'application/json',
                responseSchema: RERANK_RESPONSE_SCHEMA,
            };

            const userPrompt = buildRerankUserPrompt(signals, candidates, prompt);

            const result = await model.generateContent({
                contents: [{
                    role: 'user',
                    parts: [{ text: userPrompt }],
                }],
                generationConfig,
            });

            const responseText = result.response.text();
            let validated: RerankResult;

            try {
                const rawData = this.parseAndValidate(responseText);
                validated = {
                    rankedIds: rawData.results.map((r: any) => r.id),
                    reasons: rawData.results.reduce((acc: any, curr: any) => {
                        acc[curr.id] = curr.reasons;
                        return acc;
                    }, {})
                };
            } catch (error) {
                // Stage 2.1: Robust Repair with Gemini 2.5 Flash
                console.warn(`[Reranker] Primary JSON invalid for request ${requestId}, attempting repair with ${env.GEMINI_MODEL_VISION}...`);
                const repairedRaw = await this.repairJsonWithFlash2_5(responseText, apiKey, requestId);
                validated = {
                    rankedIds: repairedRaw.results.map((r: any) => r.id),
                    reasons: repairedRaw.results.reduce((acc: any, curr: any) => {
                        acc[curr.id] = curr.reasons;
                        return acc;
                    }, {})
                };
            }

            // Ensure all returned IDs exist in candidates
            const candidateIds = new Set(candidates.map(c => c.id));
            const filteredIds = validated.rankedIds.filter((id: string) => candidateIds.has(id));

            // Append any missing IDs from candidates to the end
            const rankedSet = new Set(filteredIds);
            candidates.forEach(c => {
                if (!rankedSet.has(c.id)) {
                    filteredIds.push(c.id);
                }
            });

            return {
                rankedIds: filteredIds,
                reasons: validated.reasons || {},
            };
        } catch (error: any) {
            console.error("DEBUG: Full Rerank Error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            if (error?.response) {
                console.error("DEBUG: Error Response:", JSON.stringify(error.response, null, 2));
            }

            if (error instanceof AiError) throw error;

            const status = error?.status || error?.response?.status;
            const message = error?.message || 'Unknown Rerank error';

            if (status === 401 || status === 403) {
                throw new AiError(AiErrorCode.PROVIDER_AUTH_ERROR, 'Invalid API Key', error);
            }
            if (status === 429) {
                throw new AiError(AiErrorCode.PROVIDER_RATE_LIMIT, 'Quota exceeded', error);
            }

            throw new AiError(AiErrorCode.INTERNAL_ERROR, message, error);
        }
    }

    /**
     * Dedicated repair function using Gemini 2.5 Flash
     * Includes automatic retries and Structured Outputs for the repair itself.
     */
    private async repairJsonWithFlash2_5(
        malformedJson: string,
        apiKey: string,
        requestId: string,
        maxRetries = 2
    ): Promise<any> {
        const genAI = createGeminiClient(apiKey);
        const model = genAI.getGenerativeModel({
            model: env.GEMINI_MODEL_VISION, // Use 2.5 Flash
            systemInstruction: "You are a JSON repair expert. Fix the malformed JSON to match the required schema exactly."
        });

        const generationConfig: GenerationConfig = {
            temperature: 0, // Strict
            responseMimeType: 'application/json',
            responseSchema: RERANK_RESPONSE_SCHEMA,
        };

        let lastError: any;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await model.generateContent({
                    contents: [{
                        role: 'user',
                        parts: [{ text: `Repair this malformed JSON: ${malformedJson}\nReturn ONLY the valid JSON.` }],
                    }],
                    generationConfig,
                });

                const fixedText = result.response.text();
                return this.parseAndValidate(fixedText);
            } catch (error) {
                lastError = error;
                console.warn(`[Reranker] Repair attempt ${attempt}/${maxRetries} failed for request ${requestId}:`, error);
            }
        }

        throw new AiError(
            AiErrorCode.PROVIDER_INVALID_RESPONSE,
            `Failed to repair JSON after ${maxRetries} attempts`,
            { originalMalformed: malformedJson, lastError }
        );
    }

    private parseAndValidate(text: string): any {
        try {
            // Basic sanitization: sometimes model wraps in ```json ... ```
            const cleaned = text.replace(/```json\n?/, '').replace(/\n?```/, '').trim();
            const json = JSON.parse(cleaned);
            // Internal validation of the raw results array
            if (!json.results || !Array.isArray(json.results)) {
                throw new Error("Invalid response format: expected 'results' array");
            }
            return json;
        } catch (e: any) {
            if (e instanceof AiError) throw e;
            throw new AiError(
                AiErrorCode.PROVIDER_INVALID_RESPONSE,
                'Failed to parse Rerank response as JSON',
                text
            );
        }
    }
}
