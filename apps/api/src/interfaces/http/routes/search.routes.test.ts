import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { searchRoutes } from './search.routes';

// Mock dependencies
const mockSearchByImage = vi.fn();

vi.mock('../../../infra/ai/gemini/gemini-vision.service', () => ({
    GeminiVisionSignalExtractor: vi.fn().mockImplementation(() => ({}))
}));
vi.mock('../../../infra/ai/gemini/gemini-reranker.service', () => ({
    GeminiCatalogReranker: vi.fn().mockImplementation(() => ({}))
}));
vi.mock('../../../infra/repositories/catalog.repository', () => ({
    CatalogRepository: vi.fn().mockImplementation(() => ({}))
}));
vi.mock('../../../services/image-search.service', () => ({
    ImageSearchService: vi.fn().mockImplementation(() => ({
        searchByImage: mockSearchByImage
    }))
}));

describe('Search Routes Integration', () => {
    const server = Fastify();

    beforeEach(async () => {
        vi.clearAllMocks();
        if (!server.hasContentTypeParser('multipart/form-data')) {
            await server.register(multipart);
            await server.register(searchRoutes);
        }
    });

    it('should return 400 if x-ai-api-key is missing', async () => {
        const response = await server.inject({
            method: 'POST',
            url: '/image',
        });

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body).error).toContain('Validation failed');
    });

    it('should return 400 if not multipart', async () => {
        const response = await server.inject({
            method: 'POST',
            url: '/image',
            headers: {
                'x-ai-api-key': 'test-key'
            }
        });

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body).error).toContain('Expected multipart');
    });
});
