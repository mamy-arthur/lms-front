import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "react-admin";
import { Link, useSearchParams } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";

import { loginSchema, type LoginSchema } from "@/shared/schemas/auth.schema";

export function AdminLoginPage() {
  const login = useLogin();
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

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
      await login({ username: data.email, password: data.password });
    } catch {
      setServerError("Email ou mot de passe incorrect.");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f5f5f5" }}>
      <Paper elevation={2} sx={{ p: 4, width: "100%", maxWidth: 420 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Administration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Connectez-vous à votre espace administrateur.
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {searchParams.get("reset") === "1" && (
            <Alert severity="success">
              Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.
            </Alert>
          )}

          {serverError && <Alert severity="error">{serverError}</Alert>}

          <TextField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            fullWidth
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
              <Typography component="label" htmlFor="password" variant="body2" sx={{ fontWeight: 500 }}>
                Mot de passe
              </Typography>
              <Link to="/admin/forgot-password" style={{ fontSize: 13 }}>
                Mot de passe oublié ?
              </Link>
            </Box>
            <TextField
              id="password"
              type="password"
              autoComplete="current-password"
              fullWidth
              {...register("password")}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            Se connecter
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
