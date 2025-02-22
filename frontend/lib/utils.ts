/* ================ [ IMPORTS ] ================ */

// Utility functions
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/* ================ [ METHODS ] ================ */

// Resolve class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
