"use client";

import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavFavorites({
  favorites,
}: {
  favorites: {
    name: string;
    url: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }[];
}) {
  const { isMobile } = useSidebar();
  const pathname = usePathname() || "/";

  // Helper to get base path without query params
  const getBasePath = (url: string) => {
    try {
      return new URL(url, window.location.origin).pathname;
    } catch {
      return url;
    }
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">Favorites</SidebarGroupLabel>
      <SidebarMenu>
        {favorites.map((item) => {
          const Icon = item.icon;
          const basePath = getBasePath(item.url);
          const isActive = pathname === basePath || (basePath !== "/" && pathname.startsWith(basePath));
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton 
                asChild 
                isActive={isActive}
                className="hover:bg-sidebar-accent/50 transition-all duration-200 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
              >
                <a href={item.url} title={item.name} className="flex items-center space-x-2">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
