import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useAnalyzeChannel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (channelId: string) => {
      const res = await fetch(api.analyze.path, {
        method: api.analyze.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Analysis failed");
      }
      return res.json();
    },
    onSuccess: (_, channelId) => {
      // Invalidate queries to refetch data after analysis
      queryClient.invalidateQueries({ queryKey: [api.analytics.path, channelId] });
      queryClient.invalidateQueries({ queryKey: [api.recommendations.path, channelId] });
      toast({
        title: "Analysis Complete",
        description: "Channel data has been processed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useChannelAnalytics(channelId: string | null) {
  return useQuery({
    queryKey: [api.analytics.path, channelId],
    queryFn: async () => {
      if (!channelId) return null;
      const url = buildUrl(api.analytics.path, { channelId });
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch analytics");
      
      const data = await res.json();
      return api.analytics.responses[200].parse(data);
    },
    enabled: !!channelId,
  });
}

export function useChannelRecommendations(channelId: string | null) {
  return useQuery({
    queryKey: [api.recommendations.path, channelId],
    queryFn: async () => {
      if (!channelId) return null;
      const url = buildUrl(api.recommendations.path, { channelId });
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      
      const data = await res.json();
      return api.recommendations.responses[200].parse(data);
    },
    enabled: !!channelId,
  });
}
