import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "musyrif";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar role={role} /> {/* Prop role dikirim */}
      <div className="lg:pl-64">
        <Topbar userEmail={user.email ?? ""} role={role} />{" "}
        {/* Prop role dikirim */}
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
