"use client";

import { usePortfolioData } from "@/app/context/PortfolioContext";

export default function Experience() {
    const { data } = usePortfolioData();
    const experiences = data.experience;

    return (
        <section className="relative w-full bg-[#121212] py-20 px-6 md:px-12 text-white z-10">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold mb-16 tracking-tight text-white/90 text-center">
                    Work Experience
                </h2>

                <div className="flex flex-col gap-12 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-6 md:left-1/2 top-4 bottom-0 w-0.5 bg-white/10" />

                    {experiences.map((exp, index) => (
                        <div key={exp.id} className="flex flex-col md:flex-row gap-8 relative items-start md:items-center">

                            {/* Dot */}
                            <div className="absolute left-6 md:left-1/2 -translate-x-[5px] top-6 w-3 h-3 bg-purple-500 rounded-full z-10 shadow-[0_0_10px_rgba(168,85,247,0.5)] border-2 border-[#121212]" />

                            {/* Date (Left on Desktop) */}
                            <div className={`md:w-1/2 md:pr-12 md:text-right w-full text-base font-mono text-purple-400 ${index % 2 !== 0 ? "md:order-2 md:pl-12 md:pr-0 md:text-left" : ""
                                }`}>
                                {exp.year}
                            </div>

                            {/* Content Card (Right on Desktop) */}
                            <div className={`md:w-1/2 w-full md:pl-12 ${index % 2 !== 0 ? "md:order-1 md:pr-12 md:pl-0 md:text-right" : ""
                                }`}>
                                <div className="p-6 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all hover:bg-white/10 group">
                                    <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors mb-1">
                                        {exp.role}
                                    </h3>
                                    <h4 className="text-base font-semibold text-gray-400 mb-4 uppercase tracking-wider">
                                        {exp.organization}
                                    </h4>
                                    <p className="text-gray-400 leading-relaxed whitespace-pre-line text-sm">
                                        {exp.description}
                                    </p>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}

