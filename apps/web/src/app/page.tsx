"use client";

import { useState } from "react";
import { Settings, Key, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useSearchController } from "@/hooks/useSearchController";
import { UploadPanel } from "@/features/search/UploadPanel";
import { PromptInput } from "@/features/search/PromptInput";
import { ResultsList } from "@/features/search/ResultsList";
import { ApiKeyModal } from "@/features/settings/ApiKeyModal";
import { cn } from "@/lib/utils";

export default function HomePage() {
    const {
        status,
        results,
        error,
        image,
        imagePreview,
        prompt,
        apiKey,
        setApiKey,
        setImage,
        setPrompt,
        executeSearch,
        reset,
    } = useSearchController();

    const [isApiModalOpen, setIsApiModalOpen] = useState(false);

    const handleSearchClick = () => {
        if (!apiKey) {
            setIsApiModalOpen(true);
            return;
        }
        executeSearch();
    };

    const isSearching = status === 'uploading' || status === 'analyzing';

    return (
        <div className="flex-1 flex flex-col items-center min-h-screen p-6 pb-20 space-y-12 animate-fade-in max-w-5xl mx-auto w-full">
            {/* Background Decoration */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-violet-600/5 blur-[120px] rounded-full" />
            </div>

            <header className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center glass z-[60]">
                <div className="text-xl font-display font-bold tracking-tighter">
                    Kassa<span className="text-primary">Labs</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsApiModalOpen(true)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                            apiKey
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "bg-primary/10 text-primary border-primary/20 animate-pulse"
                        )}
                    >
                        <Key className="w-3 h-3" />
                        {apiKey ? "API Key Active" : "Set API Key"}
                    </button>
                    <Link
                        href="/admin"
                        className="p-2 rounded-full hover:bg-secondary transition-colors"
                        title="Admin Dashboard"
                    >
                        <Settings className="w-5 h-5 text-muted-foreground" />
                    </Link>
                </div>
            </header>

            {/* Spacer for fixed header */}
            <div className="h-10 w-full" />

            <section className="text-center space-y-6 w-full py-8">
                <div className="space-y-2">
                    <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight text-gradient">
                        Inspiration to reality.
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Upload an image and find its perfect match in our catalog using agentic AI.
                    </p>
                </div>
            </section>

            <section className="w-full max-w-2xl space-y-12">
                <div className="glass-card rounded-3xl p-8 space-y-8 animate-slide-up shadow-2xl border-white/20">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
                            1. Target Image
                        </label>
                        <UploadPanel
                            file={image}
                            previewUrl={imagePreview}
                            onFileChange={setImage}
                            error={error?.code === 'MISSING_IMAGE' ? error.message : null}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
                                2. Refinement
                            </label>
                            <PromptInput value={prompt} onChange={setPrompt} />
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button
                                onClick={handleSearchClick}
                                disabled={isSearching || !image}
                                className="flex-1 py-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:scale-100 flex items-center justify-center gap-2"
                            >
                                {isSearching ? "Searching..." : "Find Matches"}
                            </button>
                            {(image || prompt || results.length > 0) && (
                                <button
                                    onClick={reset}
                                    className="p-4 bg-secondary/50 text-muted-foreground rounded-2xl hover:bg-secondary transition-all hover:text-foreground"
                                    title="Reset Search"
                                >
                                    <RotateCcw className="w-6 h-6" />
                                </button>
                            )}
                        </div>
                    </div>

                    {error && error.code !== 'MISSING_IMAGE' && error.code !== 'MISSING_API_KEY' && (
                        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center animate-shake">
                            <p className="font-bold mb-1">Search Failed</p>
                            <p>{error.message}</p>
                        </div>
                    )}
                </div>

                <ResultsList results={results} status={status} />
            </section>

            <footer className="py-12 text-sm text-muted-foreground text-center w-full">
                <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="h-px w-12 bg-border/50" />
                    <div className="text-xs font-mono tracking-tighter uppercase opacity-30">Kassa Labs &bull; Agentic AI</div>
                    <div className="h-px w-12 bg-border/50" />
                </div>
            </footer>

            <ApiKeyModal
                isOpen={isApiModalOpen}
                onClose={() => setIsApiModalOpen(false)}
                onSave={setApiKey}
                currentKey={apiKey}
            />
        </div>
    );
}
