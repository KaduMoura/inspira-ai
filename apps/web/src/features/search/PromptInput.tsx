"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function PromptInput({
    value,
    onChange,
    placeholder = "Optional: Scandinavian style, light wood, under $300...",
    className,
}: PromptInputProps) {
    return (
        <div className={cn("relative group", className)}>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                <Search className="w-5 h-5" />
            </div>

            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-12 pr-12 py-4 bg-secondary/40 border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-secondary/60 transition-all text-lg placeholder:text-muted-foreground/60"
                maxLength={500}
            />

            {value && (
                <button
                    onClick={() => onChange("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-all animate-fade-in"
                >
                    <X className="w-4 h-4" />
                </button>
            )}

            <div className="absolute -bottom-6 left-0 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/40 px-2">
                Optional Refinement
            </div>
            {value.length > 400 && (
                <div className="absolute -bottom-6 right-2 text-[10px] font-mono text-muted-foreground/60">
                    {value.length}/500
                </div>
            )}
        </div>
    );
}
