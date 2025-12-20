"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { type DateRange } from "react-day-picker";
import { supabase } from "@/utils/supabase";

import Timeline from "@/components/ui/timeline";
import {
    TimelineItem,
    TimelineItemDate,
    TimelineItemTitle,
    TimelineItemDescription,
} from "@/components/ui/timeline";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";

import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemMedia, ItemTitle, } from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";

interface Company {
    id: string;
    account_reference_number: string;
    company_name: string;
    contact_person: string;
    contact_number: string;
    email_address: string;
    type_client?: string;
}

interface Ticket {
    id: string;
    referenceid: string;
    tsm: string;
    ticket_reference_number: string;
    account_reference_number: string;
    date_updated: string;
    date_created: string;
    status: string;
    type_activity?: string;
    call_type: string;
    call_status: string;
    remarks: string;
    start_date: string;
    end_date: string;
}

interface TicketProps {
    dateCreatedFilterRange: DateRange | undefined;
    setDateCreatedFilterRangeAction: React.Dispatch<
        React.SetStateAction<DateRange | undefined>
    >;
}

export const DCT: React.FC<TicketProps> = ({
    dateCreatedFilterRange,
    setDateCreatedFilterRangeAction,
}) => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [activities, setActivities] = useState<Ticket[]>([]);
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [errorCompanies, setErrorCompanies] = useState<string | null>(null);
    const [errorActivities, setErrorActivities] = useState<string | null>(null);
    const [activitySearchTerm, setActivitySearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [viewTimelineTicket, setViewTimelineTicket] = useState<string | null>(
        null
    );
    const ITEMS_PER_PAGE = 10;
    const [agents, setAgents] = useState<
        Array<{ ReferenceID: string; Firstname: string; Lastname: string }>
    >([]);
    const [agentsLoading, setAgentsLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [progress, setProgress] = useState(0);

    // Fetch companies on mount
    const fetchCompanies = async () => {
        setLoadingCompanies(true);
        setErrorCompanies(null);

        try {
            const res = await fetch("/api/com-fetch-account", {
                cache: "no-store",
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                    Pragma: "no-cache",
                    Expires: "0",
                },
            });
            if (!res.ok) throw new Error("Failed to fetch company data");
            const data = await res.json();
            setCompanies(data.data || []);
        } catch (err: any) {
            setErrorCompanies(err.message || "Error fetching company data");
        } finally {
            setLoadingCompanies(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        async function fetchAgents() {
            setAgentsLoading(true);
            try {
                const res = await fetch("/api/fetch-agent");
                if (!res.ok) throw new Error("Failed to fetch agents");
                const data = await res.json();
                setAgents(data); // assuming data is array of agents
            } catch (err) {
                console.error(err);
                setAgents([]);
            } finally {
                setAgentsLoading(false);
            }
        }
        fetchAgents();
    }, []);

    const getAgentNameByReferenceID = (
        refId: string | null | undefined
    ): string => {
        if (!refId) return "-";
        const agent = agents.find((a) => a.ReferenceID === refId);
        return agent ? `${agent.Firstname} ${agent.Lastname}` : "-";
    };

    // Fetch activities (all, no filter)
    const fetchActivities = useCallback(() => {
        setLoadingActivities(true);
        setErrorActivities(null);

        fetch(`/api/act-fetch-history`)
            .then(async (res) => {
                if (!res.ok) throw new Error("Failed to fetch activities");
                return res.json();
            })
            .then((data) => setActivities(data.activities || []))
            .catch((err) => setErrorActivities(err.message))
            .finally(() => setLoadingActivities(false));
    }, []);

    // Real-time subscription for all activities
    useEffect(() => {
        fetchActivities();

        const channel = supabase
            .channel(`history-all`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "history",
                },
                () => {
                    fetchActivities();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchActivities]);

    const isDateInRange = (dateStr: string, range: DateRange | undefined) => {
        if (!range) return true;

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return false;

        const { from, to } = range;

        const fromDate = from
            ? new Date(from.getFullYear(), from.getMonth(), from.getDate())
            : null;
        const toDate = to
            ? new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999)
            : null;

        if (fromDate && date < fromDate) return false;
        if (toDate && date > toDate) return false;

        return true;
    };

    const mergedData = useMemo(() => {
        if (companies.length === 0) return [];

        return activities
            .filter((a) => isDateInRange(a.date_created, dateCreatedFilterRange))
            .map((activity) => {
                const company = companies.find(
                    (c) => c.account_reference_number === activity.account_reference_number
                );
                return {
                    ...activity,
                    company_name: company?.company_name ?? "Unknown Company",
                    type_activity: activity.type_activity ?? "N/A",
                    type_client: company?.type_client,
                    contact_person: company?.contact_person,
                    contact_number: company?.contact_number,
                    email_address: company?.email_address,
                };
            })
            .filter((item) => item.type_client === "CSR Client")
            .sort(
                (a, b) => new Date(b.date_updated).getTime() - new Date(a.date_updated).getTime()
            );
    }, [activities, companies, dateCreatedFilterRange]);

    const groupedData = useMemo(() => {
        const groups: Record<
            string,
            {
                ticket_reference_number: string;
                activities: typeof mergedData;
                company_name: string;
            }
        > = {};

        for (const item of mergedData) {
            const key = item.ticket_reference_number;
            if (!groups[key]) {
                groups[key] = {
                    ticket_reference_number: key,
                    company_name: item.company_name,
                    activities: [],
                };
            }
            groups[key].activities.push(item);
        }

        return Object.values(groups).sort((a, b) => {
            const aDate = new Date(
                a.activities.reduce((max, curr) =>
                    new Date(curr.date_updated) > new Date(max.date_updated) ? curr : max
                ).date_updated
            );
            const bDate = new Date(
                b.activities.reduce((max, curr) =>
                    new Date(curr.date_updated) > new Date(max.date_updated) ? curr : max
                ).date_updated
            );
            return bDate.getTime() - aDate.getTime();
        });
    }, [mergedData]);

    const filteredGroupedData = useMemo(() => {
        if (activitySearchTerm.trim() === "") return groupedData;

        const term = activitySearchTerm.toLowerCase();

        return groupedData.filter(
            (group) =>
                group.company_name.toLowerCase().includes(term) ||
                group.activities.some((activity) =>
                    (activity.type_activity?.toLowerCase() ?? "").includes(term)
                )
        );
    }, [groupedData, activitySearchTerm]);

    const totalPages = Math.ceil(filteredGroupedData.length / ITEMS_PER_PAGE);

    const paginatedGroupedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredGroupedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentPage, filteredGroupedData]);

    const goToPage = (page: number) => {
        if (page < 1) page = 1;
        else if (page > totalPages) page = totalPages;
        setCurrentPage(page);
    };

    const isLoading = loadingCompanies || loadingActivities;
    const error = errorCompanies || errorActivities;

    const ticketGroup = viewTimelineTicket
        ? groupedData.find((g) => g.ticket_reference_number === viewTimelineTicket)
        : null;

    const convertAllGroupedDataToCSV = (groups: typeof filteredGroupedData) => {
        if (!groups || groups.length === 0) return "";

        const headers = [
            "Ticket Reference Number",
            "Company Name",
            "Date Created (Date)",
            "Date Created (Time)",
            "Agent",
            "TSM",
            "Type Activity",
            "Remarks",
            "Type",
            "Call Status",
            "Status",
            "Start Date (Date)",
            "Start Date (Time)",
            "End Date (Date)",
            "End Date (Time)",
            "Time Consumed",
        ];

        const getTimeConsumed = (startStr: string, endStr: string) => {
            if (!startStr || !endStr) return "N/A";
            const start = new Date(startStr).getTime();
            const end = new Date(endStr).getTime();
            const diffMs = end - start;
            if (diffMs < 0) return "Invalid date range";

            const totalSeconds = Math.floor(diffMs / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            return `${hours > 0 ? hours + "h " : ""}${minutes > 0 ? minutes + "m " : ""}${seconds}s`;
        };

        const splitDateTime = (dateTimeStr?: string) => {
            if (!dateTimeStr) return ["N/A", "N/A"];
            const dt = new Date(dateTimeStr);
            if (isNaN(dt.getTime())) return ["N/A", "N/A"];

            const date = dt.toLocaleDateString("en-US");
            const time = dt.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
            });
            return [date, time];
        };

        const rows: string[][] = [];

        for (const group of groups) {
            for (const activity of group.activities) {
                const [dateCreatedDate, dateCreatedTime] = splitDateTime(activity.date_created);
                const [startDateDate, startDateTime] = splitDateTime(activity.start_date);
                const [endDateDate, endDateTime] = splitDateTime(activity.end_date);

                rows.push([
                    group.ticket_reference_number,
                    group.company_name,
                    dateCreatedDate,
                    dateCreatedTime,
                    getAgentNameByReferenceID(activity.referenceid),
                    getAgentNameByReferenceID(activity.tsm),
                    activity.type_activity ?? "N/A",
                    `"${activity.remarks?.replace(/"/g, '""') ?? ""}"`,
                    activity.call_type,
                    activity.call_status,
                    activity.status,
                    startDateDate,
                    startDateTime,
                    endDateDate,
                    endDateTime,
                    getTimeConsumed(activity.start_date, activity.end_date),
                ]);
            }
        }

        return [headers, ...rows].map((e) => e.join(",")).join("\n");
    };

    useEffect(() => {
        if (!exporting) {
            setProgress(0);
            return;
        }

        setProgress(0);
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 1;
            });
        }, 10);

        return () => clearInterval(interval);
    }, [exporting]);

    const progressRef = React.useRef(progress);

    useEffect(() => {
        progressRef.current = progress;
    }, [progress]);

    const waitForProgressComplete = () =>
        new Promise<void>((resolve) => {
            const interval = setInterval(() => {
                if (progressRef.current >= 100) {
                    clearInterval(interval);
                    resolve();
                }
            }, 20);
        });


    const downloadAllCSV = async () => {
        setExporting(true);
        setProgress(0);

        // Hintayin munang maabot ng progress bar ang 100%
        await waitForProgressComplete();

        // Pagkatapos, gawin ang download
        const csv = convertAllGroupedDataToCSV(filteredGroupedData);
        if (!csv) {
            setExporting(false);
            setProgress(0);
            return;
        }

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `DAILY_CSR_TRANSACTION_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Reset state pagkatapos ng konting delay para ma-visualize progress bar tapos
        setTimeout(() => {
            setExporting(false);
            setProgress(0);
        }, 500);
    };


    return (
        <>
            {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <Spinner className="size-8" />
                </div>
            ) : error ? (
                <Alert variant="destructive" className="flex flex-col space-y-4 p-4 text-xs">
                    <div className="flex items-center space-x-3">
                        <AlertCircleIcon className="h-6 w-6 text-red-600" />
                        <div>
                            <AlertTitle>No Data Found or No Network Connection</AlertTitle>
                            <AlertDescription className="text-xs">
                                Please check your internet connection or try again later.
                            </AlertDescription>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <CheckCircle2Icon className="h-6 w-6 text-green-600" />
                        <div>
                            <AlertTitle className="text-black">Create New Data</AlertTitle>
                            <AlertDescription className="text-xs">
                                You can start by adding new entries to populate your database.
                            </AlertDescription>
                        </div>
                    </div>
                </Alert>
            ) : (
                <>
                    {/* Main table */}
                    <div className="overflow-auto max-h-[600px]">
                        <div className="mb-2 text-xs font-bold">
                            Total Activities: {filteredGroupedData.length}
                        </div>

                        <div className="flex items-center justify-between mb-3 gap-2">
                            <input
                                type="search"
                                placeholder="Search by company or activity..."
                                value={activitySearchTerm}
                                onChange={(e) => {
                                    setActivitySearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="flex-grow px-3 py-2 border rounded-md text-sm"
                            />

                            <Button
                                variant="outline"
                                onClick={downloadAllCSV}
                                disabled={filteredGroupedData.length === 0 || exporting}
                                className="bg-green-500 text-white hover:bg-green-600"
                            >
                                Download CSV
                            </Button>
                        </div>

                        <table className="w-full text-sm border border-gray-300 rounded-md overflow-hidden">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 border-b border-gray-300 text-left">Company</th>
                                    <th className="p-2 border-b border-gray-300 text-left">
                                        Ticket Reference
                                    </th>
                                    <th className="p-2 border-b border-gray-300 text-left">Latest Update</th>
                                    <th className="p-2 border-b border-gray-300 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedGroupedData.map((group) => {
                                    const latestActivity = group.activities.reduce((prev, curr) =>
                                        new Date(curr.date_updated) > new Date(prev.date_updated)
                                            ? curr
                                            : prev
                                    );

                                    return (
                                        <tr
                                            key={group.ticket_reference_number}
                                            className="border-b border-gray-200"
                                        >
                                            <td className="p-2">{group.company_name}</td>
                                            <td className="p-2">{group.ticket_reference_number}</td>
                                            <td className="p-2">
                                                {new Date(latestActivity.date_updated).toLocaleString()}
                                            </td>
                                            <td className="p-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => setViewTimelineTicket(group.ticket_reference_number)}
                                                >
                                                    View Timeline
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="mt-4 flex justify-center items-center space-x-2 text-xs">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={currentPage <= 1}
                                onClick={() => goToPage(currentPage - 1)}
                            >
                                Prev
                            </Button>

                            <span>
                                Page {currentPage} / {totalPages || 1}
                            </span>

                            <Button
                                size="sm"
                                variant="outline"
                                disabled={currentPage >= totalPages}
                                onClick={() => goToPage(currentPage + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>

                    <Dialog
                        open={!!viewTimelineTicket}
                        onOpenChange={(open) => !open && setViewTimelineTicket(null)}
                    >
                        <DialogContent
                            style={{
                                maxWidth: "50vw",
                                width: "100%",
                                maxHeight: "90vh",
                                overflowY: "auto",
                            }}
                        >
                            <DialogHeader>
                                <DialogTitle>Timeline Activities</DialogTitle>
                                <DialogClose />
                            </DialogHeader>

                            {ticketGroup ? (
                                <Timeline orientation="vertical">
                                    {ticketGroup.activities.map((activity) => (
                                        <TimelineItem
                                            key={activity.id}
                                            variant={
                                                activity.type_activity === "TROUBLE TICKET"
                                                    ? "default"
                                                    : "secondary"
                                            }
                                        >
                                            <TimelineItemDate>
                                                {new Date(activity.date_created).toLocaleString()}
                                            </TimelineItemDate>
                                            <TimelineItemTitle>{activity.type_activity}</TimelineItemTitle>
                                            <TimelineItemDescription>
                                                <div className="text-xs">
                                                    <p>
                                                        <strong>Agent:</strong> {getAgentNameByReferenceID(activity.referenceid)}
                                                    </p>
                                                    <p>
                                                        <strong>TSM:</strong> {getAgentNameByReferenceID(activity.tsm)}
                                                    </p>
                                                    <p>
                                                        <strong>Remarks:</strong> {activity.remarks}
                                                    </p>
                                                    <p>
                                                        <strong>Status:</strong> {activity.status}
                                                    </p>
                                                </div>
                                            </TimelineItemDescription>
                                        </TimelineItem>
                                    ))}
                                </Timeline>
                            ) : (
                                <div>No timeline data found.</div>
                            )}
                        </DialogContent>
                    </Dialog>

                    {exporting && (
                        <div
                            className="fixed top-4 right-4 z-50 w-full max-w-md flex flex-col gap-4 rounded-xl shadow-lg bg-white p-4"
                            style={{ borderRadius: "1rem" }}
                        >
                            <Item variant="outline">
                                <ItemMedia variant="icon">
                                    <Spinner />
                                </ItemMedia>
                                <ItemContent>
                                    <ItemTitle>Downloading...</ItemTitle>
                                    <ItemDescription>{`${filteredGroupedData.length} records`}</ItemDescription>
                                </ItemContent>
                                <ItemActions className="hidden sm:flex">
                                    <Button variant="outline" size="sm" disabled>
                                        Cancel
                                    </Button>
                                </ItemActions>
                                <ItemFooter>
                                    <Progress value={progress} />
                                </ItemFooter>
                            </Item>
                        </div>
                    )}
                </>
            )}
        </>
    );
};
