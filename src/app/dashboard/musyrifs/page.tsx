import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MusyrifsClient } from "./musyrifs-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Musyrif · Mahad Reminder" };

export type MusyrifRow = {
  id: string;
  name: string;
  phone_number: string;
  is_active: boolean;
};

export default async function MusyrifsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Cek login saja, tanpa cek role superadmin
  if (!user) redirect("/login");

  const { data: musyrifs } = await supabase
    .from("musyrif_contacts")
    .select("*")
    .order("name", { ascending: true });

  return <MusyrifsClient initialMusyrifs={(musyrifs ?? []) as MusyrifRow[]} />;
}
