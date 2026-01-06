"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { useUser } from "@/contexts/UserContext";
import { FormatProvider } from "@/contexts/FormatContext";

import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";
import { AddFaqsModal } from "@/components/add-faqs-modal";
import { EditFaqsModal } from "@/components/edit-faqs-modal";
import { DeleteFaqsModal } from "@/components/delete-faqs-modal";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Button } from "@/components/ui/button";
import { type DateRange } from "react-day-picker";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface UserDetails {
  referenceid: string;
  role: string;
}

interface FaqItem {
  _id: string;
  title: string;
  isActive?: boolean;
  [key: string]: any;
}

function HelpContent() {
  const searchParams = useSearchParams();
  const { userId, setUserId } = useUser();

  const [userDetails, setUserDetails] = useState<UserDetails>({
    referenceid: "",
    role: "",
  });

  const queryUserId = searchParams?.get("id") ?? "";
  const [dateCreatedFilterRange, setDateCreatedFilterRangeAction] =
    useState<DateRange | undefined>(undefined);

  const [openAddFaqs, setOpenAddFaqs] = useState(false);
  const [openEditFaqs, setOpenEditFaqs] = useState(false);
  const [openDeleteFaqs, setOpenDeleteFaqs] = useState(false);

  const [selectedFaq, setSelectedFaq] = useState<FaqItem | null>(null);

  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /* ------------------------------
     Sync URL user id
  ------------------------------ */
  useEffect(() => {
    if (queryUserId && queryUserId !== userId) {
      setUserId(queryUserId);
    }
  }, [queryUserId, userId, setUserId]);

  /* ------------------------------
     Fetch User
  ------------------------------ */
  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      try {
        const res = await fetch(`/api/user?id=${encodeURIComponent(userId)}`);
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();

        setUserDetails({
          referenceid: data.ReferenceID || "",
          role: data.Role || "",
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchUserData();
  }, [userId]);

  /* ------------------------------
     Fetch FAQs
  ------------------------------ */
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoadingFaqs(true);
        const res = await fetch("/api/faqs-fetch-activity");
        const data = await res.json();
        if (res.ok) setFaqs(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingFaqs(false);
      }
    };

    fetchFaqs();
  }, []);

  if (!mounted) return null;

  return (
    <>
      <SidebarLeft />

      <SidebarInset>
        {/* HEADER */}
        <header className="bg-background sticky top-0 flex h-14 items-center gap-2 border-b">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-base font-semibold">
                    Help
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex flex-1 flex-col gap-6 p-4">
          <div className="mx-auto w-full max-w-4xl space-y-4">
            <h1 className="text-xl font-semibold">
              CSR Frequently Asked Questions
            </h1>

            <p className="text-sm text-muted-foreground">
              This section displays the CSR FAQs (Customer Service Representative Frequently Asked Questions). 
              It provides answers to common inquiries related to CSR processes, ensuring quick access to essential information. 
              If an error occurs, a message will be shown in red. 
              The CSRFaqs component is responsible for rendering the list of frequently asked questions.
            </p>

            {/* ACTIONS */}
            {userDetails.role === "Admin" && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setOpenAddFaqs(true)}
                >
                  Add FAQs
                </Button>
              </div>
            )}

          {/* FAQ LIST */}
          {loadingFaqs ? (
            <p className="text-sm text-muted-foreground">Loading FAQs...</p>
          ) : faqs.filter((f) => f.isActive !== false).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No FAQs available.
            </p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
{faqs
  .filter((faq) => faq.isActive !== false)
  // 🔥 OLDEST FIRST → NEWEST LAST (DEFAULT, ALL ROLES)
  .sort((a, b) => {
    const aDate = new Date(a.date_created || 0).getTime();
    const bDate = new Date(b.date_created || 0).getTime();
    return aDate - bDate;
  })
  .map((faq) => {
                  const items = Object.keys(faq)
                    .filter((key) => key.startsWith("description_"))
                    .map((key) => {
                      const index = Number(key.replace("description_", ""));
                      return {
                        index,
                        description: faq[key],
                        subtitle: faq[`subtitle_${index}`] || "",
                      };
                    })
                    .sort((a, b) => a.index - b.index);

                  return (
                    <AccordionItem key={faq._id} value={faq._id}>
                    <AccordionTrigger>
                      <div className="flex w-full justify-between items-center pr-2">
                        <span>{faq.title}</span>

                        {userDetails.role === "Admin" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFaq(faq);
                                setOpenEditFaqs(true);
                              }}
                            >
                              Edit
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFaq(faq);
                                setOpenDeleteFaqs(true);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </AccordionTrigger>

                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {items.map((item, idx) => {
                          const isLastItem = idx === items.length - 1;
                          const isOddCount = items.length % 2 === 1;
                          const isFullWidth = isLastItem && isOddCount;

                          return (
                            <div
                              key={idx}
                              className={`rounded-lg border p-4 space-y-2 ${
                                isFullWidth ? "md:col-span-2" : ""
                              }`}
                            >
                              {item.subtitle && (
                                <div className="font-semibold text-sm">
                                  {item.subtitle}
                                </div>
                              )}

                              <div className="text-sm text-muted-foreground whitespace-pre-line">
                                {item.description}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  );
                })}
            </Accordion>
          )}
          </div>
        </div>
      </SidebarInset>

      <SidebarRight
        userId={userId ?? undefined}
        dateCreatedFilterRange={dateCreatedFilterRange}
        setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
      />

      {/* ADD MODAL */}
      <AddFaqsModal
        open={openAddFaqs}
        onClose={() => setOpenAddFaqs(false)}
        referenceid={userDetails.referenceid}
        onSave={(newFaq) =>
          setFaqs((prev) => [...prev, newFaq]) // ✅ ALWAYS APPEND
        }
      />


      {/* EDIT MODAL */}
      <EditFaqsModal
        open={openEditFaqs}
        faq={selectedFaq}
        onClose={() => {
          setOpenEditFaqs(false);
          setSelectedFaq(null);
        }}
        onUpdated={(updatedFaq) => {
          setFaqs((prev) =>
            prev.map((f) => (f._id === updatedFaq._id ? updatedFaq : f))
          );
        }}
      />

      {/* DELETE MODAL */}
      {selectedFaq && (
        <DeleteFaqsModal
          open={openDeleteFaqs}
          faqId={selectedFaq._id}
          onClose={() => {
            setOpenDeleteFaqs(false);
            setSelectedFaq(null);
          }}
          onDeleted={(id) => {
            setFaqs((prev) =>
              prev.map((f) =>
                f._id === id ? { ...f, isActive: false } : f
              )
            );
          }}
        />
      )}
    </>
  );
}

export default function HelpPage() {
  return (
    <FormatProvider>
      <SidebarProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <HelpContent />
        </Suspense>
      </SidebarProvider>
    </FormatProvider>
  );
}
