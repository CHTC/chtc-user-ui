import { Box, Container, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";

export default async function Home() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Container maxWidth="lg" sx={{ my: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          CHTC User App Beta
        </Typography>

        <Typography variant="body1" gutterBottom>
          Test credentials (with mock data):
          <Box component="div">
            Username: <strong>admin</strong>
          </Box>
          <Box component="div">
            Password: <strong>password</strong>
          </Box>
        </Typography>
      </Container>
    </Box>
  );
}
