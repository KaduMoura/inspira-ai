"use client";

import { useState } from "react";
import { ArrowLeft, Settings2, Activity, ShieldCheck, Lock } from "lucide-react";
import Link from "next/link";
import { ConfigPanel } from "@/features/admin/ConfigPanel";
import { TelemetryPanel } from "@/features/admin/TelemetryPanel";
import { cn } from "@/lib/utils";

export default function AdminPage() {
    const [adminToken, setAdminToken] = useState("");
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [activeTab, setActiveTab] = useState<'config' | 'telemetry'>('config');

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-background animate-fade-in">
                <div className="glass-card w-full max-w-md p-8 rounded-3xl space-y-8 shadow-2xl border-white/10">
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                            <Lock className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-3xl font-display font-bold tracking-tight">Admin Portal</h1>
                        <p className="text-muted-foreground text-sm">Enter the system management token to proceed.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Admin Token</label>
                            <input
                                type="password"
                                value={adminToken}
                                onChange={(e) => setAdminToken(e.target.value)}
                                placeholder="••••••••••••"
                                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-center tracking-[0.3em] font-mono focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && setIsAuthorized(true)}
                            />
                        </div>
                        <button
                            onClick={() => setIsAuthorized(true)}
                            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                        >
                            Authorize Access
                        </button>
                    </div>

                    <p className="text-center">
                        <Link href="/" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
                            <ArrowLeft className="w-3 h-3" />
                            Return to Search
                        </Link>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
            {/* Background Glows */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/5 blur-[150px] rounded-full" />
            </div>

            <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase tracking-widest">
                            <ShieldCheck className="w-4 h-4" />
                            Authorized Terminal
                        </div>
                        <h1 className="text-4xl font-display font-black tracking-tight flex items-center gap-3">
                            Inspira AI Console
                        </h1>
                        <p className="text-muted-foreground max-w-lg">
                            System-level configuration and real-time observability for agentic matching flows.
                        </p>
                    </div>

                    <div className="flex gap-2 p-1 bg-secondary/50 rounded-2xl border border-white/5">
                        <button
                            onClick={() => setActiveTab('config')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                                activeTab === 'config' ? "bg-white dark:bg-zinc-800 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Settings2 className="w-4 h-4" />
                            Configuration
                        </button>
                        <button
                            onClick={() => setActiveTab('telemetry')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                                activeTab === 'telemetry' ? "bg-white dark:bg-zinc-800 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Activity className="w-4 h-4" />
                            Telemetry
                        </button>
                    </div>
                </header>

                <main className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'config' ? (
                        <ConfigPanel adminToken={adminToken} />
                    ) : (
                        <TelemetryPanel adminToken={adminToken} />
                    )}
                </main>

                <footer className="pt-20 pb-10 flex justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors px-6 py-3 rounded-2xl bg-secondary/30 border border-white/5"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Exit Console
                    </Link>
                </footer>
            </div>
        </div>
    );
}
