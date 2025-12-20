"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
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
    if (!account?.id) {
      alert("Account id is missing. Cannot save.");
      return;
    }
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
          address: address,
          industry: industry,
          type_client: account.type_client,
          status: account.status,
          company_group: account.company_group,
          date_updated: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to update");

      onSave(data.data);
      onClose();
      toast.success("Account successfully updated!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent
        style={{ maxWidth: "60vw", width: "50vw" }}
        className="mx-auto rounded-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>
            Update the information below and click save.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <FieldSet disabled={loading}>
            <FieldGroup className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field>
                <FieldLabel htmlFor="companyName">Company Name</FieldLabel>
                <FieldContent>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </FieldContent>
                <FieldDescription>
                  Enter the company or business name.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="contactPerson">Contact Person</FieldLabel>
                <FieldContent>
                  <Input
                    id="contactPerson"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                  />
                </FieldContent>
                <FieldDescription>
                  Name of the main contact person.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="contactNumber">Contact Number</FieldLabel>
                <FieldContent>
                  <Input
                    id="contactNumber"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                  />
                </FieldContent>
                <FieldDescription>Phone or mobile number.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="emailAddress">Email Address</FieldLabel>
                <FieldContent>
                  <Input
                    id="emailAddress"
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                  />
                </FieldContent>
                <FieldDescription>Contact email address.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="address">Address</FieldLabel>
                <FieldContent>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </FieldContent>
                <FieldDescription>Physical address or location.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="industry">Industry</FieldLabel>
                <FieldContent>
                  <Input
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </FieldContent>
                <FieldDescription>Industry classification.</FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => !loading && onClose()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
