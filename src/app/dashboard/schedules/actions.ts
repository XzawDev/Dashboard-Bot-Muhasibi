"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const updateTimeSchema = z.object({
  id: z.string().uuid(),
  send_time: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/,
      "Format jam tidak valid (HH:MM)",
    ),
});

export async function updateScheduleTime(id: string, send_time: string) {
  const parsed = updateTimeSchema.safeParse({ id, send_time });
  if (!parsed.success) return { ok: false, error: "Format jam tidak valid." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis." };

  const formattedTime =
    parsed.data.send_time.length === 5
      ? `${parsed.data.send_time}:00`
      : parsed.data.send_time;

  const { error } = await supabase
    .from("schedules")
    .update({ send_time: formattedTime })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/schedules");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function toggleScheduleActive(id: string, is_active: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis." };

  const { error } = await supabase
    .from("schedules")
    .update({ is_active })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/schedules");
  revalidatePath("/dashboard");
  return { ok: true };
}

const createScheduleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama jadwal wajib diisi")
    .max(50, "Nama terlalu panjang"),
  send_time: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "Format jam tidak valid (HH:MM)",
    ),
});

// ============ FUNGSI BARU ============

export async function createScheduleAction(input: {
  name: string;
  send_time: string;
}) {
  const parsed = createScheduleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis." };

  // 1. Validasi Maksimal 5 Jadwal
  const { count } = await supabase
    .from("schedules")
    .select("*", { count: "exact", head: true });

  if ((count ?? 0) >= 5) {
    return { ok: false, error: "Maksimal 5 waktu salat sudah tercapai." };
  }

  // 2. Generate Kode unik dari nama (contoh: "Dzuhur" -> "dzuhur")
  const baseCode = parsed.data.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  // 3. Pastikan kode belum dipakai
  const { data: existing } = await supabase
    .from("schedules")
    .select("id")
    .eq("code", baseCode)
    .maybeSingle();

  let finalCode = baseCode;
  if (existing) {
    finalCode = `${baseCode}_${Date.now().toString().slice(-4)}`;
  }

  const formattedTime =
    parsed.data.send_time.length === 5
      ? `${parsed.data.send_time}:00`
      : parsed.data.send_time;

  const { error } = await supabase.from("schedules").insert({
    name: parsed.data.name,
    code: finalCode,
    send_time: formattedTime,
    is_active: true,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/schedules");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/passwords");
  return { ok: true };
}

export async function deleteScheduleAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis." };

  // Cek apakah ada password yang masih terhubung ke jadwal ini
  const { count } = await supabase
    .from("passwords")
    .select("*", { count: "exact", head: true })
    .eq("schedule_id", id);

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: `Tidak dapat menghapus: sudah ada ${count} password untuk jadwal ini. Hapus semua password terkait terlebih dahulu.`,
    };
  }

  const { error } = await supabase.from("schedules").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/schedules");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/passwords");
  return { ok: true };
}
