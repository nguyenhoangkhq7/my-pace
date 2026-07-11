"use client";

import React, { useState, useEffect, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Input } from "./input";
import { Button } from "./button";
import { Pipette } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

// --- HSL Conversion Utilities ---

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  if (hex.length !== 6) {
    return { h: 0, s: 100, l: 50 }; // fallback
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (r - b) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function isValidHex(hex: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(hex) || /^#[0-9A-F]{3}$/i.test(hex);
}

const PRESETS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
  "#f43f5e", "#6b7280", "#ffffff", "#000000"
];

interface CustomColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  children: React.ReactNode;
}

export function CustomColorPicker({ color, onChange, children }: CustomColorPickerProps) {
  const { t } = useTranslation();
  const [localHex, setLocalHex] = useState(color || "#0ea5e9");
  const [hsl, setHsl] = useState(() => hexToHsl(localHex));
  const [typedHex, setTypedHex] = useState(localHex);
  const [isEyeDropperSupported, setIsEyeDropperSupported] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if browser supports modern EyeDropper API
  useEffect(() => {
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      setIsEyeDropperSupported(true);
    }
  }, []);

  // Sync local color when prop color changes externally
  useEffect(() => {
    if (color) {
      setLocalHex(color);
      setTypedHex(color);
      setHsl(hexToHsl(color));
    }
  }, [color]);

  // Debounced callback to parent onChange (150ms) to prevent performance lags on sliders
  useEffect(() => {
    if (localHex === color) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onChange(localHex);
    }, 150);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [localHex, color, onChange]);

  const handleHslChange = (h: number, s: number, l: number) => {
    setHsl({ h, s, l });
    const hex = hslToHex(h, s, l);
    setLocalHex(hex);
    setTypedHex(hex);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTypedHex(val);
    if (isValidHex(val)) {
      setLocalHex(val);
      setHsl(hexToHsl(val));
    }
  };

  const handleEyeDropperClick = async () => {
    if (typeof window === "undefined" || !("EyeDropper" in window)) return;
    try {
      // @ts-expect-error - EyeDropper is a modern browser API not yet in all standard TS definitions
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      if (result && result.sRGBHex) {
        setLocalHex(result.sRGBHex);
        setTypedHex(result.sRGBHex);
        setHsl(hexToHsl(result.sRGBHex));
      }
    } catch (err) {
      // Safely catch cancellations (Esc key or clicking outside magnifier) without blocking the thread
      console.log("EyeDropper closed or cancelled:", err);
    }
  };

  const handlePresetSelect = (preset: string) => {
    setLocalHex(preset);
    setTypedHex(preset);
    setHsl(hexToHsl(preset));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 bg-popover border border-border text-popover-foreground flex flex-col gap-3 rounded-xl shadow-xl z-[9999]">
        <style dangerouslySetInnerHTML={{__html: `
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #ffffff;
            border: 1.5px solid #000000;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0,0,0,0.6);
            transition: transform 0.1s;
          }
          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.2);
          }
          input[type="range"]::-moz-range-thumb {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #ffffff;
            border: 1.5px solid #000000;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0,0,0,0.6);
            transition: transform 0.1s;
          }
          input[type="range"]::-moz-range-thumb:hover {
            transform: scale(1.2);
          }
        `}} />

        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t.calendar.colorPickerTitle}</div>

        {/* --- Presets Grid --- */}
        <div className="grid grid-cols-5 gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePresetSelect(p)}
              className={cn(
                "w-6 h-6 rounded-md cursor-pointer border border-black/20 hover:scale-105 transition-all duration-150",
                localHex.toLowerCase() === p.toLowerCase() ? "ring-2 ring-foreground scale-105 shadow-md" : "opacity-85 hover:opacity-100"
              )}
              style={{ backgroundColor: p }}
            />
          ))}
        </div>

        {/* --- Sliders --- */}
        <div className="flex flex-col gap-2 pt-1 border-t border-border">
          {/* Hue */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{t.calendar.hue}</span>
              <span>{hsl.h}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              value={hsl.h}
              onChange={(e) => handleHslChange(Number(e.target.value), hsl.s, hsl.l)}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer outline-hidden bg-transparent"
              style={{
                background: "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)"
              }}
            />
          </div>

          {/* Saturation */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{t.calendar.saturation}</span>
              <span>{hsl.s}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={hsl.s}
              onChange={(e) => handleHslChange(hsl.h, Number(e.target.value), hsl.l)}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer outline-hidden bg-transparent"
              style={{
                background: `linear-gradient(to right, hsl(${hsl.h}, 0%, ${hsl.l}%), hsl(${hsl.h}, 100%, ${hsl.l}%))`
              }}
            />
          </div>

          {/* Lightness */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{t.calendar.lightness}</span>
              <span>{hsl.l}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={hsl.l}
              onChange={(e) => handleHslChange(hsl.h, hsl.s, Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer outline-hidden bg-transparent"
              style={{
                background: `linear-gradient(to right, #000000, hsl(${hsl.h}, ${hsl.s}%, 50%), #ffffff)`
              }}
            />
          </div>
        </div>

        {/* --- Custom Hex & Pipette --- */}
        <div className="flex gap-2 items-center pt-2 border-t border-border">
          <div className="flex-1 flex gap-1 items-center bg-card border border-border rounded-lg px-2 py-1">
            <span className="text-[10px] font-semibold text-muted-foreground">HEX</span>
            <input
              type="text"
              value={typedHex}
              onChange={handleHexInputChange}
              maxLength={7}
              className="w-full bg-transparent border-none text-foreground text-xs font-mono outline-hidden focus:ring-0 p-0"
            />
            <div
              className="w-4 h-4 rounded-md border border-white/10 shrink-0"
              style={{ backgroundColor: isValidHex(localHex) ? localHex : "#000000" }}
            />
          </div>

          {isEyeDropperSupported && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleEyeDropperClick}
              className="w-8 h-8 rounded-lg shrink-0 border-border bg-card text-foreground hover:bg-muted hover:text-foreground"
              title={t.calendar.eyedropperTitle}
            >
              <Pipette className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
