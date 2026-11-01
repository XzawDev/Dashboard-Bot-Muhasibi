import {
  CalendarClock,
  Contact,
  KeyRound,
  LayoutDashboard,
  MessageSquareText,
  ScrollText,
  Users,
} from "lucide-react";

export const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Password",
    href: "/dashboard/passwords",
    icon: KeyRound,
  },
  {
    label: "Jadwal",
    href: "/dashboard/schedules",
    icon: CalendarClock,
  },
  {
    label: "Grup WhatsApp",
    href: "/dashboard/groups",
    icon: Users,
  },
  {
    label: "Musyrif",
    href: "/dashboard/musyrifs",
    icon: Contact,
  },
  {
    label: "Template Pesan",
    href: "/dashboard/templates",
    icon: MessageSquareText,
  },
  {
    label: "Log & Riwayat",
    href: "/dashboard/logs",
    icon: ScrollText,
  },
];