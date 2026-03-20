import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, AlertCircle, TrendingUp, Heart, Check, X, Zap, Loader2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface NudgeCenterProps {
    channelId: string;
}

export function NudgeCenter({ channelId }: NudgeCenterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: nudges } = useQuery<any[]>({
        queryKey: [`/api/features/channel/${channelId}/nudges`],
        enabled: !!channelId
    });

    const unreadCount = nudges?.filter((n: any) => n.isRead === "false").length || 0;

    const markReadMutation = useMutation({
        mutationFn: async (id: number) => {
            await fetch(`/api/features/notifications/${id}/read`, { method: "POST" });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/features/channel/${channelId}/nudges`] });
        }
    });

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full bg-card hover:bg-muted/50 transition-colors relative"
            >
                <Bell className={cn("w-5 h-5", unreadCount > 0 ? "text-primary animate-pulse" : "text-muted-foreground")} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-[350px] bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                                <h3 className="font-display font-bold text-sm">System Nudges</h3>
                                <button className="text-[10px] font-bold text-primary uppercase hover:underline">Mark all as read</button>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
                                {nudges && nudges.length > 0 ? nudges.map((nudge: any, i: number) => (
                                    <div 
                                        key={i} 
                                        className={cn(
                                            "p-4 border-b border-border/50 hover:bg-muted/30 transition-colors group relative",
                                            nudge.isRead === "false" && "bg-primary/[0.02]"
                                        )}
                                    >
                                        <div className="flex gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                                nudge.type === 'burnout' ? "bg-orange-500/10 text-orange-500" :
                                                nudge.type === 'curiosity' ? "bg-blue-500/10 text-blue-500" :
                                                "bg-green-500/10 text-green-500"
                                            )}>
                                                {nudge.type === 'burnout' && <AlertCircle className="w-4 h-4" />}
                                                {nudge.type === 'curiosity' && <TrendingUp className="w-4 h-4" />}
                                                {nudge.type === 'performance' && <Zap className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{nudge.title}</p>
                                                    {nudge.isRead === "false" && (
                                                        <button 
                                                            onClick={() => markReadMutation.mutate(nudge.id)}
                                                            className="text-[10px] text-primary hover:underline"
                                                        >
                                                            Mark as Read
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium leading-tight mt-1">{nudge.message}</p>
                                                <p className="text-[10px] text-muted-foreground mt-2">{new Date(nudge.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-12 text-center">
                                        <Heart className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                                        <p className="text-sm text-muted-foreground font-medium">All clear! No current nudges.</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-3 bg-muted/10 text-center border-t border-border">
                                <p className="text-[10px] text-muted-foreground italic">Proactive intelligence refreshes weekly</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
