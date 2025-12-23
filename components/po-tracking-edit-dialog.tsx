"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format, parseISO, isValid } from "date-fns";

interface EditPOProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  onSave: (updatedRecord: any) => void;
}

const SALES_AGENTS = [
  "Airish Echanes", "Alvin Estor", "Alvin Perez", "Banjo Lising",
  "Candy Notob", "Christopher Acierto", "Connie Doroja", "Cristy Bobis",
  "Dane Ariane Delute", "Dionisio Duyugan", "Elaine Soroan", "Erwin Jr Laude",
  "Ferdy Navarro", "Gene Mark Roxas", "Gretchel Ann Aquino", "Jeffrey Lacson",
  "Jennifer Dela Cruz", "John Jeffrey Puying", "Jonna Clarin", "Joy Merel Soriente",
  "Jude Francinni Tan", "Khay Yango", "Kurt Narrem Guangco", "Lotty De Guzman",
  "Maricar Magdaong", "Mark Villagonzalo", "Michale Quijano", "Neil Vincent Jarabejo",
  "Norman Maranga", "Paula Caugiran", "Rafael Bayani", "Raymart Binondo", "Reggie Nocete",
  "Ria Lyn Francisco", "Richard Esteban", "Rodelyn Abrea", "Rodelio Ico Jean Dela Cerna",
  "Rodney Mendoza", "Roselyn Barnes", "Ruby Del Rosario", "Sherilyn Rapote",
  "Shane Rey Santos", "Venzross Posadas", "Vince Ortiz",
];

export const EditPO: React.FC<EditPOProps> = ({ isOpen, onClose, record, onSave }) => {
  const [form, setForm] = useState<any>({
    referenceid: "",
    company_name: "",
    po_number: "",
    amount: "",
    so_number: "",
    so_date: "",
    sales_agent: "",
    payment_terms: "",
    payment_date: "",
    delivery_pickup_date: "",
    source: "",
    status: "",
  });

  const [contactNumbers, setContactNumbers] = useState<string[]>([""]);

  // Safe date parser
  const parseDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parsed = parseISO(dateStr);
    return isValid(parsed) ? format(parsed, "yyyy-MM-dd'T'HH:mm") : "";
  };

  useEffect(() => {
    if (record) {
      const numbers = record.contact_number?.split(" / ").filter(Boolean) || [""];

      setForm({
        referenceid: record.referenceid || "",
        company_name: record.company_name || "",
        po_number: record.po_number || "",
        amount: record.amount || "",
        so_number: record.so_number || "",
        so_date: parseDate(record.so_date),
        sales_agent: record.sales_agent || "",
        payment_terms: record.payment_terms || "",
        payment_date: parseDate(record.payment_date),
        delivery_pickup_date: parseDate(record.delivery_pickup_date),
        source: record.source || "",
        status: record.status || "",
      });

      setContactNumbers(numbers);
    }
  }, [record]);

  const handleChange = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleContactChange = (index: number, value: string) => {
    const updated = [...contactNumbers];
    updated[index] = value;
    setContactNumbers(updated);
  };

  const addContactField = () => setContactNumbers(prev => [...prev, ""]);
  const removeContactField = (index: number) => {
    if (contactNumbers.length === 1) return;
    const updated = [...contactNumbers];
    updated.splice(index, 1);
    setContactNumbers(updated);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        contact_number: contactNumbers.filter(Boolean).join(" / "),
        id: record._id,
      };

      const res = await fetch("/api/po-edit-record", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update PO record");

      toast.success("PO record updated successfully");
      onSave(data.updatedRecord);
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="overflow-auto p-6 space-y-4 max-w-md">
        <SheetHeader>
          <SheetTitle>Edit PO Record</SheetTitle>
          <SheetDescription>Update the details of the PO record below.</SheetDescription>
        </SheetHeader>

        <form
          className="space-y-6"
          onSubmit={e => {
            e.preventDefault();
            handleSave();
          }}
        >
          <Field>
            <FieldLabel>Company</FieldLabel>
            <FieldContent>
              <Input
                name="company_name"
                value={form.company_name}
                onChange={e => handleChange("company_name", e.target.value)}
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
                      onChange={e => handleContactChange(idx, e.target.value)}
                      className="flex-grow"
                    />
                    <Button variant="outline" type="button" onClick={() => removeContactField(idx)}>
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
            <FieldLabel>PO Number</FieldLabel>
            <FieldContent>
              <Input
                name="po_number"
                value={form.po_number}
                onChange={e => handleChange("po_number", e.target.value)}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Amount</FieldLabel>
            <FieldContent>
              <Input
                name="amount"
                type="number"
                value={form.amount}
                onChange={e => handleChange("amount", e.target.value)}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>SO Number</FieldLabel>
            <FieldContent>
              <Input
                name="so_number"
                value={form.so_number}
                onChange={e => handleChange("so_number", e.target.value)}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>SO Date</FieldLabel>
            <FieldContent>
              <Input
                type="datetime-local"
                name="so_date"
                value={form.so_date}
                onChange={e => handleChange("so_date", e.target.value)}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Sales Agent</FieldLabel>
            <FieldContent>
              <Select value={form.sales_agent} onValueChange={v => handleChange("sales_agent", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Agent" />
                </SelectTrigger>
                <SelectContent>
                  {SALES_AGENTS.map(agent => (
                    <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Payment Terms</FieldLabel>
            <FieldContent>
              <Input
                name="payment_terms"
                value={form.payment_terms}
                onChange={e => handleChange("payment_terms", e.target.value)}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Payment Date</FieldLabel>
            <FieldContent>
              <Input
                type="datetime-local"
                name="payment_date"
                value={form.payment_date}
                onChange={e => handleChange("payment_date", e.target.value)}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Delivery/Pickup Date</FieldLabel>
            <FieldContent>
              <Input
                type="datetime-local"
                name="delivery_pickup_date"
                value={form.delivery_pickup_date}
                onChange={e => handleChange("delivery_pickup_date", e.target.value)}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Source</FieldLabel>
            <FieldContent>
              <Input
                name="source"
                value={form.source}
                onChange={e => handleChange("source", e.target.value)}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Status</FieldLabel>
            <FieldContent>
              <Select value={form.status} onValueChange={v => handleChange("status", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  {["PO Received"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
