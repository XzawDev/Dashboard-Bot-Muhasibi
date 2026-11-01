"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Clock, Edit2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import type { ScheduleRow } from "@/types/db";
import {
  updateScheduleTime,
  toggleScheduleActive,
  createScheduleAction,
  deleteScheduleAction,
} from "./actions";

// ============ Skema Form ============
const timeFormSchema = z.object({
  send_time: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "Format jam tidak valid (HH:MM)",
    ),
});

const createFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama wajib diisi")
    .max(50, "Nama terlalu panjang"),
  send_time: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "Format jam tidak valid (HH:MM)",
    ),
});

type TimeFormValues = z.infer<typeof timeFormSchema>;
type CreateFormValues = z.infer<typeof createFormSchema>;

const MAX_SCHEDULES = 5;

export function SchedulesClient({
  initialSchedules,
}: {
  initialSchedules: ScheduleRow[];
}) {
  const router = useRouter();
  const [schedules, setSchedules] = useState(initialSchedules);
  const [editTarget, setEditTarget] = useState<ScheduleRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const isFull = schedules.length >= MAX_SCHEDULES;

  async function handleToggle(id: string, currentStatus: boolean) {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: !currentStatus } : s)),
    );

    const result = await toggleScheduleActive(id, !currentStatus);
    if (!result.ok) {
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: currentStatus } : s)),
      );
      alert(result.error);
    } else {
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteScheduleAction(deleteTarget.id);
    setIsDeleting(false);

    if (result.ok) {
      setDeleteTarget(null);
      router.refresh();
    } else {
      alert(result.error);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-heading font-semibold tracking-tight text-foreground">
            Jadwal
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Atur waktu pengiriman pesan dan aktifkan/nonaktifkan jadwal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {schedules.length} / {MAX_SCHEDULES} jadwal
          </span>
          <Button
            onClick={() => setIsCreateOpen(true)}
            disabled={isFull}
            title={isFull ? "Maksimal 5 waktu salat" : "Tambah jadwal baru"}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Jadwal
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground">
            Daftar Jadwal
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Hanya jadwal yang aktif yang akan diproses oleh bot.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[30%] text-muted-foreground">
                    Nama Jadwal
                  </TableHead>
                  <TableHead className="w-[20%] text-muted-foreground">
                    Waktu Kirim
                  </TableHead>
                  <TableHead className="w-[20%] text-center text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="w-[30%] text-right text-muted-foreground">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.length === 0 ? (
                  <TableRow className="border-border hover:bg-transparent">
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Belum ada data jadwal.
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map((schedule) => (
                    <TableRow
                      key={schedule.id}
                      className="border-border hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="font-medium text-foreground truncate">
                          {schedule.name}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider truncate">
                          {schedule.code}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-mono text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {schedule.send_time.slice(0, 5)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-3">
                          <Switch
                            checked={schedule.is_active}
                            onCheckedChange={() =>
                              handleToggle(schedule.id, schedule.is_active)
                            }
                          />
                          <span
                            className={`text-xs font-medium ${schedule.is_active ? "text-emerald-500" : "text-muted-foreground"}`}
                          >
                            {schedule.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3"
                            onClick={() => setEditTarget(schedule)}
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                            Ubah Jam
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTarget(schedule)}
                            title="Hapus Jadwal"
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

      {/* Dialog Edit Jam */}
      <EditTimeDialog
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          router.refresh();
        }}
      />

      {/* Dialog Tambah Jadwal */}
      <CreateScheduleDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => {
          setIsCreateOpen(false);
          router.refresh();
        }}
      />

      {/* Dialog Konfirmasi Hapus */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus Jadwal {deleteTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Jadwal yang dihapus tidak dapat dikembalikan. Pastikan sudah tidak
              ada password yang terkait dengan jadwal ini.
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

// ============ Edit Time Dialog ============
function EditTimeDialog({
  target,
  onClose,
  onSuccess,
}: {
  target: ScheduleRow | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TimeFormValues>({
    resolver: zodResolver(timeFormSchema),
    defaultValues: { send_time: target?.send_time.slice(0, 5) ?? "00:00" },
  });

  useState(() => {
    if (target) reset({ send_time: target.send_time.slice(0, 5) });
  });

  async function onSubmit(values: TimeFormValues) {
    if (!target) return;
    const result = await updateScheduleTime(target.id, values.send_time);
    if (!result.ok) {
      setError("root", { message: result.error });
      return;
    }
    onSuccess();
  }

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <DialogHeader>
            <DialogTitle className="text-base">Ubah Waktu Kirim</DialogTitle>
            <DialogDescription>
              Atur jam pengiriman untuk jadwal{" "}
              <strong className="text-foreground">{target?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <label
              htmlFor="send_time"
              className="text-xs font-medium text-muted-foreground"
            >
              Jam Pengiriman (HH:MM)
            </label>
            <input
              id="send_time"
              type="time"
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 font-mono text-lg shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("send_time")}
              disabled={isSubmitting}
            />
            {errors.send_time && (
              <p className="text-xs text-destructive">
                {errors.send_time.message}
              </p>
            )}
          </div>

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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============ Create Schedule Dialog ============
function CreateScheduleDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: { name: "", send_time: "12:00" },
  });

  async function onSubmit(values: CreateFormValues) {
    const result = await createScheduleAction(values);
    if (!result.ok) {
      setError("root", { message: result.error });
      return;
    }
    reset();
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <DialogHeader>
            <DialogTitle className="text-base">Tambah Jadwal Salat</DialogTitle>
            <DialogDescription>
              Tambahkan waktu salat baru (contoh: Dzuhur, Ashar). Maksimal 5
              jadwal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="text-xs font-medium text-muted-foreground"
            >
              Nama Jadwal
            </label>
            <input
              id="name"
              type="text"
              placeholder="Contoh: Dzuhur"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              {...register("name")}
              disabled={isSubmitting}
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="send_time_new"
              className="text-xs font-medium text-muted-foreground"
            >
              Jam Pengiriman (HH:MM)
            </label>
            <input
              id="send_time_new"
              type="time"
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 font-mono text-lg shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("send_time")}
              disabled={isSubmitting}
            />
            {errors.send_time && (
              <p className="text-xs text-destructive">
                {errors.send_time.message}
              </p>
            )}
          </div>

          {errors.root && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {errors.root.message}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Tambah Jadwal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
