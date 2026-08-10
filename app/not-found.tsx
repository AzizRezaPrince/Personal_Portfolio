"use client";

import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#0d0d11] text-white flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-6xl font-extrabold text-purple-500 mb-4">404</h1>
            <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
            <p className="text-gray-400 max-w-md mb-8">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <div className="flex gap-4">
                <Link
                    href="/"
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                >
                    Back to Home
                </Link>
                <Link
                    href="/admin"
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-medium transition-all"
                >
                    Admin Portal
                </Link>
            </div>
        </div>
    );
}
