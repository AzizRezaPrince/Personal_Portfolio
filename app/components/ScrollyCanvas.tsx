"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll, useTransform, useMotionValueEvent, useSpring } from "framer-motion";
import Overlay from "./Overlay";
import { getBasePath } from "@/app/utils/basePath";

export default function ScrollyCanvas() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Check if images are loaded. We use a ref for the images array to avoid re-renders.
    const imagesRef = useRef<HTMLImageElement[]>([]);
    // Track loaded frames to know what we can render
    const loadedFramesRef = useRef<boolean[]>([]);

    const [isLoaded, setIsLoaded] = useState(false);
    const lastFrameIndex = useRef(0);

    // Total frames
    const frameCount = 120;

    // Initialize scroll hook
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    // Smooth out the scroll progress for smoother animation
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // Map scroll progress to frame index
    const frameIndex = useTransform(smoothProgress, [0, 1], [0, frameCount - 1]);

    // Render function
    const render = (index: number) => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let frameIdx = Math.min(
            Math.max(Math.round(index), 0),
            frameCount - 1
        );

        // Fallback: If current frame isn't loaded, find the closest previous loaded frame
        // This ensures we always show SOMETHING even if the network is lagging
        if (!loadedFramesRef.current[frameIdx]) {
            let found = false;
            // Search backwards
            for (let i = frameIdx - 1; i >= 0; i--) {
                if (loadedFramesRef.current[i]) {
                    frameIdx = i;
                    found = true;
                    break;
                }
            }
            // If nothing found backwards (unlikely if frame 0 is forced), search forward just in case
            if (!found) {
                for (let i = frameIdx + 1; i < frameCount; i++) {
                    if (loadedFramesRef.current[i]) {
                        frameIdx = i;
                        found = true;
                        break;
                    }
                }
            }
            // If still nothing, bail (wait for frame 0)
            if (!found) return;
        }

        const img = imagesRef.current[frameIdx];
        if (!img) return;

        const hRatio = canvas.width / img.width;
        const vRatio = canvas.height / img.height;
        const ratio = Math.max(hRatio, vRatio);

        const centerShift_x = (canvas.width - img.width * ratio) / 2;
        const centerShift_y = (canvas.height - img.height * ratio) / 2;

        // Clear only if image has transparency, but these likely don't. 
        // Clearing might cause flickering if we don't draw immediately.
        // ctx.clearRect(0, 0, canvas.width, canvas.height); 

        ctx.drawImage(
            img,
            0,
            0,
            img.width,
            img.height,
            centerShift_x,
            centerShift_y,
            img.width * ratio,
            img.height * ratio
        );
    };

    // Load images
    useEffect(() => {
        // Initialize arrays
        imagesRef.current = new Array(frameCount).fill(null);
        loadedFramesRef.current = new Array(frameCount).fill(false);

        const basePath = getBasePath();

        // Safety timeout: ensure page content is never blocked from rendering
        const fallbackTimer = setTimeout(() => {
            setIsLoaded(true);
        }, 1200);

        const loadImages = async () => {
            for (let i = 0; i < frameCount; i++) {
                const filename = `${basePath}/sequence/img_${i.toString().padStart(3, "0")}.webp`;
                const img = new Image();
                img.src = filename;

                img.onload = () => {
                    imagesRef.current[i] = img;
                    loadedFramesRef.current[i] = true;

                    // If it's the first frame, we are "ready" enough to show the UI
                    if (i === 0) {
                        setIsLoaded(true);
                        // Trigger initial render
                        requestAnimationFrame(() => render(0));
                    }
                };

                // If error, we just leave it null. The render loop will skip it (fallback).
                img.onerror = () => {
                    console.warn(`Failed to load: ${filename}`);
                    if (i === 0) {
                        setIsLoaded(true);
                    }
                };
            }
        };

        loadImages();

        return () => clearTimeout(fallbackTimer);
    }, []);

    // Render loop on scroll changes
    useMotionValueEvent(frameIndex, "change", (latest) => {
        // Only render if we have at least started loading (frame 0 is potentially ready)
        if (!isLoaded) return;
        lastFrameIndex.current = latest;
        requestAnimationFrame(() => render(latest));
    });

    // Resize handler
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
                // Re-render current frame on resize
                if (isLoaded) {
                    render(lastFrameIndex.current);
                }
            }
        };

        window.addEventListener("resize", handleResize);
        handleResize(); // Initial size

        return () => window.removeEventListener("resize", handleResize);
    }, [isLoaded]);

    return (
        <div ref={containerRef} className="relative h-[500vh] w-full bg-[#121212]">
            <div className="sticky top-0 left-0 h-screen w-full overflow-hidden">

                {/* 
                   Optional: Minimal loading state if Frame 0 takes a bit. 
                   Since we set isLoaded=true on Frame 0, this only shows 
                   until the very first image + script is ready.
                */}
                {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center text-white bg-black z-50">
                        <div className="animate-pulse text-xl font-light tracking-widest">INITIALIZING...</div>
                    </div>
                )}

                <canvas
                    ref={canvasRef}
                    className="block w-full h-full object-cover"
                />

                {/* Only show overlay text interacting with scroll once loaded */}
                {isLoaded && <Overlay scrollYProgress={smoothProgress} />}
            </div>
        </div>
    );
}
