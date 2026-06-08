"use client";

import { memo, useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useCreateTenantUser } from "../hooks/useCreateTenantUser";
import { useTenantStore } from "@/shared/stores/tenant.store";

// ─── Schema ──────────────────────────────────────────────────────────────────

const createTenantUserSchema = z.object({
  first_name: z.string().min(1, "Prénom requis").max(120),
  last_name: z.string().min(1, "Nom requis").max(120),
  email: z.string().email("Email invalide").max(255),
  password: z.string().min(8, "Minimum 8 caractères").max(255),
  role: z.enum(["CLIENT_MANAGER", "TRAINEE"]),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof createTenantUserSchema>;

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<"CLIENT_MANAGER" | "TRAINEE", string> = {
  CLIENT_MANAGER: "Responsable",
  TRAINEE: "Stagiaire",
};

const DEFAULT_VALUES: FormValues = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  role: "TRAINEE",
  is_active: true,
};

// ─── Error extraction (pure function) ────────────────────────────────────────

function extractApiError(err: unknown): string {
  if (err && typeof err === "object") {
    const maybeJson = (err as Record<string, unknown>).json;
    if (maybeJson && typeof maybeJson === "object") {
      const msg = (maybeJson as Record<string, unknown>).message;
      if (typeof msg === "string" && msg.length > 0) return msg;
    }
  }
  return "Une erreur est survenue lors de la création.";
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

function UserFormModalBase({ open, onClose, onSuccess }: UserFormModalProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    mutate,
    isPending,
    isError,
    error,
    reset: resetMutation,
  } = useCreateTenantUser();
  const tenantId = useTenantStore((s) => s.tenant?.id ?? null);

  const {
    register,
    handleSubmit,
    control,
    reset: resetForm,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createTenantUserSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleClose = useCallback(() => {
    resetForm();
    resetMutation();
    onClose();
  }, [resetForm, resetMutation, onClose]);

  const togglePasswordVisibility = useCallback(
    () => setShowPassword((v) => !v),
    [],
  );

  const onSubmit = useCallback(
    (values: FormValues) => {
      mutate(
        { ...values, tenant_id: tenantId },
        {
          onSuccess: () => {
            resetForm();
            resetMutation();
            onSuccess?.();
          },
        },
      );
    },
    [mutate, tenantId, resetForm, resetMutation, onSuccess],
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Créer un utilisateur</DialogTitle>

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        data-testid="user-form"
      >
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}
        >
          {isError && (
            <Alert severity="error" role="alert">
              {extractApiError(error)}
            </Alert>
          )}

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Prénom"
              fullWidth
              autoFocus
              {...register("first_name")}
              error={!!errors.first_name}
              helperText={errors.first_name?.message}
              slotProps={{ htmlInput: { "aria-label": "Prénom" } }}
            />
            <TextField
              label="Nom"
              fullWidth
              {...register("last_name")}
              error={!!errors.last_name}
              helperText={errors.last_name?.message}
              slotProps={{ htmlInput: { "aria-label": "Nom" } }}
            />
          </Box>

          <TextField
            label="Email"
            type="email"
            fullWidth
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
            slotProps={{ htmlInput: { "aria-label": "Email" } }}
          />

          <TextField
            label="Mot de passe"
            type={showPassword ? "text" : "password"}
            fullWidth
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message}
            slotProps={{
              htmlInput: { "aria-label": "Mot de passe" },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={togglePasswordVisibility}
                      edge="end"
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.role}>
                <InputLabel id="role-select-label">Rôle</InputLabel>
                <Select
                  {...field}
                  labelId="role-select-label"
                  label="Rôle"
                  inputProps={{ "aria-label": "Rôle" }} // Select conserve inputProps pour l'id natif
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.role && (
                  <FormHelperText>{errors.role.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={isPending}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isPending}
            startIcon={
              isPending ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            {isPending ? "Création…" : "Créer"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

/**
 * Mémoïsé : le Dialog ne se re-rend pas quand le parent change
 * (ex. search input), sauf si ses props changent.
 */
export const UserFormModal = memo(UserFormModalBase);
