"use client";

import { ResultCard } from "./ResultCard";
import { ScoredCandidate } from "@/types/domain";
import { SearchStatus } from "@/hooks/useSearchController";
import { Loader2, SearchX, Lightbulb } from "lucide-react";

interface ResultsListProps {
    results: ScoredCandidate[];
    status: SearchStatus;
    requestId: string | null;
}

export function ResultsList({ results, status, requestId }: ResultsListProps) {
    if (status === 'uploading' || status === 'analyzing') {
        return (
            <div className="w-full py-20 flex flex-col items-center justify-center space-y-6 animate-pulse">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                    <p className="text-xl font-display font-bold tracking-tight">
                        {status === 'uploading' ? 'Sending image...' : 'AI is analyzing visuals...'}
                    </p>
                    <p className="text-muted-foreground animate-bounce">Finding your perfect match in our catalog</p>
                </div>
            </div>
        );
    }

    if (status === 'empty') {
        return (
            <div className="w-full py-20 flex flex-col items-center justify-center text-center space-y-8 animate-fade-in">
                <div className="p-6 rounded-full bg-secondary/30 text-muted-foreground">
                    <SearchX className="w-12 h-12" />
                </div>
                <div className="max-w-md space-y-4">
                    <h2 className="text-3xl font-display font-bold">No perfect matches found</h2>
                    <p className="text-muted-foreground">
                        Our AI couldn't find an exact match in the current catalog. Try these tips to improve results:
                    </p>

                    <div className="grid gap-3 text-left">
                        {[
                            "Use a clearer, well-lit photo",
                            "Focus on a single furniture item",
                            "Remove restrictive keywords from the prompt",
                            "Try a different angle or perspective"
                        ].map((tip, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 border border-border/50">
                                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                                <span className="text-sm font-medium">{tip}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (results.length === 0 && status !== 'error' && status !== 'idle') {
        return null;
    }

    return (
        <div className="w-full space-y-8 animate-fade-in">
            <div className="flex items-baseline justify-between border-b border-border/50 pb-4">
                <h2 className="text-2xl font-display font-bold">
                    Found {results.length} Matches
                </h2>
                <p className="text-sm text-muted-foreground font-mono">
                    Sorted by AI Relevance
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {results.map((result, index) => (
                    <ResultCard
                        key={result.id}
                        result={result}
                        rank={index + 1}
                        requestId={requestId || ''}
                    />
                ))}
            </div>
        </div>
    );
}
