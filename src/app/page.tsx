import { Box, Container, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";

export default async function Home() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Container maxWidth="lg" sx={{ my: 2 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          CHTC User App Beta
        </Typography>
      </Container>
    </Box>
  );
}
