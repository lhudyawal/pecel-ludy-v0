// Utility functions for SAMBEL PECEL LUDY

// Format currency to Indonesian Rupiah
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date to Indonesian locale
export function formatDate(date: Date | string, includeTime: boolean = false): string {
  const d = typeof date === "string" ? new Date(date) : date;
  
  if (includeTime) {
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Format date to short format
export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Calculate penalty based on target and realization
export function calculatePenalty(target: number, realization: number): number {
  if (realization >= target) return 0;
  const shortfall = target - realization;
  return shortfall * 0.1; // 10% penalty
}

// Calculate estimated salary
export function calculateEstimatedSalary(
  baseSalary: number,
  target: number,
  realization: number
): number {
  const penalty = calculatePenalty(target, realization);
  return baseSalary - penalty;
}

// Calculate progress percentage
export function calculateProgress(target: number, realization: number): number {
  if (target === 0) return 0;
  return Math.min((realization / target) * 100, 100);
}

// Get current month and year
export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

// Get days in month
export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

// Check if date is today
export function isToday(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
