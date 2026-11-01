// components/auth/auth-shell.tsx
import { MessageSquareText } from "lucide-react";

export function AuthShell({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-500 text-zinc-950">
            <MessageSquareText className="h-5 w-5" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-50">
              {title}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
          {children}
        </div>

        <div className="mt-6 text-center text-sm text-zinc-500">{footer}</div>
      </div>
    </div>
  );
}