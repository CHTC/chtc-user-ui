import { Box, Container, Typography } from "@mui/material";

export default async function Home() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Container maxWidth="lg" sx={{ my: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          CHTC User App
        </Typography>
      </Container>
    </Box>
  );
}
