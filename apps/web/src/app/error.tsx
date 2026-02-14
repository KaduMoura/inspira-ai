'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">Algo deu errado!</h2>
            <p className="mb-8 text-muted-foreground">
                Ocorreu um erro inesperado. Estamos trabalhando para corrigi-lo.
            </p>
            <button
                onClick={() => reset()}
                className="rounded-md bg-primary px-6 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
            >
                Tentar novamente
            </button>
        </div>
    );
}
