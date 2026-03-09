# Mistake Log

| Date | File | Mistake | Impact | Prevention |
|------|------|---------|--------|------------|
| 2026-02-26 | `login-component.tsx` | Missing `"use client"` | Build Error (Next.js) | Always check for hooks (`useState`, `useRouter`, etc.) and ensure directive is present. |
| 2026-02-26 | `trading-dashboard.tsx` | Missing `"use client"` | Build Error (Next.js) | Same as above. Verify file start during creation/edit. |
| 2026-02-26 | `select.tsx` | Missing `"use client"` | Build Error (Radix UI) | Components using external libraries like Radix should be checked for requirement of client directive. |
| 2026-02-26 | `trading-dashboard.tsx` | Hydration Mismatch (`toLocaleTimeString`) | Hydration Error (Next.js) | Avoid rendering dynamic client-side data (time, random numbers) on the server. Use `useEffect` or a mounted state. |
| 2026-03-09 | `components/ui/animated-shader-hero.tsx` | `useRef` missing argument | Vercel Build Error (TypeScript) | Always provide an initial value (e.g., `null`) to `useRef<T>()` in current React/TS environments. |
| 2026-03-09 | `app/api/algo/sync/route.ts` | Inferred Type Mismatch (`null` vs `string`) | Vercel Build Error (TypeScript) | Explicitly type variables that are initialized to `null` but will later hold other values. |
| 2026-03-09 | `app/api/ai/analyze/route.ts` | Incorrect package name (`@google/genai`) | Vercel Build Error (Module not found) | Always cross-check `package.json` for correct package names. Use `@google/generative-ai` for Gemini. |
| 2026-03-09 | `tmp/debug_shoonya.py` | Missing session expiry validation | False positive "Using cached token" | Always check `date` and `user` in session cache before use (Shoonya tokens expire daily). |
| 2026-03-09 | Project Setup | Git/VS Code/Python not in PATH | Unable to push/deploy or launch IDE via UI | Ensure build tools and IDE CLI are in the system environment variables and project ROOT is set. |
