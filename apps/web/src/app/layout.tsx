import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
});

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-display",
});

export const metadata: Metadata = {
    title: {
        default: "Inspira AI | Inspiration to Reality",
        template: "%s | Inspira AI",
    },
    description: "Reinventing how people go from inspiration to reality in home furnishing using agentic AI.",
    keywords: ["AI", "Home Furnishing", "Product Search", "Image Search", "Inspira AI"],
    authors: [{ name: "Inspira AI Team" }],
    icons: {
        icon: "/logo.png",
        apple: "/logo.png",
    },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={cn(
                "min-h-screen bg-background font-sans antialiased selection:bg-primary/20",
                inter.variable,
                outfit.variable
            )}>
                <main className="relative flex min-h-screen flex-col">
                    {children}
                </main>
            </body>
        </html>
    );
}
