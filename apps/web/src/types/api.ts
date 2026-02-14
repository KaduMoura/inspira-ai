import { ScoredCandidate } from './domain';

export interface ApiResponse<T> {
    data: T | null;
    error: {
        code: string;
        message: string;
        details?: any;
    } | null;
    meta: {
        requestId: string;
        timings?: {
            totalMs: number;
            stage1Ms: number;
            mongoMs: number;
            stage2Ms: number;
        };
        notices?: Array<{
            code: string;
            message: string;
        }>;
        retrievalPlan?: string;
    };
}

export interface SearchByImagePayload {
    image: File;
    prompt?: string;
}

export interface SearchResponseData {
    query: {
        prompt?: string;
        signals: any;
    };
    results: ScoredCandidate[];
}

export interface TelemetryEvent {
    requestId: string;
    timestamp: string;
    timings: {
        totalMs: number;
        stage1Ms: number;
        mongoMs: number;
        stage2Ms: number;
    };
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
    retrievalPlan?: string;
    feedback?: {
        items: Record<string, 'thumbs_up' | 'thumbs_down'>;
        notes?: string;
    };
}
