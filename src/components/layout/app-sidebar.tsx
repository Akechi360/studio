
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
import { LogOut, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { APP_NAME } from "@/lib/constants";
import Link from "next/link";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { state: sidebarState } = useSidebar();

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r">
      <SidebarHeader className="p-4">
         <Link href="/dashboard" className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ticket-check text-primary"><path d="M4 20V10a4 4 0 0 1 4-4h1.5a2.5 2.5 0 0 0 0-5A1.5 1.5 0 0 0 8 2.5V2"/><path d="M20 20V10a4 4 0 0 0-4-4H8.5a2.5 2.5 0 0 1 0-5A1.5 1.5 0 0 1 16 2.5V2"/><path d="m9 12 2 2 4-4"/></svg>
          {sidebarState === "expanded" && <span className="text-xl font-semibold">{APP_NAME}</span>}
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
            {/* Placeholder for user avatar or settings icon - adjust as needed */}
          </div>
        )}
        <Button variant="ghost" onClick={logout} className={`w-full justify-start ${sidebarState === "collapsed" ? "px-2" : ""}`}>
          <LogOut className="mr-2 h-4 w-4" />
          {sidebarState === "expanded" && <span>Logout</span>}
          {sidebarState === "collapsed" && <span className="sr-only">Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
