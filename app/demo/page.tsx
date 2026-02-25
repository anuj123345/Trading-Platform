"use client";

import { GLSLHills } from "@/components/ui/glsl-hills";

export default function DemoOne() {
    return (
        <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-black min-h-screen">
            <GLSLHills />
            <div className="space-y-6 pointer-events-none z-10 text-center absolute">
                <h1 className="font-semibold text-5xl md:text-7xl whitespace-pre-wrap text-white">
                    <span className="italic text-4xl md:text-6xl font-thin">Designs That Speak <br /> </span>
                    Louder Than Words
                </h1>
                <p className="text-sm md:text-base text-gray-400">
                    We craft stunning visuals and user-friendly experiences that <br className="hidden md:block" /> help your brand stand out and connect with your audience.
                </p>
            </div>
        </div>
    );
}
