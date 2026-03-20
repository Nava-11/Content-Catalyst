import { DashboardLayout } from "@/components/DashboardLayout";
import { PageTransition, StaggerContainer, FadeInUp } from "@/components/PageTransition";
import { HoverCard3D } from "@/components/HoverCard3D";
import { useState } from "react";
import { Beaker, BarChart3, Binary, Zap, Play, Loader2, GitCompare, MousePointer2 } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip, AreaChart, Area } from "recharts";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SimulationLab() {
    const channelId = new URLSearchParams(window.location.search).get("channelId");
    const { recommendations, isLoading } = useDashboardData(channelId);

    const [activeTab, setActiveTab] = useState<'retention' | 'ab'>('retention');
    
    // Retention Forecast State
    const [format, setFormat] = useState('Deep Dive');
    const [depth, setDepth] = useState(70);
    const [isSequel, setIsSequel] = useState(false);

    // A/B State
    const [conceptA, setConceptA] = useState({ title: "How I Built a Vector DB", hook: "Intense" });
    const [conceptB, setConceptB] = useState({ title: "Vector Databases: The Full Guide", hook: "Educational" });

    const simulateRetention = useMutation({
        mutationFn: async (params: any) => {
            const res = await apiRequest("POST", "/api/features/simulate/retention", params);
            return res.json();
        }
    });

    const simulateAB = useMutation({
        mutationFn: async (params: any) => {
            const res = await apiRequest("POST", "/api/features/simulate/ab", params);
            return res.json();
        }
    });

    if (isLoading) return <div className="flex h-screen items-center justify-center bg-space-950"><Loader2 className="w-8 h-8 animate-spin text-brand-teal" /></div>;

    return (
        <PageTransition>
            <DashboardLayout title="Simulation Lab">
                <StaggerContainer className="space-y-8 pb-12">
                    
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="text-brand-teal text-[10px] font-bold uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                                <Beaker className="w-3 h-3" /> Creative Particle Accelerator
                            </div>
                            <h2 className="font-display font-bold text-4xl mb-2">Simulation Lab</h2>
                            <p className="text-content-secondary max-w-xl text-sm">Test narrative physics and algorithmic gravity in a sandbox environment before you hit upload.</p>
                        </div>

                        <div className="flex p-1 bg-space-900 rounded-xl border border-borderBase">
                            <button 
                                onClick={() => setActiveTab('retention')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'retention' ? 'bg-brand-teal text-space-950' : 'text-content-secondary hover:text-content-primary'}`}
                            >
                                Retention Forecast
                            </button>
                            <button 
                                onClick={() => setActiveTab('ab')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'ab' ? 'bg-brand-teal text-space-950' : 'text-content-secondary hover:text-content-primary'}`}
                            >
                                A/B Concept Tester
                            </button>
                        </div>
                    </div>

                    {activeTab === 'retention' ? (
                        <div className="grid lg:grid-cols-12 gap-8">
                            {/* Controls */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="glass-card p-6 rounded-2xl border-brand-teal/20">
                                    <h4 className="text-xs uppercase font-bold tracking-widest text-content-tertiary mb-6">Simulation Parameters</h4>
                                    
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-content-secondary uppercase tracking-wider">Content Format</label>
                                            <select 
                                                value={format}
                                                onChange={(e) => setFormat(e.target.value)}
                                                className="w-full bg-space-900 border border-borderBase rounded-lg p-3 text-sm focus:outline-none focus:border-brand-teal"
                                            >
                                                <option>Deep Dive</option>
                                                <option>Tutorial</option>
                                                <option>Case Study</option>
                                                <option>Story Vlog</option>
                                            </select>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold text-content-secondary uppercase tracking-wider flex justify-between">
                                                Technical Intensity <span>{depth}%</span>
                                            </label>
                                            <input 
                                                type="range"
                                                min="0" max="100"
                                                value={depth}
                                                onChange={(e) => setDepth(parseInt(e.target.value))}
                                                className="w-full appearance-none h-1 bg-space-800 rounded-lg accent-brand-teal"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-space-900 rounded-lg border border-borderBase">
                                            <span className="text-xs font-bold text-content-secondary">Is Series Sequel?</span>
                                            <input 
                                                type="checkbox" 
                                                checked={isSequel}
                                                onChange={() => setIsSequel(!isSequel)}
                                                className="w-4 h-4 rounded border-borderBase accent-brand-teal"
                                            />
                                        </div>

                                        <button 
                                            onClick={() => simulateRetention.mutate({ format, technicalDepth: depth, isSequel, duration: 600 })}
                                            className="w-full h-12 bg-brand-teal text-space-950 font-bold rounded-xl flex items-center justify-center gap-2 hover:glow-teal transition-all active:scale-95"
                                        >
                                            {simulateRetention.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                            Run Accelerator
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="lg:col-span-8 flex flex-col gap-6">
                                <HoverCard3D glowColor="teal">
                                    <div className="p-8 h-full bg-space-950/50">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded bg-brand-teal/10 border border-brand-teal/20 text-brand-teal">
                                                    <Binary className="w-4 h-4" />
                                                </div>
                                                <h3 className="font-display font-bold text-xl">Predicted Retention Curve</h3>
                                            </div>
                                            {simulateRetention.data && (
                                                <div className="text-xs font-mono text-brand-teal px-3 py-1 bg-brand-teal/5 rounded-full border border-brand-teal/20">
                                                    Confidence: {simulateRetention.data.confidence * 100}%
                                                </div>
                                            )}
                                        </div>

                                        <div className="h-64 w-full relative">
                                            {simulateRetention.data ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={simulateRetention.data.retentionCurve.map((y: number, x: number) => ({ x, y }))}>
                                                        <defs>
                                                            <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#1DFFD2" stopOpacity={0.3}/>
                                                                <stop offset="95%" stopColor="#1DFFD2" stopOpacity={0}/>
                                                            </linearGradient>
                                                        </defs>
                                                        <Tooltip 
                                                            contentStyle={{ backgroundColor: '#05060F', border: '1px solid #1DFFD222', borderRadius: '8px' }}
                                                            itemStyle={{ color: '#1DFFD2', fontSize: '12px' }}
                                                        />
                                                        <Area type="monotone" dataKey="y" stroke="#1DFFD2" fillOpacity={1} fill="url(#colorY)" strokeWidth={3} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-content-tertiary gap-3 border-2 border-dashed border-borderBase rounded-2xl">
                                                    <Zap className="w-8 h-8 opacity-20" />
                                                    <p className="text-xs font-mono tracking-widest uppercase">Awaiting Simulation Parameters</p>
                                                </div>
                                            )}
                                        </div>

                                        {simulateRetention.data && (
                                            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-borderBase">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] text-content-tertiary uppercase font-bold tracking-widest">Predicted CRPS</span>
                                                    <span className="text-2xl font-mono text-brand-teal">{simulateRetention.data.predictedCrps}</span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] text-content-tertiary uppercase font-bold tracking-widest">End Retention</span>
                                                    <span className="text-2xl font-mono text-content-primary">
                                                        {simulateRetention.data.retentionCurve[59]}%
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </HoverCard3D>
                            </div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* A/B Logic */}
                            <div className="space-y-6">
                                <div className="glass-card p-6 rounded-2xl border-brand-teal/20">
                                    <div className="flex items-center gap-2 mb-6 text-brand-teal">
                                        <GitCompare className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Concept Comparison</span>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h5 className="text-[10px] uppercase font-bold text-content-secondary tracking-widest border-l-2 border-brand-teal pl-3">Variant A</h5>
                                            <input 
                                                value={conceptA.title}
                                                onChange={(e) => setConceptA({...conceptA, title: e.target.value})}
                                                placeholder="Title concept A..."
                                                className="w-full bg-space-900 border border-borderBase p-3 text-sm rounded-lg"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <h5 className="text-[10px] uppercase font-bold text-content-secondary tracking-widest border-l-2 border-brand-violet pl-3">Variant B</h5>
                                            <input 
                                                value={conceptB.title}
                                                onChange={(e) => setConceptB({...conceptB, title: e.target.value})}
                                                placeholder="Title concept B..."
                                                className="w-full bg-space-900 border border-borderBase p-3 text-sm rounded-lg"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => simulateAB.mutate({ conceptA, conceptB })}
                                            className="w-full h-12 bg-brand-violet text-white font-bold rounded-xl hover:glow-violet transition-all"
                                        >
                                            Compare Gravitational Pull
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-8">
                                {simulateAB.data ? (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="h-full glass-card p-10 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-teal to-transparent" />
                                        <div className="p-4 rounded-full bg-brand-teal/10 border border-brand-teal/30 mb-6">
                                            <MousePointer2 className="w-8 h-8 text-brand-teal glow-teal" />
                                        </div>
                                        <span className="text-[10px] font-bold text-content-secondary uppercase tracking-widest mb-2">Simulated Winner</span>
                                        <h3 className="text-2xl font-display font-bold text-content-primary mb-2">Variant {simulateAB.data.winner}</h3>
                                        <p className="text-sm text-content-secondary mb-6">Predicted to outperform by <span className="text-brand-teal font-bold">{simulateAB.data.margin.toFixed(1)}%</span> in CTR velocity.</p>
                                        
                                        <div className="w-full h-2 bg-space-800 rounded-full overflow-hidden flex">
                                            <div style={{ width: simulateAB.data.winner === 'A' ? '65%' : '35%' }} className={cn("h-full", simulateAB.data.winner === 'A' ? "bg-brand-teal" : "bg-brand-violet")} />
                                            <div style={{ width: simulateAB.data.winner === 'B' ? '65%' : '35%' }} className={cn("h-full", simulateAB.data.winner === 'B' ? "bg-brand-teal" : "bg-brand-violet")} />
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-content-tertiary gap-3 border-2 border-dashed border-borderBase rounded-2xl">
                                        <BarChart3 className="w-12 h-12 opacity-10" />
                                        <p className="text-xs font-mono tracking-widest uppercase">Compare variants to see results</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </StaggerContainer>
            </DashboardLayout>
        </PageTransition>
    );
}
