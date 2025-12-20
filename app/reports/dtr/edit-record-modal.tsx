"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
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
    endorsed_date: null,
    closed_date: null,
    contactNumbers: [""],
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
        endorsed_date: record.endorsed_date ? new Date(record.endorsed_date) : null,
        closed_date: record.closed_date ? new Date(record.closed_date) : null,
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
        contact_number: form.contactNumbers.map((n: string) => n.trim()).filter(Boolean).join(" / "),
        endorsed_date: form.endorsed_date ? format(form.endorsed_date, "MM/dd/yyyy hh:mm aa") : "",
        closed_date: form.closed_date ? format(form.closed_date, "MM/dd/yyyy hh:mm aa") : "",
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg w-[600px] max-h-[90vh] overflow-auto p-6 space-y-4">
        <h2 className="text-xl font-semibold mb-2">Edit D-Tracking Record</h2>

        <div className="space-y-4">
          <div>
            <Label>Company</Label>
            <Input name="company_name" value={form.company_name} onChange={handleChange} />
          </div>

          <div>
            <Label>Customer Name</Label>
            <Input name="customer_name" value={form.customer_name} onChange={handleChange} />
          </div>

          <div>
            <Label>Contact Number</Label>
            <div className="space-y-2">
              {form.contactNumbers.map((num: string, idx: number) => (
                <div key={idx} className="flex gap-2 items-center">
                  <PhoneInput
                    country={"ph"}
                    value={num}
                    onChange={(value, _, __, formattedValue) => {
                      let finalValue = formattedValue;
                      if (!finalValue.startsWith("+")) finalValue = "+63 " + finalValue;
                      handleContactChange(idx, finalValue);
                    }}
                    inputProps={{ name: `contact_number_${idx}`, required: true }}
                    inputStyle={{ width: "100%" }}
                  />
                  <Button variant="outline" onClick={() => removeContactField(idx)}>−</Button>
                </div>
              ))}
              <Button variant="secondary" onClick={addContactField}>+ Add another number</Button>
            </div>
          </div>

          <div>
            <Label>Ticket Type</Label>
            <select
              name="ticket_type"
              value={form.ticket_type}
              onChange={handleChange}
              className="w-full border rounded p-2"
            >
              <option value="">Select Ticket Type</option>
              {["After Sales","Complaint","Documentation","Follow Up","Pricing","Product","Technical"].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Ticket Concern</Label>
            <select
              name="ticket_concern"
              value={form.ticket_concern}
              onChange={handleChange}
              className="w-full border rounded p-2"
            >
              <option value="">Select Ticket Concern</option>
              {["Accreditation Request","Delivery/Pickup","Dialux","Documents","Job Request","Payment","Product Certificate","Product Recommendation","Product Testing","Quotation","Refund","Replacement","Replacement To Supplier","Repair","Shop Drawing","Site Visit","SPF","TDS","Wrong Order"].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Department</Label>
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              className="w-full border rounded p-2"
            >
              <option value="">Select Department</option>
              {["Accounting","E-commerce","Engineering","Human Resources","Marketing","Procurement","Sales","Warehouse"].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Sales Agent</Label>
            <select
              name="sales_agent"
              value={form.sales_agent}
              onChange={handleChange}
              className="w-full border rounded p-2"
            >
              <option value="">Select Agent</option>
              {["Airish Echanes","Alvin Estor","Alvin Perez","Banjo Lising","Candy Notob","Christopher Acierto","Connie Doroja","Cristy Bobis","Dane Ariane Delute","Dionisio Duyugan","Elaine Soroan","Erwin Jr Laude","Ferdy Navarro","Gene Mark Roxas","Gretchel Ann Aquino","Jeffrey Lacson","Jennifer Dela Cruz","John Jeffrey Puying","Jonna Clarin","Joy Merel Soriente","Jude Francinni Tan","Khay Yango","Kurt Narrem Guangco","Lotty De Guzman","Maricar Magdaong","Mark Villagonzalo","Michale Quijano","Neil Vincent Jarabejo","Norman Maranga","Paula Caugiran","Rafael Bayani","Raymart Binondo","Reggie Nocete","Ria Lyn Francisco","Richard Esteban","Rodelyn Abrea","Rodelio Ico Jean Dela Cerna","Rodney Mendoza","Roselyn Barnes","Ruby Del Rosario","Sherilyn Rapote","Shane Rey Santos","Venzross Posadas","Vine Ortiz"].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>TSM</Label>
            <select
              name="tsm"
              value={form.tsm}
              onChange={handleChange}
              className="w-full border rounded p-2"
            >
              <option value="">Select Manager</option>
              {["Airish Echanes","Angie Baldugo","Betty Rodriguez","Dave Catausan","Jerry Abaluyan","Karlie Garcia","Ma. Ria Felizmena","Mark Pacis","Maricris Mercado","Mona Liza Torino","Olive Milano","Paula Cauguiran","Roy Tayuman","Ronald Dela Cueva","Sette Hosena"].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Status</Label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border rounded p-2"
            >
              <option value="">Select Status</option>
              {["Open","Closed"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Nature of Concern</Label>
            <Textarea
              name="nature_of_concern"
              value={form.nature_of_concern}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label>Remarks</Label>
            <Textarea
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label>Endorsed Date</Label>
            <DatePicker
              selected={form.endorsed_date}
              onChange={(date: Date | null) => setForm((prev: any) => ({ ...prev, endorsed_date: date }))}
              showTimeSelect
              timeFormat="hh:mm aa"
              timeIntervals={15}
              dateFormat="MM/dd/yyyy hh:mm aa"
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <Label>Closed Date</Label>
            <DatePicker
              selected={form.closed_date}
              onChange={(date: Date | null) => setForm((prev: any) => ({ ...prev, closed_date: date }))}
              showTimeSelect
              timeFormat="hh:mm aa"
              timeIntervals={15}
              dateFormat="MM/dd/yyyy hh:mm aa"
              className="w-full border rounded p-2"
            />
          </div>
        </div>

        <div className="pt-4 flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
};
