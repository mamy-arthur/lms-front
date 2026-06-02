"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Typography,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import { loginSchema, type LoginSchema } from "@/shared/schemas/auth.schema";
import { authApi } from "@/shared/api/auth.api";
import { useAuthStore } from "@/shared/stores/auth.store";
import { useTenantStore } from "@/shared/stores/tenant.store";
import { resolveRedirectPath } from "@/modules/auth/utils/loginUtils";

const pillInputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "50px",
    bgcolor: "#f0f2f5",
    "& fieldset": { border: "none" },
    "&:hover fieldset": { border: "none" },
    "&.Mui-focused": {
      bgcolor: "#fff",
      boxShadow: "0 0 0 2px rgba(26,35,126,0.25)",
    },
  },
} as const;

export function PlatformLoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    setServerError(null);
    try {
      const hasTenant = !!useTenantStore.getState().tenant;
      const { user } = await authApi.platformLogin(data.email, data.password);
      setAuth(user);
      router.replace(resolveRedirectPath(user, hasTenant));
    } catch {
      setServerError("Email ou mot de passe incorrect.");
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      {serverError && (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {serverError}
        </Alert>
      )}

      <Box>
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, mb: 0.75, color: "text.secondary" }}
        >
          Email :
        </Typography>
        <TextField
          id="platform-email"
          type="email"
          autoComplete="email"
          placeholder="vous@learneo.local"
          fullWidth
          {...register("email")}
          error={!!errors.email}
          helperText={errors.email?.message}
          sx={pillInputSx}
        />
      </Box>

      <Box>
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, mb: 0.75, color: "text.secondary" }}
        >
          Mot de passe :
        </Typography>
        <TextField
          id="platform-password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          fullWidth
          {...register("password")}
          error={!!errors.password}
          helperText={errors.password?.message}
          sx={pillInputSx}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    size="small"
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    {showPassword ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          startIcon={
            isSubmitting ? <CircularProgress size={16} color="inherit" /> : null
          }
          sx={{
            borderRadius: "50px",
            px: 4,
            py: 1.2,
            bgcolor: "var(--color-primary)",
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            "&:hover": {
              filter: "brightness(0.85)",
              bgcolor: "var(--color-primary)",
            },
          }}
        >
          Connexion
        </Button>
      </Box>
    </Box>
  );
}
