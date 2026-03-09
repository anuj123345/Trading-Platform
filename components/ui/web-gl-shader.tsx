"use client";

import React, { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";

interface WebGLShaderProps {
    className?: string;
    color1?: string;
    color2?: string;
    color3?: string;
    speed?: number;
    mouseSensitivity?: number;
}

/**
 * A premium WebGL Liquid Shader component.
 * Uses Three.js for a high-performance, smooth background effect.
 */
export const WebGLShader: React.FC<WebGLShaderProps> = ({
    className = "",
    color1 = "#4f46e5", // Indigo
    color2 = "#7c3aed", // Violet
    color3 = "#db2777", // Pink
    speed = 1.0,
    mouseSensitivity = 0.5,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Convert hex colors to THREE.Color for the shader
    const colors = useMemo(() => ({
        c1: new THREE.Color(color1),
        c2: new THREE.Color(color2),
        c3: new THREE.Color(color3),
    }), [color1, color2, color3]);

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        const canvas = canvasRef.current;
        const container = containerRef.current;

        // --- Scene Setup ---
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
        });

        // --- Shader Material ---
        const uniforms = {
            u_time: { value: 0 },
            u_resolution: { value: new THREE.Vector2() },
            u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
            u_color1: { value: colors.c1 },
            u_color2: { value: colors.c2 },
            u_color3: { value: colors.c3 },
        };

        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader: `
        varying vec2 v_uv;
        void main() {
          v_uv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;
        uniform vec3 u_color1;
        uniform vec3 u_color2;
        uniform vec3 u_color3;
        varying vec2 v_uv;

        // Visual noise function for organic movement
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.1, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m ;
          m = m*m ;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 a0 = x - floor(x + 0.5);
          vec3 g = a0 * vec3(1.79284291400159) - vec3(0.85373472095314) * h;
          vec3 l = vec3(dot(g.x,x0), dot(g.yz,x12.xz));
          return 130.0 * dot(m, l);
        }

        void main() {
          vec2 st = gl_FragCoord.xy / u_resolution.xy;
          
          // Interaction distortion
          float dist = distance(st, u_mouse);
          float distortion = smoothstep(0.4, 0.0, dist) * 0.2;
          
          float n = snoise(st * 3.0 + u_time * 0.1) * 0.5 + 0.5;
          n += snoise(st * 6.0 - u_time * 0.05) * 0.25;
          
          vec3 color = mix(u_color1, u_color2, n + distortion);
          color = mix(color, u_color3, snoise(st * 2.0 + u_time * 0.03) * 0.5 + 0.5);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // --- Animation & Sizing ---
        const handleResize = () => {
            const { width, height } = container.getBoundingClientRect();
            renderer.setSize(width, height);
            uniforms.u_resolution.value.set(width, height);
        };

        const handleMouseMove = (e: MouseEvent) => {
            const { left, top, width, height } = container.getBoundingClientRect();
            const x = (e.clientX - left) / width;
            const y = 1.0 - (e.clientY - top) / height;

            // Smoothly interpolate mouse position if needed, or set directly
            uniforms.u_mouse.value.set(x, y);
        };

        window.addEventListener("resize", handleResize);
        container.addEventListener("mousemove", handleMouseMove);
        handleResize();

        let id: number;
        const animate = (time: number) => {
            uniforms.u_time.value = time * 0.001 * speed;
            renderer.render(scene, camera);
            id = requestAnimationFrame(animate);
        };
        id = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("resize", handleResize);
            container.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(id);
            renderer.dispose();
            geometry.dispose();
            material.dispose();
        };
    }, [colors, speed]);

    return (
        <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
            <canvas ref={canvasRef} className="block w-full h-full" />
        </div>
    );
};
