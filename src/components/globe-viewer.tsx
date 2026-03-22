"use client";

import { useRef, useEffect, memo } from "react";
import createGlobe from "cobe";
import { type Region, generateArcs } from "@/data/regions";

interface GlobeViewerProps {
  regions: Region[];
  focusRegionId?: string | null;
  className?: string;
  dark?: boolean;
}

export const GlobeViewer = memo(function GlobeViewer({ regions, focusRegionId, className, dark = true }: GlobeViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);
  const phiRef = useRef(0);
  const targetPhiRef = useRef<number | null>(null);
  const pointerInteracting = useRef(false);
  const pointerStartPhi = useRef(0);
  const rafRef = useRef<number>(0);
  const widthRef = useRef(0);
  const regionsRef = useRef(regions);
  regionsRef.current = regions;
  const arcsRef = useRef(generateArcs(regions));
  arcsRef.current = generateArcs(regions);

  // Focus on a region — only updates the target phi ref, no globe recreation
  useEffect(() => {
    if (!focusRegionId) return;
    const region = regions.find((r) => r.id === focusRegionId);
    if (region) {
      const lon = region.coordinates[1];
      targetPhiRef.current = (-lon * Math.PI) / 180 + Math.PI;
    }
  }, [focusRegionId, regions]);

  // Initialize globe — only runs when regions array reference changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const arcs = generateArcs(regions);
    widthRef.current = canvas.offsetWidth;

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

    const globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio : 1),
      width: widthRef.current * 2,
      height: widthRef.current * 2,
      phi: phiRef.current,
      theta: 0.15,
      dark: config.dark,
      diffuse: config.diffuse,
      mapSamples: 20000,
      mapBrightness: config.mapBrightness,
      mapBaseBrightness: config.mapBaseBrightness,
      baseColor: config.baseColor,
      markerColor: config.markerColor,
      glowColor: config.glowColor,
      markers: regions.map((r) => ({
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

    // Throttled resize check — only read offsetWidth every 60 frames
    let frameCount = 0;

    function animate() {
      if (!pointerInteracting.current) {
        if (targetPhiRef.current !== null) {
          const diff = targetPhiRef.current - phiRef.current;
          const normalizedDiff =
            ((diff + Math.PI) % (2 * Math.PI)) - Math.PI;
          phiRef.current += normalizedDiff * 0.08;
          if (Math.abs(normalizedDiff) < 0.01) {
            targetPhiRef.current = null;
          }
        } else {
          phiRef.current += 0.003;
        }
      }

      // Only check for resize every 60 frames (~1s at 60fps)
      frameCount++;
      if (frameCount % 60 === 0) {
        const newWidth = canvas!.offsetWidth;
        if (newWidth !== widthRef.current) {
          widthRef.current = newWidth;
        }
      }

      globe.update({
        phi: phiRef.current,
        width: widthRef.current * 2,
        height: widthRef.current * 2,
        markers: regionsRef.current.map((r) => ({
          location: r.coordinates,
          size: 0.08,
          color: r.color,
          id: r.id,
        })),
        arcs: arcsRef.current.map((arc) => ({
          from: arc.from,
          to: arc.to,
        })),
      });

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      } else {
        if (!rafRef.current) {
          rafRef.current = requestAnimationFrame(animate);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      globe.destroy();
    };
  }, [dark]);

  return (
    <div className={`relative aspect-square ${className ?? ""}`}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Interactive 3D globe showing teammate locations"
        data-testid="globe-canvas"
        className="h-full w-full cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => {
          pointerInteracting.current = true;
          pointerStartPhi.current =
            e.clientX / (canvasRef.current?.offsetWidth ?? 1);
        }}
        onPointerUp={() => {
          pointerInteracting.current = false;
        }}
        onPointerOut={() => {
          pointerInteracting.current = false;
        }}
        onPointerMove={(e) => {
          if (pointerInteracting.current) {
            const currentX =
              e.clientX / (canvasRef.current?.offsetWidth ?? 1);
            const delta = currentX - pointerStartPhi.current;
            phiRef.current += delta * 2;
            pointerStartPhi.current = currentX;
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteracting.current && e.touches[0]) {
            const currentX =
              e.touches[0].clientX /
              (canvasRef.current?.offsetWidth ?? 1);
            const delta = currentX - pointerStartPhi.current;
            phiRef.current += delta * 2;
            pointerStartPhi.current = currentX;
          }
        }}
      />
      {/* Region labels anchored to markers via CSS Anchor Positioning */}
      {regions.map((region) => (
        <div
          key={region.id}
          className="pointer-events-none absolute text-xs font-medium whitespace-nowrap
                     rounded-md bg-black/70 px-2 py-1 text-white backdrop-blur-sm
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
