"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import debounce from "lodash/debounce";

interface POTrackingAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  userId: string; // current user ID
  isEditMode?: boolean;
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

interface Company {
  id: string;
  company_name: string;
  contact_number: string;
  contact_person: string;
}

export const POTrackingAddDialog: React.FC<POTrackingAddDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  userId,
}) => {
  const [form, setForm] = useState({
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
    remarks: "PO Received",
  });

  const [contactNumbers, setContactNumbers] = useState<string[]>([""]);
  const [referenceId, setReferenceId] = useState<string>("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [errorCompanies, setErrorCompanies] = useState<string | null>(null);

  const companiesFetched = useRef(false);

  // Fetch reference ID for current user
  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/user?id=${encodeURIComponent(userId)}`);
        if (!response.ok) throw new Error("Failed to fetch user data");
        const data = await response.json();
        setReferenceId(data.ReferenceID || "");
        toast.success("User data loaded successfully!");
      } catch (err) {
        console.error("Error fetching user data:", err);
        toast.error("Failed to load user info");
      }
    };

    fetchUserData();
  }, [userId]);

  const fetchCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    setErrorCompanies(null);
    try {
      const res = await fetch("/api/com-fetch-po-company", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch companies");
      const data = await res.json();
      setCompanies(data.data || []);
    } catch (error: any) {
      setErrorCompanies(error.message || "Error fetching companies");
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
    }
  }, [isOpen, fetchCompanies]);

  useEffect(() => {
    if (!isOpen || companiesFetched.current) return;

    companiesFetched.current = true;
    fetchCompanies();
  }, [isOpen, fetchCompanies]);


  const handleCompanyChange = (selectedCompanyName: string) => {
    // Hanapin yung company object base sa company_name
    const selectedCompany = companies.find(c => c.company_name === selectedCompanyName);

    if (selectedCompany) {
      setForm((prev) => ({
        ...prev,
        company_name: selectedCompany.company_name,
        customer_name: selectedCompany.contact_person || "",
      }));

      // Assume contact_number is a string, pwede multiple separated by delimiter kung gusto mo i-split
      const contacts = selectedCompany.contact_number
        ? selectedCompany.contact_number.split("/").map(num => num.trim())
        : [""];

      setContactNumbers(contacts.length > 0 ? contacts : [""]);
    } else {
      // Kung walang company selected, reset
      setForm((prev) => ({
        ...prev,
        company_name: "",
        customer_name: "",
      }));
      setContactNumbers([""]);
    }
  };

  const handleChange = (key: string, value: any) => {
    if (key === "company_name") {
      setForm((prev) => ({ ...prev, company_name: value }));
    } else {
      setForm((prev) => ({ ...prev, [key]: value }));
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const contactNumberString = contactNumbers
      .map((n) => n.trim())
      .filter(Boolean)
      .join(" / ");

    const payload = {
      ...form,
      referenceid: referenceId,
      contact_number: contactNumberString,
      so_date: form.so_date
        ? format(new Date(form.so_date), "MM/dd/yyyy hh:mm aa")
        : "",
      payment_date: form.payment_date
        ? format(new Date(form.payment_date), "MM/dd/yyyy hh:mm aa")
        : "",
      delivery_pickup_date: form.delivery_pickup_date
        ? format(new Date(form.delivery_pickup_date), "MM/dd/yyyy hh:mm aa")
        : "",
    };

    try {
      const res = await fetch("/api/po-add-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add PO record");

      toast.success("Purchase Order added successfully");
      onSave?.(data);
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Something went wrong");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="overflow-auto p-6 space-y-6 max-w-md">
        <SheetHeader>
          <SheetTitle>Add Purchase Order</SheetTitle>
          <SheetDescription>
            This will save directly to the PO MongoDB collection.
          </SheetDescription>
        </SheetHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <Field>
            <FieldLabel htmlFor="company_name">Company</FieldLabel>
            <FieldContent>
              {loadingCompanies ? (
                <p>Loading companies...</p>
              ) : errorCompanies ? (
                <p className="text-red-500">{errorCompanies}</p>
              ) : (
                <Select
                  value={form.company_name}
                  onValueChange={handleCompanyChange}
                >
                  <SelectTrigger id="company_name" aria-label="Select Company" className="w-full">
                    <SelectValue placeholder="Select Company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.company_name} className="cursor-pointer">
                        {company.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

              )}
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
                      className="cursor-pointer"
                    >
                      −
                    </Button>
                  </div>
                ))}
                <Button variant="secondary" type="button" onClick={addContactField} className="cursor-pointer">
                  + Add another number
                </Button>
              </div>
            </FieldContent>
          </Field>

          {/* The rest of the form fields */}
          <Field>
            <FieldLabel>PO Number</FieldLabel>
            <FieldContent>
              <Input
                value={form.po_number}
                onChange={(e) => handleChange("po_number", e.target.value)}
                className="uppercase"
                required
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Amount</FieldLabel>
            <FieldContent>
              <Input
                value={form.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>SO Number</FieldLabel>
            <FieldContent>
              <Input
                value={form.so_number}
                onChange={(e) => handleChange("so_number", e.target.value)}
                className="uppercase"
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>SO Date</FieldLabel>
            <FieldContent>
              <Input
                type="date"
                value={form.so_date}
                onChange={(e) => handleChange("so_date", e.target.value)}
                className="cursor-pointer"
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Sales Agent</FieldLabel>
            <FieldContent>
              <Select
                value={form.sales_agent}
                onValueChange={(v) => handleChange("sales_agent", v)}
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Select Agent" />
                </SelectTrigger>
                <SelectContent>
                  {SALES_AGENTS.map((agent) => (
                    <SelectItem key={agent} value={agent}>
                      {agent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Payment Terms</FieldLabel>
            <FieldContent>
              <Select
                value={form.payment_terms}
                onValueChange={(v) => handleChange("payment_terms", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Payment Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="30 Days Terms">30 Days Terms</SelectItem>
                  <SelectItem value="Bank Deposit">Bank Deposit</SelectItem>
                  <SelectItem value="Dated Check">Dated Check</SelectItem>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Payment Date</FieldLabel>
            <FieldContent>
              <Input
                type="date"
                value={form.payment_date}
                onChange={(e) => handleChange("payment_date", e.target.value)}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Delivery / Pick-Up Date</FieldLabel>
            <FieldContent>
              <Input
                type="date"
                value={form.delivery_pickup_date}
                onChange={(e) => handleChange("delivery_pickup_date", e.target.value)}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Source</FieldLabel>
            <FieldContent>
              <Select
                value={form.source}
                onValueChange={(v) => handleChange("source", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CS Email">CS Email</SelectItem>
                  <SelectItem value="Sales Email">Sales Email</SelectItem>
                  <SelectItem value="Sales Agent">Sales Agent</SelectItem>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>Status</FieldLabel>
            <FieldContent>
              <Select
                value={form.remarks}
                onValueChange={(v) => handleChange("remarks", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PO Received">PO Received</SelectItem>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" className="cursor-pointer">Save Record</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
