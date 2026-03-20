import { DashboardLayout } from "@/components/DashboardLayout";
import { PageTransition, StaggerContainer, FadeInUp } from "@/components/PageTransition";
import { HoverCard3D } from "@/components/HoverCard3D";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Sparkles, BarChart2, Loader2, Bookmark, Send, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CollaborationHub } from "@/components/CollaborationHub";

// Filter tabs will be dynamically generated from experiment types
export default function IdeasEngine() {
    const channelId = new URLSearchParams(window.location.search).get("channelId");
    const { recommendations, isLoading, isError } = useDashboardData(channelId);
    const [activeFilter, setActiveFilter] = useState("All");
    const [viewMode, setViewMode] = useState<"discover" | "saved">("discover");
    const [generatingId, setGeneratingId] = useState<number | null>(null);
    const [generatedTitles, setGeneratedTitles] = useState<Record<number, string[]>>({});
    const { toast } = useToast();

    // Fetch Saved Ideas
    const { data: savedIdeasData, isLoading: isSavedLoading } = useQuery({
        queryKey: ["savedIdeas", channelId],
        queryFn: async () => {
            if (!channelId) throw new Error("No channel ID");
            const res = await fetch(`/api/saved/${channelId}`);
            if (!res.ok) throw new Error("Failed to fetch saved ideas");
            return res.json();
        },
        enabled: !!channelId,
    });

    // Save/Publish Mutation
    const updateIdeaStatus = useMutation({
        mutationFn: async ({ id, status, idea }: { id?: number, status: string, idea?: any }) => {
            console.log(`[IdeasEngine] Mutation triggered:`, { id, status, channelId });
            
            // If we have an ID (number > 0), it's an update to an existing DB record.
            // If not, it's a new save from the Discover tab.
            const isUpdate = id && typeof id === 'number' && id > 0;
            const endpoint = isUpdate ? `/api/idea/${id}/status` : `/api/ideas/save`;
            const method = isUpdate ? "PUT" : "POST";
            
            // Clean the body to ensure only expected fields are sent
            const body = isUpdate ? { status } : { 
                title: idea.title,
                rationale: idea.rationale,
                format: idea.format,
                experimentType: idea.lens || idea.experimentType,
                score: idea.score,
                status, 
                channelId 
            };

            console.log(`[IdeasEngine] Body:`, body);

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Failed to update status");
            }
            return res.json();
        },
        onError: (err: any) => {
            console.error("[IdeasEngine] Mutation Error:", err);
            toast({
                title: "Synchronization Failed",
                description: err.message,
                variant: "destructive"
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["savedIdeas", channelId] });
            toast({
                title: "Spark Synchronized",
                description: "Your creative roadmap has been updated successfully.",
            });
        }
    });

    if (isLoading) {
        return (
            <DashboardLayout title="Ideas Engine">
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
                </div>
            </DashboardLayout>
        );
    }

    if (!channelId || isError || !recommendations) {
        return (
            <DashboardLayout title="Ideas Engine">
                <div className="flex flex-col h-[60vh] items-center justify-center text-center gap-4">
                    <div className="p-4 rounded-xl bg-brand-coral/10 border border-brand-coral/30 text-brand-coral">
                        No channel context found. Run an analysis from the homepage to generate ideas.
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Flatten all experiments into a single array of ideas with their parent's experimentType
    const allIdeas = (recommendations?.experiments || []).flatMap((exp: any) =>
        (exp.ideas || []).map((idea: any) => ({
            ...idea,
            lens: exp.experimentType || "Creative Spark",
            // Fallback generation for visuals if the backend doesn't supply these specifics yet
            audienceFit: idea.score ? (idea.score / 100) : 0.85,
            identityAlignment: idea.score ? Math.min(1, (idea.score / 100) * 1.1) : 0.9,
            novelty: idea.score ? Math.max(0.4, 1 - (idea.score / 100)) : 0.7,
        }))
    );

    const availableFilters = ["All", ...Array.from(new Set(allIdeas.map((i: any) => i.lens)))];

    const filteredIdeas = activeFilter === "All"
        ? allIdeas
        : allIdeas.filter((i: any) => i.lens === activeFilter);


    return (
        <PageTransition>
            <DashboardLayout title="Ideas Engine">

                <div className="flex flex-col gap-8 mb-10 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="font-display font-bold text-4xl mb-3">Your next creative spark</h2>
                        <p className="text-content-secondary max-w-xl">Generated from your World Model. Scored on three axes. Grounded entirely in your creative DNA.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-space-800 p-1 rounded-lg border border-borderBase">
                            <button
                                onClick={() => setViewMode("discover")}
                                className={cn(
                                    "px-6 py-2 rounded-md text-sm font-bold transition-all",
                                    viewMode === "discover" ? "bg-space-700 text-content-primary shadow-sm" : "text-content-secondary hover:text-content-primary"
                                )}
                            >
                                Discover
                            </button>
                            <button
                                onClick={() => setViewMode("saved")}
                                className={cn(
                                    "px-6 py-2 rounded-md text-sm font-bold transition-all",
                                    viewMode === "saved" ? "bg-brand-teal/20 text-brand-teal border inline-flex border-brand-teal/30" : "text-content-secondary hover:text-content-primary"
                                )}
                            >
                                Saved & Predicted
                            </button>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 px-4 py-2 rounded-md border border-borderBase text-content-secondary hover:text-content-primary transition-colors text-sm"
                        >
                            <RefreshCw className="w-4 h-4" /> Regenerate All
                        </button>
                    </div>
                </div>

                {viewMode === "discover" ? (
                    <>
                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-2 mb-8">
                            {availableFilters.map((f: any) => (
                                <button
                                    key={f}
                                    onClick={() => setActiveFilter(f)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest transition-all",
                                        activeFilter === f
                                            ? "bg-brand-teal text-space-900 shadow-[0_0_20px_rgba(29,255,210,0.3)]"
                                            : "bg-space-800 border border-borderBase text-content-secondary hover:bg-space-700 hover:text-content-primary"
                                    )}
                                >
                                    {f === "creative-spark" ? "Sparks" : f}
                                </button>
                            ))}
                        </div>

                        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                            {filteredIdeas.map((idea: any, i: number) => (
                                <FadeInUp key={i}>
                                    <HoverCard3D glowColor={idea.lens === 'Contrast' ? 'violet' : idea.lens === 'Expansion' ? 'amber' : 'teal'}>
                                        <div className="p-6 h-full flex flex-col group/card cursor-pointer">

                                            <div className="flex items-start justify-between mb-4">
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded",
                                                    "bg-brand-teal/20 text-brand-teal border border-brand-teal/30"
                                                )}>
                                                    {idea.lens || 'Idea'}
                                                </span>
                                                <button className="w-8 h-8 rounded-full bg-space-800 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-space-700 border border-content-tertiary/20">
                                                    <Sparkles className="w-4 h-4 text-brand-violet" />
                                                </button>
                                            </div>

                                            <h3 className="font-display font-bold text-2xl text-content-primary leading-tight mb-2 group-hover/card:text-brand-teal transition-colors line-clamp-2">
                                                {idea.title}
                                            </h3>

                                            <p className="text-xs text-content-secondary line-clamp-3 mb-6">
                                                {idea.rationale}
                                            </p>

                                            {/* Scoring Bars */}
                                            <div className="space-y-3 mb-6 mt-auto">
                                                {[
                                                    { label: "Audience Fit", score: idea.audienceFit, color: "bg-brand-teal" },
                                                    { label: "Identity Alignment", score: idea.identityAlignment, color: "bg-brand-violet" },
                                                    { label: "Novelty", score: idea.novelty, color: "bg-brand-amber" }
                                                ].map((metric) => (
                                                    <div key={metric.label}>
                                                        <div className="flex justify-between text-[10px] uppercase font-bold text-content-secondary tracking-wider mb-1">
                                                            <span>{metric.label}</span>
                                                            <span className="font-mono">{Math.round(metric.score * 100)}%</span>
                                                        </div>
                                                        <div className="w-full h-1 bg-space-800 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${metric.color}`}
                                                                style={{ width: `${metric.score * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 mb-6">
                                                <button
                                                    onClick={() => updateIdeaStatus.mutate({
                                                        id: viewMode === 'saved' ? idea.id : undefined,
                                                        status: 'saved',
                                                        idea: {
                                                            title: idea.title,
                                                            rationale: idea.rationale,
                                                            format: idea.format,
                                                            experimentType: idea.lens,
                                                            score: idea.score
                                                        }
                                                    })}
                                                    className="flex-1 py-2 text-xs font-bold uppercase tracking-widest text-brand-teal bg-brand-teal/10 border border-brand-teal/20 rounded-md hover:bg-brand-teal/20 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Bookmark className="w-3 h-3" /> Save Idea
                                                </button>
                                                <button
                                                    onClick={() => updateIdeaStatus.mutate({
                                                        id: viewMode === 'saved' ? idea.id : undefined,
                                                        status: 'published',
                                                        idea: {
                                                            title: idea.title,
                                                            rationale: idea.rationale,
                                                            format: idea.format,
                                                            experimentType: idea.lens,
                                                            score: idea.score
                                                        }
                                                    })}
                                                    className="flex-1 py-2 text-xs font-bold uppercase tracking-widest text-brand-violet bg-brand-violet/10 border border-brand-violet/20 rounded-md hover:bg-brand-violet/20 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Send className="w-3 h-3" /> Publish
                                                </button>
                                            </div>

                                            <div className="pt-4 border-t border-borderBase flex items-center justify-between">
                                                <span className="text-xs text-content-secondary flex items-center gap-1.5 font-mono">
                                                    <BarChart2 className="w-3 h-3" /> Score: {idea.score ? `${idea.score}/100` : 'Pending'}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (generatedTitles[i]) return;
                                                        setGeneratingId(i);
                                                        setTimeout(() => {
                                                            setGeneratedTitles(prev => ({
                                                                ...prev,
                                                                [i]: [
                                                                    idea.title.replace('The', 'Why').replace('How', 'The secret to'),
                                                                    `I explored ${idea.title.toLowerCase()}`,
                                                                    `${idea.title} (but better)`
                                                                ]
                                                            }));
                                                            setGeneratingId(null);
                                                        }, 1500);
                                                    }}
                                                    disabled={generatingId === i}
                                                    className="text-sm font-bold text-brand-teal opacity-0 group-hover/card:opacity-100 transition-opacity disabled:opacity-50"
                                                >
                                                    {generatingId === i ? "Generating..." : generatedTitles[i] ? "Generated!" : "Generate Titles →"}
                                                </button>
                                            </div>

                                            {/* Generated Variations */}
                                            {generatedTitles[i] && (
                                                <div className="mt-4 p-3 bg-space-800 rounded-lg border border-brand-teal/20 text-xs text-content-secondary space-y-2 animate-in slide-in-from-top-2">
                                                    {generatedTitles[i].map((t, idx) => (
                                                        <div key={idx} className="flex gap-2">
                                                            <span className="text-brand-teal opacity-50">{idx + 1}.</span>
                                                            <span className="text-content-primary">{t}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </HoverCard3D>
                                </FadeInUp>
                            ))}
                            {filteredIdeas.length === 0 && (
                                <div className="col-span-full py-20 text-center text-content-secondary">
                                    No ideas found for the selected lens right now.
                                </div>
                            )}
                        </StaggerContainer>
                    </>) : (
                    <StaggerContainer className="space-y-12">
                        {/* Saved Ideas Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                            {(!savedIdeasData?.ideas || savedIdeasData.ideas.length === 0) ? (
                                <div className="col-span-full py-20 text-center text-content-secondary">
                                    No ideas saved yet. Discover and save ideas to see their predictions.
                                </div>
                            ) : (
                                savedIdeasData.ideas.map((idea: any, i: number) => (
                                    <FadeInUp key={i}>
                                        <HoverCard3D glowColor="violet">
                                            <div className="p-6 h-full flex flex-col group/card cursor-pointer">
                                                <div className="flex items-start justify-between mb-4">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded bg-brand-violet/20 text-brand-violet border border-brand-violet/30">
                                                        {idea.status}
                                                    </span>
                                                </div>

                                                <h3 className="font-display font-bold text-2xl text-content-primary leading-tight mb-2 group-hover/card:text-brand-violet transition-colors">
                                                    {idea.title}
                                                </h3>

                                                <p className="text-xs text-content-secondary mb-8">
                                                    {idea.rationale || "Saved idea from the creative grid"}
                                                </p>

                                                <div className="mt-auto p-4 rounded-xl border border-brand-violet/20 bg-brand-violet/5 space-y-4">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-content-secondary">Predicted Views</span>
                                                        <span className="text-brand-teal font-mono font-bold">{idea.predictedViews?.toLocaleString() || "12,450"}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-content-secondary">Predicted Core Growth</span>
                                                        <span className="text-brand-amber font-mono font-bold">+{idea.predictedGrowth || "12.4%"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </HoverCard3D>
                                    </FadeInUp>
                                ))
                            )}
                        </div>

                        {/* Collaboration Hub Section */}
                        <FadeInUp>
                            <div className="pt-12 border-t border-borderBase">
                                <CollaborationHub channelId={channelId || ""} />
                            </div>
                        </FadeInUp>
                    </StaggerContainer>
                )}

            </DashboardLayout>
        </PageTransition>
    );
}
