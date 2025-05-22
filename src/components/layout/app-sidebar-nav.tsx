
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
  ChevronRight, // Added for accordion arrow
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/types";
import React, { useState, useEffect } from "react"; // Added useState, useEffect
import { cn } from "@/lib/utils"; // Added cn for utility

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
    href: "#tickets-toggle", // Changed href to indicate it's a toggle
    label: "Tickets", 
    icon: Ticket,
    subItems: [
      { href: "/tickets", label: "Todos los Tickets", icon: Ticket, exact: true },
      { href: "/tickets/new", label: "Nuevo Ticket", icon: PlusCircle, exact: true },
    ]
  },
  { href: "/inventory", label: "Inventario", icon: Archive, exact: true, allowedRoles: ["Admin"] },
  { href: "/agenda-it", label: "Agenda IT", icon: CalendarDays, exact: true },
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
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});

  // Effect to open parent section if a sub-item is active on page load/navigation
  useEffect(() => {
    const newOpenStates: Record<string, boolean> = {};
    navItems.forEach(item => {
      if (item.subItems && item.subItems.length > 0) {
        const isParentActiveDueToChild = item.subItems.some(
          subItem => pathname === subItem.href || pathname.startsWith(subItem.href + (subItem.href.endsWith('/') ? '' : '/'))
        );
        // Preserve already manually opened states unless a child makes it active
        newOpenStates[item.label] = openStates[item.label] || isParentActiveDueToChild;
      }
    });
     // Only update if there's a change to prevent potential loops,
     // though with [pathname] dependency it should be fine.
    if (JSON.stringify(newOpenStates) !== JSON.stringify(openStates)) {
        setOpenStates(newOpenStates);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // navItems is static

  const handleToggle = (label: string) => {
    setOpenStates(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        if (item.allowedRoles && user?.role && !item.allowedRoles.includes(user.role)) {
          return null;
        }

        const Icon = item.icon;
        const isSectionOpen = !!openStates[item.label];

        if (item.subItems && item.subItems.length > 0) {
          // This is a parent item that should be a toggle
          const isAnySubItemActive = item.subItems.some(subItem => pathname === subItem.href || pathname.startsWith(subItem.href + (subItem.href.endsWith('/') ? '' : '/')));
          
          return (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                onClick={() => handleToggle(item.label)}
                isActive={isAnySubItemActive && isSectionOpen} // Active if a sub-item is active AND section is open for consistent styling
                tooltip={{ children: item.label, hidden: sidebarState === "expanded" }}
                aria-expanded={isSectionOpen}
                className="justify-between w-full" // Ensure button takes full width for justify-between
              >
                <div className="flex items-center gap-2 overflow-hidden"> {/* Group icon and label */}
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
                  className={cn(sidebarState === "collapsed" ? "hidden" : "", "pl-2") } // Added some padding left for sub-menu
                >
                  {item.subItems.map((subItem) => {
                    if (subItem.allowedRoles && user?.role && !subItem.allowedRoles.includes(user.role)) {
                      return null;
                    }
                    const SubIcon = subItem.icon;
                    const isSubItemActive = pathname === subItem.href || (subItem.href !== '/' && pathname.startsWith(subItem.href + '/'));
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
        } else {
          // This is a regular item without sub-items
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
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
