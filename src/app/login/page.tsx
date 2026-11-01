// app/login/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Masuk · Mahad Reminder" };

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <AuthShell
      title="Masuk ke Mahad Reminder"
      description="Kelola jadwal dan pengingat WhatsApp mahad."
      footer={
        <>
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Daftar
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}