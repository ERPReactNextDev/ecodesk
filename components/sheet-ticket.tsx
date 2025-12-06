"use client";

import React, { useState } from "react";
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

interface Option {
    value: string;
    title: string;
    description: string;
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
    loading: boolean;
    handleBack: () => void;
    handleNext: () => void;
    handleUpdate: () => void;
}

// Reusable Radio Group
const RadioOptionsGroup = ({
    label,
    options,
    value,
    onChange,
    error,
}: {
    label: string;
    options: Option[];
    value: string;
    onChange: (v: string) => void;
    error?: string;
}) => (
    <FieldGroup>
        <FieldSet>
            <FieldLabel>{label}</FieldLabel>
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
    label,
    value,
    onChange,
    placeholder,
    options,
    error,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    options: { value: string; label: string }[];
    error?: string;
}) => (
    <Field>
        <FieldLabel>{label}</FieldLabel>
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
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    description,
    rows,
    error,
}: {
    label: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    placeholder?: string;
    description?: string;
    rows?: number;
    error?: string;
}) => (
    <Field>
        <FieldLabel>{label}</FieldLabel>
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
                <Input type={type} value={value} onChange={onChange} placeholder={placeholder} />
                {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
            </>
        )}
    </Field>
);

export function TicketSheet(props: TicketSheetProps) {
    const {
        step,
        setStep,
        department,
        setDepartment,
        ticketReceived,
        setTicketReceived,
        ticketEndorsed,
        setTicketEndorsed,
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
        handleBack,
        handleNext,
        handleUpdate
    } = props;

    const [errors, setErrors] = useState<{
        ticketReceived?: string;
        ticketEndorsed?: string;
        channel?: string;
        wrapUp?: string;
        status?: string;
    }>({});

    // Options
    const departmentOptions: Option[] = [
        { value: "Accounting", title: "Accounting", description: "Initial call to reconnect or update the client about ongoing concerns." },
        { value: "E-Commerce", title: "E-Commerce", description: "Follow-up call to check progress or request additional requirements." },
        { value: "Engineering", title: "Engineering", description: "Follow-up call to check progress or request additional requirements." },
        { value: "Human Resources", title: "Human Resources", description: "Follow-up call to check progress or request additional requirements." },
        { value: "Marketing", title: "Marketing", description: "Follow-up call to check progress or request additional requirements." },
        { value: "Procurement", title: "Procurement", description: "Follow-up call to check progress or request additional requirements." },
        { value: "Sales", title: "Sales", description: "Follow-up call to check progress or request additional requirements." },
        { value: "Warehouse", title: "Warehouse & Logistics", description: "Follow-up call to check progress or request additional requirements." },
    ];

    const customerStatusOptions: Option[] = [
        { value: "New Client", title: "New Client", description: "A newly onboarded client with initial transactions." },
        { value: "New Non-Buying", title: "New Non-Buying", description: "Newly registered customer but has no purchasing history yet." },
        { value: "Existing Active", title: "Existing Active", description: "Has consistent or recent purchase activity." },
        { value: "Existing Inactive", title: "Existing Inactive", description: "Previously active but has no recent purchase activity." },
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
        { value: "Endorsed", title: "Endorsed", description: "The item has been reviewed and forwarded for further action." },
        { value: "Converted into Sales", title: "Converted into Sales", description: "The item has progressed and resulted in a successful sale." },
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

    // Validates required fields for step 6 (status)
    const validateStep6 = () => {
        const newErrors: typeof errors = {};
        if (!status) newErrors.status = "Status is required.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Override handleNext to add validation on step 3 and 6
    const onNext = () => {
        if (step === 3) {
            if (!validateStep3()) return;
        }
        if (step === 6) {
            if (!validateStep6()) return;
        }
        setErrors({});
        handleNext();
    };

    // Override handleUpdate to validate status before saving
    const onUpdate = () => {
        if (!validateStep6()) return;
        setErrors({});
        handleUpdate();
    };

    // Helper: common buttons with validation on Next
    const Navigation = () => (
        <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={handleBack}>
                Back
            </Button>
            <Button onClick={onNext}>Next</Button>
        </div>
    );

    return (
        <>
            {step === 2 && (
                <>
                    <RadioOptionsGroup
                        label="Department"
                        options={departmentOptions}
                        value={department}
                        onChange={setDepartment}
                    />
                    <h2 className="text-sm font-semibold mt-3">Step 2 — Department</h2>
                    <Navigation />
                </>
            )}

            {step === 3 && (
                <>
                    <FieldGroup>
                        <FieldSet>
                            <InputField
                                label="Ticket Received"
                                type="datetime-local"
                                value={ticketReceived}
                                onChange={(e) => setTicketReceived(e.target.value)}
                                description="Date when the ticket was initially submitted or logged."
                                error={errors.ticketReceived}
                            />
                            <InputField
                                label="Ticket Endorsed"
                                type="datetime-local"
                                value={ticketEndorsed}
                                onChange={(e) => setTicketEndorsed(e.target.value)}
                                description="Date when the ticket was forwarded to the assigned department."
                                error={errors.ticketEndorsed}
                            />
                            <SelectField
                                label="Channel"
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
                            <SelectField
                                label="Wrap Up"
                                value={wrapUp}
                                onChange={setWrapUp}
                                placeholder="Select a wrap-up"
                                options={[
                                    { value: "Customer Order", label: "Customer Order" },
                                    { value: "Customer Inquiry Sales", label: "Customer Inquiry Sales" },
                                    { value: "Customer Inquiry Non-Sales", label: "Customer Inquiry Non-Sales" },
                                    { value: "Follow Up Sales", label: "Follow Up Sales" },
                                    { value: "Follow Up Non-Sales", label: "Follow Up Non-Sales" },
                                    { value: "After Sales", label: "After Sales" },
                                    { value: "Customer Complaint", label: "Customer Complaint" },
                                    { value: "Customer Feedback/Recommendation", label: "Customer Feedback/Recommendation" },
                                    { value: "Job Applicants", label: "Job Applicants" },
                                    { value: "Supplier/Vendor Product Offer", label: "Supplier/Vendor Product Offer" },
                                    { value: "Internal Whistle Blower", label: "Internal Whistle Blower" },
                                    { value: "Threats/Extortion/Intimidation", label: "Threats/Extortion/Intimidation" },
                                    { value: "Supplier Accredited Request", label: "Supplier Accredited Request" },
                                    { value: "Internal Concern", label: "Internal Concern" },
                                    { value: "Others", label: "Others" },
                                ]}
                                error={errors.wrapUp}
                            />
                            <SelectField
                                label="Source"
                                value={source}
                                onChange={setSource}
                                placeholder="Select a source"
                                options={[
                                    { value: "FB Ads", label: "FB Ads" },
                                    { value: "Viber", label: "Viber Community" },
                                    { value: "Whatsapp", label: "Whatsapp Community" },
                                    { value: "SMS", label: "SMS" },
                                    { value: "Website", label: "Website" },
                                    { value: "Word of Mouth", label: "Word of Mouth" },
                                    { value: "Quotation Docs", label: "Quotation Docs" },
                                    { value: "Google Search", label: "Google Search" },
                                    { value: "Site Visit", label: "Site Visit" },
                                    { value: "Agent Call", label: "Agent Call" },
                                    { value: "Catalogue", label: "Catalogue" },
                                    { value: "Shopee", label: "Shopee" },
                                    { value: "Lazada", label: "Lazada" },
                                    { value: "Tiktok", label: "Tiktok" },
                                    { value: "Worldbex", label: "Worldbex" },
                                    { value: "PhilConstruct", label: "PhilConstruct" },
                                    { value: "Conex", label: "Conex" },
                                    { value: "Product Demo", label: "Product Demo" },
                                ]}
                            />
                        </FieldSet>
                    </FieldGroup>
                    <h2 className="text-sm font-semibold mt-3">Step 3 — Ticket Details</h2>
                    <Navigation />
                </>
            )}

            {step === 4 && (
                <>
                    <RadioOptionsGroup
                        label="Customer Status"
                        options={customerStatusOptions}
                        value={customerStatus}
                        onChange={setCustomerStatus}
                    />
                    <RadioOptionsGroup
                        label="Customer Type"
                        options={customerTypeOptions}
                        value={customerType}
                        onChange={setCustomerType}
                    />
                    <h2 className="text-sm font-semibold mt-4">Step 4 — Customer Details</h2>
                    <Navigation />
                </>
            )}

            {step === 5 && (
                <>
                    {wrapUp !== "Job Applicants" && (
                        <>
                            <SelectField
                                label="Remarks"
                                value={remarks}
                                onChange={setRemarks}
                                placeholder="Select remarks"
                                options={[
                                    { value: "No Stocks / Insufficient Stocks", label: "No Stocks / Insufficient Stocks" },
                                    { value: "Item Not Carried", label: "Item Not Carried" },
                                    { value: "Quotation For Approval", label: "Quotation For Approval" },
                                    { value: "Customer Request Cancellation", label: "Customer Request Cancellation" },
                                    { value: "Accreditation / Partnership", label: "Accreditation / Partnership" },
                                    { value: "For SPF", label: "For SPF" },
                                    { value: "No Response For Client", label: "No Response For Client" },
                                    { value: "Assisted", label: "Assisted" },
                                    { value: "Disapproved Quotation", label: "Disapproved Quotation" },
                                    { value: "For Site Visit", label: "For Site Visit" },
                                    { value: "Non Standard Item", label: "Non Standard Item" },
                                    { value: "Po Received", label: "Po Received" },
                                    { value: "Not Converted to Sales", label: "Not Converted to Sales" },
                                    { value: "For Occular Inspection", label: "For Occular Inspection" },
                                    { value: "Sold", label: "Sold" },
                                ]}
                            />

                            <InputField
                                label="Inquiry / Concern"
                                type="textarea"
                                value={inquiry}
                                onChange={(e) => setInquiry(e.target.value)}
                                placeholder="Enter any remarks here..."
                            />
                        </>
                    )}

                    {["No Stocks / Insufficient Stocks", "Item Not Carried", "Non Standard Item"].includes(remarks) && (
                        <>
                            <InputField
                                label="Item Code"
                                value={itemCode}
                                onChange={(e) => setItemCode(e.target.value)}
                                placeholder="Item code"
                            />
                            <InputField
                                label="Item Description"
                                type="textarea"
                                value={itemDescription}
                                onChange={(e) => setItemDescription(e.target.value)}
                                placeholder="Enter item description"
                            />
                        </>
                    )}

                    {remarks === "Po Received" && (
                        <>
                            <InputField
                                label="PO Number"
                                value={poNumber}
                                onChange={(e) => setPoNumber(e.target.value)}
                                placeholder="PO number"
                            />
                            <InputField
                                label="SO Date"
                                type="date"
                                value={soDate}
                                onChange={(e) => setSoDate(e.target.value)}
                            />
                            <SelectField
                                label="Payment Terms"
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
                            <SelectField
                                label="PO Source"
                                value={poSource}
                                onChange={setPoSource}
                                placeholder="Select PO source"
                                options={[
                                    { value: "CS Email", label: "CS Email" },
                                    { value: "Sales Email", label: "Sales Email" },
                                    { value: "Sales Agent", label: "Sales Agent" },
                                ]}
                            />
                            <InputField
                                label="Payment Date"
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                            />
                            <InputField
                                label="Delivery Date"
                                value={deliveryDate}
                                onChange={(e) => setDeliveryDate(e.target.value)}
                            />
                        </>
                    )}

                    {remarks === "Quotation For Approval" && (
                        <>
                            <InputField
                                label="Quotation Number"
                                value={quotationNumber}
                                onChange={(e) => setQuotationNumber(e.target.value)}
                                placeholder="Quotation number"
                            />
                            <InputField
                                label="Quotation Amount"
                                type="number"
                                value={quotationAmount}
                                onChange={(e) => setQuotationAmount(e.target.value)}
                            />
                        </>
                    )}

                    <h2 className="text-sm font-semibold mt-4">Step 5 — Status</h2>
                    <Navigation />
                </>
            )}

            {step === 6 && (
                <>
                    <InputField
                        label="Manager"
                        value={manager}
                        onChange={(e) => setManager(e.target.value)}
                        placeholder="e.g., Email, Phone, Facebook"
                    />
                    {wrapUp !== "Job Applicants" && (
                        <InputField
                            label="Agent"
                            value={agent}
                            onChange={(e) => setAgent(e.target.value)}
                            placeholder="e.g., Email, Phone, Facebook"
                        />
                    )}

                    <RadioOptionsGroup
                        label="Status"
                        options={statusOptions}
                        value={status}
                        onChange={setStatus}
                        error={errors.status}
                    />

                    {status === "Converted into Sales" && (
                        <>
                            <InputField
                                label="SO Number"
                                value={soNumber}
                                onChange={(e) => setSoNumber(e.target.value)}
                            />
                            <InputField
                                label="SO Amount"
                                type="number"
                                value={soAmount}
                                onChange={(e) => setSoAmount(e.target.value)}
                            />
                            <InputField
                                label="Qty Sold"
                                type="number"
                                value={qtySold}
                                onChange={(e) => setQtySold(e.target.value)}
                            />
                        </>
                    )}

                    <h2 className="text-sm font-semibold mt-4">Step 6 — Assignee</h2>
                    <Button variant="outline" onClick={handleBack}>Back</Button>
                    <Button onClick={handleUpdate}>Save</Button>
                </>
            )}
        </>
    );
}
