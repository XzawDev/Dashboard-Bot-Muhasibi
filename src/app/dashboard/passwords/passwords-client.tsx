"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Plus,
  Lock,
  ChevronDown,
  ChevronUp,
  Archive,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { setPasswordAction, deletePasswordAction } from "./actions";
import { useRealtimeRefresh } from "@/lib/hooks/use-realtime-refresh";

type ScheduleOption = { id: string; name: string; send_time: string };

type PasswordItem = {
  id: string;
  scheduleId: string;
  scheduleName: string;
  validDate: string;
  passwordValue: string;
};

type DateGroup = {
  date: string;
  passwords: PasswordItem[];
};

type Props = {
  schedules: ScheduleOption[];
  initialToday: string;
  datesWithPasswords: DateGroup[];
};

const formSchema = z.object({
  scheduleId: z.string().uuid("Pilih jadwal"),
  validDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
  passwordValue: z.string().trim().min(1, "Password wajib diisi").max(200),
});

type FormValues = z.infer<typeof formSchema>;

function labelForDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), "EEEE, dd MMM yyyy", { locale: localeId });
  } catch {
    return dateStr;
  }
}

function isSchedulePassed(validDate: string, sendTime: string) {
  // Tambahkan +07:00 agar browser tahu ini jam WIB
  const scheduleDateTime = new Date(`${validDate}T${sendTime}+07:00`);
  return scheduleDateTime < new Date();
}

function isDateCompleted(
  dateStr: string,
  schedules: ScheduleOption[],
  todayStr: string,
) {
  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;
  const now = new Date();
  return schedules.every((s) => {
    const scheduleTime = new Date(`${dateStr}T${s.send_time}`);
    return scheduleTime < now;
  });
}

function PasswordSection({
  title,
  dateLabel,
  schedules,
  passwords,
  validDate,
  onPick,
  onDelete,
}: {
  title: string;
  dateLabel: string;
  schedules: ScheduleOption[];
  passwords: PasswordItem[];
  validDate: string;
  onPick: (item: PasswordItem) => void;
  onDelete: (item: PasswordItem) => void;
}) {
  const bySchedule = new Map(passwords.map((p) => [p.scheduleId, p]));

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {dateLabel}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {/* Hapus table-fixed, ganti dengan min-w untuk memicu scroll di mobile */}
          <Table className="w-full min-w-[550px]">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[25%] text-muted-foreground">
                  Jadwal
                </TableHead>
                <TableHead className="w-[45%] text-muted-foreground">
                  Password
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
                    colSpan={3}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    Belum ada jadwal aktif.
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map((s) => {
                  const current = bySchedule.get(s.id);
                  const isPassed = isSchedulePassed(validDate, s.send_time);

                  return (
                    <TableRow
                      key={s.id}
                      className="border-border hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        <div className="text-foreground truncate">{s.name}</div>
                        <span className="block text-xs text-muted-foreground font-normal">
                          {s.send_time.slice(0, 5)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {current ? (
                          <span
                            className={`font-mono text-sm tracking-wider truncate block ${isPassed ? "text-muted-foreground/50 line-through" : "text-foreground"}`}
                          >
                            {current.passwordValue}
                          </span>
                        ) : (
                          <span className="text-xs text-destructive">
                            Belum diisi
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Beri jarak (gap-2) agar tombol tidak tumpang tindih */}
                        <div className="flex items-center justify-end gap-2">
                          {isPassed ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled
                              className="h-8 px-2 text-muted-foreground/50"
                            >
                              <Lock className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Selesai</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3"
                              onClick={() =>
                                onPick(
                                  current ?? {
                                    id: "",
                                    scheduleId: s.id,
                                    scheduleName: s.name,
                                    validDate,
                                    passwordValue: "",
                                  },
                                )
                              }
                            >
                              {current ? "Ubah" : "Isi"}
                            </Button>
                          )}

                          {current && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => onDelete(current)}
                              title="Hapus Password"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function PasswordsClient({
  schedules,
  initialToday,
  datesWithPasswords,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<{ scheduleId?: string; date?: string }>(
    {},
  );
  const [showCompleted, setShowCompleted] = useState(false);

  useRealtimeRefresh(["passwords", "schedules"]);

  // State untuk menyimpan data yang akan dihapus
  const [deleteTarget, setDeleteTarget] = useState<PasswordItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function openCreate() {
    setPreset({ date: initialToday });
    setOpen(true);
  }

  function pickItem(item: PasswordItem, fallbackDate: string) {
    setPreset({
      scheduleId: item.scheduleId,
      date: item.validDate.match(/^\d{4}-\d{2}-\d{2}$/)
        ? item.validDate
        : fallbackDate,
    });
    setOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);

    const result = await deletePasswordAction(deleteTarget.id);

    setIsDeleting(false);
    if (result.ok) {
      setDeleteTarget(null);
      router.refresh();
    } else {
      alert(result.error);
    }
  }

  const activeGroups: DateGroup[] = [];
  const completedGroups: DateGroup[] = [];

  datesWithPasswords.forEach((group) => {
    if (isDateCompleted(group.date, schedules, initialToday)) {
      completedGroups.push(group);
    } else {
      activeGroups.push(group);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-heading font-semibold tracking-tight text-foreground">
            Password
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola password grup untuk jadwal yang akan datang.
          </p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Password
        </Button>
      </div>

      {activeGroups.length === 0 && completedGroups.length === 0 ? (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Belum ada password yang diinputkan.
            </p>
            <Button onClick={openCreate} variant="outline" className="mt-4">
              Tambah Password Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeGroups.length > 0 && (
            <div className="grid gap-6">
              {activeGroups.map((group) => (
                <PasswordSection
                  key={group.date}
                  title={group.date === initialToday ? "Hari Ini" : "Mendatang"}
                  dateLabel={labelForDate(group.date)}
                  schedules={schedules}
                  passwords={group.passwords}
                  validDate={group.date}
                  onPick={(item) => pickItem(item, group.date)}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}

          {completedGroups.length > 0 && (
            <div className="pt-4 border-t border-border mt-8">
              <Button
                variant="outline"
                onClick={() => setShowCompleted(!showCompleted)}
                className="w-full flex items-center justify-between bg-secondary/30 hover:bg-secondary/60 border-border"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Archive className="h-4 w-4" />
                  <span>
                    Waktu yang sudah selesai ({completedGroups.length})
                  </span>
                </div>
                {showCompleted ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {showCompleted && (
                <div className="grid gap-6 mt-6 opacity-70 animate-in fade-in slide-in-from-top-2 duration-300">
                  {completedGroups.map((group) => (
                    <PasswordSection
                      key={group.date}
                      title="Selesai"
                      dateLabel={labelForDate(group.date)}
                      schedules={schedules}
                      passwords={group.passwords}
                      validDate={group.date}
                      onPick={(item) => pickItem(item, group.date)}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <PasswordDialog
        open={open}
        onOpenChange={setOpen}
        schedules={schedules}
        defaultScheduleId={preset.scheduleId}
        defaultDate={preset.date ?? initialToday}
        onSuccess={() => {
          setOpen(false);
          router.refresh();
        }}
      />

      {/* Alert Dialog Konfirmasi Hapus */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Password?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus password untuk jadwal{" "}
              <strong>{deleteTarget?.scheduleName}</strong> pada tanggal{" "}
              <strong>
                {deleteTarget && labelForDate(deleteTarget.validDate)}
              </strong>
              ? Tindakan ini tidak dapat dibatalkan.
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

// ... (Bagian PasswordDialog tetap sama persis seperti kode sebelumnya) ...
function PasswordDialog({
  open,
  onOpenChange,
  schedules,
  defaultScheduleId,
  defaultDate,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedules: ScheduleOption[];
  defaultScheduleId?: string;
  defaultDate: string;
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
    defaultValues: {
      scheduleId: defaultScheduleId ?? schedules[0]?.id ?? "",
      validDate: defaultDate,
      passwordValue: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      scheduleId: defaultScheduleId ?? schedules[0]?.id ?? "",
      validDate: defaultDate,
      passwordValue: "",
    });
  }, [open, defaultScheduleId, defaultDate, schedules, reset]);

  async function onSubmit(values: FormValues) {
    const result = await setPasswordAction(values);
    if (!result.ok) {
      setError("root", { message: result.error });
      return;
    }
    reset();
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
            <DialogTitle className="text-base">
              Tambah / Ubah Password
            </DialogTitle>
            <DialogDescription>
              Password lama pada jadwal ini akan diganti.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <label
              htmlFor="scheduleId"
              className="text-xs font-medium text-muted-foreground"
            >
              Jadwal
            </label>
            <select
              id="scheduleId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              {...register("scheduleId")}
              disabled={isSubmitting || schedules.length === 0}
            >
              <option value="">Pilih jadwal</option>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.scheduleId && (
              <p className="text-xs text-destructive">
                {errors.scheduleId.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="validDate"
              className="text-xs font-medium text-muted-foreground"
            >
              Tanggal
            </label>
            <input
              id="validDate"
              type="date"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              {...register("validDate")}
              disabled={isSubmitting}
            />
            {errors.validDate && (
              <p className="text-xs text-destructive">
                {errors.validDate.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="passwordValue"
              className="text-xs font-medium text-muted-foreground"
            >
              Password
            </label>
            <input
              id="passwordValue"
              type="text"
              placeholder="Password grup"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 font-mono text-sm tracking-wider shadow-sm transition-colors placeholder:font-sans placeholder:tracking-normal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              {...register("passwordValue")}
              disabled={isSubmitting}
            />
            {errors.passwordValue && (
              <p className="text-xs text-destructive">
                {errors.passwordValue.message}
              </p>
            )}
          </div>

          {errors.root && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {errors.root.message}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || schedules.length === 0}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
