"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { usePortfolioData } from "@/app/context/PortfolioContext";
import { AwardCertificateItem } from "@/app/data/portfolioData";
import { getBasePath } from "@/app/utils/basePath";

type FilterCategory = "All" | "Award" | "Certificate" | "Honor" | "Badge";

export default function Certificates() {
    const { data } = usePortfolioData();
    const certificates = data.certificates || [];
    const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("All");
    const [selectedCert, setSelectedCert] = useState<AwardCertificateItem | null>(null);
    const [basePath, setBasePath] = useState("");

    useEffect(() => {
        setBasePath(getBasePath());
    }, []);

    const formatImageUrl = (img?: string) => {
        if (!img) return "";
        if (img.startsWith("data:") || img.startsWith("http://") || img.startsWith("https://")) {
            return img;
        }
        if (img.startsWith("/")) {
            return `${basePath}${img}`;
        }
        return `${basePath}/${img}`;
    };

    const categories: FilterCategory[] = ["All", "Award", "Certificate", "Honor", "Badge"];

    const filteredCertificates = certificates.filter((cert) => {
        if (selectedCategory === "All") return true;
        return cert.category === selectedCategory;
    });

    const getCategoryBadgeStyle = (category: string) => {
        switch (category) {
            case "Award":
                return "bg-amber-500/10 text-amber-300 border-amber-500/30";
            case "Honor":
                return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
            case "Badge":
                return "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";
            case "Certificate":
            default:
                return "bg-purple-500/10 text-purple-300 border-purple-500/30";
        }
    };

    if (certificates.length === 0) {
        return null;
    }

    return (
        <section id="certificates" className="relative min-h-screen w-full bg-[#121212] py-32 px-6 md:px-12 flex flex-col items-center z-10 border-t border-white/5">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 blur-[140px] pointer-events-none rounded-full" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="text-center mb-16 max-w-3xl"
            >
                <span className="text-xs uppercase tracking-widest text-purple-400 font-semibold mb-3 block">
                    Recognitions & Credentials
                </span>
                <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter mb-4">
                    Awards & Certificates
                </h2>
                <p className="text-gray-400 text-base md:text-lg">
                    Honors, academic achievements, leadership recognitions, and professional certifications.
                </p>
            </motion.div>

            {/* Category Filter Pills */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="flex flex-wrap justify-center gap-2 md:gap-3 mb-16 z-10"
            >
                {categories.map((cat) => {
                    const count = cat === "All" ? certificates.length : certificates.filter((c) => c.category === cat).length;
                    if (count === 0 && cat !== "All") return null;

                    const isActive = selectedCategory === cat;
                    return (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-5 py-2.5 rounded-full text-xs md:text-sm font-medium transition-all duration-300 cursor-pointer flex items-center gap-2 border ${
                                isActive
                                    ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/25 scale-105"
                                    : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20"
                            }`}
                        >
                            <span>{cat}</span>
                            <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    isActive ? "bg-white/20 text-white" : "bg-white/10 text-gray-400"
                                }`}
                            >
                                {count}
                            </span>
                        </button>
                    );
                })}
            </motion.div>

            {/* Certificates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl z-10">
                <AnimatePresence mode="popLayout">
                    {filteredCertificates.map((cert) => (
                        <motion.div
                            key={cert.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4 }}
                            className="group relative bg-[#18181b]/80 border border-white/10 hover:border-purple-500/40 rounded-2xl overflow-hidden backdrop-blur-md flex flex-col justify-between transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-purple-950/40"
                        >
                            {/* Card Top: Image or Icon Placeholder */}
                            <div
                                onClick={() => setSelectedCert(cert)}
                                className="relative h-48 w-full bg-gradient-to-br from-purple-950/40 via-zinc-900 to-black overflow-hidden cursor-pointer flex items-center justify-center border-b border-white/5"
                            >
                                {cert.image ? (
                                    <img
                                        src={formatImageUrl(cert.image)}
                                        alt={cert.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-6 text-center group-hover:scale-105 transition-transform duration-500">
                                        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3 group-hover:bg-purple-500/20 transition-colors">
                                            {cert.category === "Award" || cert.category === "Honor" ? (
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15l-2 5l9-11h-5l2-5l-9 11h5z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
                                            {cert.issuer}
                                        </span>
                                    </div>
                                )}

                                {/* Overlay Hover Effect */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-white bg-purple-600/90 px-4 py-2 rounded-full shadow-lg border border-purple-400/30">
                                        View Details
                                    </span>
                                </div>

                                {/* Category Badge */}
                                <div className="absolute top-3 left-3 z-10">
                                    <span
                                        className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full border backdrop-blur-md shadow-sm ${getCategoryBadgeStyle(
                                            cert.category
                                        )}`}
                                    >
                                        {cert.category}
                                    </span>
                                </div>

                                {/* Date Badge */}
                                {cert.date && (
                                    <div className="absolute top-3 right-3 z-10">
                                        <span className="text-[11px] font-medium text-gray-300 bg-black/60 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md">
                                            {cert.date}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Card Bottom: Content */}
                            <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                                <div className="space-y-2">
                                    <h3
                                        onClick={() => setSelectedCert(cert)}
                                        className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors cursor-pointer line-clamp-2"
                                    >
                                        {cert.title}
                                    </h3>
                                    <p className="text-xs font-semibold text-purple-400/90 tracking-wide uppercase">
                                        Issued by {cert.issuer}
                                    </p>
                                    {cert.description && (
                                        <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">
                                            {cert.description}
                                        </p>
                                    )}
                                </div>

                                {/* Card Actions */}
                                <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                                    <button
                                        onClick={() => setSelectedCert(cert)}
                                        className="text-xs font-semibold text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 group/btn"
                                    >
                                        <span>Preview</span>
                                        <svg className="w-3.5 h-3.5 transform group-hover/btn:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>

                                    {cert.credentialUrl && (
                                        <a
                                            href={cert.credentialUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 border border-purple-500/20 px-3 py-1 rounded-full bg-purple-500/10 hover:bg-purple-500/20"
                                        >
                                            <span>Verify</span>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Lightbox / Details Modal */}
            <AnimatePresence>
                {selectedCert && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedCert(null)}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md p-4 md:p-8 flex items-center justify-center overflow-y-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-3xl bg-[#18181b] border border-white/15 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[90vh]"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedCert(null)}
                                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/10 transition-colors cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Modal Image Header */}
                            {selectedCert.image ? (
                                <div className="relative w-full h-64 md:h-80 bg-black flex items-center justify-center border-b border-white/10 overflow-hidden">
                                    <img
                                        src={formatImageUrl(selectedCert.image)}
                                        alt={selectedCert.title}
                                        className="w-full h-full object-contain max-h-full"
                                    />
                                </div>
                            ) : (
                                <div className="w-full py-12 bg-gradient-to-br from-purple-950/60 to-black border-b border-white/10 flex flex-col items-center justify-center text-center px-6">
                                    <div className="w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs uppercase tracking-widest text-purple-400 font-semibold">
                                        Credential Overview
                                    </span>
                                </div>
                            )}

                            {/* Modal Content Body */}
                            <div className="p-6 md:p-8 space-y-4 overflow-y-auto">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span
                                        className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full border ${getCategoryBadgeStyle(
                                            selectedCert.category
                                        )}`}
                                    >
                                        {selectedCert.category}
                                    </span>
                                    {selectedCert.date && (
                                        <span className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                                            Issued: {selectedCert.date}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-1">
                                        {selectedCert.title}
                                    </h3>
                                    <p className="text-sm font-semibold text-purple-400">
                                        Issued by {selectedCert.issuer}
                                    </p>
                                </div>

                                {selectedCert.description && (
                                    <div className="pt-2 border-t border-white/10">
                                        <h4 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                                            Details & Overview
                                        </h4>
                                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                                            {selectedCert.description}
                                        </p>
                                    </div>
                                )}

                                {/* External verification button */}
                                {selectedCert.credentialUrl && (
                                    <div className="pt-4 border-t border-white/10 flex items-center justify-end">
                                        <a
                                            href={selectedCert.credentialUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs md:text-sm font-semibold rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2"
                                        >
                                            <span>Verify Credential Online</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
