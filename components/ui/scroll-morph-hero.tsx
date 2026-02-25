"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, useTransform, useSpring, useMotionValue, MotionValue } from "framer-motion";
import config from "@/lib/config.json";

// --- Types ---
export type AnimationPhase = "scatter" | "line" | "circle" | "bottom-strip";

interface FlipCardProps {
    src: string;
    index: number;
    total: number;
    phase: AnimationPhase;
    smoothMorph: MotionValue<number>;
    smoothScrollRotate: MotionValue<number>;
    smoothMouseX: MotionValue<number>;
    containerWidth: MotionValue<number>;
    containerHeight: MotionValue<number>;
    scatterPos: { x: number; y: number; rotation: number; scale: number; opacity: number };
}

// Helper for linear interpolation
const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

// --- FlipCard Component ---
const IMG_WIDTH = 100;  // Original Premium Size
const IMG_HEIGHT = 140; // Original Premium Size

function FlipCard({
    src,
    index,
    total,
    phase,
    smoothMorph,
    smoothScrollRotate,
    smoothMouseX,
    containerWidth,
    containerHeight,
    scatterPos,
}: FlipCardProps) {

    // 1. DYNAMIC CALCULATIONS (Reactive to container size)
    // We use a helper to get current values from MotionValues for the initial 'animate' prop
    // but the actual mapping happens inside useTransform for the scroll performance.

    const x = useTransform(
        [smoothMorph, smoothScrollRotate, smoothMouseX, containerWidth, containerHeight],
        ([m, r, p, w, h]: any[]) => {
            if (phase === "scatter") return scatterPos.x;
            if (phase === "line") {
                const lineSpacing = 120;
                const lineTotalWidth = total * lineSpacing;
                return index * lineSpacing - lineTotalWidth / 2;
            }

            // Circle Logic
            const minDimension = Math.min(w, h) || 800;
            const circleRadius = Math.min(minDimension * 0.35, 350);
            const circleAngle = (index / total) * 360;
            const circleRad = (circleAngle * Math.PI) / 180;
            const circleX = Math.cos(circleRad) * circleRadius;

            // Arc Logic (for scroll transformation)
            const isMobile = w < 768;
            const baseRadius = Math.min(w, h * 1.5);
            const arcRadius = baseRadius * (isMobile ? 1.4 : 1.1);
            const spreadAngle = isMobile ? 100 : 130;
            const startAngle = -90 - (spreadAngle / 2);
            const step = spreadAngle / (total - 1);
            const scrollProgress = Math.min(Math.max(r / 360, 0), 1);
            const maxRotation = spreadAngle * 0.8;
            const boundedRotation = -scrollProgress * maxRotation;
            const currentArcAngle = startAngle + (index * step) + boundedRotation;
            const arcRad = (currentArcAngle * Math.PI) / 180;
            const arcX = Math.cos(arcRad) * arcRadius + p;

            return lerp(circleX, arcX, m);
        }
    );

    const y = useTransform(
        [smoothMorph, smoothScrollRotate, containerWidth, containerHeight],
        ([m, r, w, h]: any[]) => {
            if (phase === "scatter") return scatterPos.y;
            if (phase === "line") return 0;

            // Circle Logic
            const minDimension = Math.min(w, h) || 800;
            const circleRadius = Math.min(minDimension * 0.35, 350);
            const circleAngle = (index / total) * 360;
            const circleRad = (circleAngle * Math.PI) / 180;
            const circleY = Math.sin(circleRad) * circleRadius;

            // Arc Logic
            const isMobile = w < 768;
            const arcRadius = Math.min(w, h * 1.5) * (isMobile ? 1.4 : 1.1);
            const arcApexY = h * (isMobile ? 0.35 : 0.25);
            const arcCenterY = arcApexY + arcRadius;
            const spreadAngle = isMobile ? 100 : 130;
            const startAngle = -90 - (spreadAngle / 2);
            const step = spreadAngle / (total - 1);
            const scrollProgress = Math.min(Math.max(r / 360, 0), 1);
            const currentArcAngle = startAngle + (index * step) - (scrollProgress * spreadAngle * 0.8);
            const arcRad = (currentArcAngle * Math.PI) / 180;
            const arcY = Math.sin(arcRad) * arcRadius + arcCenterY;

            return lerp(circleY, arcY, m);
        }
    );

    const rotation = useTransform(
        [smoothMorph, smoothScrollRotate, containerWidth],
        ([m, r, w]: any[]) => {
            if (phase === "scatter") return scatterPos.rotation;
            if (phase === "line") return 0;

            const circleAngle = (index / total) * 360;
            const circleRot = circleAngle + 90;

            const isMobile = w < 768;
            const spreadAngle = isMobile ? 100 : 130;
            const startAngle = -90 - (spreadAngle / 2);
            const step = spreadAngle / (total - 1);
            const scrollProgress = Math.min(Math.max(r / 360, 0), 1);
            const currentArcAngle = startAngle + (index * step) - (scrollProgress * spreadAngle * 0.8);
            const arcRot = currentArcAngle + 90;

            return lerp(circleRot, arcRot, m);
        }
    );

    const scale = useTransform([smoothMorph, containerWidth], ([m, w]: any[]) => {
        if (phase === "scatter") return scatterPos.scale;
        if (phase === "line") return 1;
        const isMobile = w < 768;
        return lerp(1, isMobile ? 1.4 : 1.8, m);
    });

    const opacity = useTransform(smoothMorph, (m) => {
        if (phase === "scatter") return scatterPos.opacity;
        return 1;
    });

    return (
        <motion.div
            style={{
                position: "absolute",
                width: `${IMG_WIDTH}px`,
                height: `${IMG_HEIGHT}px`,
                transformStyle: "preserve-3d",
                perspective: "1000px",
                x,
                y,
                rotate: rotation,
                scale,
                opacity,
                zIndex: 0,
            }}
            // Here is the CINEMATIC SECRET: 
            // While we map values for scroll, the initial 'fly in' transitions 
            // are triggered by the 'phase' change which Framer Motion translates 
            // as a spring-based transition.
            transition={{ type: "spring", stiffness: 45, damping: 15 }}
            className="cursor-pointer group"
        >
            <motion.div
                className="relative h-full w-full shadow-2xl rounded-2xl overflow-hidden"
                style={{ transformStyle: "preserve-3d" }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                whileHover={{ rotateY: 180, scale: 1.05 }}
            >
                <div className="absolute inset-0 h-full w-full" style={{ backfaceVisibility: "hidden" }}>
                    <img src={src} alt={`p-${index}`} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-transparent" />
                </div>

                <div className="absolute inset-0 h-full w-full bg-gray-900 flex flex-col items-center justify-center p-4"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Portfolio</p>
                    <p className="text-xs font-medium text-white">Project {index + 1}</p>
                </div>
            </motion.div>
        </motion.div>
    );
}

// --- Main Hero Component ---
const TOTAL_IMAGES = 22;
const MAX_SCROLL = 3000;

const IMAGES = [
    "/portfolio/21.jpg", "/portfolio/DSC00101 copy.jpg", "/portfolio/DSC00238-Recovered.jpg",
    "/portfolio/DSC01393.jpg", "/portfolio/DSC01875-Recovered .jpg", "/portfolio/DSC03742.jpg",
    "/portfolio/DSC03761 copy.jpg", "/portfolio/DSC03926.jpg", "/portfolio/DSC06756.jpg",
    "/portfolio/DSC06876.jpg", "/portfolio/DSC08253.JPG", "/portfolio/DSC08587.JPG",
    "/portfolio/DSC08813 copy.jpg", "/portfolio/DSC08882 copy.jpg", "/portfolio/DSC_3437 (2).JPG",
    "/portfolio/DSC_3866 copy3.jpg", "/portfolio/DSC_3879 copy.jpg", "/portfolio/IMG20200307125552-Recovered.jpg",
    "/portfolio/chaos.jpg", "/portfolio/e3.jpg", "/portfolio/rupam bhai 1p.jpg", "/portfolio/rupam bhai 2p.jpg",
];

export default function IntroAnimation() {
    const [isMounted, setIsMounted] = useState(false);
    const [introPhase, setIntroPhase] = useState<AnimationPhase>("scatter");
    const containerRef = useRef<HTMLDivElement>(null);
    const containerW = useMotionValue(0);
    const containerH = useMotionValue(0);

    useEffect(() => { setIsMounted(true); }, []);

    useEffect(() => {
        if (!containerRef.current) return;
        const handleResize = () => {
            if (containerRef.current) {
                containerW.set(containerRef.current.offsetWidth);
                containerH.set(containerRef.current.offsetHeight);
            }
        };
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, [containerW, containerH]);

    const virtualScroll = useMotionValue(0);
    const scrollRef = useRef(0);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const newScroll = Math.min(Math.max(scrollRef.current + e.deltaY, 0), MAX_SCROLL);
            scrollRef.current = newScroll;
            virtualScroll.set(newScroll);
        };
        container.addEventListener("wheel", handleWheel, { passive: false });
        return () => container.removeEventListener("wheel", handleWheel);
    }, [virtualScroll]);

    const morphProgress = useTransform(virtualScroll, [0, 600], [0, 1]);
    const smoothMorph = useSpring(morphProgress, { stiffness: 40, damping: 20 });
    const scrollRotate = useTransform(virtualScroll, [600, 3000], [0, 360]);
    const smoothScrollRotate = useSpring(scrollRotate, { stiffness: 40, damping: 20 });
    const mouseX = useMotionValue(0);
    const smoothMouseX = useSpring(mouseX, { stiffness: 30, damping: 20 });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const handleMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            mouseX.set(((e.clientX - rect.left) / rect.width * 2 - 1) * 100);
        };
        container.addEventListener("mousemove", handleMouseMove);
        return () => container.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX]);

    useEffect(() => {
        const timer1 = setTimeout(() => setIntroPhase("line"), 500);
        const timer2 = setTimeout(() => setIntroPhase("circle"), 2500);
        return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }, []);

    const scatterPositions = useMemo(() => {
        return IMAGES.map(() => ({
            x: (Math.random() - 0.5) * 2000,
            y: (Math.random() - 0.5) * 1500,
            rotation: (Math.random() - 0.5) * 360,
            scale: 0.5, opacity: 0,
        }));
    }, []);

    const contentOpacity = useTransform(smoothMorph, [0.8, 1], [0, 1]);
    const contentY = useTransform(smoothMorph, [0.8, 1], [20, 0]);
    const introTextOpacity = useTransform(smoothMorph, [0, 0.4], [1, 0]);

    if (!isMounted) return null;

    return (
        <div ref={containerRef} className="relative w-full h-full bg-[#FAFAFA] overflow-hidden select-none">
            <div className="flex h-full w-full flex-col items-center justify-center perspective-1000">

                {/* Background Cards */}
                <div className="relative flex items-center justify-center w-full h-full">
                    {IMAGES.slice(0, TOTAL_IMAGES).map((src, i) => (
                        <FlipCard
                            key={i} src={src} index={i} total={TOTAL_IMAGES} phase={introPhase}
                            smoothMorph={smoothMorph} smoothScrollRotate={smoothScrollRotate}
                            smoothMouseX={smoothMouseX} containerWidth={containerW}
                            containerHeight={containerH} scatterPos={scatterPositions[i]}
                        />
                    ))}
                </div>

                {/* Headline Overlay */}
                <motion.div
                    style={{
                        opacity: introPhase === "circle" ? introTextOpacity : 0,
                        transform: "translateZ(180px)"
                    }}
                    className="absolute z-50 flex flex-col items-center justify-center text-center pointer-events-none top-1/2 -translate-y-1/2 px-6"
                >
                    <motion.h1
                        initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
                        animate={introPhase === "circle" ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="text-4xl md:text-7xl font-bold tracking-tighter text-gray-900 drop-shadow-sm"
                    >
                        {config.headline}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={introPhase === "circle" ? { opacity: 0.6 } : { opacity: 0 }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="mt-4 text-xs md:text-sm font-black tracking-[0.4em] text-gray-400 uppercase"
                    >
                        {config.subheadline}
                    </motion.p>
                </motion.div>

                {/* Active Content Overlay */}
                <motion.div
                    style={{ opacity: contentOpacity, y: contentY, transform: "translateZ(120px)" }}
                    className="absolute top-[12%] z-50 flex flex-col items-center justify-center text-center pointer-events-none px-4"
                >
                    <h2 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tighter mb-4 italic">
                        The Portfolio
                    </h2>
                    <p className="text-sm md:text-lg text-gray-500 max-w-lg leading-relaxed font-medium">
                        Scroll to explore the curated collection.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
