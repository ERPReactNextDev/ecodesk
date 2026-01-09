"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Info } from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

// Tooltip component for info explanation
function TooltipInfo({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-full mt-1 w-64 rounded-md bg-muted p-3 text-sm text-muted-foreground shadow-lg z-10">
      {children}
    </div>
  );
}

interface Activity {
  type_client: string;
  date_created?: string;
}

export function AccountsCard() {
  const [accounts, setAccounts] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Fetch accounts data on mount
  useEffect(() => {
    async function fetchAccounts() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/com-fetch-account");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch accounts");
        setAccounts(data.data || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchAccounts();
  }, []);

  // Count total accounts (no filtering)
  const totalAccounts = accounts.length;

  // Compute breakdown by type_client (lowercase keys)
  const breakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    accounts.forEach(({ type_client }) => {
      if (type_client) {
        const key = type_client.toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [accounts]);

  return (
    <>
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Overall Client Database</CardTitle>
          <div
            className="relative cursor-pointer text-muted-foreground hover:text-foreground"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label="Accounts count explanation"
          >
            <Info size={18} />
            {showTooltip && (
              <TooltipInfo>
                This count represents total accounts fetched from the server.
              </TooltipInfo>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loading && <p>Loading accounts...</p>}
          {error && <p className="text-destructive">{error}</p>}
          {!loading && !error && (
            <p className="flex justify-between items-center">
              <span>Total accounts:</span>
              <strong>
                <Badge className="h-10 min-w-10 rounded-full px-3 font-mono tabular-nums">
                  {totalAccounts}
                </Badge>
              </strong>
            </p>
          )}
        </CardContent>

        <Separator />

        <CardFooter className="text-sm text-muted-foreground flex justify-between items-center">
          <div>Showing total accounts</div>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="cursor-pointer">
                Show Breakdown
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-96 [&_button]:cursor-pointer [&_button]:hover:opacity-80">
              <SheetHeader>
                <SheetTitle>Client Type Breakdown</SheetTitle>
                <SheetDescription>
                  Total counts of accounts grouped by <code>Type Client</code>.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 p-6">
                {Object.entries(breakdown).length === 0 ? (
                  <p>No data available</p>
                ) : (
                  Object.entries(breakdown).map(([type, count]) => (
                    <div key={type} className="flex justify-between border-b border-muted py-2 text-xs">
                      <span className="uppercase">{type}</span>
                      <span>{count}</span>
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
        </CardFooter>
      </Card>
    </>
  );
}
