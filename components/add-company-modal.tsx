"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldDescription,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface AddCompanyModalProps {
  referenceid: string;
  onCreated: () => Promise<void>;
}

export function AddCompanyModal({ referenceid, onCreated }: AddCompanyModalProps) {
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    tsm: "",
    company_name: "",
    contact_person: "",
    contact_number: "", // ← joined string
    email_address: "",
    address: "",
    industry: "",
    type_client: "CSR Client",
    manager: null,
    region: null,
    company_group: null,
    status: "Active",
  });

  // ✅ MULTIPLE CONTACT NUMBERS STATE
  const [contactNumbers, setContactNumbers] = useState<string[]>([""]);

  const [existingCompanies, setExistingCompanies] = useState<
    { company_name: string; contact_person: string }[]
  >([]);
  const [duplicate, setDuplicate] = useState({ contact: false });

  const clientSegments = [
    "Agriculture, Hunting and Forestry",
    "Construction",
    "Data Center",
    "Education",
    "Electricity, Gas and Water",
    "Fishing",
    "Finance and Insurance",
    "Government Offices",
    "Health and Social Work",
    "Hotels and Restaurants",
    "Manufacturing",
    "Mining",
    "Personal Services",
    "Real Estate and Renting",
    "Transport, Storage and Communication",
    "Wholesale and Retail",
  ];

  const genders = ["Male", "Female"];

  /* FETCH EXISTING COMPANIES */
  useEffect(() => {
    if (open) {
      fetch("/api/com-fetch-account")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setExistingCompanies(
              data.data.map((c: any) => ({
                company_name: (c.company_name ?? "").toLowerCase().trim(),
                contact_person: (c.contact_person ?? "").toLowerCase().trim(),
              }))
            );
          }
        });
    }
  }, [open]);

  /* DUPLICATE CHECK */
  useEffect(() => {
    const name = formData.company_name.toLowerCase().trim();
    const person = formData.contact_person.toLowerCase().trim();

    setDuplicate({
      contact: existingCompanies.some(
        (c) => c.company_name === name && c.contact_person === person
      ),
    });
  }, [formData.company_name, formData.contact_person, existingCompanies]);

const isFormValid = () => {
  const required: Array<keyof typeof formData> = [
    "company_name",
    "contact_person",
    "industry",
    "address",
  ];

  const allFilled = required.every((f) => formData[f]);

  // email is OPTIONAL — only validate if user typed something
  const emailValid =
    !formData.email_address ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_address);

  // contact number is OPTIONAL — allow empty
  const hasContact = contactNumbers.some((n) => n.trim());
  const contactValid = contactNumbers.length === 1
    ? true        // allow blank
    : hasContact; // if multiple fields exist, at least one must be filled

  return allFilled && emailValid && contactValid && !duplicate.contact;
};


  /* ACCOUNT REFERENCE GENERATOR */
  const generateAccountReferenceNumber = async (companyName: string) => {
    const prefix = companyName.trim().substring(0, 2).toUpperCase();
    const res = await fetch(`/api/get-account-references?prefix=${prefix}-CSR`);
    const data = await res.json();

    let max = 0;
    data.references.forEach((r: string) => {
      const m = r.match(/CSR-(\d{8})$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });

    return `${prefix}-CSR-${String(max + 1).padStart(8, "0")}`;
  };

  /* CONTACT NUMBER HANDLERS */
  const handleContactChange = (index: number, value: string) => {
    const updated = [...contactNumbers];
    updated[index] = value;
    setContactNumbers(updated);
  };

  const addContactField = () => {
    setContactNumbers((prev) => [...prev, ""]);
  };

  const removeContactField = (index: number) => {
    if (contactNumbers.length === 1) return;
    const updated = [...contactNumbers];
    updated.splice(index, 1);
    setContactNumbers(updated);
  };

  const handleSave = async () => {
  if (saving) return; // 🔒 stop double click
  if (!isFormValid()) {
    toast.error("Please complete required fields and avoid duplicates.");
    return;
  }

  try {
    setSaving(true); // 🔒 lock button

    const account_reference_number =
      await generateAccountReferenceNumber(formData.company_name);

    const joinedContacts = contactNumbers
      .map((n) => n.trim())
      .filter(Boolean)
      .join(" / ");

    const res = await fetch("/api/com-save-company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referenceid,
        account_reference_number,
        ...formData,
        contact_number: joinedContacts,
        date_created: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      const j = await res.json();
      throw new Error(j.error || "Failed to save");
    }

    toast.success("Company saved");
    setOpen(false);
    resetForm();
    await onCreated();
  } catch (err) {
    console.error(err);
    toast.error("Saving failed");
  } finally {
    setSaving(false); // 🔓 unlock
  }
};


  const resetForm = () => {
    setFormData({
      tsm: "",
      company_name: "",
      contact_person: "",
      contact_number: "",
      email_address: "",
      address: "",
      industry: "",
      type_client: "CSR Client",
      manager: null,
      region: null,
      company_group: null,
      status: "Active",
    });
    setContactNumbers([""]);
    setDuplicate({ contact: false });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="cursor-pointer">Add Account</Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[420px] sm:w-[480px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>Add New Account</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <FieldGroup className="space-y-5">
            <Field>
              <FieldLabel>Company *</FieldLabel>
              <Input
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value.toUpperCase() })
                }
                className={duplicate.contact ? "border-red-500" : ""}
              />
              {duplicate.contact && (
                <p className="text-xs text-red-600 mt-1">
                  Duplicate company with same contact person
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel>Customer Name *</FieldLabel>
              <Input
                value={formData.contact_person}
                onChange={(e) =>
                  setFormData({ ...formData, contact_person: e.target.value })
                }
              />
            </Field>

            {/* ✅ MULTIPLE CONTACT NUMBERS */}
            <Field>
              <FieldLabel>Contact Number *</FieldLabel>
              <div className="space-y-2">
                {contactNumbers.map((num, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      type="tel"
                      value={num}
                      onChange={(e) => handleContactChange(idx, e.target.value)}
                      placeholder="+63 9123456789"
                      className="flex-grow"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeContactField(idx)}
                    >
                      −
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="secondary" onClick={addContactField}>
                  + Add another number
                </Button>
              </div>
            </Field>

            <Field>
              <FieldLabel>Email Address *</FieldLabel>
              <Input
                type="email"
                value={formData.email_address}
                onChange={(e) =>
                  setFormData({ ...formData, email_address: e.target.value })
                }
              />
            </Field>

            <Field>
              <FieldLabel>Address *</FieldLabel>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </Field>

            <Field>
              <FieldLabel>Client Segment *</FieldLabel>
              <Select
                value={formData.industry}
                onValueChange={(v) =>
                  setFormData({ ...formData, industry: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {clientSegments.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </div>

        <div className="px-6 py-4 border-t flex gap-2">
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={!isFormValid() || saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>

          <Button className="flex-1" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
