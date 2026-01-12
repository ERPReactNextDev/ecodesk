"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  referenceid: string;
  onSave: (r: any) => void;
}

export function DepartmentalAddSheet({
  open,
  onClose,
  referenceid,
  onSave,
}: Props) {
  const [saving, setSaving] = useState(false);

const [f, setF] = useState<any>({
  ticket_received_date_and_time: "",
  ticket_endorsed_date_and_time: "",
  type_of_concern: "",
  activity: "",
  company_name: "",
  customer_name: "",
  head_of_department: "",
  agent_name: "",
  so_no: "",
  order_qty: "",
  busted_items: "",
  si_dr_no: "",
  item_code: "",
  item_description: "",
  reason_for_replacement: "",
  purchase_date: "",
  warranty_claims: "",
  warranty_period: "",
  warranty_period_unit: "",

  pullout_address: "",
  pullout_slip_no: "",

  replacement: "",

  technical_assessment: "",
  processed_by: "",
  replacement_status: "",

  date_and_time_repaired: "",
  replacement_slip_no: "",

  replacement_date: "",
  logistics_date: "",

  date_forwarded_to_dispatch: "",
  date_delivered: "",

  pending_days: "",
  status: "",

  replacement_remarks: "",

  jr_costing_date_and_time: "",
  confirmed_acknowledged_date_and_time: "",
  ticket_closed_date_and_time: "",
});

  const u = (k: string, v: string) => setF((p: any) => ({ ...p, [k]: v }));

  const save = async () => {
if (
  !f.ticket_received_date_and_time ||
  !f.ticket_endorsed_date_and_time ||
  !f.ticket_closed_date_and_time
) {
  return toast.error("Ticket dates are required");
}

    try {
      setSaving(true);
      const r = await fetch("/api/departmental-csr-save-activity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceid, isActive: true, ...f }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast.success("Saved");
      onSave({ _id: d.insertedId, referenceid, ...f });
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 border-b">
            <SheetTitle>Departmental Sheet</SheetTitle>
            <SheetDescription>
              Warehouse, Logistics, Technical & Sales Flow
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* 1–2 TICKET */}
            <Field>
              <FieldLabel>Ticket Received Date and Time</FieldLabel>
              <FieldContent>
              <Input
                type="datetime-local"
                value={f.ticket_received_date_and_time}
                onChange={(e) =>
                  u("ticket_received_date_and_time", e.target.value)
                }
              />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Ticket Endorsed Date and Time</FieldLabel>
              <FieldContent>
                <Input
                  type="datetime-local"
                  value={f.ticket_endorsed_date_and_time}
                  onChange={(e) =>
                    u("ticket_endorsed_date_and_time", e.target.value)
                  }
                />
              </FieldContent>
            </Field>

            {/* 3 TYPE OF CONCERN */}
            <Field>
              <FieldLabel>Type of Concern</FieldLabel>
              <Select
                value={f.type_of_concern}
                onValueChange={(v) => u("type_of_concern", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "After Sales",
                    "Refund",
                    "Follow Up",
                    "Credit Term Application",
                    "External Complaint",
                    "Internal Complaint",
                    "Job Request",
                    "Site Visit",
                    "TDS",
                    "IT Support",
                    "Supplier Accreditation",
                    "Freight Cost",
                  ].map((x) => (
                    <SelectItem key={x} value={x}>
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* 4 ACTIVITY */}
            <Field>
              <FieldLabel>Activity</FieldLabel>
              <Select
                value={f.activity}
                onValueChange={(v) => u("activity", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select activity" />
                </SelectTrigger>

                <SelectContent className="max-h-[400px] overflow-y-auto">
                  {[
                    "Shipping Cost",
                    "Site Visit",
                    "Shop Drawing (Lamp Post in Our Product Line-Up)",

                    "Product Recommendation / Counter Offer / SPF Review / Product Certificate (1–10 SKU)",
                    "Product Recommendation / Counter Offer / SPF Review / Product Certificate (11–20 SKU)",
                    "Product Recommendation / Counter Offer / SPF Review / Product Certificate (21–30 SKU)",
                    "Product Recommendation / Counter Offer / SPF Review / Product Certificate (31–40 SKU)",
                    "Product Recommendation / Counter Offer / SPF Review / Product Certificate (41–50 SKU)",

                    "Product Certificate",
                    "TDS, Installation Manuals, Actual Product Image (Not in the Compilation)",

                    "Installation Costing (In-House) – Rewiring",
                    "Installation Costing (In-House) – Residential",
                    "Installation Costing (In-House / Project) – Commercial",

                    "Dialux Request (100–300 SQM)",
                    "Dialux Request (301–500 SQM)",
                    "Dialux Request (501–1000 SQM)",
                    "Dialux Request (Above 1,001 SQM)",

                    "Replacement",
                    "Product Samples Requests",
                    "Delivery",

                    "SPF Costing",
                    "SPF Order",

                    "Final JR Costing",
                    "Refund",
                    "Advance SI / SI Concerns",
                    "Request SO",
                    "Walk-in SO",
                    "Accreditation",
                    "Credit Terms Application",
                    "Bid Docs Preparation",

                    "IT Support",
                    "After-Sales",
                  ].map((x) => (
                    <SelectItem key={x} value={x}>
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* 5–6 COMPANY */}
            <Field>
              <FieldLabel>Company Name</FieldLabel>
              <FieldContent>
                <Input
                  value={f.company_name}
                  onChange={(e) => u("company_name", e.target.value)}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Customer Name</FieldLabel>
              <FieldContent>
                <Input
                  value={f.customer_name}
                  onChange={(e) => u("customer_name", e.target.value)}
                />
              </FieldContent>
            </Field>

            {/* Head of Department */}
            <Field>
              <FieldLabel>Head of Department</FieldLabel>
              <Select
                value={f.head_of_department}
                onValueChange={(v) => u("head_of_department", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Head of Department" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {[
                    "Angie Baldugo",
                    "Jerry Abaluyan",
                    "Ronald Dela Cueva",
                    "Roy Tayuman",
                    "Robert Gonzales",
                    "Riza Felizmena",
                    "Mark Pacis",
                    "John Malco",
                    "Sette Hosena",
                    "Karlie Garcia",
                    "Albert Sabido",
                    "Betty Rodriguez – CS",
                    "Dave Catusan",
                    "Jonathan Joseph Dumaual",
                    "Grecyl da Mamungay",
                    "Jomelee Merencillo",
                    "Olive Miñano",
                    "Maricris Mercado",
                    "Jonathan Vinoya",
                    "Mona Torino",
                    "Betty Rodriguez – Sales",
                    "Leizl Velado",
                  ].map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Agent Name */}
            <Field>
              <FieldLabel>Agent Name</FieldLabel>
              <Select
                value={f.agent_name}
                onValueChange={(v) => u("agent_name", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Agent" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {[
                    "Lotty Deguzman",
                    "Joseph Candazo",
                    "Cristy Bobis",
                    "Ansley Patelo",
                    "Jeff Puying",
                    "Vincent Ortiz",
                    "Wilna Eardeloso",
                    "Sherilyn Rapote",
                    "Michael Quijano",
                    "Erwin Laude",
                    "Banjo Lising",
                    "Jeffrey Lacson",
                    "Gene Mark Roxas",
                    "Dionisio Doyugan",
                    "Gretchell Aquino",
                    "Myla Tindugan",
                    "Jonna Clarin",
                    "Rodelio Ico",
                    "Rodolfo Delizo",
                    "Mark Villagonzalo",
                    "Rechel Racaza",
                    "Khay Yango",

                    "Kurt Guangco",
                    "Cris Acierto",
                    "Roselyn Barnes",
                    "Jean Dela Cerna",
                    "Joy Meriel Soriente",
                    "Agnes Panopio",
                    "Candy Notob",
                    "Rodney Mendoza",
                    "Alvin Estor",
                    "Jevan Gempesaw Pinero",
                    "Alvin Perez",
                    "Raymart Binondo",
                    "Che Gumapac",
                    "Ma. Coniel L. Doroja",
                    "Rialyn Francisco",
                    "Rafael Bayani",
                  ].map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* SO # */}
            <Field>
              <FieldLabel>SO #</FieldLabel>
              <FieldContent>
                <Input
                  value={f.so_no}
                  onChange={(e) => u("so_no", e.target.value)}
                />
              </FieldContent>
            </Field>

            {/* Order Qty */}
            <Field>
              <FieldLabel>Order Qty</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={f.order_qty}
                  onChange={(e) => u("order_qty", e.target.value)}
                />
              </FieldContent>
            </Field>

            {/* No. of Busted Item */}
            <Field>
              <FieldLabel>No. of Busted Item</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={f.busted_items}
                  onChange={(e) => u("busted_items", e.target.value)}
                />
              </FieldContent>
            </Field>

            {/* SI / DR No. */}
            <Field>
              <FieldLabel>SI / DR No.</FieldLabel>
              <FieldContent>
                <Input
                  value={f.si_dr_no}
                  onChange={(e) => u("si_dr_no", e.target.value)}
                />
              </FieldContent>
            </Field>

            {/* PRODUCT */}
            <Field>
              <FieldLabel>Item Code</FieldLabel>
              <FieldContent>
                <Input
                  value={f.item_code}
                  onChange={(e) => u("item_code", e.target.value)}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Item Description</FieldLabel>
              <FieldContent>
                <Input
                  value={f.item_description}
                  onChange={(e) => u("item_description", e.target.value)}
                />
              </FieldContent>
            </Field>

            {/* Reason for Replacement */}
            <Field>
              <FieldLabel>Reason for Replacement</FieldLabel>
              <Select
                value={f.reason_for_replacement}
                onValueChange={(v) => u("reason_for_replacement", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Busted">Busted</SelectItem>
                  <SelectItem value="Defected">Defected</SelectItem>
                  <SelectItem value="For Warranty Claim">
                    For Warranty Claim
                  </SelectItem>
                  <SelectItem value="Wrong Item Delivered">
                    Wrong Item Delivered
                  </SelectItem>
                  <SelectItem value="Missing Accessories">
                    Missing Accessories
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* Replacement + Logistics */}
            <Field>
              <FieldLabel>Purchase</FieldLabel>
              <FieldContent>
                <Input
                  type="datetime-local"
                  value={f.replacement}
                  onChange={(e) => u("replacement", e.target.value)}
                />
              </FieldContent>
            </Field>

            {/* No. of Warranty Claims */}
            <Field>
              <FieldLabel>No. of Warranty Claims</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={f.warranty_claims}
                  onChange={(e) => u("warranty_claims", e.target.value)}
                />
              </FieldContent>
            </Field>

            {/* Warranty Period */}
            <Field>
              <FieldLabel>Warranty Period</FieldLabel>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  step={1}
                  className="w-1/2"
                  value={f.warranty_period}
                  onChange={(e) => u("warranty_period", e.target.value)}
                />

                <Select
                  value={f.warranty_period_unit || ""}
                  onValueChange={(v) => u("warranty_period_unit", v)}
                >
                  <SelectTrigger className="w-1/2">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Days">Days</SelectItem>
                    <SelectItem value="Months">Months</SelectItem>
                    <SelectItem value="Years">Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Field>

            {/* Pull-out / Delivery Address */}
            <Field>
              <FieldLabel>Pull-out / Delivery Address</FieldLabel>
              <FieldContent>
                <Input
                  value={f.pullout_address}
                  onChange={(e) => u("pullout_address", e.target.value)}
                  placeholder="Enter pull-out or delivery address"
                />
              </FieldContent>
            </Field>

            {/* Pull-out Slip No. */}
            <Field>
              <FieldLabel>Pull-out Slip No.</FieldLabel>
              <FieldContent>
                <Input
                  value={f.pullout_slip_no}
                  onChange={(e) => u("pullout_slip_no", e.target.value)}
                  placeholder="Enter pull-out slip number"
                />
              </FieldContent>
            </Field>

            {/* DATE AND TIME FORWARDED TO LOGISTICS */}
            <Field>
              <FieldLabel>Date and Time Forwarded to Logistics</FieldLabel>
              <FieldContent>
                <Input
                  type="datetime-local"
                  value={f.logistics_date}
                  onChange={(e) => u("logistics_date", e.target.value)}
                />
              </FieldContent>
            </Field>

            {/* DATE AND TIME PULLED OUT / OVERTURNED */}
            <Field>
              <FieldLabel>Date and Time Pulled Out / Overturned</FieldLabel>
              <FieldContent>
                <Input
                  type="datetime-local"
                  value={f.replacement_date}
                  onChange={(e) => u("replacement_date", e.target.value)}
                />
              </FieldContent>
            </Field>


            {/* Technical */}
            <Field>
              <FieldLabel>Technical Assessment</FieldLabel>
              <Select
                value={f.technical_assessment}
                onValueChange={(v) => u("technical_assessment", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Repairable">Repairable</SelectItem>
                  <SelectItem value="Non-Repairable">Non-Repairable</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* Processed By */}
            <Field>
              <FieldLabel>Processed By</FieldLabel>
              <Select
                value={f.processed_by}
                onValueChange={(v) => u("processed_by", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Advincula, Jelo Atanacio",
                    "Ambayec, Maria Cherryllyn Entea",
                    "Argame, Gerrel John Mercado",
                    "Austero, Chester Alan Guerrero",
                    "Binondo, Raymart Alforte",
                    "Caballero, Gregg Y Fabe",
                    "Cabrillas, Kemmar Berdin",
                    "Cahibayayan, Aireen Lopez",
                    "Carlos, Diana Rose Amorozca",
                    "Capaco, Mishael Angela Jareno",
                    "Catausan, Dave Ian Glorioso",
                    "Dorola, Ma. Conie Loquiente",
                    "Foronda, Michael Aquino",
                    "Francisco, Rianly Lacson",
                    "Gevero, Joel Julius Baruc",
                    "Gianan, Maria Therese",
                    "Jarabejo, Neil Vincent",
                    "Jungaya, Jayson Bello",
                    "Llarena, Marie Luz Sera Jose",
                    "Mallapre, John Lloyd Prellgera",
                    "Maranga, Norman Enanoria",
                    "Menor, Bryan Narciso",
                    "Nabales, Ronald Hangor",
                    "Navarro, Ferdy Pasaand",
                    "Nocete, Reggie Arnaod",
                    "Paler, Jemarie Kent",
                    "Pangilinan, Hazel Ann Ladores",
                    "Perez, Alvin Cavaling",
                    "Picao, Katherine Aguja",
                    "Sabido, Albert Ferdinand Pancito",
                    "Tan, Jude Francinni Castro",
                    "Tindugan, Myla Somido",
                    "Abadilla, Jun Buerac Castillo",
                    "Abulayan, Jerry Reyes",
                    "Acierto, Christopher Angeles",
                    "Adalin, Dave Mark Pajo",
                    "Allequer, Dennis Sullano",
                    "Andres, Elselita Pangan",
                    "Antoni, Kimberly Mae Distor",
                  ].map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Replacement Status */}
            <Field>
              <FieldLabel>Replacement Status</FieldLabel>
              <Select
                value={f.replacement_status}
                onValueChange={(v) => u("replacement_status", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select replacement status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Good Unit">Good Unit</SelectItem>
                  <SelectItem value="Repaired">Repaired</SelectItem>
                  <SelectItem value="Replacement New">
                    Replacement New
                  </SelectItem>
                  <SelectItem value="Kaliwaan">Kaliwaan</SelectItem>
                  <SelectItem value="Non Repairable">Non Repairable</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* Remaining */}
            {[["Date and Time Repaired", "date_and_time_repaired"]].map(([l, k]) => (
              <Field key={k}>
                <FieldLabel>{l}</FieldLabel>
                <FieldContent>
                  <Input
                    type="datetime-local"
                    value={f[k]}
                    onChange={(e) => u(k, e.target.value)}
                  />
                </FieldContent>
              </Field>
            ))}

            {/* Replacement Slip No. (numeric) */}
            <Field>
              <FieldLabel>Replacement Slip No.</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={f.replacement_slip_no}
                  onChange={(e) => u("replacement_slip_no", e.target.value)}
                />
              </FieldContent>
            </Field>

{/* DATE AND TIME FORWARDED TO DISPATCH */}
<Field>
  <FieldLabel>Date and Time Forwarded to Dispatch</FieldLabel>
  <FieldContent>
    <Input
      type="datetime-local"
      value={f.date_forwarded_to_dispatch}
      onChange={(e) => u("date_forwarded_to_dispatch", e.target.value)}
    />
  </FieldContent>
</Field>

{/* DATE AND TIME DELIVERED */}
<Field>
  <FieldLabel>Date and Time Delivered</FieldLabel>
  <FieldContent>
    <Input
      type="datetime-local"
      value={f.date_delivered}
      onChange={(e) => u("date_delivered", e.target.value)}
    />
  </FieldContent>
</Field>

{/* EXTRA PENDING DAYS */}
<Field>
  <FieldLabel>Pending Days</FieldLabel>
  <FieldContent>
    <Input
      type="number"
      min={0}
      step={1}
      value={f.pending_days}
      onChange={(e) => u("pending_days", e.target.value)}
    />
  </FieldContent>
</Field>

{/* STATUS */}
<Field>
  <FieldLabel>Status</FieldLabel>
  <Select
    value={f.status}
    onValueChange={(v) => u("status", v)}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="CLOSED">CLOSED</SelectItem>
      <SelectItem value="CANCELLED">CANCELLED</SelectItem>
      <SelectItem value="IN PROCESS">IN PROCESS</SelectItem>
      <SelectItem value="FOR DELIVERY">FOR DELIVERY</SelectItem>
      <SelectItem value="FOR APPROVAL">FOR APPROVAL</SelectItem>
      <SelectItem value="FOR PULL OUT">FOR PULL OUT</SelectItem>
      <SelectItem value="FOR OCCULAR">FOR OCCULAR</SelectItem>
      <SelectItem value="FOR ASSESSMENT">FOR ASSESSMENT</SelectItem>
    </SelectContent>
  </Select>
</Field>

            {[
                ["Replacement Remarks", "replacement_remarks"],
                ["JR Costing Date and Time", "jr_costing_date_and_time"],
                ["Confirmed Acknowledged Date and Time", "confirmed_acknowledged_date_and_time"],
                ["Ticket Closed Date and Time", "ticket_closed_date_and_time"],
              ].map(([l, k]) => (
              <Field key={k}>
                <FieldLabel>{l}</FieldLabel>
                <FieldContent>
                  <Input
                    type={
                      k.includes("date") ||
                      k === "ticket_closed" ||
                      k === "jr_costing" ||
                      k === "confirmed_acknowledged"
                        ? "datetime-local"
                        : "text"
                    }
                    value={f[k]}
                    onChange={(e) => u(k, e.target.value)}
                  />
                </FieldContent>
              </Field>
            ))}
          </div>

          <div className="border-t p-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Confirm"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
