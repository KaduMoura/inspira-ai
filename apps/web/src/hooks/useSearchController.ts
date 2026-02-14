import { useState, useReducer, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { ScoredCandidate } from '@/types/domain';
import { ApiResponse, SearchResponseData } from '@/types/api';

/**
 * Search State machine statuses
 */
export type SearchStatus =
    | 'idle'
    | 'validating'
    | 'uploading'
    | 'analyzing'
    | 'success'
    | 'error'
    | 'empty';

interface SearchState {
    status: SearchStatus;
    results: ScoredCandidate[];
    error: { message: string; code?: string } | null;
    image: File | null;
    imagePreview: string | null;
    prompt: string;
    requestId: string | null;
    progressMessage: string;
}

type SearchAction =
    | { type: 'SET_IMAGE'; payload: { file: File; preview: string } }
    | { type: 'REMOVE_IMAGE' }
    | { type: 'SET_PROMPT'; payload: string }
    | { type: 'START_SEARCH' }
    | { type: 'SET_PROGRESS'; payload: string }
    | { type: 'SEARCH_SUCCESS'; payload: { results: ScoredCandidate[]; requestId: string } }
    | { type: 'SEARCH_ERROR'; payload: { message: string; code?: string } }
    | { type: 'RESET' };

const initialState: SearchState = {
    status: 'idle',
    results: [],
    error: null,
    image: null,
    imagePreview: null,
    prompt: '',
    requestId: null,
    progressMessage: '',
};

function searchReducer(state: SearchState, action: SearchAction): SearchState {
    switch (action.type) {
        case 'SET_IMAGE':
            return {
                ...state,
                image: action.payload.file,
                imagePreview: action.payload.preview,
                status: 'idle',
                error: null,
            };
        case 'REMOVE_IMAGE':
            return {
                ...state,
                image: null,
                imagePreview: null,
                status: 'idle',
                results: [],
            };
        case 'SET_PROMPT':
            return {
                ...state,
                prompt: action.payload,
            };
        case 'START_SEARCH':
            return {
                ...state,
                status: 'uploading', // Starting with uploading per typical multipart flow
                error: null,
                progressMessage: 'Uploading image...',
            };
        case 'SET_PROGRESS':
            return {
                ...state,
                progressMessage: action.payload,
            };
        case 'SEARCH_SUCCESS':
            return {
                ...state,
                status: action.payload.results.length > 0 ? 'success' : 'empty',
                results: action.payload.results,
                requestId: action.payload.requestId,
            };
        case 'SEARCH_ERROR':
            return {
                ...state,
                status: 'error',
                error: action.payload,
            };
        case 'RESET':
            return initialState;
        default:
            return state;
    }
}

/**
 * Custom hook to manage the image-based product search flow.
 */
export function useSearchController() {
    const [state, dispatch] = useReducer(searchReducer, initialState);
    const [apiKey, setApiKey] = useState<string>('');

    // Cleanup object URL to prevent memory leaks
    useEffect(() => {
        return () => {
            if (state.imagePreview) {
                URL.revokeObjectURL(state.imagePreview);
            }
        };
    }, [state.imagePreview]);

    const handleImageChange = useCallback((file: File | null) => {
        if (!file) {
            dispatch({ type: 'REMOVE_IMAGE' });
            return;
        }

        // Cleanup previous preview if exists
        if (state.imagePreview) {
            URL.revokeObjectURL(state.imagePreview);
        }

        const previewUrl = URL.createObjectURL(file);
        dispatch({ type: 'SET_IMAGE', payload: { file, preview: previewUrl } });
    }, [state.imagePreview]);

    const handlePromptChange = useCallback((prompt: string) => {
        dispatch({ type: 'SET_PROMPT', payload: prompt });
    }, []);

    const executeSearch = useCallback(async () => {
        if (!state.image) {
            dispatch({ type: 'SEARCH_ERROR', payload: { message: 'Please select an image first.', code: 'MISSING_IMAGE' } });
            return;
        }

        if (!apiKey) {
            dispatch({ type: 'SEARCH_ERROR', payload: { message: 'API Key is required for search.', code: 'MISSING_API_KEY' } });
            return;
        }

        dispatch({ type: 'START_SEARCH' });

        // Simulate progress updates based on expected backend latency
        const progressTimer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            if (elapsed > 2000 && elapsed < 6000) {
                dispatch({ type: 'SET_PROGRESS', payload: 'Analyzing visual features...' });
            } else if (elapsed > 6000 && elapsed < 8000) {
                dispatch({ type: 'SET_PROGRESS', payload: 'Searching catalog...' });
            } else if (elapsed > 8000 && elapsed < 12000) {
                dispatch({ type: 'SET_PROGRESS', payload: 'Ranking best matches...' });
            } else if (elapsed > 12000 && elapsed < 20000) {
                dispatch({ type: 'SET_PROGRESS', payload: 'Refining results with AI...' });
            } else if (elapsed > 20000) {
                dispatch({ type: 'SET_PROGRESS', payload: 'Finalizing...' });
            }
        }, 1000);

        const startTime = Date.now();

        try {
            // In a real app, we might distinguish between UPLOADING and ANALYZING
            // based on fetch progress, but for simplicity we use status transitions.
            const result = await apiClient.searchProducts(state.image, apiKey, state.prompt);
            clearInterval(progressTimer);

            if (result.data) {
                dispatch({
                    type: 'SEARCH_SUCCESS',
                    payload: {
                        results: result.data.results,
                        requestId: result.meta.requestId
                    }
                });
            } else {
                dispatch({ type: 'SEARCH_ERROR', payload: { message: 'Unexpected API response format.' } });
            }
        } catch (error: any) {
            clearInterval(progressTimer);
            dispatch({
                type: 'SEARCH_ERROR',
                payload: {
                    message: error.message || 'An error occurred during search.',
                    code: error.code
                }
            });
        }
    }, [state.image, state.prompt, apiKey]);

    const reset = useCallback(() => {
        if (state.imagePreview) {
            URL.revokeObjectURL(state.imagePreview);
        }
        dispatch({ type: 'RESET' });
    }, [state.imagePreview]);

    return {
        ...state,
        apiKey,
        setApiKey,
        setImage: handleImageChange,
        setPrompt: handlePromptChange,
        executeSearch,
        reset,
    };
}
