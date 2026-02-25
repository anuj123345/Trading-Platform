"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface VideoItem {
    id: string;
    title: string;
    category: string;
    videoUrl: string;
    duration: string;
}

const VIDEOS: VideoItem[] = [
    {
        id: "1",
        title: "Comp Final 2",
        category: "Cinematography",
        videoUrl: "/portfolio-video/Comp%202%20final.mp4",
        duration: "01:24",
    },
    {
        id: "2",
        title: "Diwali Special",
        category: "Cinematography",
        videoUrl: "/portfolio-video/Diwali%20with%20subs%203.mp4",
        duration: "00:45",
    },
    {
        id: "3",
        title: "Clay Narrative",
        category: "Cinematography",
        videoUrl: "/portfolio-video/clay%2012.mp4",
        duration: "02:15",
    },
    {
        id: "4",
        title: "Swosti Project",
        category: "Corporate",
        videoUrl: "/portfolio-video/clay%20swosti%201%20final%202.mp4",
        duration: "03:10",
    },
    {
        id: "5",
        title: "Glow Series",
        category: "Experimental",
        videoUrl: "/portfolio-video/sultanaxroshni%20glow.mp4",
        duration: "01:05",
    },
];

export function VideoGrid() {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 md:px-20 py-20 bg-neutral-950">
            {VIDEOS.map((video, index) => (
                <motion.div
                    key={video.id}
                    className="relative group cursor-pointer overflow-hidden rounded-2xl bg-neutral-900 aspect-video"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.15, duration: 0.8 }}
                    onMouseEnter={() => setHoveredId(video.id)}
                    onMouseLeave={() => setHoveredId(null)}
                >
                    {/* Background Visual (Static Frame) */}
                    <video
                        src={`${video.videoUrl}#t=0.1`}
                        className={cn(
                            "absolute inset-0 w-full h-full object-cover transition-opacity duration-700",
                            hoveredId === video.id ? "opacity-0" : "opacity-40"
                        )}
                        preload="metadata"
                    />

                    {/* Active Preview Visual (Plays on Hover) */}
                    {hoveredId === video.id && (
                        <video
                            src={video.videoUrl}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
                        />
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent opacity-80" />

                    {/* Content */}
                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold px-2 py-1 rounded bg-white/5 border border-white/10">
                                {video.category}
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">
                                {video.duration}
                            </span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter leading-none mb-4">
                            {video.title}
                        </h3>

                        {/* Play Indicator */}
                        <div className="flex items-center gap-4 transition-all duration-500 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="black"
                                    stroke="black"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                            </div>
                            <span className="text-xs uppercase tracking-[0.2em] font-bold text-white">
                                Watch Preview
                            </span>
                        </div>
                    </div>

                    {/* Decorative Border */}
                    <div className="absolute inset-0 border border-white/10 rounded-2xl group-hover:border-white/20 transition-colors pointer-events-none" />
                </motion.div>
            ))}
        </div>
    );
}
