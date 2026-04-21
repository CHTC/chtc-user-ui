import React from 'react';
import {
  Box,
  Button,
  Container,
  Link as MuiLink,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';

const steps = [
  {
    icon: <EmailOutlinedIcon fontSize="medium" />,
    text: (
      <>
        You will receive an automated email from{' '}
        <MuiLink href="mailto:chtc@cs.wisc.edu">chtc@cs.wisc.edu</MuiLink>{' '}
        within a few hours of completing the form.
      </>
    ),
  },
  {
    icon: <AccessTimeOutlinedIcon fontSize="medium" />,
    text: (
      <>
        Wait 2–3 business days for a follow-up from CHTC Facilitation Staff. Contact us at{' '}
        <MuiLink href="mailto:chtc@cs.wisc.edu">chtc@cs.wisc.edu</MuiLink>{' '}
        if you don&apos;t hear from us after 3 business days.
      </>
    ),
  },
  {
    icon: <GroupsOutlinedIcon fontSize="medium" />,
    text: (
      <>
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>New Research Group</Typography>
        We will first schedule a meeting with you to understand your computational needs before creating your account.
      </>
    ),
  },
  {
    icon: <PersonAddOutlinedIcon fontSize="medium" />,
    text: (
      <>
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Existing Research Group</Typography>
        We will create a new account. We don&apos;t require a meeting, but highly recommend meeting with us, especially if you are new to research computing!
      </>
    ),
  },
];

export default function LandingPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      {/* Header */}
      <Box sx={{ mb: 5, textAlign: 'center' }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 700, mb: 1 }}
        >
          Before you apply
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here&apos;s what to expect after submitting your account request.
        </Typography>
      </Box>

      {/* Info cards */}
      <Stack spacing={2} sx={{ mb: 5 }}>
        {steps.map((step, i) => (
          <Paper
            key={i}
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2,
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              transition: 'box-shadow 0.2s',
              '&:hover': { boxShadow: 3 },
            }}
          >
            <Box
              sx={{
                flexShrink: 0,
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {step.icon}
            </Box>
            <Typography variant="body2" sx={{ pt: 0.5, lineHeight: 1.6 }}>
              {step.text}
            </Typography>
          </Paper>
        ))}
      </Stack>

      {/* CTA */}
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          component={MuiLink}
          href="/api/login?next=/forms/user-applications/create/"
          sx={{ px: 5,  textTransform: 'none' }}
        >
          Login to Apply
        </Button>
      </Box>
    </Container>
  );
}
