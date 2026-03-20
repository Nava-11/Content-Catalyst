import React from "react";
import { Zap, Heart, MessageCircle, BarChart3, Activity } from "lucide-react";

interface StyleProfileWidgetProps {
    profile: {
        technicalDepth: string;
        storytelling: string;
        humorLevel: string;
        instructionClarity: string;
        emotionTone: string;
    };
    health: {
        overallScore: number;
        burnoutRisk: string;
    };
}

export function StyleProfileWidget({ profile, health }: StyleProfileWidgetProps) {
    const getScoreColor = (score: number) => {
        if (score >= 8) return "text-emerald-500";
        if (score >= 6) return "text-blue-500";
        return "text-orange-500";
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Style Profile */}
            <div className="bg-card border border-border/50 rounded-xl p-6 shadow-lg shadow-black/20">
                <h3 className="font-display font-bold text-lg mb-6 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" /> Creator Style Profile
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-border/30">
                        <span className="text-sm text-muted-foreground">Technical Depth</span>
                        <span className="text-sm font-bold text-primary">{profile.technicalDepth}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-border/30">
                        <span className="text-sm text-muted-foreground">Storytelling</span>
                        <span className="text-sm font-bold text-primary">{profile.storytelling}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-border/30">
                        <span className="text-sm text-muted-foreground">Humor Level</span>
                        <span className="text-sm font-bold text-primary">{profile.humorLevel}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-border/30">
                        <span className="text-sm text-muted-foreground">Instruction Clarity</span>
                        <span className="text-sm font-bold text-primary">{profile.instructionClarity}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Emotion Tone</span>
                        <span className="text-sm font-bold text-primary">{profile.emotionTone}</span>
                    </div>
                </div>
            </div>

            {/* Ecosystem Health */}
            <div className="bg-card border border-border/50 rounded-xl p-6 shadow-lg shadow-black/20">
                <h3 className="font-display font-bold text-lg mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" /> Ecosystem Health
                </h3>
                <div className="flex flex-col items-center justify-center h-[160px]">
                    <div className={`text-6xl font-display font-black ${getScoreColor(health.overallScore)}`}>
                        {health.overallScore}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">Overall Health Score</div>
                    <div className={`mt-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${health.burnoutRisk === "Stable" ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"
                        }`}>
                        Burnout Risk: {health.burnoutRisk}
                    </div>
                </div>
            </div>
        </div>
    );
}
