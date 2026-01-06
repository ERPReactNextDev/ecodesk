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
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
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
  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    tsm: "",
    company_name: "",
    contact_person: "",
    contact_number: "",
    email_address: "",
    address: "",
    industry: "",
    gender: "Male",
    type_client: "CSR Client",
    manager: null,
    region: null,
    company_group: null,
    status: "Active",
  });

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

  // Fetch existing companies when sheet opens
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

  // Duplicate checker
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
      "gender",
      "address",
    ];

    const allFilled = required.every((f) => formData[f]);
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_address);

    return allFilled && emailValid && !duplicate.contact;
  };

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

  const handleSave = async () => {
    if (!isFormValid()) {
      toast.error("Please complete required fields and avoid duplicates.");
      return;
    }

    try {
      const account_reference_number =
        await generateAccountReferenceNumber(formData.company_name);

      await fetch("/api/com-save-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceid,
          account_reference_number,
          ...formData,
          date_created: new Date().toISOString(),
        }),
      });

      await fetch("/api/act-save-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceid,
          account_reference_number,
          status: "On-Progress",
          date_created: new Date().toISOString(),
        }),
      });

      toast.success("Company and activity saved");
      setOpen(false);
      resetForm();
      await onCreated();
    } catch (e) {
      toast.error("Saving failed");
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
      gender: "Male",
      type_client: "CSR Client",
      manager: null,
      region: null,
      company_group: null,
      status: "Active",
    });
    setDuplicate({ contact: false });
  };

  return (
  <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger asChild>
      <Button>Add Account</Button>
    </SheetTrigger>

    <SheetContent
      side="right"
      className="w-[420px] sm:w-[480px] p-0 flex flex-col"
    >
      {/* HEADER */}
      <SheetHeader className="px-6 py-4 border-b">
        <SheetTitle className="text-lg font-semibold">
          Add New Account
        </SheetTitle>
        <p className="text-sm text-muted-foreground">
          Update the details of the record below.
        </p>
      </SheetHeader>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <FieldGroup className="space-y-5">
          {/* Company Name */}
          <Field>
            <FieldLabel>Company *</FieldLabel>
            <Input
              value={formData.company_name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  company_name: e.target.value.toUpperCase(),
                })
              }
              className={duplicate.contact ? "border-red-500" : ""}
            />
            {duplicate.contact && (
              <p className="text-xs text-red-600 mt-1">
                Duplicate company with same contact person
              </p>
            )}
          </Field>

          {/* Customer Name */}
          <Field>
            <FieldLabel>Customer Name *</FieldLabel>
            <Input
              value={formData.contact_person}
              onChange={(e) =>
                setFormData({ ...formData, contact_person: e.target.value })
              }
            />
          </Field>

          {/* Contact Number */}
          <Field>
            <FieldLabel>Contact Number *</FieldLabel>
            <PhoneInput
              country="ph"
              value={formData.contact_number}
              onChange={(v) =>
                setFormData({ ...formData, contact_number: v })
              }
              inputStyle={{ width: "100%", height: "40px" }}
            />
          </Field>

          {/* Email */}
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

          {/* Gender */}
          <Field>
            <FieldLabel>Gender *</FieldLabel>
            <Select
              value={formData.gender}
              onValueChange={(v) =>
                setFormData({ ...formData, gender: v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {genders.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Address */}
          <Field>
            <FieldLabel>Address *</FieldLabel>
            <Input
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </Field>

          {/* Client Segment */}
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

      {/* FOOTER */}
      <div className="px-6 py-4 border-t flex gap-2">
        <Button
          className="flex-1"
          onClick={handleSave}
          disabled={!isFormValid()}
        >
          Save
        </Button>
        <Button
          className="flex-1"
          variant="outline"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </SheetContent>
  </Sheet>
);

}
