"use client";

import React, { useState, useEffect } from "react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

function formatPhMobile(value: string) {
  let digits = value.replace(/\D/g, "");
  if (!digits.startsWith("09")) {
    digits = "09" + digits.replace(/^0+/, "");
  }
  digits = digits.slice(0, 11);
  const rest = digits.slice(2);
  let out = "09";
  if (rest.length > 0) out += rest.slice(0, 2);
  if (rest.length > 2) out += "-" + rest.slice(2, 5);
  if (rest.length > 5) out += "-" + rest.slice(5, 9);
  return out;
}

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

function formatLandlineNumber(value: string) {
  let digits = value.replace(/\D/g, "");
  if (!digits.startsWith("0")) {
    digits = "0" + digits;
  }
  digits = digits.slice(0, 10);
  const areaCode = digits.slice(0, 3);
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
      return value;
  }
}

function isValidEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return false;

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

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: any | null;
  onSave: (updated: any) => void;
}

interface FormData {
  company_name: string;
  contact_person: string[];
  contact_number: string[];
  email_address: string[];
  address: string;
  industry: string;
}

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

export const CustomerDatabaseEditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  account,
  onSave,
}) => {
  const [loading, setLoading] = useState(false);
  const [verificationChecked, setVerificationChecked] = useState(false);
  const [isCompleteDuplicate, setIsCompleteDuplicate] = useState(false);
  const [contactNumberTypes, setContactNumberTypes] = useState<string[]>(["+63"]);

  const [formData, setFormData] = useState<FormData>({
    company_name: "",
    contact_person: [""],
    contact_number: [""],
    email_address: [""],
    address: "",
    industry: "",
  });

  useEffect(() => {
    if (account && isOpen) {
      const contactPersons = account.contact_person
        ? account.contact_person.split(", ").filter(Boolean)
        : [""];

      const contactNumbers = account.contact_number && account.contact_number !== "none"
        ? account.contact_number.split(", ").filter(Boolean)
        : [""];

      const emails = account.email_address
        ? account.email_address.split(", ").filter(Boolean)
        : [""];

      setFormData({
        company_name: account.company_name ?? "",
        contact_person: contactPersons,
        contact_number: contactNumbers,
        email_address: emails,
        address: account.address ?? "",
        industry: account.industry ?? "",
      });

      setContactNumberTypes(new Array(contactNumbers.length).fill("+63"));
      setVerificationChecked(false);
      setIsCompleteDuplicate(false);
    }
  }, [account, isOpen]);

  const isFormValid = () => {
    const hasCompanyName = formData.company_name.trim() !== "";
    const hasContactNumber = formData.contact_number.some((n) => n.trim() !== "");
    const hasContactPerson = formData.contact_person.some((p) => p.trim() !== "");
    const hasValidEmail = formData.email_address.some((e) => {
      const trimmed = e.trim();
      return trimmed !== "" && isValidEmail(trimmed);
    });
    const hasIndustry = formData.industry.trim() !== "";

    return hasCompanyName && hasContactNumber && hasContactPerson && hasValidEmail && hasIndustry;
  };

  const handleContactNumberTypeChange = (index: number, type: string) => {
    setContactNumberTypes((prev) => {
      const next = [...prev];
      next[index] = type;
      return next;
    });
    setFormData((prev) => ({
      ...prev,
      contact_number: prev.contact_number.map((n, i) =>
        i === index ? formatByType(n, type) : n
      ),
    }));
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
        i === index ? value : p
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
      contact_number: prev.contact_number.map((n, i) => (i === index ? value : n)),
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
        i === index ? value : e
      ),
    }));
  };

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

      const completeDuplicate = companies.find((company: any) => {
        if (account?.id && company.id === account.id) return false;

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

        const numbersMatch =
          currentContactNumbers.length === existingNumbers.length &&
          currentContactNumbers.every((num, idx) => num === existingNumbers[idx]);
        const personsMatch =
          currentContactPersons.length === existingPersons.length &&
          currentContactPersons.every((person, idx) => person === existingPersons[idx]);
        const emailsMatch =
          currentEmails.length === existingEmails.length &&
          currentEmails.every((email, idx) => email === existingEmails[idx]);

        return numbersMatch && personsMatch && emailsMatch;
      });

      return !!completeDuplicate;
    } catch (err) {
      console.error("Error checking complete duplicates:", err);
      return false;
    }
  };

  const handleVerify = async () => {
    if (!isFormValid()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const invalidEmails = formData.email_address.filter(
      (e) => e.trim() !== "" && !isValidEmail(e.trim())
    );

    if (invalidEmails.length > 0) {
      toast.error("Invalid email address(es). Please use valid email addresses.");
      return;
    }

    try {
      setLoading(true);
      const isDuplicate = await checkForCompleteDuplicate();
      setIsCompleteDuplicate(isDuplicate);
      setVerificationChecked(true);

      if (isDuplicate) {
        toast.error("❌ Complete Duplicate: This entry already exists in the system.");
      } else {
        toast.success("✅ Verification passed. You can now update the account.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error during verification");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!account?.id) return;
    if (loading) return;

    try {
      setLoading(true);

      const joinedPersons = formData.contact_person
        .map((p) => p.trim())
        .filter(Boolean)
        .join(", ");

      const joinedNumbers = formData.contact_number
        .map((n) => n.trim())
        .filter(Boolean)
        .join(", ");

      const joinedEmails = formData.email_address
        .map((e) => e.trim())
        .filter(Boolean)
        .join(", ");

      const res = await fetch("/api/com-edit-account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: account.id,
          referenceid: account.referenceid,
          company_name: formData.company_name,
          contact_person: joinedPersons,
          contact_number: joinedNumbers,
          email_address: joinedEmails,
          address: formData.address,
          industry: formData.industry,
          type_client: account.type_client,
          status: account.status,
          company_group: account.company_group,
          date_updated: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success("Account successfully updated");
      onSave(data.data);
      setVerificationChecked(false);
      setIsCompleteDuplicate(false);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !account) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(newOpen) => {
      if (!newOpen && !loading) {
        setVerificationChecked(false);
        setIsCompleteDuplicate(false);
        onClose();
      }
    }}>
      <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b sticky top-0 bg-white z-10">
          <SheetTitle className="text-lg font-semibold">
            Edit Account
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
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
                disabled={loading}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Contact Person(s) *</Label>
              <div className="space-y-2 mt-1">
                {formData.contact_person.map((person, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      placeholder="Enter the full name of the contact person."
                      value={person}
                      onChange={(e) =>
                        handleContactPersonChange(idx, e.target.value)
                      }
                      className="flex-1"
                      disabled={loading}
                    />
                    {formData.contact_person.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveContactPerson(idx)}
                        disabled={loading}
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
                  disabled={loading}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Contact Person
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Contact Number(s) *</Label>
              <div className="space-y-2 mt-1">
                {formData.contact_number.map((number, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Select
                      value={contactNumberTypes[idx] || "+63"}
                      onValueChange={(value) =>
                        handleContactNumberTypeChange(idx, value)
                      }
                      disabled={loading}
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
                      className="flex-1"
                      disabled={loading}
                    />
                    {formData.contact_number.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveContactNumber(idx)}
                        disabled={loading}
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
                  disabled={loading}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Contact Number
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Email Address(es) *</Label>
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
                        email.trim() !== "" && !isValidEmail(email.trim())
                          ? "border-red-500 bg-red-50"
                          : ""
                      )}
                      disabled={loading}
                    />
                    {formData.email_address.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveEmail(idx)}
                        disabled={loading}
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
                  disabled={loading}
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
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Address *</Label>
              <Input
                placeholder="Enter the complete physical address."
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="mt-1"
                disabled={loading}
              />
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
                    disabled={loading}
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
          </div>
        </div>

        <div className="border-t bg-white px-6 py-4 flex gap-2 sticky bottom-0">
          <Button
            variant="outline"
            onClick={() => {
              if (!loading) {
                setVerificationChecked(false);
                setIsCompleteDuplicate(false);
                onClose();
              }
            }}
            disabled={loading}
          >
            Cancel
          </Button>

          {!verificationChecked ? (
            <Button
              onClick={handleVerify}
              disabled={!isFormValid() || loading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>
          ) : isCompleteDuplicate ? (
            <>
              <Button
                onClick={handleVerify}
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {loading ? "Verifying..." : "Verify Again"}
              </Button>
              <div className="flex items-center gap-2 text-red-600 text-sm font-medium px-4 py-2 bg-red-50 border border-red-200 rounded-md">
                <span>❌ Complete Duplicate - Cannot Update</span>
              </div>
            </>
          ) : (
            <>
              <Button
                onClick={handleVerify}
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {loading ? "Verifying..." : "Verify Again"}
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? "Updating..." : "Update Account"}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};