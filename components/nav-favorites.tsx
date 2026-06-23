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
      <SidebarGroupLabel>Favorites</SidebarGroupLabel>
      <SidebarMenu>
        {favorites.map((item) => {
          const Icon = item.icon;
          const basePath = getBasePath(item.url);
          const isActive = pathname === basePath || (basePath !== "/" && pathname.startsWith(basePath));
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild isActive={isActive}>
                <a href={item.url} title={item.name} className="flex items-center space-x-2">
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
