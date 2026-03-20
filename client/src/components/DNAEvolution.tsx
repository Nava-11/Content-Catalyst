import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { GitBranch, Fingerprint, Activity, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DNAEvolutionProps {
    channelId: string;
}

export function DNAEvolution({ channelId }: DNAEvolutionProps) {
    const { data: evolution, isLoading } = useQuery<any[]>({
        queryKey: ["/api/features/dna/evolution", channelId],
        enabled: !!channelId
    });

    const { data: coherence } = useQuery<any>({
        queryKey: ["/api/features/dna/coherence", channelId],
        enabled: !!channelId
    });

    if (isLoading) {
        return <div className="animate-pulse space-y-4">
            <div className="h-8 bg-space-800 rounded w-1/3" />
            <div className="h-40 bg-space-800 rounded" />
        </div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-display font-bold text-xl mb-1 flex items-center gap-2">
                        <Fingerprint className="w-5 h-5 text-brand-teal" />
                        Creative DNA Evolution
                    </h3>
                    <p className="text-content-secondary text-xs font-mono lowercase tracking-wider">Identity Drift & Breakthrough Timeline</p>
                </div>
                {coherence && (
                    <div className="text-right">
                        <div className="text-2xl font-mono text-brand-teal">{coherence.score}%</div>
                        <div className="text-[10px] uppercase font-bold text-content-tertiary">Coherence Score</div>
                    </div>
                )}
            </div>

            {/* Timeline */}
            <div className="relative pl-8 space-y-12 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-brand-teal before:via-brand-violet before:to-brand-amber before:opacity-30">
                {(evolution || []).map((era, i) => (
                    <motion.div 
                        key={era.period}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative"
                    >
                        {/* Dot */}
                        <div className={cn(
                            "absolute -left-[27px] top-1.5 w-4 h-4 rounded-full border-2 border-space-900 z-10",
                            i === (evolution?.length || 0) - 1 ? "bg-brand-teal glow-teal" : "bg-content-tertiary"
                        )} />

                        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-12">
                            <div className="w-32 shrink-0">
                                <span className="text-[10px] uppercase font-bold text-content-tertiary block mb-1">{era.period}</span>
                                <h4 className="font-display font-bold text-content-primary">{era.topTopic}</h4>
                                <div className="mt-2 text-[10px] font-mono text-brand-violet px-2 py-0.5 rounded-full border border-brand-violet/30 inline-block">
                                    {era.toneShift.replace('_', ' ')}
                                </div>
                            </div>

                            <div className="flex-1 glass-card p-4 rounded-xl border border-borderBase hover:border-brand-teal/30 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded bg-space-800 border border-borderBase">
                                            <Activity className="w-3 h-3 text-brand-teal" />
                                        </div>
                                        <span className="text-xs text-content-secondary uppercase font-bold tracking-widest">{era.dominantFormat} Era</span>
                                    </div>
                                    <div className="text-[10px] font-mono text-content-tertiary">
                                        Drift: <span className={cn(era.driftScore > 0.5 ? "text-brand-amber" : "text-brand-teal")}>{(era.driftScore * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                                
                                <div className="w-full h-1 bg-space-800 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(1 - era.driftScore) * 100}%` }}
                                        className="h-full bg-brand-teal rounded-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {coherence && (
                <div className="p-4 rounded-xl bg-brand-teal/5 border border-brand-teal/20 text-xs text-brand-teal/80 italic">
                    💡 Intelligence Insight: {coherence.message}
                </div>
            )}
        </div>
    );
}
