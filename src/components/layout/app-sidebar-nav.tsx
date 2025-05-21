
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
  HelpCircle,
  Archive // Icono para Inventario
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
  { href: "/dashboard", label: "Panel de Control", icon: LayoutDashboard, exact: true },
  { 
    href: "/tickets", 
    label: "Tickets", 
    icon: Ticket,
    subItems: [
      { href: "/tickets", label: "Todos los Tickets", icon: FileText, exact: true },
      { href: "/tickets/new", label: "Nuevo Ticket", icon: PlusCircle, exact: true },
    ]
  },
  { href: "/inventory", label: "Inventario", icon: Archive, exact: true }, // Nuevo enlace de Inventario
  { href: "/profile", label: "Perfil", icon: User, exact: true },
  { href: "/admin/users", label: "Gestión de Usuarios", icon: Users, allowedRoles: ["Admin"], exact: true },
  { href: "/admin/reports", label: "Reportes", icon: BarChart3, allowedRoles: ["Admin"], exact: true },
  { href: "/settings", label: "Configuración", icon: Settings, allowedRoles: ["Admin"], exact: true },
  { href: "/help", label: "Ayuda y FAQ", icon: HelpCircle, exact: true },
];

export function AppSidebarNav() {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();
  const { user } = useAuth(); 

  const isItemActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        if (item.allowedRoles && user?.role && !item.allowedRoles.includes(user.role)) {
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
                  if (subItem.allowedRoles && user?.role && !subItem.allowedRoles.includes(user.role)) {
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
