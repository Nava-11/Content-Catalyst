import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Terminal, ShieldCheck, ChevronRight, Zap, Target, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIPlayerProps {
    channelId: string;
}

export function AIPlayer({ channelId }: AIPlayerProps) {
    const { data: directives, isLoading: loadingDirectives, refetch: refetchDirectives } = useQuery<any[]>({
        queryKey: ["/api/features/agent", channelId, "directives"],
        enabled: !!channelId,
    });

    const { data: thoughts, isLoading: loadingThoughts } = useQuery<string[]>({
        queryKey: ["/api/features/agent/thoughts"],
        refetchInterval: 5000, // Frequent updates for the thought stream
    });

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-display font-bold text-2xl mb-1 flex items-center gap-3">
                        <Brain className="w-6 h-6 text-brand-violet" />
                        AI Co-Creator
                    </h3>
                    <p className="text-content-secondary text-xs font-mono uppercase tracking-[0.2em]">Autonomous Strategy Agent</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-brand-violet/10 rounded-full border border-brand-violet/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-violet animate-pulse" />
                    <span className="text-[10px] font-bold text-brand-violet uppercase">Reasoning Core Online</span>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Thought Stream (Terminal Style) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] uppercase font-bold text-content-tertiary flex items-center gap-2">
                            <Terminal className="w-3 h-3" /> Agent Thought Stream
                        </span>
                    </div>
                    <div className="bg-space-950 border border-borderBase rounded-2xl p-6 h-80 font-mono text-xs overflow-y-auto custom-scrollbar relative">
                        <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-space-950 to-transparent pointer-events-none z-10" />
                        <div className="space-y-3 relative z-0">
                            <AnimatePresence mode="popLayout">
                                {thoughts?.map((thought, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={cn(
                                            "flex gap-3",
                                            i === 0 ? "text-brand-teal" : "text-content-tertiary"
                                        )}
                                    >
                                        <span className="opacity-50">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                                        <span>{thought}</span>
                                    </motion.div>
                                ))}
                                {loadingThoughts && (
                                    <div className="flex items-center gap-2 text-content-tertiary animate-pulse">
                                        <span className="w-1 h-1 bg-content-tertiary rounded-full" />
                                        <span>Initializing stream...</span>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Directives */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] uppercase font-bold text-content-tertiary flex items-center gap-2">
                            <Target className="w-3 h-3" /> Autonomous Directives
                        </span>
                        <button 
                            onClick={() => refetchDirectives()}
                            className="p-1 hover:bg-space-800 rounded transition-colors"
                        >
                            <RefreshCw className="w-3 h-3 text-content-tertiary" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {loadingDirectives ? (
                            <div className="h-40 glass-card animate-pulse rounded-2xl" />
                        ) : directives?.map((dir) => (
                            <motion.div 
                                key={dir.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card p-6 rounded-2xl border-l-4 border-l-brand-violet hover:bg-space-900/50 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-violet/20 text-brand-violet uppercase">
                                                {dir.type}
                                            </span>
                                            <span className="text-[10px] font-mono text-content-tertiary">
                                                Confidence: {Math.round(dir.confidence * 100)}%
                                            </span>
                                        </div>
                                        <h4 className="font-display font-bold text-lg text-content-primary">{dir.title}</h4>
                                    </div>
                                    <div className="p-2 bg-space-800 rounded-lg">
                                        <ShieldCheck className="w-5 h-5 text-brand-teal" />
                                    </div>
                                </div>
                                <p className="text-sm text-content-secondary mb-6 leading-relaxed">
                                    {dir.description}
                                </p>
                                
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold text-content-tertiary uppercase tracking-wider">Sub-Reasoning</span>
                                    {dir.reasoning.map((r: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs text-content-primary">
                                            <ChevronRight className="w-3 h-3 text-brand-violet" />
                                            {r}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
