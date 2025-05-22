
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
  Users,
  Settings,
  HelpCircle,
  Archive,
  BarChartBig, 
  ClipboardList, 
  ScreenShare, // Icono para Acceso Remoto
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
      { href: "/tickets", label: "Todos los Tickets", icon: Ticket, exact: true }, // Cambiado icono para diferenciar
      { href: "/tickets/new", label: "Nuevo Ticket", icon: PlusCircle, exact: true },
    ]
  },
  { href: "/inventory", label: "Inventario", icon: Archive, exact: true, allowedRoles: ["Admin"] },
  { href: "/remote-access", label: "Acceso Remoto", icon: ScreenShare, exact: true }, 
  { href: "/profile", label: "Perfil", icon: User, exact: true },
  { 
    href: "#", 
    label: "Administración", 
    icon: Settings, 
    allowedRoles: ["Admin"],
    subItems: [
      { href: "/admin/users", label: "Usuarios", icon: Users, allowedRoles: ["Admin"], exact: true },
      { href: "/admin/analytics", label: "Analíticas", icon: BarChartBig, allowedRoles: ["Admin"], exact: true },
      { href: "/admin/audit", label: "Auditoría", icon: ClipboardList, allowedRoles: ["Admin"], exact: true },
      { href: "/settings", label: "Configuración App", icon: Settings, allowedRoles: ["Admin"], exact: true }, 
    ]
  },
  { href: "/help", label: "Ayuda y FAQ", icon: HelpCircle, exact: true },
];

export function AppSidebarNav() {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();
  const { user } = useAuth(); 

  const isItemActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    // Para el item "Administración", consideramos activo si alguna de sus subrutas está activa
    if (item.subItems) {
      return item.subItems.some(sub => pathname.startsWith(sub.href));
    }
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

        const WrapperComponent = item.subItems && item.href === "#" ? 'div' : Link;
        const wrapperProps = item.subItems && item.href === "#" ? {} : { href: item.href, passHref: true, legacyBehavior: true };


        return (
          <SidebarMenuItem key={item.label}>
            <WrapperComponent {...wrapperProps}>
              <SidebarMenuButton
                isActive={isActive}
                tooltip={{ children: item.label, hidden: sidebarState === "expanded" }}
                aria-current={isActive ? "page" : undefined}
                className={item.subItems && item.href === "#" ? "cursor-default hover:bg-transparent dark:hover:bg-transparent hover:text-sidebar-foreground dark:hover:text-sidebar-foreground" : ""}
              >
                <Icon className="shrink-0" />
                <span className={sidebarState === "collapsed" ? "sr-only" : ""}>
                  {item.label}
                </span>
              </SidebarMenuButton>
            </WrapperComponent>
            {item.subItems && item.subItems.length > 0 && (
              <SidebarMenuSub
                className={sidebarState === "collapsed" ? "hidden" : ""}
              >
                {item.subItems.map((subItem) => {
                  if (subItem.allowedRoles && user?.role && !subItem.allowedRoles.includes(user.role)) {
                    return null;
                  }
                  const SubIcon = subItem.icon;
                  const isSubItemActive = pathname === subItem.href; 
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
