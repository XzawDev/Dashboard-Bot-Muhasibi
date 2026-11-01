"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MobileNav } from "@/components/layout/mobile-nav";
import { createClient } from "@/lib/supabase/client";
import { LiveClock } from "@/components/layout/live-clock";

function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleSignOut}
      aria-label="Keluar"
      className="text-muted-foreground hover:text-foreground shrink-0"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}

export function Topbar({
  userEmail,
  role,
}: {
  userEmail: string;
  role: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background px-4 lg:px-8">
      <Sheet open={open} onOpenChange={setOpen}>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0"
          aria-label="Buka menu"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <SheetContent
          side="left"
          className="w-72 border-border bg-background p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Menu navigasi</SheetTitle>
          </SheetHeader>
          <MobileNav role={role} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Spacer agar jam dan tombol logout didorong ke kanan */}
      <div className="flex-1" />

      {/* JAM WIB - Muncul di semua ukuran layar */}
      <div className="mr-1 sm:mr-2 shrink-0">
        <LiveClock />
      </div>

      {/* Garis Pemisah - Hanya muncul di Desktop/Tablet */}
      <div className="h-4 w-px bg-border mx-1 hidden sm:block shrink-0" />

      {/* Email - Disembunyikan di HP agar tidak sesak, muncul di Tablet ke atas */}
      <span className="hidden max-w-55 truncate text-xs font-medium text-muted-foreground sm:block shrink-0">
        {userEmail}
      </span>

      <SignOutButton />
    </header>
  );
}
