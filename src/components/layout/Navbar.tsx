"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Partida", icon: "🎱" },
  { href: "/generar", label: "Generar", icon: "📋" },
  { href: "/validar", label: "Validar", icon: "✓" },
  { href: "/admin", label: "Admin", icon: "⚙️" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <span className="text-lg font-bold tracking-tight text-white sm:text-xl">
            PUCESE <span className="text-indigo-400">Bingo</span>
          </span>
        </Link>
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {links.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "rounded-xl px-3 py-2 text-sm font-medium transition-colors sm:px-4 sm:text-base",
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white",
                ].join(" ")}
              >
                <span className="mr-1">{icon}</span>
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
