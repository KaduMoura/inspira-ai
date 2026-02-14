"use client";

import { useState, useEffect } from "react";
import { Save, RotateCcw, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { cn } from "@/lib/utils";

interface ConfigPanelProps {
    adminToken: string;
}

export function ConfigPanel({ adminToken }: ConfigPanelProps) {
    const [config, setConfig] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.getAdminConfig(adminToken);
            if (res.data) setConfig(res.data);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || "Failed to load config" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            await apiClient.updateAdminConfig(adminToken, config);
            setMessage({ type: 'success', text: "Configuration saved successfully" });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || "Failed to save config" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = async () => {
        if (!confirm("Are you sure you want to reset all parameters to defaults?")) return;
        setIsSaving(true);
        try {
            const res = await apiClient.resetAdminConfig(adminToken);
            if (res.data) setConfig(res.data);
            setMessage({ type: 'success', text: "Reset to defaults successful" });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || "Failed to reset" });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!config) return null;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-display font-bold">System Configuration</h2>
                    <p className="text-sm text-muted-foreground">Tune weighting and AI retrieval parameters</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-secondary transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Defaults
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            </div>

            {message && (
                <div className={cn(
                    "p-4 rounded-xl flex items-center gap-3 border animate-in slide-in-from-top-2",
                    message.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-destructive/10 border-destructive/20 text-destructive"
                )}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            <div className="grid gap-8 pb-10">
                {/* Ranking Weights */}
                <section className="glass-card rounded-2xl p-6 space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Ranking Weights
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(config.weights).map(([key, value]: [string, any]) => (
                            <div key={key} className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                                    {key}
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={value}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        weights: { ...config.weights, [key]: parseFloat(e.target.value) }
                                    })}
                                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Thresholds & Limits */}
                <section className="glass-card rounded-2xl p-6 space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Retrieval & Thresholds
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Candidate Top N</label>
                            <input
                                type="number"
                                value={config.candidateTopN}
                                onChange={(e) => setConfig({ ...config, candidateTopN: parseInt(e.target.value) })}
                                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Min Category Confidence</label>
                            <input
                                type="number"
                                step="0.05"
                                value={config.minCategoryConfidence}
                                onChange={(e) => setConfig({ ...config, minCategoryConfidence: parseFloat(e.target.value) })}
                                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">LLM Rerank Top M</label>
                            <input
                                type="number"
                                value={config.llmRerankTopM}
                                onChange={(e) => setConfig({ ...config, llmRerankTopM: parseInt(e.target.value) })}
                                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={config.enableLLMRerank}
                                onChange={(e) => setConfig({ ...config, enableLLMRerank: e.target.checked })}
                                className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="text-sm font-medium group-hover:text-primary transition-colors">Enable Gemini Reranking</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={config.useCategoryFilter}
                                onChange={(e) => setConfig({ ...config, useCategoryFilter: e.target.checked })}
                                className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="text-sm font-medium group-hover:text-primary transition-colors">Strict Category Filter</span>
                        </label>
                    </div>
                </section>

                {/* Match Bands */}
                <section className="glass-card rounded-2xl p-6 space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Match Bands
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">High Confidence Threshold</label>
                            <input
                                type="number"
                                step="0.05"
                                value={config.matchBands.high}
                                onChange={(e) => setConfig({
                                    ...config,
                                    matchBands: { ...config.matchBands, high: parseFloat(e.target.value) }
                                })}
                                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Medium Confidence Threshold</label>
                            <input
                                type="number"
                                step="0.05"
                                value={config.matchBands.medium}
                                onChange={(e) => setConfig({
                                    ...config,
                                    matchBands: { ...config.matchBands, medium: parseFloat(e.target.value) }
                                })}
                                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
