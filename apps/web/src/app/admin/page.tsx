import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
    return (
        <div className="container py-10 space-y-8 animate-fade-in">
            <header className="flex items-center justify-between">
                <div className="space-y-1">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Search
                    </Link>
                    <h1 className="text-4xl font-display font-bold tracking-tight">
                        Admin Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Configure product matching parameters and retrieval behavior.
                    </p>
                </div>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="glass-card p-6 rounded-xl space-y-4">
                    <h2 className="text-xl font-display font-semibold">Match Weights</h2>
                    <p className="text-sm text-muted-foreground">Adjust the balance between image similarity and prompt relevance.</p>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-2/3" />
                    </div>
                </div>

                <div className="glass-card p-6 rounded-xl space-y-4 opacity-50">
                    <h2 className="text-xl font-display font-semibold">Stage 2 (Reranking)</h2>
                    <p className="text-sm text-muted-foreground">Configure Gemini reranking thresholds.</p>
                </div>

                <div className="glass-card p-6 rounded-xl space-y-4 opacity-50">
                    <h2 className="text-xl font-display font-semibold">Provider Settings</h2>
                    <p className="text-sm text-muted-foreground">Manage API provider fallback logic.</p>
                </div>
            </div>
        </div>
    );
}
