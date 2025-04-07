import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, formatString: string = "PPP"): string {
  if (!date) return "N/A";
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return format(dateObj, formatString);
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Invalid date";
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function calculateDateDifference(startDate: Date, endDate: Date) {
  // Calculate the difference in days, including both start and end date
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

export function getStatusColor(status: string) {
  const statusColors: Record<string, { bg: string; text: string }> = {
    approved: { bg: 'bg-green-100', text: 'text-green-800' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800' },
    present: { bg: 'bg-green-100', text: 'text-green-800' },
    absent: { bg: 'bg-red-100', text: 'text-red-800' },
    late: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    half_day: { bg: 'bg-blue-100', text: 'text-blue-800' },
    paid: { bg: 'bg-green-100', text: 'text-green-800' },
    unpaid: { bg: 'bg-red-100', text: 'text-red-800' },
  };

  return statusColors[status.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-800' };
}

export function calculateLeaveDuration(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  // Set hours to 0 to ignore time part
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  // Calculate difference in days (including both start and end date)
  const diffInTime = end.getTime() - start.getTime();
  const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24)) + 1;
  
  return diffInDays;
}

export function generateEmployeeId(departmentPrefix: string, counter: number): string {
  // Format: DEPT-YYYY-XXXX where XXXX is a sequence number
  const year = new Date().getFullYear();
  const sequence = String(counter).padStart(4, '0');
  return `${departmentPrefix}-${year}-${sequence}`;
}
