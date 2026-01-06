"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { subtitle: "", description: "", showSubtitle: false },
    ]);
  };

  const removeItem = (index: number) => {
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add FAQs</DialogTitle>
          <DialogDescription>
            This will be saved directly to the database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-1 max-h-[55vh]">
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
                        // 🔥 HIDE = DELETE subtitle
                        updateItem(index, "subtitle", "");
                      }
                    }}
                  >
                    <Type className="h-4 w-4" />
                  </Button>

                {/* ADD DESCRIPTION */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={addItem}
                  title="Add Description"
                >
                  <Plus className="h-4 w-4" />
                </Button>

                {/* REMOVE DESCRIPTION (MINIMUM = 1) */}
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

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
