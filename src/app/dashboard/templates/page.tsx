import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplatesClient } from "./templates-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Template Pesan · Mahad Reminder" };

export type TemplateRow = {
  id: string;
  code: string;
  name: string;
  content: string;
  is_active: boolean;
};

export default async function TemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Proteksi Role Superadmin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();
  if (profile?.role !== "superadmin") redirect("/dashboard");

  const { data: templates } = await supabase
    .from("message_templates")
    .select("id, code, name, content, is_active")
    .order("name", { ascending: true });

  return (
    <TemplatesClient initialTemplates={(templates ?? []) as TemplateRow[]} />
  );
}
