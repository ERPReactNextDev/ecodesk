"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { User, User2 } from "lucide-react";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { CancelDialog } from "./activity-cancel-dialog";
import { TicketSheet } from "./sheet-ticket";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";


const toDatetimeLocal = (value?: string) => {
  if (!value) return "";

  const d = new Date(value);

  if (isNaN(d.getTime())) return "";

  // convert to local time string for datetime-local input
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);

  return local.toISOString().slice(0, 16);
};

interface Activity {
  _id: string;
  ticket_reference_number: string;
  client_segment: string;
  traffic: string;
  source_company: string;
  ticket_received: string;
  ticket_endorsed: string;
  gender: string;
  channel: string;
  wrap_up: string;
  source: string;
  customer_type: string;
  customer_status: string;
  status: string;
  department: string;
  manager: string;
  agent: string;
  remarks: string;
  inquiry: string;
  item_code: string;
  item_description: string;
  po_number: string;
  so_date: string;
  so_number: string;
  so_amount: string;
  qty_sold: string;
  quotation_number: string;
  quotation_amount: string;
  payment_terms: string;
  po_source: string;
  payment_date: string;
  delivery_date: string;
  date_created?: string;
  date_updated: string;
  tsm_acknowledge_date?: string;
  tsa_acknowledge_date?: string;
  tsm_handling_time?: string;
  tsa_handling_time?: string;
  hr_acknowledge_date?: string;

  company_name: string;
  contact_number: string;
  contact_person: string;
  email_address: string;
}

interface UpdateActivityDialogProps {
  onCreated: (newActivity: Activity) => void;
  _id: string;
  ticket_reference_number: string;
  referenceid: string;
  type_client?: string;

  //marked
  contact_number: string;
  email_address: string;
  contact_person: string;
  address: string;
  company_name: string;
  account_reference_number: string;


  ticket_received?: string;
  ticket_endorsed?: string;
  traffic?: string;
  source_company?: string;
  gender: string;
  channel?: string;
  wrap_up?: string;
  source?: string;
  customer_type?: string;
  customer_status?: string;
  status?: string;
  department?: string;
  manager?: string;
  agent?: string;
  remarks?: string;
  inquiry?: string;
  item_code?: string;
  item_description?: string;
  po_number?: string;
  so_date?: string;
  so_number?: string;
  so_amount?: string;
  qty_sold?: string;
  quotation_number?: string;
  quotation_amount?: string;
  payment_terms?: string;
  po_source?: string;
  payment_date?: string;
  delivery_date?: string;
  date_created?: string;
  close_reason?: string;
  counter_offer?: string;
  client_specs?: string;

  tsm_acknowledge_date?: string;
  tsa_acknowledge_date?: string;
  tsm_handling_time?: string;
  tsa_handling_time?: string;
  hr_acknowledge_date?: string;
}

function SpinnerEmpty({ onCancel }: { onCancel?: () => void }) {
  return (
    <Empty className="w-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Spinner />
        </EmptyMedia>
        <EmptyTitle>Processing your request</EmptyTitle>
        <EmptyDescription>
          Please wait while we process your request. Do not refresh the page.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </EmptyContent>
    </Empty>
  );
}

function generateTicketReferenceNumber() {
  const randomNumber = Math.floor(Math.random() * 10 ** 11); // 11 digits max
  const paddedNumber = randomNumber.toString().padStart(11, "0");
  return `CSR-Ticket-${paddedNumber}`;
}

export function UpdateTicketDialog({
  onCreated,
  _id,
  ticket_reference_number,
  referenceid,
  type_client,
  contact_number,
  company_name,
  contact_person,
  email_address,
  address,
  account_reference_number,
  ticket_received,
  ticket_endorsed,
  traffic,
  source_company,
  gender,
  channel,
  wrap_up,
  source,
  customer_type,
  customer_status,
  status,
  department,
  manager,
  agent,
  remarks,
  inquiry,
  item_code,
  item_description,
  po_number,
  so_date,
  so_number,
  so_amount,
  qty_sold,
  close_reason,
  counter_offer,
  client_specs,
  tsm_acknowledge_date,
  tsa_acknowledge_date,
  tsm_handling_time,
  tsa_handling_time,
  hr_acknowledge_date,
  quotation_number,
  quotation_amount,
  payment_terms,
  po_source,
  payment_date,
  delivery_date,
  date_created,
}: UpdateActivityDialogProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [step, setStep] = useState(1);

  const [activityRef, setActivityRef] = useState(_id);
  const [ticketReferenceNumber, setTicketReferenceNumber] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [contactPersons, setContactPersons] = useState<
    { title: string; name: string }[]
  >([{ title: "Mr.", name: "" }]);
  const [contactNumbers, setContactNumbers] = useState<string[]>([""]);
  const [emailAddresses, setEmailAddresses] = useState<string[]>([""]);

  const [clientSegment, setClientSegment] = useState("");
  const [trafficState, setTraffic] = useState("");
  const [sourceCompanyState, setSourceCompany] = useState("");
  const [ticketReceivedState, setTicketReceived] = useState("");
  const [ticketEndorsedState, setTicketEndorsed] = useState("");
  const [tsmAcknowledgeDate, setTsmAcknowledgeDate] = useState("");
  const [tsaAcknowledgeDate, setTsaAcknowledgeDate] = useState("");
  const [tsmHandlingTime, setTsmHandlingTime] = useState("");
  const [tsaHandlingTime, setTsaHandlingTime] = useState("");
  const [hrAcknowledgeDate, setHrAcknowledgeDate] = useState("");

  const [genderState, setGender] = useState("");
  const [channelState, setChannel] = useState("");
  const [wrapUpState, setWrapUp] = useState("");
  const isJobApplicant = wrapUpState === "Job Applicants";
  const [sourceState, setSource] = useState("");
  const [customerTypeState, setCustomerType] = useState("");
  const [customerStatusState, setCustomerStatus] = useState("");
  const [statusState, setStatus] = useState("");
  const [departmentState, setDepartment] = useState("");
  const [managerState, setManager] = useState("");
  const [agentState, setAgent] = useState("");
  const [remarksState, setRemarks] = useState("");
  const [inquiryState, setInquiry] = useState("");
  const [itemCodeState, setItemCode] = useState("");
  const [itemDescriptionState, setItemDescription] = useState("");
  const [poNumberState, setPoNumber] = useState("");
  const [soDateState, setSoDate] = useState("");
  const [soNumberState, setSoNumber] = useState("");
  const [soAmountState, setSoAmount] = useState("");
  const [quotationNumberState, setQuotationNumber] = useState("");
  const [quotationAmountState, setQuotationAmount] = useState("");
  const [qtySoldState, setQtySold] = useState("");
  const [paymentTermsState, setPaymentTerms] = useState("");
  const [poSourceState, setPoSource] = useState("");
  const [paymentDateState, setPaymentDate] = useState("");
  const [deliveryDateState, setDeliveryDate] = useState("");
  const [dateCreatedState, setDateCreated] = useState("");

  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");

  const [closeReason, setCloseReason] = useState("");
  const [counterOffer, setCounterOffer] = useState("");
  const [clientSpecs, setClientSpecs] = useState("");

  useEffect(() => {
    setActivityRef(_id || "");
    setClientSegment(type_client || "");
    setTraffic(traffic || "");
    setSourceCompany(source_company || "");
    setTicketReceived(ticket_received || "");
    setTicketEndorsed(ticket_endorsed || "");
    setGender(gender || "");
    setChannel(channel || "");
    setWrapUp(wrap_up || "");
    setSource(source || "");
    setCustomerType(customer_type || "");
    setCustomerStatus(customer_status || "");
    setStatus(status || "");
    setDepartment(department || "");
    setManager(manager || "");
    setAgent(agent || "");
    setRemarks(remarks || "");
    setInquiry(inquiry || "");
    setItemCode(item_code || "");
    setItemDescription(item_description || "");
    setPoNumber(po_number || "");
    setSoDate(so_date || "");
    setSoNumber(so_number || "");
    setSoAmount(so_amount?.toString() || "");
    setQuotationNumber(quotation_number || "");
    setQuotationAmount(quotation_amount || "");
    setQtySold(qty_sold || "");
    setPaymentTerms(payment_terms || "");
    setPoSource(po_source || "");
    setPaymentDate(payment_date || "");
    setDeliveryDate(delivery_date || "");
    setDateCreated(date_created || "");
    setTsmAcknowledgeDate(tsm_acknowledge_date || "");
    setTsaAcknowledgeDate(tsa_acknowledge_date || "");
    setTsmHandlingTime(tsm_handling_time || "");
    setTsaHandlingTime(tsa_handling_time || "");

    setCloseReason(close_reason || "");
    setCounterOffer(counter_offer || "");
    setClientSpecs(client_specs || "");

    setTsmAcknowledgeDate(toDatetimeLocal(tsm_acknowledge_date));
    setTsaAcknowledgeDate(toDatetimeLocal(tsa_acknowledge_date));
    setTsmHandlingTime(toDatetimeLocal(tsm_handling_time));
    setTsaHandlingTime(toDatetimeLocal(tsa_handling_time));
    setHrAcknowledgeDate(toDatetimeLocal(hr_acknowledge_date));

    setCompanyName(company_name || "");
    setContactPersons(
      contact_person
        ? contact_person.split(" / ").map((full) => {
            const parts = full.trim().split(" ");
            const possibleTitle = parts[0];
            const titles = ["Mr.", "Mrs.", "Ms."];

            if (titles.includes(possibleTitle)) {
              return {
                title: possibleTitle,
                name: parts.slice(1).join(" "),
              };
            }

            return {
              title: "Mr.",
              name: full,
            };
          })
        : [{ title: "Mr.", name: "" }],
    );
    setContactNumbers(contact_number ? contact_number.split(" / ") : [""]);
    setEmailAddresses(email_address ? email_address.split(" / ") : [""]);

    setDateCreated(toDatetimeLocal(date_created));
  }, [
    _id,
    type_client,
    traffic,
    source_company,
    ticket_received,
    ticket_endorsed,
    gender,
    channel,
    wrap_up,
    source,
    customer_type,
    customer_status,
    status,
    department,
    manager,
    agent,
    remarks,
    inquiry,
    item_code,
    item_description,
    po_number,
    so_date,
    so_number,
    so_amount,
    quotation_number,
    quotation_amount,
    qty_sold,
    payment_terms,
    po_source,
    payment_date,
    delivery_date,
    date_created,
    tsm_acknowledge_date,
    tsa_acknowledge_date,
    tsm_handling_time,
    tsa_handling_time,
    company_name,
    contact_number,
    contact_person,
    email_address,
  ]);

  useEffect(() => {
    if (ticket_reference_number) {
      setTicketReferenceNumber(ticket_reference_number);
    } else {
      // Auto generate if empty
      setTicketReferenceNumber(generateTicketReferenceNumber());
    }
  }, [ticket_reference_number]);

  useEffect(() => {
    if (isJobApplicant && step > 3) {
      setStep(3);
    }
  }, [isJobApplicant, step]);

  const handleUpdate = async () => {
    setLoading(true);

    const newActivity: Activity & {
      close_reason?: string;
      counter_offer?: string;
      client_specs?: string;
    } = {
      _id: activityRef,
      ticket_reference_number: ticketReferenceNumber,
      client_segment: clientSegment,
      traffic: trafficState,
      source_company: sourceCompanyState,

      ticket_received: ticketReceivedState,
      ticket_endorsed: ticketEndorsedState,

      company_name: companyName,
      contact_number: contactNumbers
        .map((n) => n.trim())
        .filter(Boolean)
        .join(" / "),
      contact_person: contactPersons
        .map((p) => `${p.title} ${p.name}`.trim())
        .filter((p) => p !== "")
        .join(" / "),
      email_address: emailAddresses
        .map((e) => e.trim())
        .filter(Boolean)
        .join(" / "),

      // ✅ ADD THESE
      tsm_acknowledge_date: tsmAcknowledgeDate,
      tsa_acknowledge_date: tsaAcknowledgeDate,
      tsm_handling_time: tsmHandlingTime,
      tsa_handling_time: tsaHandlingTime,
      hr_acknowledge_date: hrAcknowledgeDate,

      gender: genderState,
      channel: channelState,
      wrap_up: wrapUpState,
      source: sourceState,
      customer_type: customerTypeState,
      customer_status: customerStatusState,
      status: statusState,
      department: departmentState,
      manager: managerState,
      agent: agentState,
      remarks: remarksState,
      inquiry: inquiryState,
      item_code: itemCodeState,
      item_description: itemDescriptionState,
      po_number: poNumberState,
      so_date: soDateState,
      so_number: soNumberState,
      so_amount: soAmountState,
      quotation_number: quotationNumberState,
      quotation_amount: quotationAmountState,
      qty_sold: qtySoldState,
      payment_terms: paymentTermsState,
      po_source: poSourceState,
      payment_date: paymentDateState,
      delivery_date: deliveryDateState,
      date_created: dateCreatedState,
      date_updated: new Date().toISOString(),

      ...(statusState === "Closed" && {
        close_reason: closeReason,
        counter_offer: counterOffer,
        client_specs: clientSpecs,
      }),

      // 🔥 IF SAVING AS CONVERTED INTO SALES – CLEAR CLOSE FIELDS
      ...(statusState === "Converted into Sales" && {
        close_reason: "",
        counter_offer: "",
        client_specs: "",
      }),
    };

    // 🔥 CLEAR STEPS 4–6 ONLY WHEN SAVING AT STEP 3 (JOB APPLICANTS)
    if (wrapUpState === "Job Applicants" && step === 3) {
      newActivity.customer_type = "-";
      newActivity.customer_status = "-";
      newActivity.department = "-";
      newActivity.manager = "-";
      newActivity.agent = "-";

      newActivity.remarks = "-";
      newActivity.inquiry = "-";

      newActivity.item_code = "-";
      newActivity.item_description = "-";
      newActivity.po_number = "-";
      newActivity.so_date = "-";
      newActivity.so_number = "-";
      newActivity.so_amount = "-";
      newActivity.qty_sold = "-";

      newActivity.quotation_number = "-";
      newActivity.quotation_amount = "-";

      newActivity.payment_terms = "-";
      newActivity.po_source = "-";
      newActivity.payment_date = "-";
      newActivity.delivery_date = "-";

      // 🔥 ADD THIS PART – CLEAR TSA / TSM FIELDS
      newActivity.tsm_acknowledge_date = "";
      newActivity.tsm_handling_time = "";
      newActivity.tsa_acknowledge_date = "";
      newActivity.tsa_handling_time = "";

      // ❗ DO NOT TOUCH STATUS
      newActivity.close_reason = "-";
      newActivity.counter_offer = "-";
      newActivity.client_specs = "-";
    }

    try {
      const res = await fetch("/api/act-save-activity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newActivity),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Failed to save activity.");
        setLoading(false);
        return;
      }

      if (statusState === "Endorsed") {
        try {
          setLoading(true);

          const endorsedData = {
            agent: referenceid,
            account_reference_number,
            company_name,
            contact_person,
            contact_number,
            email_address,
            address,
            ticket_reference_number: ticketReferenceNumber,
            wrap_up: wrapUpState,
            inquiry: inquiryState,
            tsm: managerState,
            referenceid: agentState,
            status: "Endorsed",
          };

          const endorsedRes = await fetch("/api/act-save-endorsed-ticket", {
            method: "POST", // <-- now POST
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(endorsedData),
          });

          if (!endorsedRes.ok) {
            const err = await endorsedRes.json();
            toast.error(err.error || "Failed to save endorsed ticket.");
            setLoading(false);
            return;
          }

          toast.success("Ticket successfully endorsed!");
        } catch (err: any) {
          console.error(err);
          toast.error(err.message || "Something went wrong.");
        } finally {
          setLoading(false);
        }
      }

// 🔥 ALSO UPDATE COMPANY TABLE (SYNC STEP 1 FIELDS)
await fetch("/api/com-update-account", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    account_reference_number,
    company_name: companyName,
    contact_person: contactPersons
      .map((p) => `${p.title} ${p.name}`.trim())
      .filter((p) => p !== "")
      .join(" / "),
    contact_number: contactNumbers
      .map((n) => n.trim())
      .filter(Boolean)
      .join(" / "),
    email_address: emailAddresses
      .map((e) => e.trim())
      .filter(Boolean)
      .join(" / "),
    address,
  }),
});

toast.success("Activity and Company updated successfully!");
onCreated(newActivity);
setStep(1);
setSheetOpen(false);

    } finally {
      setLoading(false);
    }
  };

  const onSheetOpenChange = (open: boolean) => {
    if (!open) {
      setShowConfirmCancel(true);
    } else {
      setSheetOpen(true);
    }
  };

  const confirmCancel = () => {
    setShowConfirmCancel(false);
    setSheetOpen(false);
  };

  const cancelCancel = () => {
    setShowConfirmCancel(false);
    setSheetOpen(true);
  };

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={onSheetOpenChange}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSheetOpen(true)}
            className="cursor-pointer"
          >
            Update
          </Button>
        </SheetTrigger>

        <SheetContent
          side="right"
          style={{ width: "60vh", maxWidth: "none" }}
          className="overflow-auto custom-scrollbar"
        >
          <SheetHeader>
            <SheetTitle>Update Activity</SheetTitle>
            <SheetDescription>
              Fill out the steps to update activity.
            </SheetDescription>
          </SheetHeader>

          {/* Progress Steps */}
          <div className="flex items-center mb-6">
            {(isJobApplicant ? [1, 2, 3] : [1, 2, 3, 4, 5, 6]).map(
              (s, i, arr) => {
                const isActive = step === s;
                const isCompleted = step > s;

                return (
                  <React.Fragment key={s}>
                    <div
                      className="flex flex-col items-center relative flex-1 cursor-pointer"
                      onClick={() => {
                        if (isJobApplicant && s > 3) return;
                        setStep(s);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setStep(s);
                        }
                      }}
                      aria-current={isActive ? "step" : undefined}
                      aria-label={`Step ${s}: ${
                        s === 1
                          ? "Traffic"
                          : s === 2
                            ? "Department"
                            : s === 3
                              ? "Ticket"
                              : s === 4
                                ? "Customer"
                                : s === 5
                                  ? "Status"
                                  : "Assignee"
                      }`}
                    >
                      <div
                        className={`
              w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold z-10
              ${isActive ? "bg-blue-600" : isCompleted ? "bg-green-500" : "bg-gray-300"}
              hover:brightness-90 transition
            `}
                      >
                        {s}
                      </div>
                      <span className="mt-2 text-xs text-center max-w-[70px]">
                        {s === 1 && "Traffic"}
                        {s === 2 && "Department"}
                        {s === 3 && "Ticket"}
                        {s === 4 && "Customer"}
                        {s === 5 && "Status"}
                        {s === 6 && "Assignee"}
                      </span>

                      {i !== arr.length - 1 && (
                        <div
                          className={`absolute top-5 right-[-50%] w-full h-1 ${
                            step > s ? "bg-green-500" : "bg-gray-300"
                          }`}
                          style={{ zIndex: 0 }}
                        />
                      )}
                    </div>
                  </React.Fragment>
                );
              },
            )}
          </div>

          {loading ? (
            <SpinnerEmpty onCancel={() => setSheetOpen(false)} />
          ) : (
            <div className="p-4 grid gap-6">
              {/* Step 1: Traffic */}
              {step === 1 && (
                <div>
                  <FieldGroup>
                    <FieldSet>
                      <FieldLabel className="font-semibold text-sm">
                        Company Name
                      </FieldLabel>
                      <Input
                        type="text"
                        value={companyName}
                        onChange={(e) =>
                          setCompanyName(e.target.value.toUpperCase())
                        }
                        className="w-full"
                      />
                    </FieldSet>
                  </FieldGroup>

                  <FieldGroup>
                    <FieldSet className="mt-4">
                      <FieldGroup>
                        <FieldSet className="mt-4">
                          <FieldLabel className="font-semibold text-sm">
                            Contact Person
                          </FieldLabel>

<div className="space-y-2">
  {contactPersons.map((person, idx) => (
    <div key={idx} className="flex gap-2 items-center">
      {/* Title Dropdown */}
      <Select
        value={person.title}
        onValueChange={(value) => {
          const updated = [...contactPersons];
          updated[idx].title = value;
          setContactPersons(updated);
        }}
      >
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Mr.">Mr.</SelectItem>
          <SelectItem value="Mrs.">Mrs.</SelectItem>
          <SelectItem value="Ms.">Ms.</SelectItem>
        </SelectContent>
      </Select>

      {/* Name Input */}
      <Input
        value={person.name}
        onChange={(e) => {
          const updated = [...contactPersons];
          updated[idx].name = e.target.value;
          setContactPersons(updated);
        }}
        className="flex-1"
      />

      {/* Remove Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          if (contactPersons.length === 1) return;
          const updated = [...contactPersons];
          updated.splice(idx, 1);
          setContactPersons(updated);
        }}
      >
        −
      </Button>
    </div>
  ))}

  {/* Add Button */}
  <Button
    type="button"
    variant="secondary"
    onClick={() =>
      setContactPersons((prev) => [
        ...prev,
        { title: "Mr.", name: "" },
      ])
    }
  >
    + Add another person
  </Button>
</div>


                        </FieldSet>
                      </FieldGroup>
                    </FieldSet>
                  </FieldGroup>

                  <FieldGroup>
                    <FieldSet className="mt-4">
                      <FieldLabel className="font-semibold text-sm">
                        Contact Number
                      </FieldLabel>

                      <div className="space-y-2">
                        {contactNumbers.map((num, idx) => (
                          <div key={idx} className="flex gap-2">
                            <Input
                              value={num}
                              onChange={(e) => {
                                const updated = [...contactNumbers];
                                updated[idx] = e.target.value;
                                setContactNumbers(updated);
                              }}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                if (contactNumbers.length === 1) return;
                                const updated = [...contactNumbers];
                                updated.splice(idx, 1);
                                setContactNumbers(updated);
                              }}
                            >
                              −
                            </Button>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            setContactNumbers((prev) => [...prev, ""])
                          }
                        >
                          + Add another number
                        </Button>
                      </div>
                    </FieldSet>
                  </FieldGroup>

                  <FieldGroup>
                    <FieldSet className="mt-4">
                      <FieldLabel className="font-semibold text-sm">
                        Email Address
                      </FieldLabel>

                      <div className="space-y-2">
                        {emailAddresses.map((email, idx) => (
                          <div key={idx} className="flex gap-2">
                            <Input
                              type="email"
                              value={email}
                              onChange={(e) => {
                                const updated = [...emailAddresses];
                                updated[idx] = e.target.value;
                                setEmailAddresses(updated);
                              }}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                if (emailAddresses.length === 1) return;
                                const updated = [...emailAddresses];
                                updated.splice(idx, 1);
                                setEmailAddresses(updated);
                              }}
                            >
                              −
                            </Button>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            setEmailAddresses((prev) => [...prev, ""])
                          }
                        >
                          + Add another email
                        </Button>
                      </div>
                    </FieldSet>
                  </FieldGroup>

                  {/* MOVED GENDER FROM STEP 3 TO STEP 1 */}
                  <FieldGroup>
                    <FieldSet className="mt-4">
                      <FieldLabel className="font-semibold text-sm">
                        Gender{" "}
                        <span className="text-red-600 text-xs italic">
                          *required
                        </span>
                      </FieldLabel>

                      <RadioGroup
                        value={genderState}
                        onValueChange={setGender}
                        className="flex flex-row gap-6"
                      >
                        <FieldLabel className="cursor-pointer">
                          <Field
                            orientation="horizontal"
                            className="items-center"
                          >
                            <FieldContent className="flex items-center gap-2">
                              <User className="text-blue-600" size={18} />
                              <span>Male</span>
                            </FieldContent>

                            <RadioGroupItem value="Male" />
                          </Field>
                        </FieldLabel>

                        <FieldLabel className="cursor-pointer">
                          <Field
                            orientation="horizontal"
                            className="items-center"
                          >
                            <FieldContent className="flex items-center gap-2">
                              <User2 className="text-pink-600" size={18} />
                              <span>Female</span>
                            </FieldContent>

                            <RadioGroupItem value="Female" />
                          </Field>
                        </FieldLabel>
                      </RadioGroup>
                    </FieldSet>
                  </FieldGroup>

                  <FieldGroup>
                    <FieldSet className="mt-4">
                      <FieldLabel>
                        Choose Traffic{" "}
                        <span className="text-red-600 text-xs italic">
                          *required
                        </span>
                      </FieldLabel>
                      <RadioGroup
                        defaultValue={trafficState}
                        onValueChange={(value) => {
                          setTraffic(value);
                          setStartDate(new Date().toISOString());
                        }}
                      >
                        <FieldLabel className="cursor-pointer">
                          <Field orientation="horizontal">
                            <FieldContent>
                              <FieldTitle>Sales</FieldTitle>
                              <FieldDescription>
                                Make outgoing calls or sales interactions.
                              </FieldDescription>
                            </FieldContent>
                            <RadioGroupItem value="Sales" />
                          </Field>
                        </FieldLabel>

                        <FieldLabel className="cursor-pointer">
                          <Field orientation="horizontal">
                            <FieldContent>
                              <FieldTitle>Non-Sales</FieldTitle>
                              <FieldDescription>
                                Handle general inquiries or assistance.
                              </FieldDescription>
                            </FieldContent>
                            <RadioGroupItem value="Non-Sales" />
                          </Field>
                        </FieldLabel>
                      </RadioGroup>
                    </FieldSet>
                  </FieldGroup>

                  <FieldGroup>
                    <FieldSet>
                      <FieldLabel className="mt-4">
                        Choose Company{" "}
                        <span className="text-red-600 text-xs italic">
                          *required
                        </span>
                      </FieldLabel>
                      <RadioGroup
                        defaultValue={sourceCompanyState}
                        onValueChange={(value) => {
                          setSourceCompany(value);
                          setStartDate(new Date().toISOString());
                        }}
                      >
                        <FieldLabel className="cursor-pointer">
                          <Field orientation="horizontal">
                            <FieldContent>
                              <FieldTitle>Ecoshift Corporation</FieldTitle>
                              <FieldDescription>
                                The Fastest-Growing Provider of Innovative
                                Lighting Solutions
                              </FieldDescription>
                            </FieldContent>
                            <RadioGroupItem value="Ecoshift Corporation" />
                          </Field>
                        </FieldLabel>

                        <FieldLabel className="cursor-pointer">
                          <Field orientation="horizontal">
                            <FieldContent>
                              <FieldTitle>Disruptive Solutions Inc</FieldTitle>
                              <FieldDescription>
                                Future-ready lighting solutions that brighten
                                spaces, cut costs, and power smarter business
                              </FieldDescription>
                            </FieldContent>
                            <RadioGroupItem value="Disruptive Solutions Inc" />
                          </Field>
                        </FieldLabel>

                        <FieldLabel className="cursor-pointer">
                          <Field orientation="horizontal">
                            <FieldContent>
                              <FieldTitle>Buildchem Solutions</FieldTitle>
                              <FieldDescription>
                                Manufactures high-performance chemical products
                                for the building and infrastructure sectors.
                              </FieldDescription>
                            </FieldContent>
                            <RadioGroupItem value="Buildchem Solutions" />
                          </Field>
                        </FieldLabel>
                      </RadioGroup>
                    </FieldSet>
                  </FieldGroup>

                  <Button
                    className="mt-4 w-full cursor-pointer"
                    onClick={() => setStep(2)}
                    disabled={
                      !trafficState || !sourceCompanyState || !genderState
                    }
                  >
                    Next
                  </Button>
                </div>
              )}

              {/* Steps 2 - 6: TicketSheet */}
              {(trafficState === "Sales" || trafficState === "Non-Sales") && (
                <TicketSheet
                  step={step}
                  setStep={setStep}
                  ticketReceived={ticketReceivedState}
                  setTicketReceived={setTicketReceived}
                  ticketEndorsed={ticketEndorsedState}
                  setTicketEndorsed={setTicketEndorsed}
                  gender={genderState}
                  setGender={setGender}
                  channel={channelState}
                  setChannel={setChannel}
                  wrapUp={wrapUpState}
                  setWrapUp={setWrapUp}
                  source={sourceState}
                  setSource={setSource}
                  customerType={customerTypeState}
                  setCustomerType={setCustomerType}
                  customerStatus={customerStatusState}
                  setCustomerStatus={setCustomerStatus}
                  status={statusState}
                  setStatus={setStatus}
                  department={departmentState}
                  setDepartment={setDepartment}
                  manager={managerState}
                  setManager={setManager}
                  agent={agentState}
                  setAgent={setAgent}
                  remarks={remarksState}
                  setRemarks={setRemarks}
                  inquiry={inquiryState}
                  setInquiry={setInquiry}
                  itemCode={itemCodeState}
                  setItemCode={setItemCode}
                  itemDescription={itemDescriptionState}
                  setItemDescription={setItemDescription}
                  poNumber={poNumberState}
                  setPoNumber={setPoNumber}
                  soDate={soDateState}
                  setSoDate={setSoDate}
                  soNumber={soNumberState}
                  setSoNumber={setSoNumber}
                  soAmount={soAmountState}
                  setSoAmount={setSoAmount}
                  quotationNumber={quotationNumberState}
                  setQuotationNumber={setQuotationNumber}
                  quotationAmount={quotationAmountState}
                  setQuotationAmount={setQuotationAmount}
                  qtySold={qtySoldState}
                  setQtySold={setQtySold}
                  paymentTerms={paymentTermsState}
                  setPaymentTerms={setPaymentTerms}
                  poSource={poSourceState}
                  setPoSource={setPoSource}
                  paymentDate={paymentDateState}
                  setPaymentDate={setPaymentDate}
                  deliveryDate={deliveryDateState}
                  setDeliveryDate={setDeliveryDate}
                  dateCreated={dateCreatedState}
                  setDateCreated={setDateCreated}
                  loading={loading}
                  ticketReferenceNumber={ticketReferenceNumber}
                  setTicketReferenceNumber={setTicketReferenceNumber}
                  handleBack={() => setStep((prev) => prev - 1)}
                  handleNext={() => {
                    if (isJobApplicant && step === 3) return;
                    setStep((prev) => prev + 1);
                  }}
                  handleUpdate={handleUpdate}
                  closeReason={closeReason}
                  setCloseReason={setCloseReason}
                  counterOffer={counterOffer}
                  setCounterOffer={setCounterOffer}
                  clientSpecs={clientSpecs}
                  setClientSpecs={setClientSpecs}
                  tsmAcknowledgeDate={tsmAcknowledgeDate}
                  setTsmAcknowledgeDate={setTsmAcknowledgeDate}
                  tsaAcknowledgeDate={tsaAcknowledgeDate}
                  setTsaAcknowledgeDate={setTsaAcknowledgeDate}
                  tsmHandlingTime={tsmHandlingTime}
                  setTsmHandlingTime={setTsmHandlingTime}
                  tsaHandlingTime={tsaHandlingTime}
                  setTsaHandlingTime={setTsaHandlingTime}
                  hrAcknowledgeDate={hrAcknowledgeDate}
                  setHrAcknowledgeDate={setHrAcknowledgeDate}
                />
              )}
            </div>
          )}

          {showConfirmCancel && (
            <CancelDialog onCancel={cancelCancel} onConfirm={confirmCancel} />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
