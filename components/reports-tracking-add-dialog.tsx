"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldContent,
  FieldLabel,
} from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newRecord: any) => void;
}

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const STATUS_OPTIONS = ["Open", "Closed"];

  const [form, setForm] = useState({
    company_name: "",
    customer_name: "",
    ticket_type: "",
    ticket_concern: "",
    department: "",
    endorsed_date: "",
    closed_date: "",
    sales_agent: "",
    tsm: "",
    status: "",
    nature_of_concern: "",
    remarks: "",
  });

  // Multiple contact numbers as separate state
  const [contactNumbers, setContactNumbers] = useState<string[]>([""]);

  // Handle simple input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Select change
  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Contact numbers handlers
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

  // Format datetime-local value for inputs, or empty string
  const formatDateTimeLocal = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    try {
      // parseISO supports strings like '2023-12-20T14:00'
      const parsed = parseISO(dateStr);
      // format to 'yyyy-MM-dd\'T\'HH:mm' for datetime-local input
      return format(parsed, "yyyy-MM-dd'T'HH:mm");
    } catch {
      return "";
    }
  };

  const handleSave = async () => {
    try {
      // Validate required fields if needed, e.g. company_name or customer_name etc.
      if (!form.company_name.trim()) {
        toast.error("Company name is required.");
        return;
      }

      // Join contact numbers, filter out empty
      const contactNumberString = contactNumbers
        .map((n) => n.trim())
        .filter(Boolean)
        .join(" / ");

      // Prepare payload for backend
      const payload = {
        ...form,
        contact_number: contactNumberString,
        // Format dates for backend, convert from datetime-local string to desired format
        endorsed_date: form.endorsed_date
          ? format(new Date(form.endorsed_date), "MM/dd/yyyy hh:mm aa")
          : "",
        closed_date: form.closed_date
          ? format(new Date(form.closed_date), "MM/dd/yyyy hh:mm aa")
          : "",
      };

      // Example POST request
      const res = await fetch("/api/d-tracking-add-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save record");

      toast.success("DTR record added successfully");
      onSave(payload);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save record");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="overflow-auto p-6 space-y-4 max-w-md">
        <SheetHeader>
          <SheetTitle>Add D-Tracking Record</SheetTitle>
          <SheetDescription>Fill in the details of the new record below.</SheetDescription>
        </SheetHeader>

        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <Field>
            <FieldLabel htmlFor="company_name">Company</FieldLabel>
            <FieldContent>
              <Input
                id="company_name"
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                required
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="customer_name">Customer Name</FieldLabel>
            <FieldContent>
              <Input
                id="customer_name"
                name="customer_name"
                value={form.customer_name}
                onChange={handleChange}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Contact Number</FieldLabel>
            <FieldContent>
              <div className="space-y-2">
                {contactNumbers.map((num, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      type="tel"
                      value={num}
                      onChange={(e) => handleContactChange(idx, e.target.value)}
                      placeholder="+63 9123456789"
                      className="flex-grow"
                      name={`contact_number_${idx}`}
                    />
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => removeContactField(idx)}
                      aria-label="Remove contact number"
                    >
                      −
                    </Button>
                  </div>
                ))}
                <Button variant="secondary" type="button" onClick={addContactField}>
                  + Add another number
                </Button>
              </div>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="ticket_type">Ticket Type</FieldLabel>
            <FieldContent>
              <Select
                value={form.ticket_type}
                onValueChange={(value) => handleSelectChange("ticket_type", value)}
              >
                <SelectTrigger id="ticket_type" aria-label="Select Ticket Type" className="w-full">
                  <SelectValue placeholder="Select Ticket Type" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "After Sales",
                    "Complaint",
                    "Documentation",
                    "Follow Up",
                    "Pricing",
                    "Product",
                    "Technical",
                  ].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="ticket_concern">Ticket Concern</FieldLabel>
            <FieldContent>
              <Select
                value={form.ticket_concern}
                onValueChange={(value) => handleSelectChange("ticket_concern", value)}
              >
                <SelectTrigger id="ticket_concern" aria-label="Select Ticket Concern" className="w-full">
                  <SelectValue placeholder="Select Ticket Concern" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Accreditation Request",
                    "Delivery/Pickup",
                    "Dialux",
                    "Documents",
                    "Job Request",
                    "Payment",
                    "Product Certificate",
                    "Product Recommendation",
                    "Product Testing",
                    "Quotation",
                    "Refund",
                    "Replacement",
                    "Replacement To Supplier",
                    "Repair",
                    "Shop Drawing",
                    "Site Visit",
                    "SPF",
                    "TDS",
                    "Wrong Order",
                  ].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="department">Department</FieldLabel>
            <FieldContent>
              <Select
                value={form.department}
                onValueChange={(value) => handleSelectChange("department", value)}
              >
                <SelectTrigger id="department" aria-label="Select Department" className="w-full">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Accounting",
                    "E-commerce",
                    "Engineering",
                    "Human Resources",
                    "Marketing",
                    "Procurement",
                    "Sales",
                    "Warehouse",
                  ].map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="sales_agent">Sales Agent</FieldLabel>
            <FieldContent>
              <Select
                value={form.sales_agent}
                onValueChange={(value) => handleSelectChange("sales_agent", value)}
              >
                <SelectTrigger id="sales_agent" aria-label="Select Agent" className="w-full">
                  <SelectValue placeholder="Select Agent" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Airish Echanes",
                    "Alvin Estor",
                    "Alvin Perez",
                    "Banjo Lising",
                    "Candy Notob",
                    "Christopher Acierto",
                    "Connie Doroja",
                    "Cristy Bobis",
                    "Dane Ariane Delute",
                    "Dionisio Duyugan",
                    "Elaine Soroan",
                    "Erwin Jr Laude",
                    "Ferdy Navarro",
                    "Gene Mark Roxas",
                    "Gretchel Ann Aquino",
                    "Jeffrey Lacson",
                    "Jennifer Dela Cruz",
                    "John Jeffrey Puying",
                    "Jonna Clarin",
                    "Joy Merel Soriente",
                    "Jude Francinni Tan",
                    "Khay Yango",
                    "Kurt Narrem Guangco",
                    "Lotty De Guzman",
                    "Maricar Magdaong",
                    "Mark Villagonzalo",
                    "Michale Quijano",
                    "Neil Vincent Jarabejo",
                    "Norman Maranga",
                    "Paula Caugiran",
                    "Rafael Bayani",
                    "Raymart Binondo",
                    "Reggie Nocete",
                    "Ria Lyn Francisco",
                    "Richard Esteban",
                    "Rodelyn Abrea",
                    "Rodelio Ico Jean Dela Cerna",
                    "Rodney Mendoza",
                    "Roselyn Barnes",
                    "Ruby Del Rosario",
                    "Sherilyn Rapote",
                    "Shane Rey Santos",
                    "Venzross Posadas",
                    "Vince Ortiz",
                  ].map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="tsm">TSM</FieldLabel>
            <FieldContent>
              <Select
                value={form.tsm}
                onValueChange={(value) => handleSelectChange("tsm", value)}
              >
                <SelectTrigger id="tsm" aria-label="Select Manager" className="w-full">
                  <SelectValue placeholder="Select Manager" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Airish Echanes",
                    "Angie Baldugo",
                    "Betty Rodriguez",
                    "Dave Catausan",
                    "Jerry Abaluyan",
                    "Karlie Garcia",
                    "Ma. Ria Felizmena",
                    "Mark Pacis",
                    "Maricris Mercado",
                    "Mona Liza Torino",
                    "Olive Milano",
                    "Paula Cauguiran",
                    "Roy Tayuman",
                    "Ronald Dela Cueva",
                    "Sette Hosena",
                  ].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="status">Status</FieldLabel>
            <FieldContent>
              <Select
                value={form.status}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger id="status" aria-label="Select Status" className="w-full">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="nature_of_concern">Nature of Concern</FieldLabel>
            <FieldContent>
              <Textarea
                id="nature_of_concern"
                name="nature_of_concern"
                value={form.nature_of_concern}
                onChange={handleChange}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="remarks">Remarks</FieldLabel>
            <FieldContent>
              <Textarea
                id="remarks"
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="endorsed_date">Endorsed Date</FieldLabel>
            <FieldContent>
              <Input
                type="datetime-local"
                id="endorsed_date"
                name="endorsed_date"
                value={form.endorsed_date}
                onChange={handleChange}
                placeholder="YYYY-MM-DDThh:mm"
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="closed_date">Closed Date</FieldLabel>
            <FieldContent>
              <Input
                type="datetime-local"
                id="closed_date"
                name="closed_date"
                value={form.closed_date}
                onChange={handleChange}
                placeholder="YYYY-MM-DDThh:mm"
              />
            </FieldContent>
          </Field>

          <div className="pt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit">Save Record</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
