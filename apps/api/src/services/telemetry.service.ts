import { SearchTimings, SearchNotice } from '../domain/ai/schemas';

export interface TelemetryEvent {
    requestId: string;
    timestamp: string;
    timings: SearchTimings;
    counts: {
        retrieved: number;
        reranked: number;
        returned: number;
    };
    fallbacks: {
        visionFallback: boolean;
        rerankFallback: boolean;
        broadRetrieval: boolean;
    };
    error: string | null;
}

/**
 * In-memory telemetry service with a Ring Buffer.
 * Keeps the last N search executions for debug and tuning.
 */
export class TelemetryService {
    private static instance: TelemetryService;
    private events: TelemetryEvent[] = [];
    private readonly MAX_EVENTS = 50;

    private constructor() { }

    public static getInstance(): TelemetryService {
        if (!TelemetryService.instance) {
            TelemetryService.instance = new TelemetryService();
        }
        return TelemetryService.instance;
    }

    /**
     * Records a new telemetry event.
     * If the buffer is full, removes the oldest event.
     */
    public record(event: Omit<TelemetryEvent, 'timestamp'>): void {
        const fullEvent: TelemetryEvent = {
            ...event,
            timestamp: new Date().toISOString()
        };

        this.events.unshift(fullEvent); // Add to beginning

        if (this.events.length > this.MAX_EVENTS) {
            this.events.pop(); // Remove from end
        }
    }

    /**
     * Returns all stored events, newest first.
     */
    public getEvents(): TelemetryEvent[] {
        return [...this.events];
    }

    /**
     * Clears all events.
     */
    public clear(): void {
        this.events = [];
    }
}

export const telemetryService = TelemetryService.getInstance();
