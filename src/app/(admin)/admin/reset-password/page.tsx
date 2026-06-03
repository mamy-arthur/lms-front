import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { AdminResetPasswordForm } from "@/modules/auth/components/AdminResetPasswordForm";

export default function AdminResetPasswordPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f5f5f5",
      }}
    >
      <Paper elevation={2} sx={{ p: 4, width: "100%", maxWidth: 420 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Réinitialiser le mot de passe
        </Typography>
        <AdminResetPasswordForm />
      </Paper>
    </Box>
  );
}
