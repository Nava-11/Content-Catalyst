import { DashboardLayout } from "@/components/DashboardLayout";
import { PageTransition, StaggerContainer, FadeInUp } from "@/components/PageTransition";
import { HoverCard3D } from "@/components/HoverCard3D";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Play, TrendingUp, Activity, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { IntelligenceSuite } from "@/components/IntelligenceSuite";
import { DNAEvolution } from "@/components/DNAEvolution";
import { LiveChannelPulse } from "@/components/LiveChannelPulse";
import { AIPlayer } from "@/components/AIPlayer";
import { NarrativeGraph } from "@/components/NarrativeGraph";
import { SkillScore } from "@/components/SkillScore";

export default function Overview() {
    // Replaces user auth dependency with standalone Channel ID
    const channelId = new URLSearchParams(window.location.search).get("channelId");
    const { analytics: analyticsRaw, recommendations, isLoading, isError } = useDashboardData(channelId);

    if (isLoading) {
        return (
            <DashboardLayout title="Overview">
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
                </div>
            </DashboardLayout>
        );
    }

    if (!channelId || isError || !analyticsRaw) {
        return (
            <DashboardLayout title="Overview">
                <div className="flex flex-col h-[60vh] items-center justify-center text-center gap-4">
                    <div className="p-4 rounded-xl bg-brand-coral/10 border border-brand-coral/30 text-brand-coral">
                        No channel context found or failed to load data. Please return to the homepage and run an analysis.
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Default calculations derived from the real data
    const analytics = analyticsRaw.analytics || { totalVideos: 0 };
    const metrics = analyticsRaw.metrics || [];

    const avgCRPS = metrics.length ? (metrics.reduce((a: number, b: any) => a + (b.crps || 0), 0) / metrics.length).toFixed(2) : "0.00";
    const perform = metrics.slice(-10).map((m: any) => ({ val: m.crps }));
    const performanceData = perform.length > 0 ? perform : [{ val: 0 }];

    const topCluster = recommendations?.topicClusters?.[0]?.label || "Analyzing...";
    const clusterCount = recommendations?.topicClusters?.length || 0;

    // Flatten ideas from experiments
    const recentIdeas = recommendations?.experiments?.flatMap((e: any) => e.ideas).slice(0, 5) || [];
    const healthScore = Math.min(99, Math.max(10, Math.floor(80 + (parseFloat(avgCRPS) * 10))));

    return (
        <PageTransition>
            <DashboardLayout title="Overview">
                <StaggerContainer className="space-y-8 pb-12">

                    {/* Creative Intelligence Suite (High-Tier Signals) */}
                    <FadeInUp>
                        <IntelligenceSuite channelId={channelId} />
                    </FadeInUp>

                    {/* Top Metric Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FadeInUp>
                            <HoverCard3D glowColor="none">
                                <div className="p-6 h-full flex flex-col border-t-[3px] border-t-brand-violet rounded-t-2xl">
                                    <div className="flex items-center gap-2 text-content-secondary mb-4">
                                        <Play className="w-4 h-4 text-brand-violet" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Videos Analyzed</span>
                                    </div>
                                    <div className="text-4xl font-mono text-content-primary">{analytics.totalVideos}</div>
                                </div>
                            </HoverCard3D>
                        </FadeInUp>

                        <FadeInUp>
                            <HoverCard3D glowColor="none">
                                <div className="p-6 h-full flex flex-col border-t-[3px] border-t-brand-teal rounded-t-2xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 text-content-secondary">
                                            <TrendingUp className="w-4 h-4 text-brand-teal" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Avg CRPS</span>
                                        </div>
                                        <span className="text-xs font-bold text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded flex items-center gap-1"><TrendingUp className="w-3 h-3" /> 12%</span>
                                    </div>
                                    <div className="text-4xl font-mono text-content-primary">{avgCRPS}</div>
                                </div>
                            </HoverCard3D>
                        </FadeInUp>

                        <FadeInUp>
                            <HoverCard3D glowColor="none">
                                <div className="p-6 h-full flex flex-col border-t-[3px] border-t-brand-amber rounded-t-2xl">
                                    <div className="flex items-center gap-2 text-content-secondary mb-4">
                                        <Activity className="w-4 h-4 text-brand-amber" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Health Index</span>
                                    </div>
                                    <div className="text-4xl font-mono text-content-primary flex items-baseline gap-1">
                                        {healthScore}
                                        <span className="text-lg text-content-secondary">/100</span>
                                    </div>
                                </div>
                            </HoverCard3D>
                        </FadeInUp>

                        <FadeInUp>
                            <HoverCard3D glowColor="none">
                                <div className="p-6 h-full flex flex-col border-t-[3px] border-t-content-secondary rounded-t-2xl">
                                    <div className="flex items-center gap-2 text-content-secondary mb-4">
                                        <Sparkles className="w-4 h-4 text-content-secondary" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Top Cluster</span>
                                    </div>
                                    <div className="text-xl font-display font-bold text-content-primary leading-tight">
                                        {topCluster}
                                    </div>
                                </div>
                            </HoverCard3D>
                        </FadeInUp>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* World Model Mini */}
                        <FadeInUp className="lg:col-span-2">
                            <div className="glass-card rounded-2xl p-6 h-[400px] flex flex-col relative overflow-hidden group">
                                <div className="flex items-center justify-between mb-2 relative z-10">
                                    <h3 className="font-display font-bold text-lg">World Model Preview</h3>
                                    <a href="/dashboard/world-model" className="text-xs text-brand-teal hover:underline flex items-center gap-1 focus:outline-none">
                                        Full View <ArrowRight className="w-3 h-3" />
                                    </a>
                                </div>
                                <p className="text-sm text-content-secondary relative z-10 mb-4">Your creative identity mapped across {clusterCount} topics.</p>

                                {/* Simulated 3D nodes using CSS for performance in overview */}
                                <div className="flex-1 w-full bg-space-800/50 rounded-xl border border-white/5 relative flex items-center justify-center -mt-6">
                                    <div className="absolute inset-0 flex items-center justify-center opacity-40">
                                        {/* Simple CSS abstraction of the 3D sphere so it loads fast here */}
                                        <div className="w-40 h-40 rounded-full border border-brand-teal/20 animate-[spin_10s_linear_infinite]" />
                                        <div className="w-56 h-56 rounded-[40%] border border-brand-violet/20 absolute animate-[spin_15s_linear_infinite]" />
                                        <div className="w-16 h-16 bg-brand-teal rounded-full absolute glow-teal animate-pulse" style={{ transform: 'translate(-40px, -20px)' }} />
                                        <div className="w-10 h-10 bg-brand-violet rounded-full absolute glow-violet" style={{ transform: 'translate(60px, 40px)' }} />
                                        <div className="w-12 h-12 bg-brand-amber rounded-full absolute glow-teal" style={{ transform: 'translate(10px, -70px)' }} />
                                    </div>
                                    <div className="z-10 text-center">
                                        <span className="px-3 py-1.5 rounded-full bg-space-900 border border-content-tertiary/20 text-xs text-content-secondary uppercase tracking-widest font-bold">
                                            Interactive 3D View Available
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </FadeInUp>

                        {/* Recent Ideas */}
                        <FadeInUp>
                            <div className="glass-card rounded-2xl p-6 h-[400px] flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-display font-bold text-lg">Recent Sparks</h3>
                                    <a href="/dashboard/ideas" className="text-xs text-brand-teal hover:underline flex items-center gap-1 focus:outline-none">
                                        View All <ArrowRight className="w-3 h-3" />
                                    </a>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                                    {recentIdeas.map((idea: any, i: number) => (
                                        <div key={i} className="p-4 rounded-xl bg-space-800 border border-borderBase hover:border-brand-teal/50 transition-colors group cursor-pointer">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-brand-violet/20 text-brand-violet">
                                                    {idea.format || 'Idea'}
                                                </span>
                                                <span className="text-xs text-brand-teal opacity-0 group-hover:opacity-100 transition-opacity">Spark →</span>
                                            </div>
                                            <h4 className="font-body font-bold text-sm text-content-primary leading-tight line-clamp-2">{idea.title}</h4>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </FadeInUp>

                        {/* Creative Health Timeline */}
                        <FadeInUp className="lg:col-span-3">
                            <div className="glass-card rounded-2xl p-6 h-[300px] flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="font-display font-bold text-lg">Creative Health Timeline</h3>
                                        <p className="text-xs text-content-secondary">CRPS trajectory over your last 10 uploads</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-teal" /> CRPS</div>
                                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-coral" /> Fatigue Zone</div>
                                    </div>
                                </div>

                                <div className="flex-1 w-full relative">
                                    {/* Fatigue Zone Overlay */}
                                    <div className="absolute bottom-0 w-full h-[30%] bg-gradient-to-t from-brand-coral/10 to-transparent pointer-events-none" />

                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={performanceData}>
                                            <YAxis domain={['auto', 'auto']} hide />
                                            <Line
                                                type="monotone"
                                                dataKey="val"
                                                stroke="#1DFFD2"
                                                strokeWidth={3}
                                                dot={{ r: 4, fill: "#05060F", stroke: "#1DFFD2", strokeWidth: 2 }}
                                                activeDot={{ r: 6, fill: "#1DFFD2" }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </FadeInUp>

                        {/* Phase 17 & 18: DNA & Real-Time Pulse */}
                        <FadeInUp className="lg:col-span-2">
                            <div className="glass-card rounded-2xl p-8">
                                <DNAEvolution channelId={channelId} />
                            </div>
                        </FadeInUp>

                        <FadeInUp>
                            <div className="glass-card rounded-2xl p-8 h-full">
                                <LiveChannelPulse channelId={channelId} />
                            </div>
                        </FadeInUp>

                        {/* Phase 20: AI Co-Creator Agent */}
                        <FadeInUp className="lg:col-span-3">
                            <div className="glass-card rounded-2xl p-10 bg-gradient-to-br from-space-950 via-space-900 to-space-950 border-brand-violet/20 shadow-[0_0_50px_rgba(139,92,246,0.05)]">
                                <AIPlayer channelId={channelId} />
                            </div>
                        </FadeInUp>

                        {/* Phase 21: Narrative Graph */}
                        <FadeInUp className="lg:col-span-3">
                            <div className="glass-card rounded-2xl p-8">
                                <NarrativeGraph channelId={channelId} />
                            </div>
                        </FadeInUp>

                        {/* Phase 22: Skill Evolution */}
                        <FadeInUp className="lg:col-span-3">
                            <div className="glass-card rounded-2xl p-10 bg-gradient-to-br from-space-950 to-space-900 border-brand-amber/20 shadow-[0_0_50px_rgba(251,191,36,0.05)]">
                                <SkillScore channelId={channelId} />
                            </div>
                        </FadeInUp>

                    </div>
                </StaggerContainer>
            </DashboardLayout>
        </PageTransition>
    );
}
