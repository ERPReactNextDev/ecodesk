"use client";

import { useEffect, useState } from "react";
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

interface EditFaqsModalProps {
  open: boolean;
  onClose: () => void;
  faq: any | null;
  onUpdated: (updatedFaq: any) => void;
}

export function EditFaqsModal({
  open,
  onClose,
  faq,
  onUpdated,
}: EditFaqsModalProps) {
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<DescriptionItem[]>([
    { subtitle: "", description: "", showSubtitle: true },
  ]);
  const [saving, setSaving] = useState(false);

  /* ------------------------------
     Load FAQ ONLY when Sheet opens
  ------------------------------ */
  useEffect(() => {
    if (!open || !faq) return;

    setTitle(faq.title || "");

    const parsedItems = Object.keys(faq)
      .filter((key) => key.startsWith("description_"))
      .map((key) => {
        const index = Number(key.replace("description_", ""));
        return {
          index,
          subtitle: faq[`subtitle_${index}`] || "",
          description: faq[key] || "",
          showSubtitle: Boolean(faq[`subtitle_${index}`]),
        };
      })
      .sort((a, b) => a.index - b.index)
      .map(({ subtitle, description, showSubtitle }) => ({
        subtitle,
        description,
        showSubtitle,
      }));

    setItems(
      parsedItems.length
        ? parsedItems
        : [{ subtitle: "", description: "", showSubtitle: false }]
    );
  }, [open, faq]);

  /* ------------------------------
     Helpers
  ------------------------------ */
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { subtitle: "", description: "", showSubtitle: true },
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
     Save Changes
  ------------------------------ */
  const handleSave = async () => {
    if (!faq) return;

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (items.some((i) => !i.description.trim())) {
      toast.error("All descriptions are required");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/faqs-edit-activity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: faq._id,
          title,
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("FAQ updated successfully");

      const updatedFaq = {
        _id: faq._id,
        title,
        ...items.reduce((acc, item, i) => {
          acc[`description_${i + 1}`] = item.description;

          if (item.showSubtitle && item.subtitle.trim()) {
            acc[`subtitle_${i + 1}`] = item.subtitle.trim();
          }

          return acc;
        }, {} as any),
      };

      onUpdated(updatedFaq);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update FAQ");
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
            <SheetTitle>Edit FAQ</SheetTitle>
            <SheetDescription>
              Update the selected FAQ details.
            </SheetDescription>
          </SheetHeader>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <Field>
              <FieldLabel>Title</FieldLabel>
              <FieldContent>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FieldContent>
            </Field>

            {items.map((item, index) => (
              <Field key={index}>
                <div className="flex items-center justify-between">
                  <FieldLabel>
                    Description {index + 1}
                  </FieldLabel>

                  <div className="flex gap-1">
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
                        if (!willShow) updateItem(index, "subtitle", "");
                      }}
                    >
                      <Type className="h-4 w-4" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={addItem}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
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
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
