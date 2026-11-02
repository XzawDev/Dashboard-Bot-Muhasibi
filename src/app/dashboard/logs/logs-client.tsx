"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Search,
  Filter,
  MessageSquare,
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Terminal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useRealtimeRefresh } from "@/lib/hooks/use-realtime-refresh";
import type { UnifiedLog } from "./page";

export function LogsClient({ logs }: { logs: UnifiedLog[] }) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Realtime update (tambahkan bot_activity_logs)
  useRealtimeRefresh([
    "delivery_logs",
    "notification_logs",
    "reminder_logs",
    "bot_activity_logs",
  ]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        log.target.toLowerCase().includes(search.toLowerCase()) ||
        log.detail.toLowerCase().includes(search.toLowerCase());

      const matchType = filterType === "all" || log.type === filterType;
      const matchStatus = filterStatus === "all" || log.status === filterStatus;

      return matchSearch && matchType && matchStatus;
    });
  }, [logs, search, filterType, filterStatus]);

  function getStatusBadge(status: string) {
    switch (status) {
      case "sent":
      case "success":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Sukses
          </Badge>
        );
      case "failed":
      case "error":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="mr-1 h-3 w-3" /> Gagal
          </Badge>
        );
      case "pending":
      case "sending":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            <AlertCircle className="mr-1 h-3 w-3" /> Diproses
          </Badge>
        );
      case "info":
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            Info
          </Badge>
        );
      case "blocked":
        return (
          <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">
            Diblokir
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case "delivery":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "notification":
        return <Bell className="h-4 w-4 text-amber-500" />;
      case "reminder":
        return <Clock className="h-4 w-4 text-emerald-500" />;
      case "activity":
        return <Terminal className="h-4 w-4 text-zinc-500" />; // Ikon untuk sistem
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-heading font-semibold tracking-tight text-foreground">
          Log & Riwayat
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pantau seluruh aktivitas pengiriman dan sistem bot secara real-time.
        </p>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-medium">
                Riwayat Aktivitas
              </CardTitle>
              <CardDescription>
                Menampilkan maksimal 100 log terakhir dari setiap tabel.
              </CardDescription>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari target atau pesan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-9"
                />
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1 sm:w-40">
                  <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <select
                    className="h-9 w-full appearance-none rounded-md border border-input bg-transparent pl-9 pr-8 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">Semua Tipe</option>
                    <option value="delivery">Grup (Delivery)</option>
                    <option value="notification">Notifikasi</option>
                    <option value="reminder">Pengingat</option>
                    <option value="activity">Aktivitas Bot</option>
                  </select>
                </div>

                <div className="relative flex-1 sm:w-36">
                  <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <select
                    className="h-9 w-full appearance-none rounded-md border border-input bg-transparent pl-9 pr-8 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">Semua Status</option>
                    <option value="sent">Sukses</option>
                    <option value="failed">Gagal</option>
                    <option value="pending">Pending</option>
                    <option value="info">Info Sistem</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full min-w-[750px]">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[15%] text-muted-foreground pl-6">
                    Tipe
                  </TableHead>
                  <TableHead className="w-[25%] text-muted-foreground">
                    Target / Event
                  </TableHead>
                  <TableHead className="w-[35%] text-muted-foreground">
                    Detail Pesan
                  </TableHead>
                  <TableHead className="w-[10%] text-center text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="w-[15%] text-right text-muted-foreground pr-6">
                    Waktu
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      Tidak ada log yang cocok dengan filter pencarian.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="border-border hover:bg-muted/50"
                    >
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground capitalize">
                          {getTypeIcon(log.type)}
                          {log.type === "delivery"
                            ? "Grup"
                            : log.type === "notification"
                              ? "Notifikasi"
                              : log.type === "reminder"
                                ? "Reminder"
                                : "Sistem"}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-foreground truncate text-xs">
                        {log.target}
                      </TableCell>
                      <TableCell className="text-muted-foreground truncate text-xs">
                        {log.detail}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(log.status)}
                      </TableCell>
                      <TableCell className="text-right pr-6 text-xs text-muted-foreground whitespace-nowrap">
                        {log.timestamp
                          ? format(
                              new Date(log.timestamp),
                              "dd MMM yyyy HH:mm",
                              { locale: localeId },
                            )
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
