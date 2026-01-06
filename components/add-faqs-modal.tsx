"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Field,
  FieldContent,
  FieldLabel,
} from "@/components/ui/field";
import { Plus, Minus, Type } from "lucide-react";
import { toast } from "sonner";

interface DescriptionItem {
  subtitle: string;
  description: string;
  showSubtitle: boolean;
}

interface AddFaqsModalProps {
  open: boolean;
  onClose: () => void;
  referenceid: string;
  onSave: (faq: any) => void;
}

export function AddFaqsModal({
  open,
  onClose,
  referenceid,
  onSave,
}: AddFaqsModalProps) {
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<DescriptionItem[]>([
    { subtitle: "", description: "", showSubtitle: false },
  ]);
  const [saving, setSaving] = useState(false);

  /* ------------------------------
     Helpers
  ------------------------------ */
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { subtitle: "", description: "", showSubtitle: false },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof DescriptionItem,
    value: any
  ) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  /* ------------------------------
     Save FAQ
  ------------------------------ */
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (items.some((i) => !i.description.trim())) {
      toast.error("All description fields must be filled");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/faqs-save-activity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceid,
          title,
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("FAQ saved successfully");

      onSave({
        _id: crypto.randomUUID(),
        referenceid,
        title,
        ...items.reduce((acc, item, i) => {
          acc[`subtitle_${i + 1}`] = item.subtitle || "";
          acc[`description_${i + 1}`] = item.description;
          return acc;
        }, {} as any),
      });

      setTitle("");
      setItems([{ subtitle: "", description: "", showSubtitle: false }]);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Error saving FAQ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0">
        <div className="flex flex-col h-full">
          {/* HEADER */}
          <SheetHeader className="p-6 border-b">
            <SheetTitle>Add FAQs</SheetTitle>
            <SheetDescription>
              This will be saved directly to the database.
            </SheetDescription>
          </SheetHeader>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* TITLE */}
            <Field>
              <FieldLabel>Title</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="Enter FAQ title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FieldContent>
            </Field>

            {/* DESCRIPTIONS */}
            {items.map((item, index) => (
              <Field key={index}>
                <div className="flex items-center justify-between">
                  <FieldLabel>
                    {index === 0 ? "Description" : `Description ${index + 1}`}
                  </FieldLabel>

                  <div className="flex gap-1">
                    {/* TOGGLE SUBTITLE */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={
                        item.showSubtitle
                          ? "bg-muted text-primary hover:bg-muted"
                          : ""
                      }
                      onClick={() => {
                        const willShow = !item.showSubtitle;
                        updateItem(index, "showSubtitle", willShow);

                        if (!willShow) {
                          updateItem(index, "subtitle", "");
                        }
                      }}
                    >
                      <Type className="h-4 w-4" />
                    </Button>

                    {/* ADD */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={addItem}
                      title="Add Description"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>

                    {/* REMOVE */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      title="Remove Description"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {item.showSubtitle && (
                  <FieldContent className="mb-2">
                    <Input
                      placeholder="Optional subtitle"
                      value={item.subtitle}
                      onChange={(e) =>
                        updateItem(index, "subtitle", e.target.value)
                      }
                    />
                  </FieldContent>
                )}

                <FieldContent>
                  <Textarea
                    rows={4}
                    placeholder="Enter FAQ description"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(index, "description", e.target.value)
                    }
                  />
                </FieldContent>
              </Field>
            ))}
          </div>

          {/* FOOTER */}
          <div className="border-t p-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Confirm"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
