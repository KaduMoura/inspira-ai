import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { env } from './config/env';
import { connectToDatabase, disconnectFromDatabase } from './infra/db';
import { CatalogRepository } from './infra/repositories/catalog.repository';
import { ImageSearchService } from './services/image-search.service';

import { GeminiVisionSignalExtractor } from './infra/ai/gemini/gemini-vision.service';
import { GeminiCatalogReranker } from './infra/ai/gemini/gemini-reranker.service';

const server = Fastify({
    logger: env.NODE_ENV === 'production' ? true : {
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
    },
});

async function bootstrap() {
    try {
        // Infrastructure
        await connectToDatabase();

        // Middleware
        await server.register(cors, {
            origin: env.CORS_ORIGIN,
        });

        await server.register(multipart, {
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB
            },
        });

        // Routes
        server.get('/health', async () => {
            return { status: 'OK', timestamp: new Date().toISOString() };
        });

        // Debug Route (Temporary)
        server.get('/debug/catalog', async () => {
            const repo = new CatalogRepository();
            const sample = await repo.getSample();
            return {
                database: 'connected',
                sampleProduct: sample || 'No products found'
            };
        });

        // Debug Pipeline (Temporary)
        server.get('/debug/search-pipeline', async (request, reply) => {
            const apiKey = request.headers['x-ai-api-key'] as string;
            if (!apiKey) {
                return reply.code(400).send({ error: 'Missing x-ai-api-key header' });
            }

            const repo = new CatalogRepository();
            const vision = new GeminiVisionSignalExtractor();
            const reranker = new GeminiCatalogReranker();

            const service = new ImageSearchService(vision, repo, reranker);

            return {
                message: 'ImageSearchService initialized successfully.',
                usage: 'This endpoint verifies that the Two-Stage AI Pipeline is correctly wired (Stage 1: Vision, Stage 2: Rerank).',
                ready: true
            };
        });

        const port = env.PORT;
        const host = '0.0.0.0';

        await server.listen({ port, host });

        console.log(`🚀 API execution started on http://localhost:${port}`);

        // Graceful Shutdown
        const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
        signals.forEach((signal) => {
            process.on(signal, async () => {
                server.log.info(`Received ${signal}, closing server...`);
                await disconnectFromDatabase();
                await server.close();
                process.exit(0);
            });
        });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

bootstrap();
