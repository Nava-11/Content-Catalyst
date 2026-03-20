import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { GitBranch, Box, ArrowRight, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NarrativeGraphProps {
    channelId: string;
}

export function NarrativeGraph({ channelId }: NarrativeGraphProps) {
    const { data: graph, isLoading } = useQuery<any>({
        queryKey: ["/api/features/channel", channelId, "narrative-graph"],
        enabled: !!channelId,
    });

    if (isLoading) return <div className="h-64 bg-space-900 animate-pulse rounded-2xl" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-display font-bold text-xl mb-1 flex items-center gap-2">
                        <GitBranch className="w-5 h-5 text-brand-teal rotate-90" />
                        Narrative Topology
                    </h3>
                    <p className="text-content-secondary text-[10px] uppercase font-bold tracking-widest">Story Arcs & Semantic Sequels</p>
                </div>
            </div>

            <div className="glass-card p-8 rounded-2xl border-borderBase relative overflow-hidden min-h-[300px]">
                {/* Visual Graph background (SVG) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                    <defs>
                        <linearGradient id="edgeGrade" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#1DFFD2" />
                            <stop offset="100%" stopColor="#8B5CF6" />
                        </linearGradient>
                    </defs>
                    {graph?.edges.map((edge: any, i: number) => {
                        // Simulated positions for demo
                        const startX = 50 + (i * 20);
                        const startY = 50;
                        const endX = 150 + (i * 20);
                        const endY = 150;
                        return (
                            <motion.path 
                                key={i}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1, delay: i * 0.2 }}
                                d={`M ${startX} ${startY} Q ${startX + 50} ${startY + 50} ${endX} ${endY}`}
                                fill="none"
                                stroke="url(#edgeGrade)"
                                strokeWidth="2"
                                strokeDasharray="4 2"
                            />
                        );
                    })}
                </svg>

                <div className="relative z-10 flex flex-wrap gap-4 items-center justify-center">
                    {graph?.nodes.map((node: any, i: number) => (
                        <motion.div 
                            key={node.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className={cn(
                                "p-4 rounded-xl border flex flex-col gap-2 min-w-[200px] max-w-[250px] transition-all group cursor-pointer",
                                node.type === 'Origin' ? "bg-brand-teal/10 border-brand-teal/30" : 
                                node.type === 'Sequel' ? "bg-brand-violet/10 border-brand-violet/30" : "bg-space-900 border-borderBase"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <span className={cn(
                                    "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                                    node.type === 'Origin' ? "bg-brand-teal text-space-950" : 
                                    node.type === 'Sequel' ? "bg-brand-violet text-white" : "bg-space-800 text-content-tertiary"
                                )}>
                                    {node.type}
                                </span>
                                <Box className="w-3 h-3 text-content-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <h4 className="text-xs font-bold text-content-primary line-clamp-2 leading-snug">{node.title}</h4>
                        </motion.div>
                    ))}
                </div>

                {!graph?.nodes.length && (
                    <div className="h-40 flex flex-col items-center justify-center text-content-tertiary border-2 border-dashed border-borderBase rounded-2xl">
                        <Info className="w-10 h-10 opacity-20 mb-2" />
                        <p className="text-xs">No significant arcs detected in recent history.</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-brand-teal/20 bg-brand-teal/5 flex items-start gap-3">
                    <div className="p-2 rounded bg-brand-teal/10"><GitBranch className="w-4 h-4 text-brand-teal" /></div>
                    <div>
                        <div className="text-xs font-bold text-content-primary mb-1">Origin Node Detected</div>
                        <p className="text-[10px] text-content-secondary leading-relaxed">System identified `{graph?.nodes[0]?.title}` as a high-authority narrative seed.</p>
                    </div>
                </div>
                <div className="p-4 rounded-xl border border-brand-violet/20 bg-brand-violet/5 flex items-start gap-3">
                    <div className="p-2 rounded bg-brand-violet/10"><ArrowRight className="w-4 h-4 text-brand-violet" /></div>
                    <div>
                        <div className="text-xs font-bold text-content-primary mb-1">Expansion Potential</div>
                        <p className="text-[10px] text-content-secondary leading-relaxed">{graph?.edges.length} callbacks detected. Audience expects a thematic Part 4.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
