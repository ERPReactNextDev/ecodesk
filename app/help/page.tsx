"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { useUser } from "@/contexts/UserContext";
import { FormatProvider } from "@/contexts/FormatContext";

import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";
import { AddFaqsModal } from "@/components/add-faqs-modal";

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
  [key: string]: any; // subtitle_1, description_1, etc.
}

function HelpContent() {
  const searchParams = useSearchParams();
  const [userDetails, setUserDetails] = useState<UserDetails>({
    referenceid: "",
    role: "",
  });

  const { userId, setUserId } = useUser();
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryUserId = searchParams?.get("id") ?? "";
  const [dateCreatedFilterRange, setDateCreatedFilterRangeAction] =
    useState<DateRange | undefined>(undefined);

  const [openAddFaqs, setOpenAddFaqs] = useState(false);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Sync URL query param with userId context
  useEffect(() => {
    if (queryUserId && queryUserId !== userId) {
      setUserId(queryUserId);
    }
  }, [queryUserId, userId, setUserId]);

  // Fetch user data
  useEffect(() => {
    if (!userId) {
      setError("User ID is missing.");
      setLoadingUser(false);
      return;
    }

    const fetchUserData = async () => {
      setError(null);
      setLoadingUser(true);
      try {
        const response = await fetch(
          `/api/user?id=${encodeURIComponent(userId)}`
        );
        if (!response.ok) throw new Error("Failed to fetch user data");
        const data = await response.json();

        setUserDetails({
          referenceid: data.ReferenceID || "",
          role: data.Role || "",
        });
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, [userId]);

  // Initial Fetch FAQs
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoadingFaqs(true);
        const res = await fetch("/api/faqs-fetch-activity");
        const data = await res.json();
        if (res.ok) {
          setFaqs(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch FAQs:", err);
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
              Click a question below to view its answer.
            </p>

            {/* ADD FAQs BUTTON */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setOpenAddFaqs(true)}
              >
                Add FAQs
              </Button>
            </div>

            {/* FAQ ACCORDION */}
            {loadingFaqs ? (
              <p className="text-sm text-muted-foreground">Loading FAQs...</p>
            ) : faqs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No FAQs available.
              </p>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq) => {
                  /**
                   * ✅ FIXED LOGIC
                   * Properly pairs subtitle_X with description_X
                   */
                  const items = Object.keys(faq)
                    .filter((key) => key.startsWith("description_"))
                    .map((key) => {
                      const index = Number(
                        key.replace("description_", "")
                      );
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
                        {faq.title}
                      </AccordionTrigger>

                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {items.map((item, idx) => {
                            const isFullWidth =
                              idx === items.length - 1 ||
                              (idx + 1) % 5 === 0;

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
        setDateCreatedFilterRangeAction={
          setDateCreatedFilterRangeAction
        }
      />

      {/* ADD FAQS MODAL */}
      <AddFaqsModal
        open={openAddFaqs}
        onClose={() => setOpenAddFaqs(false)}
        referenceid={userDetails.referenceid}
        onSave={(newFaq: FaqItem) =>
          setFaqs((prev) => [newFaq, ...prev])
        }
      />
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
