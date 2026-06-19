"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { resetPasswordSchema, type ResetPasswordSchema } from "@/shared/schemas/auth.schema";
import { authApi } from "@/shared/api/auth.api";
import { ROUTES } from "@/shared/constants/routes";

export function AdminResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams?.get("token") ?? "";
  const email = searchParams?.get("email") ?? "";

  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ResetPasswordSchema>({
      resolver: zodResolver(resetPasswordSchema),
      defaultValues: { email, token },
    });

  if (!token || !email) {
    return (
      <Alert severity="error">
        Lien invalide ou expiré. Veuillez redemander un lien de réinitialisation.
      </Alert>
    );
  }

  const onSubmit = async (data: ResetPasswordSchema) => {
    setServerError(null);
    try {
      await authApi.platformResetPassword(data);
      router.push(`${ROUTES.platform.login}?reset=1`);
    } catch {
      setServerError("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      {serverError && <Alert severity="error">{serverError}</Alert>}

      <TextField
        label="Nouveau mot de passe"
        type="password"
        fullWidth
        {...register("password")}
        error={!!errors.password}
        helperText={errors.password?.message}
      />

      <TextField
        label="Confirmer le mot de passe"
        type="password"
        fullWidth
        {...register("password_confirmation")}
        error={!!errors.password_confirmation}
        helperText={errors.password_confirmation?.message}
      />

      <input type="hidden" {...register("token")} />
      <input type="hidden" {...register("email")} />

      <Button type="submit" variant="contained" fullWidth disabled={isSubmitting}>
        {isSubmitting ? <CircularProgress size={20} /> : "Réinitialiser"}
      </Button>

      <Typography variant="body2" sx={{ textAlign: "center", color: "text.secondary" }}>
        Token : {token.slice(0, 8)}…
      </Typography>
    </Box>
  );
}
