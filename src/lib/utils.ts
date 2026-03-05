import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to YYYY/MM/DD HH:mm:ss in Taiwan timezone
export function formatDateTime(date: Date = new Date()): string {
  // Convert to Taiwan timezone (UTC+8)
  const taiwanTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
  
  const year = taiwanTime.getFullYear();
  const month = String(taiwanTime.getMonth() + 1).padStart(2, '0');
  const day = String(taiwanTime.getDate()).padStart(2, '0');
  const hours = String(taiwanTime.getHours()).padStart(2, '0');
  const minutes = String(taiwanTime.getMinutes()).padStart(2, '0');
  const seconds = String(taiwanTime.getSeconds()).padStart(2, '0');
  
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}
