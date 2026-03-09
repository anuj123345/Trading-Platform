"use client";

import React from "react";
import { WebGLShader } from "@/components/ui/web-gl-shader";
import { motion } from "framer-motion";

export default function DemoShaderPage() {
    return (
        <main className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
            {/* The WebGL Shader Background */}
            <div className="absolute inset-0 z-0">
                <WebGLShader
                    color1="#0f172a" // Deep Blue
                    color2="#1e1b4b" // Indigo
                    color3="#312e81" // Dark Indigo
                    speed={0.8}
                />
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 text-center px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                >
                    <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tighter mb-4 drop-shadow-2xl">
                        Liquid Shader
                    </h1>
                    <p className="text-lg md:text-xl text-white/60 font-medium tracking-[0.3em] uppercase">
                        Experience Premium Interactions
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="mt-12"
                >
                    <a
                        href="/"
                        className="px-8 py-3 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-white font-bold tracking-widest uppercase text-xs transition-all hover:bg-white/10 hover:border-white/40 active:scale-95"
                    >
                        Back to Home
                    </a>
                </motion.div>
            </div>

            {/* Decorative Grid Overlay */}
            <div className="absolute inset-0 z-[5] pointer-events-none opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
        </main>
    );
}
