import Link from "next/link";
import { addDays, endOfDay, format, startOfDay } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  KeyRound,
  Wifi,
  WifiOff,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  BotStatusRow,
  DeliveryLogRow,
  NotificationLogRow,
  PasswordRow,
  ScheduleRow,
} from "@/types/db";

export const dynamic = "force-dynamic";

function getNextSchedule(schedules: ScheduleRow[], now: Date) {
  const sorted = [...schedules].sort((a, b) =>
    a.send_time.localeCompare(b.send_time),
  );
  const currentTime = format(now, "HH:mm:ss");
  const todaySchedule = sorted.find((item) => item.send_time > currentTime);

  if (todaySchedule) {
    return { ...todaySchedule, dateLabel: "Hari ini" };
  }
  const tomorrowSchedule = sorted[0];
  if (!tomorrowSchedule) return null;
  return { ...tomorrowSchedule, dateLabel: "Besok" };
}

function statusBadgeClass(status: string) {
  if (status === "sent" || status === "success") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-500";
  }
  if (status === "failed" || status === "error") {
    return "border-destructive/20 bg-destructive/10 text-destructive";
  }
  return "border-muted bg-muted text-muted-foreground";
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const now = new Date();

  const today = format(now, "yyyy-MM-dd");
  const tomorrow = format(addDays(now, 1), "yyyy-MM-dd");
  const startOfToday = startOfDay(now).toISOString();
  const endOfToday = endOfDay(now).toISOString();

  const [
    botResult,
    schedulesResult,
    passwordsResult,
    sentResult,
    failedResult,
    deliveryRecentResult,
    notificationRecentResult,
  ] = await Promise.all([
    supabase
      .from("bot_status")
      .select("*")
      .order("last_heartbeat_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("schedules")
      .select("id, code, name, send_time, is_active")
      .eq("is_active", true)
      .order("send_time", { ascending: true }),
    supabase
      .from("passwords")
      .select("id, schedule_id, valid_date, is_current, schedules(name, code)")
      .in("valid_date", [today, tomorrow])
      .eq("is_current", true),
    supabase
      .from("delivery_logs")
      .select("*", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("sent_at", startOfToday)
      .lte("sent_at", endOfToday),
    supabase
      .from("delivery_logs")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("sent_at", startOfToday)
      .lte("sent_at", endOfToday),
    supabase
      .from("delivery_logs")
      .select("id, status, error_message, sent_at, group_id, schedule_id")
      .order("sent_at", { ascending: false, nullsFirst: false })
      .limit(5),
    supabase
      .from("notification_logs")
      .select("id, status, recipient_jid, schedule_id")
      .order("id", { ascending: false })
      .limit(5),
  ]);

  const bot = botResult.data as BotStatusRow | null;
  const schedules = (schedulesResult.data ?? []) as ScheduleRow[];
  const passwords = (passwordsResult.data ?? []) as PasswordRow[];

  const isBotConnected = bot?.status === "connected";
  const nextSchedule = getNextSchedule(schedules, now);

  const missingPasswordLabels = schedules
    .flatMap((schedule) => {
      const hasToday = passwords.some(
        (p) =>
          p.schedule_id === schedule.id &&
          p.valid_date === today &&
          p.is_current,
      );
      const hasTomorrow = passwords.some(
        (p) =>
          p.schedule_id === schedule.id &&
          p.valid_date === tomorrow &&
          p.is_current,
      );
      return [
        !hasToday ? `${schedule.name} hari ini` : null,
        !hasTomorrow ? `${schedule.name} besok` : null,
      ];
    })
    .filter(Boolean) as string[];

  const sentCount = sentResult.count ?? 0;
  const failedCount = failedResult.count ?? 0;

  const recentLogs = [
    ...((deliveryRecentResult.data ?? []) as DeliveryLogRow[]).map((log) => ({
      key: `delivery-${log.id}`,
      type: "Delivery",
      status: log.status,
      detail:
        log.error_message ??
        (log.status === "sent" ? "Pesan terkirim" : "Pengiriman pesan"),
      at: log.sent_at,
    })),
    ...((notificationRecentResult.data ?? []) as NotificationLogRow[]).map(
      (log) => ({
        key: `notification-${log.id}`,
        type: "Notifikasi",
        status: log.status,
        detail: log.recipient_jid ?? "Notifikasi",
        at: null,
      }),
    ),
  ]
    .sort(
      (a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pantau status bot dan ringkasan operasional Mahad Reminder.
        </p>
      </div>

      {/* Alert yang lebih clean (tidak coklat kusam) */}
      {(!isBotConnected || missingPasswordLabels.length > 0) && (
        <Alert
          variant="destructive"
          className="border-red-500/20 bg-red-500/10 text-red-400"
        >
          <AlertTriangle className="h-4 w-4 !text-red-500" />
          <AlertTitle>Perlu Tindakan</AlertTitle>
          <AlertDescription className="mt-2 text-red-400/90">
            <ul className="list-disc space-y-1 pl-4 text-sm">
              {!isBotConnected ? (
                <li>
                  Bot WhatsApp terputus{" "}
                  {bot?.last_disconnect_reason
                    ? `(${bot.last_disconnect_reason})`
                    : ""}
                  .
                </li>
              ) : null}
              {missingPasswordLabels.length > 0 ? (
                <li>
                  Password belum diisi: {missingPasswordLabels.join(", ")}.
                </li>
              ) : null}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Stat Cards: Lebih tegas dan modern */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status Bot
            </CardTitle>
            <Wifi
              className={cn(
                "h-4 w-4",
                isBotConnected ? "text-emerald-500" : "text-red-500",
              )}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {isBotConnected ? "Connected" : "Disconnected"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {bot?.last_heartbeat_at
                ? format(new Date(bot.last_heartbeat_at), "dd MMM HH:mm", {
                    locale: localeId,
                  })
                : "Belum ada heartbeat"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pesan Terkirim
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{sentCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Hari ini</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pesan Gagal
            </CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {failedCount}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Hari ini</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jadwal Aktif
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {schedules.length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Jadwal pengiriman
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Next Schedule */}
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Jadwal Berikutnya</CardTitle>
          </CardHeader>
          <CardContent>
            {nextSchedule ? (
              <div className="flex flex-col gap-4">
                <div>
                  <div className="text-3xl font-heading font-bold tracking-tight text-primary">
                    {nextSchedule.name}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {nextSchedule.dateLabel}, Pukul{" "}
                    {nextSchedule.send_time.slice(0, 5)}
                  </p>
                </div>
                <Button
                  render={<Link href="/dashboard/schedules" />}
                  variant="outline"
                  className="w-full"
                >
                  Kelola Jadwal <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Belum ada jadwal aktif.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Kelengkapan Password */}
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Kelengkapan Password</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-bold">
                    {missingPasswordLabels.length === 0
                      ? "Lengkap"
                      : `${missingPasswordLabels.length} Kosong`}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {missingPasswordLabels.length === 0
                      ? "Siap dikirim besok."
                      : missingPasswordLabels.join(", ")}
                  </p>
                </div>
              </div>
              <Button
                render={<Link href="/dashboard/passwords" />}
                variant="outline"
                className="w-full"
              >
                Isi Password <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ringkasan Grup */}
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Grup WhatsApp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Pastikan bot tergabung dalam grup dan status grup berwarna hijau
                (aktif) agar pesan dapat terkirim.
              </p>
              <Button
                render={<Link href="/dashboard/groups" />}
                variant="outline"
                className="w-full"
              >
                Cek Status Grup <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Log Terakhir */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Log Terakhir</CardTitle>
            <CardDescription>Aktivitas pengiriman terbaru.</CardDescription>
          </div>
          <Button
            render={<Link href="/dashboard/logs" />}
            variant="ghost"
            size="sm"
          >
            Lihat Semua
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6 text-xs uppercase tracking-wider text-muted-foreground">
                  Tipe
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                  Detail
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="pr-6 text-right text-xs uppercase tracking-wider text-muted-foreground">
                  Waktu
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Belum ada log aktivitas.
                  </TableCell>
                </TableRow>
              ) : (
                recentLogs.map((log) => (
                  <TableRow key={log.key}>
                    <TableCell className="pl-6 font-medium">
                      {log.type}
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate text-muted-foreground">
                      {log.detail}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusBadgeClass(log.status)}
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right text-muted-foreground">
                      {log.at
                        ? format(new Date(log.at), "dd MMM HH:mm", {
                            locale: localeId,
                          })
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
