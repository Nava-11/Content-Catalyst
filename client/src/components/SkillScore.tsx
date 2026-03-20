import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Award, Zap, BookOpen, Repeat, TrendingUp, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkillScoreProps {
    channelId: string;
}

export function SkillScore({ channelId }: SkillScoreProps) {
    const { data: score, isLoading } = useQuery<any>({
        queryKey: ["/api/features/channel", channelId, "skill-score"],
        enabled: !!channelId,
    });

    if (isLoading) return <div className="h-48 bg-space-900 animate-pulse rounded-2xl" />;

    const skills = [
        { label: "Technical Depth", value: score?.technical || 0, icon: BookOpen, color: "brand-teal" },
        { label: "Creative Novelty", value: score?.creative || 0, icon: Sparkles, color: "brand-violet" },
        { label: "Channel Consistency", value: score?.consistency || 0, icon: Repeat, color: "brand-amber" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-display font-bold text-xl mb-1 flex items-center gap-2">
                        <Award className="w-5 h-5 text-brand-amber" />
                        Creator Skill Score
                    </h3>
                    <p className="text-content-secondary text-[10px] uppercase font-bold tracking-widest">Autonomous Talent Evolution</p>
                </div>
                <div className="text-right">
                    <span className="text-3xl font-mono font-bold text-content-primary">{score?.overall}%</span>
                    <span className="text-[10px] text-brand-teal font-bold block">Overall Mastery</span>
                </div>
            </div>

            <div className="space-y-6">
                {skills.map((skill, i) => (
                    <div key={skill.label} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <skill.icon className={cn("w-3.5 h-3.5", `text-${skill.color}`)} />
                                <span className="text-[10px] uppercase font-bold text-content-secondary tracking-widest">{skill.label}</span>
                            </div>
                            <span className="text-xs font-mono font-bold text-content-primary">{skill.value}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-space-800 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${skill.value}%` }}
                                transition={{ duration: 1, delay: i * 0.1 }}
                                className={cn("h-full", `bg-${skill.color}`, i === 0 ? "glow-teal" : i === 1 ? "glow-violet" : "glow-amber")}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 rounded-xl bg-space-900 border border-borderBase flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-brand-teal/10">
                        <TrendingUp className="w-4 h-4 text-brand-teal" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-content-primary leading-tight">Growth Trajectory</div>
                        <div className="text-[10px] text-content-secondary mt-0.5">Projected to hit Level 4 (Strategist) in 2 weeks.</div>
                    </div>
                </div>
                <Zap className="w-4 h-4 text-brand-amber animate-pulse" />
            </div>
        </div>
    );
}
