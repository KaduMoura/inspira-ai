import { GenerationConfig } from '@google/generative-ai';
import { CatalogReranker, CatalogRerankerInput } from '../../../domain/ai/interfaces';
import { RerankResult, RerankResultSchema, AiError, AiErrorCode } from '../../../domain/ai/schemas';
import { RERANK_SYSTEM_PROMPT, buildRerankUserPrompt } from './prompts/rerank-v1';
import { createGeminiClient } from './client';

export class GeminiCatalogReranker implements CatalogReranker {
    async rerank(input: CatalogRerankerInput): Promise<RerankResult> {
        const { signals, candidates, prompt, apiKey, config } = input;

        if (candidates.length === 0) {
            return { rankedIds: [], reasons: {} };
        }

        try {
            const genAI = createGeminiClient(apiKey);
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                systemInstruction: RERANK_SYSTEM_PROMPT
            });

            const generationConfig: GenerationConfig = {
                temperature: config?.temperature ?? 0.1,
                maxOutputTokens: config?.maxOutputTokens ?? 2000,
                responseMimeType: 'application/json',
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

            try {
                const json = JSON.parse(responseText);
                const validated = RerankResultSchema.safeParse(json);

                if (!validated.success) {
                    throw new AiError(
                        AiErrorCode.AI_INVALID_OUTPUT,
                        'Failed to validate Rerank output schema',
                        validated.error.format()
                    );
                }

                // Ensure all returned IDs exist in candidates
                const candidateIds = new Set(candidates.map(c => c.id));
                const filteredIds = validated.data.rankedIds.filter(id => candidateIds.has(id));

                // Append any missing IDs from candidates to the end
                const rankedSet = new Set(filteredIds);
                candidates.forEach(c => {
                    if (!rankedSet.has(c.id)) {
                        filteredIds.push(c.id);
                    }
                });

                return {
                    rankedIds: filteredIds,
                    reasons: validated.data.reasons || {},
                };
            } catch (parseError: any) {
                if (parseError instanceof AiError) throw parseError;

                throw new AiError(
                    AiErrorCode.AI_INVALID_OUTPUT,
                    'Failed to parse Rerank response as JSON',
                    responseText
                );
            }
        } catch (error: any) {
            if (error instanceof AiError) throw error;

            const status = error?.status || error?.response?.status;
            const message = error?.message || 'Unknown Rerank error';

            if (status === 401 || status === 403) {
                throw new AiError(AiErrorCode.AI_AUTH_ERROR, 'Invalid API Key', error);
            }
            if (status === 429) {
                throw new AiError(AiErrorCode.AI_RATE_LIMIT, 'Quota exceeded', error);
            }

            throw new AiError(AiErrorCode.AI_INTERNAL_ERROR, message, error);
        }
    }
}
