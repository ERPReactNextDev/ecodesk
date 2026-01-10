"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";

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

  // SAME fetch logic as SidebarRight
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
    <div className="space-y-4">
      <div className="rounded-lg border p-4 bg-muted/40">
        <div className="text-lg font-semibold">
          {userDetails.Firstname} {userDetails.Lastname}
        </div>
        <div className="text-sm text-muted-foreground">
          {userDetails.ReferenceID}
        </div>
        <div className="text-sm">{userDetails.Position}</div>
        <div className="text-sm">{userDetails.Email}</div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="font-semibold">CSR Summary</h2>
        <p className="text-sm text-muted-foreground">
          This page is now correctly bound to the logged-in CSR.
        </p>
      </div>
    </div>
  );
}
