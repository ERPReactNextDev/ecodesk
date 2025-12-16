"use client";

import { useState, useEffect } from "react";
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
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { CancelDialog } from "./activity-cancel-dialog";

interface AddCompanyModalProps {
  referenceid: string;
}
export function AddCompanyModal({ referenceid }: AddCompanyModalProps) {

  const [open, setOpen] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const [formData, setFormData] = useState({
    tsm: "",
    company_name: "",
    contact_person: "",
    contact_number: "",
    email_address: "",
    address: "",
    delivery_address: "",
    industry: "",
    gender: "Male",
    remarks: "",
    type_client: "CSR Client",
    manager: null,
    region: null,
    company_group: null,
    status: "Active",
    traffic: "",
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

  useEffect(() => {
    if (open) {
      fetch("/api/com-fetch-account")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const companies = data.data.map((c: any) => ({
              company_name: (c.company_name ?? "").toLowerCase().trim(),
              contact_person: (c.contact_person ?? "").toLowerCase().trim(),
            }));
            setExistingCompanies(companies);
          }
        });
    }
  }, [open]);

  useEffect(() => {
    const name = formData.company_name.toLowerCase().trim();
    const person = formData.contact_person.toLowerCase().trim();
    const isDuplicate = existingCompanies.some(
      (c) => c.company_name === name && c.contact_person === person
    );
    setDuplicate({ contact: isDuplicate });
  }, [formData.company_name, formData.contact_person, existingCompanies]);

  const isFormValid = () => {
    const requiredFields: Array<keyof typeof formData> = [
      "company_name",
      "contact_person",
      "contact_number",
      "email_address",
      "industry",
      "gender",
      "address",
      "tsm",
    ];
    const allFilled = requiredFields.every((field) => formData[field]);
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      formData.email_address
    );
    const noDuplicate = !duplicate.contact;
    return allFilled && emailValid && noDuplicate;
  };

  const handleSave = async () => {
    if (!isFormValid()) {
      alert("Please fill all required fields correctly and avoid duplicates.");
      return;
    }

    try {
      const gender = genders.includes(formData.gender) ? formData.gender : "Male";

      // Generate account_reference_number using companyName + region
      const getPrefix = (company_name: string | null, region: string | null) => {
        const companyPart = (company_name ?? "").trim().substring(0, 2).toUpperCase();
        const regionPart = (region ?? "").trim().toUpperCase().replace(/\s+/g, "");
        return `${companyPart}-${regionPart}`;
      };

      const accountReferenceNumber = getPrefix(formData.company_name, formData.region);

      // 1️⃣ Payload for company API
      const companyPayload = {
        referenceid,
        account_reference_number: accountReferenceNumber,
        ...formData,
        gender,
        remarks: formData.remarks.trim() === "" ? null : formData.remarks,
        date_created: new Date().toISOString(),
      };

      const companyRes = await fetch("/api/com-save-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyPayload),
      });

      const companyResult = await companyRes.json();
      if (!companyRes.ok) {
        alert("Company save failed: " + (companyResult.error || "Unknown error"));
        return;
      }

      // 2️⃣ Payload for activity/ticket API
      const ticketPayload = {
        referenceid, // same as props
        account_reference_number: accountReferenceNumber,
        traffic: formData.traffic || null,
        status: "On-Progress",
        date_created: new Date().toISOString(),
      };

      const ticketRes = await fetch("/api/act-save-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketPayload),
      });

      const ticketResult = await ticketRes.json();
      if (!ticketRes.ok) {
        alert("Activity save failed: " + (ticketResult.error || "Unknown error"));
        return;
      }

      // Success
      alert("Company and activity saved successfully!");
      setOpen(false);
      resetForm(); // make sure you have a resetForm function to clear formData
    } catch (err) {
      console.error("Request failed:", err);
      alert("Request failed: " + err);
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
      delivery_address: "",
      industry: "",
      gender: "Male",
      remarks: "",
      type_client: "CSR Client",
      manager: null,
      region: null,
      company_group: null,
      status: "Active",
      traffic: ""
    });
  };

  const handleCloseAttempt = () => setShowCancelDialog(true);
  const handleCancelConfirm = () => {
    setShowCancelDialog(false);
    setOpen(false);
    resetForm();
  };
  const handleCancelReject = () => setShowCancelDialog(false);
  const isDisabled = showCancelDialog;

  return (
    <>
      {/* Trigger Button */}
      <Button variant="default" onClick={() => setOpen(true)}>
        Add Account
      </Button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50"
          onClick={handleCloseAttempt} // click outside triggers cancel dialog
        >
          <div
            className="bg-white rounded-md p-6 max-w-lg w-full shadow-lg max-h-[90vh] overflow-visible"
            onClick={(e) => e.stopPropagation()} // prevent modal clicks from closing
          >
            <h2 className="text-lg font-semibold mb-4">Add New Company</h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Company Name */}
              <div className="col-span-2">
                <Label>Company Name *</Label>
                <Input
                  placeholder="Enter company name"
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                  className={duplicate.contact ? "border-red-500" : ""}
                  disabled={isDisabled}
                />
                {duplicate.contact && (
                  <p className="text-red-600 text-sm mt-1">
                    This company with the same contact person already exists!
                  </p>
                )}
              </div>

              {/* Customer Name */}
              <div>
                <Label>Customer Name *</Label>
                <Input
                  placeholder="Enter customer name"
                  value={formData.contact_person}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_person: e.target.value })
                  }
                  className={duplicate.contact ? "border-red-500" : ""}
                  disabled={isDisabled}
                />
              </div>

              {/* TSM */}
              <div>
                <Label>Technical Sales Manager *</Label>
                <Input
                  placeholder="Enter Technical Sales Manager"
                  value={formData.tsm}
                  onChange={(e) =>
                    setFormData({ ...formData, tsm: e.target.value })
                  }
                  disabled={isDisabled}
                />
              </div>

              {/* Gender */}
              <div>
                <Label>Gender *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, gender: value })
                  }
                  disabled={isDisabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    {genders.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Contact Number */}
              <div>
                <Label>Contact Number *</Label>
                <PhoneInput
                  country="ph"
                  value={formData.contact_number}
                  onChange={(value) =>
                    setFormData({ ...formData, contact_number: value })
                  }
                  inputStyle={{ width: "100%", height: "40px" }}
                  dropdownStyle={{ zIndex: 10000 }}
                  disabled={isDisabled}
                />
              </div>

              {/* Email */}
              <div>
                <Label>Email Address *</Label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email_address}
                  onChange={(e) =>
                    setFormData({ ...formData, email_address: e.target.value })
                  }
                  disabled={isDisabled}
                />
              </div>

              {/* Address */}
              <div className="col-span-2">
                <Label>Address *</Label>
                <Input
                  placeholder="Enter address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  disabled={isDisabled}
                />
              </div>

              {/* Delivery Address */}
              <div className="col-span-2">
                <Label>Delivery Address *</Label>
                <Input
                  placeholder="Enter delivery address"
                  value={formData.delivery_address}
                  onChange={(e) =>
                    setFormData({ ...formData, delivery_address: e.target.value })
                  }
                  disabled={isDisabled}
                />
              </div>

              {/* Client Segment */}
              <div className="col-span-2">
                <Label>Client Segment *</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) =>
                    setFormData({ ...formData, industry: value })
                  }
                  disabled={isDisabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client segment" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-auto z-[10000]">
                    {clientSegments.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Delivery Address */}
              <div className="col-span-2">
                <Label>Traffic *</Label>
                <Input
                  placeholder="Enter delivery address"
                  value={formData.traffic}
                  onChange={(e) =>
                    setFormData({ ...formData, traffic: e.target.value })
                  }
                  disabled={isDisabled}
                />
              </div>

              {/* Remarks */}
              <div className="col-span-2">
                <Label>Remarks</Label>
                <textarea
                  placeholder="Enter remarks"
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData({ ...formData, remarks: e.target.value })
                  }
                  className="w-full border rounded-md p-2"
                  rows={4}
                  disabled={isDisabled}
                />
              </div>

              {/* Save + Cancel */}
              <div className="col-span-2 flex gap-2 mt-4">
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  variant="default"
                  disabled={!isFormValid() || isDisabled}
                >
                  Save Company
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={handleCloseAttempt}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <CancelDialog
          onConfirm={handleCancelConfirm}
          onCancel={handleCancelReject}
        />
      )}
    </>
  );
}
