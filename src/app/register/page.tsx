// app/register/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Daftar · Mahad Reminder" };

export default async function RegisterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <AuthShell
      title="Buat akun baru"
      description="Daftarkan akun pengelola Mahad Reminder."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300">
            Masuk
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}