import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";

import { resetPasswordSchema, type ResetPasswordSchema } from "@/shared/schemas/auth.schema";
import { authApi } from "@/shared/api/auth.api";

export function AdminResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email, token },
  });

  if (!token || !email) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f5f5f5" }}>
        <Paper elevation={2} sx={{ p: 4, width: "100%", maxWidth: 420 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Lien invalide
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ce lien de réinitialisation est invalide ou a expiré.
          </Typography>
          <Link to="/admin" style={{ fontSize: 14 }}>
            Retour à la connexion
          </Link>
        </Paper>
      </Box>
    );
  }

  const onSubmit = async (data: ResetPasswordSchema) => {
    setServerError(null);
    try {
      await authApi.platformResetPassword(data);
      navigate("/admin?reset=1", { replace: true });
    } catch {
      setServerError("Le lien est invalide ou a expiré. Veuillez refaire une demande.");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f5f5f5" }}>
      <Paper elevation={2} sx={{ p: 4, width: "100%", maxWidth: 420 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Nouveau mot de passe
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Choisissez un mot de passe d'au moins 8 caractères.
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {serverError && <Alert severity="error">{serverError}</Alert>}

          <input type="hidden" {...register("email")} />
          <input type="hidden" {...register("token")} />

          <TextField
            id="password"
            label="Nouveau mot de passe"
            type="password"
            autoComplete="new-password"
            fullWidth
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <TextField
            id="password_confirmation"
            label="Confirmer le mot de passe"
            type="password"
            autoComplete="new-password"
            fullWidth
            {...register("password_confirmation")}
            error={!!errors.password_confirmation}
            helperText={errors.password_confirmation?.message}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            Réinitialiser le mot de passe
          </Button>

          <Link to="/admin" style={{ fontSize: 14, textAlign: "center" }}>
            ← Retour à la connexion
          </Link>
        </Box>
      </Paper>
    </Box>
  );
}
