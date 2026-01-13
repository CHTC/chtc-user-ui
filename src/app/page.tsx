import { Box, Container, Typography } from "@mui/material";
import AnimatedBackground from "@/src/components/Background/AnimatedBackground";

export default async function Home() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#ffffff00" }}>
      <AnimatedBackground />
    </Box>
  );
}
