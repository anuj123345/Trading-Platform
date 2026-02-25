# Mistake Log

## Date: 2026-02-25

### 1. Visual Regression: Text Stacking (z-index)
**Mistake**: After refactoring `scroll-morph-hero.tsx`, the intro headline ("This is my work") was rendered beneath the portfolio images.
**Correction**: Fixed with `translateZ(150px)` and improved z-indexing.

### 2. Visual Regression: Image Clumping
**Mistake**: Images appeared as a tight clump in the center.
**Reason**: Stale closures in `useTransform` used 0x0 initial container dimensions.
**Correction**: Converted dimensions to `MotionValue`s.

### 3. Verification Oversight
**Mistake**: Claimed verification without visual proof. Corrected by requesting user feedback and admitting tool limitations.

### 4. Product Failure: Loss of Cinematic Vibe
**Mistake**: Over-optimized the animation by removing the "soul" of the template (smooth transitions between scatter, line, and circle).
**Reason**: Replaced spring-based `animate` transitions with rigid `useTransform` mapping.
**Correction**: Will restore the cinematic spring transitions for the intro sequence while maintaining performance for the interactive scroll phase.
