"use client";
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { styled, type Theme, type CSSObject } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface AppSidebarProps {
  navItems: SidebarNavItem[];
  user: { name: string; avatar?: string } | null;
  logoUrl: string;
  tenantName: string;
  onLogout: () => void;
  children: React.ReactNode;
}

// ─── Drawer MUI (identique admin + portal) ────────────────────────────────────

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
  backgroundColor: "var(--color-primary)",
  border: "none",
  color: "white",
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(8)} + 1px)`,
  backgroundColor: "var(--color-primary)",
  border: "none",
  color: "white",
});

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  variants: [
    {
      props: ({ open }) => open,
      style: {
        ...openedMixin(theme),
        "& .MuiDrawer-paper": openedMixin(theme),
      },
    },
    {
      props: ({ open }) => !open,
      style: {
        ...closedMixin(theme),
        "& .MuiDrawer-paper": closedMixin(theme),
      },
    },
  ],
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function AppSidebar({
  navItems,
  user,
  logoUrl,
  tenantName,
  onLogout,
  children,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const isActive = (href: string) =>
    pathname !== null &&
    (href === pathname || pathname.startsWith(href + "/"));

  const navItemSx = (active: boolean) => [
    {
      minHeight: 44,
      px: 2,
      mx: 0.5,
      borderRadius: 2,
      color: "rgba(255,255,255,0.85)",
      "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
      ...(active && {
        bgcolor: "rgba(255,255,255,0.18)",
        color: "white",
        fontWeight: 700,
      }),
    },
    open ? { justifyContent: "initial" } : { justifyContent: "center" },
  ];

  const iconSx = [
    { minWidth: 0, justifyContent: "center", color: "inherit" },
    open ? { mr: 2 } : { mr: "auto" },
  ];

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <CssBaseline />

      {/* Bouton toggle collé sur le bord droit du drawer */}
      <IconButton
        onClick={() => setOpen(!open)}
        size="small"
        sx={{
          position: "fixed",
          top: 20,
          left: open
            ? drawerWidth - 13
            : (theme) => `calc(${theme.spacing(8)} + 1px - 13px)`,
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: 26,
          height: 26,
          bgcolor: "var(--color-primary)",
          color: "white",
          border: "2px solid rgba(255,255,255,0.3)",
          transition: (theme) =>
            theme.transitions.create("left", {
              easing: theme.transitions.easing.sharp,
              duration: open
                ? theme.transitions.duration.enteringScreen
                : theme.transitions.duration.leavingScreen,
            }),
          "&:hover": {
            filter: "brightness(0.85)",
            bgcolor: "var(--color-primary)",
          },
        }}
      >
        {open ? (
          <ChevronLeftIcon sx={{ fontSize: 16 }} />
        ) : (
          <ChevronRightIcon sx={{ fontSize: 16 }} />
        )}
      </IconButton>

      <Drawer variant="permanent" open={open}>
        {/* Logo / nom tenant */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2,
            py: 2.5,
            minHeight: 64,
            overflow: "hidden",
          }}
        >
          <Image
            src={logoUrl}
            alt={tenantName}
            width={32}
            height={32}
            style={{ borderRadius: 6, flexShrink: 0 }}
          />
          {open && (
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "white" }}
              noWrap
            >
              {tenantName}
            </Typography>
          )}
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.15)", mx: 1 }} />

        {/* Navigation */}
        <List sx={{ flex: 1, px: 0.5, py: 1 }}>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <ListItem
                key={item.href}
                disablePadding
                sx={{ display: "block", mb: 0.5 }}
              >
                <Tooltip title={!open ? item.label : ""} placement="right">
                  <ListItemButton
                    component={Link}
                    href={item.href}
                    sx={navItemSx(active)}
                  >
                    <ListItemIcon sx={iconSx}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      sx={[
                        {
                          "& .MuiListItemText-primary": {
                            fontSize: 14,
                            fontWeight: active ? 700 : 400,
                          },
                        },
                        open ? { opacity: 1 } : { opacity: 0 },
                      ]}
                    />
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.15)", mx: 1 }} />

        {/* Utilisateur + déconnexion */}
        <Box sx={{ p: 1 }}>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              sx={[
                {
                  minHeight: 44,
                  px: 2,
                  borderRadius: 2,
                  color: "rgba(255,255,255,0.85)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                  pointerEvents: "none",
                },
                open ? { justifyContent: "initial" } : { justifyContent: "center" },
              ]}
            >
              <ListItemIcon sx={iconSx}>
                <Avatar
                  src={user?.avatar}
                  sx={{ width: 28, height: 28, fontSize: 12, bgcolor: "rgba(255,255,255,0.25)" }}
                >
                  {user ? getInitials(user.name) : "?"}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={user?.name ?? ""}
                sx={[
                  { "& .MuiListItemText-primary": { fontSize: 13, color: "white" } },
                  open ? { opacity: 1 } : { opacity: 0 },
                ]}
              />
            </ListItemButton>
          </ListItem>

          <Tooltip title={!open ? "Déconnexion" : ""} placement="right">
            <ListItemButton
              onClick={onLogout}
              sx={[
                {
                  minHeight: 44,
                  px: 2,
                  borderRadius: 2,
                  color: "rgba(255,255,255,0.7)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)", color: "white" },
                },
                open ? { justifyContent: "initial" } : { justifyContent: "center" },
              ]}
            >
              <ListItemIcon sx={iconSx}>
                <PowerSettingsNewIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Déconnexion"
                sx={[
                  { "& .MuiListItemText-primary": { fontSize: 14 } },
                  open ? { opacity: 1 } : { opacity: 0 },
                ]}
              />
            </ListItemButton>
          </Tooltip>
        </Box>
      </Drawer>

      {/* Contenu principal */}
      <Box
        component="main"
        sx={{ flex: 1, overflow: "auto", bgcolor: "background.default" }}
      >
        {children}
      </Box>
    </Box>
  );
}
