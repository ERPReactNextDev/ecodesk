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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon, User, UserRound } from "lucide-react";

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
  department_head: string;
  setDepartmentHead: React.Dispatch<React.SetStateAction<string>>;
  handleBack: () => void;
  handleNext: () => void;
  handleUpdate: (agentReassigned: boolean) => void;
}

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

// Reusable Select Field
const SelectField = ({
  value,
  onChange,
  placeholder,
  options,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  error?: string;
}) => (
  <Field>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(({ value, label }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
  </Field>
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

  // ✅ ADD THESE
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

  // ✅ ADD THESE
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
          // ✅ THIS IS THE FIX
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
    "SH-NCR-560908",
    "BR-PH-358329",
    "MM-PH-104083",
  ];

  const [departmentHeadsList, setDepartmentHeadsList] = useState<User[]>([]);
  const [loadingDepartmentHeads, setLoadingDepartmentHeads] = useState(false);

  interface User {
    ReferenceID: string;
    Firstname: string;
    Lastname: string;
    Role: string;
    Department: string;
    Connection: string;
  }
  const [managersList, setManagersList] = useState<User[]>([]);

  const [managersAvailable, setManagersAvailable] = useState(0);
  const [agentsList, setAgentsList] = useState<User[]>([]);

  const [loadingManagers, setLoadingManagers] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);

  const [loadingActivities, setLoadingActivities] = useState(false);
  const [errorActivities, setErrorActivities] = useState(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const isJobApplicant = wrapUp === "Job Applicants";
  const isHrActive = Boolean(hrAcknowledgeDate);

  // ===== LIVE COMPUTED TIMES (DISPLAY ONLY) =====

  // ===== LIVE COMPUTED TIMES (DISPLAY ONLY) =====

  // CSR is always allowed
  const csrTime = computeCSRResponseTime(ticketReceived, ticketEndorsed);

  // Check if TSM fields are COMPLETE (both required)
  const isTsmComplete = Boolean(tsmAcknowledgeDate && tsmHandlingTime);

  // Check if TSA fields are COMPLETE (both required)
  const isTsaComplete = Boolean(tsaAcknowledgeDate && tsaHandlingTime);

  // ----- TSM COMPUTATIONS -----
  const tsmResponseTime = isTsmComplete
    ? computeTSMResponseTime(wrapUp, tsmAcknowledgeDate, ticketEndorsed)
    : "";

  const tsmHandlingTimeFinal = isTsmComplete
    ? computeTSMHandlingTime(
        wrapUp,
        tsmAcknowledgeDate,
        tsmHandlingTime,
        ticketReceived,
      )
    : "";

  // ----- TSA COMPUTATIONS -----
  const tsaResponseTime = isTsaComplete
    ? computeTSAResponseTime(
        wrapUp,
        tsaAcknowledgeDate,
        tsaHandlingTime,
        ticketEndorsed,
      )
    : "";

  const tsaHandlingTimeFinal =
    isTsaComplete && ticketReceived
      ? formatDuration(
          new Date(tsaHandlingTime).getTime() -
            new Date(ticketReceived).getTime(),
        )
      : "";

  // Base Handling Time ONLY exists if one side is COMPLETE
  const baseHT = isTsaComplete
    ? tsaHandlingTimeFinal
    : isTsmComplete
      ? tsmHandlingTimeFinal
      : "";

  // Additional HT computations ONLY if baseHT is valid
  const nonQuotationHT = baseHT ? computeNonQuotationHT(remarks, baseHT) : "";

  const quotationHT = baseHT ? computeQuotationHT(remarks, baseHT) : "";

  const spfHT = baseHT ? computeSpfHT(remarks, baseHT) : "";

  // ================= FETCH DEPARTMENT HEADS =================

  useEffect(() => {
    setLoadingDepartmentHeads(true);

    fetch(`/api/fetch-users-by-role?role=Manager`)
      .then((res) => res.json())
      .then((json) => {
        const all: User[] = json.data || [];

        // ONLY SHOW THE 3 REF IDs
        const filtered = all.filter((user) =>
          allowedDepartmentHeads.includes(user.ReferenceID),
        );

        setDepartmentHeadsList(filtered);
      })
      .catch(() => setDepartmentHeadsList([]))
      .finally(() => setLoadingDepartmentHeads(false));
  }, []);

  // ================= FETCH MANAGERS =================

  useEffect(() => {
    if (!department) {
      setManagersList([]);
      setAgentsList([]); // ✅ clear agents
      setManager("");
      setAgent(""); // ✅ reset agent
      return;
    }

    setLoadingManagers(true);

    fetch(
      `/api/fetch-users-by-role?role=Territory Sales Manager&department=${encodeURIComponent(
        department,
      )}&currentUser=${manager || ""}`,
    )
      .then((res) => res.json())
      .then((json) => {
        const list = json.data || [];
        setManagersList(list);
        setManagersAvailable(list.length);
      })
      .catch(() => setManagersList([]))
      .finally(() => setLoadingManagers(false));
  }, [department]);

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

  // ================= FETCH AGENTS =================
  useEffect(() => {
    if (!manager) {
      setAgentsList([]);
      setAgent("");
      return;
    }

    setLoadingAgents(true);

    fetch(
      `/api/fetch-users-by-role?role=Territory Sales Associate&department=Sales&tsm=${encodeURIComponent(
        manager,
      )}&currentUser=${agent || ""}`,
    )
      .then((res) => res.json())
      .then((json) => {
        setAgentsList(json.data || []);
      })
      .catch(() => setAgentsList([]))
      .finally(() => setLoadingAgents(false));
  }, [manager]);

  // 1️⃣ Ticket Received vs Ticket Endorsed validation
  useEffect(() => {
    // 🔥 AUTO SYNC DATE CREATED = TICKET RECEIVED
    if (ticketReceived) {
      setDateCreated(ticketReceived);
    }

    if (!ticketReceived || !ticketEndorsed) {
      setTimeError(null);
      return;
    }

    const received = new Date(ticketReceived);
    const endorsed = new Date(ticketEndorsed);

    if (!isNaN(received.getTime()) && !isNaN(endorsed.getTime())) {
      if (endorsed < received) {
        setTimeError("Ticket Endorsed cannot be earlier than Ticket Received.");
      } else {
        setTimeError(null);
      }
    }
  }, [ticketReceived, ticketEndorsed]);

  // TSM validation - same logic pattern as Ticket Received/Endorsed
  useEffect(() => {
    if (!tsmAcknowledgeDate || !tsmHandlingTime) {
      setTsmTimeError(null);
      return;
    }

    const ack = new Date(tsmAcknowledgeDate);
    const handle = new Date(tsmHandlingTime);

    if (!isNaN(ack.getTime()) && !isNaN(handle.getTime())) {
      if (handle < ack) {
        setTsmTimeError(
          "TSM Handling Time cannot be earlier than TSM Acknowledgement Time.",
        );
      } else {
        setTsmTimeError(null);
      }
    }
  }, [tsmAcknowledgeDate, tsmHandlingTime]);

  // TSA validation - same logic pattern as Ticket Received/Endorsed
  useEffect(() => {
    if (!tsaAcknowledgeDate || !tsaHandlingTime) {
      setTsaTimeError(null);
      return;
    }

    const ack = new Date(tsaAcknowledgeDate);
    const handle = new Date(tsaHandlingTime);

    if (!isNaN(ack.getTime()) && !isNaN(handle.getTime())) {
      if (handle < ack) {
        setTsaTimeError(
          "TSA Handling Time cannot be earlier than TSA Acknowledgement Time.",
        );
      } else {
        setTsaTimeError(null);
      }
    }
  }, [tsaAcknowledgeDate, tsaHandlingTime]);

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

  // Auto clear agent when status changes to Endorsed
  useEffect(() => {
    // Intentionally left empty to keep selected agent value
  }, []);

  // Remove glow when agent is selected
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
  const isManagerRequiredButMissing = managersAvailable > 0 && !manager;
  const [highlightAgent, setHighlightAgent] = useState(false);
  const [agentReassigned, setAgentReassigned] = useState(false);

  // Options
  const departmentOptions: Option[] = [
    {
      value: "Accounting",
      title: "Accounting",
      description:
        "Handle initial client contact for financial matters and updates.",
    },
    {
      value: "Business Development",
      title: "Business Development",
      description:
        "Manage client outreach and relationship building activities.",
    },
    {
      value: "E-Commerce",
      title: "E-Commerce",
      description:
        "Conduct follow-up calls to monitor progress and gather additional requirements.",
    },
    {
      value: "Engineering",
      title: "Engineering",
      description:
        "Provide technical support and follow up on project developments.",
    },
    {
      value: "Human Resources",
      title: "Human Resources",
      description:
        "Manage employee relations and follow-up on HR-related inquiries.",
    },
    {
      value: "Marketing",
      title: "Marketing",
      description: "Follow up on campaigns and coordinate client feedback.",
    },
    {
      value: "Procurement",
      title: "Procurement",
      description: "Oversee purchasing processes and supplier communications.",
    },
    {
      value: "Sales",
      title: "Sales",
      description: "Follow up on sales opportunities and client requests.",
    },
    {
      value: "Warehouse",
      title: "Warehouse & Logistics",
      description: "Coordinate logistics and inventory follow-ups.",
    },
  ];

  const customerStatusOptions: Option[] = [
    {
      value: "New Client",
      title: "New Client",
      description: "A newly onboarded client with initial transactions.",
    },
    {
      value: "New Non-Buying",
      title: "New Non-Buying",
      description:
        "Newly registered customer but has no purchasing history yet.",
    },
    {
      value: "Existing Active",
      title: "Existing Active",
      description: "Has consistent or recent purchase activity.",
    },
    {
      value: "Existing Inactive",
      title: "Existing Inactive",
      description: "Previously active but has no recent purchase activity.",
    },
  ];

  const customerTypeOptions: Option[] = [
    {
      value: "B2B",
      title: "B2B",
      description: "Business-to-Business client category.",
    },
    {
      value: "B2C",
      title: "B2C",
      description: "Business-to-Consumer, individual or household buyers.",
    },
    {
      value: "B2G",
      title: "B2G",
      description: "Government agencies and public sector clients.",
    },
    {
      value: "Gentrade",
      title: "Gentrade",
      description: "Gentrade partner or affiliated business accounts.",
    },
    {
      value: "Modern Trade",
      title: "Modern Trade",
      description: "Large retail chains and commercial distributors.",
    },
  ];

  const statusOptions: Option[] = [
    {
      value: "Closed",
      title: "Closed",
      description: "The process or item has been completed and finalized.",
    },
    {
      value: "Endorsed",
      title: "Endorsed",
      description:
        "The item has been reviewed and forwarded for further action.",
    },
    {
      value: "Converted into Sales",
      title: "Converted into Sales",
      description: "The item has progressed and resulted in a successful sale.",
    },
  ];

  const validateStep3 = () => {
    const newErrors: typeof errors = {};

    if (!ticketReceived) {
      newErrors.ticketReceived = "Ticket Received is required.";
    }

    if (!ticketEndorsed) {
      newErrors.ticketEndorsed = "Ticket Endorsed is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors: typeof errors = {};

    if (!customerStatus) {
      newErrors.customerStatus = "Customer Status is required.";
    }

    if (!customerType) {
      newErrors.customerType = "Customer Type is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep6 = () => {
    const newErrors: typeof errors = {};

    if (!status) {
      newErrors.status = "Status is required.";
    }

    if (status === "Closed") {
      if (!tsmAcknowledgeDate && !tsaAcknowledgeDate) {
        newErrors.status =
          "Either TSM or TSA Acknowledgement Date is required when closing or converting to sales.";
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
        if (!counterOffer.trim()) {
          newErrors.status = "Counter offer is required.";
        }
        if (!clientSpecs.trim()) {
          newErrors.status = "Client specs are required.";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Override handleNext to add validation on step 3 and 6
  const onNext = () => {
    if (step === 3) {
      if (timeError) return;
      if (!validateStep3()) return;

      // 🚀 Job Applicant stops here (Save only)
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

  // Override handleUpdate to validate status before saving
  const onUpdate = async () => {
    if (!validateStep6()) return;

    setErrors({});

    await handleUpdate(agentReassigned);

    // FORCE update to Supabase ONLY when Reassign button was clicked
    if (agentReassigned === true) {
      try {
        const { updateReassignRemarks } =
          await import("@/utils/supabase-reassign");

        await updateReassignRemarks(ticketReferenceNumber, true);

        console.log("Remarks successfully set to Reassigned");
      } catch (err) {
        console.error("Failed to update reassigned remarks:", err);
      }
    }
  };

  const isStep3NextDisabled = !ticketReceived || !ticketEndorsed || !!timeError;

  // Helper: common buttons with validation on Next
  const Navigation = () => (
    <div className="flex justify-between mt-4">
      <Button variant="outline" onClick={handleBack} className="cursor-pointer">
        Back
      </Button>

      {/* 🔹 JOB APPLICANT → SAVE DIRECTLY ON STEP 3 */}
      {isJobApplicant && step === 3 ? (
        <Button
          onClick={() => {
            // 🔥 AUTO CLEAR STEPS 4–6
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

            // ❗ STATUS IS NOT CLEARED
            handleUpdate(false);
          }}
          disabled={!!timeError}
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
                    <p className="text-sm text-red-600 mt-2">
                      {errors.customerStatus}
                    </p>
                  )}
                  {departmentOptions.map((item) => (
                    <FieldLabel key={item.value} className="cursor-pointer">
                      <Field
                        orientation="horizontal"
                        className="w-full items-start"
                      >
                        <FieldContent className="flex-1">
                          <FieldTitle>{item.title}</FieldTitle>
                          <FieldDescription>
                            {item.description}
                          </FieldDescription>

                          {department === item.value && (
                            <div className="mt-4 flex gap-2">
                              <Button
                                variant="outline"
                                onClick={handleBack}
                                className="cursor-pointer"
                              >
                                Back
                              </Button>
                              <Button
                                onClick={onNext}
                                className="cursor-pointer"
                              >
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
          <h2 className="text-sm font-semibold mt-3">
            Step 3 — Ticket Details
          </h2>
          <FieldGroup>
            <FieldSet>
              {/* <Field>
                <FieldLabel>Date Created</FieldLabel>
                <FieldDescription>
                  Automatically set based on Ticket Received.
                </FieldDescription>

                <Input
                  type="datetime-local"
                  value={dateCreated}
                  disabled
                />
              </Field> */}

              <div
                className={`p-4 rounded-xl border-2 shadow-sm transition-all duration-300 mb-3 ${getTimeOfDayCardStyle(ticketReceived)}`}
              >
                <Field>
                  {(!ticketReceived || !ticketEndorsed) && (
                    <p className="text-sm text-green-600 mb-2">
                      Both Ticket Received and Ticket Endorsed are required.
                    </p>
                  )}
                  <FieldLabel>
                    Ticket Received{" "}
                    <span className="text-red-600 text-xs italic">
                      *required
                    </span>
                  </FieldLabel>
                  <FieldDescription>
                    Date and time when the ticket was initially received or
                    logged.
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

              <div
                className={`p-4 rounded-xl border-2 shadow-sm transition-all duration-300 mb-3 ${getTimeOfDayCardStyle(ticketEndorsed)}`}
              >
                <Field>
                  <FieldLabel>
                    Ticket Endorsed{" "}
                    <span className="text-red-600 text-xs italic">
                      *required
                    </span>
                  </FieldLabel>
                  <FieldDescription>
                    Date and time when the ticket was endorsed to the assigned
                    department.
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

              <Field>
                <FieldLabel>Channel</FieldLabel>
                <FieldDescription>
                  Platform or medium where the customer initially contacted the
                  company.
                </FieldDescription>
                <SelectField
                  value={channel}
                  onChange={setChannel}
                  placeholder="Select a channel"
                  options={[
                    { value: "Google Maps", label: "Google Maps" },
                    { value: "Website", label: "Website" },
                    { value: "FB Main", label: "FB Main" },
                    { value: "FB ES Home", label: "FB ES Home" },
                    { value: "Viber", label: "Viber" },
                    { value: "Text Message", label: "Text Message" },
                    { value: "Instagram", label: "Instagram" },
                    { value: "Voice Call", label: "Voice Call" },
                    { value: "Email", label: "Email" },
                    { value: "Whatsapp", label: "Whatsapp" },
                    { value: "Shopify", label: "Shopify" },
                  ]}
                  error={errors.channel}
                />
              </Field>
              {/* SHOW SOURCE ONLY FOR CERTAIN CHANNELS */}

              {[
                "Viber",
                "Text Message",
                "Website",
                "Voice Call",
                "Whatsapp",
              ].includes(channel) && (
                <Field>
                  <FieldLabel>Source</FieldLabel>
                  <FieldDescription>
                    Origin or reference indicating how the lead or concern was
                    generated.
                  </FieldDescription>

                  <SelectField
                    value={source}
                    onChange={setSource}
                    placeholder="Select a source"
                    options={[
                      { value: "Agent Call", label: "Agent Call" },
                      { value: "Catalogue", label: "Catalogue" },
                      { value: "Conex", label: "Conex" },
                      { value: "Email Blast", label: "Email Blast" },
                      { value: "FB Ads", label: "FB Ads" },
                      { value: "Google Search", label: "Google Search" },
                      { value: "Lazada", label: "Lazada" },
                      { value: "LNB", label: "LNB" },
                      { value: "PhilConstruct", label: "PhilConstruct" },
                      { value: "Product Demo", label: "Product Demo" },
                      { value: "Quotation Docs", label: "Quotation Docs" },
                      { value: "Shopee", label: "Shopee" },
                      { value: "Site Visit", label: "Site Visit" },
                      { value: "SMS", label: "SMS" },
                      { value: "Tiktok", label: "Tiktok" },
                      { value: "Viber", label: "Viber Community" },
                      { value: "Website", label: "Website" },
                      { value: "Whatsapp", label: "Whatsapp Community" },
                      { value: "Word of Mouth", label: "Word of Mouth" },
                      { value: "Worldbex", label: "Worldbex" },
                    ]}
                  />
                </Field>
              )}
              <Field>
                <FieldLabel>Wrap Up</FieldLabel>
                <FieldDescription>
                  Final classification describing the outcome or purpose of the
                  interaction.
                </FieldDescription>
                <SelectField
                  value={wrapUp}
                  onChange={setWrapUp}
                  placeholder="Select a wrap-up"
                  options={[
                    { value: "Customer Order", label: "Customer Order" },
                    {
                      value: "Customer Inquiry Sales",
                      label: "Customer Inquiry Sales",
                    },
                    {
                      value: "Customer Inquiry Non-Sales",
                      label: "Customer Inquiry Non-Sales",
                    },
                    { value: "Follow Up Sales", label: "Follow Up Sales" },
                    {
                      value: "Follow Up Non-Sales",
                      label: "Follow Up Non-Sales",
                    },
                    { value: "After Sales", label: "After Sales" },
                    {
                      value: "Customer Complaint",
                      label: "Customer Complaint",
                    },
                    {
                      value: "Customer Feedback/Recommendation",
                      label: "Customer Feedback/Recommendation",
                    },
                    { value: "Job Applicants", label: "Job Applicants" },
                    {
                      value: "Supplier/Vendor Product Offer",
                      label: "Supplier/Vendor Product Offer",
                    },
                    {
                      value: "Internal Whistle Blower",
                      label: "Internal Whistle Blower",
                    },
                    {
                      value: "Threats/Extortion/Intimidation",
                      label: "Threats/Extortion/Intimidation",
                    },
                    {
                      value: "Supplier Accredited Request",
                      label: "Supplier Accredited Request",
                    },
                    { value: "Internal Concern", label: "Internal Concern" },
                    { value: "Others", label: "Others" },
                  ]}
                  error={errors.wrapUp}
                />
              </Field>
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
          {/* Customer Status */}
          <h2 className="text-sm font-semibold mt-4">
            Step 4 — Customer Details{" "}
            <span className="text-red-600 text-xs italic">*required</span>
          </h2>
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
          {/* Customer Type */}
          <div
            className={!customerStatus ? "opacity-50 pointer-events-none" : ""}
          >
            <RadioGroup value={customerType} onValueChange={setCustomerType}>
              {errors.customerType && (
                <p className="text-sm text-red-600 mt-2">
                  {errors.customerType}
                </p>
              )}

              {customerTypeOptions.map((item) => (
                <FieldLabel key={item.value}>
                  <Field
                    orientation="horizontal"
                    className="w-full items-start"
                  >
                    <FieldContent className="flex-1">
                      <FieldTitle>{item.title}</FieldTitle>
                      <FieldDescription>{item.description}</FieldDescription>

                      {customerType === item.value && (
                        <div className="mt-4 flex gap-2">
                          <Button variant="outline" onClick={handleBack}>
                            Back
                          </Button>
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
          <h2 className="text-sm font-semibold mt-4">Step 5 — Status</h2>
          {wrapUp !== "Job Applicants" && (
            <>
              <Field>
                <FieldLabel>Remarks</FieldLabel>
                <FieldDescription>
                  Select remarks related to the ticket status.
                </FieldDescription>
                <SelectField
                  value={remarks}
                  onChange={setRemarks}
                  placeholder="Select remarks"
                  options={[
                    {
                      value: "No Stocks / Insufficient Stocks",
                      label: "No Stocks / Insufficient Stocks",
                    },
                    { value: "Item Not Carried", label: "Item Not Carried" },
                    {
                      value: "Unable to Contact Customer",
                      label: "Unable to Contact Customer",
                    },
                    {
                      value: "Quotation For Approval",
                      label: "Quotation For Approval",
                    },
                    {
                      value: "Customer Request Cancellation",
                      label: "Customer Request Cancellation",
                    },
                    {
                      value: "Accreditation / Partnership",
                      label: "Accreditation / Partnership",
                    },
                    { value: "For SPF", label: "For SPF" },
                    {
                      value: "No Response For Client",
                      label: "No Response For Client",
                    },
                    { value: "Assisted", label: "Assisted" },
                    {
                      value: "Disapproved Quotation",
                      label: "Disapproved Quotation",
                    },
                    { value: "For Site Visit", label: "For Site Visit" },
                    { value: "Non Standard Item", label: "Non Standard Item" },
                    { value: "Po Received", label: "Po Received" },
                    {
                      value: "Not Converted to Sales",
                      label: "Not Converted to Sales",
                    },
                    {
                      value: "For Occular Inspection",
                      label: "For Occular Inspection",
                    },
                    { value: "Sold", label: "Sold" },
                    {
                      value: "Waiting for Client Confirmation",
                      label: "Waiting for Client Confirmation",
                    },
                    { value: "Pending Quotation", label: "Pending Quotation" },
                  ]}
                />
              </Field>

              <Field>
                <FieldLabel>Inquiry / Concern</FieldLabel>
                <FieldDescription>
                  Enter any additional remarks or concerns here.
                </FieldDescription>
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
                <FieldDescription>
                  Provide the code for the concerned item.
                </FieldDescription>
                <InputField
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value)}
                  placeholder="Item code"
                />
              </Field>

              <Field>
                <FieldLabel>Item Description</FieldLabel>
                <FieldDescription>
                  Describe the item in detail.
                </FieldDescription>
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
                <FieldDescription>
                  Purchase order number related to this ticket.
                </FieldDescription>
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
                <FieldDescription>
                  Select payment terms agreed upon.
                </FieldDescription>
                <SelectField
                  value={paymentTerms}
                  onChange={setPaymentTerms}
                  placeholder="Select payment terms"
                  options={[
                    { value: "Cash", label: "Cash" },
                    { value: "30 Days Terms", label: "30 Days Terms" },
                    { value: "Bank Deposit", label: "Bank Deposit" },
                    { value: "Dated Check", label: "Dated Check" },
                  ]}
                />
              </Field>

              <Field>
                <FieldLabel>PO Source</FieldLabel>
                <FieldDescription>
                  Origin of the purchase order.
                </FieldDescription>
                <SelectField
                  value={poSource}
                  onChange={setPoSource}
                  placeholder="Select PO source"
                  options={[
                    { value: "CS Email", label: "CS Email" },
                    { value: "Sales Email", label: "Sales Email" },
                    { value: "Sales Agent", label: "Sales Agent" },
                  ]}
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
                <FieldDescription>
                  Date the product was delivered.
                </FieldDescription>
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
                <FieldDescription>
                  Reference number for the quotation.
                </FieldDescription>
                <InputField
                  value={quotationNumber}
                  onChange={(e) => setQuotationNumber(e.target.value)}
                  placeholder="Quotation number"
                />
              </Field>

              <Field>
                <FieldLabel>Quotation Amount</FieldLabel>
                <FieldDescription>
                  Amount quoted to the client.
                </FieldDescription>
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
        <h4 className="font-semibold mb-2">
          Handling Time Computation (Preview Only)
        </h4>

        <div>
          CSR Response Time: <b>{csrTime || "-"}</b>
        </div>

        {/* <div>
          TSM Response Time: <b>{tsmResponseTime || "-"}</b>
        </div> */}

        <div>
          TSA Response Time: <b>{tsaResponseTime || "-"}</b>
        </div>

        <div>
          TSA Handling Time: <b>{tsaHandlingTimeFinal || "-"}</b>
        </div>

        <hr className="my-2" />

        <div>
          Non-Quotation HT: <b>{nonQuotationHT || "-"}</b>
        </div>

        <div>
          Quotation HT: <b>{quotationHT || "-"}</b>
        </div>

        <div>
          SPF HT: <b>{spfHT || "-"}</b>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          * Values are computed in real-time and not saved to the database.
        </p>
      </div>
      {step === 6 && !isJobApplicant && (
        <>
          <h2 className="text-sm font-semibold mt-4">Step 6 — Assignee</h2>
          {/* ================= DEPARTMENT HEAD ================= */}

          <Field>
            <FieldLabel>Department Head</FieldLabel>

            <FieldDescription>
              Select the department head responsible.
            </FieldDescription>

            <Select
              value={department_head}
              onValueChange={(value) => setDepartmentHead(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Department Head" />
              </SelectTrigger>

              <SelectContent>
                {loadingDepartmentHeads && (
                  <SelectItem value="__loading__" disabled>
                    Loading department heads...
                  </SelectItem>
                )}

                {!loadingDepartmentHeads &&
                  departmentHeadsList.length === 0 && (
                    <SelectItem value="__none__" disabled>
                      No department heads available
                    </SelectItem>
                  )}

                {departmentHeadsList.map(
                  (dh) =>
                    allowedDepartmentHeads.includes(dh.ReferenceID) && (
                      <SelectItem key={dh.ReferenceID} value={dh.ReferenceID}>
                        {dh.Firstname} {dh.Lastname}
                      </SelectItem>
                    ),
                )}
              </SelectContent>
            </Select>
          </Field>
          {/* ================= MANAGER ================= */}
          <Field>
            <FieldLabel>Manager</FieldLabel>
            <FieldDescription>
              Select the manager responsible for this task or client.
            </FieldDescription>

            <Select
              value={manager}
              onValueChange={(value) => {
                setManager(value);
                setAgent(""); // reset agent when manager changes
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a Manager" />
              </SelectTrigger>

              <SelectContent>
                {loadingManagers && (
                  <SelectItem value="__loading__" disabled>
                    Loading managers...
                  </SelectItem>
                )}

                {!loadingManagers && managersList.length === 0 && (
                  <SelectItem value="__none__" disabled>
                    No managers available
                  </SelectItem>
                )}

                {managersList.map((m) => (
                  <SelectItem key={m.ReferenceID} value={m.ReferenceID}>
                    {m.Firstname} {m.Lastname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* ================= AGENT ================= */}
          {wrapUp !== "Job Applicants" &&
            (department === "Sales" ||
              department === "Business Development" ||
              department === "Marketing" ||
              department === "E-Commerce") && (
              <Field>
                <FieldLabel>Agent</FieldLabel>
                <FieldDescription>
                  Select the agent assigned to handle this ticket or inquiry.
                </FieldDescription>

                <Select
                  value={agent}
                  onValueChange={(value) => setAgent(value)}
                  disabled={!manager}
                >
                  <SelectTrigger
                    className={`w-full transition-all duration-300 ${
                      highlightAgent
                        ? "ring-2 ring-green-500 animate-pulse"
                        : ""
                    }`}
                  >
                    <SelectValue placeholder="Select an Agent" />
                  </SelectTrigger>

                  <SelectContent>
                    {loadingAgents && (
                      <SelectItem value="__loading__" disabled>
                        Loading agents...
                      </SelectItem>
                    )}

                    {!loadingAgents && agentsList.length === 0 && (
                      <SelectItem value="__none__" disabled>
                        No agents available
                      </SelectItem>
                    )}

                    {agentsList.map((a) => {
                      const connection = a.Connection;

                      const isOnline = connection === "Online";

                      // Disable ONLY when explicitly Offline
                      const isDisabled = connection === "Offline";

                      return (
                        <SelectItem
                          key={a.ReferenceID}
                          value={a.ReferenceID}
                          disabled={isDisabled}
                        >
                          <span className="flex items-center gap-2">
                            <span>
                              {a.Firstname} {a.Lastname}
                            </span>

                            <span
                              className={`px-1 py-0.5 rounded-full text-[10px] font-semibold ${
                                isOnline
                                  ? "bg-green-100 text-green-700 border border-green-300"
                                  : "bg-gray-100 text-gray-500 border border-gray-300"
                              }`}
                            >
                              {connection || "No Status"}
                            </span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </Field>
            )}

          {/* ================= STATUS ================= */}
          <Field>
            <FieldLabel>Status</FieldLabel>

            <FieldGroup>
              <FieldSet>
                <RadioGroup value={status} onValueChange={setStatus}>
                  {/* CLOSED OPTION */}
                  <FieldLabel>
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Closed</FieldTitle>
                        <FieldDescription>
                          The process or item has been completed and finalized.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value="Closed" />
                    </Field>
                  </FieldLabel>

                  {/* ENDORSED OPTION */}
                  <FieldLabel>
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Endorsed</FieldTitle>
                        <FieldDescription>
                          The item has been reviewed and forwarded for further
                          action.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value="Endorsed" />
                    </Field>
                  </FieldLabel>

                  {/* 👉 RE-ASSIGN BUTTON EXACTLY IN THE MIDDLE */}
                  {status === "Endorsed" && (
                    <div className="flex justify-center my-2">
                      <Button
                        onClick={() => {
                          setAgent("");
                          setHighlightAgent(true);
                          setAgentReassigned(true); // track that reassign was clicked
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                      >
                        Re-Assign Agent
                      </Button>
                    </div>
                  )}

                  {/* CONVERTED INTO SALES OPTION */}
                  <FieldLabel>
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Converted into Sales</FieldTitle>
                        <FieldDescription>
                          The item has progressed and resulted in a successful
                          sale.
                        </FieldDescription>
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

          {/* ================= CLOSED ================= */}
          {(status === "Closed" || status === "Converted into Sales") && (
            <>
              {/* HANDLING TIME SECTION - MOVED FROM STEP 3 */}
              {/* HANDLING TIME SECTION - MOVED FROM STEP 3 */}
              <div className="mt-4 rounded-lg border border-blue-300 bg-blue-50 p-4 space-y-4">
                <h4 className="font-semibold text-sm text-blue-700">
                  Handling Time Details (Required on Closing)
                </h4>

                {/* TSM ACKNOWLEDGEMENT */}
                <div
                  className={`p-4 rounded-xl border-2 shadow-sm transition-all duration-300 ${getTimeOfDayCardStyle(
                    tsmAcknowledgeDate,
                  )}`}
                >
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
                <div
                  className={`p-4 rounded-xl border-2 shadow-sm transition-all duration-300 ${getTimeOfDayCardStyle(
                    tsmHandlingTime,
                  )}`}
                >
                  <Field>
                    <FieldLabel>TSM Handling Time *</FieldLabel>

                    <InputField
                      type="datetime-local"
                      value={tsmHandlingTime}
                      onChange={(e) => setTsmHandlingTime(e.target.value)}
                      min={getMinDateTimeLocal(7)}
                      error={tsmTimeError || undefined}
                    />
                  </Field>
                </div>

                {/* TSA ACKNOWLEDGEMENT */}
                <div
                  className={`p-4 rounded-xl border-2 shadow-sm transition-all duration-300 ${getTimeOfDayCardStyle(
                    tsaAcknowledgeDate,
                  )}`}
                >
                  <Field>
                    <FieldLabel>TSA Acknowledgement Date *</FieldLabel>

                    <InputField
                      type="datetime-local"
                      value={tsaAcknowledgeDate}
                      onChange={(e) => setTsaAcknowledgeDate(e.target.value)}
                      min={getMinDateTimeLocal(7)}
                    />
                  </Field>
                </div>

                {/* TSA HANDLING */}
                <div
                  className={`p-4 rounded-xl border-2 shadow-sm transition-all duration-300 ${getTimeOfDayCardStyle(
                    tsaHandlingTime,
                  )}`}
                >
                  <Field>
                    <FieldLabel>TSA Handling Time *</FieldLabel>

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
                  Note: Either TSM or TSA acknowledgement details must be
                  completed before closing the ticket.
                </p>
              </div>

              {/* EXISTING CLOSE REASON SECTION */}
              {status === "Closed" && (
                <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 space-y-4">
                  <h4 className="font-semibold text-sm text-red-700">
                    On Closing of Ticket (Required)
                  </h4>

                  <Field>
                    <FieldLabel>1. Close Reason *</FieldLabel>
                    <select
                      value={closeReason}
                      onChange={(e) => setCloseReason(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    >
                      <option value="">Select a reason</option>
                      <option value="Same Specs Provided">
                        Same Specs Provided
                      </option>
                      <option value="Counter Offer">Counter Offer</option>
                      <option value="Out of Stock">Out of Stock</option>
                      <option value="Client Declined">Client Declined</option>
                      <option value="Not Interested">Not Interested</option>
                      <option value="Others">Others</option>
                    </select>
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

          {/* ================= CONVERTED ================= */}
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

          {/* ================= ACTIONS ================= */}
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
              isManagerRequiredButMissing
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
