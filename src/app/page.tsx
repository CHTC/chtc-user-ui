import { Box, Container, Typography } from "@mui/material";
import AnimatedBackground from "@/src/components/Background/AnimatedBackground";

export default async function Home() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#ffffff00" }}>
      <AnimatedBackground />
      <Container maxWidth="lg" sx={{ my: 4 }}>
        <Box display={"flex"} justifyContent="center" alignItems="center">
          <Typography variant="h4" component="h2" sx={{color: "white"}} gutterBottom>

          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
