"use client";
import { useState, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";

interface Props {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: Props) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const THRESHOLD = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling) return;
      const distance = Math.max(0, e.touches[0].clientY - startY.current);
      setPullDistance(Math.min(distance * 0.5, 100));
    },
    [pulling]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return;
    setPulling(false);
    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(60);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pulling, pullDistance, onRefresh]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      {(pullDistance > 0 || refreshing) && (
        <div
          className="absolute top-0 left-0 right-0 flex justify-center items-center transition-all"
          style={{ height: `${pullDistance}px` }}
        >
          <RefreshCw
            className={`h-5 w-5 text-emerald-500 transition-transform ${
              refreshing ? "animate-spin" : ""
            }`}
            style={{ transform: `rotate(${(pullDistance / THRESHOLD) * 360}deg)` }}
          />
        </div>
      )}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: refreshing ? "transform 0.2s" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
