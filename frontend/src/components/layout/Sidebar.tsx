"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, PieChart, Wallet, Brain, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Analytics", href: "/analytics", icon: PieChart },
  { name: "Budgets", href: "/budgets", icon: Wallet },
  { name: "AI Insights", href: "/insights", icon: Brain },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-border glass-card bg-card">
      <div className="flex h-16 items-center justify-between px-6 border-b border-border">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          AI Finance
        </h1>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onClose && onClose()}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
