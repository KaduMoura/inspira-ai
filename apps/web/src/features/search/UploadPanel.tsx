"use client";

import { useCallback, useRef } from "react";
import { Upload, X, ImageIcon, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadPanelProps {
    file: File | null;
    previewUrl: string | null;
    onFileChange: (file: File | null) => void;
    error?: string | null;
    className?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export function UploadPanel({
    file,
    previewUrl,
    onFileChange,
    error: externalError,
    className,
}: UploadPanelProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback((selectedFile: File) => {
        if (!ALLOWED_TYPES.includes(selectedFile.type)) {
            onFileChange(null);
            alert("Invalid file type. Please upload a JPEG, PNG, or WebP image.");
            return;
        }

        if (selectedFile.size > MAX_FILE_SIZE) {
            onFileChange(null);
            alert("File is too large. Maximum size is 10MB.");
            return;
        }

        onFileChange(selectedFile);
    }, [onFileChange]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            handleFile(droppedFile);
        }
    }, [handleFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            handleFile(selectedFile);
        }
    }, [handleFile]);

    const removeFile = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onFileChange(null);
        if (inputRef.current) inputRef.current.value = "";
    }, [onFileChange]);

    return (
        <div className={cn("space-y-4", className)}>
            <div
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={cn(
                    "relative aspect-video rounded-2xl border-2 border-dashed transition-all cursor-pointer group overflow-hidden",
                    previewUrl
                        ? "border-primary/40 bg-secondary/20"
                        : "border-border hover:border-primary/50 bg-secondary/10 hover:bg-secondary/20",
                    externalError && "border-destructive/50 bg-destructive/5"
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept={ALLOWED_TYPES.join(",")}
                    onChange={handleChange}
                />

                {previewUrl ? (
                    <div className="relative w-full h-full animate-fade-in">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={previewUrl}
                            alt="Upload preview"
                            className="w-full h-full object-contain p-2"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <button
                                onClick={removeFile}
                                className="p-2 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 shadow-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                            <Upload className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-semibold tracking-tight">
                                Drop your image here
                            </p>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                or click to browse from your device. Supports JPG, PNG and WebP up to 10MB.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {file && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50 animate-slide-up">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-background">
                            <ImageIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    </div>
                    <button
                        onClick={removeFile}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {externalError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-shake">
                    <FileWarning className="w-4 h-4 shrink-0" />
                    <p>{externalError}</p>
                </div>
            )}
        </div>
    );
}
