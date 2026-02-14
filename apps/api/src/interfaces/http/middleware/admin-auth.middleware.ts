import { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../../../config/env';

/**
 * Middleware to protect admin routes.
 * Checks for the X-Admin-Token header against the configured ADMIN_TOKEN.
 */
export async function adminAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
    const adminToken = request.headers['x-admin-token'];
    const expectedToken = env.ADMIN_TOKEN;

    // Fastify headers can be string | string[]
    const providedToken = Array.isArray(adminToken) ? adminToken[0] : adminToken;

    if (!providedToken || providedToken !== expectedToken) {
        request.log.warn({
            providedToken: providedToken ? '***' : 'missing',
            requestId: request.id
        }, 'Unauthorized admin access attempt');

        return reply.code(403).send({
            data: null,
            error: {
                code: 'FORBIDDEN',
                message: 'Forbidden: Valid admin token required'
            },
            meta: { requestId: request.id }
        });
    }
}
