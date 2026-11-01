import { createClient } from "@/lib/supabase/server";
import type { ScheduleRow } from "@/types/db";
import { SchedulesClient } from "./schedules-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jadwal · Mahad Reminder" };

export default async function SchedulesPage() {
  const supabase = await createClient();

  const { data: schedules } = await supabase
    .from("schedules")
    .select("id, code, name, send_time, is_active")
    .order("send_time", { ascending: true });

  return (
    <SchedulesClient initialSchedules={(schedules ?? []) as ScheduleRow[]} />
  );
}
