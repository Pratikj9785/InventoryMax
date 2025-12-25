"use client";
import Link from 'next/link';
import { LayoutDashboard, Package, Bot } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();

    const isActive = (path) => pathname === path ? "bg-gray-100 text-blue-600" : "text-gray-600 hover:bg-gray-50";

    return (
        <nav className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col">
            <div className="p-6 border-b border-gray-100">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    InventoryMax
                </h1>
            </div>

            <div className="flex-1 py-6 space-y-1">
                <Link href="/" className={`flex items-center gap-3 px-6 py-3 font-medium transition-colors ${isActive('/')}`}>
                    <LayoutDashboard size={20} />
                    Dashboard
                </Link>

                <Link href="/inventory" className={`flex items-center gap-3 px-6 py-3 font-medium transition-colors ${isActive('/inventory')}`}>
                    <Package size={20} />
                    Inventory
                </Link>

                {/* Placeholder for AI Chat trigger if separate page, or just indicator */}
                <div className="mx-6 mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="flex items-center gap-2 text-indigo-700 font-semibold mb-2">
                        <Bot size={18} />
                        AI assistant
                    </div>
                    <p className="text-xs text-indigo-600">
                        Auto-monitoring stocks and trends.
                    </p>
                </div>
            </div>
        </nav>
    );
}
