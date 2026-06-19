"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { forgotPasswordSchema, type ForgotPasswordSchema } from "@/shared/schemas/auth.schema";
import { authApi } from "@/shared/api/auth.api";
import { ROUTES } from "@/shared/constants/routes";

export function AdminForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } =
    useForm<ForgotPasswordSchema>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    setServerError(null);
    try {
      await authApi.platformForgotPassword(data.email);
      setSubmitted(true);
    } catch {
      setServerError("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  if (submitted) {
    return (
      <Box>
        <Alert severity="success" sx={{ mb: 2 }}>
          Un email a été envoyé à <strong>{getValues("email")}</strong>.
        </Alert>
        <Typography component={Link} href={ROUTES.platform.login} variant="body2">
          Retour à la connexion
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      {serverError && <Alert severity="error">{serverError}</Alert>}

      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        fullWidth
        {...register("email")}
        error={!!errors.email}
        helperText={errors.email?.message}
      />

      <Button type="submit" variant="contained" fullWidth disabled={isSubmitting}>
        {isSubmitting ? <CircularProgress size={20} /> : "Envoyer le lien"}
      </Button>

      <Typography
        component={Link}
        href={ROUTES.platform.login}
        variant="body2"
        sx={{ textAlign: "center" }}
      >
        Retour à la connexion
      </Typography>
    </Box>
  );
}
