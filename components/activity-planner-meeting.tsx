"use client";

import React, { useState, useEffect } from "react";
import { MeetingDialog } from "@/components/activity-planner-meeting-dialog";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "@/components/ui/accordion";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, Timestamp, deleteDoc, doc, addDoc, } from "firebase/firestore";
import { toast } from "sonner";

interface MeetingItem {
  id: string;
  referenceid: string;
  tsm: string;
  manager: string;
  type_activity: string;
  remarks: string;
  start_date: string;
  end_date: string;
  date_created: Timestamp;
  date_updated: Timestamp;
}

interface MeetingProps {
  referenceid: string;
  tsm: string;
  manager: string;
}

export function Meeting({ referenceid, tsm, manager }: MeetingProps) {
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch meetings
  useEffect(() => {
    async function fetchMeetings() {
      setLoading(true);
      try {
        const q = query(collection(db, "meetings"), orderBy("date_created", "desc"));
        const querySnapshot = await getDocs(q);

        const fetchedMeetings = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            referenceid: data.referenceid,
            tsm: data.tsm,
            manager: data.manager,
            type_activity: data.type_activity,
            remarks: data.remarks,
            start_date: data.start_date,
            end_date: data.end_date,
            date_created: data.date_created,
            date_updated: data.date_updated,
          };
        });

        setMeetings(fetchedMeetings);
      } catch (error) {
        console.error("Error loading meetings:", error);
        toast.error("Failed to load meetings.");
      }
      setLoading(false);
    }

    fetchMeetings();
  }, []);

  // Delete meeting handler
  const handleDeleteMeeting = async (id: string) => {
    if (!confirm("Are you sure you want to delete this meeting?")) return;

    try {
      await deleteDoc(doc(db, "meetings", id));
      setMeetings((prev) => prev.filter((meeting) => meeting.id !== id));
      toast.success("Meeting deleted successfully!");
    } catch (error) {
      console.error("Error deleting meeting:", error);
      toast.error("Failed to delete meeting, try again.");
    }
  };

  // Handler after new meeting created in MeetingDialog
  const handleMeetingCreated = (newMeeting: MeetingItem) => {
    setMeetings((prev) => [newMeeting, ...prev]);
  };

  // Limit meetings to max 3 for display
  const displayedMeetings = meetings.slice(0, 3);

  return (
    <div>
      {/* Header with title and create button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">Meeting</h2>
        <MeetingDialog
          referenceid={referenceid}
          tsm={tsm}
          manager={manager}
          onMeetingCreated={handleMeetingCreated}
        >
          <Button variant="outline" className="inline-flex items-center">
            <Plus className="mr-1 h-4 w-4" />
            Create
          </Button>
        </MeetingDialog>
      </div>

      <Separator className="my-4" />

      {/* Meetings Accordion List */}
      <Accordion type="single" collapsible className="w-full">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading meetings...</p>
        ) : displayedMeetings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No meetings scheduled.</p>
        ) : (
          displayedMeetings.map(
            ({
              id,
              type_activity,
              remarks,
              start_date,
              end_date,
            }) => (
              <AccordionItem key={id} value={id}>
                <AccordionTrigger>
                  {type_activity} — {start_date} to {end_date}
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-2">
                  <p className="text-xs"><strong>Remarks:</strong> {remarks}</p>
                  <p className="text-xs"><strong>Start Date:</strong> {start_date}</p>
                  <p className="text-xs"><strong>End Date:</strong> {end_date}</p>
                  <div className="mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMeeting(id)}
                      aria-label="Delete meeting"
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          )
        )}
      </Accordion>
    </div>
  );
}
