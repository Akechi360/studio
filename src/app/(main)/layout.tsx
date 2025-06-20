"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { APP_NAME } from "@/lib/constants";
import { Hospital, Menu, BellRing } from "lucide-react";
import { AppSidebarNav } from "@/components/layout/app-sidebar-nav";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeProvider } from "next-themes";
import { Loading } from "@/components/ui/loading";

// Utilidad para obtener iniciales
function getInitials(name?: string) {
  if (!name) return "??";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

function UserSidebarFooter({ user }: { user: any }) {
  const { state } = useSidebar();
  return (
    <div className={cn("flex items-center gap-2", state === "collapsed" ? "justify-center" : "")}> 
      <Avatar className="h-9 w-9">
        <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name} />
        <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
      </Avatar>
      <div className={cn(
        "flex flex-col min-w-0",
        "group-data-[collapsible=icon]:hidden group-data-[collapsible=offcanvas]:group-data-[state=collapsed]:hidden"
      )}>
        <span className="truncate font-medium text-sm">{user?.name}</span>
        <span className="truncate text-xs text-muted-foreground">{user?.role}</span>
      </div>
    </div>
  );
}

function UserSheetFooter({ user }: { user: any }) {
  return (
    <div className="flex items-center gap-2 min-h-[64px]">
      <Avatar className="h-9 w-9">
        <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name} />
        <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <span className="truncate font-medium text-sm">{user?.name}</span>
        <span className="truncate text-xs text-muted-foreground">{user?.role}</span>
      </div>
    </div>
  );
}

function InnerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { state: sidebarState } = useSidebar();
  const isMobile = useIsMobile();
  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/api/auth/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <Loading message="Autenticando..." variant="circles" size="md" className="min-h-screen" />;
  }

  // Cabecera principal
  const MainHeader = (
    <header className="sticky top-0 z-30 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex h-16 items-center px-4 gap-2">
        {/* Trigger escritorio */}
        <SidebarTrigger className="hidden md:inline-flex mr-2" />
        {/* Marca dinámica */}
        {!isMobile && sidebarState === "collapsed" && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Hospital className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold">{APP_NAME}</span>
          </Link>
        )}
        <div className="flex-1" />
        {/* Acciones lado derecho */}
        <Button variant="ghost" size="icon" className="mr-2">
          <BellRing className="h-5 w-5" />
        </Button>
        {/* Switch de tema y menú usuario */}
        {/* Puedes agregar aquí el switch de tema y el menú de usuario como en AppHeader */}
      </div>
    </header>
  );

  return (
    <div className="flex min-h-screen w-full">
      {/* Sheet móvil */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[280px]">
          {/* Cabecera del sheet */}
          <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Hospital className="h-8 w-8 text-primary" />
              <span className="text-xl font-semibold">{APP_NAME}</span>
            </Link>
          </div>
          {/* Contenido principal del sheet */}
          <div className="flex-1 custom-main-sidebar-scroll-container overflow-y-auto">
            <AppSidebarNav />
          </div>
          {/* Pie del sheet */}
          <div className="min-h-[64px] p-4 border-t border-sidebar-border">
            <UserSheetFooter user={user} />
          </div>
        </SheetContent>
      </Sheet>
      {/* Sidebar escritorio */}
      <Sidebar
        side="left"
        collapsible="offcanvas"
        variant="sidebar"
        className="border-r border-sidebar-border hidden md:flex"
      >
        <SidebarHeader className="h-16 px-4 border-b border-sidebar-border flex items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Hospital className="h-8 w-8 text-primary" />
            <span
              className={cn(
                "text-xl font-semibold transition-all",
                "group-data-[collapsible=icon]:hidden group-data-[collapsible=offcanvas]:group-data-[state=collapsed]:hidden"
              )}
            >
              {APP_NAME}
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-0 custom-main-sidebar-scroll-container flex-1">
          <AppSidebarNav />
        </SidebarContent>
        <SidebarFooter className="min-h-[64px] p-4 border-t border-sidebar-border">
          <UserSidebarFooter user={user} />
        </SidebarFooter>
      </Sidebar>
      {/* Contenido principal */}
      <SidebarInset className="flex-1 flex flex-col min-h-screen">
        {MainHeader}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}

export default function MainAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SidebarProvider defaultOpen={true}>
        <InnerLayout>{children}</InnerLayout>
      </SidebarProvider>
    </ThemeProvider>
  );
}
