"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type RealtimeTable =
  | "schedules"
  | "passwords"
  | "whatsapp_groups"
  | "musyrif_contacts"
  | "bot_status"
  | "message_templates"
  | "delivery_logs"
  | "notification_logs"
  | "bot_activity_logs"
  | "reminder_logs";

/**
 * Berlangganan perubahan realtime pada satu/lebih tabel.
 * Setiap ada perubahan, router.refresh() dipanggil (dengan debounce 300ms)
 * agar Server Component re-fetch data terbaru.
 */
export function useRealtimeRefresh(tables: RealtimeTable[]) {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Sortir agar urutan array tidak memicu re-subscribe
  const tablesKey = [...tables].sort().join(",");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`realtime-refresh:${tablesKey}`);

    tables.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          // Debounce agar tidak spam refresh saat banyak perubahan bersamaan
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            router.refresh();
          }, 300);
        },
      );
    });

    channel.subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tablesKey, router]);
}
