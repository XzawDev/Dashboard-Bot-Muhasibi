import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GroupsClient } from "./groups-client";
import type { GroupRow } from "@/types/db"; // <-- Import dari sini

export const dynamic = "force-dynamic";
export const metadata = { title: "Grup WhatsApp · Mahad Reminder" };

export default async function GroupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Cek Role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  if (profile?.role !== "superadmin") {
    redirect("/dashboard");
  }

  const { data: groups } = await supabase
    .from("whatsapp_groups")
    .select("*")
    .order("is_joined", { ascending: false })
    .order("name", { ascending: true });

  return <GroupsClient initialGroups={(groups ?? []) as GroupRow[]} />;
}
