"use client";

import { useState, useEffect } from "react";
import {
    Activity,
    Clock,
    ThumbsUp,
    ThumbsDown,
    AlertCircle,
    BarChart3,
    ArrowRight,
    Zap
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { TelemetryEvent } from "@/types/api";
import { cn } from "@/lib/utils";

interface TelemetryPanelProps {
    adminToken: string;
}

export function TelemetryPanel({ adminToken }: TelemetryPanelProps) {
    const [events, setEvents] = useState<TelemetryEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTelemetry();
        const interval = setInterval(loadTelemetry, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const loadTelemetry = async () => {
        try {
            const res = await apiClient.getTelemetry(adminToken);
            if (res.data) setEvents(res.data);
        } catch (err: any) {
            setError(err.message || "Failed to load telemetry");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <Activity className="w-8 h-8 text-primary/40 animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">Fetching pulse data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-display font-bold">Search Telemetry</h2>
                    <p className="text-sm text-muted-foreground">Real-time performance and accuracy metrics</p>
                </div>
                <div className="flex gap-4">
                    <StatCard
                        label="Avg Latency"
                        value={`${Math.round(events.reduce((acc, e) => acc + e.timings.totalMs, 0) / (events.length || 1))}ms`}
                        sub="Rolling 50"
                    />
                    <StatCard
                        label="Success Rate"
                        value={`${Math.round((events.filter(e => !e.error).length / (events.length || 1)) * 100)}%`}
                        sub="Events"
                    />
                </div>
            </div>

            <div className="grid gap-4">
                {events.map((event) => (
                    <div
                        key={event.requestId}
                        className="glass-card rounded-2xl p-5 border-white/5 hover:bg-white/5 transition-colors group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-lg bg-secondary",
                                    event.error ? "text-destructive" : "text-emerald-500"
                                )}>
                                    {event.error ? <AlertCircle className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                                </div>
                                <div>
                                    <p className="text-xs font-mono text-muted-foreground">{event.requestId}</p>
                                    <p className="text-sm font-medium">
                                        {new Date(event.timestamp).toLocaleTimeString()} &bull; {event.counts.returned} items returned
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="flex items-center gap-1.5 justify-end">
                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-sm font-bold font-mono">{event.timings.totalMs}ms</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-1">Total Latency</p>
                                </div>

                                {event.feedback && (
                                    <div className="flex gap-2 bg-black/20 p-1 rounded-lg border border-white/5">
                                        {Object.values(event.feedback.items).map((rating, i) => (
                                            <div key={i} className={cn(
                                                "p-1 rounded",
                                                rating === 'thumbs_up' ? "bg-emerald-500/20 text-emerald-400" : "bg-destructive/20 text-destructive"
                                            )}>
                                                {rating === 'thumbs_up' ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 pt-3 border-t border-white/5">
                            <Detail label="Stage 1" value={`${event.timings.stage1Ms}ms`} />
                            <Detail label="Mongo" value={`${event.timings.mongoMs}ms`} />
                            <Detail label="Stage 2" value={`${event.timings.stage2Ms}ms`} />
                            <Detail
                                label="Strategy"
                                value={event.retrievalPlan || 'standard'}
                                color={event.fallbacks.visionFallback ? 'text-amber-500' : 'text-emerald-500'}
                            />
                        </div>
                    </div>
                ))}

                {events.length === 0 && (
                    <div className="py-20 text-center glass-card rounded-2xl border-dashed">
                        <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground">No search executions recorded yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, sub }: { label: string, value: string, subText?: string, sub?: string }) {
    return (
        <div className="glass-card rounded-xl px-4 py-2 border-white/5 text-right min-w-[120px]">
            <p className="text-[10px] uppercase tracking-tighter text-muted-foreground font-bold">{label}</p>
            <p className="text-lg font-display font-bold text-primary">{value}</p>
            <p className="text-[9px] text-muted-foreground/50">{sub}</p>
        </div>
    );
}

function Detail({ label, value, color }: { label: string, value: string, color?: string }) {
    return (
        <div>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-bold mb-0.5">{label}</p>
            <p className={cn("text-xs font-mono font-medium truncate capitalize", color)}>
                {value}
            </p>
        </div>
    );
}
