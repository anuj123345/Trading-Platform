"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import config from "@/lib/config.json";

// --- Constants ---
const IMAGES = [
    "/portfolio/21.jpg", "/portfolio/DSC00101 copy.jpg", "/portfolio/DSC00238-Recovered.jpg",
    "/portfolio/DSC01393.jpg", "/portfolio/DSC01875-Recovered .jpg", "/portfolio/DSC03742.jpg",
    "/portfolio/DSC03761 copy.jpg", "/portfolio/DSC03926.jpg", "/portfolio/DSC06756.jpg",
    "/portfolio/DSC06876.jpg", "/portfolio/DSC08253.JPG", "/portfolio/DSC08587.JPG",
    "/portfolio/DSC08813 copy.jpg", "/portfolio/DSC08882 copy.jpg", "/portfolio/DSC_3437 (2).JPG",
    "/portfolio/DSC_3866 copy3.jpg", "/portfolio/DSC_3879 copy.jpg", "/portfolio/IMG20200307125552-Recovered.jpg",
    "/portfolio/chaos.jpg", "/portfolio/e3.jpg", "/portfolio/rupam bhai 1p.jpg", "/portfolio/rupam bhai 2p.jpg",
];

const HorizontalCard = ({ src, index, progress }: { src: string; index: number; progress: any }) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(window.innerWidth < 768);
    }, []);

    const spacing = isMobile ? 320 : 450;
    const xBase = index * spacing;
    const parallax = useTransform(progress, [0, 1], [0, -index * (isMobile ? 50 : 100)]);
    const opacity = useTransform(progress, [0, 0.1, 0.9, 1], [0.3, 1, 1, 0.3]);
    const scale = useTransform(progress, [0, 0.2, 0.8, 1], [0.9, 1, 1, 0.9]);

    return (
        <motion.div
            style={{
                x: parallax,
                opacity,
                scale,
                left: xBase,
            }}
            className="absolute top-1/2 -translate-y-1/2 w-[280px] md:w-[350px] h-[400px] md:h-[500px] shrink-0 pointer-events-auto"
        >
            <div className="group relative w-full h-full overflow-hidden rounded-sm bg-black shadow-2xl transition-all duration-700 hover:ring-1 hover:ring-white/20">
                <img
                    src={src}
                    alt={`p-${index}`}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex flex-col justify-end p-6 md:p-8">
                    <p className="text-[9px] md:text-[10px] font-bold text-white/40 uppercase tracking-[0.4em] mb-2">Portfolio</p>
                    <h3 className="text-lg md:text-xl font-medium text-white tracking-tighter">Cinematic Series {index + 1}</h3>
                </div>
            </div>
        </motion.div>
    );
};

export default function CinematicHero() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(false);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"],
    });

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 40,
        damping: 20,
        restDelta: 0.001
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Animations for the core typography
    const titleOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);
    const titleScale = useTransform(smoothProgress, [0, 0.15], [1, 1.1]);
    const titleBlur = useTransform(smoothProgress, [0, 0.1], ["blur(0px)", "blur(10px)"]);

    // Gallery transformation
    // Calculate precise scroll distance based on total cards
    const [galleryConfig, setGalleryConfig] = useState({ spacing: 450, totalWidth: "80%" });

    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        const spacing = isMobile ? 320 : 450;
        // Total distance to move to see all cards
        const moveDistance = (IMAGES.length - 1) * spacing;
        setGalleryConfig({ spacing, totalWidth: `-${moveDistance}px` });
    }, []);

    const galleryX = useTransform(smoothProgress, [0.1, 1], ["0px", galleryConfig.totalWidth]);

    return (
        <div
            ref={sectionRef}
            className={`relative h-[400vh] bg-[#0A0A0A] text-white selection:bg-white/10 transition-opacity duration-1000 ${isMounted ? 'opacity-100' : 'opacity-0'}`}
        >
            {/* Sticky Container */}
            <div className="sticky top-0 w-full h-screen overflow-hidden">

                {/* 1. INITIAL HEADLINE (Cinematic Intro) */}
                <motion.div
                    style={{ opacity: titleOpacity, scale: titleScale, filter: titleBlur }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/40 backdrop-blur-[2px]"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                        className="text-center"
                    >
                        <h1 className="text-5xl md:text-9xl font-bold tracking-tighter mb-4 leading-none">
                            {config.headline}
                        </h1>
                        <p className="text-xs md:text-sm font-black tracking-[0.5em] text-white/40 uppercase">
                            {config.subheadline}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="absolute bottom-12 flex flex-col items-center gap-4"
                    >
                        <p className="text-[10px] font-bold tracking-[0.4em] uppercase">Scroll to Discover</p>
                        <div className="w-px h-12 bg-gradient-to-b from-white/10 via-white/40 to-transparent" />
                    </motion.div>
                </motion.div>

                {/* 2. MAIN HORIZONTAL GALLERY */}
                <motion.div
                    style={{ x: galleryX }}
                    className="relative w-full h-full flex items-center px-[10vw] md:px-[20vw]"
                >
                    <div className="relative flex items-center">
                        {/* Cards rendering */}
                        {IMAGES.map((src, i) => (
                            <HorizontalCard
                                key={i}
                                src={src}
                                index={i}
                                progress={smoothProgress}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* Grid Overlay for Texture */}
                <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />

                {/* Navigation: Back to Welcome */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="absolute top-8 left-8 z-[100]"
                >
                    <a
                        href="/"
                        className="group flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/20 active:scale-95"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-white/40 transition-transform group-hover:-translate-x-1 group-hover:text-white"
                        >
                            <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
                        </svg>
                        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40 group-hover:text-white transition-colors">
                            Back
                        </span>
                    </a>
                </motion.div>

                {/* Navigation: To Videos */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2, duration: 1 }}
                    className="absolute bottom-8 right-8 z-[100]"
                >
                    <a
                        href="/videos"
                        className="group flex items-center gap-4 px-6 py-3 rounded-full bg-white text-black transition-all duration-500 hover:pr-8 active:scale-95"
                    >
                        <span className="text-[11px] font-black tracking-[0.3em] uppercase">
                            Watch Videos
                        </span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="transition-transform group-hover:translate-x-1"
                        >
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </a>
                </motion.div>
            </div>
        </div>
    );
}
