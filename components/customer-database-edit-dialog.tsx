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
  const [contactPerson, setContactPerson] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [address, setAddress] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account && isOpen) {
      setCompanyName(account.company_name ?? "");
      setContactPerson(account.contact_person ?? "");
      setContactNumber(account.contact_number ?? "");
      setEmailAddress(account.email_address ?? "");
      setAddress(account.address ?? "");
      setIndustry(account.industry ?? "");
    }
  }, [account, isOpen]);

  const handleSave = async () => {
    if (!account?.id) return;

    setLoading(true);
    try {
      const res = await fetch("/api/com-edit-account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: account.id,
          referenceid: account.referenceid,
          company_name: companyName,
          contact_person: contactPerson,
          contact_number: contactNumber,
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
      <SheetContent
        side="right"
        className="w-[420px] max-w-full flex flex-col p-0"
      >
        {/* HEADER */}
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="text-lg font-semibold">
            Edit Account
          </SheetTitle>
        </SheetHeader>

        {/* FORM (SCROLLABLE) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
        >
          <FieldSet disabled={loading} className="space-y-5">
            <Field>
              <FieldLabel>
                Company <span className="text-red-500">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>
                Customer Name <span className="text-red-500">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  required
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>
                Contact Number <span className="text-red-500">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  required
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>
                Email Address <span className="text-red-500">*</span>
              </FieldLabel>
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
              <FieldLabel>
                Address <span className="text-red-500">*</span>
              </FieldLabel>
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

        {/* FOOTER (FIXED) */}
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
