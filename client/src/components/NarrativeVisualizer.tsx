import React from "react";
import { PlayCircle, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface NarrativeVisualizerProps {
    analysis: {
        hook: string;
        problemDefinition: string;
        solutionDepth: string;
        retentionRisk: string;
        structure: { stage: string; content: string }[];
    };
}

export function NarrativeVisualizer({ analysis }: NarrativeVisualizerProps) {
    return (
        <div className="bg-card border border-border/50 rounded-xl p-6 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-lg">Video Narrative Analysis</h3>
                <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    analysis.retentionRisk === "Low" ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"
                )}>
                    Retention Risk: {analysis.retentionRisk}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground mb-1">
                        <PlayCircle className="w-3 h-3 text-primary" /> Hook
                    </div>
                    <div className="text-sm font-medium">{analysis.hook}</div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground mb-1">
                        <AlertCircle className="w-3 h-3 text-orange-500" /> Problem
                    </div>
                    <div className="text-sm font-medium">{analysis.problemDefinition}</div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground mb-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" /> Solution
                    </div>
                    <div className="text-sm font-medium">{analysis.solutionDepth}</div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-2">Structure Breakdown</div>
                <div className="relative pl-4 border-l-2 border-primary/30 space-y-6">
                    {analysis.structure.map((s, i) => (
                        <div key={i} className="relative">
                            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                            <div className="font-bold text-xs text-primary uppercase mb-1">{s.stage}</div>
                            <p className="text-xs text-muted-foreground line-clamp-2 italic">"{s.content}"</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
