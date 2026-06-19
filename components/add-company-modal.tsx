"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import { toast } from "sonner";
import { ChevronsUpDown, Check, PlusIcon, MinusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function formatTinNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 12);
  const parts = [];
  for (let i = 0; i < digits.length; i += 3) {
    parts.push(digits.slice(i, i + 3));
  }
  return parts.join("-");
}

// PH mobile: locked "09" prefix, format 09XX-XXX-XXXX
function formatPhMobile(value: string) {
  let digits = value.replace(/\D/g, "");
  if (!digits.startsWith("09")) {
    digits = "09" + digits.replace(/^0+/, "");
  }
  digits = digits.slice(0, 11);
  const rest = digits.slice(2); // after "09"
  let out = "09";
  if (rest.length > 0) out += rest.slice(0, 2);
  if (rest.length > 2) out += "-" + rest.slice(2, 5);
  if (rest.length > 5) out += "-" + rest.slice(5, 9);
  return out;
}

// Intl / International / +1: +CC XXX XXX XXXX XXX
function formatIntlNumber(value: string, dialCode: string) {
  const code = dialCode.replace(/\D/g, "");
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith(code)) {
    digits = digits.slice(code.length);
  }
  digits = digits.slice(0, 13);
  const groups = [];
  let i = 0;
  const sizes = [3, 3, 4, 3];
  for (const size of sizes) {
    if (i >= digits.length) break;
    groups.push(digits.slice(i, i + size));
    i += size;
  }
  return `+${code}${groups.length ? " " + groups.join(" ") : ""}`;
}

// Landline: (0XX) XXXX-XXX
function formatLandlineNumber(value: string) {
  let digits = value.replace(/\D/g, "");
  if (!digits.startsWith("0")) {
    digits = "0" + digits;
  }
  digits = digits.slice(0, 10);
  const areaCode = digits.slice(0, 3); // includes leading 0
  const rest = digits.slice(3);
  let out = "";
  if (areaCode.length > 0) out += `(${areaCode}`;
  if (areaCode.length === 3) out += ")";
  if (rest.length > 0) out += " " + rest.slice(0, 4);
  if (rest.length > 4) out += "-" + rest.slice(4, 7);
  return out;
}

function formatByType(value: string, type: string) {
  switch (type) {
    case "+63":
      return formatPhMobile(value);
    case "+44":
      return formatLandlineNumber(value);
    case "+1":
    case "+86":
      return formatIntlNumber(value, type);
    case "+81":
    default:
      return value; // Custom — no formatting
  }
}

interface AddCompanyModalProps {
  referenceid: string;
  onCreated: () => Promise<void>;
}

// Email validation - reject placeholder/invalid emails
function isValidEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  
  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return false;
  
  // Reject placeholder/invalid emails
  const invalidPatterns = [
    /^none@/i,
    /^na@/i,
    /^n\/a@/i,
    /^test@/i,
    /^temp@/i,
    /^fake@/i,
    /^dummy@/i,
    /^placeholder@/i,
    /^example@/i,
    /^xxx@/i,
  ];
  
  if (invalidPatterns.some(pattern => pattern.test(trimmed))) return false;
  
  return true;
}

// Validate that array field doesn't contain special characters (commas and forward slashes)
function hasInvalidSpecialCharacters(value: string): boolean {
  return /[,/]/.test(value);
}

// Filter out special characters (commas and forward slashes) from input
function filterSpecialCharacters(value: string): string {
  return value.replace(/[,/]/g, '');
}

const REGION_OPTIONS = [
  "Ilocos Region",
  "Cagayan Valley",
  "Central Luzon",
  "CALABARZON",
  "Bicol Region",
  "Western Visayas",
  "Central Visayas",
  "Eastern Visayas",
  "Zamboanga Peninsula",
  "Northern Mindanao",
  "Davao Region",
  "SOCCSKSARGEN",
  "NCR",
  "CAR",
  "BARMM",
  "Region XIII - Caraga",
  "MIMAROPA Region",
];

const TYPE_CLIENT_OPTIONS = [
  "Top 50",
  "Next 30",
  "Balance 20",
  "TSA Client",
  "New Client",
];

const INDUSTRY_OPTIONS = [
  "Technology / Manufacturing / Telco / Data Center / Agriculture",
  "Healthcare / Education - Private",
  "Construction / Real Estate",
  "Energy / Mining",
  "Finance / Commercial / Hospitality / Retail",
  "Government / LGU - Retrofit",
  "Government / Infra",
  "Trading / Individual - Reseller / Dealer / Influencer / End User",
  "Distributorship",
  "Transportation"
];

// Generate account reference number
function generateAccountReferenceNumber(companyName: string, region: string): string {
  const companyPart = (companyName || "").trim().substring(0, 2).toUpperCase() || "XX";
  const regionPart = ((region || "").trim().toUpperCase().replace(/\s+/g, "")) || "UNKNOWN";
  const prefix = `${companyPart}-${regionPart}`;
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${randomSuffix}`;
}

interface FormData {
  company_name: string;
  tin_number: string;
  contact_person: string[];
  contact_number: string[];
  email_address: string[];
  address: string;
  delivery_address: string;
  region: string;
  industry: string;
  type_client: string;
  status: string;
  remarks: string;
}

export function AddCompanyModal({
  referenceid,
  onCreated,
}: AddCompanyModalProps) {
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<any>(null);
  const [proceedWithDuplicate, setProceedWithDuplicate] = useState(false);
  const [isCompleteDuplicate, setIsCompleteDuplicate] = useState(false);
  const [verificationChecked, setVerificationChecked] = useState(false);

const [formData, setFormData] = useState<FormData>({
    company_name: "",
    tin_number: "",
    contact_person: [""],
    contact_number: [""],
    email_address: [""],
    address: "",
    delivery_address: "",
    region: "",
    industry: "",
    type_client: "New Client",
    status: "For Approval",
    remarks: "",
  });

  // tracks the selected dropdown type per contact number row, parallel to formData.contact_number
  const [contactNumberTypes, setContactNumberTypes] = useState<string[]>(["+63"]);

  const handleContactNumberTypeChange = (index: number, type: string) => {
    setContactNumberTypes((prev) => {
      const next = [...prev];
      next[index] = type;
      return next;
    });
    // reformat the existing value to match the newly selected type
    setFormData((prev) => ({
      ...prev,
      contact_number: prev.contact_number.map((n, i) =>
        i === index ? formatByType(n, type) : n
      ),
    }));
  };

  const isFormValid = () => {
    // Required fields: company_name, contact_number, contact_person, email_address, industry, remarks
    const hasCompanyName = formData.company_name.trim() !== "";
    const hasContactNumber = formData.contact_number.some((n) => n.trim() !== "");
    const hasContactPerson = formData.contact_person.some((p) => p.trim() !== "");
    const hasValidEmail = formData.email_address.some((e) => {
      const trimmed = e.trim();
      return trimmed !== "" && isValidEmail(trimmed);
    });
    const hasIndustry = formData.industry.trim() !== "";
    const hasRemarks = formData.remarks.trim() !== "";
    
    // Check for invalid special characters (commas) in array fields
    const hasInvalidContactPerson = formData.contact_person.some((p) => p.trim() !== "" && hasInvalidSpecialCharacters(p));
    const hasInvalidContactNumber = formData.contact_number.some((n) => n.trim() !== "" && hasInvalidSpecialCharacters(n));
    const hasInvalidEmail = formData.email_address.some((e) => e.trim() !== "" && hasInvalidSpecialCharacters(e));
    
    return hasCompanyName && hasContactNumber && hasContactPerson && hasValidEmail && hasIndustry && hasRemarks && !hasInvalidContactPerson && !hasInvalidContactNumber && !hasInvalidEmail;
  };

  const handleAddContactPerson = () => {
    setFormData((prev) => ({
      ...prev,
      contact_person: [...prev.contact_person, ""],
    }));
  };

  const handleRemoveContactPerson = (index: number) => {
    if (formData.contact_person.length === 1) return;
    setFormData((prev) => ({
      ...prev,
      contact_person: prev.contact_person.filter((_, i) => i !== index),
    }));
  };

  const handleContactPersonChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      contact_person: prev.contact_person.map((p, i) =>
        i === index ? filterSpecialCharacters(value) : p
      ),
    }));
  };

  const handleAddContactNumber = () => {
    setFormData((prev) => ({
      ...prev,
      contact_number: [...prev.contact_number, ""],
    }));
    setContactNumberTypes((prev) => [...prev, "+63"]);
  };

  const handleRemoveContactNumber = (index: number) => {
    if (formData.contact_number.length === 1) return;
    setFormData((prev) => ({
      ...prev,
      contact_number: prev.contact_number.filter((_, i) => i !== index),
    }));
    setContactNumberTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContactNumberChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      contact_number: prev.contact_number.map((n, i) => (i === index ? filterSpecialCharacters(value) : n)),
    }));
  };

  const handleAddEmail = () => {
    setFormData((prev) => ({
      ...prev,
      email_address: [...prev.email_address, ""],
    }));
  };

  const handleRemoveEmail = (index: number) => {
    if (formData.email_address.length === 1) return;
    setFormData((prev) => ({
      ...prev,
      email_address: prev.email_address.filter((_, i) => i !== index),
    }));
  };

  const handleEmailChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      email_address: prev.email_address.map((e, i) =>
        i === index ? filterSpecialCharacters(value) : e
      ),
    }));
  };

  const handleVerify = async () => {
    if (!isFormValid()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate email addresses
    const invalidEmails = formData.email_address.filter(
      (e) => e.trim() !== "" && !isValidEmail(e.trim())
    );

    if (invalidEmails.length > 0) {
      toast.error(
        "Invalid email address(es). Please use valid email addresses."
      );
      return;
    }

    // Validate special characters (commas and forward slashes) in array fields
    const invalidContactPerson = formData.contact_person.filter((p) => p.trim() !== "" && hasInvalidSpecialCharacters(p));
    const invalidContactNumber = formData.contact_number.filter((n) => n.trim() !== "" && hasInvalidSpecialCharacters(n));
    const invalidEmailChars = formData.email_address.filter((e) => e.trim() !== "" && hasInvalidSpecialCharacters(e));

    if (invalidContactPerson.length > 0 || invalidContactNumber.length > 0 || invalidEmailChars.length > 0) {
      toast.error(
        "Special characters (commas and forward slashes) are not allowed in array fields. Please remove them."
      );
      return;
    }

    try {
      setSaving(true);
      const isDuplicate = await checkForCompleteDuplicate();
      setIsCompleteDuplicate(isDuplicate);
      setVerificationChecked(true);

      if (isDuplicate) {
        toast.error("❌ Complete Duplicate: This entry already exists in the system.");
      } else {
        toast.success("✅ Verification passed. You can now create the account.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error during verification");
    } finally {
      setSaving(false);
    }
  };

  // Check if current form data is a COMPLETE duplicate (all fields match exactly)
  const checkForCompleteDuplicate = async () => {
    try {
      const res = await fetch("/api/com-fetch-account", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (!res.ok) return false;

      const data = await res.json();
      const companies = data.data || [];

      const currentCompanyName = formData.company_name.trim().toUpperCase();
      const currentContactNumbers = formData.contact_number
        .filter((n) => n.trim() !== "")
        .map((n) => n.trim().toUpperCase())
        .sort();
      const currentContactPersons = formData.contact_person
        .filter((p) => p.trim() !== "")
        .map((p) => p.trim().toUpperCase())
        .sort();
      const currentEmails = formData.email_address
        .filter((e) => e.trim() !== "")
        .map((e) => e.trim().toUpperCase())
        .sort();

      // Find if there's a COMPLETE duplicate: exact match on all fields
      const completeDuplicate = companies.find((company: any) => {
        const companyName = (company.company_name || "").trim().toUpperCase();
        if (companyName !== currentCompanyName) return false;

        const existingNumbers = (company.contact_number || "")
          .split(/[,/]/)
          .map((n: string) => n.trim().toUpperCase())
          .sort();
        const existingPersons = (company.contact_person || "")
          .split(/[,/]/)
          .map((p: string) => p.trim().toUpperCase())
          .sort();
        const existingEmails = (company.email_address || "")
          .split(/[,/]/)
          .map((e: string) => e.trim().toUpperCase())
          .sort();

        // Check if arrays match exactly (same length, same values)
        const numbersMatch =
          currentContactNumbers.length === existingNumbers.length &&
          currentContactNumbers.every((num, idx) => num === existingNumbers[idx]);
        const personsMatch =
          currentContactPersons.length === existingPersons.length &&
          currentContactPersons.every((person, idx) => person === existingPersons[idx]);
        const emailsMatch =
          currentEmails.length === existingEmails.length &&
          currentEmails.every((email, idx) => email === existingEmails[idx]);

        // All three must match for a COMPLETE duplicate
        return numbersMatch && personsMatch && emailsMatch;
      });

      return !!completeDuplicate;
    } catch (err) {
      console.error("Error checking complete duplicates:", err);
      return false;
    }
  };

  const checkForDuplicates = async () => {
    try {
      const res = await fetch("/api/com-fetch-account", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (!res.ok) return null;

      const data = await res.json();
      const companies = data.data || [];

      const currentCompanyName = formData.company_name.trim().toUpperCase();
      const currentContactNumbers = formData.contact_number
        .filter((n) => n.trim() !== "")
        .map((n) => n.trim().toUpperCase());
      const currentContactPersons = formData.contact_person
        .filter((p) => p.trim() !== "")
        .map((p) => p.trim().toUpperCase());
      const currentEmails = formData.email_address
        .filter((e) => e.trim() !== "")
        .map((e) => e.trim().toUpperCase());

      // Find duplicates: same company name AND (same contact number OR contact person OR email)
      const duplicates = companies.filter((company: any) => {
        const companyName = (company.company_name || "").trim().toUpperCase();
        if (companyName !== currentCompanyName) return false;

        const existingNumbers = (company.contact_number || "")
          .split(/[,/]/)
          .map((n: string) => n.trim().toUpperCase());
        const existingPersons = (company.contact_person || "")
          .split(/[,/]/)
          .map((p: string) => p.trim().toUpperCase());
        const existingEmails = (company.email_address || "")
          .split(/[,/]/)
          .map((e: string) => e.trim().toUpperCase());

        // Check if any contact details match
        const numberMatch = currentContactNumbers.some((num) =>
          existingNumbers.some((existing: string) => existing === num)
        );
        const personMatch = currentContactPersons.some((person) =>
          existingPersons.some((existing: string) => existing === person)
        );
        const emailMatch = currentEmails.some((email) =>
          existingEmails.some((existing: string) => existing === email)
        );

        return numberMatch || personMatch || emailMatch;
      });

      return duplicates.length > 0 ? duplicates : null;
    } catch (err) {
      console.error("Error checking duplicates:", err);
      return null;
    }
  };

  const handleSave = async () => {
    if (saving) return;

    if (!isFormValid()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate email addresses
    const invalidEmails = formData.email_address.filter(
      (e) => e.trim() !== "" && !isValidEmail(e.trim())
    );

    if (invalidEmails.length > 0) {
      toast.error(
        "Invalid email address(es). Please use valid email addresses."
      );
      return;
    }

    // Validate special characters (commas and forward slashes) in array fields
    const invalidContactPerson = formData.contact_person.filter((p) => p.trim() !== "" && hasInvalidSpecialCharacters(p));
    const invalidContactNumber = formData.contact_number.filter((n) => n.trim() !== "" && hasInvalidSpecialCharacters(n));
    const invalidEmailChars = formData.email_address.filter((e) => e.trim() !== "" && hasInvalidSpecialCharacters(e));

    if (invalidContactPerson.length > 0 || invalidContactNumber.length > 0 || invalidEmailChars.length > 0) {
      toast.error(
        "Special characters (commas and forward slashes) are not allowed in array fields. Please remove them."
      );
      return;
    }

    try {
      setSaving(true);

      const accountRefNumber = generateAccountReferenceNumber(
        formData.company_name,
        formData.region
      );

      const cleanedData = {
        ...formData,
        contact_person: formData.contact_person
          .filter((p) => p.trim() !== "")
          .join(", "),
        contact_number: formData.contact_number
          .filter((n) => n.trim() !== "")
          .join(", "),
        email_address: formData.email_address
          .filter((e) => e.trim() !== "")
          .join(", "),
        referenceid,
        account_reference_number: accountRefNumber,
      };

      const res = await fetch("/api/com-save-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save company");
      }

      toast.success("Company saved successfully");
      setOpen(false);
      setShowDuplicateWarning(false);
      setProceedWithDuplicate(false);
      setIsCompleteDuplicate(false);
      setVerificationChecked(false);
      setFormData({
        company_name: "",
        tin_number: "",
        contact_person: [""],
        contact_number: [""],
        email_address: [""],
        address: "",
        delivery_address: "",
        region: "",
        industry: "",
        type_client: "New Client",
        status: "For Approval",
        remarks: "",
      });
      await onCreated();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to save company"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset verification state when closing modal
        setVerificationChecked(false);
        setIsCompleteDuplicate(false);
      }
    }}>
      <DialogTrigger asChild>
        <Button>Add Account</Button>
      </DialogTrigger>

      {/* Duplicate Warning Dialog */}
      <Dialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-yellow-700">⚠️ Similar Companies Found</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              A company with the same name and similar contact details already exists:
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3 max-h-[300px] overflow-y-auto">
              {duplicateInfo &&
                duplicateInfo.map((dup: any, idx: number) => (
                  <div key={idx} className="text-xs space-y-1 pb-3 border-b last:border-b-0">
                    <p className="font-semibold text-gray-800">
                      {dup.company_name}
                    </p>
                    {dup.contact_person && (
                      <p className="text-gray-600">
                        👤 {dup.contact_person}
                      </p>
                    )}
                    {dup.contact_number && (
                      <p className="text-gray-600">
                        📞 {dup.contact_number}
                      </p>
                    )}
                    {dup.email_address && (
                      <p className="text-gray-600">
                        ✉️ {dup.email_address}
                      </p>
                    )}
                  </div>
                ))}
            </div>

            <p className="text-sm text-gray-700">
              You can still create this account if the details are different. Do you want to proceed?
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowDuplicateWarning(false);
                setProceedWithDuplicate(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setProceedWithDuplicate(true);
                setShowDuplicateWarning(false);
                handleSave();
              }}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Proceed Anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Account</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="user-info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="user-info">User Information</TabsTrigger>
            <TabsTrigger value="address">Address</TabsTrigger>
            <TabsTrigger value="classification">Classification</TabsTrigger>
          </TabsList>

          {/* TAB 1: USER INFORMATION */}
          <TabsContent value="user-info" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Company Name *</Label>
                <Input
                  placeholder="Enter the official registered name of the company."
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company_name: e.target.value.toUpperCase(),
                    })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">
                  TIN Number{" "}
                  <span className="text-xs text-gray-500">(optional)</span>
                </Label>
                <Input
                  placeholder="Enter the Tax Identification Number (optional). Format: 000-000-000-000"
                  value={formData.tin_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tin_number: formatTinNumber(e.target.value),
                    })
                  }
                  maxLength={15}
                  className="mt-1"
                />

              </div>

              <div>
                <Label className="text-sm font-medium">
                  Contact Person(s) *
                </Label>
                <div className="space-y-2 mt-1">
                  {formData.contact_person.map((person, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        placeholder="Enter the full name(s) of the primary contact person(s)."
                        value={person}
                        onChange={(e) =>
                          handleContactPersonChange(idx, e.target.value)
                        }
                        className={cn(
                          "flex-1",
                          person.trim() !== "" && hasInvalidSpecialCharacters(person)
                            ? "border-red-500 bg-red-50"
                            : ""
                        )}
                      />
                      {formData.contact_person.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveContactPerson(idx)}
                        >
                          <MinusIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddContactPerson}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Contact Person
                  </Button>
                  {formData.contact_person.some(
                    (p) => p.trim() !== "" && hasInvalidSpecialCharacters(p)
                  ) && (
                    <p className="text-xs text-red-600">
                      Special characters (commas and forward slashes) are not allowed.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Contact Number(s) *
                </Label>
                <div className="space-y-2 mt-1">
                  {formData.contact_number.map((number, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Select
                        value={contactNumberTypes[idx] || "+63"}
                        onValueChange={(value) =>
                          handleContactNumberTypeChange(idx, value)
                        }
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+63">PH (mobile)</SelectItem>
                          <SelectItem value="+1">🇺🇸 +1</SelectItem>
                          <SelectItem value="+44">Landline</SelectItem>
                          <SelectItem value="+86">International</SelectItem>
                          <SelectItem value="+81">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                        <Input
                          placeholder={
                            contactNumberTypes[idx] === "+44"
                              ? "(0XX) XXXX-XXX"
                              : contactNumberTypes[idx] === "+81"
                              ? "Enter any value"
                              : contactNumberTypes[idx] === "+1" ||
                                contactNumberTypes[idx] === "+86"
                              ? "+CC XXX XXX XXXX XXX"
                              : "09XX-XXX-XXXX"
                          }
                          value={number}
                          onChange={(e) =>
                            handleContactNumberChange(
                              idx,
                              formatByType(
                                e.target.value,
                                contactNumberTypes[idx] || "+63"
                              )
                            )
                          }
                          maxLength={
                            contactNumberTypes[idx] === "+81"
                              ? undefined
                              : 20
                          }
                          className={cn(
                            "flex-1",
                            number.trim() !== "" && hasInvalidSpecialCharacters(number)
                              ? "border-red-500 bg-red-50"
                              : ""
                          )}
                        />
                      {formData.contact_number.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveContactNumber(idx)}
                        >
                          <MinusIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddContactNumber}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Contact Number
                  </Button>
                  {formData.contact_number.some(
                    (n) => n.trim() !== "" && hasInvalidSpecialCharacters(n)
                  ) && (
                    <p className="text-xs text-red-600">
                      Special characters (commas and forward slashes) are not allowed.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Email Address(es) *
                </Label>
                <div className="space-y-2 mt-1">
                  {formData.email_address.map((email, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="Email Address (valid email required)"
                        value={email}
                        onChange={(e) => handleEmailChange(idx, e.target.value)}
                        className={cn(
                          "flex-1",
                          email.trim() !== "" && (!isValidEmail(email.trim()) || hasInvalidSpecialCharacters(email))
                            ? "border-red-500 bg-red-50"
                            : ""
                        )}
                      />
                      {formData.email_address.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveEmail(idx)}
                        >
                          <MinusIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddEmail}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Email
                  </Button>
                  {formData.email_address.some(
                    (e) => e.trim() !== "" && !isValidEmail(e.trim())
                  ) && (
                    <p className="text-xs text-red-600">
                      Invalid email address. Placeholder emails (none@, na@, test@, etc.) are not accepted.
                    </p>
                  )}
                  {formData.email_address.some(
                    (e) => e.trim() !== "" && hasInvalidSpecialCharacters(e)
                  ) && (
                    <p className="text-xs text-red-600">
                      Special characters (commas and forward slashes) are not allowed.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: ADDRESS */}
          <TabsContent value="address" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">
                  Region <span className="text-xs text-gray-500">(optional)</span>
                </Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) =>
                    setFormData({ ...formData, region: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select the region for the company address." />
                  </SelectTrigger>
                  <SelectContent>
                    {REGION_OPTIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Address <span className="text-xs text-gray-500">(optional)</span>
                </Label>
                <Input
                  placeholder="Enter the complete physical address of the company."
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Delivery Address <span className="text-xs text-gray-500">(optional)</span>
                </Label>
                <Input
                  placeholder="Provide the full address where goods/services should be delivered."
                  value={formData.delivery_address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      delivery_address: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: CLASSIFICATION */}
          <TabsContent value="classification" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">
                  Type of Client <span className="text-xs text-gray-500">(optional)</span>
                </Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {TYPE_CLIENT_OPTIONS.map((type) => (
                    <label
                      key={type}
                      className={`p-3 border rounded-md cursor-pointer transition ${
                        formData.type_client === type
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="type_client"
                        value={type}
                        checked={formData.type_client === type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            type_client: e.target.value,
                          })
                        }
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">{type}</span>
                      <p className="text-xs text-gray-500 mt-1">
                        {type === "Top 50" &&
                          "Top 50 key accounts with highest revenue potential."}
                        {type === "Next 30" &&
                          "Next tier of 30 accounts for growth development."}
                        {type === "Balance 20" &&
                          "Remaining 20 accounts in the portfolio."}
                        {type === "TSA Client" &&
                          "Account managed directly by a Territory Sales Associate."}
                        {type === "New Client" &&
                          "Client is new and receiving assistance for the first time."}
                      </p>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Type of Industry <span className="text-xs text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between mt-1",
                        !formData.industry && "border-red-300 bg-red-50"
                      )}
                    >
                      {formData.industry || "Select industry"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search industry..." />
                      <CommandList className="max-h-[240px] overflow-y-auto">
                        <CommandEmpty>No industry found</CommandEmpty>
                        {INDUSTRY_OPTIONS.map((industry) => (
                          <CommandItem
                            key={industry}
                            value={industry}
                            onSelect={() =>
                              setFormData({
                                ...formData,
                                industry,
                              })
                            }
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.industry === industry
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {industry}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {!formData.industry && (
                  <p className="text-xs text-red-600 mt-1">Industry is required.</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm font-medium text-yellow-800">
                    🔔 For Approval
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    New accounts are automatically set to "For Approval" and must
                    be validated by an admin before activation.
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Reason / Remarks *
                </Label>
                <textarea
                  placeholder="Provide the reason for creating this account. This is required."
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData({ ...formData, remarks: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {!formData.remarks && (
                  <p className="text-xs text-red-600 mt-1">Reason is required.</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          
          {!verificationChecked ? (
            <Button
              onClick={handleVerify}
              disabled={!isFormValid() || saving}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {saving ? "Verifying..." : "Verify"}
            </Button>
          ) : isCompleteDuplicate ? (
            <>
              <Button
                onClick={handleVerify}
                disabled={saving}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {saving ? "Verifying..." : "Verify Again"}
              </Button>
              <div className="flex items-center gap-2 text-red-600 text-sm font-medium px-4 py-2 bg-red-50 border border-red-200 rounded-md">
                <span>❌ Complete Duplicate - Cannot Create</span>
              </div>
            </>
          ) : (
            <>
              <Button
                onClick={handleVerify}
                disabled={saving}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {saving ? "Verifying..." : "Verify Again"}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? "Creating..." : "Create Account"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
