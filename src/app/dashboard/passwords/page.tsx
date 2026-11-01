import { format } from "date-fns";
import { getTodayWib, getNowWib, formatDateWib } from "@/lib/time";
import { addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { ScheduleRow } from "@/types/db";
import { PasswordsClient } from "./passwords-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Password · Mahad Reminder" };

type RawPassword = {
  id: string;
  schedule_id: string;
  valid_date: string;
  password_value: string;
  schedules:
    | { name: string; code: string }
    | { name: string; code: string }[]
    | null;
};

export default async function PasswordsPage() {
  const supabase = await createClient();
  const today = getTodayWib();
  const tomorrow = formatDateWib(addDays(getNowWib(), 1), "yyyy-MM-dd");

  const [schedulesRes, passwordsRes] = await Promise.all([
    supabase
      .from("schedules")
      .select("id, code, name, send_time, is_active")
      .eq("is_active", true)
      .order("send_time", { ascending: true }),

    // Ambil semua password mulai dari hari ini ke depan
    supabase
      .from("passwords")
      .select(
        "id, schedule_id, valid_date, password_value, is_current, schedules(name, code)",
      )
      .eq("is_current", true)
      .gte("valid_date", today)
      .order("valid_date", { ascending: true }),
  ]);

  const schedules = (schedulesRes.data ?? []) as ScheduleRow[];
  const rawPasswords = (passwordsRes.data ?? []) as RawPassword[];

  // Kelompokkan password berdasarkan tanggal
  const groupedPasswords: Record<string, any[]> = {};

  rawPasswords.forEach((p) => {
    const rel = Array.isArray(p.schedules) ? p.schedules[0] : p.schedules;
    if (!groupedPasswords[p.valid_date]) {
      groupedPasswords[p.valid_date] = [];
    }
    groupedPasswords[p.valid_date].push({
      id: p.id,
      scheduleId: p.schedule_id,
      scheduleName: rel?.name ?? "-",
      validDate: p.valid_date,
      passwordValue: p.password_value,
    });
  });

  // Ubah objek menjadi array agar mudah dilooping di client
  const datesWithPasswords = Object.keys(groupedPasswords)
    .sort() // Pastikan urut dari tanggal terdekat
    .map((date) => ({
      date,
      passwords: groupedPasswords[date],
    }));

  return (
    <PasswordsClient
      // PERUBAHAN: Kirim send_time juga
      schedules={schedules.map((s) => ({
        id: s.id,
        name: s.name,
        send_time: s.send_time,
      }))}
      initialToday={today}
      datesWithPasswords={datesWithPasswords}
    />
  );
}
