"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function LiveClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set waktu pertama kali di client
    setTime(new Date());

    // Update setiap 1 detik
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Tampilan skeleton sebelum client siap (mencegah hydration error)
  if (!time) {
    return (
      <div className="flex items-center gap-1.5 h-4 w-24 animate-pulse rounded bg-muted" />
    );
  }

  // Format ke zona waktu WIB (Asia/Jakarta)
  const formatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(time);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;

  const day = get("day");
  const month = get("month");
  const weekday = get("weekday");
  const hour = get("hour");
  const minute = get("minute");
  const second = get("second");

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
      <Clock className="h-3.5 w-3.5" />
      {/* Tanggal disembunyikan di HP agar tidak sesak */}
      <span className="hidden md:inline">
        {weekday}, {day} {month} ·{" "}
      </span>
      <span className="font-mono font-medium text-foreground">
        {hour}:{minute}:{second} WIB
      </span>
    </div>
  );
}
