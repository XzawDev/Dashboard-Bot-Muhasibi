import { createClient } from "@/lib/supabase/server";
import { LogsClient } from "./logs-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Log & Riwayat · Mahad Reminder" };

export type UnifiedLog = {
  id: string;
  type: "delivery" | "notification" | "reminder" | "activity"; // Tambah "activity"
  status: string;
  target: string;
  detail: string;
  timestamp: string;
};

export default async function LogsPage() {
  const supabase = await createClient();

  const [deliveryRes, notificationRes, reminderRes, activityRes] =
    await Promise.all([
      supabase
        .from("delivery_logs")
        .select(
          "id, status, error_message, sent_at, scheduled_at, whatsapp_groups(name), schedules(name)",
        )
        .order("scheduled_at", { ascending: false })
        .limit(100),
      supabase
        .from("notification_logs")
        .select(
          "id, status, recipient_jid, sent_at, created_at, musyrif_contacts(name), schedules(name)",
        )
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("reminder_logs")
        .select(
          "id, status, recipient_jid, sent_at, created_at, musyrif_contacts(name), target_date",
        )
        .order("created_at", { ascending: false })
        .limit(100),
      // TAMBAHAN: Ambil log aktivitas bot
      supabase
        .from("bot_activity_logs")
        .select("id, event_type, status, message, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  const unifiedLogs: UnifiedLog[] = [];

  // 1. Delivery Logs
  (deliveryRes.data ?? []).forEach((log: any) => {
    const group = Array.isArray(log.whatsapp_groups)
      ? log.whatsapp_groups[0]
      : log.whatsapp_groups;
    const schedule = Array.isArray(log.schedules)
      ? log.schedules[0]
      : log.schedules;

    unifiedLogs.push({
      id: `del-${log.id}`,
      type: "delivery",
      status: log.status,
      target: group?.name ?? "Grup Tidak Diketahui",
      detail: log.error_message ?? `Password ${schedule?.name ?? ""} terkirim`,
      timestamp: log.sent_at ?? log.scheduled_at,
    });
  });

  // 2. Notification Logs
  (notificationRes.data ?? []).forEach((log: any) => {
    const musyrif = Array.isArray(log.musyrif_contacts)
      ? log.musyrif_contacts[0]
      : log.musyrif_contacts;
    const schedule = Array.isArray(log.schedules)
      ? log.schedules[0]
      : log.schedules;

    unifiedLogs.push({
      id: `notif-${log.id}`,
      type: "notification",
      status: log.status,
      target: musyrif?.name ?? log.recipient_jid,
      detail: `Notifikasi ${schedule?.name ?? ""} kosong`,
      timestamp: log.sent_at ?? log.created_at,
    });
  });

  // 3. Reminder Logs
  (reminderRes.data ?? []).forEach((log: any) => {
    const musyrif = Array.isArray(log.musyrif_contacts)
      ? log.musyrif_contacts[0]
      : log.musyrif_contacts;

    unifiedLogs.push({
      id: `rem-${log.id}`,
      type: "reminder",
      status: log.status,
      target: musyrif?.name ?? log.recipient_jid,
      detail: `Pengingat password tgl ${log.target_date}`,
      timestamp: log.sent_at ?? log.created_at,
    });
  });

  // 4. Bot Activity Logs
  (activityRes.data ?? []).forEach((log: any) => {
    unifiedLogs.push({
      id: `act-${log.id}`,
      type: "activity",
      status: log.status ?? "info",
      target: log.event_type, // e.g., "scheduler_tick_error", "group_sync"
      detail: log.message ?? "Aktivitas sistem",
      timestamp: log.created_at,
    });
  });

  // Urutkan semua log
  unifiedLogs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return <LogsClient logs={unifiedLogs} />;
}
