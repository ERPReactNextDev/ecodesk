"use client";

import React, { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FieldGroup,
  FieldSet,
  FieldLabel,
} from "@/components/ui/field";
import type { ActivityFormState } from "@/hooks/useActivityForm";

interface TicketFormStep1Props {
  state: ActivityFormState;
  setField: <K extends keyof ActivityFormState>(
    field: K,
    value: ActivityFormState[K]
  ) => void;
  contactPersonActions: {
    add: () => void;
    remove: (index: number) => void;
    update: (index: number, field: "title" | "name", value: string) => void;
  };
  contactNumberActions: {
    add: () => void;
    remove: (index: number) => void;
    update: (index: number, value: string) => void;
  };
  emailAddressActions: {
    add: () => void;
    remove: (index: number) => void;
    update: (index: number, value: string) => void;
  };
}

const TicketFormStep1 = memo(function TicketFormStep1({
  state,
  setField,
  contactPersonActions,
  contactNumberActions,
  emailAddressActions,
}: TicketFormStep1Props) {
  const handleCompanyNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setField("companyName", e.target.value.toUpperCase());
    },
    [setField]
  );

  return (
    <div className="space-y-4">
      <FieldGroup>
        <FieldSet>
          <FieldLabel className="font-semibold text-sm">Company Name</FieldLabel>
          <Input
            type="text"
            value={state.companyName}
            onChange={handleCompanyNameChange}
            className="w-full"
          />
        </FieldSet>
      </FieldGroup>

      <FieldGroup>
        <FieldSet className="mt-4">
          <FieldLabel className="font-semibold text-sm">Contact Person</FieldLabel>
          <div className="space-y-2">
            {state.contactPersons.map((person, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Select
                  value={person.title}
                  onValueChange={(value) =>
                    contactPersonActions.update(idx, "title", value)
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mr.">Mr.</SelectItem>
                    <SelectItem value="Mrs.">Mrs.</SelectItem>
                    <SelectItem value="Ms.">Ms.</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  value={person.name}
                  onChange={(e) =>
                    contactPersonActions.update(idx, "name", e.target.value)
                  }
                  className="flex-1"
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => contactPersonActions.remove(idx)}
                  disabled={state.contactPersons.length === 1}
                >
                  −
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="secondary"
              onClick={contactPersonActions.add}
            >
              + Add another person
            </Button>
          </div>
        </FieldSet>
      </FieldGroup>

      <FieldGroup>
        <FieldSet className="mt-4">
          <FieldLabel className="font-semibold text-sm">Contact Number</FieldLabel>
          <div className="space-y-2">
            {state.contactNumbers.map((num, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  value={num}
                  onChange={(e) => contactNumberActions.update(idx, e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => contactNumberActions.remove(idx)}
                  disabled={state.contactNumbers.length === 1}
                >
                  −
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="secondary"
              onClick={contactNumberActions.add}
            >
              + Add another number
            </Button>
          </div>
        </FieldSet>
      </FieldGroup>

      <FieldGroup>
        <FieldSet className="mt-4">
          <FieldLabel className="font-semibold text-sm">Email Address</FieldLabel>
          <div className="space-y-2">
            {state.emailAddresses.map((email, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => emailAddressActions.update(idx, e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => emailAddressActions.remove(idx)}
                  disabled={state.emailAddresses.length === 1}
                >
                  −
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="secondary"
              onClick={emailAddressActions.add}
            >
              + Add another email
            </Button>
          </div>
        </FieldSet>
      </FieldGroup>
    </div>
  );
});

export default TicketFormStep1;
