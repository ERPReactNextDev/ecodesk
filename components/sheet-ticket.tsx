"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FieldGroup,
  FieldSet,
  FieldLabel,
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ===== HANDLING TIME COMPUTATION HELPERS (DISPLAY ONLY) =====

function toDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function formatDuration(ms: number) {
  if (ms < 0) return "INVALID TIME";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}

function computeSimpleDiff(start?: string, end?: string) {
  const s = toDate(start);
  const e = toDate(end);

  if (!s || !e) return "";
  if (e < s) return "INVALID DATE";

  return formatDuration(e.getTime() - s.getTime());
}

function computeCSRResponseTime(
  ticketReceived?: string,
  ticketEndorsed?: string,
) {
  const start = toDate(ticketReceived);
  const end = toDate(ticketEndorsed);

  if (!start || !end) return "";

  // Sunday check (Excel WEEKDAY = 7)
  if (start.getDay() === 0 || end.getDay() === 0) {
    return "0h 0m 0s";
  }

  if (end < start) return "INVALID DATE";

  const WORK_START = 8;
  const WORK_END = 19;

  let startWork = new Date(start);
  startWork.setHours(WORK_START, 0, 0, 0);

  let endWork = new Date(end);
  endWork.setHours(WORK_END, 0, 0, 0);

  const effectiveStart = start > startWork ? start : startWork;
  const effectiveEnd = end < endWork ? end : endWork;

  if (effectiveEnd < effectiveStart) return "INVALID TIME";

  return formatDuration(effectiveEnd.getTime() - effectiveStart.getTime());
}

function computeTSAResponseTime(
  wrapUp: string,
  tsaAck?: string,
  tsaHandle?: string,
  ticketEndorsed?: string,
) {
  const excluded = [
    "CustomerFeedback/Recommendation",
    "Job Inquiry",
    "Job Applicants",
    "Inquiry",
    "Supplier/Vendor Product Offer",
    "Internal Whistle Blower",
    "Threats / Extortion / Intimidation",
    "Prank Call",
  ];

  if (excluded.includes(wrapUp)) return "";
  const ack = toDate(tsaAck);
  const endorsed = toDate(ticketEndorsed);
  if (!ack || !endorsed) return "";
  if (ack < endorsed) return "INVALID DATE";
  return formatDuration(ack.getTime() - endorsed.getTime());
}

function computeTSMResponseTime(
  wrapUp: string,
  tsmAck?: string,
  ticketEndorsed?: string,
) {
  const excluded = [
    "CustomerFeedback/Recommendation",
    "Job Inquiry",
    "Job Applicants",
    "Supplier/Vendor Product Offer",
    "Internal Whistle Blower",
    "Threats / Extortion / Intimidation",
    "Prank Call",
  ];

  if (excluded.includes(wrapUp)) return "";

  const ack = toDate(tsmAck);
  const endorsed = toDate(ticketEndorsed);
  if (!ack || !endorsed) return "";
  if (ack < endorsed) return "INVALID DATE";
  return formatDuration(ack.getTime() - endorsed.getTime());
}

function computeTSMHandlingTime(
  wrapUp: string,
  tsmAck?: string,
  tsmHandle?: string,
  ticketReceived?: string,
) {
  const excluded = [
    "CustomerFeedback/Recommendation",
    "Job Inquiry",
    "Job Applicants",
    "Supplier/Vendor Product Offer",
    "Internal Whistle Blower",
    "Threats / Extortion / Intimidation",
    "Prank Call",
  ];

  if (excluded.includes(wrapUp)) return "";

  const ack = toDate(tsmAck);
  const received = toDate(ticketReceived);
  if (!ack || !received) return "";
  if (ack < received) return "INVALID DATE";
  return formatDuration(ack.getTime() - received.getTime());
}

function computeNonQuotationHT(remarks: string, baseTime: string) {
  const list = [
    "NO STOCKS / INSUFFICIENT STOCKS",
    "CUSTOMER REQUEST CANCELLATION",
    "INSUFFICIENT STOCKS",
    "UNABLE TO CONTACT CUSTOMER",
    "ITEM NOT CARRIED",
    "WAITING FOR CLIENT CONFIRMATION",
    "CUSTOMER REQUESTED CANCELLATION",
    "ACCREDITATION/PARTNERSHIP",
    "NO RESPONSE FROM CLIENT",
    "ASSISTED",
    "FOR SITE VISIT",
    "NON STANDARD ITEM",
    "PO RECEIVED",
    "PENDING QUOTATION",
    "FOR OCCULAR INSPECTION",
  ];

  return list.includes((remarks || "").toUpperCase()) ? baseTime : "";
}

function computeQuotationHT(remarks: string, baseTime: string) {
  const list = ["QUOTATION FOR APPROVAL", "SOLD"];
  return list.includes((remarks || "").toUpperCase()) ? baseTime : "";
}

function getMinDateTimeLocal(daysBack: number) {
  const now = new Date();

  const min = new Date(now);
  min.setDate(now.getDate() - daysBack);
  min.setSeconds(0);
  min.setMilliseconds(0);

  return min.toISOString().slice(0, 16);
}

function getMaxDateTimeLocal() {
  const now = new Date();

  now.setSeconds(0);
  now.setMilliseconds(0);

  return now.toISOString().slice(0, 16);
}

function computeSpfHT(remarks: string, baseTime: string) {
  return (remarks || "").toUpperCase().includes("SPF") ? baseTime : "";
}

interface Option {
  value: string;
  title: string;
  description: string;
}

interface Activity {
  ticket_reference_number?: string | null;
  so_number: string;
  so_amount: number | string;
  product_quantity: string;
}

interface TicketSheetProps {
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  source: string;
  setSource: React.Dispatch<React.SetStateAction<string>>;
  ticketReceived: string;
  setTicketReceived: React.Dispatch<React.SetStateAction<string>>;
  ticketEndorsed: string;
  setTicketEndorsed: React.Dispatch<React.SetStateAction<string>>;
  handlingCSR: string;
  setHandlingCSR: React.Dispatch<React.SetStateAction<string>>;
  inquiryReceived: string;
  setInquiryReceived: React.Dispatch<React.SetStateAction<string>>;
  responseToInquiry: string;
  setResponseToInquiry: React.Dispatch<React.SetStateAction<string>>;
  gender: string;
  setGender: React.Dispatch<React.SetStateAction<string>>;
  channel: string;
  setChannel: React.Dispatch<React.SetStateAction<string>>;
  wrapUp: string;
  setWrapUp: React.Dispatch<React.SetStateAction<string>>;
  customerType: string;
  setCustomerType: React.Dispatch<React.SetStateAction<string>>;
  customerStatus: string;
  setCustomerStatus: React.Dispatch<React.SetStateAction<string>>;
  status: string;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
  department: string;
  setDepartment: React.Dispatch<React.SetStateAction<string>>;
  manager: string;
  setManager: React.Dispatch<React.SetStateAction<string>>;
  agent: string;
  setAgent: React.Dispatch<React.SetStateAction<string>>;
  remarks: string;
  setRemarks: React.Dispatch<React.SetStateAction<string>>;
  inquiry: string;
  setInquiry: React.Dispatch<React.SetStateAction<string>>;
  itemCode: string;
  setItemCode: React.Dispatch<React.SetStateAction<string>>;
  itemDescription: string;
  setItemDescription: React.Dispatch<React.SetStateAction<string>>;
  poNumber: string;
  setPoNumber: React.Dispatch<React.SetStateAction<string>>;
  soDate: string;
  setSoDate: React.Dispatch<React.SetStateAction<string>>;
  soNumber: string;
  setSoNumber: React.Dispatch<React.SetStateAction<string>>;
  soAmount: string;
  setSoAmount: React.Dispatch<React.SetStateAction<string>>;
  quotationNumber: string;
  setQuotationNumber: React.Dispatch<React.SetStateAction<string>>;
  quotationAmount: string;
  setQuotationAmount: React.Dispatch<React.SetStateAction<string>>;
  qtySold: string;
  setQtySold: React.Dispatch<React.SetStateAction<string>>;
  paymentTerms: string;
  setPaymentTerms: React.Dispatch<React.SetStateAction<string>>;
  poSource: string;
  setPoSource: React.Dispatch<React.SetStateAction<string>>;
  paymentDate: string;
  setPaymentDate: React.Dispatch<React.SetStateAction<string>>;
  deliveryDate: string;
  setDeliveryDate: React.Dispatch<React.SetStateAction<string>>;
  dateCreated: string;
  setDateCreated: React.Dispatch<React.SetStateAction<string>>;
  ticketReferenceNumber: string;
  setTicketReferenceNumber: React.Dispatch<React.SetStateAction<string>>;
  closeReason: string;
  setCloseReason: React.Dispatch<React.SetStateAction<string>>;
  counterOffer: string;
  setCounterOffer: React.Dispatch<React.SetStateAction<string>>;
  clientSpecs: string;
  setClientSpecs: React.Dispatch<React.SetStateAction<string>>;
  tsmAcknowledgeDate: string;
  setTsmAcknowledgeDate: React.Dispatch<React.SetStateAction<string>>;
  tsaAcknowledgeDate: string;
  setTsaAcknowledgeDate: React.Dispatch<React.SetStateAction<string>>;
  tsmHandlingTime: string;
  setTsmHandlingTime: React.Dispatch<React.SetStateAction<string>>;
  tsaHandlingTime: string;
  setTsaHandlingTime: React.Dispatch<React.SetStateAction<string>>;
  hrAcknowledgeDate: string;
  setHrAcknowledgeDate: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  referenceid: string;
  department_head: string;
  setDepartmentHead: React.Dispatch<React.SetStateAction<string>>;
  handleBack: () => void;
  handleNext: () => void;
  handleUpdate: (agentReassigned: boolean) => void;
}

// ===== REUSABLE COMBOBOX COMPONENT =====
const ComboboxField = ({
  value,
  onChange,
  placeholder,
  options,
  error,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string; disabled?: boolean }[];
  error?: string;
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);

  const sorted = [...options].sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  const selectedLabel = sorted.find((o) => o.value === value)?.label;

  return (
    <Field>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            <span className={cn(!selectedLabel && "text-muted-foreground")}>
              {selectedLabel ?? placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {sorted.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    disabled={option.disabled}
                    onSelect={() => {
                      if (option.disabled) return;
                      onChange(option.value === value ? "" : option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      option.disabled && "opacity-40 cursor-not-allowed pointer-events-none",
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </Field>
  );
};

// Reusable Radio Group
const RadioOptionsGroup = ({
  options,
  value,
  onChange,
  error,
}: {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) => (
  <FieldGroup>
    <FieldSet>
      <RadioGroup value={value} onValueChange={onChange}>
        {options.map(({ value: val, title, description }) => (
          <FieldLabel key={val}>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>{title}</FieldTitle>
                <FieldDescription>{description}</FieldDescription>
              </FieldContent>
              <RadioGroupItem value={val} />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </FieldSet>
  </FieldGroup>
);

// Reusable Input Field
const InputField = ({
  type = "text",
  value,
  onChange,
  placeholder,
  description,
  rows,
  error,
  min,
  max,
}: {
  type?: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  placeholder?: string;
  description?: string;
  rows?: number;
  error?: string;
  min?: string;
  max?: string;
}) => (
  <Field>
    {description && <FieldDescription>{description}</FieldDescription>}

    {type === "textarea" ? (
      <>
        <Textarea
          rows={rows || 3}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="capitalize"
        />
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      </>
    ) : (
      <>
        <Input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          max={max}
        />
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      </>
    )}
  </Field>
);

function getTimeOfDayCardStyle(datetime?: string) {
  if (!datetime) return "border-gray-200 bg-gray-50";

  const hour = new Date(datetime).getHours();

  if (hour >= 6 && hour < 8) return "border-orange-400 bg-orange-100";
  if (hour >= 8 && hour < 12) return "border-yellow-400 bg-yellow-100";
  if (hour >= 12 && hour < 15) return "border-blue-400 bg-blue-100";
  if (hour >= 15 && hour < 17) return "border-green-400 bg-green-100";
  if (hour >= 17 && hour < 18) return "border-purple-400 bg-purple-100";
  if (hour >= 18 && hour < 21) return "border-indigo-400 bg-indigo-100";

  return "border-slate-400 bg-slate-200";
}

export function TicketSheet(props: TicketSheetProps) {
  const {
    step,
    setStep,
    department,
    setDepartment,
    dateCreated,
    setDateCreated,
    ticketReceived,
    setTicketReceived,
    ticketEndorsed,
    setTicketEndorsed,
    handlingCSR,
    setHandlingCSR,
    inquiryReceived,
    setInquiryReceived,
    responseToInquiry,
    setResponseToInquiry,
    gender,
    setGender,
    channel,
    setChannel,
    wrapUp,
    setWrapUp,
    source,
    setSource,
    customerStatus,
    setCustomerStatus,
    customerType,
    setCustomerType,
    remarks,
    setRemarks,
    inquiry,
    setInquiry,
    itemCode,
    setItemCode,
    itemDescription,
    setItemDescription,
    poNumber,
    setPoNumber,
    soDate,
    setSoDate,
    paymentTerms,
    setPaymentTerms,
    poSource,
    setPoSource,
    paymentDate,
    setPaymentDate,
    deliveryDate,
    setDeliveryDate,
    quotationNumber,
    setQuotationNumber,
    quotationAmount,
    setQuotationAmount,
    status,
    setStatus,
    soNumber,
    setSoNumber,
    soAmount,
    setSoAmount,
    qtySold,
    setQtySold,
    manager,
    setManager,
    agent,
    setAgent,
    department_head,
    setDepartmentHead,
    ticketReferenceNumber,
    setTicketReferenceNumber,
    closeReason,
    setCloseReason,
    counterOffer,
    setCounterOffer,
    clientSpecs,
    setClientSpecs,
    tsmAcknowledgeDate,
    setTsmAcknowledgeDate,
    tsaAcknowledgeDate,
    setTsaAcknowledgeDate,
    tsmHandlingTime,
    setTsmHandlingTime,
    tsaHandlingTime,
    setTsaHandlingTime,
    hrAcknowledgeDate,
    setHrAcknowledgeDate,
    handleBack,
    handleNext,
    handleUpdate,
  } = props;

  // ================= ASSIGNEE (DYNAMIC USERS) =================

  const allowedDepartmentHeads = [
    "DT-PH-994793",
    "SH-NCR-560908",
    "BR-PH-358329",
    "AP-NCR-858614",
    "MT-PH-922405"
  ];

  const [departmentHeadsList, setDepartmentHeadsList] = useState<User[]>([]);
  const [loadingDepartmentHeads, setLoadingDepartmentHeads] = useState(false);

  interface User {
    ReferenceID: string;
    Firstname: string;
    Lastname: string;
    Role?: string;
    Department?: string;
    Connection?: string;
  }

  const [managersList, setManagersList] = useState<User[]>([]);
  const [managersAvailable, setManagersAvailable] = useState(0);
  const [agentsList, setAgentsList] = useState<User[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);

  // ================= REVERT MODE =================
  const [revertMode, setRevertMode] = useState(false);
  const [revertDepartmentHeadsList, setRevertDepartmentHeadsList] = useState<User[]>([]);
  const [revertManagersList, setRevertManagersList] = useState<User[]>([]);
  const [revertAgentsList, setRevertAgentsList] = useState<User[]>([]);
  const [loadingRevert, setLoadingRevert] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [errorActivities, setErrorActivities] = useState<string | null>(null);

  // ================= FETCH DEPARTMENT HEADS =================

  useEffect(() => {
    // Marketing department doesn't have Department Heads - skip fetching
    if (department === "Marketing") {
      setDepartmentHeadsList([]);
      setDepartmentHead(""); // Clear any existing department head
      return;
    }

    // CSR department doesn't have Department Heads - skip fetching
    if (department === "CSR") {
      setDepartmentHeadsList([]);
      setDepartmentHead(""); // Clear any existing department head
      return;
    }

    // Only fetch department heads when department is selected
    if (!department) {
      setDepartmentHeadsList([]);
      setDepartmentHead("");
      return;
    }

    setLoadingDepartmentHeads(true);

    fetch(`/api/fetch-users-by-role?filterDepartmentHeads=true&department=${encodeURIComponent(department)}`)
      .then((res) => res.json())
      .then((json) => {
        const list: User[] = json.data || [];
        console.log(`[sheet-ticket] Received ${list.length} department heads for ${department}:`, list.map((u: User) => `${u.Firstname} ${u.Lastname} (${u.ReferenceID})`));
        setDepartmentHeadsList(list);
      })
      .catch(() => setDepartmentHeadsList([]))
      .finally(() => setLoadingDepartmentHeads(false));
  }, [department, setDepartmentHead]);

  // ================= FETCH MANAGERS (TSM / Marketing Manager) =================

  useEffect(() => {
    // Marketing department doesn't use department head - fetch manager directly by department
    if (department === "Marketing") {
      setLoadingManagers(true);

      console.log(`[sheet-ticket] Fetching Marketing managers for department: ${department}`);
      fetch(
        `/api/fetch-users-by-role?filterMarketingManagers=true&department=${encodeURIComponent(department)}&currentUser=${manager || ""}`,
      )
        .then((res) => res.json())
        .then((json) => {
          const list = json.data || [];
          console.log(`[sheet-ticket] Received ${list.length} Marketing managers:`, list.map((u: User) => `${u.Firstname} ${u.Lastname} (${u.ReferenceID})`));
          setManagersList(list);
          setManagersAvailable(list.length);
        })
        .catch(() => {
          setManagersList([]);
          setManagersAvailable(0);
        })
        .finally(() => setLoadingManagers(false));
      return;
    }

    // CSR department doesn't use department head - fetch CSR Admin as manager
    if (department === "CSR") {
      setLoadingManagers(true);

      console.log(`[sheet-ticket] Fetching CSR Admin as manager for department: ${department}`);
      fetch(
        `/api/fetch-users-by-role?filterCSRAdmin=true&department=${encodeURIComponent(department)}&currentUser=${manager || ""}`,
      )
        .then((res) => res.json())
        .then((json) => {
          const list = json.data || [];
          console.log(`[sheet-ticket] Received ${list.length} CSR Admin (manager):`, list.map((u: User) => `${u.Firstname} ${u.Lastname} (${u.ReferenceID})`));
          setManagersList(list);
          setManagersAvailable(list.length);
        })
        .catch(() => {
          setManagersList([]);
          setManagersAvailable(0);
        })
        .finally(() => setLoadingManagers(false));
      return;
    }

    // For non-Marketing/CSR departments: Only fetch managers when department head is selected
    if (!department_head) {
      setManagersList([]);
      setManager("");
      setAgentsList([]);
      setAgent("");
      return;
    }

    setLoadingManagers(true);

    console.log(`[sheet-ticket] Fetching managers (TSM) under department head: ${department_head}`);
    fetch(
      `/api/fetch-users-by-role?filterManagers=true&manager=${encodeURIComponent(department_head)}&currentUser=${manager || ""}`,
    )
      .then((res) => res.json())
      .then((json) => {
        const list = json.data || [];
        console.log(`[sheet-ticket] Received ${list.length} managers (TSM):`, list.map((u: User) => `${u.Firstname} ${u.Lastname} (${u.ReferenceID})`));
        setManagersList(list);
        setManagersAvailable(list.length);
      })
      .catch(() => {
        setManagersList([]);
        setManagersAvailable(0);
      })
      .finally(() => setLoadingManagers(false));
  }, [department, department_head, manager]);

  // ================= FETCH AGENTS (TS Associate / Marketing Agent) =================
  useEffect(() => {
    // Special case: Sette Hosena (SH-NCR-560908) - fetch agents by her ReferenceID in TSM field
    const SETTE_HOSENA_REF_ID = "SH-NCR-560908";
    if (department_head === SETTE_HOSENA_REF_ID) {
      setLoadingAgents(true);

      console.log(`[sheet-ticket] Special case: Fetching agents for Sette Hosena by TSM reference`);
      fetch(
        `/api/fetch-users-by-role?filterAgentsByTSM=true&tsm=${encodeURIComponent(SETTE_HOSENA_REF_ID)}&currentUser=${agent || ""}`,
      )
        .then((res) => res.json())
        .then((json) => {
          const list = json.data || [];
          console.log(`[sheet-ticket] Received ${list.length} agents for Sette Hosena:`, list.map((u: User) => `${u.Firstname} ${u.Lastname} (${u.ReferenceID})`));
          setAgentsList(list);
        })
        .catch(() => setAgentsList([]))
        .finally(() => setLoadingAgents(false));
      return;
    }

    // Only fetch agents when manager is selected (for regular cases)
    if (!manager) {
      setAgentsList([]);
      setAgent("");
      return;
    }

    // Marketing department: fetch agents by department, role != Manager
    if (department === "Marketing") {
      setLoadingAgents(true);

      console.log(`[sheet-ticket] Fetching Marketing agents for department: ${department}, under manager: ${manager}`);
      fetch(
        `/api/fetch-users-by-role?filterMarketingAgents=true&department=${encodeURIComponent(department)}&manager=${encodeURIComponent(manager)}&currentUser=${agent || ""}`,
      )
        .then((res) => res.json())
        .then((json) => {
          const list = json.data || [];
          console.log(`[sheet-ticket] Received ${list.length} Marketing agents:`, list.map((u: User) => `${u.Firstname} ${u.Lastname} (${u.ReferenceID})`));
          setAgentsList(list);
        })
        .catch(() => setAgentsList([]))
        .finally(() => setLoadingAgents(false));
      return;
    }

    // CSR department: fetch CSR Staff as agents
    if (department === "CSR") {
      setLoadingAgents(true);

      console.log(`[sheet-ticket] Fetching CSR Staff as agents for department: ${department}`);
      fetch(
        `/api/fetch-users-by-role?filterCSRStaff=true&department=${encodeURIComponent(department)}&currentUser=${agent || ""}`,
      )
        .then((res) => res.json())
        .then((json) => {
          const list = json.data || [];
          console.log(`[sheet-ticket] Received ${list.length} CSR Staff (agents):`, list.map((u: User) => `${u.Firstname} ${u.Lastname} (${u.ReferenceID})`));
          setAgentsList(list);
        })
        .catch(() => setAgentsList([]))
        .finally(() => setLoadingAgents(false));
      return;
    }

    // For non-Marketing/CSR departments: fetch agents by TSM
    setLoadingAgents(true);

    console.log(`[sheet-ticket] Fetching agents (TS Associate) under TSM: ${manager}`);
    fetch(
      `/api/fetch-users-by-role?filterAgents=true&tsm=${encodeURIComponent(manager)}&currentUser=${agent || ""}`,
    )
      .then((res) => res.json())
      .then((json) => {
        const list = json.data || [];
        console.log(`[sheet-ticket] Received ${list.length} agents (TS Associate):`, list.map((u: User) => `${u.Firstname} ${u.Lastname} (${u.ReferenceID})`));
        setAgentsList(list);
      })
      .catch(() => setAgentsList([]))
      .finally(() => setLoadingAgents(false));
  }, [department, department_head, manager, agent]);

  // ================= FETCH REVERT MODE USERS =================
  useEffect(() => {
    if (!revertMode) return;

    setLoadingRevert(true);

    Promise.all([
      // All managers (Role=Manager, any department) as department heads
      fetch(`/api/fetch-users-by-role?filterDepartmentHeads=true&department=${encodeURIComponent(department || "Sales")}`)
        .then((r) => r.json())
        .then((j) => {
          // Fetch ALL department heads across common departments
          return Promise.all(
            ["Sales", "Business Development", "Marketing", "E-Commerce", "CSR", "Accounting", "Engineering", "Procurement", "Warehouse", "Human Resources"].map((dept) =>
              fetch(`/api/fetch-users-by-role?filterDepartmentHeads=true&department=${encodeURIComponent(dept)}`)
                .then((r) => r.json())
                .then((j) => j.data || [])
                .catch(() => [])
            )
          ).then((results) => {
            const all: User[] = results.flat();
            // Deduplicate by ReferenceID
            const seen = new Set<string>();
            return all.filter((u) => {
              if (seen.has(u.ReferenceID)) return false;
              seen.add(u.ReferenceID);
              return true;
            });
          });
        }),
      // All TSM (Territory Sales Manager)
      fetch(`/api/fetch-users-by-role?role=Territory Sales Manager`)
        .then((r) => r.json())
        .then((j) => j.data || [])
        .catch(() => []),
      // All TS Associates
      fetch(`/api/fetch-users-by-role?role=Territory Sales Associate`)
        .then((r) => r.json())
        .then((j) => j.data || [])
        .catch(() => []),
    ])
      .then(([dhs, mgrs, agts]) => {
        setRevertDepartmentHeadsList(dhs as User[]);
        setRevertManagersList(mgrs as User[]);
        setRevertAgentsList(agts as User[]);
      })
      .finally(() => setLoadingRevert(false));
  }, [revertMode, department]);

  // ================= FETCH ACTIVITIES =================
  const fetchActivities = useCallback(() => {
    setLoadingActivities(true);
    setErrorActivities(null);

    fetch("/api/act-fetch-history")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch activities");
        return res.json();
      })
      .then((data) => {
        const acts: Activity[] = data.activities || [];
        setActivities(acts);
      })
      .catch((err) => setErrorActivities(err.message))
      .finally(() => setLoadingActivities(false));
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // 1️⃣ Ticket Received vs Ticket Endorsed validation
  useEffect(() => {
    if (ticketReceived) {
      setDateCreated(ticketReceived);
    }

    if (!ticketReceived || !ticketEndorsed) {
      setTimeError(null);
      return;
    }

    const received = new Date(ticketReceived);
    const endorsed = new Date(ticketEndorsed);

    if (isNaN(received.getTime()) || isNaN(endorsed.getTime())) {
      setTimeError(null);
      return;
    }
    if (endorsed < received) {
      setTimeError("Ticket Endorsed cannot be earlier than Ticket Received.");
    } else {
      setTimeError(null);
    }
  }, [ticketReceived, ticketEndorsed]);

  useEffect(() => {
    if (!inquiryReceived || !responseToInquiry) {
      setInquiryTimeError(null);
      return;
    }

    const received = new Date(inquiryReceived);
    const responded = new Date(responseToInquiry);

    if (isNaN(received.getTime()) || isNaN(responded.getTime())) {
      setInquiryTimeError(null);
      return;
    }
    if (responded < received) {
      setInquiryTimeError("Response to Inquiry cannot be earlier than Inquiry Received.");
    } else {
      setInquiryTimeError(null);
    }
  }, [inquiryReceived, responseToInquiry]);

  useEffect(() => {
    if (!tsmAcknowledgeDate || !tsmHandlingTime) {
      setTsmTimeError(null);
      return;
    }
    const ack = new Date(tsmAcknowledgeDate);
    const handle = new Date(tsmHandlingTime);
    if (isNaN(ack.getTime()) || isNaN(handle.getTime())) {
      setTsmTimeError(null);
      return;
    }
    if (handle < ack) {
      setTsmTimeError("TSM Handling Time cannot be earlier than TSM Acknowledgement Time.");
    } else {
      setTsmTimeError(null);
    }
  }, [tsmAcknowledgeDate, tsmHandlingTime]);

  useEffect(() => {
    if (!tsaAcknowledgeDate || !tsaHandlingTime) {
      setTsaTimeError(null);
      return;
    }
    const ack = new Date(tsaAcknowledgeDate);
    const handle = new Date(tsaHandlingTime);
    if (isNaN(ack.getTime()) || isNaN(handle.getTime())) {
      setTsaTimeError(null);
      return;
    }
    if (handle < ack) {
      setTsaTimeError("TSA Handling Time cannot be earlier than TSA Acknowledgement Time.");
    } else {
      setTsaTimeError(null);
    }
  }, [tsaAcknowledgeDate, tsaHandlingTime]);

  // TSA Acknowledgement Date must not be earlier than Ticket Endorsed
  useEffect(() => {
    if (!tsaAcknowledgeDate || !ticketEndorsed) {
      setTsaAckEndorseError(null);
      return;
    }
    const ack = new Date(tsaAcknowledgeDate);
    const endorsed = new Date(ticketEndorsed);
    if (isNaN(ack.getTime()) || isNaN(endorsed.getTime())) {
      setTsaAckEndorseError(null);
      return;
    }
    if (ack < endorsed) {
      setTsaAckEndorseError("TSA Acknowledgement Date cannot be earlier than Ticket Endorsed.");
    } else {
      setTsaAckEndorseError(null);
    }
  }, [tsaAcknowledgeDate, ticketEndorsed]);

  // TSM Handling Time must not be earlier than Ticket Received
  useEffect(() => {
    if (!tsmHandlingTime || !ticketReceived) {
      setTsmHandlingReceivedError(null);
      return;
    }
    const handle = new Date(tsmHandlingTime);
    const received = new Date(ticketReceived);
    if (isNaN(handle.getTime()) || isNaN(received.getTime())) {
      setTsmHandlingReceivedError(null);
      return;
    }
    if (handle < received) {
      setTsmHandlingReceivedError("TSM Handling Time cannot be earlier than Ticket Received.");
    } else {
      setTsmHandlingReceivedError(null);
    }
  }, [tsmHandlingTime, ticketReceived]);

  // 2️⃣ Close Reason → Auto dash logic
  useEffect(() => {
    if (closeReason === "Same Specs Provided") {
      setCounterOffer("-");
      setClientSpecs("-");
    } else {
      if (counterOffer === "-") setCounterOffer("");
      if (clientSpecs === "-") setClientSpecs("");
    }
  }, [closeReason]);

  useEffect(() => {
    if (agent) {
      setHighlightAgent(false);
    }
  }, [agent]);

  // 3️⃣ Channel → Source auto dash logic
  useEffect(() => {
    const channelsWithSource = [
      "Viber",
      "Text Message",
      "Website",
      "Voice Call",
      "Whatsapp",
    ];

    if (!channelsWithSource.includes(channel)) {
      setSource("-");
    }
  }, [channel]);

  const groupedActivities = activities.filter(
    (act) => act.ticket_reference_number === ticketReferenceNumber,
  );

  const soNumberFromActivity =
    groupedActivities.find((act) => act.so_number)?.so_number ?? "N/A";

  const soAmountFromActivity =
    groupedActivities.find((act) => act.so_amount)?.so_amount ?? "N/A";

  const productQuantityFromActivity =
    groupedActivities.find((act) => act.product_quantity)?.product_quantity ??
    "N/A";

  const handleApplySO = () => {
    if (soNumberFromActivity !== "N/A") {
      setSoNumber(String(soNumberFromActivity));
    }
    if (soAmountFromActivity !== "N/A") {
      setSoAmount(String(soAmountFromActivity));
    }
    if (productQuantityFromActivity !== "N/A") {
      setQtySold(String(productQuantityFromActivity));
    }
  };

  const [errors, setErrors] = useState<{
    ticketReceived?: string;
    ticketEndorsed?: string;
    channel?: string;
    wrapUp?: string;
    status?: string;
    customerStatus?: string;
    customerType?: string;
  }>({});

  const [timeError, setTimeError] = useState<string | null>(null);
  const [tsmTimeError, setTsmTimeError] = useState<string | null>(null);
  const [tsaTimeError, setTsaTimeError] = useState<string | null>(null);
  const [inquiryTimeError, setInquiryTimeError] = useState<string | null>(null);
  // TSA Ack must not be earlier than Ticket Endorsed
  const [tsaAckEndorseError, setTsaAckEndorseError] = useState<string | null>(null);
  // TSM Handling must not be earlier than Ticket Received
  const [tsmHandlingReceivedError, setTsmHandlingReceivedError] = useState<string | null>(null);
  const isManagerRequiredButMissing = !revertMode && managersAvailable > 0 && !manager;
  const [highlightAgent, setHighlightAgent] = useState(false);
  const [agentReassigned, setAgentReassigned] = useState(false);

  // ===== HANDLING TIME COMPUTATIONS =====
  const csrTime = computeCSRResponseTime(ticketReceived, ticketEndorsed);
  const tsaResponseTime = computeSimpleDiff(inquiryReceived, responseToInquiry);
  const tsaHandlingTimeFinal = computeSimpleDiff(tsaAcknowledgeDate, tsaHandlingTime);
  const baseHT = computeSimpleDiff(ticketReceived, ticketEndorsed);
  const nonQuotationHT = computeNonQuotationHT(remarks, baseHT);
  const quotationHT = computeQuotationHT(remarks, baseHT);
  const spfHT = computeSpfHT(remarks, baseHT);

  // ===== ALL DROPDOWN OPTIONS (ALPHABETICAL) =====

  const handlingCSROptions = [
    { value: "Armando, Arendai", label: "Armando, Arendain" },
    { value: "Erica, Maestro", label: "Erica, Maestro" },
    { value: "Lester, Miguel", label: "Lester, Miguel" },
    { value: "Mark Vincent, Capin", label: "Mark Vincent, Capin" },
    { value: "Maureen, Gabriel", label: "Maureen, Gabriel" },
    { value: "Myra, Quinto", label: "Myra, Quinto" },
    { value: "Rikki, Paje", label: "Rikki, Paje" },
  ].sort((a, b) => a.label.localeCompare(b.label));

  const channelOptions = [
    { value: "Email", label: "Email" },
    { value: "FB ES Home", label: "FB ES Home" },
    { value: "FB Leads", label: "FB Leads" },
    { value: "FB Main", label: "FB Main" },
    { value: "Google Maps", label: "Google Maps" },
    { value: "Instagram", label: "Instagram" },
    { value: "Shopify", label: "Shopify" },
    { value: "Text Message", label: "Text Message" },
    { value: "Viber", label: "Viber" },
    { value: "Voice Call", label: "Voice Call" },
    { value: "Website", label: "Website" },
    { value: "Whatsapp", label: "Whatsapp" },
  ].sort((a, b) => a.label.localeCompare(b.label));

  const sourceOptions = [
    { value: "Agent Call", label: "Agent Call" },
    { value: "Catalogue", label: "Catalogue" },
    { value: "Conex", label: "Conex" },
    { value: "Email Blast", label: "Email Blast" },
    { value: "FB Ads", label: "FB Ads" },
    { value: "Google Search", label: "Google Search" },
    { value: "Lazada", label: "Lazada" },
    { value: "LNB", label: "LNB" },
    { value: "LNB Events", label: "LNB Events" },
    { value: "PhilConstruct", label: "PhilConstruct" },
    { value: "Product Demo", label: "Product Demo" },
    { value: "Quotation Docs", label: "Quotation Docs" },
    { value: "Shopee", label: "Shopee" },
    { value: "Site Visit", label: "Site Visit" },
    { value: "SMS", label: "SMS" },
    { value: "Tiktok", label: "Tiktok" },
    { value: "UAP Partnership", label: "UAP Partnership" },
    { value: "Viber", label: "Viber Community" },
    { value: "Website", label: "Website" },
    { value: "Whatsapp", label: "Whatsapp Community" },
    { value: "Word of Mouth", label: "Word of Mouth" },
    { value: "Worldbex", label: "Worldbex" },
  ].sort((a, b) => a.label.localeCompare(b.label));

  const wrapUpOptions = [
    { value: "After Sales", label: "After Sales" },
    { value: "Customer Complaint", label: "Customer Complaint" },
    { value: "Customer Feedback/Recommendation", label: "Customer Feedback/Recommendation" },
    { value: "Customer Inquiry Non-Sales", label: "Customer Inquiry Non-Sales" },
    { value: "Customer Inquiry Sales", label: "Customer Inquiry Sales" },
    { value: "Customer Order", label: "Customer Order" },
    { value: "Follow Up Non-Sales", label: "Follow Up Non-Sales" },
    { value: "Follow Up Sales", label: "Follow Up Sales" },
    { value: "Inquiry", label: "Inquiry" },
    { value: "Internal Concern", label: "Internal Concern" },
    { value: "Internal Whistle Blower", label: "Internal Whistle Blower" },
    { value: "Job Applicants", label: "Job Applicants" },
    { value: "Others", label: "Others" },
    { value: "Supplier Accredited Request", label: "Supplier Accredited Request" },
    { value: "Supplier/Vendor Product Offer", label: "Supplier/Vendor Product Offer" },
    { value: "Threats/Extortion/Intimidation", label: "Threats/Extortion/Intimidation" },
  ].sort((a, b) => a.label.localeCompare(b.label));

  const remarksOptions = [
    { value: "Accreditation / Partnership", label: "Accreditation / Partnership" },
    { value: "Assisted", label: "Assisted" },
    { value: "Customer Request Cancellation", label: "Customer Request Cancellation" },
    { value: "Disapproved Quotation", label: "Disapproved Quotation" },
    { value: "For Occular Inspection", label: "For Occular Inspection" },
    { value: "For Site Visit", label: "For Site Visit" },
    { value: "For SPF", label: "For SPF" },
    { value: "Item Not Carried", label: "Item Not Carried" },
    { value: "No Response For Client", label: "No Response For Client" },
    { value: "No Stocks / Insufficient Stocks", label: "No Stocks / Insufficient Stocks" },
    { value: "Non Standard Item", label: "Non Standard Item" },
    { value: "Not Converted to Sales", label: "Not Converted to Sales" },
    { value: "Pending Quotation", label: "Pending Quotation" },
    { value: "Po Received", label: "Po Received" },
    { value: "Quotation For Approval", label: "Quotation For Approval" },
    { value: "Sold", label: "Sold" },
    { value: "Unable to Contact Customer", label: "Unable to Contact Customer" },
    { value: "Waiting for Client Confirmation", label: "Waiting for Client Confirmation" },
  ].sort((a, b) => a.label.localeCompare(b.label));

  const paymentTermsOptions = [
    { value: "30 Days Terms", label: "30 Days Terms" },
    { value: "Bank Deposit", label: "Bank Deposit" },
    { value: "Cash", label: "Cash" },
    { value: "Dated Check", label: "Dated Check" },
  ].sort((a, b) => a.label.localeCompare(b.label));

  const poSourceOptions = [
    { value: "CS Email", label: "CS Email" },
    { value: "Sales Agent", label: "Sales Agent" },
    { value: "Sales Email", label: "Sales Email" },
  ].sort((a, b) => a.label.localeCompare(b.label));

  const closeReasonOptions = [
    { value: "Client Declined", label: "Client Declined" },
    { value: "Counter Offer", label: "Counter Offer" },
    { value: "Not Interested", label: "Not Interested" },
    { value: "Others", label: "Others" },
    { value: "Out of Stock", label: "Out of Stock" },
    { value: "Same Specs Provided", label: "Same Specs Provided" },
  ].sort((a, b) => a.label.localeCompare(b.label));

  // Options for Radio Groups
  const departmentOptions: Option[] = [
    { value: "Accounting", title: "Accounting", description: "Handle initial client contact for financial matters and updates." },
    { value: "Business Development", title: "Business Development", description: "Manage client outreach and relationship building activities." },
    { value: "CS", title: "CS", description: "Handle customer service concerns and support requests." },
    { value: "E-Commerce", title: "E-Commerce", description: "Conduct follow-up calls to monitor progress and gather additional requirements." },
    { value: "Engineering", title: "Engineering", description: "Provide technical support and follow up on project developments." },
    { value: "Human Resources", title: "Human Resources", description: "Manage employee relations and follow-up on HR-related inquiries." },
    { value: "Marketing", title: "Marketing", description: "Follow up on campaigns and coordinate client feedback." },
    { value: "Procurement", title: "Procurement", description: "Oversee purchasing processes and supplier communications." },
    { value: "Sales", title: "Sales", description: "Follow up on sales opportunities and client requests." },
    { value: "Warehouse", title: "Warehouse & Logistics", description: "Coordinate logistics and inventory follow-ups." },
  ];

  const customerStatusOptions: Option[] = [
    { value: "Existing Active", title: "Existing Active", description: "Has consistent or recent purchase activity." },
    { value: "Existing Inactive", title: "Existing Inactive", description: "Previously active but has no recent purchase activity." },
    { value: "New Client", title: "New Client", description: "A newly onboarded client with initial transactions." },
    { value: "New Non-Buying", title: "New Non-Buying", description: "Newly registered customer but has no purchasing history yet." },
  ];

  const customerTypeOptions: Option[] = [
    { value: "B2B", title: "B2B", description: "Business-to-Business client category." },
    { value: "B2C", title: "B2C", description: "Business-to-Consumer, individual or household buyers." },
    { value: "B2G", title: "B2G", description: "Government agencies and public sector clients." },
    { value: "Gentrade", title: "Gentrade", description: "Gentrade partner or affiliated business accounts." },
    { value: "Modern Trade", title: "Modern Trade", description: "Large retail chains and commercial distributors." },
  ];

  const statusOptions: Option[] = [
    { value: "Closed", title: "Closed", description: "The process or item has been completed and finalized." },
    { value: "Converted into Sales", title: "Converted into Sales", description: "The item has progressed and resulted in a successful sale." },
    { value: "Endorsed", title: "Endorsed", description: "The item has been reviewed and forwarded for further action." },
  ];

  const validateStep3 = () => {
    const newErrors: typeof errors = {};
    if (!ticketReceived) newErrors.ticketReceived = "Ticket Received is required.";
    if (!ticketEndorsed) newErrors.ticketEndorsed = "Ticket Endorsed is required.";
    if (!channel) newErrors.channel = "Channel is required.";
    if (!wrapUp) newErrors.wrapUp = "Wrap Up is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors: typeof errors = {};
    if (!customerStatus) newErrors.customerStatus = "Customer Status is required.";
    if (!customerType) newErrors.customerType = "Customer Type is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep6 = () => {
    const newErrors: typeof errors = {};

    if (!status) {
      newErrors.status = "Status is required.";
    }

    if (status === "Closed" || status === "Converted into Sales") {
      if (!tsmAcknowledgeDate && !tsaAcknowledgeDate) {
        newErrors.status = "Either TSM or TSA Acknowledgement Date is required when closing or converting to sales.";
      }
      if (tsmAcknowledgeDate && !tsmHandlingTime) {
        newErrors.status = "TSM Handling Time is required.";
      }
      if (tsaAcknowledgeDate && !tsaHandlingTime) {
        newErrors.status = "TSA Handling Time is required.";
      }
      if (!closeReason.trim()) {
        newErrors.status = "Close reason is required.";
      }
      if (closeReason === "Counter Offer") {
        if (!counterOffer.trim()) newErrors.status = "Counter offer is required.";
        if (!clientSpecs.trim()) newErrors.status = "Client specs are required.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isJobApplicant = wrapUp === "Job Applicants";

  const onNext = () => {
    if (step === 3) {
      if (timeError || inquiryTimeError) return;
      if (!validateStep3()) return;
      if (isJobApplicant) return;
    }
    if (!isJobApplicant && step === 4) {
      if (!validateStep4()) return;
    }
    if (!isJobApplicant && step === 6) {
      if (!validateStep6()) return;
    }
    setErrors({});
    handleNext();
  };

  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingLoad, setLoadingLoad] = useState(false);

  // Validate step 6 whenever relevant fields change
  const onUpdate = async () => {
    if (!validateStep6()) return;
    setErrors({});
    await handleUpdate(agentReassigned);

    if (agentReassigned === true) {
      try {
        const { updateReassignRemarks } = await import("@/utils/supabase-reassign");
        await updateReassignRemarks(ticketReferenceNumber, true);
        console.log("Remarks successfully set to Reassigned");
      } catch (err) {
        console.error("Failed to update reassigned remarks:", err);
      }
    }
  };

  const isStep3NextDisabled =
    !ticketReceived || !ticketEndorsed || !channel || !wrapUp || !!timeError || !!inquiryTimeError;

  const Navigation = () => (
    <div className="flex justify-between mt-4">
      <Button variant="outline" onClick={handleBack} className="cursor-pointer">
        Back
      </Button>

      {isJobApplicant && step === 3 ? (
        <Button
          onClick={() => {
            setCustomerStatus("");
            setCustomerType("");
            setRemarks("");
            setInquiry("");
            setItemCode("");
            setItemDescription("");
            setPoNumber("");
            setSoDate("");
            setSoNumber("");
            setSoAmount("");
            setQuotationNumber("");
            setQuotationAmount("");
            setQtySold("");
            setPaymentTerms("");
            setPoSource("");
            setPaymentDate("");
            setDeliveryDate("");
            setManager("");
            setAgent("");
            setCloseReason("");
            setCounterOffer("");
            setClientSpecs("");
            handleUpdate(false);
          }}
          disabled={!!timeError || !channel || !wrapUp}
          className="cursor-pointer"
        >
          Save
        </Button>
      ) : (
        <Button
          onClick={onNext}
          disabled={step === 3 ? isStep3NextDisabled : false}
          className="cursor-pointer"
        >
          Next
        </Button>
      )}
    </div>
  );

  return (
    <>
      {step === 2 && (
        <>
          <h2 className="text-sm font-semibold mt-3">
            Step 2 — Department{" "}
            <span className="text-red-600 text-xs italic">*required</span>
          </h2>
          <FieldGroup>
            <Field>
              <FieldContent>
                <RadioGroup value={department} onValueChange={setDepartment}>
                  {errors.customerStatus && (
                    <p className="text-sm text-red-600 mt-2">{errors.customerStatus}</p>
                  )}
                  {departmentOptions.map((item) => (
                    <FieldLabel key={item.value} className="cursor-pointer">
                      <Field orientation="horizontal" className="w-full items-start">
                        <FieldContent className="flex-1">
                          <FieldTitle>{item.title}</FieldTitle>
                          <FieldDescription>{item.description}</FieldDescription>

                          {department === item.value && (
                            <div className="mt-4 flex gap-2">
                              <Button variant="outline" onClick={handleBack} className="cursor-pointer">
                                Back
                              </Button>
                              <Button onClick={onNext} className="cursor-pointer">
                                Next
                              </Button>
                            </div>
                          )}
                        </FieldContent>
                        <RadioGroupItem value={item.value} />
                      </Field>
                    </FieldLabel>
                  ))}
                </RadioGroup>
                <FieldDescription>
                  Select the department where this request or activity belongs.
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>
        </>
      )}

      {step === 3 && (
        <>
          <h2 className="text-sm font-semibold mt-3">Step 3 — Ticket Details</h2>
          <FieldGroup>
            <FieldSet>
              {/* HANDLING CSR */}
              <Field>
                <FieldLabel>Handling CSR</FieldLabel>
                <FieldDescription>
                  Platform or medium where the customer initially contacted the company.
                </FieldDescription>
                <ComboboxField
                  value={handlingCSR}
                  onChange={setHandlingCSR}
                  placeholder="Select an agent"
                  options={handlingCSROptions}
                />
              </Field>

              {/* INQUIRY RECEIVED */}
              <div className={`p-4 rounded-xl border-2 shadow-sm transition-all duration-300 mb-3 ${getTimeOfDayCardStyle(inquiryReceived)}`}>
                <Field>
                  <FieldLabel>Inquiry Received</FieldLabel>
                  <FieldDescription>Date and time when the inquiry was received.</FieldDescription>
                  <InputField
                    type="datetime-local"
                    value={inquiryReceived}
                    onChange={(e) => setInquiryReceived(e.target.value)}
                    min={getMinDateTimeLocal(7)}
                    error={inquiryTimeError || undefined}
                  />
                </Field>
              </div>

              {/* RESPONSE TO INQUIRY */}
              <div className={`p-4 rounded-xl border-2 shadow-sm transition-all duration-300 mb-3 ${getTimeOfDayCardStyle(responseToInquiry)}`}>
                <Field>
                  <FieldLabel>Response to Inquiry</FieldLabel>
                  <FieldDescription>Date and time when the inquiry was responded to.</FieldDescription>
                  <InputField
                    type="datetime-local"
                    value={responseToInquiry}
                    onChange={(e) => setResponseToInquiry(e.target.value)}
                    min={getMinDateTimeLocal(7)}
                    error={inquiryTimeError || undefined}
                  />
                </Field>
              </div>

              <Separator />

              {/* TICKET RECEIVED */}
              <div className={`p-4 rounded-xl border-2 shadow-sm transition-all duration-300 mb-3 ${getTimeOfDayCardStyle(ticketReceived)}`}>
                <Field>
                  {(!ticketReceived || !ticketEndorsed) && (
                    <p className="text-sm text-green-600 mb-2">
                      Both Ticket Received and Ticket Endorsed are required.
                    </p>
                  )}
                  <FieldLabel>
                    Ticket Received{" "}
                    <span className="text-red-600 text-xs italic">*required</span>
                  </FieldLabel>
                  <FieldDescription>
                    Date and time when the ticket was initially received or logged.
                  </FieldDescription>
                  <InputField
                    type="datetime-local"
                    value={ticketReceived}
                    onChange={(e) => setTicketReceived(e.target.value)}
                    min={getMinDateTimeLocal(7)}
                    error={errors.ticketReceived || timeError || undefined}
                  />
                </Field>
              </div>

              {/* TICKET ENDORSED */}
              <div className={`p-4 rounded-xl border-2 shadow-sm transition-all duration-300 mb-3 ${getTimeOfDayCardStyle(ticketEndorsed)}`}>
                <Field>
                  <FieldLabel>
                    Ticket Endorsed{" "}
                    <span className="text-red-600 text-xs italic">*required</span>
                  </FieldLabel>
                  <FieldDescription>
                    Date and time when the ticket was endorsed to the assigned department.
                  </FieldDescription>
                  <InputField
                    type="datetime-local"
                    value={ticketEndorsed}
                    onChange={(e) => setTicketEndorsed(e.target.value)}
                    min={getMinDateTimeLocal(7)}
                    error={errors.ticketEndorsed || timeError || undefined}
                  />
                </Field>
              </div>

              {/* CHANNEL */}
              <Field>
                <FieldLabel>
                  Channel{" "}
                  <span className="text-red-600 text-xs italic">*required</span>
                </FieldLabel>
                <FieldDescription>
                  Platform or medium where the customer initially contacted the company.
                </FieldDescription>
                <ComboboxField
                  value={channel}
                  onChange={setChannel}
                  placeholder="Select a channel"
                  options={channelOptions}
                  error={errors.channel}
                />
              </Field>

              {/* SOURCE — conditional */}
              {["Viber", "Text Message", "Website", "Voice Call", "Whatsapp"].includes(channel) && (
                <Field>
                  <FieldLabel>Source</FieldLabel>
                  <FieldDescription>
                    Origin or reference indicating how the lead or concern was generated.
                  </FieldDescription>
                  <ComboboxField
                    value={source}
                    onChange={setSource}
                    placeholder="Select a source"
                    options={sourceOptions}
                  />
                </Field>
              )}

              {/* WRAP UP */}
              <Field>
                <FieldLabel>
                  Wrap Up{" "}
                  <span className="text-red-600 text-xs italic">*required</span>
                </FieldLabel>
                <FieldDescription>
                  Final classification describing the outcome or purpose of the interaction.
                </FieldDescription>
                <ComboboxField
                  value={wrapUp}
                  onChange={setWrapUp}
                  placeholder="Select a wrap-up"
                  options={wrapUpOptions}
                  error={errors.wrapUp}
                />
              </Field>

              {/* HR ACK DATE — Job Applicants only */}
              {wrapUp === "Job Applicants" && (
                <Field>
                  <FieldLabel>HR Acknowledgement Date</FieldLabel>
                  <FieldDescription>
                    Date and time when HR acknowledged the job application.
                  </FieldDescription>
                  <InputField
                    type="datetime-local"
                    value={hrAcknowledgeDate}
                    onChange={(e) => setHrAcknowledgeDate(e.target.value)}
                  />
                </Field>
              )}

              {wrapUp === "Job Applicants" && (
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <RadioOptionsGroup
                    options={statusOptions}
                    value={status}
                    onChange={setStatus}
                    error={errors.status}
                  />
                </Field>
              )}
            </FieldSet>
          </FieldGroup>
          <Navigation />
        </>
      )}

      {step === 4 && !isJobApplicant && (
        <>
          <h2 className="text-sm font-semibold mt-4">
            Step 4 — Customer Details{" "}
            <span className="text-red-600 text-xs italic">*required</span>
          </h2>
          <Field>
            <FieldLabel>
              Customer Status{" "}
              <span className="text-red-600 text-xs italic">*required</span>
            </FieldLabel>
          </Field>
          <RadioGroup value={customerStatus} onValueChange={setCustomerStatus}>
            {customerStatusOptions.map((item) => (
              <FieldLabel key={item.value}>
                <Field orientation="horizontal" className="w-full items-start">
                  <FieldContent className="flex-1">
                    <FieldTitle>{item.title}</FieldTitle>
                    <FieldDescription>{item.description}</FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value={item.value} />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
          {errors.customerStatus && (
            <p className="text-sm text-red-600 mt-2">{errors.customerStatus}</p>
          )}

          <div className={!customerStatus ? "opacity-50 pointer-events-none" : ""}>
            <Field>
              <FieldLabel>
                Customer Type{" "}
                <span className="text-red-600 text-xs italic">*required</span>
              </FieldLabel>
            </Field>
            <RadioGroup value={customerType} onValueChange={setCustomerType}>
              {errors.customerType && (
                <p className="text-sm text-red-600 mt-2">{errors.customerType}</p>
              )}
              {customerTypeOptions.map((item) => (
                <FieldLabel key={item.value}>
                  <Field orientation="horizontal" className="w-full items-start">
                    <FieldContent className="flex-1">
                      <FieldTitle>{item.title}</FieldTitle>
                      <FieldDescription>{item.description}</FieldDescription>
                      {customerType === item.value && (
                        <div className="mt-4 flex gap-2">
                          <Button variant="outline" onClick={handleBack}>Back</Button>
                          <Button onClick={onNext}>Next</Button>
                        </div>
                      )}
                    </FieldContent>
                    <RadioGroupItem value={item.value} />
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
          </div>
        </>
      )}

      {step === 5 && !isJobApplicant && (
        <>
          <h2 className="text-sm font-semibold mt-4">
            Step 5 — Status{" "}
            <span className="text-red-600 text-xs italic">*required</span>
          </h2>
          {wrapUp !== "Job Applicants" && (
            <>
              <Field>
                <FieldLabel>Remarks</FieldLabel>
                <FieldDescription>Select remarks related to the ticket status.</FieldDescription>
                <ComboboxField
                  value={remarks}
                  onChange={setRemarks}
                  placeholder="Select remarks"
                  options={remarksOptions}
                />
              </Field>

              <Field>
                <FieldLabel>Inquiry / Concern</FieldLabel>
                <FieldDescription>Enter any additional remarks or concerns here.</FieldDescription>
                <InputField
                  type="textarea"
                  value={inquiry}
                  onChange={(e) => setInquiry(e.target.value)}
                  placeholder="Enter any remarks here..."
                />
              </Field>
            </>
          )}

          {(remarks === "No Stocks / Insufficient Stocks" ||
            remarks === "Item Not Carried" ||
            remarks === "Non Standard Item") && (
            <>
              <Field>
                <FieldLabel>Item Code</FieldLabel>
                <FieldDescription>Provide the code for the concerned item.</FieldDescription>
                <InputField
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value)}
                  placeholder="Item code"
                />
              </Field>

              <Field>
                <FieldLabel>Item Description</FieldLabel>
                <FieldDescription>Describe the item in detail.</FieldDescription>
                <InputField
                  type="textarea"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Enter item description"
                />
              </Field>
            </>
          )}

          {remarks === "Po Received" && (
            <>
              <Field>
                <FieldLabel>PO Number</FieldLabel>
                <FieldDescription>Purchase order number related to this ticket.</FieldDescription>
                <InputField
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="PO number"
                />
              </Field>

              <Field>
                <FieldLabel>SO Date</FieldLabel>
                <FieldDescription>Date of the sales order.</FieldDescription>
                <InputField
                  type="date"
                  value={soDate}
                  onChange={(e) => setSoDate(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel>Payment Terms</FieldLabel>
                <FieldDescription>Select payment terms agreed upon.</FieldDescription>
                <ComboboxField
                  value={paymentTerms}
                  onChange={setPaymentTerms}
                  placeholder="Select payment terms"
                  options={paymentTermsOptions}
                />
              </Field>

              <Field>
                <FieldLabel>PO Source</FieldLabel>
                <FieldDescription>Origin of the purchase order.</FieldDescription>
                <ComboboxField
                  value={poSource}
                  onChange={setPoSource}
                  placeholder="Select PO source"
                  options={poSourceOptions}
                />
              </Field>

              <Field>
                <FieldLabel>Payment Date</FieldLabel>
                <FieldDescription>Date payment was made.</FieldDescription>
                <InputField
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel>Delivery Date</FieldLabel>
                <FieldDescription>Date the product was delivered.</FieldDescription>
                <InputField
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </Field>
            </>
          )}

          {remarks === "Quotation For Approval" && (
            <>
              <Field>
                <FieldLabel>Quotation Number</FieldLabel>
                <FieldDescription>Reference number for the quotation.</FieldDescription>
                <InputField
                  value={quotationNumber}
                  onChange={(e) => setQuotationNumber(e.target.value)}
                  placeholder="Quotation number"
                />
              </Field>

              <Field>
                <FieldLabel>Quotation Amount</FieldLabel>
                <FieldDescription>Amount quoted to the client.</FieldDescription>
                <InputField
                  type="number"
                  value={quotationAmount}
                  onChange={(e) => setQuotationAmount(e.target.value)}
                />
              </Field>
            </>
          )}
          <Navigation />
        </>
      )}

      <div className="mt-6 p-4 border rounded bg-gray-50 text-sm space-y-1">
        <h4 className="font-semibold mb-2">Handling Time Computation (Preview Only)</h4>
        <div>CSR Response Time: <b>{csrTime || "-"}</b></div>
        <div>TSA Response Time: <b>{tsaResponseTime || "-"}</b></div>
        <div>TSA Handling Time: <b>{tsaHandlingTimeFinal || "-"}</b></div>
        <hr className="my-2" />
        <div>Non-Quotation HT: <b>{nonQuotationHT || "-"}</b></div>
        <div>Quotation HT: <b>{quotationHT || "-"}</b></div>
        <div>SPF HT: <b>{spfHT || "-"}</b></div>
        <p className="text-xs text-gray-500 mt-2">
          * Values are computed in real-time and not saved to the database.
        </p>
      </div>

      {step === 6 && !isJobApplicant && (
        <>
          <h2 className="text-sm font-semibold mt-4">Step 6 — Assignee</h2>

          {/* REVERT CASE BUTTON */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">
              {revertMode
                ? "Revert mode: All fields are freely selectable."
                : "Normal mode: Fields depend on department hierarchy."}
            </p>
            <Button
              variant={revertMode ? "default" : "outline"}
              size="sm"
              onClick={() => setRevertMode((prev) => !prev)}
              className={`cursor-pointer text-xs ${revertMode ? "bg-orange-500 hover:bg-orange-600 text-white" : "border-orange-400 text-orange-600 hover:bg-orange-50"}`}
            >
              {revertMode ? "Exit Revert Mode" : "Revert Case"}
            </Button>
          </div>

          {/* DEPARTMENT HEAD - Hidden for Marketing and CSR departments (normal mode only) */}
          {(revertMode || (department !== "Marketing" && department !== "CSR")) && (
            <Field>
              <FieldLabel>Department Head</FieldLabel>
              <FieldDescription>Please select the department head responsible.</FieldDescription>
              <ComboboxField
                value={department_head}
                onChange={setDepartmentHead}
                placeholder="Select Department Head"
                options={
                  revertMode
                    ? loadingRevert
                      ? [{ value: "__loading__", label: "Loading..." }]
                      : revertDepartmentHeadsList
                          .filter((dh) => allowedDepartmentHeads.includes(dh.ReferenceID))
                          .map((dh) => ({
                            value: dh.ReferenceID,
                            label: `${dh.Firstname} ${dh.Lastname}`,
                          }))
                    : loadingDepartmentHeads
                      ? [{ value: "__loading__", label: "Loading department heads..." }]
                      : departmentHeadsList
                          .filter((dh) => allowedDepartmentHeads.includes(dh.ReferenceID))
                          .map((dh) => ({
                            value: dh.ReferenceID,
                            label: `${dh.Firstname} ${dh.Lastname}`,
                          }))
                }
              />
            </Field>
          )}

          {/* MANAGER - Hidden for Sette Hosena (SH-NCR-560908) special case (normal mode only) */}
          {(revertMode || department_head !== "SH-NCR-560908") && (
            <Field>
              <FieldLabel>Manager</FieldLabel>
              <FieldDescription>Select the manager responsible for this task or client.</FieldDescription>
              <ComboboxField
                value={manager}
                onChange={(value) => {
                  setManager(value);
                  if (!revertMode) setAgent("");
                }}
                placeholder="Select a Manager"
                options={
                  revertMode
                    ? loadingRevert
                      ? [{ value: "__loading__", label: "Loading..." }]
                      : (() => {
                          const baseOptions = revertManagersList.map((m) => ({
                            value: m.ReferenceID,
                            label: `${m.Firstname} ${m.Lastname}`,
                          }));
                          if (manager && !baseOptions.some((o) => o.value === manager)) {
                            baseOptions.push({ value: manager, label: `${manager} (Loading...)` });
                          }
                          return baseOptions;
                        })()
                    : loadingManagers
                      ? [{ value: "__loading__", label: "Loading managers..." }]
                      : (() => {
                          const baseOptions = managersList.map((m) => ({
                            value: m.ReferenceID,
                            label: `${m.Firstname} ${m.Lastname}`,
                          }));
                          if (manager && !baseOptions.some((o) => o.value === manager)) {
                            baseOptions.push({
                              value: manager,
                              label: `${manager} (Loading...)`,
                            });
                          }
                          return baseOptions;
                        })()
                }
              />
            </Field>
          )}

          {/* AGENT */}
          {wrapUp !== "Job Applicants" &&
            (revertMode ||
              department === "Sales" ||
              department === "Business Development" ||
              department === "Marketing" ||
              department === "E-Commerce" ||
              department === "CSR") && (
              <Field>
                <FieldLabel>Agent</FieldLabel>
                <FieldDescription>
                  Select the agent assigned to handle this ticket or inquiry.
                </FieldDescription>
                <div
                  className={`transition-all duration-300 ${
                    highlightAgent ? "ring-2 ring-green-500 rounded-md animate-pulse" : ""
                  }`}
                >
                  <ComboboxField
                    value={agent}
                    onChange={setAgent}
                    placeholder="Select an Agent"
                    disabled={!revertMode && !manager && department_head !== "SH-NCR-560908"}
                    options={
                      revertMode
                        ? loadingRevert
                          ? [{ value: "__loading__", label: "Loading agents...", disabled: true }]
                          : (() => {
                              const baseOptions = revertAgentsList.map((a) => ({
                                value: a.ReferenceID,
                                label: `${a.Firstname} ${a.Lastname}${
                                  a.Connection === "Online" ? " 🟢" : " ⚫"
                                }`,
                                disabled: false,
                              }));
                              if (agent && !baseOptions.some((o) => o.value === agent)) {
                                baseOptions.push({
                                  value: agent,
                                  label: `${agent} (Loading...)`,
                                  disabled: false,
                                });
                              }
                              return baseOptions;
                            })()
                        : loadingAgents
                          ? [{ value: "__loading__", label: "Loading agents...", disabled: true }]
                          : (() => {
                              const baseOptions = agentsList.map((a) => ({
                                value: a.ReferenceID,
                                label: `${a.Firstname} ${a.Lastname}${
                                  a.Connection === "Online"
                                    ? " 🟢"
                                    : a.Connection === "Offline"
                                      ? " ⚫"
                                      : " ⚫"
                                }`,
                                disabled: a.Connection !== "Online",
                              }));
                              if (agent && !baseOptions.some((o) => o.value === agent)) {
                                baseOptions.push({
                                  value: agent,
                                  label: `${agent} (Loading...)`,
                                  disabled: false,
                                });
                              }
                              return baseOptions;
                            })()
                    }
                  />
                </div>
              </Field>
            )}

          {/* STATUS */}
          <Field>
            <FieldLabel>Status</FieldLabel>
            <FieldGroup>
              <FieldSet>
                <RadioGroup value={status} onValueChange={setStatus}>
                  {/* CLOSED */}
                  <FieldLabel>
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Closed</FieldTitle>
                        <FieldDescription>The process or item has been completed and finalized.</FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value="Closed" />
                    </Field>
                  </FieldLabel>

                  {/* ENDORSED */}
                  <FieldLabel>
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Endorsed</FieldTitle>
                        <FieldDescription>The item has been reviewed and forwarded for further action.</FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value="Endorsed" />
                    </Field>
                  </FieldLabel>

                  {status === "Endorsed" && (
                    <div className="flex justify-center my-2">
                      <Button
                        onClick={() => {
                          setAgent("");
                          setHighlightAgent(true);
                          setAgentReassigned(true);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                      >
                        Re-Assign Agent
                      </Button>
                    </div>
                  )}

                  {/* CONVERTED INTO SALES */}
                  <FieldLabel>
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Converted into Sales</FieldTitle>
                        <FieldDescription>The item has progressed and resulted in a successful sale.</FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value="Converted into Sales" />
                    </Field>
                  </FieldLabel>
                </RadioGroup>

                {errors.status && (
                  <p className="text-sm text-red-600 mt-1">{errors.status}</p>
                )}
              </FieldSet>
            </FieldGroup>
          </Field>

          {/* CLOSED / CONVERTED SECTION */}
          {(status === "Closed" || status === "Converted into Sales") && (
            <>
              <div className="mt-4 rounded-lg border border-blue-300 bg-blue-50 p-4 space-y-4">
                <h4 className="font-semibold text-sm text-blue-700">
                  Handling Time Details (Required on Closing)
                </h4>

                {/* TSM ACK */}
                <div className={`p-4 rounded-xl border-2 shadow-sm transition-all duration-300 ${getTimeOfDayCardStyle(tsmAcknowledgeDate)}`}>
                  <Field>
                    <FieldLabel>TSM Acknowledgement Date *</FieldLabel>
                    <InputField
                      type="datetime-local"
                      value={tsmAcknowledgeDate}
                      onChange={(e) => setTsmAcknowledgeDate(e.target.value)}
                      min={getMinDateTimeLocal(7)}
                    />
                  </Field>
                </div>

                {/* TSM HANDLING */}
                <div className={`p-4 rounded-xl border-2 shadow-sm transition-all duration-300 ${getTimeOfDayCardStyle(tsmHandlingTime)}`}>
                  <Field>
                    <FieldLabel>TSM Handling Time *</FieldLabel>
                    <InputField
                      type="datetime-local"
                      value={tsmHandlingTime}
                      onChange={(e) => setTsmHandlingTime(e.target.value)}
                      min={getMinDateTimeLocal(7)}
                      error={tsmTimeError || tsmHandlingReceivedError || undefined}
                    />
                  </Field>
                </div>

                {/* TSA ACK */}
                <div className={`p-4 rounded-xl border-2 shadow-sm transition-all duration-300 ${getTimeOfDayCardStyle(tsaAcknowledgeDate)}`}>
                  <Field>
                    <FieldLabel>TSA Acknowledgement Date *</FieldLabel>
                    <InputField
                      type="datetime-local"
                      value={tsaAcknowledgeDate}
                      onChange={(e) => setTsaAcknowledgeDate(e.target.value)}
                      min={getMinDateTimeLocal(7)}
                      error={tsaAckEndorseError || undefined}
                    />
                  </Field>
                </div>

                {/* TSA HANDLING */}
                <div className={`p-4 rounded-xl border-2 shadow-sm transition-all duration-300 ${getTimeOfDayCardStyle(tsaHandlingTime)}`}>
                  <Field>
                    <FieldLabel>TSA Handling Time*</FieldLabel>
                    <InputField
                      type="datetime-local"
                      value={tsaHandlingTime}
                      onChange={(e) => setTsaHandlingTime(e.target.value)}
                      min={getMinDateTimeLocal(7)}
                      error={tsaTimeError || undefined}
                    />
                  </Field>
                </div>

                <p className="text-xs text-gray-600 italic">
                  Note: Either TSM or TSA's acknowledgement details must be completed before closing the ticket.
                </p>
              </div>

              
              {(status === "Closed" || status === "Converted into Sales") && (
                <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 space-y-4">
                  <h4 className="font-semibold text-sm text-red-700">
                    On Closing of Ticket (Required)
                  </h4>

                  <Field>
                    <FieldLabel>1. Close Reason *</FieldLabel>
                    <ComboboxField
                      value={closeReason}
                      onChange={setCloseReason}
                      placeholder="Select a reason"
                      options={closeReasonOptions}
                    />
                  </Field>

                  {closeReason === "Counter Offer" && (
                    <>
                      <Field>
                        <FieldLabel>2. Add Counter Offer *</FieldLabel>
                        <Textarea
                          value={counterOffer}
                          onChange={(e) => setCounterOffer(e.target.value)}
                          placeholder="Enter counter offer..."
                        />
                      </Field>

                      <Field>
                        <FieldLabel>3. Client Specs *</FieldLabel>
                        <Textarea
                          value={clientSpecs}
                          onChange={(e) => setClientSpecs(e.target.value)}
                          placeholder="Enter client specifications..."
                        />
                      </Field>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* CONVERTED INTO SALES FIELDS */}
          {status === "Converted into Sales" && (
            <>
              <Field>
                <FieldLabel>SO Number</FieldLabel>
                <InputField
                  value={soNumber}
                  onChange={(e) => setSoNumber(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel>SO Amount</FieldLabel>
                <InputField
                  type="number"
                  value={soAmount}
                  onChange={(e) => setSoAmount(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel>Qty Sold</FieldLabel>
                <InputField
                  type="number"
                  value={qtySold}
                  onChange={(e) => setQtySold(e.target.value)}
                />
              </Field>
            </>
          )}

          {/* ACTIONS */}
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={loadingSave || loadingLoad}
            className="cursor-pointer"
          >
            Back
          </Button>

          <Button
            onClick={onUpdate}
            disabled={
              loadingSave ||
              loadingLoad ||
              !!timeError ||
              !!tsaTimeError ||
              !!tsmTimeError ||
              !!tsaAckEndorseError ||
              !!tsmHandlingReceivedError ||
              isManagerRequiredButMissing ||
              Object.keys(errors).length > 0
            }
          >
            {loadingSave ? "Saving..." : "Save"}
          </Button>

          {isManagerRequiredButMissing && (
            <p className="text-xs text-red-600 mt-2">
              Please select a manager before saving.
            </p>
          )}
        </>
      )}
    </>
  );
}