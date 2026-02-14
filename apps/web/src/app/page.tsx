import { Search, Settings, Upload } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-12 animate-fade-in">
            {/* Background Decoration */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-violet-600/5 blur-[120px] rounded-full" />
            </div>

            <header className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center glass z-50">
                <div className="text-xl font-display font-bold tracking-tighter">
                    Kassa<span className="text-primary">Labs</span>
                </div>
                <Link
                    href="/admin"
                    className="p-2 rounded-full hover:bg-secondary transition-colors"
                >
                    <Settings className="w-5 h-5 text-muted-foreground" />
                </Link>
            </header>

            <div className="max-w-3xl space-y-6">
                <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight text-gradient">
                    From inspiration to reality in seconds.
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Upload an image of any furniture item and find its perfect match in our catalog using agentic AI.
                </p>
            </div>

            <div className="w-full max-w-xl glass-card rounded-2xl p-8 space-y-8 animate-slide-up">
                <div className="aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center space-y-4 hover:border-primary/50 transition-colors cursor-pointer group">
                    <div className="p-4 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="font-medium">Drop an image here</p>
                        <p className="text-sm text-muted-foreground">or click to browse from your device</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Optional: add details like color, style..."
                            className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                    <button className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95">
                        Search
                    </button>
                </div>
            </div>

            <footer className="fixed bottom-6 text-sm text-muted-foreground">
                Kassa Labs Technical Assessment &bull; 2024
            </footer>
        </div>
    );
}
