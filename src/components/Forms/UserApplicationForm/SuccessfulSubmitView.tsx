import React from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Container,
  Link as MuiLink,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';

const steps = [
  {
    icon: <EmailOutlinedIcon fontSize="small" />,
    text: (
      <>
        You will receive an automated email from{' '}
        <MuiLink href="mailto:chtc@cs.wisc.edu">chtc@cs.wisc.edu</MuiLink>{' '}
        within a few hours.
      </>
    ),
  },
  {
    icon: <AccessTimeOutlinedIcon fontSize="small" />,
    text: (
      <>
        Wait 2–3 business days for a follow-up from CHTC Facilitation Staff. Contact{' '}
        <MuiLink href="mailto:chtc@cs.wisc.edu">chtc@cs.wisc.edu</MuiLink>{' '}
        if you don't hear back after 3 business days.
      </>
    ),
  },
  {
    icon: <GroupsOutlinedIcon fontSize="small" />,
    text: (
      <>
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
          New Research Group
        </Typography>
        We will schedule a meeting to understand your computational needs before creating your account.
      </>
    ),
  },
  {
    icon: <PersonAddOutlinedIcon fontSize="small" />,
    text: (
      <>
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
          Existing Research Group
        </Typography>
        We will create your account. We don't require a meeting, but highly recommend one if you are new to research computing!
      </>
    ),
  },
];

export default function SuccessfulSubmitView() {
  return (
    <Container maxWidth="sm" sx={{  }}>
      {/* Success banner */}
      <Box sx={{ mb: 5, textAlign: 'center' }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 56, color: 'success.main', mb: 1.5 }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
          Application submitted!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's a reminder of what happens next.
        </Typography>
      </Box>

      {/* Reminder cards */}
      <Stack spacing={2} sx={{ mb: 5 }}>
        {/* Status CTA */}
        <Box
          sx={{
            textAlign: 'center',
            p: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            bgcolor: 'grey.50',
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You can check your application status at any time on your profile page.
          </Typography>
          <Button
            variant="contained"
            size="large"
            component={Link}
            href="/users/me"
            sx={{ px: 5, textTransform: 'none', fontWeight: 700 }}
          >
            View my profile
          </Button>
        </Box>
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
            }}
          >
            <Box
              sx={{
                flexShrink: 0,
                width: 36,
                height: 36,
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
            <Typography variant="body2" sx={{ pt: 0.25, lineHeight: 1.6 }}>
              {step.text}
            </Typography>
          </Paper>
        ))}
      </Stack>
    </Container>
  );
}
