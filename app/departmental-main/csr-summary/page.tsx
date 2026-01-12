"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { DepartmentalAddSheet } from "@/components/departmental-csr-add-sheet";
import { DepartmentalCsrFetchSheet } from "@/components/departmental-csr-fetch-sheet";

export default function CsrSummaryPage() {
  const { userId } = useUser();

  const [userDetails, setUserDetails] = useState({
    ReferenceID: "",
    Firstname: "",
    Lastname: "",
    Position: "",
    Email: "",
    profilePicture: "",
  });

  const [openSheet, setOpenSheet] = useState(false);
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    fetch(`/api/user?id=${encodeURIComponent(userId)}`)
      .then((res) => res.json())
      .then((data) => {
        setUserDetails({
          ReferenceID: data.ReferenceID || "",
          Firstname: data.Firstname || "",
          Lastname: data.Lastname || "",
          Position: data.Position || "",
          Email: data.Email || "",
          profilePicture: data.profilePicture || "",
        });
      });
  }, [userId]);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* HEADER BLOCK */}
      <div className="rounded-lg border p-4 bg-muted/40 shrink-0">
        <div className="text-lg font-semibold">
          {userDetails.Firstname} {userDetails.Lastname}
        </div>
        <div className="text-sm text-muted-foreground">
          {userDetails.ReferenceID}
        </div>
        <div className="text-sm">{userDetails.Position}</div>
        <div className="text-sm">{userDetails.Email}</div>
      </div>

      {/* SUMMARY + ACTION */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-semibold">CSR Summary</h2>
          <p className="text-sm text-muted-foreground">
            This page is now correctly bound to the logged-in CSR.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpenSheet(true)}
        >
          Action
        </Button>
      </div>

      {/* TABLE AREA – this is what fills the screen */}
      <div className="flex-1 min-h-0">
        <DepartmentalCsrFetchSheet
  referenceid={userDetails.ReferenceID}
  newRecord={records[0]}
/>
      </div>

      {/* Floating Sheet (does not affect layout) */}
      {openSheet && (
        <DepartmentalAddSheet
          open={openSheet}
          onClose={() => setOpenSheet(false)}
          referenceid={userDetails.ReferenceID}
          onSave={(record) => {
            setRecords((prev) => [record, ...prev]);
          }}
        />
      )}
    </div>
  );
}
