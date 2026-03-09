
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { FORBIDDEN_WORDS } from "./storage"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Филтри дастӣ барои санҷиши дашномҳо.
 */
export function hasProfanity(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return FORBIDDEN_WORDS.some(word => lowerText.includes(word.toLowerCase()));
}

/**
 * Фишурдани сурат бо сифати баланд.
 */
export async function compressImage(base64Str: string, maxWidth = 1600, quality = 0.9): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio while ensuring max resolution is high
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
      }
      
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
}
