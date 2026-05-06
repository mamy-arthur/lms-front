import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";

import { forgotPasswordSchema, type ForgotPasswordSchema } from "@/shared/schemas/auth.schema";
import { authApi } from "@/shared/api/auth.api";

export function AdminForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    setServerError(null);
    try {
      await authApi.platformForgotPassword(data.email);
      setSubmitted(true);
    } catch {
      setServerError("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f5f5f5" }}>
      <Paper elevation={2} sx={{ p: 4, width: "100%", maxWidth: 420 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Mot de passe oublié
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Entrez votre email pour recevoir un lien de réinitialisation.
        </Typography>

        {submitted ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Alert severity="success">
              Un lien de réinitialisation a été envoyé à <strong>{getValues("email")}</strong>.
              Pensez à vérifier vos spams.
            </Alert>
            <Link to="/admin" style={{ fontSize: 14, textAlign: "center" }}>
              Retour à la connexion
            </Link>
          </Box>
        ) : (
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
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

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
            >
              Envoyer le lien
            </Button>

            <Link to="/admin" style={{ fontSize: 14, textAlign: "center" }}>
              ← Retour à la connexion
            </Link>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
