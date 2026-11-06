"use client";

import { Add, ExpandMore } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material";
import { type ReactNode, useId } from "react";

interface AddAccordionProps {
  /** e.g. "Add member" */
  title: string;
  children: ReactNode;
  /** Controlled open state, so a page can close it after a successful add */
  expanded?: boolean;
  onChange?: (expanded: boolean) => void;
}

/** The full-width, collapsed-by-default form at the top of a subpage for adding to its table */
const AddAccordion = ({ title, children, expanded, onChange }: AddAccordionProps) => {
  const id = useId();
  return (
    <Accordion
      disableGutters
      variant="outlined"
      expanded={expanded}
      onChange={onChange ? (_event, isExpanded) => onChange(isExpanded) : undefined}
      sx={{ mb: 3 }}
    >
      <AccordionSummary expandIcon={<ExpandMore />} aria-controls={`${id}-content`} id={`${id}-header`}>
        <Add sx={{ mr: 1 }} color="primary" />
        <Typography>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
};

export default AddAccordion;
