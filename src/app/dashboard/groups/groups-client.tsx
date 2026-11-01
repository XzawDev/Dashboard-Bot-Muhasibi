"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Search,
  ShieldOff,
  Plus,
  Lock,
  Unlock,
  KeyRound,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { toggleGroupWhitelist, verifyGroupsPagePassword } from "./actions";
import type { GroupRow } from "@/types/db";
import { useRealtimeRefresh } from "@/lib/hooks/use-realtime-refresh";

export function GroupsClient({ initialGroups }: { initialGroups: GroupRow[] }) {
  const router = useRouter();
  const [groups, setGroups] = useState(initialGroups);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // STATE KEAMANAN HALAMAN
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pagePassword, setPagePassword] = useState("");
  const [pageError, setPageError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // STATE MODAL & AKSI
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchAvailable, setSearchAvailable] = useState("");
  const [removeTarget, setRemoveTarget] = useState<GroupRow | null>(null);
  const [password, setPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Sinkronkan state saat props berubah (dari router.refresh())
  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  // Berlangganan realtime
  useRealtimeRefresh(["whatsapp_groups"]);

  // --- LOGIKA BUKA KUNCI HALAMAN ---
  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setIsVerifying(true);
    setPageError("");

    const result = await verifyGroupsPagePassword(pagePassword);

    setIsVerifying(false);
    if (result.ok) {
      setIsUnlocked(true);
      setPagePassword(""); // bersihkan input
    } else {
      setPageError(result.error ?? "Verifikasi gagal.");
    }
  }

  // --- LOGIKA DATA ---
  const whitelistedGroups = groups.filter((g) => g.is_active);
  const availableGroups = groups.filter((g) => !g.is_active && g.is_joined);
  const filteredAvailable = availableGroups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchAvailable.toLowerCase()) ||
      g.group_jid.toLowerCase().includes(searchAvailable.toLowerCase()),
  );

  function handleRefresh() {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  }

  async function handleSubmit(action: "add" | "remove", group: GroupRow) {
    if (!password) {
      setErrorMsg("Password otorisasi wajib diisi.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg("");
    const result = await toggleGroupWhitelist(
      group.id,
      action === "add",
      password,
    );

    setIsProcessing(false);
    if (!result.ok) {
      setErrorMsg(result.error);
    } else {
      setPassword("");
      setIsAddOpen(false);
      setRemoveTarget(null);
      router.refresh();
    }
  }

  // --- TAMPILAN JIKA TERKUNCI ---
  if (!isUnlocked) {
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center">
        {/* Background Blur Palsu */}
        <div className="absolute inset-0 overflow-hidden rounded-xl border border-border bg-card/30 backdrop-blur-sm pointer-events-none opacity-50 z-0 flex flex-col p-6 space-y-4">
          <div className="h-8 w-1/3 bg-muted rounded"></div>
          <div className="h-4 w-1/2 bg-muted rounded"></div>
          <div className="h-32 w-full bg-muted rounded"></div>
          <div className="h-32 w-full bg-muted rounded"></div>
        </div>

        {/* Kotak Sandi */}
        <Card className="z-10 w-full max-w-sm bg-background/95 backdrop-blur shadow-xl border-border">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
              <Lock className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">Halaman Terkunci</CardTitle>
            <CardDescription>
              Otorisasi diperlukan untuk mengakses manajemen grup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUnlock} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Input
                  type="password"
                  placeholder="Masukkan Sandi Halaman..."
                  value={pagePassword}
                  onChange={(e) => setPagePassword(e.target.value)}
                  autoFocus
                />
                {pageError && (
                  <p className="text-xs text-destructive">{pageError}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isVerifying || !pagePassword}
              >
                {isVerifying ? (
                  "Memverifikasi..."
                ) : (
                  <>
                    <Unlock className="mr-2 h-4 w-4" /> Buka Kunci
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- TAMPILAN JIKA SUDAH DIBUKA ---
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-heading font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Unlock className="h-5 w-5 text-emerald-500" />
            Grup WhatsApp
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Daftar grup yang diizinkan menerima pesan bot.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={() => {
              setIsAddOpen(true);
              setPassword("");
              setErrorMsg("");
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Grup
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground">
            Grup Terdaftar (Whitelist)
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Bot hanya akan mengirim password ke grup di daftar ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[45%] text-muted-foreground pl-6">
                    Nama & JID
                  </TableHead>
                  <TableHead className="w-[20%] text-center text-muted-foreground">
                    Status Bot
                  </TableHead>
                  <TableHead className="w-[20%] text-right text-muted-foreground">
                    Terakhir Sync
                  </TableHead>
                  <TableHead className="w-[15%] text-right text-muted-foreground pr-6">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {whitelistedGroups.length === 0 ? (
                  <TableRow className="border-border hover:bg-transparent">
                    <TableCell
                      colSpan={4}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      <Users className="mx-auto h-8 w-8 mb-3 opacity-20" />
                      Belum ada grup yang di-whitelist.
                    </TableCell>
                  </TableRow>
                ) : (
                  whitelistedGroups.map((group) => (
                    <TableRow
                      key={group.id}
                      className="border-border hover:bg-muted/50"
                    >
                      <TableCell className="pl-6">
                        <div className="font-medium text-foreground truncate">
                          {group.name}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                          {group.group_jid}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {group.is_joined ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Join
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-destructive/30 text-destructive bg-destructive/10"
                          >
                            <XCircle className="mr-1 h-3 w-3" /> Keluar
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {group.synced_at
                          ? format(new Date(group.synced_at), "dd MMM HH:mm", {
                              locale: localeId,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => {
                            setRemoveTarget(group);
                            setPassword("");
                            setErrorMsg("");
                          }}
                        >
                          <ShieldOff className="h-3.5 w-3.5 mr-1.5" />
                          Hapus
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL 1: Tambah Grup */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pilih Grup untuk Di-whitelist</DialogTitle>
            <DialogDescription>
              Grup di bawah ini adalah grup di mana bot sudah bergabung tetapi
              belum diizinkan mengirim pesan.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari grup..."
              value={searchAvailable}
              onChange={(e) => setSearchAvailable(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto border border-border rounded-md">
            {filteredAvailable.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Tidak ada grup tersedia.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredAvailable.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/50"
                  >
                    <div className="overflow-hidden">
                      <div className="font-medium text-sm truncate">
                        {group.name}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        {group.group_jid}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSubmit("add", group)}
                      disabled={isProcessing}
                      className="ml-4 shrink-0"
                    >
                      Pilih
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-3 pt-4 border-t border-border mt-2">
            <div className="space-y-2 w-full">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <KeyRound className="h-3 w-3" /> Password Otorisasi Whitelist
              </label>
              <Input
                type="password"
                placeholder="Masukkan password khusus..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errorMsg && (
                <p className="text-xs text-destructive">{errorMsg}</p>
              )}
            </div>
            <Button
              variant="ghost"
              onClick={() => setIsAddOpen(false)}
              className="w-full"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Hapus dari Whitelist */}
      <Dialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <DialogContent className="sm:max-w-md border-destructive/20">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <ShieldOff className="h-5 w-5" /> Hapus dari Whitelist
            </DialogTitle>
            <DialogDescription>
              Bot akan berhenti mengirim pesan ke grup berikut:
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md bg-muted p-3 font-mono text-sm border border-border">
            <div className="font-bold text-foreground">
              {removeTarget?.name}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {removeTarget?.group_jid}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <KeyRound className="h-3 w-3" /> Password Otorisasi Whitelist
            </label>
            <Input
              type="password"
              placeholder="Masukkan password khusus..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                removeTarget && handleSubmit("remove", removeTarget)
              }
              disabled={isProcessing}
            >
              {isProcessing ? "Memproses..." : "Ya, Hapus Grup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
