import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Фишурдани сурат дар тарафи клиент барои сарфаи ҳаҷм.
 */
export async function compressImage(base64Str: string, maxWidth = 1000, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Агар сурат аз андозаи ниҳоӣ калон бошад, онро хурд мекунем
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Ба формати JPEG ва бо сифати камтар табдил медиҳем
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
}
