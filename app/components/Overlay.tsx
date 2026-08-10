"use client";

import { motion, useTransform, MotionValue } from "framer-motion";
import { usePortfolioData } from "@/app/context/PortfolioContext";

interface OverlayProps {
    scrollYProgress: MotionValue<number>;
}

export default function Overlay({ scrollYProgress }: OverlayProps) {
    const { data } = usePortfolioData();
    const hero = data.hero;

    // Section 1: Center
    const opacity1 = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
    const y1 = useTransform(scrollYProgress, [0, 0.15], [0, -100]);

    // Section 2: Left aligned (starts appearing around 20%, peaks at 30%, fades out by 45%)
    const opacity2 = useTransform(scrollYProgress, [0.2, 0.3, 0.45], [0, 1, 0]);
    const x2 = useTransform(scrollYProgress, [0.2, 0.45], [-50, 0]);

    // Section 3: Right aligned (starts appearing around 50%, peaks at 60%, fades out by 75%)
    const opacity3 = useTransform(scrollYProgress, [0.5, 0.6, 0.75], [0, 1, 0]);
    const x3 = useTransform(scrollYProgress, [0.5, 0.75], [50, 0]);

    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none z-10 p-10 md:p-20 flex flex-col justify-center">

            {/* Section 1 - Centered */}
            <motion.div
                style={{ opacity: opacity1, y: y1 }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full px-4"
            >
                <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-white mb-6 uppercase">
                    {hero.name}
                </h1>
                <p className="text-lg md:text-2xl text-purple-300 font-light tracking-[0.2em] uppercase">
                    {hero.title}
                </p>
            </motion.div>

            {/* Section 2 - Left Aligned */}
            <motion.div
                style={{ opacity: opacity2, x: x2 }}
                className="absolute top-1/2 left-6 md:left-20 transform -translate-y-1/2 max-w-2xl px-4"
            >
                <h2 className="text-3xl md:text-6xl font-semibold text-white leading-tight">
                    {hero.tagline1Prefix}{" "}
                    <span className="text-purple-400 font-bold">{hero.tagline1Highlight}</span>
                </h2>
            </motion.div>

            {/* Section 3 - Right Aligned */}
            <motion.div
                style={{ opacity: opacity3, x: x3 }}
                className="absolute top-1/2 right-6 md:right-20 transform -translate-y-1/2 max-w-2xl text-right px-4"
            >
                <h2 className="text-3xl md:text-6xl font-semibold text-white leading-tight">
                    {hero.tagline2Prefix} <br />
                    <span className="text-purple-400 font-bold">{hero.tagline2Highlight}</span>
                </h2>
            </motion.div>

        </div>
    );
}

