import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 이미지를 4cm×4cm (472×472px) JPG로 변환하는 함수
 * @param file File 또는 Blob
 * @returns Promise<File> (JPG, 472×472px, 100KB 이하)
 */
export async function convertImageToJpg151(file: File | Blob): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // 4cm × 4cm = 472×472px (300 DPI 기준)
      canvas.width = 472;
      canvas.height = 472;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('canvas context error');
      
      // 흰색 배경 설정 (JPG 변환 시 필요)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 472, 472);
      
      // 비율 유지하여 중앙에 맞춤
      const sw = img.width, sh = img.height, sx = 0, sy = 0;
      let dw = 472, dh = 472, dx = 0, dy = 0;
      
      // 이미지 비율에 따라 크기 조정
      if (img.width > img.height) {
        dw = 472;
        dh = Math.round((img.height / img.width) * 472);
        dy = Math.floor((472 - dh) / 2);
      } else {
        dh = 472;
        dw = Math.round((img.width / img.height) * 472);
        dx = Math.floor((472 - dw) / 2);
      }
      
      // 이미지 그리기
      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
      
      // 100KB 이하가 될 때까지 압축률 조정
      let quality = 0.92;
      function tryCompress() {
        canvas.toBlob(blob => {
          if (!blob) return reject('blob error');
          if (blob.size <= 100 * 1024 || quality <= 0.5) {
            resolve(new File([blob], 'converted.jpg', { type: 'image/jpeg' }));
          } else {
            quality -= 0.05;
            tryCompress();
          }
        }, 'image/jpeg', quality);
      }
      tryCompress();
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
