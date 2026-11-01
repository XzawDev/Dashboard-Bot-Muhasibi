"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit2, Trash2, Phone, User, Contact } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createMusyrif,
  updateMusyrif,
  toggleMusyrifActive,
  deleteMusyrif,
} from "./actions";
import type { MusyrifRow } from "./page";
import { useRealtimeRefresh } from "@/lib/hooks/use-realtime-refresh";

const formSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(100),
  phone_number: z
    .string()
    .trim()
    .regex(
      /^62\d{8,14}$/,
      "Harus diawali 62 dan berisi angka (contoh: 628123456789)",
    ),
});

type FormValues = z.infer<typeof formSchema>;

export function MusyrifsClient({
  initialMusyrifs,
}: {
  initialMusyrifs: MusyrifRow[];
}) {
  const router = useRouter();
  const [musyrifs, setMusyrifs] = useState(initialMusyrifs);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MusyrifRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MusyrifRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Optimistic Toggle
  async function handleToggle(id: string, currentStatus: boolean) {
    setMusyrifs((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_active: !currentStatus } : m)),
    );

    const result = await toggleMusyrifActive(id, !currentStatus);
    if (!result.ok) {
      setMusyrifs((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_active: currentStatus } : m)),
      );
      alert(result.error);
    } else {
      router.refresh();
    }
  }

  useEffect(() => {
    setMusyrifs(initialMusyrifs);
  }, [initialMusyrifs]);

  useRealtimeRefresh(["musyrif_contacts"]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteMusyrif(deleteTarget.id);
    setIsDeleting(false);

    if (result.ok) {
      setDeleteTarget(null);
      router.refresh();
    } else {
      alert(result.error);
      setDeleteTarget(null);
    }
  }

  function openCreate() {
    setEditTarget(null);
    setIsFormOpen(true);
  }

  function openEdit(m: MusyrifRow) {
    setEditTarget(m);
    setIsFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-heading font-semibold tracking-tight text-foreground">
            Manajemen Musyrif
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola kontak penerima pesan pengingat (reminder) WhatsApp.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Musyrif
        </Button>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground">
            Daftar Kontak
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Bot hanya akan mengirim reminder ke musyrif yang berstatus aktif.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[35%] text-muted-foreground pl-6">
                    Nama
                  </TableHead>
                  <TableHead className="w-[30%] text-muted-foreground">
                    Nomor WA
                  </TableHead>
                  <TableHead className="w-[15%] text-center text-muted-foreground">
                    Aktif?
                  </TableHead>
                  <TableHead className="w-[20%] text-right text-muted-foreground pr-6">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {musyrifs.length === 0 ? (
                  <TableRow className="border-border hover:bg-transparent">
                    <TableCell
                      colSpan={4}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      <Contact className="mx-auto h-8 w-8 mb-3 opacity-20" />
                      Belum ada data Musyrif.
                    </TableCell>
                  </TableRow>
                ) : (
                  musyrifs.map((m) => (
                    <TableRow
                      key={m.id}
                      className="border-border hover:bg-muted/50"
                    >
                      <TableCell className="pl-6 font-medium text-foreground truncate">
                        {m.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                          <Phone className="h-3.5 w-3.5" />
                          {m.phone_number}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={m.is_active}
                          onCheckedChange={() =>
                            handleToggle(m.id, m.is_active)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => openEdit(m)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeleteTarget(m)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <MusyrifDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        target={editTarget}
        onSuccess={() => {
          setIsFormOpen(false);
          router.refresh();
        }}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus Musyrif {deleteTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Data yang dihapus tidak dapat dikembalikan. Jika musyrif ini
              memiliki riwayat log, sistem akan menolak penghapusan dan
              menyarankan untuk menonaktifkannya saja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MusyrifDialog({
  open,
  onOpenChange,
  target,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: MusyrifRow | null;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", phone_number: "" },
  });

  useEffect(() => {
    if (open) {
      if (target) {
        reset({ name: target.name, phone_number: target.phone_number });
      } else {
        reset({ name: "", phone_number: "" });
      }
    }
  }, [open, target, reset]);

  async function onSubmit(values: FormValues) {
    const result = target
      ? await updateMusyrif(target.id, values)
      : await createMusyrif(values);

    if (!result.ok) {
      setError("root", { message: result.error });
      return;
    }
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <DialogHeader>
            <DialogTitle>
              {target ? "Edit Data Musyrif" : "Tambah Musyrif Baru"}
            </DialogTitle>
            <DialogDescription>
              Masukkan nama dan nomor WhatsApp yang aktif.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Contoh: Ustadz Fulan"
                className="pl-9"
                {...register("name")}
                disabled={isSubmitting}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Nomor WhatsApp
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Contoh: 6281234567890"
                className="pl-9 font-mono"
                {...register("phone_number")}
                disabled={isSubmitting}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Harus diawali 62 (tanpa + atau spasi).
            </p>
            {errors.phone_number && (
              <p className="text-xs text-destructive">
                {errors.phone_number.message}
              </p>
            )}
          </div>

          {errors.root && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {errors.root.message}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Data"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
