"use client";

import React from "react";
import { usePortfolioData } from "@/app/context/PortfolioContext";

export default function Contact() {
    const { data } = usePortfolioData();
    const { title, subtitle, items } = data.contact;

    return (
        <section className="relative w-full bg-[#121212] py-20 px-6 md:px-12 text-white z-10 border-t border-white/5">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white/90">
                    {title}
                </h2>
                <p className="text-gray-400 mb-12 text-lg max-w-2xl mx-auto leading-relaxed">
                    {subtitle}
                </p>

                <div className="flex flex-wrap justify-center gap-6">
                    {items.map((item) => (
                        <a
                            key={item.id}
                            href={item.url || (item.type === "email" ? `mailto:${item.value}` : item.value)}
                            target={item.type === "link" ? "_blank" : undefined}
                            rel={item.type === "link" ? "noopener noreferrer" : undefined}
                            className="group flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 w-full md:w-auto min-w-[280px]"
                        >
                            <span className="text-sm font-mono text-purple-400 mb-2 uppercase tracking-wider group-hover:text-purple-300 transition-colors">
                                {item.label}
                            </span>
                            <span className="text-xl font-medium text-white break-all">
                                {item.value}
                            </span>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}

