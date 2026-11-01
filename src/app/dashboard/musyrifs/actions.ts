"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const musyrifSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(100),
  // Regex nomor telepon: diawali 62, diikuti 8-14 digit angka
  phone_number: z
    .string()
    .trim()
    .regex(
      /^62\d{8,14}$/,
      "Format nomor harus diawali 62 (contoh: 628123456789)",
    ),
});

export async function createMusyrif(input: z.infer<typeof musyrifSchema>) {
  const parsed = musyrifSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis." };

  const { error } = await supabase.from("musyrif_contacts").insert({
    name: parsed.data.name,
    phone_number: parsed.data.phone_number,
    is_active: true,
  });

  if (error) {
    if (error.code === "23505")
      return { ok: false, error: "Nomor WA sudah terdaftar." };
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/musyrifs");
  return { ok: true };
}

export async function updateMusyrif(
  id: string,
  input: z.infer<typeof musyrifSchema>,
) {
  const parsed = musyrifSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis." };

  const { error } = await supabase
    .from("musyrif_contacts")
    .update({
      name: parsed.data.name,
      phone_number: parsed.data.phone_number,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505")
      return { ok: false, error: "Nomor WA sudah terdaftar." };
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/musyrifs");
  return { ok: true };
}

export async function toggleMusyrifActive(id: string, is_active: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis." };

  const { error } = await supabase
    .from("musyrif_contacts")
    .update({ is_active })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/musyrifs");
  return { ok: true };
}

export async function deleteMusyrif(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis." };

  // Cek relasi di reminder_logs (karena bot mencatat log reminder ke tabel ini)
  const { count } = await supabase
    .from("reminder_logs")
    .select("*", { count: "exact", head: true })
    .eq("musyrif_id", id);

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error:
        "Tidak dapat menghapus: Musyrif ini memiliki riwayat log pengingat. Silakan nonaktifkan saja.",
    };
  }

  const { error } = await supabase
    .from("musyrif_contacts")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/musyrifs");
  return { ok: true };
}
