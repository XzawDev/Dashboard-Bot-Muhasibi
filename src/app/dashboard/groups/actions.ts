"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function toggleGroupWhitelist(
  id: string,
  is_active: boolean,
  password: string,
): Promise<ActionResult> {
  const serverPassword = process.env.WHITELIST_PASSWORD;
  if (!serverPassword) {
    return {
      ok: false,
      error: "Sistem error: WHITELIST_PASSWORD belum diatur di server.",
    };
  }
  if (password !== serverPassword) {
    return { ok: false, error: "Password otorisasi salah!" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi login habis." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "superadmin") {
    return { ok: false, error: "Akses ditolak. Hanya Superadmin." };
  }

  if (is_active) {
    const { data: group } = await supabase
      .from("whatsapp_groups")
      .select("is_joined")
      .eq("id", id)
      .single();
    if (!group?.is_joined) {
      return { ok: false, error: "Gagal: Bot sudah tidak berada di grup ini." };
    }
  }

  const { error } = await supabase
    .from("whatsapp_groups")
    .update({ is_active })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/groups");
  revalidatePath("/dashboard");
  return { ok: true };
}

// FUNGSI BARU: Verifikasi Sandi Halaman
export async function verifyGroupsPagePassword(password: string) {
  const serverPassword = process.env.GROUPS_PAGE_PASSWORD;
  if (!serverPassword) {
    return {
      ok: false,
      error: "Sistem error: GROUPS_PAGE_PASSWORD belum diatur.",
    };
  }
  if (password !== serverPassword) {
    return { ok: false, error: "Kata sandi halaman salah." };
  }
  return { ok: true };
}
