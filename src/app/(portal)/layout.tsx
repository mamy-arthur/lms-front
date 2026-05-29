"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthGuard } from "@/modules/auth/guards/AuthGuard";
import { ROUTES } from "@/shared/constants/routes";
import { useAuthStore } from "@/shared/stores/auth.store";
import { authApi } from "@/shared/api/auth.api";
import { useTenant } from "@/shared/hooks/useTenant";

import * as React from "react";
import { styled, Theme, CSSObject } from "@mui/material/styles";
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
import DashboardIcon from "@mui/icons-material/Dashboard";
import SchoolIcon from "@mui/icons-material/School";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import PersonIcon from "@mui/icons-material/Person";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
const NAV = [
  {
    href: ROUTES.portal.dashboard,
    label: "Tableau de bord",
    icon: <DashboardIcon />,
  },
  {
    href: ROUTES.portal.courses,
    label: "Mes formations",
    icon: <SchoolIcon />,
  },
  {
    href: ROUTES.portal.certificates,
    label: "Certificats",
    icon: <WorkspacePremiumIcon />,
  },
  { href: ROUTES.portal.profile, label: "Profil", icon: <PersonIcon /> },
];

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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function PortalSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { logoUrl, tenantName } = useTenant();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      router.push(ROUTES.auth.login);
    }
  };

  const navItemSx = (isActive: boolean) => [
    {
      minHeight: 44,
      px: 2,
      mx: 0.5,
      borderRadius: 2,
      color: "rgba(255,255,255,0.85)",
      "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
      ...(isActive && {
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

      {/* Bouton toggle - collé sur le bord droit du drawer */}
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
        {/* Logo */}
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
          <Box
            component="img"
            src={logoUrl}
            alt={tenantName}
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              objectFit: "contain",
              borderRadius: 1,
            }}
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
          {NAV.map(({ href, label, icon }) => {
            const isActive = pathname === href;
            return (
              <ListItem
                key={href}
                disablePadding
                sx={{ display: "block", mb: 0.5 }}
              >
                <Tooltip title={!open ? label : ""} placement="right">
                  <ListItemButton
                    component={Link}
                    href={href}
                    sx={navItemSx(isActive)}
                  >
                    <ListItemIcon sx={iconSx}>{icon}</ListItemIcon>
                    <ListItemText
                      primary={label}
                      sx={[
                        {
                          "& .MuiListItemText-primary": {
                            fontSize: 14,
                            fontWeight: isActive ? 700 : 400,
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

        {/* Utilisateur + Déconnexion */}
        <Box sx={{ px: 0.5, py: 1 }}>
          {/* Info utilisateur */}
          <Tooltip title={!open && user ? user.name : ""} placement="right">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1,
                borderRadius: 2,
                overflow: "hidden",
                justifyContent: open ? "flex-start" : "center",
              }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: "rgba(255,255,255,0.25)",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {user ? getInitials(user.name) : "?"}
              </Avatar>
              {open && user && (
                <Box sx={{ overflow: "hidden" }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: "white" }}
                    noWrap
                  >
                    {user.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="rgba(255,255,255,0.6)"
                    noWrap
                  >
                    {user.role}
                  </Typography>
                </Box>
              )}
            </Box>
          </Tooltip>

          {/* Bouton déconnexion */}
          <Tooltip title={!open ? "Se déconnecter" : ""} placement="right">
            <ListItemButton
              onClick={handleLogout}
              sx={[
                {
                  minHeight: 44,
                  px: 2,
                  mx: 0.5,
                  borderRadius: 2,
                  color: "rgba(255,255,255,0.7)",
                  "&:hover": { bgcolor: "rgba(255,0,0,0.15)", color: "white" },
                },
                open
                  ? { justifyContent: "initial" }
                  : { justifyContent: "center" },
              ]}
            >
              <ListItemIcon sx={iconSx}>
                <PowerSettingsNewIcon />
              </ListItemIcon>
              <ListItemText
                primary="Se déconnecter"
                sx={[
                  { "& .MuiListItemText-primary": { fontSize: 14 } },
                  open ? { opacity: 1 } : { opacity: 0 },
                ]}
              />
            </ListItemButton>
          </Tooltip>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, overflow: "auto", p: 3 }}>
        {children}
      </Box>
    </Box>
  );
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <PortalSidebar>{children}</PortalSidebar>
    </AuthGuard>
  );
}
