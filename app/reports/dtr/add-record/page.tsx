"use client";

import React, { Suspense, useState, useEffect } from "react";
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { FormatProvider } from "@/contexts/FormatContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// 📌 Add DatePicker imports
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";

// 📌 React Phone Input 2
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

// Dropdown options (alphabetical)
const TICKET_TYPES = [
  "After Sales",
  "Complaint",
  "Documentation",
  "Follow Up",
  "Pricing",
  "Product",
  "Technical",
];

const TICKET_CONCERNS = [
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
];

const DEPARTMENTS = [
  "Accounting",
  "E-commerce",
  "Engineering",
  "Human Resources",
  "Marketing",
  "Procurement",
  "Sales",
  "Warehouse",
];

const SALES_AGENTS = [
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
  "Vine Ortiz",
];

const TSM_MANAGERS = [
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
];

const STATUS_OPTIONS = ["Open", "Closed"];

function AddRecordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId, setUserId } = useUser();

  const [referenceId, setReferenceId] = useState<string>("");
  const [loadingUser, setLoadingUser] = useState(false);

  const [form, setForm] = useState({
    customer_name: "",
    company_name: "",
    ticket_type: "",
    ticket_concern: "",
    department: "",
    endorsed_date: null as Date | null,
    closed_date: null as Date | null,
    sales_agent: "",
    tsm: "",
    status: "",
    nature_of_concern: "",
    remarks: "", 
  });

  // Helper state for multiple phone numbers
  const [contactNumbers, setContactNumbers] = useState<string[]>([""]);

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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

  // Fetch userId
  useEffect(() => {
    const queryUserId = searchParams?.get("id") ?? "";
    if (queryUserId && queryUserId !== userId) {
      setUserId(queryUserId);
    }
  }, [searchParams, userId, setUserId]);

  useEffect(() => {
    if (!userId) return;
    const fetchUserData = async () => {
      setLoadingUser(true);
      try {
        const response = await fetch(`/api/user?id=${encodeURIComponent(userId)}`);
        if (!response.ok) throw new Error("Failed to fetch user data");
        const data = await response.json();
        setReferenceId(data.ReferenceID || "");
      } catch (err) {
        toast.error("Failed to connect to server. Please try again later.");
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUserData();
  }, [userId]);

  const handleSave = async () => {
    try {
      if (!referenceId) {
        toast.error("Reference ID is missing.");
        return;
      }

      const contactNumberString = contactNumbers
        .map((n) => n.trim())
        .filter(Boolean)
        .join(" / ");

      const payload = {
        ...form,
        contact_number: contactNumberString,
        referenceid: referenceId,
        endorsed_date: form.endorsed_date
          ? format(form.endorsed_date, "MM/dd/yyyy hh:mm aa")
          : "",
        closed_date: form.closed_date
          ? format(form.closed_date, "MM/dd/yyyy hh:mm aa")
          : "",
      };

      const res = await fetch("/api/d-tracking-add-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save record");

      toast.success("DTR record added successfully");
      router.push(`/reports/dtr?id=${userId}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <SidebarLeft />

      <SidebarInset className="overflow-hidden">
        <header className="bg-background sticky top-0 flex h-14 items-center gap-2 border-b">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>D-Tracking</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbPage>Add Record</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 overflow-auto">
          <div className="border rounded p-6 space-y-4">
            <h2 className="text-xl font-semibold">Add DTR Record</h2>

            {/* Company */}
            <div>
              <Label>Company</Label>
              <Input name="company_name" value={form.company_name} onChange={handleChange} />
            </div>

            {/* Customer Name */}
            <div>
              <Label>Customer Name</Label>
              <Input name="customer_name" value={form.customer_name} onChange={handleChange} />
            </div>

            {/* Multiple Contact Numbers */}
            <div>
              <Label>Contact Number</Label>
              <div className="space-y-2">
                {contactNumbers.map((num, idx) => (
                  <div key={idx} className="flex gap-2">
                    <PhoneInput
                      country={"ph"} // default country code
                      value={num}
                      onChange={(value, _, e, formattedValue) => {
                        // value = numeric digits only
                        // formattedValue = includes spaces/dashes as user typed
                        let finalValue = formattedValue;
                        // prepend + if missing
                        if (!finalValue.startsWith("+")) {
                          finalValue = "+63 " + finalValue;
                        }
                        handleContactChange(idx, finalValue);
                      }}
                      inputProps={{
                        name: `contact_number_${idx}`,
                        required: true,
                      }}
                      inputStyle={{ width: '100%' }}
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
            </div>

            {/* Ticket Type */}
            <div>
              <Label>Ticket Type</Label>
              <select
                name="ticket_type"
                value={form.ticket_type}
                onChange={handleChange}
                className="w-full border rounded p-2"
              >
                <option value="">Select Ticket Type</option>
                {TICKET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Ticket Concern */}
            <div>
              <Label>Ticket Concern</Label>
              <select
                name="ticket_concern"
                value={form.ticket_concern}
                onChange={handleChange}
                className="w-full border rounded p-2"
              >
                <option value="">Select Ticket Concern</option>
                {TICKET_CONCERNS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <Label>Department</Label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                className="w-full border rounded p-2"
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Sales Agent */}
            <div>
              <Label>Sales Agent</Label>
              <select
                name="sales_agent"
                value={form.sales_agent}
                onChange={handleChange}
                className="w-full border rounded p-2"
              >
                <option value="">Select Agent</option>
                {SALES_AGENTS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* TSM */}
            <div>
              <Label>TSM</Label>
              <select
                name="tsm"
                value={form.tsm}
                onChange={handleChange}
                className="w-full border rounded p-2"
              >
                <option value="">Select Manager</option>
                {TSM_MANAGERS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <Label>Status</Label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border rounded p-2"
              >
                <option value="">Select Status</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Nature of Concern */}
            <div>
              <Label>Nature of Concern</Label>
              <Textarea
                name="nature_of_concern"
                value={form.nature_of_concern}
                onChange={handleChange}
              />
            </div>

            {/* Remarks */}
            <div>
              <Label>Remarks</Label>
              <Textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                placeholder="Enter remarks"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Endorsed Date</Label>
                <DatePicker
                  selected={form.endorsed_date}
                  onChange={(date: Date | null) =>
                    setForm((prev) => ({ ...prev, endorsed_date: date }))
                  }
                  showTimeSelect
                  timeFormat="hh:mm aa"
                  timeIntervals={15}
                  dateFormat="MM/dd/yyyy hh:mm aa"
                  className="w-full"
                  placeholderText="MM/DD/YYYY HH:MM AM/PM"
                />
              </div>
              <div>
                <Label>Closed Date</Label>
                <DatePicker
                  selected={form.closed_date}
                  onChange={(date: Date | null) =>
                    setForm((prev) => ({ ...prev, closed_date: date }))
                  }
                  showTimeSelect
                  timeFormat="hh:mm aa"
                  timeIntervals={15}
                  dateFormat="MM/dd/yyyy hh:mm aa"
                  className="w-full"
                  placeholderText="MM/DD/YYYY HH:MM AM/PM"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <Button variant="outline" onClick={() => router.push(`/reports/dtr?id=${userId}`)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loadingUser}>
                Save Record
              </Button>
            </div>
          </div>
        </main>
      </SidebarInset>

      <SidebarRight
        userId={userId ?? undefined}
        dateCreatedFilterRange={undefined}
        setDateCreatedFilterRangeAction={() => {}}
      />
    </>
  );
}

export default function Page() {
  return (
    <UserProvider>
      <FormatProvider>
        <SidebarProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <AddRecordContent />
          </Suspense>
        </SidebarProvider>
      </FormatProvider>
    </UserProvider>
  );
}
