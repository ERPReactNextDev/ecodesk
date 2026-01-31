"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  Field,
  FieldContent,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: any | null;
  onSave: (updated: any) => void;
}

export const CustomerDatabaseEditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  account,
  onSave,
}) => {
  const [companyName, setCompanyName] = useState("");
  const [contactPersons, setContactPersons] = useState<string[]>([""]);
  const [contactNumbers, setContactNumbers] = useState<string[]>([""]);
  const [emailAddress, setEmailAddress] = useState("");
  const [address, setAddress] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);

  /* LOAD DATA */
  useEffect(() => {
    if (account && isOpen) {
      setCompanyName(account.company_name ?? "");

      setContactPersons(
        account.contact_person
          ? account.contact_person.split(" / ").filter(Boolean)
          : [""]
      );

      setContactNumbers(
        account.contact_number && account.contact_number !== "none"
          ? account.contact_number.split(" / ").filter(Boolean)
          : [""]
      );

      setEmailAddress(account.email_address ?? "");
      setAddress(account.address ?? "");
      setIndustry(account.industry ?? "");
    }
  }, [account, isOpen]);

  /* SAVE */
  const handleSave = async () => {
    if (!account?.id) return;

    const joinedPersons = contactPersons
      .map((p) => p.trim())
      .filter(Boolean)
      .join(" / ");

    const joinedNumbers = contactNumbers
      .map((n) => n.trim())
      .filter(Boolean)
      .join(" / ");

    setLoading(true);
    try {
      const res = await fetch("/api/com-edit-account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: account.id,
          referenceid: account.referenceid,
          company_name: companyName,
          contact_person: joinedPersons,
          contact_number: joinedNumbers,
          email_address: emailAddress,
          address,
          industry,
          type_client: account.type_client,
          status: account.status,
          company_group: account.company_group,
          date_updated: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      onSave(data.data);
      onClose();
      toast.success("Account successfully updated");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !account) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && !loading && onClose()}>
      <SheetContent side="right" className="w-[420px] max-w-full flex flex-col p-0">
        {/* HEADER */}
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="text-lg font-semibold">
            Edit Account
          </SheetTitle>
        </SheetHeader>

        {/* FORM */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
        >
          <FieldSet disabled={loading} className="space-y-5">
            <Field>
              <FieldLabel>Company *</FieldLabel>
              <FieldContent>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </FieldContent>
            </Field>

            {/* CUSTOMER NAMES */}
            <Field>
              <FieldLabel>Customer Name *</FieldLabel>
              <div className="space-y-2">
                {contactPersons.map((name, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={name}
                      onChange={(e) => {
                        const updated = [...contactPersons];
                        updated[idx] = e.target.value;
                        setContactPersons(updated);
                      }}
                      className="flex-grow"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (contactPersons.length === 1) return;
                        setContactPersons(contactPersons.filter((_, i) => i !== idx));
                      }}
                    >
                      −
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setContactPersons((p) => [...p, ""])}
                >
                  + Add another name
                </Button>
              </div>
            </Field>

            {/* CONTACT NUMBERS */}
            <Field>
              <FieldLabel>Contact Number *</FieldLabel>
              <div className="space-y-2">
                {contactNumbers.map((num, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={num}
                      onChange={(e) => {
                        const updated = [...contactNumbers];
                        updated[idx] = e.target.value;
                        setContactNumbers(updated);
                      }}
                      className="flex-grow"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (contactNumbers.length === 1) return;
                        setContactNumbers(contactNumbers.filter((_, i) => i !== idx));
                      }}
                    >
                      −
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setContactNumbers((p) => [...p, ""])}
                >
                  + Add another number
                </Button>
              </div>
            </Field>

            <Field>
              <FieldLabel>Email Address *</FieldLabel>
              <FieldContent>
                <Input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  required
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Address *</FieldLabel>
              <FieldContent>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Client Segment</FieldLabel>
              <FieldContent>
                <Input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </FieldContent>
            </Field>
          </FieldSet>
        </form>

        {/* FOOTER */}
        <div className="border-t bg-white px-6 py-4 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-1/2 cursor-pointer"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            className="w-1/2 cursor-pointer"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
