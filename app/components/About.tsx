"use client";

import { motion } from "framer-motion";
import { usePortfolioData } from "@/app/context/PortfolioContext";

export default function About() {
    const { data } = usePortfolioData();
    const { bio, skills, languages } = data.about;
    const education = data.education;

    return (
        <section className="relative w-full bg-[#121212] py-20 px-6 md:px-12 text-white z-10">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">

                {/* Left Column: Bio */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight text-white/90">
                        About Me
                    </h2>
                    <div className="space-y-6">
                        {bio.map((paragraph, idx) => (
                            <p key={idx} className="text-lg text-gray-400 leading-relaxed">
                                {paragraph}
                            </p>
                        ))}
                    </div>

                    <div className="mt-12">
                        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-500 rounded-full inline-block"></span>
                            Skills
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {skills.map((skill, i) => (
                                <span
                                    key={i}
                                    className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm font-semibold text-purple-200 hover:border-purple-500 hover:bg-purple-500/20 transition-all cursor-default shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="mt-12">
                        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                            Languages
                        </h3>
                        <ul className="text-gray-400 space-y-2">
                            {languages.map((lang, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    {lang}
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.div>

                {/* Right Column: Education */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    viewport={{ once: true }}
                >
                    <h3 className="text-3xl font-bold mb-8 text-white/90 border-b border-white/10 pb-4">
                        Education
                    </h3>
                    <div className="space-y-10">
                        {education.map((edu) => (
                            <div key={edu.id} className="group">
                                <div className="flex justify-between items-baseline mb-2">
                                    <h4 className="text-xl font-semibold text-white group-hover:text-purple-400 transition-colors">
                                        {edu.institution}
                                    </h4>
                                    <span className="text-sm text-gray-500 font-mono whitespace-nowrap ml-4">
                                        {edu.year}
                                    </span>
                                </div>
                                <p className="text-lg text-gray-300 font-medium">{edu.degree}</p>
                                {edu.grade && (
                                    <p className="text-sm text-gray-500 mt-1 inline-block border border-white/10 px-2 py-0.5 rounded">
                                        {edu.grade}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>

            </div>
        </section>
    );
}
