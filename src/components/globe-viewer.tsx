"use client";

import { useRef, useEffect, memo } from "react";
import type { Globe } from "cobe";
import { type Region, generateArcs } from "@/data/regions";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

interface GlobeViewerProps {
  regions: Region[];
  focusRegionId?: string | null;
  className?: string;
  dark?: boolean;
}

/**
 * One full revolution every 90 seconds — roughly a third of the old speed.
 * The previous loop advanced phi by a fixed amount per *frame*, so the globe
 * also span twice as fast on a 120 Hz display as on a 60 Hz one. Driving it
 * from elapsed time makes the pace identical everywhere.
 */
const AUTO_ROTATE_RAD_PER_MS = (2 * Math.PI) / 90_000;
/** Exponential approach toward a focused city, per millisecond. */
const FOCUS_EASE_PER_MS = 0.005;
/** Close enough to the focused city to hand control back to the drift. */
const FOCUS_SETTLE_RAD = 0.01;
/** How long the drift takes to fade out when grabbed, and back in when released. */
const SPIN_FADE_MS = 700;
/** A dropped frame must not teleport the globe. */
const MAX_FRAME_MS = 64;
/** Dragging across the full width of the canvas turns the globe this far. */
const DRAG_RAD_PER_WIDTH = 2;
/**
 * A release only throws the globe if the pointer was still moving this
 * recently — pushing it somewhere and pausing before letting go should leave
 * it where you put it.
 */
const FLING_SAMPLE_GAP_MS = 90;
/** Weight of the newest sample in the running velocity estimate. */
const FLING_SMOOTHING = 0.4;
/** Ceiling on release speed, so a violent flick can't smear the globe. */
const FLING_MAX_RAD_PER_MS = 0.01;
/** Friction — a glide sheds 1/e of its speed every this many milliseconds. */
const FLING_DECAY_MS = 500;
/**
 * Idle drift is a 90s revolution. 30fps is indistinguishable from 60 there,
 * and it halves the fill rate while the globe is just sitting.
 */
const IDLE_FRAME_MS = 1000 / 30;

function markerKey(list: { id: string; color: [number, number, number] }[]): string {
  let key = "";
  for (const region of list) {
    key += region.id;
    key += region.color[0];
    key += region.color[1];
    key += region.color[2];
    key += ";";
  }
  return key;
}

export const GlobeViewer = memo(function GlobeViewer({ regions, focusRegionId, className, dark = true }: GlobeViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<Globe | null>(null);
  const phiRef = useRef(0);
  const targetPhiRef = useRef<number | null>(null);
  const pointerInteracting = useRef(false);
  const pointerHovering = useRef(false);
  /** 0 = drift stopped, 1 = drift at full speed. Ramped, never snapped. */
  const spinRef = useRef(0);
  const pointerStartPhi = useRef(0);
  /** Running estimate of drag speed (rad/ms) while the pointer is down. */
  const dragVelocityRef = useRef(0);
  const lastDragAt = useRef(0);
  /** Speed the globe was thrown at, bled off by friction after release. */
  const flingRef = useRef(0);
  const rafRef = useRef<number>(0);
  const widthRef = useRef(0);
  const regionsRef = useRef(regions);
  regionsRef.current = regions;
  const arcsRef = useRef(generateArcs(regions));
  arcsRef.current = generateArcs(regions);
  // Read through a ref so toggling the OS setting doesn't tear down and rebuild
  // the globe — the animation loop just stops advancing phi on its own.
  const reducedMotion = usePrefersReducedMotion();
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  // Focus on a region — only updates the target phi ref, no globe recreation
  useEffect(() => {
    if (!focusRegionId) return;
    const region = regions.find((r) => r.id === focusRegionId);
    if (region) {
      const lon = region.coordinates[1];
      targetPhiRef.current = (-lon * Math.PI) / 180 + Math.PI;
      // A pending glide would fight the trip to the city.
      flingRef.current = 0;
    }
  }, [focusRegionId, regions]);

  // Recreate only when the theme changes. Marker colours stream in through refs.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let booting = false;
    let globe: Globe | null = null;
    let handleVisibility: (() => void) | null = null;
    let resizeObserver: ResizeObserver | null = null;

    // Theme-aware globe palette
    const config = dark
      ? {
          dark: 1 as const,
          baseColor: [0.15, 0.15, 0.3] as [number, number, number],
          glowColor: [0.15, 0.2, 0.4] as [number, number, number],
          markerColor: [0.6, 0.9, 1] as [number, number, number],
          arcColor: [0.5, 0.8, 1] as [number, number, number],
          diffuse: 2,
          mapBrightness: 8,
          mapBaseBrightness: 0.02,
        }
      : {
          dark: 0 as const,
          baseColor: [0.95, 0.93, 0.88] as [number, number, number],
          glowColor: [0.85, 0.87, 0.92] as [number, number, number],
          markerColor: [0.1, 0.5, 0.8] as [number, number, number],
          arcColor: [0.2, 0.5, 0.85] as [number, number, number],
          diffuse: 3,
          mapBrightness: 4,
          mapBaseBrightness: 0.1,
        };

    // COBE sets canvas.width = width * devicePixelRatio on every update that
    // includes width. Passing CSS*2 here used to stack on top of that dpr and
    // reallocate a 4× buffer every frame. Width is CSS pixels; dpr is separate.
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);

    const boot = () => {
      if (cancelled || globe || booting) return;
      const css = canvas.offsetWidth;
      if (css < 2) return;
      booting = true;
      widthRef.current = css;

      const initialRegions = regionsRef.current;
      const arcs = generateArcs(initialRegions);

      import("cobe").then(({ default: createGlobe }) => {
        if (cancelled) return;

        globe = createGlobe(canvas, {
          devicePixelRatio: pixelRatio,
          width: css,
          height: css,
          phi: phiRef.current,
          theta: 0.15,
          dark: config.dark,
          diffuse: config.diffuse,
          mapSamples: css < 480 ? 12000 : 20000,
          mapBrightness: config.mapBrightness,
          mapBaseBrightness: config.mapBaseBrightness,
          baseColor: config.baseColor,
          markerColor: config.markerColor,
          glowColor: config.glowColor,
          markers: initialRegions.map((r) => ({
            location: r.coordinates,
            size: 0.08,
            color: r.color,
            id: r.id,
          })),
          arcs: arcs.map((arc) => ({
            from: arc.from,
            to: arc.to,
          })),
          arcColor: config.arcColor,
          arcWidth: 0.4,
          arcHeight: 0.3,
          scale: 1.05,
          opacity: 1,
        });

        globeRef.current = globe;

        let lastFrame = 0;
        let lastDraw = 0;
        let appliedCss = css;
        let appliedKey = markerKey(initialRegions);

        function animate(now: number) {
          // First frame after a start or a resume has no meaningful delta.
          const dt = lastFrame ? Math.min(now - lastFrame, MAX_FRAME_MS) : 0;
          lastFrame = now;

          // Hold the drift while the globe is being read, dragged or still
          // gliding, and ease it back afterwards, so it never starts or stops
          // with a jolt. It also ramps up from a standstill on first paint.
          const gliding = Math.abs(flingRef.current) > AUTO_ROTATE_RAD_PER_MS;
          const held =
            pointerInteracting.current ||
            pointerHovering.current ||
            reducedMotionRef.current ||
            gliding;
          const targetSpin = held ? 0 : 1;
          const spinStep = dt / SPIN_FADE_MS;
          spinRef.current =
            targetSpin > spinRef.current
              ? Math.min(targetSpin, spinRef.current + spinStep)
              : Math.max(targetSpin, spinRef.current - spinStep);

          if (!pointerInteracting.current) {
            if (targetPhiRef.current !== null) {
              const diff = targetPhiRef.current - phiRef.current;
              const normalizedDiff =
                ((diff + Math.PI) % (2 * Math.PI)) - Math.PI;
              if (reducedMotionRef.current) {
                // Jump straight to the target instead of easing toward it.
                phiRef.current = targetPhiRef.current;
                targetPhiRef.current = null;
              } else {
                phiRef.current += normalizedDiff * (1 - Math.exp(-FOCUS_EASE_PER_MS * dt));
                if (Math.abs(normalizedDiff) < FOCUS_SETTLE_RAD) {
                  targetPhiRef.current = null;
                }
              }
            } else {
              // Carry the throw, then let friction bleed it off. Once it has
              // decayed to about drift speed the ramp above fades the ambient
              // rotation back in, so the glide lands in the idle spin rather
              // than stopping dead.
              if (flingRef.current !== 0) {
                phiRef.current += flingRef.current * dt;
                flingRef.current *= Math.exp(-dt / FLING_DECAY_MS);
                if (Math.abs(flingRef.current) < AUTO_ROTATE_RAD_PER_MS * 0.5) {
                  flingRef.current = 0;
                }
              }
              phiRef.current += AUTO_ROTATE_RAD_PER_MS * dt * spinRef.current;
            }
          }

          const lively =
            pointerInteracting.current ||
            targetPhiRef.current !== null ||
            Math.abs(flingRef.current) > AUTO_ROTATE_RAD_PER_MS;
          const viewCss = widthRef.current;
          if (viewCss < 2 || (!lively && now - lastDraw < IDLE_FRAME_MS)) {
            rafRef.current = requestAnimationFrame(animate);
            return;
          }
          lastDraw = now;

          const current = regionsRef.current;
          const key = markerKey(current);
          const patch: {
            phi: number;
            width?: number;
            height?: number;
            markers?: { location: [number, number]; size: number; color: [number, number, number]; id: string }[];
            arcs?: { from: [number, number]; to: [number, number] }[];
          } = { phi: phiRef.current };
          // Only include width when it changed. COBE assigns canvas.width on
          // every update that carries it, which clears the drawing buffer.
          if (viewCss !== appliedCss) {
            appliedCss = viewCss;
            patch.width = viewCss;
            patch.height = viewCss;
          }
          if (key !== appliedKey) {
            appliedKey = key;
            patch.markers = current.map((r) => ({
              location: r.coordinates,
              size: 0.08,
              color: r.color,
              id: r.id,
            }));
            patch.arcs = arcsRef.current.map((arc) => ({
              from: arc.from,
              to: arc.to,
            }));
          }

          globe!.update(patch);
          rafRef.current = requestAnimationFrame(animate);
        }

        rafRef.current = requestAnimationFrame(animate);

        handleVisibility = () => {
          if (document.hidden) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = 0;
          } else if (!rafRef.current) {
            // Drop the stale timestamp so the globe resumes where it stopped
            // rather than jumping forward by the time the tab was away.
            lastFrame = 0;
            rafRef.current = requestAnimationFrame(animate);
          }
        };
        document.addEventListener("visibilitychange", handleVisibility);
      });
    };

    resizeObserver = new ResizeObserver(() => {
      widthRef.current = canvas.offsetWidth;
      if (!globe) boot();
    });
    resizeObserver.observe(canvas);
    boot();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      resizeObserver?.disconnect();
      if (handleVisibility) document.removeEventListener("visibilitychange", handleVisibility);
      if (globe) globe.destroy();
    };
    // Theme is the only reason to rebuild the GL context. Regions update live.
  }, [dark]);

  /**
   * Release the globe. A flick hands its speed to the glide; a slow drag, or
   * one that paused before letting go, hands over nothing and it stays put.
   */
  const endDrag = (throwIt: boolean) => {
    if (!pointerInteracting.current) return;
    pointerInteracting.current = false;

    const restedFor = performance.now() - lastDragAt.current;
    const velocity =
      throwIt && !reducedMotionRef.current && restedFor <= FLING_SAMPLE_GAP_MS
        ? dragVelocityRef.current
        : 0;
    flingRef.current = Math.max(
      -FLING_MAX_RAD_PER_MS,
      Math.min(FLING_MAX_RAD_PER_MS, velocity),
    );
    dragVelocityRef.current = 0;
  };

  return (
    <div className={`relative aspect-square ${className ?? ""}`}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Interactive 3D globe showing teammate locations"
        data-testid="globe-canvas"
        className="h-full w-full cursor-grab active:cursor-grabbing"
        // Horizontal drags belong to the globe; vertical ones still scroll the page.
        style={{ touchAction: "pan-y" }}
        onPointerEnter={() => {
          // Reading a marker shouldn't be a moving target — hovering parks the
          // drift, and it eases back in once the pointer leaves.
          pointerHovering.current = true;
        }}
        onPointerLeave={() => {
          pointerHovering.current = false;
        }}
        onPointerDown={(e) => {
          pointerInteracting.current = true;
          pointerStartPhi.current =
            e.clientX / (canvasRef.current?.offsetWidth ?? 1);
          // Grabbing a gliding globe stops it, the way catching a spun object does.
          flingRef.current = 0;
          dragVelocityRef.current = 0;
          lastDragAt.current = performance.now();
          // Capture so a drag survives leaving the canvas instead of stalling
          // the moment the pointer crosses the edge.
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // Pointer already released — the handlers below still end the drag.
          }
        }}
        onPointerUp={() => endDrag(true)}
        onPointerCancel={() => endDrag(false)}
        onLostPointerCapture={() => endDrag(true)}
        onPointerMove={(e) => {
          if (!pointerInteracting.current) return;
          const currentX = e.clientX / (canvasRef.current?.offsetWidth ?? 1);
          const travelled = (currentX - pointerStartPhi.current) * DRAG_RAD_PER_WIDTH;
          pointerStartPhi.current = currentX;
          phiRef.current += travelled;

          // Track how fast the pointer is actually moving, so the release can
          // tell a flick from a slow reposition.
          const now = performance.now();
          const elapsed = now - lastDragAt.current;
          lastDragAt.current = now;
          if (elapsed > FLING_SAMPLE_GAP_MS) {
            // The pointer was resting; start the estimate over rather than
            // averaging across the pause.
            dragVelocityRef.current = 0;
          } else if (elapsed > 0) {
            dragVelocityRef.current +=
              (travelled / elapsed - dragVelocityRef.current) * FLING_SMOOTHING;
          }
        }}
      />
      {/* Region labels anchored to markers via CSS Anchor Positioning */}
      {regions.map((region) => (
        <div
          key={region.id}
          className="pointer-events-none absolute text-xs font-medium whitespace-nowrap
                     rounded-md bg-black/85 px-2 py-1 text-white
                     transition-opacity duration-300"
          style={{
            positionAnchor: `--cobe-${region.id}` as string,
            bottom: "anchor(top)",
            left: "anchor(center)",
            translate: "-50% 0",
            marginBottom: "8px",
            opacity: `var(--cobe-visible-${region.id}, 0)`,
          }}
        >
          <span className="mr-1">{region.flag}</span>
          {region.city}
        </div>
      ))}
    </div>
  );
});
