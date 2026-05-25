import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

export function getInitials(name: string): string {
  return name.charAt(0);
}

export function getRatingColor(rating: number): string {
  if (rating >= 90) return 'bg-emerald-500';
  if (rating >= 75) return 'bg-amber-500';
  return 'bg-red-500';
}

export function getRatingText(rating: string): string {
  const map: Record<string, string> = {
    'strong_hire': '强烈录用',
    'hire': '录用',
    'lean_hire': '倾向录用',
    'lean_no': '倾向不录用',
    'no_hire': '不录用',
  };
  return map[rating] || rating;
}

export function getRatingColorClass(rating: string): string {
  const map: Record<string, string> = {
    'strong_hire': 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20',
    'hire': 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20',
    'lean_hire': 'text-amber-400 bg-amber-500/10 border border-amber-500/20',
    'lean_no': 'text-orange-400 bg-orange-500/10 border border-orange-500/20',
    'no_hire': 'text-red-400 bg-red-500/10 border border-red-500/20',
  };
  return map[rating] || 'text-neutral-400 bg-neutral-800 border border-neutral-700';
}
