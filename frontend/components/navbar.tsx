"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, Map, TrendingDown, AlertTriangle, Activity, Info, BarChart2, FlaskConical } from "lucide-react";

const NAV = [
  { href: "/",          label: "Dashboard", icon: BarChart2 },
  { href: "/map",       label: "Map",       icon: Map },
  { href: "/changes",   label: "Changes",   icon: TrendingDown },
  { href: "/risk",      label: "Risk",      icon: AlertTriangle },
  { href: "/analytics", label: "Analytics", icon: FlaskConical },
  { href: "/predict",   label: "Predict",   icon: Activity },
  { href: "/model",     label: "Model",     icon: Info },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="bg-accent-light p-1.5 rounded-lg">
            <Leaf className="w-5 h-5 text-accent" />
          </span>
          <span className="text-base">Mangrove Monitor</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent-light text-accent"
                    : "text-muted hover:text-foreground hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Region badge */}
        <span className="hidden lg:flex items-center gap-1.5 text-xs text-muted bg-gray-50 border border-border px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-accent inline-block" />
          Vasai–Konkan Coast
        </span>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden overflow-x-auto border-t border-border">
        <div className="flex px-2 py-1 gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  active ? "bg-accent-light text-accent" : "text-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
