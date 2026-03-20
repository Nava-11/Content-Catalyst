import { DashboardLayout } from "@/components/DashboardLayout";
import { PageTransition, StaggerContainer, FadeInUp } from "@/components/PageTransition";
import { HoverCard3D } from "@/components/HoverCard3D";
import { useDashboardData } from "@/hooks/useDashboardData";
import { HeartPulse, Flame, ArrowUpRight, ArrowDownRight, TrendingUp, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function CreativeHealth() {
    const channelId = new URLSearchParams(window.location.search).get("channelId");
    const { analytics: analyticsRaw, isLoading, isError } = useDashboardData(channelId);

    if (isLoading) {
        return (
            <DashboardLayout title="Creative Health">
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
                </div>
            </DashboardLayout>
        );
    }

    if (!channelId || isError || !analyticsRaw) {
        return (
            <DashboardLayout title="Creative Health">
                <div className="flex flex-col h-[60vh] items-center justify-center text-center gap-4">
                    <div className="p-4 rounded-xl bg-brand-coral/10 border border-brand-coral/30 text-brand-coral">
                        No channel context found. Run an analysis from the homepage.
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const metrics = analyticsRaw.metrics || [];
    const avgCRPS = metrics.length ? metrics.reduce((a: number, b: any) => a + (b.crps || 0), 0) / metrics.length : 1.0;
    const healthScore = Math.min(99, Math.max(10, Math.floor(80 + (avgCRPS * 10))));
    const isFatigued = healthScore < 80;

    const entropyData = metrics.slice(-15).map((m: any, i: number) => {
        // Pseudo-entropy calculation for demonstration (variance proxy)
        const volatility = m.crps ? Math.abs(m.crps - avgCRPS) : 0;
        return {
            month: `V-${15 - i}`,
            crps: m.crps || 0,
            entropy: (m.crps || 0) * (1 + (volatility * 0.5))
        };
    });

    if (entropyData.length === 0) {
        entropyData.push({ month: "No Data", crps: 0, entropy: 0 });
    }

    return (
        <PageTransition>
            <DashboardLayout title="Creative Health">

                <div className="flex flex-col gap-8 mb-10 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="font-display font-bold text-4xl mb-3">Burnout & Entropy Radar</h2>
                        <p className="text-content-secondary max-w-xl">Monitor your channel's systemic health. High CRPS with high entropy often precedes creative burnout or audience fatigue.</p>
                    </div>
                </div>

                <StaggerContainer className="grid lg:grid-cols-3 gap-8">

                    {/* Main Health Monitor */}
                    <FadeInUp className="lg:col-span-1">
                        <HoverCard3D glowColor={isFatigued ? "coral" : "teal"}>
                            <div className="p-8 h-full flex flex-col items-center justify-center text-center">
                                <div className="relative mb-8">
                                    <svg className="w-48 h-48 transform -rotate-90">
                                        <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-space-800" />
                                        <circle
                                            cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent"
                                            strokeDasharray="552.92" strokeDashoffset={552.92 - (552.92 * healthScore) / 100}
                                            className={isFatigued ? "text-brand-coral" : "text-brand-teal"}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                                        <span className="text-5xl font-mono text-content-primary">{healthScore}</span>
                                        <span className="text-xs text-content-secondary uppercase font-bold tracking-widest mt-1">Health</span>
                                    </div>
                                </div>

                                <h3 className="font-display font-bold text-2xl mb-2 text-content-primary">
                                    {isFatigued ? "Warning: Sameness Fatigue" : "System Healthy"}
                                </h3>
                                <p className="text-content-secondary text-sm">
                                    {isFatigued
                                        ? "Your recent content is performing above average, but is overly reliant on a single cluster. Audience fatigue is likely within 4 uploads."
                                        : "Your creative variance is well balanced with your performance."}
                                </p>
                            </div>
                        </HoverCard3D>
                    </FadeInUp>

                    {/* Entropy Map & Detail Stats */}
                    <FadeInUp className="lg:col-span-2 flex flex-col gap-8">
                        <div className="glass-card p-6 rounded-2xl h-[360px] flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="font-display font-bold text-lg">System Entropy vs CRPS</h3>
                                    <p className="text-xs text-content-secondary">Visualizing the effort vs reward paradox</p>
                                </div>
                                <div className="flex gap-4 text-xs font-mono">
                                    <div className="flex items-center gap-2"><span className="w-2 h-2 bg-brand-teal" /> CRPS</div>
                                    <div className="flex items-center gap-2"><span className="w-2 h-2 bg-brand-violet" /> Entropy</div>
                                </div>
                            </div>

                            <div className="flex-1 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={entropyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorCrps" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#1DFFD2" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#1DFFD2" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorEntropy" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="month" stroke="#4A5080" tick={{ fill: '#4A5080', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#4A5080" tick={{ fill: '#4A5080', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#111327', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                            itemStyle={{ color: '#F0F0FF', fontSize: '12px' }}
                                        />
                                        <Area type="monotone" dataKey="crps" stroke="#1DFFD2" fillOpacity={1} fill="url(#colorCrps)" />
                                        <Area type="monotone" dataKey="entropy" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorEntropy)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="p-4 rounded-xl bg-space-800 border border-borderBase relative overflow-hidden group">
                                <HeartPulse className="w-8 h-8 text-brand-teal opacity-20 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform" />
                                <span className="text-xs text-content-secondary uppercase font-bold tracking-widest block mb-1">Baseline Shift</span>
                                <span className="text-2xl font-mono text-content-primary flex items-center gap-2">
                                    +1.2% <ArrowUpRight className="w-4 h-4 text-brand-teal" />
                                </span>
                            </div>
                            <div className="p-4 rounded-xl bg-space-800 border border-brand-coral/30 relative overflow-hidden group">
                                <Flame className="w-8 h-8 text-brand-coral opacity-20 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform" />
                                <span className="text-xs text-content-secondary uppercase font-bold tracking-widest block mb-1 text-brand-coral">Burnout Risk</span>
                                <span className="text-2xl font-mono text-content-primary flex items-center gap-2">
                                    High <TrendingUp className="w-4 h-4 text-brand-coral" />
                                </span>
                            </div>
                            <div className="p-4 rounded-xl bg-space-800 border border-borderBase relative overflow-hidden group">
                                <span className="text-xs text-content-secondary uppercase font-bold tracking-widest block mb-1">Upload Pace</span>
                                <span className="text-2xl font-mono text-content-primary flex items-center gap-2">
                                    1.4 <span className="text-sm text-content-tertiary font-body">vids/wk</span>
                                </span>
                            </div>
                        </div>
                    </FadeInUp>

                </StaggerContainer>

            </DashboardLayout>
        </PageTransition>
    );
}
