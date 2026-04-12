"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Activity {
  _id: string;
  ticket_reference_number: string;
  client_segment: string;
  traffic: string;
  source_company: string;
  ticket_received: string;
  ticket_endorsed: string;
  gender: string;
  channel: string;
  wrap_up: string;
  source: string;
  customer_type: string;
  customer_status: string;
  status: string;
  department: string;
  manager: string;
  agent: string;
  department_head: string;
  remarks: string;
  inquiry: string;
  item_code: string;
  item_description: string;
  po_number: string;
  so_date: string;
  so_number: string;
  so_amount: string;
  qty_sold: string;
  quotation_number: string;
  quotation_amount: string;
  payment_terms: string;
  po_source: string;
  payment_date: string;
  delivery_date: string;
  date_created?: string;
  date_updated: string;
  tsm_acknowledge_date?: string;
  tsa_acknowledge_date?: string;
  tsm_handling_time?: string;
  tsa_handling_time?: string;
  hr_acknowledge_date?: string;
  inquiry_received?: string;
  response_to_inquiry?: string;
  handling_csr?: string;
  company_name: string;
  contact_number: string;
  contact_person: string;
  email_address: string;
}

interface UseActivitiesOptions {
  referenceid?: string;
  department?: string;
  refreshInterval?: number;
}

interface ActivityCache {
  data: Activity[];
  timestamp: number;
}

const CACHE_DURATION = 30000; // 30 seconds
const cache = new Map<string, ActivityCache>();

export function useActivities(options: UseActivitiesOptions = {}) {
  const { referenceid, department, refreshInterval = 30000 } = options;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cacheKey = useCallback(() => {
    return `activities-${referenceid || "all"}-${department || "all"}`;
  }, [referenceid, department]);

  const fetchActivities = useCallback(
    async (forceRefresh = false) => {
      const now = Date.now();
      const key = cacheKey();

      // Check cache first
      if (!forceRefresh) {
        const cached = cache.get(key);
        if (cached && now - cached.timestamp < CACHE_DURATION) {
          setActivities(cached.data);
          setIsLoading(false);
          return;
        }
        // Prevent rapid refetching
        if (now - lastFetchRef.current < 1000) {
          return;
        }
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (referenceid) params.append("referenceid", referenceid);
        if (department) params.append("department", department);

        const response = await fetch(`/api/act-fetch-activity?${params}`, {
          signal: abortControllerRef.current.signal,
          headers: {
            "Cache-Control": "max-age=30",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const activitiesData = data.activities || [];

        // Update cache
        cache.set(key, { data: activitiesData, timestamp: now });
        lastFetchRef.current = now;

        setActivities(activitiesData);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // Ignore abort errors
        }
        setError(err instanceof Error ? err.message : "Failed to fetch activities");
        toast.error("Failed to load activities");
      } finally {
        setIsLoading(false);
      }
    },
    [referenceid, department, cacheKey]
  );

  const invalidateCache = useCallback(() => {
    const key = cacheKey();
    cache.delete(key);
    lastFetchRef.current = 0;
  }, [cacheKey]);

  const refresh = useCallback(() => {
    invalidateCache();
    return fetchActivities(true);
  }, [fetchActivities, invalidateCache]);

  const updateActivity = useCallback(
    async (activity: Partial<Activity>) => {
      try {
        const response = await fetch("/api/act-save-activity", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(activity),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update activity");
        }

        // Update local cache optimistically
        setActivities((prev) =>
          prev.map((a) =>
            a._id === activity._id ? { ...a, ...activity } : a
          )
        );

        // Invalidate and refresh
        invalidateCache();

        return await response.json();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed");
        throw err;
      }
    },
    [invalidateCache]
  );

  const deleteActivity = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/act-delete-activity?id=${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete activity");
        }

        setActivities((prev) => prev.filter((a) => a._id !== id));
        invalidateCache();

        toast.success("Activity deleted");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
        throw err;
      }
    },
    [invalidateCache]
  );

  // Auto-refresh interval
  useEffect(() => {
    fetchActivities();

    if (refreshInterval > 0) {
      const intervalId = setInterval(() => {
        fetchActivities();
      }, refreshInterval);

      return () => {
        clearInterval(intervalId);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchActivities, refreshInterval]);

  return {
    activities,
    isLoading,
    error,
    refresh,
    updateActivity,
    deleteActivity,
    invalidateCache,
  };
}

// Hook for single activity with caching
export function useActivity(id?: string) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchActivity = useCallback(
    async (forceRefresh = false) => {
      if (!id) return;

      // Check cache
      if (!forceRefresh) {
        const cached = cache.get(`activity-${id}`);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setActivity(cached.data[0] || null);
          return;
        }
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/act-fetch-activity?id=${id}`, {
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const activityData = data.activities?.[0] || null;

        if (activityData) {
          cache.set(`activity-${id}`, {
            data: [activityData],
            timestamp: Date.now(),
          });
        }

        setActivity(activityData);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    if (id) {
      fetchActivity();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [id, fetchActivity]);

  return {
    activity,
    isLoading,
    error,
    refresh: () => fetchActivity(true),
  };
}

export type { Activity };
