// components/auth/register-form.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email wajib diisi")
      .email("Format email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi password wajib diisi"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak cocok.",
  });

type RegisterValues = z.infer<typeof registerSchema>;

function translateAuthError(message: string): string {
  const map: Record<string, string> = {
    "User already registered": "Email sudah terdaftar. Silakan masuk.",
    "Password should be at least 6 characters": "Password minimal 6 karakter.",
    "Too many requests": "Terlalu banyak percobaan. Coba lagi nanti.",
  };
  return map[message] ?? message;
}

export function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: RegisterValues) {
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setError("root", { message: translateAuthError(error.message) });
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setSuccessMessage(
      "Akun berhasil dibuat. Silakan cek email Anda untuk konfirmasi sebelum masuk.",
    );
  }

  if (successMessage) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <p className="text-sm text-zinc-300">{successMessage}</p>
        <Link
          href="/login"
          className="inline-flex h-9 w-full items-center justify-center rounded-2xl border border-zinc-800 bg-background text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-900"
        >
          Kembali ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-xs font-medium text-zinc-400">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="nama@mahad.id"
          className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 disabled:opacity-60"
          {...register("email")}
          disabled={isSubmitting}
        />
        {errors.email ? (
          <p className="text-xs text-red-400">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-xs font-medium text-zinc-400">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Minimal 6 karakter"
          className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 disabled:opacity-60"
          {...register("password")}
          disabled={isSubmitting}
        />
        {errors.password ? (
          <p className="text-xs text-red-400">{errors.password.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="confirmPassword"
          className="text-xs font-medium text-zinc-400"
        >
          Konfirmasi Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Ulangi password"
          className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 disabled:opacity-60"
          {...register("confirmPassword")}
          disabled={isSubmitting}
        />
        {errors.confirmPassword ? (
          <p className="text-xs text-red-400">
            {errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      {errors.root ? (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {errors.root.message}
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-9 w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Membuat akun...
          </>
        ) : (
          "Buat akun"
        )}
      </Button>
    </form>
  );
}