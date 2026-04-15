"use client";

import { useAuthClient } from "@/src/components/AuthProvider";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import { Box, Link, Paper, Typography } from "@mui/material";

export default function PendingApplicationBanner() {
  const { currentUser } = useAuthClient();

  if (!currentUser) return null;

  const currentForms = (currentUser?.user_forms ?? []).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const pendingApplication = currentForms.length >= 1 && currentForms[0].status === "PENDING";

  if (!pendingApplication || currentUser.active) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 2.5,
        mb: 3,
        border: "1px solid",
        borderColor: "info.light",
        borderRadius: 3,
        bgcolor: "info.50",
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          width: 40,
          height: 40,
          borderRadius: 2,
          bgcolor: "info.main",
          color: "info.contrastText",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AccessTimeOutlinedIcon fontSize="small" />
      </Box>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>
          Application pending
        </Typography>
        <Typography variant="body2" color="text.secondary">
          We'll follow up within 2–3 business days. If you haven't heard back after 3 business days, contact us at{" "}
          <Link href="mailto:chtc@cs.wisc.edu">chtc@cs.wisc.edu</Link>.
        </Typography>
      </Box>
    </Paper>
  );
}
