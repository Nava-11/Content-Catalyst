import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Zap, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveChannelPulseProps {
    channelId: string;
}

export function LiveChannelPulse({ channelId }: LiveChannelPulseProps) {
    const { data: pulse, isLoading, refetch } = useQuery<any>({
        queryKey: ["/api/features/channel", channelId, "pulse"],
        enabled: !!channelId,
        refetchInterval: 30000, // Poll every 30s for the UI demo
    });

    if (isLoading) {
        return <div className="h-40 bg-space-800 animate-pulse rounded-xl" />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-display font-bold text-xl mb-1 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-brand-amber animate-pulse" />
                        Live Channel Pulse
                    </h3>
                    <p className="text-content-secondary text-xs font-mono uppercase tracking-wider">Real-time Performance Velocity</p>
                </div>
                <button 
                    onClick={() => refetch()} 
                    className="p-2 hover:bg-space-800 rounded-lg transition-colors border border-borderBase"
                >
                    <RefreshCw className="w-4 h-4 text-content-tertiary" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Views Per Hour */}
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Zap className="w-16 h-16 text-brand-amber" />
                    </div>
                    
                    <div className="relative z-10">
                        <span className="text-[10px] uppercase font-bold text-content-tertiary block mb-2 tracking-widest">Views / Hour</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-mono font-bold text-content-primary tracking-tighter">
                                {pulse?.viewsPerHour?.toLocaleString() || '0'}
                            </span>
                            <span className="text-xs text-brand-teal font-bold flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {pulse?.engagementVelocity}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Status / Breakout */}
                <div className={cn(
                    "glass-card p-6 rounded-2xl border-2 transition-all duration-500",
                    pulse?.breakoutDetected ? "border-brand-amber/50 bg-brand-amber/5" : "border-borderBase"
                )}>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] uppercase font-bold text-content-tertiary tracking-widest">System Status</span>
                        {pulse?.breakoutDetected && (
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex items-center gap-2 px-2 py-1 bg-brand-amber/20 rounded border border-brand-amber/30"
                            >
                                <Zap className="w-3 h-3 text-brand-amber fill-brand-amber" />
                                <span className="text-[10px] font-bold text-brand-amber uppercase">Breakout Detect</span>
                            </motion.div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-3 rounded-xl",
                            pulse?.breakoutDetected ? "bg-brand-amber/10" : "bg-brand-teal/10"
                        )}>
                            {pulse?.breakoutDetected ? (
                                <AlertTriangle className="w-6 h-6 text-brand-amber" />
                            ) : (
                                <Activity className="w-6 h-6 text-brand-teal" />
                            )}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-content-primary">
                                {pulse?.breakoutDetected ? "Abnormal Velocity" : "Healthy Pulse"}
                            </div>
                            <div className="text-[10px] text-content-secondary mt-1">
                                {pulse?.breakoutDetected 
                                    ? "Engagement spike detected in recent uploads" 
                                    : "Channel performing within baseline range"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Velocity Visualizer (Simplified bar chart) */}
            <div className="glass-card p-4 rounded-xl border border-borderBase">
                <div className="flex items-end gap-1 h-12">
                    {[40, 65, 45, 90, 55, 30, 75, 50, 85, 40, 60, 95].map((h, i) => (
                        <motion.div 
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                                "flex-1 rounded-t-sm transition-colors",
                                i === 11 ? "bg-brand-amber glow-amber" : "bg-space-700 hover:bg-brand-teal/50"
                            )}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
