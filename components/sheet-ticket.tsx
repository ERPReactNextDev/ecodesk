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
import { CheckCircle2Icon } from "lucide-react";

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
    loading: boolean;
    handleBack: () => void;
    handleNext: () => void;
    handleUpdate: () => void;
}


const MANAGER_AGENT_MAP: Record<string, string[]> = {
  "AB-NCR-288130": [
    "JP-NCR-321488", // Jeff Puying
    "VO-NCR-765107", // Vince Ortiz
    "JC-NCR-635171", // Josh Candazo
    "WA-NCR-532926", // Wilnie Ardeloso
    "AP-NCR-338109", // Ansley Patelo
    "CB-NCR-578383", // Cristy Bobis
    "SR-NCR-157258", // Sherylin Rapote
    "MQ-NCR-618228", // Michael Quijano
    "CN-NCR-915669", // Candy Notob
    "EL-NCR-403385", // Erwin Laude
  ],

  "RD-NCR-612038": [
    "CA-NCR-506100", // Christopher Acierto
  ],

  "JA-NCR-727428": [
    "AP-NCR-468624", // Agnes Angeli Panopio
    "RB-NCR-968208", // Roselyn Barnes
  ],

  "RT-NCR-815758": [
    "JL-NCR-577103", // Jeffrey Lacson
    "LD-NCR-898785", // Lotty De Guzman
    "RI-NCR-820157", // Rodelio Ico
    "RF-NCR-864625", // Rialyn Francisco
    "AP-NCR-362012", // Alvin Perez
    "RD-NCR-118744", // Rodolfo Delizo
    "RD-NCR-180410", // Ruby Del Rosario
    "GR-NCR-401280", // Gene Mark Roxas
    "DD-NCR-462607", // Dionisio Doyugan
    "GA-NCR-330568", // Gretchel Aquino
  ],

  "AS-NCR-146592": [
    "MV-CBU-151813", // Mark Villagonzalo
    "CD-CBU-564558", // Connie Doroja
    "RA-CBU-225479", // Rodelyn Abrea
  ],

  "JM-CBU-702043": [
    "KY-DVO-679025", // Khay Marie Yango
    "NM-DVO-812855", // Norman Maranga
    "NJ-DVO-543095", // Neil Vincent Jarabej
  ],

  "MP-CDO-613398": [
    "KG-CDO-910641", // Kurt Guangco
    "VP-CDO-581288", // Venzross Posadas
    "CG-CDO-771954", // Che Gumapac
  ],

  "MF-PH-840897": [
    "JD-NCR-953794", // Jean Dela Cerna
    "JS-NCR-606082", // Joy Merel Soriente
    "RM-NCR-462285", // Rodney Mendoza
    "RB-NCR-840445", // Raymart Binondo
    "BL-NCR-704414", // Banjo Lising
    "JC-NCR-245823", // Jonna Clarin
    "AE-NCR-274606", // Alvin Estor
  ],

  "SH-NCR-420492": [
    "RB-PH-765029", // Rafael Bayani
    "JD-NCR-296929", // Jennifer Dela Cruz
    "ES-PH-966693", // Elaine Soroan
  ],

  "KG-PH-878400": [
    // ⚠️ NOT IN YOUR LIST YET
    // Add only when confirmed IDs exist
  ],

    "TT-PH-500404": [
    "AE-NCR-555756"
    ],
};

const AGENTS = [
  { id: "AP-NCR-468624", name: "Agnes Angeli, Panopio" },
  { id: "AE-NCR-274606", name: "Alvin, Estor" },
  { id: "AP-NCR-362012", name: "Alvin, Perez" },
  { id: "AP-NCR-338109", name: "Ansley, Patelo" },
  { id: "BL-NCR-704414", name: "Banjo, Lising" },
  { id: "CN-NCR-915669", name: "Candy, Notob" },
  { id: "CG-CDO-771954", name: "Che, Gumapac" },
  { id: "CA-NCR-506100", name: "Christopher, Acierto" },
  { id: "CD-CBU-564558", name: "Connie, Doroja" },
  { id: "CB-NCR-578383", name: "Cristy, Bobis" },
  { id: "DD-DVO-211099", name: "Dane Ariane, Delute" },
  { id: "DD-NCR-462607", name: "Dionisio, Doyugan" },
  { id: "ES-PH-966693", name: "Elaine, Soroan" },
  { id: "EL-NCR-403385", name: "Erwin Jr, Laude" },
  { id: "FN-CBU-905953", name: "Ferdy, Navarro" },
  { id: "GR-NCR-401280", name: "Gene Mark, Roxas" },
  { id: "GA-NCR-330568", name: "Gretchel Ann, Aquino" },
  { id: "JJ-DVO-928920", name: "Jayson, Jungaya" },
  { id: "JD-NCR-953794", name: "Jean, Dela Cerna" },
  { id: "JL-NCR-577103", name: "Jeffrey, Lacson" },
  { id: "JP-DVO-561222", name: "Jevan, Pinero" },
  { id: "JP-NCR-321488", name: "John Jeffrey, Puying" },
  { id: "JC-NCR-245823", name: "Jonna, Clarin" },
  { id: "JC-NCR-635171", name: "Josh, Candazo" },
  { id: "JS-NCR-606082", name: "Joy Merel, Soriente" },
  { id: "JT-CBU-850172", name: "Jude Francinni, Tan" },
  { id: "KY-DVO-679025", name: "Khay, Yango" },
  { id: "KG-CDO-910641", name: "Kurt Narrem, Guangco" },
  { id: "LD-NCR-898785", name: "Lotty, De Guzman" },
  { id: "MM-NCR-642069", name: "Maricar, Magdaong" },
  { id: "MV-CBU-151813", name: "Mark, Villagonzalo" },
  { id: "MQ-NCR-618228", name: "Michael, Quijano" },
  { id: "NJ-DVO-543095", name: "Neil Vincent, Jarabej" },
  { id: "NM-DVO-812855", name: "Norman, Maranga" },
  { id: "RB-NCR-840445", name: "Raymart, Binondo" },
  { id: "RN-CDO-536745", name: "Reggie, Nocete" },
  { id: "RF-NCR-864625", name: "Rialyn, Francisco" },
  { id: "RI-NCR-820157", name: "Rodelio, Ico" },
  { id: "RA-CBU-225479", name: "Rodelyn, Abrea" },
  { id: "RM-NCR-462285", name: "Rodney, Mendoza" },
  { id: "RD-NCR-118744", name: "Rodolfo Jr, Delizo" },
  { id: "RB-NCR-968208", name: "Roselyn, Barnes" },
  { id: "RD-NCR-180410", name: "Ruby, Del Rosario" },
  { id: "SS-NCR-369807", name: "Shane Rey, Santos" },
  { id: "SN-NCR-514468", name: "Shermaine, Navarro" },
  { id: "SR-NCR-157258", name: "Sherylin, Rapote" },
  { id: "VP-CDO-581288", name: "Venzross, Posadas" },
  { id: "VO-NCR-765107", name: "Vince, Ortiz" },
  { id: "WA-NCR-532926", name: "Wilnie, Ardeloso" },
  { id: "JD-NCR-296929", name: "Jennifer, Dela Cruz" },
  { id: "RB-PH-765029", name: "Rafael, Bayani" },
  { id: "JG-NCR-920587", name: "Test Leroux" },
  { id: "AE-NCR-555756", name: "Test Agent" }
];


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
        handleBack,
        handleNext,
        handleUpdate
        
    } = props;

    const [loadingActivities, setLoadingActivities] = useState(false);
    const [errorActivities, setErrorActivities] = useState(null);
    const [activities, setActivities] = useState<Activity[]>([]);

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

// 2️⃣ TSA Acknowledge vs TSA Handling validation
useEffect(() => {
  if (!tsaAcknowledgeDate || !tsaHandlingTime) {
    setTsaTimeError(null);
    return;
  }

  const ack = new Date(tsaAcknowledgeDate);
  const handle = new Date(tsaHandlingTime);

  if (!isNaN(ack.getTime()) && !isNaN(handle.getTime())) {
    if (handle < ack) {
      setTsaTimeError("TSA Handling Time cannot be earlier than TSA Acknowledgement Date.");
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
        (act) => act.ticket_reference_number === ticketReferenceNumber
    );

    const soNumberFromActivity =
        groupedActivities.find((act) => act.so_number)?.so_number ?? "N/A";

    const soAmountFromActivity =
        groupedActivities.find((act) => act.so_amount)?.so_amount ?? "N/A";

    const productQuantityFromActivity =
        groupedActivities.find((act) => act.product_quantity)?.product_quantity ?? "N/A";

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
    }>({});

    const [timeError, setTimeError] = useState<string | null>(null);
    const [tsaTimeError, setTsaTimeError] = useState<string | null>(null);


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

    const validateStep6 = () => {
    const newErrors: typeof errors = {};

    if (!status) {
        newErrors.status = "Status is required.";
    }

    if (status === "Closed") {
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
    }

    if (step === 6) {
        if (tsaTimeError) return;   // 🔥 BLOCK if TSA time invalid
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
        handleUpdate();
    };

    // Helper: common buttons with validation on Next
const Navigation = () => (
  <div className="flex justify-between mt-4">
    <Button variant="outline" onClick={handleBack} className="cursor-pointer">
      Back
    </Button>

    <Button
      onClick={onNext}
      className="cursor-pointer"
      disabled={
        (step === 3 && !!timeError) ||
        (step === 3 && !!tsaTimeError) // 🔥 TSA validation blocks Next in Step 3
      }
    >
      Next
    </Button>
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
                                                            <Button onClick={onNext} className="cursor-pointer">Next</Button>
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
                            <FieldLabel>Date Created</FieldLabel>
                            <FieldDescription>
                                Manually set the original date and time this ticket was created.
                            </FieldDescription>
                            <InputField
                                type="datetime-local"
                                value={dateCreated}
                                onChange={(e) => setDateCreated(e.target.value)}
                            />
                            </Field>
                            <Field>
                                <FieldLabel>Ticket Received</FieldLabel>
                                <FieldDescription>
                                    Date and time when the ticket was initially received or logged.
                                </FieldDescription>
                                    <InputField
                                        type="datetime-local"
                                        value={ticketReceived}
                                        onChange={(e) => setTicketReceived(e.target.value)}
                                        error={errors.ticketReceived || timeError || undefined}
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
                                        error={errors.ticketEndorsed || timeError || undefined}
                                    />

                            </Field>

                            <Field>
                                <FieldLabel>Gender</FieldLabel>
                                <FieldDescription>
                                    Select the customer's gender for segmentation and analysis purposes.
                                </FieldDescription>
                                <SelectField
                                    value={gender}
                                    onChange={setGender}
                                    placeholder="Select a gender"
                                    options={[
                                        { value: "Male", label: "Male" },
                                        { value: "Female", label: "Female" },
                                    ]}
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
                                {/* SHOW SOURCE ONLY FOR CERTAIN CHANNELS */}
                                {["Viber", "Text Message", "Website", "Voice Call", "Whatsapp"].includes(channel) && (
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
                                        { value: "LNB", label: "LNB" },
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
                                )}
                                    <Field>
                                    <FieldLabel>TSM Acknowledgement Date</FieldLabel>
                                    <InputField
                                        type="datetime-local"
                                        value={tsmAcknowledgeDate}
                                        onChange={(e) => setTsmAcknowledgeDate(e.target.value)}
                                    />
                                    </Field>

                                    <Field>
                                    <FieldLabel>TSM Handling Time</FieldLabel>
                                    <InputField
                                        type="datetime-local"
                                        value={tsmHandlingTime}
                                        onChange={(e) => setTsmHandlingTime(e.target.value)}
                                    />
                                    </Field>

                                    <Field>
                                    <FieldLabel>TSA Acknowledgement Date</FieldLabel>
                                    <InputField
                                        type="datetime-local"
                                        value={tsaAcknowledgeDate}
                                        onChange={(e) => setTsaAcknowledgeDate(e.target.value)}
                                    />
                                    </Field>

                                    <Field>
                                    <FieldLabel>TSA Handling Time</FieldLabel>
                                    <InputField
                                        type="datetime-local"
                                        value={tsaHandlingTime}
                                        onChange={(e) => setTsaHandlingTime(e.target.value)}
                                        error={tsaTimeError || undefined}
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

{wrapUp !== "Job Applicants" &&
  (department === "Sales" || department === "Business Development") && (
    <>
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
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an Agent" />
          </SelectTrigger>

          <SelectContent>
            {(MANAGER_AGENT_MAP[manager] || []).length === 0 && (
              <SelectItem value="__none__" disabled>
                No agents available
              </SelectItem>
            )}

            {(MANAGER_AGENT_MAP[manager] || []).map((agentId) => {
              const agentItem = AGENTS.find((a) => a.id === agentId);
              if (!agentItem) return null;

              return (
                <SelectItem key={agentItem.id} value={agentItem.id}>
                  {agentItem.name}
                </SelectItem>
              );
            })}
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

                            {status === "Closed" && (
                            <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 space-y-4">
                                <h4 className="font-semibold text-sm text-red-700">
                                On Closing of Ticket (Required)
                                </h4>

                                {/* 1. CLOSE REASON (DROPDOWN) */}
                                <Field>
                                <FieldLabel>1. Close Reason *</FieldLabel>
                                <select
                                    value={closeReason}
                                    onChange={(e) => setCloseReason(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2 text-sm"
                                >
                                    <option value="">Select a reason</option>
                                    <option value="Same Specs Provided">Same Specs Provided</option>
                                    <option value="Counter Offer">Counter Offer</option>
                                    <option value="Out of Stock">Out of Stock</option>
                                    <option value="Client Declined">Client Declined</option>
                                    <option value="Not Interested">Not Interested</option>
                                    <option value="Others">Others</option>
                                </select>
                                </Field>

                                {/* 2 & 3 — ONLY IF NOT "SAME SPECS PROVIDED" */}
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

                    {status === "Converted into Sales" && (
                        <>
                            {ticketReferenceNumber &&
                                groupedActivities.length > 0 &&
                                (soNumberFromActivity !== "N/A" || soAmountFromActivity !== "N/A") && (
                                    <Alert variant="default" className="relative mt-4 bg-green-100">
                                        <CheckCircle2Icon className="h-4 w-4" />

                                        <AlertTitle>Ticket Reference Number</AlertTitle>

                                        <AlertDescription className="relative space-y-1 text-black">
                                            <p>
                                                <strong>{ticketReferenceNumber}</strong>
                                            </p>

                                            <p className="text-sm text-black">
                                                The Sales Order details below are automatically retrieved from the
                                                <strong> Taskflow System</strong> based on the Ticket Reference Number
                                                provided to the assigned agent.
                                            </p>

                                            {soNumberFromActivity !== "N/A" && (
                                                <p className="uppercase">
                                                    SO Number: <strong>{soNumberFromActivity}</strong>
                                                </p>
                                            )}

                                            {soAmountFromActivity !== "N/A" && (
                                                <p className="uppercase">
                                                    SO Amount: <strong>{soAmountFromActivity}</strong>
                                                </p>
                                            )}

                                            {productQuantityFromActivity !== "N/A" && (
                                                <p className="uppercase">
                                                    QTY Sold: <strong>{productQuantityFromActivity}</strong>
                                                </p>
                                            )}

                                            {/* BUTTON — bottom right */}
                                            <div className="absolute bottom-0 right-0">
                                                <Button size="sm" onClick={handleApplySO} className="cursor-pointer">
                                                    Apply
                                                </Button>
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                )}

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

                    <Button variant="outline" onClick={handleBack} disabled={loadingSave || loadingLoad} className="cursor-pointer">Back</Button>
                        <Button
                        onClick={onUpdate}
                        disabled={loadingSave || loadingLoad || !!timeError || !!tsaTimeError}
                        className="cursor-pointer"
                        >

                        {loadingSave ? "Saving..." : "Save"}
                        </Button>
                </>
            )}
        </>
    );
}
