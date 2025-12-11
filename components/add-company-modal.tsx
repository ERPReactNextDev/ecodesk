"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

export function AddCompanyModal() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    manager: "",
    tsm: "",
    company_name: "",
    contact_person: "",
    contact_number: "",
    email_address: "",
    address: "",
    delivery_address: "",
    region: "",
    industry: "",
    remarks: "",
    status: "Active",
    gender: "",
    type_client: "CSR Client",
    company_group: "",
  });

  // Store full company info for duplicate check
  const [existingCompanies, setExistingCompanies] = useState<{ company_name: string, contact_person: string }[]>([]);
  const [duplicate, setDuplicate] = useState(false);

  const industries = [
    "Agriculture, Hunting and Forestry",
    "Fishing",
    "Mining",
    "Manufacturing",
    "Electricity, Gas and Water",
    "Construction",
    "Wholesale and Retail",
    "Hotels and Restaurants",
    "Transport, Storage and Communication",
    "Finance and Insurance",
    "Real Estate and Renting",
    "Education",
    "Health and Social Work",
    "Personal Services",
    "Government Offices",
    "Data Center",
  ];

  const industryIcons: Record<string, string> = {
    "Agriculture, Hunting and Forestry": "🌾",
    Fishing: "🎣",
    Mining: "⛏️",
    Manufacturing: "🏭",
    "Electricity, Gas and Water": "⚡",
    Construction: "🏗️",
    "Wholesale and Retail": "🛒",
    "Hotels and Restaurants": "🏨",
    "Transport, Storage and Communication": "🚚",
    "Finance and Insurance": "💰",
    "Real Estate and Renting": "🏠",
    Education: "🎓",
    "Health and Social Work": "🏥",
    "Personal Services": "💇",
    "Government Offices": "🏛️",
    "Data Center": "🖥️",
  };

  const genders = ["Male", "Female"];
  const statuses = ["Active", "Inactive", "Pending"];

  // Fetch existing CSR companies on modal open
  useEffect(() => {
    if (open) {
      fetch("/api/com-fetch-account")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const companies = data.data.map((c: any) => ({
              company_name: c.company_name.toLowerCase().trim(),
              contact_person: c.contact_person.toLowerCase().trim(),
            }));
            setExistingCompanies(companies);
          }
        });
    }
  }, [open]);

  // Check for duplicates based on company_name + contact_person
  useEffect(() => {
    const name = formData.company_name.toLowerCase().trim();
    const person = formData.contact_person.toLowerCase().trim();

    if (!name || !person) {
      setDuplicate(false);
      return;
    }

    const isDuplicate = existingCompanies.some(
      (c) => c.company_name === name && c.contact_person === person
    );

    setDuplicate(isDuplicate);
  }, [formData.company_name, formData.contact_person, existingCompanies]);

  const handleSave = async () => {
    // Required fields
    const requiredFields: Array<keyof typeof formData> = [
      "company_name",
      "contact_person",
      "contact_number",
      "email_address",
      "industry",
      "manager",
      "gender",
      "address",
    ];

    for (const key of requiredFields) {
      if (!formData[key]) {
        alert(`Please fill in the required field: ${key.replace("_", " ")}`);
        return;
      }
    }

    // Email validation
    if (!formData.email_address.includes("@")) {
      alert("Please enter a valid email address containing '@'");
      return;
    }

    if (duplicate) {
      alert("Company with this contact person already exists! Cannot save duplicate.");
      return;
    }

    try {
      const referenceId = crypto.randomUUID();

      const payload = {
        referenceid: referenceId,
        ...formData,
        date_created: new Date().toISOString(),
      };

      const response = await fetch("/api/com-save-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        alert("Error: " + result.error);
        return;
      }

      alert("Company saved successfully!");
      setOpen(false);
      // Optionally, reset form
      setFormData({
        manager: "",
        tsm: "",
        company_name: "",
        contact_person: "",
        contact_number: "",
        email_address: "",
        address: "",
        delivery_address: "",
        region: "",
        industry: "",
        remarks: "",
        status: "Active",
        gender: "",
        type_client: "CSR Client",
        company_group: "",
      });
    } catch (err) {
      console.error("Request failed:", err);
      alert("Request failed: " + err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          + Add Company
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add New Company</DialogTitle>
        </DialogHeader>

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
              className={duplicate ? "border-red-500" : ""}
            />
          </div>

          {/* Contact Person */}
          <div>
            <Label>Customer Name *</Label>
            <Input
              placeholder="Enter customer name"
              value={formData.contact_person}
              onChange={(e) =>
                setFormData({ ...formData, contact_person: e.target.value })
              }
              className={duplicate ? "border-red-500" : ""}
            />
            {duplicate && (
              <p className="text-red-600 text-sm mt-1">
                This company with the same contact person already exists!
              </p>
            )}
          </div>

          {/* Manager */}
          <div>
            <Label>Manager *</Label>
            <Input
              placeholder="Enter manager name"
              value={formData.manager}
              onChange={(e) =>
                setFormData({ ...formData, manager: e.target.value })
              }
            />
          </div>

          {/* Gender */}
          <div>
            <Label>Gender *</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => setFormData({ ...formData, gender: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {genders.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contact Number */}
          <div>
            <Label>Contact Number *</Label>
            <PhoneInput
              country={"ph"}
              value={formData.contact_number}
              onChange={(value) =>
                setFormData({ ...formData, contact_number: value })
              }
              inputStyle={{ width: "100%", height: "40px" }}
              dropdownStyle={{ zIndex: 99999 }}
            />
          </div>

          {/* Email */}
          <div>
            <Label>Email Address *</Label>
            <Input
              placeholder="Enter email address"
              type="email"
              value={formData.email_address}
              onChange={(e) =>
                setFormData({ ...formData, email_address: e.target.value })
              }
            />
          </div>

          {/* Address */}
          <div>
            <Label>Address *</Label>
            <Input
              placeholder="Enter address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>

          {/* Delivery Address */}
          <div>
            <Label>Delivery Address</Label>
            <Input
              placeholder="Enter delivery address"
              value={formData.delivery_address}
              onChange={(e) =>
                setFormData({ ...formData, delivery_address: e.target.value })
              }
            />
          </div>

          {/* Type Client */}
          <div>
            <Label>Client Segment</Label>
            <Input value="CSR Client" readOnly className="bg-gray-200" />
          </div>

          {/* Industry */}
          <div className="col-span-2">
            <Label>Industry *</Label>
            <Select
              value={formData.industry}
              onValueChange={(value) => setFormData({ ...formData, industry: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-auto">
                {industries.map((ind) => (
                  <SelectItem key={ind} value={ind} className="flex items-center gap-2">
                    <span>{industryIcons[ind]}</span>
                    <span>{ind}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Remarks */}
          <div className="col-span-2">
            <Label>Remarks</Label>
            <textarea
              placeholder="Enter remarks"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full border rounded-md p-2"
              rows={4}
            />
          </div>

          {/* Region */}
          <div>
            <Label>Region</Label>
            <Input
              placeholder="Enter region"
              value={formData.region}
              onChange={(e) =>
                setFormData({ ...formData, region: e.target.value })
              }
            />
          </div>

          {/* Company Group */}
          <div>
            <Label>Company Group</Label>
            <Input
              placeholder="Enter company group"
              value={formData.company_group}
              onChange={(e) =>
                setFormData({ ...formData, company_group: e.target.value })
              }
            />
          </div>

          {/* TSM */}
          <div>
            <Label>Technical Sales Manager</Label>
            <Input
              placeholder="Enter Technical Sales Manager"
              value={formData.tsm}
              onChange={(e) =>
                setFormData({ ...formData, tsm: e.target.value })
              }
            />
          </div>

          {/* Status */}
          <div>
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Save Button */}
          <div className="col-span-2">
            <Button
              className="w-full mt-4"
              onClick={handleSave}
              variant="default"
              disabled={duplicate}
            >
              Save Company
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
