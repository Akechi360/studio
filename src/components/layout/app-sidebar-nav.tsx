
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  User,
  FileText,
  Users,
  Settings,
  BarChart3,
  HelpCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  allowedRoles?: Role[];
  subItems?: NavItem[];
  exact?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { 
    href: "/tickets", 
    label: "Tickets", 
    icon: Ticket,
    subItems: [
      { href: "/tickets", label: "All Tickets", icon: FileText, exact: true },
      { href: "/tickets/new", label: "New Ticket", icon: PlusCircle, exact: true },
    ]
  },
  { href: "/profile", label: "Profile", icon: User, exact: true },
  { href: "/admin/users", label: "User Management", icon: Users, allowedRoles: ["Admin"], exact: true },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, allowedRoles: ["Admin"], exact: true },
  { href: "/settings", label: "Settings", icon: Settings, exact: true },
  { href: "/help", label: "Help & FAQ", icon: HelpCircle, exact: true },
];

export function AppSidebarNav() {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();
  const { role } = useAuth();

  const isItemActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        if (item.allowedRoles && role && !item.allowedRoles.includes(role)) {
          return null;
        }

        const Icon = item.icon;
        const isActive = isItemActive(item);

        return (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton
                isActive={isActive}
                tooltip={{ children: item.label, hidden: sidebarState === "expanded" }}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="shrink-0" />
                <span className={sidebarState === "collapsed" ? "sr-only" : ""}>
                  {item.label}
                </span>
              </SidebarMenuButton>
            </Link>
            {item.subItems && item.subItems.length > 0 && (
              <SidebarMenuSub
                className={sidebarState === "collapsed" ? "hidden" : ""}
              >
                {item.subItems.map((subItem) => {
                  if (subItem.allowedRoles && role && !subItem.allowedRoles.includes(role)) {
                    return null;
                  }
                  const SubIcon = subItem.icon;
                  const isSubItemActive = isItemActive(subItem);
                  return (
                    <SidebarMenuSubItem key={subItem.href}>
                      <Link href={subItem.href} passHref legacyBehavior>
                        <SidebarMenuSubButton
                          isActive={isSubItemActive}
                          aria-current={isSubItemActive ? "page" : undefined}
                        >
                          <SubIcon className="shrink-0 text-sidebar-accent" />
                          {subItem.label}
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            )}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
