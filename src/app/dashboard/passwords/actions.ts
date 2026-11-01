"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const setPasswordSchema = z.object({
  scheduleId: z.string().uuid("Jadwal tidak valid"),
  validDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid"),
  passwordValue: z.string().trim().min(1, "Password wajib diisi").max(200),
});

export async function setPasswordAction(
  input: z.infer<typeof setPasswordSchema>,
) {
  const parsed = setPasswordSchema.safeParse(input);
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

  if (!user) return { ok: false, error: "Sesi habis. Silakan login ulang." };

  // --- TAMBAHAN VALIDASI WAKTU ---
  // Ambil jam kirim (send_time) dari jadwal yang dipilih
  const { data: schedule } = await supabase
    .from("schedules")
    .select("send_time")
    .eq("id", parsed.data.scheduleId)
    .single();

  if (schedule) {
    // Gabungkan tanggal validDate dengan jam send_time
    const scheduleDateTime = new Date(
      `${parsed.data.validDate}T${schedule.send_time}`,
    );

    // Jika waktu sholat tersebut sudah terlewat dari sekarang
    if (scheduleDateTime < new Date()) {
      return {
        ok: false,
        error:
          "Waktu sholat ini sudah terlewat. Password tidak dapat diubah lagi.",
      };
    }
  }
  // -------------------------------

  const { error } = await supabase.rpc("set_current_password", {
    p_schedule_id: parsed.data.scheduleId,
    p_valid_date: parsed.data.validDate,
    p_password_value: parsed.data.passwordValue,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/passwords");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deletePasswordAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Sesi habis." };

  const { error } = await supabase.from("passwords").delete().eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/passwords");
  revalidatePath("/dashboard");
  return { ok: true };
}
