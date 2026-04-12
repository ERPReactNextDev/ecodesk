"use client";

import React, { lazy, Suspense, useCallback, useMemo } from "react";
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
import { Spinner } from "@/components/ui/spinner";
import { CancelDialog } from "./activity-cancel-dialog";
import { useActivityForm } from "@/hooks/useActivityForm";
import type { ActivityFormState } from "@/hooks/useActivityForm";

// Lazy load step components for code splitting
const TicketFormStep1 = lazy(() => import("./ticket-form/TicketFormStep1"));

const toDatetimeLocal = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
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
  department_head: string;
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
  inquiry_received?: string;
  response_to_inquiry?: string;
  handling_csr?: string;
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
  contact_number: string;
  email_address: string;
  contact_person: string;
  address: string;
  company_name: string;
  account_reference_number: string;
  ticket_received?: string;
  ticket_endorsed?: string;
  inquiry_received?: string;
  response_to_inquiry?: string;
  handling_csr?: string;
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
  department_head?: string;
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

const stepLabels: Record<number, string> = {
  1: "Traffic",
  2: "Department",
  3: "Ticket",
  4: "Customer",
  5: "Status",
  6: "Assignee",
};

// Optimized spinner with memo
const SpinnerEmpty = React.memo(function SpinnerEmpty({
  onCancel,
}: {
  onCancel?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12">
      <Spinner className="w-12 h-12 mb-4" />
      <h3 className="text-lg font-semibold mb-2">Processing your request</h3>
      <p className="text-muted-foreground text-sm mb-4">
        Please wait while we process your request. Do not refresh the page.
      </p>
      {onCancel && (
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </div>
  );
});

// Memoized step indicator to prevent re-renders
const StepIndicator = React.memo(function StepIndicator({
  step,
  isJobApplicant,
  onStepClick,
}: {
  step: number;
  isJobApplicant: boolean;
  onStepClick: (step: number) => void;
}) {
  const steps = useMemo(
    () => (isJobApplicant ? [1, 2, 3] : [1, 2, 3, 4, 5, 6]),
    [isJobApplicant]
  );

  return (
    <div className="flex items-center mb-6">
      {steps.map((s, i, arr) => {
        const isActive = step === s;
        const isCompleted = step > s;
        const isLast = i === arr.length - 1;

        return (
          <React.Fragment key={s}>
            <div
              className="flex flex-col items-center relative flex-1 cursor-pointer"
              onClick={() => onStepClick(s)}
              role="button"
              tabIndex={0}
              aria-current={isActive ? "step" : undefined}
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
                {stepLabels[s]}
              </span>

              {!isLast && (
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
      })}
    </div>
  );
});

export function UpdateTicketDialogOptimized({
  onCreated,
  _id,
  ticket_reference_number,
  referenceid,
  type_client,
  contact_number,
  email_address,
  contact_person,
  address,
  company_name,
  account_reference_number,
  ticket_received,
  ticket_endorsed,
  inquiry_received,
  response_to_inquiry,
  handling_csr,
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
  department_head,
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
  quotation_number,
  quotation_amount,
  payment_terms,
  po_source,
  payment_date,
  delivery_date,
  date_created,
  close_reason,
  counter_offer,
  client_specs,
  tsm_acknowledge_date,
  tsa_acknowledge_date,
  tsm_handling_time,
  tsa_handling_time,
  hr_acknowledge_date,
}: UpdateActivityDialogProps) {
  // Parse contact persons once on init
  const initialContactPersons = useMemo(() => {
    if (!contact_person) return [{ title: "Mr.", name: "" }];
    return contact_person.split(" / ").map((full) => {
      const parts = full.trim().split(" ");
      const titles = ["Mr.", "Mrs.", "Ms."];
      if (titles.includes(parts[0])) {
        return { title: parts[0], name: parts.slice(1).join(" ") };
      }
      return { title: "Mr.", name: full };
    });
  }, [contact_person]);

  const initialData = useMemo(
    () => ({
      activityRef: _id || "",
      ticketReferenceNumber: ticket_reference_number || "",
      companyName: company_name || "",
      contactPersons: initialContactPersons,
      contactNumbers: contact_number ? contact_number.split(" / ") : [""],
      emailAddresses: email_address ? email_address.split(" / ") : [""],
      clientSegment: type_client || "",
      traffic: traffic || "",
      sourceCompany: source_company || "",
      ticketReceived: ticket_received || "",
      ticketEndorsed: ticket_endorsed || "",
      tsmAcknowledgeDate: toDatetimeLocal(tsm_acknowledge_date),
      tsaAcknowledgeDate: toDatetimeLocal(tsa_acknowledge_date),
      tsmHandlingTime: toDatetimeLocal(tsm_handling_time),
      tsaHandlingTime: toDatetimeLocal(tsa_handling_time),
      hrAcknowledgeDate: toDatetimeLocal(hr_acknowledge_date),
      handlingCSR: handling_csr || "",
      inquiryReceived: toDatetimeLocal(inquiry_received),
      responseToInquiry: toDatetimeLocal(response_to_inquiry),
      gender: gender || "",
      channel: channel || "",
      wrapUp: wrap_up || "",
      source: source || "",
      customerType: customer_type || "",
      customerStatus: customer_status || "",
      status: status || "",
      department: department || "",
      manager: manager || "",
      agent: agent || "",
      departmentHead: department_head || "",
      remarks: remarks || "",
      inquiry: inquiry || "",
      itemCode: item_code || "",
      itemDescription: item_description || "",
      poNumber: po_number || "",
      soDate: so_date || "",
      soNumber: so_number || "",
      soAmount: so_amount?.toString() || "",
      quotationNumber: quotation_number || "",
      quotationAmount: quotation_amount || "",
      qtySold: qty_sold || "",
      paymentTerms: payment_terms || "",
      poSource: po_source || "",
      paymentDate: payment_date || "",
      deliveryDate: delivery_date || "",
      dateCreated: toDatetimeLocal(date_created),
      closeReason: close_reason || "",
      counterOffer: counter_offer || "",
      clientSpecs: client_specs || "",
    }),
    [] // Only compute once on mount
  );

  const {
    state,
    setField,
    setFields,
    closeSheet,
    showCancelConfirm,
    hideCancelConfirm,
    startLoading,
    stopLoading,
    contactPersonActions,
    contactNumberActions,
    emailAddressActions,
    isJobApplicant,
    setStep,
  } = useActivityForm(initialData);

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        showCancelConfirm();
      }
    },
    [showCancelConfirm]
  );

  const confirmCancel = useCallback(() => {
    hideCancelConfirm();
    closeSheet();
  }, [hideCancelConfirm, closeSheet]);

  const cancelCancel = useCallback(() => {
    hideCancelConfirm();
  }, [hideCancelConfirm]);

  const handleStepClick = useCallback(
    (newStep: number) => {
      if (isJobApplicant && newStep > 3) return;
      setStep(newStep);
    },
    [isJobApplicant, setStep]
  );

  // Build activity payload - memoized to prevent recalculation
  const buildActivityPayload = useCallback((): Activity & {
    close_reason?: string;
    counter_offer?: string;
    client_specs?: string;
  } => {
    const contactPersonString = state.contactPersons
      .map((p) => `${p.title} ${p.name}`.trim())
      .filter((p) => p !== "")
      .join(" / ");

    const contactNumberString = state.contactNumbers
      .map((n) => n.trim())
      .filter(Boolean)
      .join(" / ");

    const emailAddressString = state.emailAddresses
      .map((e) => e.trim())
      .filter(Boolean)
      .join(" / ");

    const isClosed =
      state.status === "Closed" ||
      state.wrapUp === "Job Applicants" ||
      state.wrapUp === "Inquiry";

    const isJobApplicantOrInquiry =
      state.wrapUp === "Job Applicants" || state.wrapUp === "Inquiry";

    return {
      _id: state.activityRef,
      ticket_reference_number: state.ticketReferenceNumber,
      client_segment: state.clientSegment,
      traffic: state.traffic,
      source_company: state.sourceCompany,
      ticket_received: state.ticketReceived,
      ticket_endorsed: state.ticketEndorsed,
      inquiry_received: state.inquiryReceived,
      response_to_inquiry: state.responseToInquiry,
      handling_csr: state.handlingCSR,
      company_name: state.companyName,
      contact_number: contactNumberString,
      contact_person: contactPersonString,
      email_address: emailAddressString,
      tsm_acknowledge_date: state.tsmAcknowledgeDate,
      tsa_acknowledge_date: state.tsaAcknowledgeDate,
      tsm_handling_time: state.tsmHandlingTime,
      tsa_handling_time: state.tsaHandlingTime,
      hr_acknowledge_date: state.hrAcknowledgeDate,
      gender: state.gender,
      channel: state.channel,
      wrap_up: state.wrapUp,
      source: state.source,
      ...(isJobApplicantOrInquiry && { close_reason: "Inquiry Handled" }),
      ...(state.wrapUp === "Job Applicants" && {
        close_reason: "Job Application Received",
      }),
      customer_type: isJobApplicantOrInquiry ? "-" : state.customerType,
      customer_status: isJobApplicantOrInquiry ? "-" : state.customerStatus,
      status: isJobApplicantOrInquiry ? "Closed" : state.status,
      department: isJobApplicantOrInquiry ? "-" : state.department,
      manager: isJobApplicantOrInquiry ? "-" : state.manager,
      agent: isJobApplicantOrInquiry ? "-" : state.agent,
      department_head: state.departmentHead,
      remarks: isJobApplicantOrInquiry ? "-" : state.remarks,
      inquiry: isJobApplicantOrInquiry ? "-" : state.inquiry,
      item_code: isJobApplicantOrInquiry ? "-" : state.itemCode,
      item_description: isJobApplicantOrInquiry ? "-" : state.itemDescription,
      po_number: isJobApplicantOrInquiry ? "-" : state.poNumber,
      so_date: isJobApplicantOrInquiry ? "-" : state.soDate,
      so_number: isJobApplicantOrInquiry ? "-" : state.soNumber,
      so_amount: isJobApplicantOrInquiry ? "-" : state.soAmount,
      qty_sold: isJobApplicantOrInquiry ? "-" : state.qtySold,
      quotation_number: isJobApplicantOrInquiry ? "-" : state.quotationNumber,
      quotation_amount: isJobApplicantOrInquiry ? "-" : state.quotationAmount,
      payment_terms: isJobApplicantOrInquiry ? "-" : state.paymentTerms,
      po_source: isJobApplicantOrInquiry ? "-" : state.poSource,
      payment_date: isJobApplicantOrInquiry ? "-" : state.paymentDate,
      delivery_date: isJobApplicantOrInquiry ? "-" : state.deliveryDate,
      date_created: state.dateCreated,
      date_updated: new Date().toISOString(),
      ...(isClosed && {
        close_reason: isJobApplicantOrInquiry
          ? state.wrapUp === "Inquiry"
            ? "Inquiry Handled"
            : "Job Application Received"
          : state.closeReason,
        counter_offer: state.counterOffer,
        client_specs: state.clientSpecs,
      }),
      ...(state.status === "Converted into Sales" && {
        close_reason: "",
        counter_offer: "",
        client_specs: "",
      }),
    } as Activity & { close_reason?: string; counter_offer?: string; client_specs?: string };
  }, [state, isJobApplicant]);

  const handleUpdate = useCallback(async () => {
    startLoading();

    try {
      const newActivity = buildActivityPayload();

      // Save activity
      const res = await fetch("/api/act-save-activity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newActivity),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Failed to save activity.");
        return;
      }

      // Handle endorsed status
      if (state.status === "Endorsed") {
        const endorsedData = {
          agent: referenceid,
          account_reference_number: account_reference_number,
          company_name: state.companyName,
          contact_person: state.contactPersons
            .map((p) => `${p.title} ${p.name}`.trim())
            .filter((p) => p !== "")
            .join(" / "),
          contact_number: state.contactNumbers
            .map((n) => n.trim())
            .filter(Boolean)
            .join(" / "),
          email_address: state.emailAddresses
            .map((e) => e.trim())
            .filter(Boolean)
            .join(" / "),
          address,
          ticket_reference_number: state.ticketReferenceNumber,
          wrap_up: state.wrapUp,
          status: "Endorsed",
          inquiry: state.inquiry,
          tsm: state.manager,
          referenceid: state.agent,
        };

        const endorsedRes = await fetch("/api/act-save-endorsed-ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(endorsedData),
        });

        if (!endorsedRes.ok) {
          const err = await endorsedRes.json();
          toast.error(err.error || "Failed to save endorsed ticket.");
          return;
        }

        toast.success("Ticket successfully endorsed!");
      }

      // Update company
      await fetch("/api/com-update-account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department_head: state.departmentHead,
          account_reference_number,
          company_name: state.companyName,
          contact_person: state.contactPersons
            .map((p) => `${p.title} ${p.name}`.trim())
            .filter((p) => p !== "")
            .join(" / "),
          contact_number: state.contactNumbers
            .map((n) => n.trim())
            .filter(Boolean)
            .join(" / "),
          email_address: state.emailAddresses
            .map((e) => e.trim())
            .filter(Boolean)
            .join(" / "),
          address,
        }),
      });

      toast.success("Activity and Company updated successfully!");
      onCreated(newActivity);
      closeSheet();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      stopLoading();
    }
  }, [
    buildActivityPayload,
    startLoading,
    stopLoading,
    onCreated,
    closeSheet,
    referenceid,
    account_reference_number,
    address,
    state.status,
    state.wrapUp,
    state.inquiry,
    state.manager,
    state.agent,
    state.ticketReferenceNumber,
    state.companyName,
    state.contactPersons,
    state.contactNumbers,
    state.emailAddresses,
    state.departmentHead,
  ]);

  return (
    <>
      <Sheet open={state.sheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            onClick={() => setFields({ sheetOpen: true })}
            className="w-full cursor-pointer text-xs"
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
            <SheetDescription>Fill out the steps to update activity.</SheetDescription>
          </SheetHeader>

          <StepIndicator
            step={state.step}
            isJobApplicant={isJobApplicant}
            onStepClick={handleStepClick}
          />

          {state.loading ? (
            <SpinnerEmpty onCancel={() => closeSheet()} />
          ) : (
            <div className="p-4 grid gap-6">
              <Suspense fallback={<SpinnerEmpty />}>
                {state.step === 1 && (
                  <TicketFormStep1
                    state={state}
                    setField={setField}
                    contactPersonActions={contactPersonActions}
                    contactNumberActions={contactNumberActions}
                    emailAddressActions={emailAddressActions}
                  />
                )}
              </Suspense>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => setStep(Math.max(state.step - 1, 1))}
                  disabled={state.step === 1}
                >
                  Previous
                </Button>

                {state.step < (isJobApplicant ? 3 : 6) ? (
                  <Button onClick={() => setStep(state.step + 1)}>Next</Button>
                ) : (
                  <Button onClick={handleUpdate}>Save</Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {state.showConfirmCancel && (
        <CancelDialog onConfirm={confirmCancel} onCancel={cancelCancel} />
      )}
    </>
  );
}
