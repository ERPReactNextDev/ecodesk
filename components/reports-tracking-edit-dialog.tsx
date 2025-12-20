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
import { format } from "date-fns";

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  onSave: (updatedRecord: any) => void;
}

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  isOpen,
  onClose,
  record,
  onSave,
}) => {
  const [form, setForm] = useState<any>({
    company_name: "",
    customer_name: "",
    ticket_type: "",
    ticket_concern: "",
    department: "",
    sales_agent: "",
    tsm: "",
    status: "",
    nature_of_concern: "",
    endorsed_date: "",
    closed_date: "",
    contactNumbers: [""],
    remarks: "",
  });

  useEffect(() => {
    if (record) {
      setForm({
        company_name: record.company_name || "",
        customer_name: record.customer_name || "",
        ticket_type: record.ticket_type || "",
        ticket_concern: record.ticket_concern || "",
        department: record.department || "",
        sales_agent: record.sales_agent || "",
        tsm: record.tsm || "",
        status: record.status || "",
        nature_of_concern: record.nature_of_concern || "",
        remarks: record.remarks || "",
        endorsed_date: record.endorsed_date
          ? format(new Date(record.endorsed_date), "yyyy-MM-dd'T'HH:mm")
          : "",
        closed_date: record.closed_date
          ? format(new Date(record.closed_date), "yyyy-MM-dd'T'HH:mm")
          : "",
        contactNumbers: record.contact_number
          ? record.contact_number.split(" / ")
          : [""],
      });
    }
  }, [record]);

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleContactChange = (index: number, value: string) => {
    const updated = [...form.contactNumbers];
    updated[index] = value;
    setForm((prev: any) => ({ ...prev, contactNumbers: updated }));
  };

  const addContactField = () => {
    setForm((prev: any) => ({
      ...prev,
      contactNumbers: [...prev.contactNumbers, ""],
    }));
  };

  const removeContactField = (index: number) => {
    if (form.contactNumbers.length === 1) return;
    const updated = [...form.contactNumbers];
    updated.splice(index, 1);
    setForm((prev: any) => ({ ...prev, contactNumbers: updated }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        contact_number: form.contactNumbers
          .map((n: string) => n.trim())
          .filter(Boolean)
          .join(" / "),
        endorsed_date: form.endorsed_date
          ? format(new Date(form.endorsed_date), "MM/dd/yyyy hh:mm aa")
          : "",
        closed_date: form.closed_date
          ? format(new Date(form.closed_date), "MM/dd/yyyy hh:mm aa")
          : "",
        id: record._id,
      };

      const res = await fetch("/api/d-tracking-edit-record", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update record");

      toast.success("Record updated successfully");
      onSave(data.updatedRecord);
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="overflow-auto p-6 space-y-4"
      >
        <SheetHeader>
          <SheetTitle>Edit D-Tracking Record</SheetTitle>
          <SheetDescription>
            Update the details of the record below.
          </SheetDescription>
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
                {form.contactNumbers.map((num: string, idx: number) => (
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
                <Button
                  variant="secondary"
                  type="button"
                  onClick={addContactField}
                >
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
                onValueChange={(value) => setForm((prev: any) => ({ ...prev, ticket_type: value }))}
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
                onValueChange={(value) => setForm((prev: any) => ({ ...prev, ticket_concern: value }))}
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
                onValueChange={(value) => setForm((prev: any) => ({ ...prev, department: value }))}
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
                onValueChange={(value) => setForm((prev: any) => ({ ...prev, sales_agent: value }))}
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
                onValueChange={(value) => setForm((prev: any) => ({ ...prev, tsm: value }))}
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
                onValueChange={(value) => setForm((prev: any) => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="status" aria-label="Select Status" className="w-full">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  {["Open", "Closed"].map((s) => (
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
              />
            </FieldContent>
          </Field>

          <div className="pt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
