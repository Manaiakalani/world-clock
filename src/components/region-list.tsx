"use client";

import { useState, useRef, useCallback } from "react";
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

export function RegionList({
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
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    dragNodeRef.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = "move";
    // Make the drag image slightly transparent
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = "0.5";
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = "1";
    }
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex && onReorder) {
      onReorder(dragIndex, overIndex);
    }
    setDragIndex(null);
    setOverIndex(null);
    dragNodeRef.current = null;
  }, [dragIndex, overIndex, onReorder]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIndex(index);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {regions.map((region, index) => (
        <div
          key={region.id}
          className={`region-card-enter ${
            overIndex === index && dragIndex !== null && dragIndex !== index
              ? "border-t-2 border-primary/50"
              : ""
          }`}
          style={{ animationDelay: `${index * 40}ms` }}
          draggable={!!customOrder}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, index)}
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
}
