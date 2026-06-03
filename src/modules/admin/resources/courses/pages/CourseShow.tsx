"use client";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "next/navigation";
import { useCourseQuery } from "../hooks/useCourseQuery";
import { ROUTES } from "@/shared/constants/routes";

interface Props {
  id: string;
}

export function CourseShow({ id }: Props) {
  const router = useRouter();
  const { data: course, isLoading } = useCourseQuery(id);

  if (isLoading) return <CircularProgress sx={{ m: 4 }} />;
  if (!course) return <Typography sx={{ p: 4 }}>Formation introuvable.</Typography>;

  return (
    <Box sx={{ p: 3, maxWidth: 700 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push(ROUTES.admin.courses)}
        sx={{ mb: 2 }}
      >
        Retour
      </Button>

      <Paper sx={{ p: 3 }} elevation={1}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          {course.title}
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Row label="Slug"        value={course.slug} />
          <Row label="Description" value={course.description || "—"} />
          <Row
            label="Statut"
            value={
              course.isPublished ? (
                <Chip label="Publié" color="success" size="small" />
              ) : (
                <Chip label="Brouillon" size="small" />
              )
            }
          />
          <Row label="Créé le" value={course.createdAt} />
        </Box>
      </Paper>
    </Box>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}
