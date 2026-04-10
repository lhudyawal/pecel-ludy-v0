"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Store,
  Calendar,
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  Menu,
  X,
  FileText,
  BarChart3,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: any;
}

// Define menu items for each role
const adminMenu = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Manajemen Tim", href: "/dashboard/team" },
  { icon: Package, label: "Master Produk", href: "/dashboard/products" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
];

const supervisorMenu = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Tim Sales", href: "/dashboard/team" },
  { icon: CheckSquare, label: "Verifikasi", href: "/dashboard/verification" },
  { icon: BarChart3, label: "Performa", href: "/dashboard/performance" },
];

const salesMenu = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Store, label: "CRM Toko", href: "/dashboard/shops" },
  { icon: Calendar, label: "Rencana Kunjungan", href: "/dashboard/visits" },
  { icon: ShoppingCart, label: "Transaksi", href: "/dashboard/transactions" },
  { icon: FileText, label: "Laporan Harian", href: "/dashboard/daily-report" },
  { icon: DollarSign, label: "Gaji & Target", href: "/dashboard/salary" },
];

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user: clerkUser } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = user.role === "admin" ? adminMenu : user.role === "supervisor" ? supervisorMenu : salesMenu;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen transition-transform bg-card border-r border-border",
          sidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full md:w-16 md:translate-x-0"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌶️</span>
                <div>
                  <h1 className="text-lg font-bold text-orange-600">PECEL LUDY</h1>
                  <p className="text-xs text-muted-foreground">Sistem Penjualan</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-accent"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* User Info */}
          {sidebarOpen && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <UserButton />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-orange-50 text-orange-600 font-medium dark:bg-orange-900/20 dark:text-orange-400"
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn("transition-all", sidebarOpen ? "md:ml-64" : "md:ml-16")}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-accent md:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <ThemeToggle />
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
