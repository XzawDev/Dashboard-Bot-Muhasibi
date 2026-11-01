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
      className="text-muted-foreground hover:text-foreground"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}

export function Topbar({ userEmail }: { userEmail: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background px-4 lg:px-8">
      <Sheet open={open} onOpenChange={setOpen}>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
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
          <MobileNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      <span className="hidden max-w-55 truncate text-xs text-muted-foreground sm:block">
        {userEmail}
      </span>

      <SignOutButton />
    </header>
  );
}