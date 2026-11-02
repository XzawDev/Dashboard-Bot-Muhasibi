"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MessageSquareText,
  Edit2,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateTemplateAction } from "./actions";
import type { TemplateRow } from "./page";
import { useRealtimeRefresh } from "@/lib/hooks/use-realtime-refresh";

const formSchema = z.object({
  content: z.string().trim().min(1, "Pesan tidak boleh kosong"),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const ALLOWED_PLACEHOLDERS = [
  "nama_salat",
  "password",
  "tanggal",
  "waktu",
  "nama_mahad",
];

export function TemplatesClient({
  initialTemplates,
}: {
  initialTemplates: TemplateRow[];
}) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [editTarget, setEditTarget] = useState<TemplateRow | null>(null);

  useEffect(() => {
    setTemplates(initialTemplates);
  }, [initialTemplates]);

  useRealtimeRefresh(["message_templates"]);

  async function handleToggle(id: string, currentStatus: boolean) {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_active: !currentStatus } : t)),
    );

    const template = templates.find((t) => t.id === id);
    if (!template) return;

    const result = await updateTemplateAction({
      id,
      content: template.content,
      is_active: !currentStatus,
    });

    if (!result.ok) {
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_active: currentStatus } : t)),
      );
      alert(result.error);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-heading font-semibold tracking-tight text-foreground">
          Template Pesan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola teks pesan otomatis yang dikirim oleh bot WhatsApp.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="bg-card border-border shadow-sm flex flex-col"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                    {template.name}
                  </CardTitle>
                  <CardDescription className="font-mono text-xs mt-1 text-muted-foreground/70">
                    code: {template.code}
                  </CardDescription>
                </div>
                {template.is_active ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
                  >
                    Aktif
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-destructive/30 text-destructive bg-destructive/10"
                  >
                    Nonaktif
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="bg-muted/50 p-3 rounded-md flex-1 mb-4 border border-border/50">
                <p className="text-xs text-muted-foreground whitespace-pre-wrap font-sans line-clamp-4 leading-relaxed">
                  {template.content}
                </p>
              </div>

              <div className="flex items-center justify-between mt-auto pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={template.is_active}
                    onCheckedChange={() =>
                      handleToggle(template.id, template.is_active)
                    }
                  />
                  <span className="text-xs text-muted-foreground">Aktif</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditTarget(template)}
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                  Edit Teks
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TemplateDialog
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function TemplateDialog({
  target,
  onClose,
  onSuccess,
}: {
  target: TemplateRow | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { content: "", is_active: true },
  });

  // Watch content untuk validasi placeholder real-time di UI
  const currentContent = watch("content");

  useEffect(() => {
    if (target) {
      reset({ content: target.content, is_active: target.is_active });
    }
  }, [target, reset]);

  // Deteksi placeholder yang salah ketik secara real-time
  const matches = currentContent?.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
  const invalidPlaceholders = matches.filter(
    (m) => !ALLOWED_PLACEHOLDERS.includes(m.replace(/[{}]/g, "")),
  );

  async function onSubmit(values: FormValues) {
    if (!target) return;
    const result = await updateTemplateAction({
      id: target.id,
      content: values.content,
      is_active: values.is_active,
    });

    if (!result.ok) {
      setError("root", { message: result.error });
      return;
    }
    onSuccess();
  }

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              Edit Template:{" "}
              <span className="text-primary">{target?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Gunakan placeholder yang sesuai. Jika salah ketik, sistem akan
              menolak menyimpan.
            </DialogDescription>
          </DialogHeader>

          {/* Info Placeholder */}
          <div className="rounded-md bg-muted/50 p-3 text-xs border border-border">
            <p className="font-medium text-foreground mb-2 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" /> Placeholder yang diizinkan:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ALLOWED_PLACEHOLDERS.map((p) => (
                <span
                  key={p}
                  className="font-mono bg-background border border-border px-1.5 py-0.5 rounded text-muted-foreground"
                >
                  {`{${p}}`}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Isi Pesan
            </label>
            <textarea
              className="flex min-h-[180px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-sans leading-relaxed"
              {...register("content")}
              disabled={isSubmitting}
            />
            {errors.content && (
              <p className="text-xs text-destructive">
                {errors.content.message}
              </p>
            )}
          </div>

          {/* Peringatan Real-time jika ada placeholder salah */}
          {invalidPlaceholders.length > 0 && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">
                  Placeholder tidak valid terdeteksi:
                </p>
                <p className="font-mono">{invalidPlaceholders.join(", ")}</p>
              </div>
            </div>
          )}

          {errors.root && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {errors.root.message}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || invalidPlaceholders.length > 0}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
