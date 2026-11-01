"use client";

import { useRealtimeRefresh } from "@/lib/hooks/use-realtime-refresh";

export function RealtimeListener() {
  useRealtimeRefresh([
    "bot_status",
    "passwords",
    "schedules",
    "delivery_logs",
    "notification_logs",
    "reminder_logs",
  ]);
  return null;
}
