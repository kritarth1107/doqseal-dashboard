import {
  LayoutDashboard,
  HardDrive,
  Brain,
  FolderKanban,
  BarChart3,
  History,
  ShieldCheck,
  Building2,
  Users,
  Key,
  Gauge,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export type NavGroup = {
  label?: string;
  items: NavItem[];
};

/** Primary sidebar navigation for DoqSeal B2B workspace */
export const navGroups: NavGroup[] = [
  {
    items: [{ name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" }],
  },
  {
    label: "Workspace",
    items: [
      { name: "Document Drive", icon: HardDrive, href: "/drive" },
      { name: "AI Intelligence", icon: Brain, href: "/intelligence" },
      { name: "Projects", icon: FolderKanban, href: "/projects" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { name: "Usage", icon: BarChart3, href: "/analytics/usage" },
      { name: "Audit logs", icon: History, href: "/analytics/audit-logs" },
      { name: "Compliance", icon: ShieldCheck, href: "/analytics/compliance" },
    ],
  },
  {
    label: "Organisation",
    items: [
      { name: "Overview", icon: Building2, href: "/manage/organisation" },
      { name: "Members & access", icon: Users, href: "/manage/members" },
      { name: "API keys", icon: Key, href: "/manage/api-keys" },
      { name: "Limits & quotas", icon: Gauge, href: "/manage/limits" },
      { name: "Settings", icon: Settings, href: "/settings" },
    ],
  },
];
