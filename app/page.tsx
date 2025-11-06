import { Box, Typography, Button, Container, Card, CardContent } from "@mui/material";
import Grid from "@mui/material/Grid";

export default async function Home() {

  return (

    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Container maxWidth="lg" sx={{ mb: 10 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid size={{xs: 12, md: 5}}>
            <Typography variant="h4" component="h2" gutterBottom>
              Welcomeeeeeeeeeee
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
