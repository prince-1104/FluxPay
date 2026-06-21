import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-surface/50">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <span className="text-xl font-bold gradient-text">Settl</span>
            <p className="mt-3 max-w-sm text-sm text-neutral-500">
              The premium way to split group trip expenses, track budgets, and settle up without the awkward conversations.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link href="/login" className="hover:text-white">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li><span>Privacy Policy</span></li>
              <li><span>Terms of Service</span></li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-neutral-600">
          © {new Date().getFullYear()} Settl. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
