"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_PLACEHOLDERS = [
  "nama_salat",
  "password",
  "tanggal",
  "waktu",
  "nama_mahad",
];

const templateSchema = z.object({
  id: z.string().uuid(),
  content: z.string().trim().min(1, "Isi pesan tidak boleh kosong"),
  is_active: z.boolean(),
});

export async function updateTemplateAction(
  input: z.infer<typeof templateSchema>,
) {
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Input tidak valid." };

  // VALIDASI PLACEHOLDER
  // Cari semua teks yang diapit oleh kurung kurawal { }
  const matches = parsed.data.content.match(/\{([a-zA-Z0-9_]+)\}/g) || [];

  for (const match of matches) {
    const placeholder = match.replace(/[{}]/g, ""); // hapus kurung kurawal
    if (!ALLOWED_PLACEHOLDERS.includes(placeholder)) {
      return {
        ok: false,
        error: `Placeholder ${match} tidak valid. Placeholder yang diizinkan: ${ALLOWED_PLACEHOLDERS.map((p) => `{${p}}`).join(", ")}`,
      };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi habis." };

  const { error } = await supabase
    .from("message_templates")
    .update({
      content: parsed.data.content,
      is_active: parsed.data.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/templates");
  return { ok: true };
}
