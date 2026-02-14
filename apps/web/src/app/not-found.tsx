import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
            <h2 className="mb-4 text-6xl font-extrabold text-foreground">404</h2>
            <h1 className="mb-4 text-2xl font-bold text-foreground">Página não encontrada</h1>
            <p className="mb-8 text-muted-foreground">
                Desculpe, a página que você está procurando não existe ou foi movida.
            </p>
            <Link
                href="/"
                className="rounded-md bg-primary px-6 py-3 text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 active:scale-95"
            >
                Voltar para o Início
            </Link>
        </div>
    );
}
