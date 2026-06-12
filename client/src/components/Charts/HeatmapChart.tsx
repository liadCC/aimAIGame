import React, { useEffect, useRef } from 'react';
import { ClickEvent } from '../../types/game.types';

interface HeatmapChartProps {
  clickEvents: ClickEvent[];
  size?: number;
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({ clickEvents, size = 200 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);

    // Dark background with circles for target reference
    ctx.fillStyle = '#12121A';
    ctx.fillRect(0, 0, size, size);

    // Draw target circle reference
    const centerX = size / 2;
    const centerY = size / 2;
    const targetRadius = size * 0.15;

    ctx.beginPath();
    ctx.arc(centerX, centerY, targetRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(108, 99, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(108, 99, 255, 0.8)';
    ctx.fill();

    // Plot click events relative to target center
    const maxRadius = size * 0.45;
    const scale = maxRadius / 100; // normalize: 100px in game = half the heatmap

    // Build heatmap data
    const heatData: { x: number; y: number; hit: boolean }[] = [];

    for (const event of clickEvents) {
      const dx = event.clickX - event.targetX;
      const dy = event.clickY - event.targetY;
      const plotX = centerX + dx * scale;
      const plotY = centerY + dy * scale;

      if (plotX >= 0 && plotX <= size && plotY >= 0 && plotY <= size) {
        heatData.push({ x: plotX, y: plotY, hit: event.hit });
      }
    }

    // Draw heat blobs for misses
    for (const point of heatData) {
      if (!point.hit) {
        const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 12);
        gradient.addColorStop(0, 'rgba(255, 68, 68, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 68, 68, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 12, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw individual dots
    for (const point of heatData) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = point.hit ? 'rgba(0, 255, 136, 0.8)' : 'rgba(255, 68, 68, 0.8)';
      ctx.fill();
    }

    // Draw crosshair at center
    ctx.strokeStyle = 'rgba(224, 224, 255, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, size);
    ctx.moveTo(0, centerY);
    ctx.lineTo(size, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

  }, [clickEvents, size]);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        className="rounded-lg border border-white/10"
        style={{ width: size, height: size }}
      />
      <div className="flex gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-success inline-block" />
          Hits
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-danger inline-block" />
          Misses
        </span>
      </div>
    </div>
  );
};
