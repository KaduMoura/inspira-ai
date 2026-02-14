"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, ImageIcon, FileWarning, Image as LucideImageIcon } from "lucide-react";
import { motion } from "framer-motion";
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

    const [isDragging, setIsDragging] = useState(false);

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

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = "copy";
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            handleFile(droppedFile);
        }
    }, [handleFile]);

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
        <div className={cn("w-full", className)}>
            <motion.div
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                    "relative aspect-[2/1] rounded-[2rem] border-[1.5px] border-dashed transition-all duration-300 cursor-pointer group overflow-hidden flex flex-col items-center justify-center p-8",
                    previewUrl
                        ? "border-primary/40 bg-primary/5"
                        : "border-slate-200 hover:border-purple-500 hover:border-solid bg-slate-50/50 hover:shadow-xl hover:shadow-purple-500/10",
                    isDragging && "border-purple-500 border-solid bg-purple-500/5 shadow-xl shadow-purple-500/10",
                    externalError && "border-destructive/50 bg-destructive/5"
                )}
            >
                {/* Purple Overlay on Hover/Drag */}
                {!previewUrl && (
                    <div className={cn(
                        "absolute inset-0 bg-purple-500/10 transition-opacity duration-300 pointer-events-none",
                        isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )} />
                )}

                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    style={{ display: 'none' }} // Explicitly hide to be safe
                    accept={ALLOWED_TYPES.join(",")}
                    onChange={handleChange}
                />

                {previewUrl ? (
                    <div className="relative w-full h-full animate-fade-in flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={previewUrl}
                            alt="Upload preview"
                            className="max-w-full max-h-full object-contain rounded-xl shadow-sm"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <button
                                onClick={removeFile}
                                className="p-3 rounded-full bg-white/90 text-destructive opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110 shadow-xl border border-destructive/20"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center space-y-4 text-center animate-fade-in relative z-10">
                        <div className="w-20 h-20 flex items-center justify-center text-slate-300 group-hover:text-purple-400 group-hover:scale-110 transition-all duration-500 ease-out">
                            <LucideImageIcon className="w-16 h-16 stroke-[1.5]" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-[#3C4043] text-lg font-medium group-hover:text-purple-600 transition-colors">
                                Upload an image of a furniture item
                            </p>
                            <p className="text-[#70757A] text-sm group-hover:text-purple-400/80 transition-colors">
                                Drag & drop or <span className="text-[#1A73E8] group-hover:text-purple-600 font-medium hover:underline">browse</span> to upload
                            </p>
                        </div>
                    </div>
                )}
            </motion.div>

            {externalError && (
                <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-shake">
                    <FileWarning className="w-4 h-4 shrink-0" />
                    <p>{externalError}</p>
                </div>
            )}
        </div>
    );
}
