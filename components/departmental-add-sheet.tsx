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
    ticket_received: "",
    ticket_endorsed: "",
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
    pullout_address: "",
    pullout_slip_no: "",
    replacement: "",
    logistics: "",
    technical_assessment: "",
    processed_by: "",
    replacement_status: "",
    technical_date: "",
    replacement_slip_no: "",
    replacement_date: "",
    logistics_date: "",
    pending_days: "",
    status: "",
    replacement_remarks: "",
    jr_costing: "",
    ticket_closed: "",
  });

  const u = (k: string, v: string) =>
    setF((p: any) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.ticket_received || !f.ticket_endorsed || !f.ticket_closed)
      return toast.error("Ticket dates are required");

    try {
      setSaving(true);
      const r = await fetch("/api/departmental-save-activity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceid, ...f }),
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
              <FieldLabel>Ticket Received</FieldLabel>
              <FieldContent>
                <Input
                  type="datetime-local"
                  value={f.ticket_received}
                  onChange={(e) => u("ticket_received", e.target.value)}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Ticket Endorsed</FieldLabel>
              <FieldContent>
                <Input
                  type="datetime-local"
                  value={f.ticket_endorsed}
                  onChange={(e) => u("ticket_endorsed", e.target.value)}
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
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[
                    "After Sales","Refund","Follow Up","Credit Term Application",
                    "External Complaint","Internal Complaint","Job Request",
                    "Site Visit","TDS","IT Support","Supplier Accreditation","Freight Cost"
                  ].map(x => (
                    <SelectItem key={x} value={x}>{x}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* 4 ACTIVITY */}
            <Field>
              <FieldLabel>Activity</FieldLabel>
              <FieldContent>
                <Input value={f.activity} onChange={(e) => u("activity", e.target.value)} />
              </FieldContent>
            </Field>

            {/* 5–6 COMPANY */}
            <Field>
              <FieldLabel>Company Name</FieldLabel>
              <FieldContent>
                <Input value={f.company_name} onChange={(e) => u("company_name", e.target.value)} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Customer Name</FieldLabel>
              <FieldContent>
                <Input value={f.customer_name} onChange={(e) => u("customer_name", e.target.value)} />
              </FieldContent>
            </Field>

            {/* 7–12 SALES */}
            {[
              ["Head of Department","head_of_department"],
              ["Agent Name","agent_name"],
              ["SO #","so_no"],
              ["Order Qty","order_qty"],
              ["No. of Busted Item","busted_items"],
              ["SI / DR No.","si_dr_no"],
            ].map(([l,k])=>(
              <Field key={k}>
                <FieldLabel>{l}</FieldLabel>
                <FieldContent>
                  <Input value={f[k]} onChange={(e)=>u(k,e.target.value)} />
                </FieldContent>
              </Field>
            ))}

            {/* PRODUCT */}
            {[
              ["Item Code","item_code"],
              ["Item Description","item_description"],
              ["Reason for Replacement","reason_for_replacement"],
              ["Purchase Date","purchase_date"],
              ["Warranty Claims","warranty_claims"],
              ["Warranty Period","warranty_period"],
              ["Pull Out / Delivery Address","pullout_address"],
              ["Pull Out Slip No.","pullout_slip_no"],
            ].map(([l,k])=>(
              <Field key={k}>
                <FieldLabel>{l}</FieldLabel>
                <FieldContent>
                  <Input value={f[k]} onChange={(e)=>u(k,e.target.value)} />
                </FieldContent>
              </Field>
            ))}

            {/* Replacement + Logistics */}
            <Field>
              <FieldLabel>Replacement</FieldLabel>
              <FieldContent>
                <Input type="datetime-local" value={f.replacement} onChange={(e)=>u("replacement",e.target.value)} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Logistics</FieldLabel>
              <FieldContent>
                <Input type="datetime-local" value={f.logistics} onChange={(e)=>u("logistics",e.target.value)} />
              </FieldContent>
            </Field>

            {/* Technical */}
            <Field>
              <FieldLabel>Technical Assessment</FieldLabel>
              <Select value={f.technical_assessment} onValueChange={(v)=>u("technical_assessment",v)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Repairable">Repairable</SelectItem>
                  <SelectItem value="Non-Repairable">Non-Repairable</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* Processed By */}
            <Field>
            <FieldLabel>Processed By</FieldLabel>
            <Select value={f.processed_by} onValueChange={(v) => u("processed_by", v)}>
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
            <FieldContent>
                <Input
                value={f.replacement_status}
                onChange={(e) => u("replacement_status", e.target.value)}
                />
            </FieldContent>
            </Field>


            {/* Remaining */}
            {[
              ["Technical Date","technical_date"],
              ["Replacement Slip No.","replacement_slip_no"],
              ["Replacement Date","replacement_date"],
              ["Logistics Date","logistics_date"],
              ["Pending Days","pending_days"],
              ["Status","status"],
              ["Replacement Remarks","replacement_remarks"],
              ["JR Costing","jr_costing"],
              ["Ticket Closed","ticket_closed"],
            ].map(([l,k])=>(
              <Field key={k}>
                <FieldLabel>{l}</FieldLabel>
                <FieldContent>
                  <Input
                    type={k.includes("date") || k==="ticket_closed" || k==="jr_costing" ? "datetime-local" : "text"}
                    value={f[k]}
                    onChange={(e)=>u(k,e.target.value)}
                  />
                </FieldContent>
              </Field>
            ))}

          </div>

          <div className="border-t p-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Confirm"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
