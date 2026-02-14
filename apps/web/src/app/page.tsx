"use client";

import { useState } from "react";
import { Settings, Key, RotateCcw, ChevronDown } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
        progressMessage,
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
        <div className="relative min-h-screen selection:bg-primary/20 flex flex-col items-center overflow-x-hidden">
            {/* Action Buttons */}
            <div className="absolute top-8 right-8 flex items-center gap-4 z-[100]">
                <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsApiModalOpen(true)}
                    className={cn(
                        "group flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all border shadow-sm",
                        apiKey
                            ? "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
                            : "bg-[#1A73E8] text-white border-transparent hover:bg-[#1557B0] hover:shadow-lg"
                    )}
                >
                    <Key className={cn("w-4 h-4", !apiKey && "text-white/80")} />
                    {apiKey ? "Set API Key" : "Activate API Key"}
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Link href="/admin">
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: 15 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2.5 rounded-full bg-white border border-slate-100 shadow-sm text-slate-400 hover:text-slate-600 hover:shadow-md transition-all flex items-center justify-center"
                            title="Search Settings"
                        >
                            <Settings className="w-5 h-5" />
                        </motion.div>
                    </Link>
                </motion.div>
            </div>

            {/* Background Orbs */}
            <motion.div
                className="bg-orb top-[-10%] left-[-5%] w-[45%] h-[45%] bg-[#6366f1]/10"
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3],
                    x: [0, 20, 0]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="bg-orb bottom-[5%] right-[-5%] w-[40%] h-[40%] bg-[#a855f7]/10"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.4, 0.3],
                    x: [0, -30, 0]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            <main className="flex-1 w-full max-w-5xl px-6 flex flex-col items-center justify-center pt-24 pb-12">
                {/* Logo & Hero Section */}
                <section className="text-center space-y-10 mb-20 flex flex-col items-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="flex flex-col items-center gap-10"
                    >
                        {/* Logo Wrapper */}
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-10">
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: 2 }}
                                    className="w-32 h-32 md:w-44 md:h-44 relative drop-shadow-[0_25px_50px_rgba(99,102,241,0.3)]"
                                >
                                    <img
                                        src="/logo.png"
                                        alt="Inspira AI Logo"
                                        className="w-full h-full object-contain"
                                    />
                                </motion.div>
                                <h1 className="text-8xl md:text-9xl font-black tracking-tighter text-[#202124] flex items-center">
                                    <span className="text-gradient drop-shadow-md">Inspira AI</span>
                                </h1>
                            </div>

                            <motion.h2
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                className="text-2xl md:text-3xl font-bold text-slate-400/40 tracking-tight mr-2 -mt-2"
                            >
                                Inspiration to reality.
                            </motion.h2>
                        </div>

                        <div className="max-w-2xl px-4">
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                className="text-xl md:text-2xl text-slate-500/80 font-medium leading-relaxed"
                            >
                                Transform your inspiration into your home. Upload any photo and our AI will find the perfect furniture matches from across our catalog.
                            </motion.p>
                        </div>
                    </motion.div>
                </section>

                {/* Central Interaction Card */}
                <motion.section
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 100, damping: 15 }}
                    className="w-full max-w-2xl space-y-8 relative z-10"
                >
                    <div className="glass-card p-10 space-y-10">
                        <UploadPanel
                            file={image}
                            previewUrl={imagePreview}
                            onFileChange={setImage}
                            error={error?.code === 'MISSING_IMAGE' ? error.message : null}
                        />

                        <PromptInput value={prompt} onChange={setPrompt} />

                        <div className="flex gap-4">
                            <motion.button
                                layout
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSearchClick}
                                disabled={isSearching || !image}
                                className="flex-1 py-5 bg-gradient-to-r from-[#6366f1] to-[#60a5fa] text-white font-bold rounded-[1.5rem] hover:shadow-2xl hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 flex items-center justify-center text-lg tracking-wide"
                            >
                                {isSearching ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span className="min-w-[120px] text-left">{progressMessage}</span>
                                    </div>
                                ) : "Find Matches"}
                            </motion.button>

                            <AnimatePresence>
                                {(image || prompt || results.length > 0) && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                        exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                                        whileHover={{ scale: 1.1, rotate: -90 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={reset}
                                        className="p-5 bg-white border border-slate-100 text-slate-400 rounded-[1.5rem] hover:bg-slate-50 hover:text-slate-600 transition-all shadow-sm flex items-center justify-center"
                                        title="Reset Search"
                                    >
                                        <RotateCcw className="w-6 h-6" />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>

                        <AnimatePresence>
                            {error && error.code !== 'MISSING_IMAGE' && error.code !== 'MISSING_API_KEY' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, y: -20 }}
                                    animate={{ opacity: 1, height: "auto", y: 0 }}
                                    exit={{ opacity: 0, height: 0, y: -20 }}
                                    className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm text-center"
                                >
                                    <p className="font-bold">Search Failed</p>
                                    <p className="font-medium opacity-80">{error.message}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Meta info below card */}
                    <AnimatePresence>
                        {results.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="flex justify-between items-center px-4 group"
                            >
                                <span className="text-sm font-bold text-slate-700">Found {results.length} Matches</span>
                                <button className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">
                                    Sorted by AI Relevance <ChevronDown className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.section>

                <ResultsList results={results} status={status} requestId={useSearchController().requestId} />
            </main>

            <footer className="w-full py-16 flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    whileHover={{ opacity: 1 }}
                    className="flex items-center gap-4 group transition-opacity duration-500"
                >
                    <div className="h-px w-24 bg-slate-200" />
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-slate-500 flex items-center gap-2">
                        Kassa Labs <span className="text-slate-300">•</span> Agentic AI
                    </span>
                    <div className="h-px w-24 bg-slate-200" />
                </motion.div>
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
