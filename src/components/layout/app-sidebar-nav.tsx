
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
  ScreenShare,
  CalendarDays,
  ChevronRight,
  FileCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { Role, User as UserType } from "@/lib/types"; // Import UserType
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  allowedRoles?: Role[];
  subItems?: NavItem[];
  exact?: boolean;
  specialAccessCheck?: (user: UserType | null) => boolean; // For specific user access
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { 
    href: "#tickets-toggle", 
    label: "Tickets", 
    icon: Ticket,
    subItems: [
      { href: "/tickets", label: "Todos los Tickets", icon: Ticket, exact: true },
      { href: "/tickets/new", label: "Nuevo Ticket", icon: PlusCircle, exact: true },
    ]
  },
  { 
    href: "/approvals", 
    label: "Aprobaciones", 
    icon: FileCheck, 
    exact: true,
    specialAccessCheck: (currentUser) => 
      currentUser?.role === "Admin" || currentUser?.email === "presidente@clinicaieq.com",
  },
  { href: "/inventory", label: "Inventario", icon: Archive, exact: true, allowedRoles: ["Admin"] },
  { href: "/agenda-it", label: "Agenda IT", icon: CalendarDays, exact: true },
  { href: "/remote-access", label: "Acceso Remoto", icon: ScreenShare, exact: true }, 
  { href: "/profile", label: "Perfil", icon: User, exact: true },
  { 
    href: "#admin-toggle", 
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
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const newOpenStates: Record<string, boolean> = {};
    let pathChanged = false;
    navItems.forEach(item => {
      if (item.subItems && item.subItems.length > 0) {
        const isParentActiveDueToChild = item.subItems.some(
          subItem => {
            const subItemPath = subItem.href.endsWith('/') ? subItem.href.slice(0, -1) : subItem.href;
            const currentPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
            return currentPath === subItemPath || currentPath.startsWith(subItemPath + '/');
          }
        );
        const currentOpenState = openStates[item.label] || false;
        if (isParentActiveDueToChild && !currentOpenState) {
          newOpenStates[item.label] = true;
          pathChanged = true;
        } else if (!isParentActiveDueToChild && currentOpenState && !openStates[item.label]) {
          // This case might not be strictly necessary if we only open on child active
        } else {
          newOpenStates[item.label] = currentOpenState;
        }
      }
    });
    if (pathChanged || Object.keys(newOpenStates).length !== Object.keys(openStates).length) {
       setOpenStates(prev => ({...prev, ...newOpenStates}));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleToggle = (label: string) => {
    setOpenStates(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        // Role-based access
        if (item.allowedRoles && user?.role && !item.allowedRoles.includes(user.role)) {
          return null;
        }
        // Special access check (for Presidente and Aprobaciones)
        if (item.specialAccessCheck && !item.specialAccessCheck(user)) {
          return null;
        }

        const Icon = item.icon;
        const isSectionOpen = !!openStates[item.label];

        if (item.subItems && item.subItems.length > 0) {
          const isAnySubItemActive = item.subItems.some(subItem => {
             const subItemPath = subItem.href.endsWith('/') ? subItem.href.slice(0, -1) : subItem.href;
             const currentPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
             return currentPath === subItemPath || currentPath.startsWith(subItemPath + '/');
          });
          
          return (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                onClick={() => handleToggle(item.label)}
                isActive={isAnySubItemActive && isSectionOpen}
                tooltip={{ children: item.label, hidden: sidebarState === "expanded" }}
                aria-expanded={isSectionOpen}
                className="justify-between w-full cursor-default" 
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Icon className="shrink-0" />
                  <span className={cn("truncate", sidebarState === "collapsed" ? "sr-only" : "")}>
                    {item.label}
                  </span>
                </div>
                {sidebarState === "expanded" && (
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200 text-muted-foreground",
                      isSectionOpen && "rotate-90"
                    )}
                  />
                )}
              </SidebarMenuButton>
              {isSectionOpen && sidebarState === "expanded" && (
                <SidebarMenuSub
                  className={cn(sidebarState === "collapsed" ? "hidden" : "", "pl-2")}
                >
                  {item.subItems.map((subItem) => {
                    if (subItem.allowedRoles && user?.role && !subItem.allowedRoles.includes(user.role)) {
                      return null;
                    }
                    const SubIcon = subItem.icon;
                    const subItemPath = subItem.href.endsWith('/') ? subItem.href.slice(0, -1) : subItem.href;
                    const currentPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
                    const isSubItemActive = currentPath === subItemPath || (subItemPath !== '/' && currentPath.startsWith(subItemPath + '/'));
                    
                    return (
                      <SidebarMenuSubItem key={subItem.href}>
                        <Link href={subItem.href} passHref legacyBehavior>
                          <SidebarMenuSubButton
                            isActive={isSubItemActive}
                            aria-current={isSubItemActive ? "page" : undefined}
                          >
                            <SubIcon className="shrink-0" />
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
        } else {
          const itemPath = item.href.endsWith('/') ? item.href.slice(0, -1) : item.href;
          const currentPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
          const isActive = item.exact ? currentPath === itemPath : currentPath.startsWith(itemPath);
          return (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={{ children: item.label, hidden: sidebarState === "expanded" }}
                  aria-current={isActive ? "page" : undefined}
                  className="w-full"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Icon className="shrink-0" />
                    <span className={cn("truncate", sidebarState === "collapsed" ? "sr-only" : "")}>
                      {item.label}
                    </span>
                  </div>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          );
        }
      })}
    </SidebarMenu>
  );
}

