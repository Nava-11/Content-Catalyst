import { useQuery } from "@tanstack/react-query";

interface Idea {
    id: number;
    title: string;
    format: string;
    rationale: string;
    score?: number;
}

interface Experiment {
    experimentType: string;
    description: string;
    ideas: Idea[];
}

interface TopicCluster {
    index: number;
    label: string;
    avgCrps: number;
    size: number;
    performanceSummary: string;
    centroid?: number[];
}

export function useDashboardData(channelId: string | null) {
    const analyticsQuery = useQuery({
        queryKey: ["analytics", channelId],
        queryFn: async () => {
            if (!channelId) throw new Error("No channel ID");
            const res = await fetch(`/api/analytics/${channelId}`);
            if (!res.ok) throw new Error("Failed to fetch analytics");
            return res.json();
        },
        enabled: !!channelId,
    });

    const recommendationsQuery = useQuery({
        queryKey: ["recommendations", channelId],
        queryFn: async () => {
            if (!channelId) throw new Error("No channel ID");
            const res = await fetch(`/api/recommendations/${channelId}`);
            if (!res.ok) throw new Error("Failed to fetch recommendations");
            return res.json();
        },
        enabled: !!channelId,
    });

    const isLoading = analyticsQuery.isLoading || recommendationsQuery.isLoading;
    const isError = analyticsQuery.isError || recommendationsQuery.isError;
    const error = analyticsQuery.error || recommendationsQuery.error;

    return {
        analytics: analyticsQuery.data,
        recommendations: recommendationsQuery.data,
        isLoading,
        isError,
        error
    };
}
