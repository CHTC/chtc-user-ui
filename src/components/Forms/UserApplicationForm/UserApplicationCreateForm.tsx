"use client";

import SuccessfulSubmitView from "@/src/components/Forms/UserApplicationForm/SuccessfulSubmitView";
import type { ApiError } from "@/src/components/Forms/UserForm/UserForm";
import { useAuthClient } from "@/src/components/AuthProvider";
import type { PositionEnum, UserForm, UserFormPost } from "@/types";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { DEPARTMENTS } from "@/src/components/Forms/UserApplicationForm/enum";

type MentorExpectation = "YES" | "NO" | "MAYBE" | null;

type MarketingAttributionOption =
  | "Word of mouth from inside your Research Group (PI, group member, etc.)"
  | "Word of mouth from outside your Research Group (department colleagues, department heads, etc.)"
  | "Internet Search"
  | "Class or Seminar"
  | "CHTC-Hosted Event"
  | "Graduate Student Resource Fair"
  | "Other Event";

type ResearchComputingAreaOption =
  | "Data analysis"
  | "Simulation/Modeling"
  | "Machine Learning (Training)"
  | "Machine Learning (Application)"
  | "Programming/Software Development"
  | "Bioinformatics/Genetics";

type PriorSystemOption =
  | "Personal computer"
  | "Research group compute/server"
  | "Department server/cluster"
  | "Cloud-based services (Google Colab, etc.)"
  | "High performance computing (HPC) cluster not at UW-Madison"
  | "High throughput computing (HTC) cluster not at UW-Madison";

type ComputingTypeOption =
  | "High Throughput Computing (HTC)"
  | "High Performance Computing (HPC)"
  | "Both HTC & HPC"
  | "Not sure"
  | null;

type GpuTypeOption =
  | "Not sure"
  | "No, my calculation does not need a GPU"
  | "Yes, my calculation needs a single GPU"
  | "Yes, my calculation needs multiple GPUs"
  | null;

type CpuCoresOption = "Not sure" | "< 8" | "8 - 20" | "20 - 40" | "> 40" | null;

type MemoryOption = "Not sure" | "< 32" | "32 - 80" | "80 - 160" | "> 160" | null;

type DiskSpaceOption = "Not sure" | "< 10" | "10 - 100" | "100 - 500" | "> 500" | null;

type RuntimeOption = "Not sure" | "< 8" | "8 - 24" | "24 - 72" | "> 72" | null;

interface UserApplicationCreateFormProps {
  initialValues?: UserForm | null;
  onSubmit: (payload: UserFormPost) => Promise<void> | void;
  onChange?: () => void;
  isSubmitting?: boolean;
  error?: string | ApiError | null;
  submitSuccess?: boolean;
}

const TOTAL_STEPS = 4;
const LAST_STEP_INDEX = TOTAL_STEPS - 1;

const positionOptions: Array<{ value: PositionEnum; label: string }> = [
  { value: "FACULTY", label: "Faculty" },
  { value: "STAFF", label: "Staff" },
  { value: "POSTDOC", label: "Post-Doctorate" },
  { value: "GRAD_STUDENT", label: "Graduate Student" },
  { value: "UNDERGRADUATE", label: "Undergraduate Student" },
  { value: "OTHER", label: "Collaborator" },
];

const marketingAttributionOptions: Array<{ value: MarketingAttributionOption; label: string }> = [
  {
    value: "Word of mouth from inside your Research Group (PI, group member, etc.)",
    label: "Word of mouth from inside your Research Group (PI, group member, etc.)",
  },
  {
    value: "Word of mouth from outside your Research Group (department colleagues, department heads, etc.)",
    label: "Word of mouth from outside your Research Group (department colleagues, department heads, etc.)",
  },
  { value: "Internet Search", label: "Internet Search" },
  { value: "Class or Seminar", label: "Class or Seminar" },
  { value: "CHTC-Hosted Event", label: "CHTC-Hosted Event" },
  { value: "Graduate Student Resource Fair", label: "Graduate Student Resource Fair" },
  { value: "Other Event", label: "Other Event" },
];

const researchComputingAreaOptions: Array<{ value: ResearchComputingAreaOption; label: string }> = [
  { value: "Data analysis", label: "Data analysis" },
  { value: "Simulation/Modeling", label: "Simulation/Modeling" },
  { value: "Machine Learning (Training)", label: "Machine Learning (Training)" },
  { value: "Machine Learning (Application)", label: "Machine Learning (Application)" },
  { value: "Programming/Software Development", label: "Programming/Software Development" },
  { value: "Bioinformatics/Genetics", label: "Bioinformatics/Genetics" },
];

const priorSystemOptions: Array<{ value: PriorSystemOption; label: string }> = [
  { value: "Personal computer", label: "Personal computer" },
  { value: "Research group compute/server", label: "Research group compute/server" },
  { value: "Department server/cluster", label: "Department server/cluster" },
  { value: "Cloud-based services (Google Colab, etc.)", label: "Cloud-based services (Google Colab, etc.)" },
  {
    value: "High performance computing (HPC) cluster not at UW-Madison",
    label: "High performance computing (HPC) cluster not at UW-Madison",
  },
  {
    value: "High throughput computing (HTC) cluster not at UW-Madison",
    label: "High throughput computing (HTC) cluster not at UW-Madison",
  },
];

const cpuCoreOptions: Array<Exclude<CpuCoresOption, null>> = ["Not sure", "< 8", "8 - 20", "20 - 40", "> 40"];
const memoryOptions: Array<Exclude<MemoryOption, null>> = ["Not sure", "< 32", "32 - 80", "80 - 160", "> 160"];
const diskSpaceOptions: Array<Exclude<DiskSpaceOption, null>> = ["Not sure", "< 10", "10 - 100", "100 - 500", "> 500"];
const runtimeOptions: Array<Exclude<RuntimeOption, null>> = ["Not sure", "< 8", "8 - 24", "24 - 72", "> 72"];

function toggleValue<T extends string>(values: T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function ResourceEstimateField<T extends string>({
  question,
  value,
  options,
  onChange,
  disabled = false,
}: {
  question: string;
  value: T | null;
  options: readonly T[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <Stack spacing={2}>
      <Typography variant="body1">{question}</Typography>
      <FormControl>
        <RadioGroup
          row
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value as T)}
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: `repeat(${options.length}, minmax(0, 1fr))`,
            },
            gap: 1,
          }}
        >
          {options.map((option) => (
            <FormControlLabel
              key={option}
              value={option}
              control={<Radio />}
              label={option}
              disabled={disabled}
              sx={{
                alignItems: "center",
                m: 0,
                "& .MuiFormControlLabel-label": {
                  fontSize: { xs: "0.95rem", sm: "1rem" },
                },
              }}
            />
          ))}
        </RadioGroup>
      </FormControl>
    </Stack>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function UserApplicationCreateForm({
  initialValues,
  onSubmit,
  onChange,
  isSubmitting = false,
  error = null,
  submitSuccess = false,
}: UserApplicationCreateFormProps) {
  const { currentUser } = useAuthClient();
  const needsEmail = !currentUser?.email1;

  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState<PositionEnum | null>(initialValues?.position ?? null);
  const [department, setDepartment] = useState<string | null>(null);
  const [piName, setPiName] = useState(initialValues?.pi_name ?? "");
  const [piEmail, setPiEmail] = useState(initialValues?.pi_email ?? "");
  const [piEmailTouched, setPiEmailTouched] = useState(false);
  const [mentorExpectation, setMentorExpectation] = useState<MentorExpectation>(null);
  const [mentorName, setMentorName] = useState("");
  const [mentorEmail, setMentorEmail] = useState("");
  const [marketingAttribution, setMarketingAttribution] = useState<MarketingAttributionOption[]>([]);
  const [howChtcCanHelp, setHowChtcCanHelp] = useState("");
  const [researchComputingArea, setResearchComputingArea] = useState<ResearchComputingAreaOption[]>([]);
  const [softwareLink, setSoftwareLink] = useState("");
  const [priorSystems, setPriorSystems] = useState<PriorSystemOption[]>([]);
  const [computingType, setComputingType] = useState<ComputingTypeOption>(null);
  const [cpuCores, setCpuCores] = useState<CpuCoresOption>("Not sure");
  const [memoryGb, setMemoryGb] = useState<MemoryOption>("Not sure");
  const [diskSpaceGb, setDiskSpaceGb] = useState<DiskSpaceOption>("Not sure");
  const [calculationRuntimeHours, setCalculationRuntimeHours] = useState<RuntimeOption>("Not sure");
  const [gpuType, setGpuType] = useState<GpuTypeOption>(null);
  const [calculationQuantity, setCalculationQuantity] = useState("");
  const [specialAccess, setSpecialAccess] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  const hasMountedRef = useRef(false);

  const validationMessages = useMemo(() => {
    if (needsEmail && !email.trim()) {
      return {
        page1: "Please enter your email address.",
        submit: "Please enter your email address.",
      };
    }

    if (position === null) {
      return {
        page1: "Please select the option that best describes your position.",
        submit: "Please select the option that best describes your position.",
      };
    }

    if (!piName.trim() || !piEmail.trim()) {
      return {
        page1: "Enter both your faculty sponsor/PI name and email before continuing.",
        submit: "Enter both your faculty sponsor/PI name and email before submitting.",
      };
    }

    if (!isValidEmail(piEmail.trim())) {
      return {
        page1: "Enter a valid PI email address before continuing.",
        submit: "Enter a valid PI email address before submitting.",
      };
    }

    if (!howChtcCanHelp.trim()) {
      return {
        page2: "Describe how CHTC can help your research before continuing.",
        submit: "Describe how CHTC can help your research before submitting.",
      };
    }

    if (computingType === null) {
      return {
        page3: "Choose the system that best fits your computing needs.",
        submit: "Choose the system that best fits your computing needs.",
      };
    }

    return null;
  }, [needsEmail, email, computingType, howChtcCanHelp, piEmail, piName, position]);

  const currentStepValidationMessage =
    currentStep === 0
      ? (validationMessages?.page1 ?? null)
      : currentStep === 1
        ? (validationMessages?.page2 ?? null)
        : currentStep === 2
          ? (validationMessages?.page3 ?? null)
          : null;
  const submitValidationMessage = validationMessages?.submit ?? null;
  const isLastStep = currentStep === LAST_STEP_INDEX;
  const visibleValidationMessage = isLastStep ? submitValidationMessage : currentStepValidationMessage;

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    onChange?.();
  }, [
    calculationQuantity,
    calculationRuntimeHours,
    computingType,
    cpuCores,
    department,
    diskSpaceGb,
    extraInfo,
    gpuType,
    howChtcCanHelp,
    marketingAttribution,
    memoryGb,
    mentorEmail,
    mentorExpectation,
    mentorName,
    onChange,
    piEmail,
    piName,
    position,
    priorSystems,
    researchComputingArea,
    softwareLink,
    specialAccess,
  ]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isLastStep) return;
    if (submitValidationMessage) return;

    await onSubmit({
      email: needsEmail ? email.trim() || null : undefined,
      pi_id: null,
      pi_name: piName.trim(),
      pi_email: piEmail.trim(),
      position: position as PositionEnum,
      department: department ?? null,
      mentor_name: mentorName.trim() || null,
      mentor_email: mentorEmail.trim() || null,
      marketing_attribution: marketingAttribution.join(", "),
      how_chtc_can_help: howChtcCanHelp.trim() || null,
      research_computing_area: researchComputingArea.join(", "),
      software_link: softwareLink.trim() || null,
      computing_type: computingType,
      cpu_cores: cpuCores,
      memory_gb: memoryGb,
      disk_space_gb: diskSpaceGb,
      calculation_runtime_hours: calculationRuntimeHours,
      gpu_type: gpuType,
      calculation_quantity: calculationQuantity.trim() || null,
      special_access: specialAccess.trim() || null,
      extra_info: extraInfo.trim() || null,
    });
  };

  const handleNext = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (currentStepValidationMessage || currentStep >= LAST_STEP_INDEX) {
      return;
    }
    setCurrentStep((step) => step + 1);
  };

  const handleBack = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (currentStep === 0) {
      return;
    }
    setCurrentStep((step) => step - 1);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            {needsEmail && (
              <Stack spacing={1.5}>
                <Typography variant="h6">Email Address</Typography>
                <Typography variant="body2">
                  We don&apos;t have an email address on file for your account. Please provide one so we can contact you
                  about your application.
                </Typography>
                <TextField
                  required
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                />
              </Stack>
            )}

            <Stack spacing={1.5}>
              <Typography variant="h6">1. Position</Typography>
              <Typography variant="body2">Please select the option that best describes your position.</Typography>
              <FormControl fullWidth required>
                <InputLabel id="position-label">Position</InputLabel>
                <Select
                  labelId="position-label"
                  label="Position"
                  value={position ?? ""}
                  onChange={(event) => setPosition((event.target.value as PositionEnum) || null)}
                  disabled={isSubmitting}
                >
                  <MenuItem value="">Select Position</MenuItem>
                  {positionOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant="h6">2. Department</Typography>
              <Typography variant="body2">Please select the department you are affiliated with.</Typography>
              <Autocomplete
                options={Object.keys(DEPARTMENTS)}
                getOptionLabel={(key) => DEPARTMENTS[key as keyof typeof DEPARTMENTS]}
                value={department}
                onChange={(_event, newValue) => setDepartment(newValue)}
                disabled={isSubmitting}
                renderInput={(params) => (
                  <TextField {...params} label="Department" />
                )}
              />
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant="h6">3. UW-Madison Faculty Sponsor/Principal Investigator (PI) *</Typography>
              <Typography variant="body2">
                CHTC accounts are associated with a research group led by a PI, typically a faculty member.
              </Typography>
              <Typography variant="body2">
                This person will receive an email notification that you have requested a CHTC account and your account
                will be associated with their research group at CHTC.
              </Typography>
              <TextField
                label="PI Name"
                value={piName}
                onChange={(event) => setPiName(event.target.value)}
                disabled={isSubmitting}
                required
              />
              <TextField
                label="PI Email"
                type="email"
                value={piEmail}
                onChange={(event) => setPiEmail(event.target.value)}
                onBlur={() => setPiEmailTouched(true)}
                disabled={isSubmitting}
                required
                error={piEmailTouched && piEmail.trim().length > 0 && !isValidEmail(piEmail.trim())}
                helperText={
                  piEmailTouched && piEmail.trim().length > 0 && !isValidEmail(piEmail.trim())
                    ? "Please enter a valid email address."
                    : undefined
                }
              />
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant="h6">4. Mentorship Expectations</Typography>
              <Typography variant="body2">Do you expect someone to mentor you on how to use CHTC resources?</Typography>
              <Typography variant="body2">
                This can be anyone in your group or another collaborator who already uses CHTC and is planning to help
                you get started. Ideally, the mentor has used CHTC within the past year.
              </Typography>
              <FormControl>
                <RadioGroup
                  value={mentorExpectation ?? ""}
                  onChange={(event) =>
                    setMentorExpectation((event.target.value as Exclude<MentorExpectation, null>) || null)
                  }
                >
                  <FormControlLabel value="YES" control={<Radio />} label="Yes" disabled={isSubmitting} />
                  <FormControlLabel value="NO" control={<Radio />} label="No" disabled={isSubmitting} />
                  <FormControlLabel value="MAYBE" control={<Radio />} label="Maybe" disabled={isSubmitting} />
                </RadioGroup>
              </FormControl>
            </Stack>

            {mentorExpectation === "YES" || mentorExpectation === "MAYBE" ? (
              <Stack spacing={1.5}>
                <Typography variant="h6">5. About Your Mentor</Typography>
                <Typography variant="body2">
                  This person will receive an email notification that you have requested a CHTC account.
                </Typography>
                <TextField
                  label="Mentor Name"
                  value={mentorName}
                  onChange={(event) => setMentorName(event.target.value)}
                  disabled={isSubmitting}
                />
                <TextField
                  label="Mentor Email"
                  type="email"
                  value={mentorEmail}
                  onChange={(event) => setMentorEmail(event.target.value)}
                  disabled={isSubmitting}
                />
              </Stack>
            ) : null}

            <Stack spacing={1.5}>
              <Typography variant="h6">6. How Did You Hear About CHTC?</Typography>
              <Typography variant="body2">Check all that apply.</Typography>
              <FormGroup>
                {marketingAttributionOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        checked={marketingAttribution.includes(option.value)}
                        onChange={() => setMarketingAttribution((current) => toggleValue(current, option.value))}
                        disabled={isSubmitting}
                      />
                    }
                    label={option.label}
                  />
                ))}
              </FormGroup>
            </Stack>
          </>
        );
      case 1:
        return (
          <>
            <Stack spacing={1.5}>
              <Typography variant="h6">7. Research Summary</Typography>
              <Typography variant="body2">
                Briefly describe your research to help us answer the question, &quot;How can CHTC help your
                research?&quot;
              </Typography>
              <TextField
                required
                multiline
                minRows={4}
                label="How CHTC Can Help"
                value={howChtcCanHelp}
                onChange={(event) => setHowChtcCanHelp(event.target.value)}
                disabled={isSubmitting}
              />
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant="h6">8. Research Computing Areas</Typography>
              <Typography variant="body2">
                Which of the following could be used to describe your research computing? Check all that apply.
              </Typography>
              <FormGroup>
                {researchComputingAreaOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        checked={researchComputingArea.includes(option.value)}
                        onChange={() => setResearchComputingArea((current) => toggleValue(current, option.value))}
                        disabled={isSubmitting}
                      />
                    }
                    label={option.label}
                  />
                ))}
              </FormGroup>
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant="h6">9. Software Plans</Typography>
              <Typography variant="body2">
                What is the primary software, program, or package that you plan on using? If possible, provide a link to
                the program&apos;s website.
              </Typography>
              <TextField
                multiline
                minRows={3}
                label="Software / Program / Link"
                value={softwareLink}
                onChange={(event) => setSoftwareLink(event.target.value)}
                disabled={isSubmitting}
              />
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant="h6">10. Prior Computing Systems</Typography>
              <Typography variant="body2">
                Which of the following systems have you used for similar computing work? Check all that apply.
              </Typography>
              <FormGroup>
                {priorSystemOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        checked={priorSystems.includes(option.value)}
                        onChange={() => setPriorSystems((current) => toggleValue(current, option.value))}
                        disabled={isSubmitting}
                      />
                    }
                    label={option.label}
                  />
                ))}
              </FormGroup>
            </Stack>
          </>
        );
      case 2:
        return (
          <Stack spacing={1.5}>
            <Typography variant="h6">11. Resource Estimates</Typography>
            <Typography variant="body2">
              CHTC operates both a High Performance Computing (HPC) system and a High Throughput Computing (HTC) system.
            </Typography>
            <Typography variant="body2">
              A typical workload on the HTC system involves a calculation that in principle can be carried out on a
              personal computer within a couple of days, but which must be carried out hundreds or thousands of times,
              where each calculation is largely independent of the others. The GPUs managed by CHTC are only available
              through the HTC system.
            </Typography>
            <Typography variant="body2">
              A typical workload on the HPC system involves a calculation that requires many CPU cores (&gt;20-30) all
              working together in parallel. This calculation fundamentally cannot be broken down into smaller
              calculations, and utilizes code that has been designed to work with MPI (Message Passing Interface)
              parallelization.
            </Typography>
            <Typography variant="body2" pt={3}>
              Based on the above explanation, which system best fits your computing needs?
            </Typography>
            <FormControl required>
              <RadioGroup
                value={computingType ?? ""}
                onChange={(event) =>
                  setComputingType((event.target.value as Exclude<ComputingTypeOption, null>) || null)
                }
              >
                <FormControlLabel
                  value="High Throughput Computing (HTC)"
                  control={<Radio />}
                  label="High Throughput Computing (HTC)"
                  disabled={isSubmitting}
                />
                <FormControlLabel
                  value="High Performance Computing (HPC)"
                  control={<Radio />}
                  label="High Performance Computing (HPC)"
                  disabled={isSubmitting}
                />
                <FormControlLabel
                  value="Both HTC & HPC"
                  control={<Radio />}
                  label="Both HTC & HPC"
                  disabled={isSubmitting}
                />
                <FormControlLabel value="Not sure" control={<Radio />} label="Not sure" disabled={isSubmitting} />
              </RadioGroup>
            </FormControl>
            <Typography variant="body2" pt={3}>
              For the following questions, please estimate the amount of resources you need for a single, typical
              calculation. If you planning to run more than one kind of calculation, provide the estimate for the larger
              or most-intense calculation.
            </Typography>
            <Typography variant="body2">(You can skip these questions if you are not sure.)</Typography>
            <Box pt={3}>
              <Stack spacing={3} divider={<Divider flexItem />}>
                <ResourceEstimateField
                  question="How many CPU cores does one calculation need? (Modern computers typically have 4-8+ CPU cores per machine.)"
                  value={cpuCores}
                  options={cpuCoreOptions}
                  onChange={setCpuCores}
                  disabled={isSubmitting}
                />
                <ResourceEstimateField
                  question="How much memory/RAM (in GB) does one calculation need? (Modern computers typically have 4-16 GB per machine.)"
                  value={memoryGb}
                  options={memoryOptions}
                  onChange={setMemoryGb}
                  disabled={isSubmitting}
                />
                <ResourceEstimateField
                  question="How much disk space (in GB) does one calculation need? Include the size of the input and output data, as well as any programs or scripts, if possible."
                  value={diskSpaceGb}
                  options={diskSpaceOptions}
                  onChange={setDiskSpaceGb}
                  disabled={isSubmitting}
                />
                <ResourceEstimateField
                  question="How long (in hours) does your calculation take to run using the resources you selected above?"
                  value={calculationRuntimeHours}
                  options={runtimeOptions}
                  onChange={setCalculationRuntimeHours}
                  disabled={isSubmitting}
                />
                <Stack spacing={1.5}>
                  <Typography variant="body1">Does your calculation need GPU(s)?</Typography>
                  <FormControl>
                    <RadioGroup
                      value={gpuType ?? ""}
                      onChange={(event) => setGpuType((event.target.value as Exclude<GpuTypeOption, null>) || null)}
                    >
                      <FormControlLabel value="Not sure" control={<Radio />} label="Not sure" disabled={isSubmitting} />
                      <FormControlLabel
                        value="No, my calculation does not need a GPU"
                        control={<Radio />}
                        label="No, my calculation does not need a GPU"
                        disabled={isSubmitting}
                      />
                      <FormControlLabel
                        value="Yes, my calculation needs a single GPU"
                        control={<Radio />}
                        label="Yes, my calculation needs a single GPU"
                        disabled={isSubmitting}
                      />
                      <FormControlLabel
                        value="Yes, my calculation needs multiple GPUs"
                        control={<Radio />}
                        label="Yes, my calculation needs multiple GPUs"
                        disabled={isSubmitting}
                      />
                    </RadioGroup>
                  </FormControl>
                </Stack>
                <Stack spacing={1.5}>
                  <Typography variant="body1">
                    How many calculations like the one you&apos;ve described above do you want to run?
                  </Typography>
                  <TextField
                    label="Calculation Quantity"
                    value={calculationQuantity}
                    onChange={(event) => setCalculationQuantity(event.target.value)}
                    disabled={isSubmitting}
                  />
                </Stack>
              </Stack>
            </Box>
          </Stack>
        );
      case 3:
        return (
          <>
            <Stack spacing={1.5}>
              <Typography variant="h6">12. Special Access</Typography>
              <Typography variant="body2">
                Are there any specific partitions, group folders, or similar resources that you need to be added to? If
                yes, please describe.
              </Typography>
              <TextField
                multiline
                minRows={3}
                label="Special Access"
                value={specialAccess}
                onChange={(event) => setSpecialAccess(event.target.value)}
                disabled={isSubmitting}
              />
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant="h6">13. Additional Information</Typography>
              <Typography variant="body2">
                Please provide any additional information that would aid us in creating your account.
              </Typography>
              <TextField
                multiline
                minRows={4}
                label="Additional Information"
                value={extraInfo}
                onChange={(event) => setExtraInfo(event.target.value)}
                disabled={isSubmitting}
              />
            </Stack>
          </>
        );
      default:
        return null;
    }
  };

  if (submitSuccess || currentUser?.user_forms?.sort((a, b) => b.id - a.id)?.[0]?.status === "PENDING") {
    return <SuccessfulSubmitView />;
  }

  return (
    <>
      <Typography variant="h4">Account Request Form</Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={4}>
          <Stack spacing={4}>{renderStepContent()}</Stack>

          {visibleValidationMessage ? <Alert severity="info">{visibleValidationMessage}</Alert> : null}
          {error ? (
            <Alert severity="error">{typeof error === "string" ? error : "Failed to submit form."}</Alert>
          ) : null}

          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Button type="button" variant="outlined" onClick={handleBack} disabled={currentStep === 0 || isSubmitting}>
              Back
            </Button>
            {isLastStep ? (
              <Button
                key="submit-button"
                type="submit"
                variant="contained"
                disabled={Boolean(submitValidationMessage) || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            ) : (
              <Button
                key="next-button"
                type="button"
                variant="contained"
                onClick={handleNext}
                disabled={Boolean(currentStepValidationMessage) || isSubmitting}
              >
                Next
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>
    </>
  );
}

export default UserApplicationCreateForm;
