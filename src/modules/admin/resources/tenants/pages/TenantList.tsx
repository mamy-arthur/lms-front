"use client";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CreateTenantWizard } from "../components/CreateTenantWizard";

export function TenantList() {
  const [search, setSearch] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: { xs: 2, sm: 0 },
            mb: 3,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Tenants
          </Typography>

          <Button
            onClick={() => setWizardOpen(true)}
            size="lg"
            className="bg-(--color-primary) text-primary-foreground"
          >
            <Plus className="size-4" />
            Créer un tenant
          </Button>
        </Box>

        <TextField
          size="small"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2, width: { xs: "100%", sm: 280 } }}
        />
      </Box>

      <CreateTenantWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </>
  );
}
