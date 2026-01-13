import AnimatedBackground from "@/src/components/Background/AnimatedBackground";
import { Box } from "@mui/material";

export default async function Home() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#ffffff00" }}>
      <AnimatedBackground />
    </Box>
  );
}
