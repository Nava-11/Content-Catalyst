import { useQuery } from "@tanstack/react-query";
import { Users, TrendingUp, Layers, ChevronRight, Activity, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface IntelligenceSuiteProps {
    channelId: string;
}

export function IntelligenceSuite({ channelId }: IntelligenceSuiteProps) {
    const { data: twin } = useQuery<any>({
        queryKey: [`/api/intelligence/twin/${channelId}`],
        enabled: !!channelId
    });

    const { data: arcs } = useQuery<any[]>({
        queryKey: [`/api/intelligence/arcs/${channelId}`],
        enabled: !!channelId
    });

    const { data: trends } = useQuery<any[]>({
        queryKey: [`/api/intelligence/trends/${channelId}`],
        enabled: !!channelId
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Creative Twin Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border/50 rounded-2xl p-6 shadow-xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        <h3 className="font-display font-bold text-lg">Creative Twin Trajectory</h3>
                    </div>
                    {twin && (
                        <div className="text-[10px] px-2 py-1 rounded bg-blue-500/10 text-blue-500 font-bold uppercase tracking-wider">
                            {Math.round((twin as any).similarity * 100)}% Match
                        </div>
                    )}
                </div>

                {twin ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {(twin as any).label.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-bold">{(twin as any).label}</p>
                                <p className="text-xs text-muted-foreground">Benchmark Trajectory (Year 1)</p>
                            </div>
                        </div>

                        <div className="h-[150px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={(twin as any).trajectory}>
                                    <XAxis dataKey="month" hide />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="views" 
                                        stroke="hsl(var(--primary))" 
                                        strokeWidth={3} 
                                        dot={{ fill: 'hsl(var(--primary))' }} 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                            {(twin as any).topTopics.map((t: string, i: number) => (
                                <span key={i} className="text-[10px] px-2 py-1 bg-secondary rounded-md">{t}</span>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm italic">
                        No twin found yet. Analyze more videos...
                    </div>
                )}
            </motion.div>

            {/* Series Arcs & Trends */}
            <div className="space-y-6">
                {/* Series Arcs */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border border-border/50 rounded-2xl p-6 shadow-xl"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Layers className="w-5 h-5 text-emerald-500" />
                        <h3 className="font-display font-bold text-lg">Active Series Arcs</h3>
                    </div>

                    <div className="space-y-3">
                        {arcs && (arcs as any[]).length > 0 ? (arcs as any[]).map((arc: any, i: number) => (
                            <div key={i} className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 group hover:border-emerald-500/30 transition-all cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold">{arc.seriesTitle}</p>
                                    <p className="text-[10px] font-bold text-emerald-500">{(arc.similarityScore * 100).toFixed(0)}% Continuity</p>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="text-[11px] text-muted-foreground italic line-clamp-1">Next: {arc.recommendedPart}</div>
                                    <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        )) : (
                            <div className="text-xs text-muted-foreground italic">No semantic series detected in recent uploads.</div>
                        )}
                    </div>
                </motion.div>

                {/* Niche Trends */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card border border-border/50 rounded-2xl p-6 shadow-xl"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-orange-500" />
                        <h3 className="font-display font-bold text-lg">Rising Niche Trends</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {trends && (trends as any[]).slice(0, 4).map((trend: any, i: number) => (
                            <div key={i} className="p-2 rounded-lg bg-orange-500/5 border border-orange-500/10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-1 opacity-20">
                                    <Activity className="w-8 h-8 -rotate-12" />
                                </div>
                                <p className="text-[11px] font-bold line-clamp-1 mb-1">{trend.topic}</p>
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
                                        trend.sentiment === 'Rising' ? "bg-orange-500/20 text-orange-600" : "bg-blue-500/20 text-blue-600"
                                    )}>
                                        {trend.sentiment}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground">Peak: {trend.predictedPeak}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
