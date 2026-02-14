import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../config/env', () => ({
    env: {
        ADMIN_TOKEN: 'test-secret'
    }
}));

import { env } from '../../../config/env';
import { adminAuthMiddleware } from './admin-auth.middleware';

describe('AdminAuthMiddleware', () => {
    it('should allow access with valid token', async () => {
        const mockRequest = {
            headers: { 'x-admin-token': env.ADMIN_TOKEN },
            id: 'test-req',
            log: { warn: vi.fn() }
        } as any;
        const mockReply = {
            code: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis()
        } as any;

        const result = await adminAuthMiddleware(mockRequest, mockReply);

        expect(result).toBeUndefined(); // Continues to route
        expect(mockReply.code).not.toHaveBeenCalled();
    });

    it('should reject access with invalid token', async () => {
        const mockRequest = {
            headers: { 'x-admin-token': 'wrong' },
            id: 'test-req',
            log: { warn: vi.fn() }
        } as any;
        const mockReply = {
            code: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis()
        } as any;

        await adminAuthMiddleware(mockRequest, mockReply);

        expect(mockReply.code).toHaveBeenCalledWith(403);
        expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.objectContaining({ code: 'FORBIDDEN' })
        }));
    });

    it('should handle array of tokens (Fastify style)', async () => {
        const mockRequest = {
            headers: { 'x-admin-token': [env.ADMIN_TOKEN] },
            id: 'test-req',
            log: { warn: vi.fn() }
        } as any;
        const mockReply = {
            code: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis()
        } as any;

        const result = await adminAuthMiddleware(mockRequest, mockReply);

        expect(result).toBeUndefined();
        expect(mockReply.code).not.toHaveBeenCalled();
    });
});
