// components/auth/login-form.tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginValues = z.infer<typeof loginSchema>;

function translateAuthError(message: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "Email atau password salah.",
    "Email not confirmed": "Email belum dikonfirmasi. Cek inbox email Anda.",
    "Too many requests": "Terlalu banyak percobaan. Coba lagi nanti.",
  };
  return map[message] ?? message;
}

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      setError("root", { message: translateAuthError(error.message) });
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
          autoComplete="current-password"
          placeholder="••••••••"
          className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 disabled:opacity-60"
          {...register("password")}
          disabled={isSubmitting}
        />
        {errors.password ? (
          <p className="text-xs text-red-400">{errors.password.message}</p>
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
            Memproses...
          </>
        ) : (
          "Masuk"
        )}
      </Button>
    </form>
  );
}