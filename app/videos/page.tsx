"use client";

import { VideoGrid } from "@/components/ui/video-grid";
import { motion } from "framer-motion";
import Link from "next/link";

export default function VideosPage() {
    return (
        <main className="min-h-screen bg-neutral-950 pt-32 pb-20">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="px-4 md:px-20 mb-20 flex flex-col items-start gap-4"
            >
                <Link
                    href="/"
                    className="group flex items-center gap-3 px-4 py-2 mb-8 rounded-full bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/20 active:scale-95"
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
                        Home
                    </span>
                </Link>

                <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter leading-none">
                    Cinematography <br />
                    <span className="text-white/20 italic">Section</span>
                </h1>
                <p className="max-w-2xl text-lg md:text-xl text-white/40 tracking-tight leading-relaxed">
                    A collection of visual stories, commercial projects, and experimental cinematography captured across the globe.
                </p>
            </motion.div>

            {/* Video Grid */}
            <VideoGrid />
        </main>
    );
}
