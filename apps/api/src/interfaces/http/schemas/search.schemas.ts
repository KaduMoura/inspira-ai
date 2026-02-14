import { z } from 'zod';

export const SearchImageHeadersSchema = z.object({
    'x-ai-api-key': z.string().min(1, 'AI API Key is required'),
});

export const SearchImageResponseSchema = z.object({
    signals: z.any(), // Keeping it open as it matches ImageSignals
    candidates: z.array(z.any()),
});

export type SearchImageHeaders = z.infer<typeof SearchImageHeadersSchema>;
