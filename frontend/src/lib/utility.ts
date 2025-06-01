/* ================ [ IMPORTS ] ================ */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/* ================ [ UTILITY ] ================ */

// Resolve class names
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format number with commas based on region
function formatNum(num: number) {
  return num?.toLocaleString('en-US') || "0";
}

/* ================ [ EXPORTS ] ================ */

export { cn, formatNum };
