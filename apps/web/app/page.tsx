import { formatCurrency } from '@settl/utils';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-surface">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-sans text-center lg:flex flex-col gap-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-brand-light lg:text-5xl animate-count-up">
          Settl Monorepo
        </h1>
        <p className="text-xl text-neutral-400 max-w-[600px] mx-auto">
          Scaffold initialized successfully. Shared calculation utils resolve correctly:
        </p>
        <div className="p-4 rounded-xl border border-white/10 bg-surface-elevated text-emerald-400">
          Sample Output: {formatCurrency(499, 'INR')}
        </div>
      </div>
    </main>
  );
}
