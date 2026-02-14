import { describe, it, expect, beforeEach } from 'vitest';
import { TelemetryService } from './telemetry.service';
import { SearchTimings } from '../domain/ai/schemas';

describe('TelemetryService', () => {
    let service: TelemetryService;

    const mockTimings: SearchTimings = {
        totalMs: 100,
        stage1Ms: 40,
        mongoMs: 20,
        stage2Ms: 40
    };

    const mockEvent = {
        requestId: 'req-1',
        timings: mockTimings,
        counts: { retrieved: 10, reranked: 5, returned: 5 },
        fallbacks: { visionFallback: false, rerankFallback: false, broadRetrieval: false },
        error: null
    };

    beforeEach(() => {
        service = TelemetryService.getInstance();
        service.clear();
    });

    it('should record an event and retrieve it', () => {
        service.record(mockEvent);
        const events = service.getEvents();

        expect(events).toHaveLength(1);
        expect(events[0].requestId).toBe('req-1');
        expect(events[0].timestamp).toBeDefined();
    });

    it('should maintain newest-first order', () => {
        service.record({ ...mockEvent, requestId: 'req-1' });
        service.record({ ...mockEvent, requestId: 'req-2' });

        const events = service.getEvents();
        expect(events[0].requestId).toBe('req-2');
        expect(events[1].requestId).toBe('req-1');
    });

    it('should enforce MAX_EVENTS limit (Ring Buffer behavior)', () => {
        // Record 55 events (limit is 50)
        for (let i = 1; i <= 55; i++) {
            service.record({ ...mockEvent, requestId: `req-${i}` });
        }

        const events = service.getEvents();
        expect(events).toHaveLength(50);
        expect(events[0].requestId).toBe('req-55'); // Newest
        expect(events[49].requestId).toBe('req-6'); // Oldest remaining (1-5 were dropped)
    });

    it('should clear events', () => {
        service.record(mockEvent);
        service.clear();
        expect(service.getEvents()).toHaveLength(0);
    });
});
