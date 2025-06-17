"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { AppSidebarNav } from "./app-sidebar-nav";
import { LogOut, Hospital } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { APP_NAME } from "@/lib/constants";
import Link from "next/link";

export function AppSidebar() {
  const { user } = useAuth();
  const { state: sidebarState } = useSidebar();

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex items-center gap-2">
            <Hospital className="h-8 w-8 text-primary"/>
            {sidebarState === "expanded" && <span className="text-xl font-semibold">{APP_NAME}</span>}
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <AppSidebarNav />
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-4">
        {user && (
          <div className={`flex items-center gap-2 ${sidebarState === "collapsed" ? "justify-center" : ""}`}>
            <a href="/api/auth/logout" className="w-full">
              <Button variant="ghost" className={`w-full justify-start ${sidebarState === "collapsed" ? "px-2" : ""}`}>
                <LogOut className="mr-2 h-4 w-4" />
                {sidebarState === "expanded" && <span>Cerrar Sesión</span>}
                {sidebarState === "collapsed" && <span className="sr-only">Cerrar Sesión</span>}
              </Button>
            </a>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
