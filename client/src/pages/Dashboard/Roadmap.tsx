import { DashboardLayout } from "@/components/DashboardLayout";
import { PageTransition, StaggerContainer, FadeInUp } from "@/components/PageTransition";
import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, AlertTriangle, AlertCircle, Compass, Target, ArrowRight, Activity } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type RoadmapItem = {
    week: number;
    title: string;
    topic: string;
    clusterSource: string;
    noveltyScore: number;
    predictedCrps: number;
    strategyType: "Core" | "Expansion" | "Experimental";
    suggestedTitles: string[];
};

type RoadmapResponse = {
    channel: string;
    generatedAt: string;
    roadmap: {
        month1: RoadmapItem[];
        month2: RoadmapItem[];
        month3: RoadmapItem[];
    };
    insights: {
        topCluster: string;
        decliningCluster: string;
        fatigueRisk: string;
        entropy: number;
    };
};

export default function Roadmap() {
    const { user } = useAuth();
    const searchParams = new URLSearchParams(window.location.search);
    const channelId = searchParams.get("channelId") || user?.channelId;

    const { data: roadmapData, isLoading, isError } = useQuery<RoadmapResponse>({
        queryKey: ["roadmap", channelId],
        queryFn: async () => {
            if (!channelId) throw new Error("No channel ID");
            const res = await fetch(`/api/roadmap/${channelId}`);
            if (!res.ok) throw new Error("Failed to fetch roadmap data");
            return res.json();
        },
        enabled: !!channelId,
    });

    if (isLoading) {
        return (
            <DashboardLayout title="Dynamic Roadmap">
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
                </div>
            </DashboardLayout>
        );
    }

    if (isError || !channelId || !roadmapData) {
        return (
            <DashboardLayout title="Dynamic Roadmap">
                <div className="flex flex-col h-[60vh] items-center justify-center text-center gap-4">
                    <div className="p-4 rounded-xl bg-brand-coral/10 border border-brand-coral/30 text-brand-coral">
                        Roadmap data not available yet. Please complete a channel analysis first.
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const { insights, roadmap } = roadmapData;

    const renderWeekCard = (item: RoadmapItem) => {
        const theme =
            item.strategyType === "Core" ? { color: "text-brand-teal", bg: "bg-brand-teal/10", border: "border-brand-teal" } :
                item.strategyType === "Expansion" ? { color: "text-brand-violet", bg: "bg-brand-violet/10", border: "border-brand-violet" } :
                    { color: "text-brand-amber", bg: "bg-brand-amber/10", border: "border-brand-amber" };

        return (
            <div key={item.week} className="min-w-[300px] w-[300px] snap-start glass-card p-5 rounded-2xl flex flex-col justify-between shrink-0 border border-borderBase hover:border-brand-teal/50 transition-colors group">
                <div>
                    <div className="flex items-center justify-between mb-3 text-xs font-bold uppercase tracking-widest text-content-tertiary">
                        <span>Week {item.week}</span>
                        <div className={`px-2 py-0.5 rounded ${theme.bg} ${theme.color}`}>
                            {item.strategyType}
                        </div>
                    </div>
                    <h4 className="font-display font-bold text-lg text-content-primary mb-2 line-clamp-2">{item.title}</h4>
                    <p className="text-sm text-content-secondary mb-4 flex items-center gap-1.5"><Target className="w-3 h-3" /> Focus: {item.topic}</p>

                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs">
                            <span className="text-content-tertiary">Novelty Score</span>
                            <span className="font-mono text-content-secondary">{(item.noveltyScore * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1 bg-space-800 rounded overflow-hidden">
                            <div className={`h-full ${theme.bg.replace('/10', '')}`} style={{ width: `${item.noveltyScore * 100}%` }} />
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-borderBase">
                    <h5 className="text-[10px] font-bold text-content-tertiary uppercase tracking-widest mb-2">AI Suggested Titles</h5>
                    <ul className="text-xs space-y-2 overflow-y-auto max-h-24 pr-2 custom-scrollbar">
                        {item.suggestedTitles.map((title, i) => (
                            <li key={i} className="text-content-secondary flex items-start gap-1.5 hover:text-content-primary transition-colors cursor-pointer">
                                <ArrowRight className="w-3 h-3 mt-0.5 shrink-0 opacity-50" />
                                <span className="line-clamp-2 leading-tight">{title}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    };

    return (
        <PageTransition>
            <DashboardLayout title="Dynamic Roadmap">

                {/* Header & Insights */}
                <div className="flex flex-col gap-8 mb-8">
                    <div>
                        <h2 className="font-display font-bold text-4xl mb-3">90-Day Growth Strategy</h2>
                        <p className="text-content-secondary max-w-2xl text-sm leading-relaxed">
                            An AI-generated tactical plan balancing core audience retention with strategic expansion. Refined weekly based on your channel's creative entropy and cluster performance.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FadeInUp>
                            <div className="glass-card p-6 rounded-2xl h-full border-brand-teal/20">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs uppercase font-bold tracking-widest text-content-secondary">Anchor Topic</h3>
                                    <TrendingUp className="w-4 h-4 text-brand-teal" />
                                </div>
                                <div className="font-display font-bold text-2xl text-content-primary truncate" title={insights.topCluster}>
                                    {insights.topCluster}
                                </div>
                                <p className="text-xs text-brand-teal mt-2">Highest CRPS driver. Core retention.</p>
                            </div>
                        </FadeInUp>
                        <FadeInUp delay={0.1}>
                            <div className="glass-card p-6 rounded-2xl bg-brand-coral/5 border-brand-coral/20">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs uppercase font-bold tracking-widest text-content-secondary">Declining Topic</h3>
                                    <AlertCircle className="w-4 h-4 text-brand-coral" />
                                </div>
                                <div className="font-display font-bold text-2xl text-content-primary truncate" title={insights.decliningCluster}>
                                    {insights.decliningCluster}
                                </div>
                                <p className="text-xs text-brand-coral font-medium mt-2">Format fatigue detected. Pivot recommended.</p>
                            </div>
                        </FadeInUp>
                        <FadeInUp delay={0.2}>
                            <div className="glass-card p-6 rounded-2xl border-brand-violet/20">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs uppercase font-bold tracking-widest text-content-secondary">System Health</h3>
                                    <Activity className="w-4 h-4 text-brand-violet" />
                                </div>
                                <div className="font-display font-bold text-2xl text-content-primary">
                                    Entropy: {insights.entropy.toFixed(2)}
                                </div>
                                <p className="text-xs text-content-secondary mt-2">
                                    Fatigue Phase: <span className="font-bold text-content-primary">{insights.fatigueRisk}</span>
                                </p>
                            </div>
                        </FadeInUp>
                    </div>
                </div>

                {/* Timelines */}
                <StaggerContainer className="space-y-12 pb-12">

                    {/* Month 1 */}
                    <FadeInUp delay={0.3}>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-brand-teal text-space-900 px-3 py-1 roundedtext-xs font-bold uppercase tracking-widest rounded-md text-xs">Ph 1: Reinforce Core</span>
                            <div className="h-px bg-borderBase flex-1" />
                        </div>
                        <div className="flex overflow-x-auto gap-6 pb-4 md:snap-x md:snap-mandatory custom-scrollbar">
                            {roadmap.month1.map(renderWeekCard)}
                        </div>
                    </FadeInUp>

                    {/* Month 2 */}
                    <FadeInUp delay={0.4}>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-brand-violet text-space-900 px-3 py-1 roundedtext-xs font-bold uppercase tracking-widest rounded-md text-xs">Ph 2: Strategic Expansion</span>
                            <div className="h-px bg-borderBase flex-1" />
                        </div>
                        <div className="flex overflow-x-auto gap-6 pb-4 md:snap-x md:snap-mandatory custom-scrollbar">
                            {roadmap.month2.map(renderWeekCard)}
                        </div>
                    </FadeInUp>

                    {/* Month 3 */}
                    <FadeInUp delay={0.5}>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-brand-amber text-space-900 px-3 py-1 roundedtext-xs font-bold uppercase tracking-widest rounded-md text-xs">Ph 3: Exploration</span>
                            <div className="h-px bg-borderBase flex-1" />
                        </div>
                        <div className="flex overflow-x-auto gap-6 pb-4 md:snap-x md:snap-mandatory custom-scrollbar">
                            {roadmap.month3.map(renderWeekCard)}
                        </div>
                    </FadeInUp>

                </StaggerContainer>

            </DashboardLayout>
        </PageTransition>
    );
}
