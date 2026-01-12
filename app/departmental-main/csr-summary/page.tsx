"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";

import { DepartmentalAddSheet } from "@/components/departmental-csr-add-sheet";
import { DepartmentalEditSheet } from "@/components/departmental-csr-edit-sheet";
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

  // ADD
  const [openAdd, setOpenAdd] = useState(false);

  // EDIT
  const [editOpen, setEditOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);

  // realtime table updates
  const [newRecord, setNewRecord] = useState<any>(null);
  const [updatedRecord, setUpdatedRecord] = useState<any>(null);

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

  // called by table Edit button
  const handleEdit = (row: any) => {
    setEditingRow(row);
    setEditOpen(true);
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* HEADER */}
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

      {/* ACTION BAR */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-semibold">CSR Summary</h2>
          <p className="text-sm text-muted-foreground">
            This page is bound to the logged-in CSR.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => setOpenAdd(true)}>
          Action
        </Button>
      </div>

      {/* TABLE */}
      <div className="flex-1 min-h-0">
        <DepartmentalCsrFetchSheet
          referenceid={userDetails.ReferenceID}
          newRecord={newRecord}
          updatedRecord={updatedRecord}
          onEdit={handleEdit}
        />
      </div>

      {/* ADD SHEET */}
      {openAdd && (
        <DepartmentalAddSheet
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          referenceid={userDetails.ReferenceID}
          onSave={(r) => {
            setNewRecord(r);   // instantly prepend
            setOpenAdd(false);
          }}
        />
      )}

      {/* EDIT SHEET */}
      {editOpen && editingRow && (
        <DepartmentalEditSheet
          open={editOpen}
          onClose={() => setEditOpen(false)}
          referenceid={userDetails.ReferenceID}
          record={editingRow}
          onSave={(r) => {
            setUpdatedRecord(r);   // instantly replace row
            setEditOpen(false);
          }}
        />
      )}
    </div>
  );
}
