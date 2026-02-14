import { BadgeCheck, ThumbsUp, ThumbsDown } from "lucide-react";
import { useState } from "react";
import { ScoredCandidate, MatchBand } from "@/types/domain";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/apiClient";

interface ResultCardProps {
    result: ScoredCandidate;
    rank: number;
    requestId: string;
    className?: string;
}

export function ResultCard({ result, rank, requestId, className }: ResultCardProps) {
    const [feedback, setFeedback] = useState<'thumbs_up' | 'thumbs_down' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFeedback = async (rating: 'thumbs_up' | 'thumbs_down') => {
        if (isSubmitting || feedback === rating) return;

        setIsSubmitting(true);
        try {
            await apiClient.submitFeedback(requestId, {
                items: { [result.id]: rating }
            });
            setFeedback(rating);
        } catch (error) {
            console.error("Failed to submit feedback", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const bandColors: Record<MatchBand, string> = {
        [MatchBand.HIGH]: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
        [MatchBand.MEDIUM]: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
        [MatchBand.LOW]: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20 dark:text-zinc-400",
    };

    return (
        <div className={cn(
            "glass-card rounded-2xl p-5 space-y-4 hover:border-primary/30 transition-all group animate-slide-up",
            className
        )}>
            <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-primary/60">#{rank}</span>
                        <h3 className="font-display font-bold text-xl leading-tight group-hover:text-primary transition-colors">
                            {result.title}
                        </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {result.category} &bull; {result.type}
                    </p>
                </div>
                <div className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold border shrink-0",
                    bandColors[result.matchBand]
                )}>
                    {result.matchBand}
                </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 italic">
                "{result.description}"
            </p>

            <div className="pt-2 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider">Dimensions</p>
                    <p className="text-sm font-medium">
                        {result.width}×{result.height}×{result.depth} <span className="text-[10px] text-muted-foreground">cm</span>
                    </p>
                </div>
                <div className="space-y-1 text-right">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider">Estimated Price</p>
                    <p className="text-lg font-display font-bold text-primary">
                        ${result.price.toLocaleString()}
                    </p>
                </div>
            </div>

            {result.reasons.length > 0 && (
                <div className="pt-3 border-t border-border/50 flex flex-wrap gap-1.5 justify-between items-center">
                    <div className="flex flex-wrap gap-1.5 flex-1">
                        {result.reasons.slice(0, 3).map((reason, i) => (
                            <div key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/50 text-[10px] text-muted-foreground">
                                <BadgeCheck className="w-3 h-3 text-emerald-500" />
                                {reason}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-4">
                        <button
                            onClick={() => handleFeedback('thumbs_up')}
                            disabled={isSubmitting}
                            className={cn(
                                "p-1.5 rounded-lg transition-all",
                                feedback === 'thumbs_up'
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : "hover:bg-secondary text-muted-foreground"
                            )}
                            title="Match is accurate"
                        >
                            <ThumbsUp className={cn("w-4 h-4", feedback === 'thumbs_up' && "fill-current")} />
                        </button>
                        <button
                            onClick={() => handleFeedback('thumbs_down')}
                            disabled={isSubmitting}
                            className={cn(
                                "p-1.5 rounded-lg transition-all",
                                feedback === 'thumbs_down'
                                    ? "bg-destructive/10 text-destructive"
                                    : "hover:bg-secondary text-muted-foreground"
                            )}
                            title="Not what I was looking for"
                        >
                            <ThumbsDown className={cn("w-4 h-4", feedback === 'thumbs_down' && "fill-current")} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
