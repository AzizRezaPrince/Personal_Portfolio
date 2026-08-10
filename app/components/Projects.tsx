"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { usePortfolioData } from "@/app/context/PortfolioContext";
import { getBasePath } from "@/app/utils/basePath";

export default function Projects() {
    const { data } = usePortfolioData();
    const projects = data.projects;
    const [basePath, setBasePath] = useState("");

    useEffect(() => {
        setBasePath(getBasePath());
    }, []);

    const formatImageUrl = (img: string) => {
        if (!img) return "";
        if (img.startsWith("data:") || img.startsWith("http://") || img.startsWith("https://")) {
            return img;
        }
        if (img.startsWith("/")) {
            return `${basePath}${img}`;
        }
        return `${basePath}/${img}`;
    };

    return (
        <section className="relative min-h-screen w-full bg-[#121212] py-32 px-6 md:px-12 flex flex-col items-center z-10">

            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="text-5xl md:text-7xl font-bold text-white mb-24 tracking-tighter"
            >
                Selected Work
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
                {projects.map((project, index) => {
                    const cardContent = (
                        <>
                            {/* Hover Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />

                            {/* Content */}
                            <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-32 z-20">
                                <div className="flex flex-col gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {project.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="text-xs uppercase tracking-wider text-purple-300 border border-purple-500/20 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <h3 className="text-3xl font-semibold text-white group-hover:text-purple-300 transition-colors">
                                        {project.title}
                                    </h3>
                                    <p className="text-gray-300 text-lg group-hover:text-white transition-colors">
                                        {project.desc}
                                    </p>

                                    {/* Action Links if available */}
                                    {(project.demoUrl || project.githubUrl) && (
                                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10 opacity-90">
                                            {project.demoUrl && (
                                                <span className="text-sm font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1.5 underline underline-offset-4">
                                                    Live Demo →
                                                </span>
                                            )}
                                            {project.githubUrl && (
                                                <span className="text-sm font-medium text-gray-400 hover:text-white flex items-center gap-1.5">
                                                    GitHub →
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Image Thumbnail */}
                            <div className="absolute inset-0 w-full h-full transform group-hover:scale-105 transition-transform duration-700 ease-out">
                                {project.image ? (
                                    <img
                                        src={formatImageUrl(project.image)}
                                        alt={project.title}
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-950/40 to-black/80 flex items-center justify-center text-gray-500">
                                        No Image
                                    </div>
                                )}
                            </div>
                        </>
                    );

                    const targetUrl = project.demoUrl || project.githubUrl;

                    if (targetUrl) {
                        return (
                            <motion.a
                                key={project.id}
                                href={targetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="group relative h-[500px] w-full rounded-3xl overflow-hidden cursor-pointer
                                bg-white/5 backdrop-blur-lg border border-white/10
                                hover:border-purple-500/40 transition-all duration-500
                                hover:shadow-[0_0_50px_rgba(168,85,247,0.15)] block"
                            >
                                {cardContent}
                            </motion.a>
                        );
                    }

                    return (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="group relative h-[500px] w-full rounded-3xl overflow-hidden
                           bg-white/5 backdrop-blur-lg border border-white/10
                           hover:border-purple-500/40 transition-all duration-500
                           hover:shadow-[0_0_50px_rgba(168,85,247,0.15)]"
                        >
                            {cardContent}
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}

