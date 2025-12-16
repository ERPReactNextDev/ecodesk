"use client";

import React, { useState, useEffect } from "react";
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
}: {
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    placeholder?: string;
    description?: string;
    rows?: number;
    error?: string;
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
        { value: "Accounting", title: "Accounting", description: "Handle initial client contact for financial matters and updates." },
        { value: "Business Development", title: "Business Development", description: "Manage client outreach and relationship building activities." },
        { value: "E-Commerce", title: "E-Commerce", description: "Conduct follow-up calls to monitor progress and gather additional requirements." },
        { value: "Engineering", title: "Engineering", description: "Provide technical support and follow up on project developments." },
        { value: "Human Resources", title: "Human Resources", description: "Manage employee relations and follow-up on HR-related inquiries." },
        { value: "Marketing", title: "Marketing", description: "Follow up on campaigns and coordinate client feedback." },
        { value: "Procurement", title: "Procurement", description: "Oversee purchasing processes and supplier communications." },
        { value: "Sales", title: "Sales", description: "Follow up on sales opportunities and client requests." },
        { value: "Warehouse", title: "Warehouse & Logistics", description: "Coordinate logistics and inventory follow-ups." },
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

    const [loadingSave, setLoadingSave] = useState(false);
    const [loadingLoad, setLoadingLoad] = useState(false);

    // Key for Redis storage (can be adjusted)
    const redisKey = "ticketSheetData";

    // Function to load saved data from Redis
    const loadFromRedis = async () => {
        setLoadingLoad(true);
        try {
            const res = await fetch(`/api/redis-choice?key=${encodeURIComponent(redisKey)}`);
            if (!res.ok) throw new Error("Failed to load data");
            const { value } = await res.json();
            if (value) {
                const data = JSON.parse(value);
                // set all fields from saved data if present
                if (data.department) setDepartment(data.department);
                if (data.ticketReceived) setTicketReceived(data.ticketReceived);
                if (data.ticketEndorsed) setTicketEndorsed(data.ticketEndorsed);
                if (data.channel) setChannel(data.channel);
                if (data.wrapUp) setWrapUp(data.wrapUp);
                if (data.source) setSource(data.source);
                if (data.customerStatus) setCustomerStatus(data.customerStatus);
                if (data.customerType) setCustomerType(data.customerType);
                if (data.remarks) setRemarks(data.remarks);
                if (data.inquiry) setInquiry(data.inquiry);
                if (data.itemCode) setItemCode(data.itemCode);
                if (data.itemDescription) setItemDescription(data.itemDescription);
                if (data.poNumber) setPoNumber(data.poNumber);
                if (data.soDate) setSoDate(data.soDate);
                if (data.paymentTerms) setPaymentTerms(data.paymentTerms);
                if (data.poSource) setPoSource(data.poSource);
                if (data.paymentDate) setPaymentDate(data.paymentDate);
                if (data.deliveryDate) setDeliveryDate(data.deliveryDate);
                if (data.quotationNumber) setQuotationNumber(data.quotationNumber);
                if (data.quotationAmount) setQuotationAmount(data.quotationAmount);
                if (data.status) setStatus(data.status);
                if (data.soNumber) setSoNumber(data.soNumber);
                if (data.soAmount) setSoAmount(data.soAmount);
                if (data.qtySold) setQtySold(data.qtySold);
                if (data.manager) setManager(data.manager);
                if (data.agent) setAgent(data.agent);
            }
        } catch (e) {
            console.error("Load error:", e);
        } finally {
            setLoadingLoad(false);
        }
    };

    // Function to save data to Redis
    const saveToRedis = async () => {
        setLoadingSave(true);
        const dataToSave = {
            department,
            ticketReceived,
            ticketEndorsed,
            channel,
            wrapUp,
            source,
            customerStatus,
            customerType,
            remarks,
            inquiry,
            itemCode,
            itemDescription,
            poNumber,
            soDate,
            paymentTerms,
            poSource,
            paymentDate,
            deliveryDate,
            quotationNumber,
            quotationAmount,
            status,
            soNumber,
            soAmount,
            qtySold,
            manager,
            agent,
        };
        try {
            const res = await fetch("/api/redis-choice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    key: redisKey,
                    value: JSON.stringify(dataToSave),
                }),
            });
            if (!res.ok) throw new Error("Failed to save data");
        } catch (e) {
            console.error("Save error:", e);
        } finally {
            setLoadingSave(false);
        }
    };

    // Load data once on mount
    useEffect(() => {
        loadFromRedis();
    }, []);

    // Override handleUpdate to validate status before saving
    const onUpdate = async () => {
        if (!validateStep6()) return;
        setErrors({});
        await saveToRedis();
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
                    <h2 className="text-sm font-semibold mt-3">Step 2 — Department</h2>
                    <FieldGroup>
                        <Field>
                            <FieldContent>
                                <RadioGroup
                                    value={department}
                                    onValueChange={setDepartment}
                                >
                                    {departmentOptions.map((item) => (
                                        <FieldLabel key={item.value}>
                                            <Field orientation="horizontal" className="w-full items-start">
                                                <FieldContent className="flex-1">
                                                    <FieldTitle>{item.title}</FieldTitle>
                                                    <FieldDescription>{item.description}</FieldDescription>

                                                    {department === item.value && (
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
                            <Field>
                                <FieldLabel>Ticket Received</FieldLabel>
                                <FieldDescription>
                                    Date and time when the ticket was initially received or logged.
                                </FieldDescription>
                                <InputField
                                    type="datetime-local"
                                    value={ticketReceived}
                                    onChange={(e) => setTicketReceived(e.target.value)}
                                    error={errors.ticketReceived}
                                />
                            </Field>
                            <Field>
                                <FieldLabel>Ticket Endorsed</FieldLabel>
                                <FieldDescription>
                                    Date and time when the ticket was endorsed to the assigned department.
                                </FieldDescription>
                                <InputField
                                    type="datetime-local"
                                    value={ticketEndorsed}
                                    onChange={(e) => setTicketEndorsed(e.target.value)}
                                    error={errors.ticketEndorsed}
                                />
                            </Field>

                            <Field>
                                <FieldLabel>Channel</FieldLabel>
                                <FieldDescription>
                                    Platform or medium where the customer initially contacted the company.
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

                            <Field>
                                <FieldLabel>Wrap Up</FieldLabel>
                                <FieldDescription>
                                    Final classification describing the outcome or purpose of the interaction.
                                </FieldDescription>
                                <SelectField
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
                            </Field>
                            <Field>
                                <FieldLabel>Source</FieldLabel>
                                <FieldDescription>
                                    Origin or reference indicating how the lead or concern was generated.
                                </FieldDescription>
                                <SelectField
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
                            </Field>
                        </FieldSet>
                    </FieldGroup>
                    <Navigation />
                </>
            )}

            {step === 4 && (
                <>
                    {/* Customer Status */}
                    <h2 className="text-sm font-semibold mt-4">Step 4 — Customer Details</h2>
                    <RadioGroup
                        value={customerStatus}
                        onValueChange={setCustomerStatus}
                    >
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

                    {/* Customer Type */}
                    <RadioGroup
                        value={customerType}
                        onValueChange={setCustomerType}
                    >
                        {customerTypeOptions.map((item) => (
                            <FieldLabel key={item.value}>
                                <Field orientation="horizontal" className="w-full items-start">
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
                </>
            )}

            {step === 5 && (
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

                    {(remarks === "No Stocks / Insufficient Stocks" || remarks === "Item Not Carried" || remarks === "Non Standard Item") && (
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
                                <FieldDescription>Origin of the purchase order.</FieldDescription>
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
                                <FieldDescription>Date the product was delivered.</FieldDescription>
                                <InputField
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


            {step === 6 && (
                <>
                    <h2 className="text-sm font-semibold mt-4">Step 6 — Assignee</h2>
                    <Field>
                        <FieldLabel>Manager</FieldLabel>
                        <FieldDescription>Select the manager responsible for this task or client.</FieldDescription>
                        <Select
                            value={manager}
                            onValueChange={(value) => setManager(value)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a Manager" />
                            </SelectTrigger>
                            <SelectContent>
                                {department === "Accounting" ? (
                                    <SelectItem value="GM-NCR-435582">Grecylda Mamungay</SelectItem>
                                ) : department === "Business Development" ? (
                                    <SelectItem value="SH-NCR-420492">Sette Hosena</SelectItem>
                                ) : department === "Sales" ? (
                                    <>
                                        <SelectItem value="AS-NCR-146592">Albert Sabido</SelectItem>
                                        <SelectItem value="AB-NCR-288130">Angie Baldugo</SelectItem>
                                        <SelectItem value="BR-PH-358329">Betty Rodriguez</SelectItem>
                                        <SelectItem value="MM-PH-104083">Maricris Mercado</SelectItem>
                                        <SelectItem value="EY-NCR-396116">Edgar Yem</SelectItem>
                                        <SelectItem value="JA-NCR-727428">Jerry Abaluyan</SelectItem>
                                        <SelectItem value="JM-CBU-702043">Johnnel Malco</SelectItem>
                                        <SelectItem value="MF-PH-840897">Ma. riza Felizmena</SelectItem>
                                        <SelectItem value="MP-CDO-613398">Mark Pacis</SelectItem>
                                        <SelectItem value="RD-NCR-612038">Ronald Dela Cueva</SelectItem>
                                        <SelectItem value="RT-NCR-815758">Roy Tayuman</SelectItem>
                                        <SelectItem value="TT-PH-500404">TSM Test</SelectItem>
                                    </>
                                ) : department === "Engineering" ? (
                                    <SelectItem value="DC-NCR-355948">Dave Catausan</SelectItem>
                                ) : department === "Warehouse" ? (
                                    <>
                                        <SelectItem value="JV-NCR-186355">Jonathan Vinoya</SelectItem>
                                        <SelectItem value="JD-NCR-580537">Jonathan Joseph Dumaual</SelectItem>
                                    </>
                                ) : department === "Procurement" ? (
                                    <SelectItem value="LV-NCR-170007">Leizl Velado</SelectItem>
                                ) : (department === "Marketing" || department === "E-Commerce") ? (
                                    <SelectItem value="KG-PH-878400">Karlie Garcia</SelectItem>
                                ) : department === "Human Resources" ? (
                                    <SelectItem value="OM-NCR-696218">Olive Minano</SelectItem>
                                ) : (
                                    <SelectItem value="TT-PH-500404">
                                        No managers available
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </Field>

                    {wrapUp !== "Job Applicants" && (department === "Sales" || department === "Business Development") && (
                        <>
                            <Field>
                                <FieldLabel>Agent</FieldLabel>
                                <FieldDescription>Select the agent assigned to handle this ticket or inquiry.</FieldDescription>
                                <Select
                                    value={agent}
                                    onValueChange={(value) => setAgent(value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a Manager" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="AP-NCR-468624">Agnes Angeli, Panopio</SelectItem>
                                        <SelectItem value="AE-NCR-274606">Alvin, Estor</SelectItem>
                                        <SelectItem value="AP-NCR-362012">Alvin, Perez</SelectItem>
                                        <SelectItem value="AP-NCR-338109">Ansley, Patelo</SelectItem>
                                        <SelectItem value="BL-NCR-704414">Banjo, Lising</SelectItem>
                                        <SelectItem value="CN-NCR-915669">Candy, Notob</SelectItem>
                                        <SelectItem value="CG-CDO-771954">Che, Gumapac</SelectItem>
                                        <SelectItem value="CA-NCR-506100">Christopher, Acierto</SelectItem>
                                        <SelectItem value="CD-CBU-564558">Connie, Doroja</SelectItem>
                                        <SelectItem value="CB-NCR-578383">Cristy, Bobis</SelectItem>
                                        <SelectItem value="DD-DVO-211099">Dane Ariane, Delute</SelectItem>
                                        <SelectItem value="DD-NCR-462607">Dionisio, Doyugan</SelectItem>
                                        <SelectItem value="ES-PH-966693">Elaine, Soroan</SelectItem>
                                        <SelectItem value="EL-NCR-403385">Erwin Jr, Laude</SelectItem>
                                        <SelectItem value="FN-CBU-905953">Ferdy, Navarro</SelectItem>
                                        <SelectItem value="GR-NCR-401280">Gene Mark, Roxas</SelectItem>
                                        <SelectItem value="GA-NCR-330568">Gretchel Ann, Aquino</SelectItem>
                                        <SelectItem value="JJ-DVO-928920">Jayson, Jungaya</SelectItem>
                                        <SelectItem value="JD-NCR-953794">Jean, Dela Cerna</SelectItem>
                                        <SelectItem value="JL-NCR-577103">Jeffrey, Lacson</SelectItem>
                                        <SelectItem value="JP-DVO-561222">Jevan, Pinero</SelectItem>
                                        <SelectItem value="JP-NCR-321488">John Jeffrey, Puying</SelectItem>
                                        <SelectItem value="JC-NCR-245823">Jonna, Clarin</SelectItem>
                                        <SelectItem value="JC-NCR-635171">Josh, Candazo</SelectItem>
                                        <SelectItem value="JS-NCR-606082">Joy Merel, Soriente</SelectItem>
                                        <SelectItem value="JT-CBU-850172">Jude Francinni, Tan</SelectItem>
                                        <SelectItem value="KY-DVO-679025">Khay, Yango</SelectItem>
                                        <SelectItem value="KG-CDO-910641">Kurt Narrem, Guangco</SelectItem>
                                        <SelectItem value="LD-NCR-898785">Lotty, De Guzman</SelectItem>
                                        <SelectItem value="MM-NCR-642069">Maricar, Magdaong</SelectItem>
                                        <SelectItem value="MV-CBU-151813">Mark, Villagonzalo</SelectItem>
                                        <SelectItem value="MQ-NCR-618228">Michael, Quijano</SelectItem>
                                        <SelectItem value="NJ-DVO-543095">Neil Vincent, Jarabej</SelectItem>
                                        <SelectItem value="NM-DVO-812855">Norman, Maranga</SelectItem>
                                        <SelectItem value="RB-NCR-840445">Raymart, Binondo</SelectItem>
                                        <SelectItem value="RN-CDO-536745">Reggie, Nocete</SelectItem>
                                        <SelectItem value="RF-NCR-864625">Rialyn, Francisco</SelectItem>
                                        <SelectItem value="RI-NCR-820157">Rodelio, Ico</SelectItem>
                                        <SelectItem value="RA-CBU-225479">Rodelyn, Abrea</SelectItem>
                                        <SelectItem value="RM-NCR-462285">Rodney, Mendoza</SelectItem>
                                        <SelectItem value="RD-NCR-118744">Rodolfo Jr, Delizo</SelectItem>
                                        <SelectItem value="RB-NCR-968208">Roselyn, Barnes</SelectItem>
                                        <SelectItem value="RD-NCR-180410">Ruby, Del Rosario</SelectItem>
                                        <SelectItem value="SS-NCR-369807">Shane Rey, Santos</SelectItem>
                                        <SelectItem value="SN-NCR-514468">Shermaine, Navarro</SelectItem>
                                        <SelectItem value="SR-NCR-157258">Sherylin, Rapote</SelectItem>
                                        <SelectItem value="VP-CDO-581288">Venzross, Posadas</SelectItem>
                                        <SelectItem value="VO-NCR-765107">Vince, Ortiz</SelectItem>
                                        <SelectItem value="WA-NCR-532926">Wilnie, Ardeloso</SelectItem>
                                        <SelectItem value="JD-NCR-296929">Jennifer, Dela Cruz</SelectItem>
                                        <SelectItem value="RB-PH-765029">Rafael, Bayani</SelectItem>
                                        <SelectItem value="JG-NCR-920587">Test Leroux</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                        </>
                    )}

                    <Field>
                        <FieldLabel>Status</FieldLabel>
                        <RadioOptionsGroup
                            options={statusOptions}
                            value={status}
                            onChange={setStatus}
                            error={errors.status}
                        />
                    </Field>

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

                    <Button variant="outline" onClick={handleBack} disabled={loadingSave || loadingLoad}>Back</Button>
                    <Button onClick={onUpdate} disabled={loadingSave || loadingLoad}>
                        {loadingSave ? "Saving..." : "Save"}
                    </Button>
                </>
            )}
        </>
    );
}
