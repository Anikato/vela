'use client';

import { useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';

function hslToHex(hslStr: string): string {
  const parts = hslStr.trim().split(/[\s,/]+/).map(parseFloat);
  const h = (parts[0] ?? 0) / 360;
  const s = (parts[1] ?? 0) / 100;
  const l = (parts[2] ?? 0) / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 0%';

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return `0 0% ${Math.round(l * 100)}%`;
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

export function ColorInput({ label, value, onChange }: ColorInputProps) {
  const pickerRef = useRef<HTMLInputElement>(null);

  const hexValue = hslToHex(value);

  const handlePickerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(hexToHsl(e.target.value));
    },
    [onChange],
  );

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded border border-border"
        style={{ backgroundColor: hexValue }}
        onClick={() => pickerRef.current?.click()}
      >
        <input
          ref={pickerRef}
          type="color"
          value={hexValue}
          onChange={handlePickerChange}
          className="absolute inset-0 cursor-pointer opacity-0"
          tabIndex={-1}
        />
      </button>
      <div className="min-w-0 flex-1">
        <label className="block text-xs text-muted-foreground">{label}</label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 text-xs font-mono"
          placeholder="H S% L%"
        />
      </div>
    </div>
  );
}
