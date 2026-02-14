
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { adminRoutes } from './admin.routes';
import { AppConfigService } from '../../../config/app-config.service';
import { TelemetryService } from '../../../services/telemetry.service';

// Mock dependencies
const mockGetConfig = vi.fn();
const mockUpdateConfig = vi.fn();
const mockResetToDefaults = vi.fn();
const mockGetEvents = vi.fn();

vi.mock('../../../config/app-config.service', () => ({
    appConfigService: {
        getConfig: () => mockGetConfig(),
        updateConfig: (config: any) => mockUpdateConfig(config),
        resetToDefaults: () => mockResetToDefaults()
    },
    AppConfigService: {
        getInstance: () => ({
            getConfig: mockGetConfig,
            updateConfig: mockUpdateConfig,
            resetToDefaults: mockResetToDefaults
        })
    }
}));

vi.mock('../../../services/telemetry.service', () => ({
    telemetryService: {
        getEvents: () => mockGetEvents()
    },
    TelemetryService: {
        getInstance: () => ({
            getEvents: mockGetEvents
        })
    }
}));

// Mock env to control ADMIN_TOKEN
vi.mock('../../../config/env', () => ({
    env: {
        ADMIN_TOKEN: 'secret-token'
    }
}));

describe('Admin Routes Integration', () => {
    let server: FastifyInstance;

    beforeEach(async () => {
        vi.clearAllMocks();
        server = Fastify();
        await server.register(adminRoutes);
    });

    it('should return 403 if X-Admin-Token is missing', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/config'
        });

        expect(response.statusCode).toBe(403);
        const body = JSON.parse(response.body);
        expect(body.error.code).toBe('FORBIDDEN');
    });

    it('should return 403 if X-Admin-Token is incorrect', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/config',
            headers: {
                'x-admin-token': 'wrong-token'
            }
        });

        expect(response.statusCode).toBe(403);
        const body = JSON.parse(response.body);
        expect(body.error.code).toBe('FORBIDDEN');
    });

    it('should return 200 and config if token is correct', async () => {
        const mockConfig = { candidateTopN: 50 };
        mockGetConfig.mockReturnValue(mockConfig);

        const response = await server.inject({
            method: 'GET',
            url: '/config',
            headers: {
                'x-admin-token': 'secret-token'
            }
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.data).toEqual(mockConfig);
        expect(mockGetConfig).toHaveBeenCalled();
    });

    it('should update config successfully', async () => {
        const updatePayload = { candidateTopN: 100 };
        const updatedConfig = { candidateTopN: 100, someOtherField: 'default' };
        mockUpdateConfig.mockReturnValue(updatedConfig);

        const response = await server.inject({
            method: 'PATCH',
            url: '/config',
            headers: {
                'x-admin-token': 'secret-token'
            },
            payload: updatePayload
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.data).toEqual(updatedConfig);
        expect(mockUpdateConfig).toHaveBeenCalledWith(updatePayload);
    });

    it('should handle config validation errors', async () => {
        const error = new Error('Validation failed');
        mockUpdateConfig.mockImplementation(() => { throw error; });

        const response = await server.inject({
            method: 'PATCH',
            url: '/config',
            headers: {
                'x-admin-token': 'secret-token'
            },
            payload: { invalid: 'data' }
        });

        // The error handler in server.ts isn't registered here, but AdminController re-throws.
        // Fastify default error handler should catch it.
        // Since we didn't register the global error handler in this test setup, 
        // Fastify will likely return 500 or let the error bubble up if uncaught (but .inject catches it).
        // Let's check if it returns 500 or propagates the error message.

        expect(response.statusCode).toBe(500);
    });

    it('should reset config to defaults', async () => {
        const defaultConfig = { candidateTopN: 60 };
        mockResetToDefaults.mockReturnValue(defaultConfig);

        const response = await server.inject({
            method: 'POST',
            url: '/config/reset',
            headers: {
                'x-admin-token': 'secret-token'
            }
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.data).toEqual(defaultConfig);
        expect(mockResetToDefaults).toHaveBeenCalled();
    });

    it('should return telemetry events', async () => {
        const mockEvents = [{ id: 1, type: 'search' }];
        mockGetEvents.mockReturnValue(mockEvents);

        const response = await server.inject({
            method: 'GET',
            url: '/telemetry',
            headers: {
                'x-admin-token': 'secret-token'
            }
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.data).toEqual(mockEvents);
        expect(body.meta.count).toBe(1);
        expect(mockGetEvents).toHaveBeenCalled();
    });

    it('should export telemetry as JSON download', async () => {
        const mockEvents = [{ id: 1, type: 'search' }];
        mockGetEvents.mockReturnValue(mockEvents);

        const response = await server.inject({
            method: 'GET',
            url: '/telemetry/export',
            headers: {
                'x-admin-token': 'secret-token'
            }
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toContain('application/json');
        expect(response.headers['content-disposition']).toContain('attachment; filename="telemetry-export-');

        const body = JSON.parse(response.body);
        expect(body.events).toEqual(mockEvents);
        expect(body.count).toBe(1);
    });
});
