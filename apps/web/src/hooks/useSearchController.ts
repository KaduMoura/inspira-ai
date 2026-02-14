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
}

type SearchAction =
    | { type: 'SET_IMAGE'; payload: { file: File; preview: string } }
    | { type: 'REMOVE_IMAGE' }
    | { type: 'SET_PROMPT'; payload: string }
    | { type: 'START_SEARCH' }
    | { type: 'SEARCH_SUCCESS'; payload: ScoredCandidate[] }
    | { type: 'SEARCH_ERROR'; payload: { message: string; code?: string } }
    | { type: 'RESET' };

const initialState: SearchState = {
    status: 'idle',
    results: [],
    error: null,
    image: null,
    imagePreview: null,
    prompt: '',
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
            };
        case 'SEARCH_SUCCESS':
            return {
                ...state,
                status: action.payload.length > 0 ? 'success' : 'empty',
                results: action.payload,
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

        try {
            // In a real app, we might distinguish between UPLOADING and ANALYZING
            // based on fetch progress, but for simplicity we use status transitions.
            const result = await apiClient.searchProducts(state.image, apiKey, state.prompt);

            if (result.data) {
                dispatch({ type: 'SEARCH_SUCCESS', payload: result.data.results });
            } else {
                dispatch({ type: 'SEARCH_ERROR', payload: { message: 'Unexpected API response format.' } });
            }
        } catch (error: any) {
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
