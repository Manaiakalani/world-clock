"use client";

import { useState, useRef, useCallback, memo } from "react";
import { Region } from "@/data/regions";
import { RegionCard } from "./region-card";
import type { WeatherData } from "@/lib/weather";
import { GripVertical } from "lucide-react";

interface RegionListProps {
  regions: Region[];
  now: Date;
  activeRegionId: string | null;
  onRegionClick: (regionId: string) => void;
  weather?: Record<string, WeatherData>;
  is24h?: boolean;
  localTimezone?: string;
  customOrder?: boolean;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  devMode?: boolean;
}

export const RegionList = memo(function RegionList({
  regions,
  now,
  activeRegionId,
  onRegionClick,
  weather,
  is24h,
  localTimezone,
  customOrder,
  onReorder,
  devMode,
}: RegionListProps) {
  // Use refs for drag indices — state updates are async and won't flush before dragEnd fires
  const dragIndexRef = useRef<number | null>(null);
  const overIndexRef = useRef<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);
  // State only for visual drop indicator
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragIndexRef.current = index;
    dragNodeRef.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    requestAnimationFrame(() => {
      if (dragNodeRef.current) dragNodeRef.current.style.opacity = "0.5";
      setIsDragging(true);
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragNodeRef.current) dragNodeRef.current.style.opacity = "1";
    const from = dragIndexRef.current;
    const to = overIndexRef.current;
    if (from !== null && to !== null && from !== to) {
      onReorder?.(from, to);
    }
    dragIndexRef.current = null;
    overIndexRef.current = null;
    dragNodeRef.current = null;
    setDropTarget(null);
    setIsDragging(false);
  }, [onReorder]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    overIndexRef.current = index;
    setDropTarget(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {regions.map((region, index) => (
        <div
          key={region.id}
          className={`region-card-enter ${
            dropTarget === index && isDragging && dragIndexRef.current !== index
              ? "border-t-2 border-primary/50"
              : ""
          }`}
          style={{ animationDelay: `${index * 40}ms` }}
          draggable={!!customOrder}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={handleDrop}
        >
          <div className={`flex items-center gap-0 ${customOrder ? "group/drag" : ""}`}>
            {customOrder && (
              <div
                className="flex h-full w-5 shrink-0 cursor-grab items-center justify-center text-white/30
                           opacity-0 group-hover/drag:opacity-100 transition-opacity duration-150 active:cursor-grabbing"
                aria-label="Drag to reorder"
              >
                <GripVertical className="h-3.5 w-3.5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <RegionCard
                region={region}
                now={now}
                onClick={() => onRegionClick(region.id)}
                isActive={activeRegionId === region.id}
                weather={weather?.[region.id]}
                is24h={is24h}
                isLocal={region.timezone === localTimezone}
                localTimezone={localTimezone}
                devMode={devMode}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});
