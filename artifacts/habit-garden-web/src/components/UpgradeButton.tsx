import { ArrowUpCircle } from 'lucide-react';
import { Link, useLocation } from 'wouter';

export function UpgradeButton() {
  const [location] = useLocation();

  if (location === '/upgrade' || location.startsWith('/sign-in') || location.startsWith('/sign-up')) {
    return null;
  }

  return (
    <Link href="/upgrade" className="fixed bottom-6 right-6 z-50 flex h-14 items-center gap-3 rounded-full bg-primary pl-5 pr-2 text-sm font-bold text-primary-foreground shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:bottom-8 sm:right-8 group">
      <span className="tracking-wide">Upgrade</span>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20 group-hover:bg-primary-foreground/30 transition">
        <ArrowUpCircle size={22} className="text-primary-foreground" />
      </span>
    </Link>
  );
}
