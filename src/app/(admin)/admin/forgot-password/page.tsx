import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { AdminForgotPasswordForm } from "@/modules/auth/components/AdminForgotPasswordForm";

export default function AdminForgotPasswordPage() {
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
          Mot de passe oublié
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Saisissez votre email pour recevoir un lien de réinitialisation.
        </Typography>
        <AdminForgotPasswordForm />
      </Paper>
    </Box>
  );
}
