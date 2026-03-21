"use client";

import { useRef, useEffect, useCallback } from "react";
import createGlobe from "cobe";
import { regions, generateArcs } from "@/data/regions";

interface GlobeViewerProps {
  focusRegionId?: string | null;
  className?: string;
}

export function GlobeViewer({ focusRegionId, className }: GlobeViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);
  const phiRef = useRef(0);
  const targetPhiRef = useRef<number | null>(null);
  const pointerInteracting = useRef(false);
  const pointerStartPhi = useRef(0);
  const rafRef = useRef<number>(0);

  const focusRegion = useCallback(() => {
    if (!focusRegionId) return;
    const region = regions.find((r) => r.id === focusRegionId);
    if (region) {
      const lon = region.coordinates[1];
      const targetPhi = (-lon * Math.PI) / 180 + Math.PI;
      targetPhiRef.current = targetPhi;
    }
  }, [focusRegionId]);

  useEffect(() => {
    focusRegion();
  }, [focusRegion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const arcs = generateArcs(regions);

    let width = canvas.offsetWidth;

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.15,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      mapBaseBrightness: 0.02,
      baseColor: [0.05, 0.05, 0.12],
      markerColor: [0.3, 0.5, 1],
      glowColor: [0.08, 0.1, 0.2],
      markers: regions.map((r) => ({
        location: r.coordinates,
        size: 0.06,
        color: r.color,
        id: r.id,
      })),
      arcs: arcs.map((arc) => ({
        from: arc.from,
        to: arc.to,
      })),
      arcColor: [0.3, 0.5, 1],
      arcWidth: 0.4,
      arcHeight: 0.25,
      scale: 1.05,
    });

    globeRef.current = globe;

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

      width = canvas!.offsetWidth;
      globe.update({
        phi: phiRef.current,
        width: width * 2,
        height: width * 2,
      });

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      globe.destroy();
    };
  }, []);

  return (
    <div className={`relative aspect-square ${className ?? ""}`}>
      <canvas
        ref={canvasRef}
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
          <span className="mr-1">{region.emoji}</span>
          {region.city}
        </div>
      ))}
    </div>
  );
}
