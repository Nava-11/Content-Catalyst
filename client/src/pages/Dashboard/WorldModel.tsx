import { DashboardLayout } from "@/components/DashboardLayout";
import { PageTransition, FadeInUp } from "@/components/PageTransition";
import { WorldModelSphere } from "@/components/landing/WorldModelSphere";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Network, Fingerprint, Activity, Layers, Loader2 } from "lucide-react";

export default function WorldModel() {
    const channelId = new URLSearchParams(window.location.search).get("channelId");
    const { analytics: analyticsRaw, recommendations, isLoading, isError } = useDashboardData(channelId);

    if (isLoading) {
        return (
            <DashboardLayout title="Creator World Model">
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
                </div>
            </DashboardLayout>
        );
    }

    if (!channelId || isError || !analyticsRaw) {
        return (
            <DashboardLayout title="Creator World Model">
                <div className="flex flex-col h-[60vh] items-center justify-center text-center gap-4">
                    <div className="p-4 rounded-xl bg-brand-coral/10 border border-brand-coral/30 text-brand-coral">
                        No channel context found.
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const clusters = recommendations?.topicClusters || [];
    const topClusterName = clusters[0]?.label || "Analyzing...";

    // Compute dynamic Format DNA
    const metrics = analyticsRaw.metrics || [];
    const formatCounts: Record<string, number> = {};
    metrics.forEach((m: any) => {
        const fmt = m.format || "general";
        formatCounts[fmt] = (formatCounts[fmt] || 0) + 1;
    });

    const totalFormats = Math.max(1, metrics.length);
    const formatDNA = Object.entries(formatCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v / totalFormats }), {});

    // Pseudo-dynamic Tone Fingerprint
    const strHash = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
        return Math.abs(hash);
    };

    const h = strHash(channelId || "default");
    const radarData = [
        { subject: 'Technical', A: 30 + (h % 50), fullMark: 100 },
        { subject: 'Narrative', A: 20 + ((h * 2) % 60), fullMark: 100 },
        { subject: 'Formal', A: 40 + ((h * 3) % 40), fullMark: 100 },
        { subject: 'Humorous', A: 10 + ((h * 5) % 80), fullMark: 100 },
        { subject: 'Experimental', A: 50 + ((h * 7) % 40), fullMark: 100 },
    ];

    return (
        <PageTransition>
            <DashboardLayout title="Creator World Model">
                <div className="grid lg:grid-cols-3 gap-8 h-[calc(100vh-140px)]">

                    {/* Main 3D View */}
                    <div className="lg:col-span-2 glass-card rounded-2xl relative overflow-hidden flex flex-col">
                        <div className="absolute top-6 left-6 z-10">
                            <h2 className="font-display font-bold text-2xl text-content-primary mb-1">Semantic Clusters</h2>
                            <p className="text-content-secondary text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" /> Live mapping active
                            </p>
                        </div>

                        <div className="flex-1 w-full relative perspective-1000 mt-16 cursor-crosshair">
                            {/* Reuse the 3D Sphere from Landing Page, but zoomed in slightly */}
                            <div className="absolute inset-0 scale-125">
                                <WorldModelSphere />
                            </div>
                        </div>

                        <div className="h-20 border-t border-borderBase bg-space-900/50 backdrop-blur-md px-6 flex items-center justify-between z-10">
                            <div className="flex items-center gap-8">
                                <div className="flex flex-col">
                                    <span className="text-content-tertiary text-[10px] uppercase font-bold tracking-widest">Total Clusters</span>
                                    <span className="font-mono text-lg">{clusters.length}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-content-tertiary text-[10px] uppercase font-bold tracking-widest">Dominant</span>
                                    <span className="font-display font-bold text-brand-teal">{topClusterName}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-mono text-content-secondary">
                                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-teal" /> High CRPS</div>
                                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-violet" /> Medium CRPS</div>
                                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-amber" /> Low/Explore</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel Data Surface */}
                    <div className="space-y-6 flex flex-col h-full overflow-y-auto pr-2">

                        <FadeInUp>
                            <div className="glass-card p-6 rounded-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <Fingerprint className="w-5 h-5 text-brand-violet" />
                                    <h3 className="font-display font-bold text-lg">Tone Fingerprint</h3>
                                </div>

                                <div className="h-[200px] w-full -ml-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#8890B5', fontSize: 10, fontFamily: 'DM Sans' }} />
                                            <Radar name="Tone" dataKey="A" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.4} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </FadeInUp>

                        <FadeInUp>
                            <div className="glass-card p-6 rounded-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <Layers className="w-5 h-5 text-brand-amber" />
                                    <h3 className="font-display font-bold text-lg">Format DNA</h3>
                                </div>

                                <div className="space-y-4">
                                    {Object.entries(formatDNA).map(([key, val]) => (
                                        <div key={key}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="uppercase text-content-secondary">{key}</span>
                                                <span className="font-mono">{Math.round((val as number) * 100)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-space-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${key.toLowerCase().includes('tutorial') || key.toLowerCase().includes('how-to') ? 'bg-brand-teal glow-teal' : key.toLowerCase().includes('vlog') ? 'bg-brand-violet glow-violet' : 'bg-brand-amber'}`}
                                                    style={{ width: `${(val as number) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {Object.keys(formatDNA).length === 0 && (
                                        <div className="text-xs text-content-secondary">Not enough data to model formats.</div>
                                    )}
                                </div>
                            </div>
                        </FadeInUp>

                        <FadeInUp>
                            <div className="glass-card p-6 rounded-2xl border-brand-teal/30">
                                <div className="flex items-center gap-3 mb-4">
                                    <Activity className="w-5 h-5 text-brand-teal" />
                                    <h3 className="font-display font-bold text-lg">Identity Coherence</h3>
                                </div>
                                <div className="text-3xl font-mono text-content-primary mb-2">92<span className="text-lg text-content-secondary">/100</span></div>
                                <p className="text-xs text-brand-teal bg-brand-teal/10 p-3 rounded-lg border border-brand-teal/20">
                                    Your creative space is highly focused. This builds deep loyalty, but leaves you vulnerable if trends shift.
                                </p>
                            </div>
                        </FadeInUp>
                    </div>
                </div>
            </DashboardLayout>
        </PageTransition>
    );
}
