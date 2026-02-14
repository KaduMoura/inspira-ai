import { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../../../config/env';

/**
 * Middleware to protect admin routes.
 * Checks for the X-Admin-Token header against the configured ADMIN_TOKEN.
 */
export async function adminAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
    const adminToken = request.headers['x-admin-token'];

    if (!adminToken || adminToken !== env.ADMIN_TOKEN) {
        request.log.warn({
            providedToken: adminToken ? '***' : 'missing',
            requestId: request.id
        }, 'Unauthorized admin access attempt');

        return reply.code(403).send({
            error: 'Forbidden: Valid admin token required',
            meta: { requestId: request.id }
        });
    }
}
