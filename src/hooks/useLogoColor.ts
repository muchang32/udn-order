import { useState, useEffect } from "react";

/**
 * Extract the dominant color from an image by sampling pixels
 * Returns a color string in HSL format
 */
function extractDominantColor(img: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  
  if (!ctx) return "hsl(0, 0%, 15%)"; // fallback dark gray
  
  // Use a small size for faster processing
  const size = 50;
  canvas.width = size;
  canvas.height = size;
  
  try {
    ctx.drawImage(img, 0, 0, size, size);
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    
    // Color buckets for grouping similar colors
    const colorCounts: Map<string, { r: number; g: number; b: number; count: number }> = new Map();
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // Skip transparent pixels
      if (a < 128) continue;
      
      // Skip very light colors (likely background)
      const brightness = (r + g + b) / 3;
      if (brightness > 240) continue;
      
      // Quantize to reduce color variations (bucket by 32)
      const qr = Math.floor(r / 32) * 32;
      const qg = Math.floor(g / 32) * 32;
      const qb = Math.floor(b / 32) * 32;
      const key = `${qr},${qg},${qb}`;
      
      const existing = colorCounts.get(key);
      if (existing) {
        existing.r += r;
        existing.g += g;
        existing.b += b;
        existing.count++;
      } else {
        colorCounts.set(key, { r, g, b, count: 1 });
      }
    }
    
    // Find the most common color
    let maxCount = 0;
    let dominantColor = { r: 0, g: 0, b: 0, count: 1 };
    
    colorCounts.forEach((color) => {
      if (color.count > maxCount) {
        maxCount = color.count;
        dominantColor = color;
      }
    });
    
    // Average the color
    const avgR = Math.round(dominantColor.r / dominantColor.count);
    const avgG = Math.round(dominantColor.g / dominantColor.count);
    const avgB = Math.round(dominantColor.b / dominantColor.count);
    
    // Convert to HSL
    const hsl = rgbToHsl(avgR, avgG, avgB);
    
    // Return a slightly darker, more saturated version for better card appearance
    const adjustedL = Math.max(15, Math.min(35, hsl.l - 10));
    const adjustedS = Math.min(90, hsl.s + 10);
    
    return `hsl(${hsl.h}, ${adjustedS}%, ${adjustedL}%)`;
  } catch (error) {
    // CORS or other errors
    return "hsl(0, 0%, 15%)";
  }
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
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
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function useLogoColor(logoUrl: string | null | undefined): string {
  const [color, setColor] = useState<string>("hsl(0, 0%, 15%)");
  
  useEffect(() => {
    if (!logoUrl) {
      setColor("hsl(0, 0%, 15%)");
      return;
    }
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      const dominantColor = extractDominantColor(img);
      setColor(dominantColor);
    };
    
    img.onerror = () => {
      setColor("hsl(0, 0%, 15%)");
    };
    
    img.src = logoUrl;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [logoUrl]);
  
  return color;
}