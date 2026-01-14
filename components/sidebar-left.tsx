"use client";

import * as React from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Settings,
  BarChart2,
  Phone,
  Home,
  FileText,
  ClipboardList,
  ShoppingCart,
  Briefcase,
  Compass,
  HelpCircle,
  PhoneCall,
  Bot,
  Mail,
  Building2
} from "lucide-react";

import { NavFavorites } from "@/components/nav-favorites";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavWorkspaces } from "@/components/nav-workspaces";
import { TeamSwitcher } from "@/components/team-switcher";
import { Package } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

function getMenuItems(userId: string | null) {
  return [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  ];
}

const data = {
  teams: [
    {
      name: "Ecodesk",
      plan: "Enterprise",
    },
  ],
  navSecondary: [
    { title: "Help", url: "/help", icon: HelpCircle },
    { title: "Calendar", url: "/calendar", icon: CalendarDays },
    { title: "Settings", url: "/settings", icon: Settings },
  ],
  favorites: [
    { name: "Inquiries", url: "/inquiries", icon: BarChart2 },
    { name: "Customer Database", url: "/customer-database", icon: Phone },
    // { name: "Shopify Order", url: "/shopify-order", icon: Package },
  ],
  workspaces: [
    {
      name: "Reports",
      icon: Home,
      pages: [
        { name: "Daily CSR Transaction", url: "/reports/dst", icon: FileText },
        { name: "SKU Listing", url: "/reports/sku", icon: ClipboardList },
        { name: "Received PO", url: "/reports/po", icon: ShoppingCart },
        { name: "D-Tracking", url: "/reports/dtr", icon: Compass },
        // { name: "Departmental", url: "/departmental-main", icon: Building2 },
      ],
    },
    {
      name: "Taskflow",
      icon: Briefcase,
      pages: [{ name: "OB Calls", url: "/taskflow/obc", icon: PhoneCall }],
    },
  ],
};

export function SidebarLeft({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [userId, setUserId] = React.useState<string | null>(null);
  const [userDetails, setUserDetails] = React.useState({
    Firstname: "Eco",
    Lastname: "Desk",
    Email: "ecodesk@disruptivesolutions.com",
    Department: "disruptivesolutions.com",
    Location: "Philippines",
    Role: "Admin",
    Position: "",
    Company: "Disruptive Solutions Inc",
    Status: "None",
    profilePicture: "",
    ReferenceID: "",
  });
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({});

  // Load open sections from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem("sidebarOpenSections");
    if (saved) {
      setOpenSections(JSON.parse(saved));
    }
  }, []);

  // Save open sections on change
  React.useEffect(() => {
    localStorage.setItem("sidebarOpenSections", JSON.stringify(openSections));
  }, [openSections]);

  // Get userId from URL query param on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUserId(params.get("id"));
  }, []);

  // Fetch user details based on userId
  React.useEffect(() => {
    if (!userId) return;
    fetch(`/api/user?id=${encodeURIComponent(userId)}`)
      .then((res) => res.json())
      .then((data) => {
        setUserDetails((prev) => ({
          ...prev,
          Firstname: data.Firstname || prev.Firstname,
          Lastname: data.Lastname || prev.Lastname,
          Email: data.Email || prev.Email,
          Department: data.Department || prev.Department,
          Location: data.Location || prev.Location,
          Role: data.Role || prev.Role,
          Position: data.Position || prev.Position,
          Company: data.Company || prev.Company,
          Status: data.Status || prev.Status,
          ReferenceID: data.ReferenceID || prev.ReferenceID,
          profilePicture: data.profilePicture || prev.profilePicture,
        }));
      })
      .catch((err) => console.error(err));
  }, [userId]);

  const handleToggle = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Get menu items with userId if needed
  const menuItems = React.useMemo(() => getMenuItems(userId), [userId]);

  // Append userId to URLs except for "#" or empty string
  const withUserId = React.useCallback(
    (url: string) => {
      if (!userId) return url;
      if (!url || url === "#") return url;
      return url.includes("?")
        ? `${url}&id=${encodeURIComponent(userId)}`
        : `${url}?id=${encodeURIComponent(userId)}`;
    },
    [userId]
  );

  // No filtering here: just append userId to menuItems URLs
  const navMainWithId = React.useMemo(
    () => menuItems.map((item) => ({ ...item, url: withUserId(item.url || "#") })),
    [menuItems, withUserId]
  );

  // For now, no filtering on workspaces, but you can add later
  const filteredWorkspaces = React.useMemo(() => {
    return data.workspaces.map((workspace) => workspace);
  }, [userDetails.Role]);

  // Append userId to workspace pages URLs
  const workspacesWithId = React.useMemo(
    () =>
      filteredWorkspaces.map((workspace) => ({
        ...workspace,
        pages: workspace.pages.map((page) => ({
          ...page,
          url: withUserId(page.url),
        })),
      })),
    [filteredWorkspaces, withUserId]
  );

  // Append userId to favorites URLs
  const favoritesWithId = React.useMemo(
    () =>
      data.favorites.map((favorite) => ({
        ...favorite,
        url: withUserId(favorite.url),
      })),
    [data.favorites, withUserId]
  );

  // Append userId to secondary nav URLs
  const navSecondaryWithId = React.useMemo(
    () => data.navSecondary.map((item) => ({ ...item, url: withUserId(item.url) })),
    [withUserId]
  );

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <NavMain items={navMainWithId} />
      </SidebarHeader>

      <SidebarContent>
        <NavFavorites favorites={favoritesWithId} />
        <NavWorkspaces
          workspaces={workspacesWithId}
          openSections={openSections}
          onToggleSection={handleToggle}
        />
        <NavSecondary items={navSecondaryWithId} className="mt-auto" />
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
