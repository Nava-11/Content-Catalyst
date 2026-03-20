import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Mail, CheckCircle2, Clock, Share2, Globe, Lock } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CollaborationHubProps {
    channelId: string;
}

// Define an interface for the idea structure
interface Idea {
    id: number;
    title: string;
    isPublic: "true" | "false"; // Assuming isPublic comes as a string
    // Add other properties of an idea if known
}

export function CollaborationHub({ channelId }: CollaborationHubProps) {
    const [inviteEmail, setInviteEmail] = useState("");
    const [selectedIdeaId, setSelectedIdeaId] = useState<number | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: savedIdeas } = useQuery<Idea[]>({
        queryKey: ["savedIdeas", channelId],
        queryFn: async () => {
            const res = await fetch(`/api/saved/${channelId}`);
            if (!res.ok) throw new Error("Failed to fetch saved ideas");
            const data = await res.json();
            return data.ideas;
        },
        enabled: !!channelId
    });

    const shareMutation = useMutation({
        mutationFn: async ({ id, isPublic }: { id: number, isPublic: boolean }) => {
            const res = await fetch(`/api/social/share/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPublic })
            });
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Visibility Updated", description: "Your idea visibility has been synchronized." });
            queryClient.invalidateQueries({ queryKey: ["savedIdeas", channelId] });
        }
    });

    const inviteMutation = useMutation({
        mutationFn: async () => {
            if (!selectedIdeaId || !inviteEmail) return;
            const res = await fetch("/api/social/collab/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ideaId: selectedIdeaId, collaboratorEmail: inviteEmail })
            });
            if (!res.ok) throw new Error("User not found");
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Invitation Sent", description: `Invited ${inviteEmail} to collaborate.` });
            setInviteEmail("");
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold text-lg">Collaboration & Public Sharing</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Idea Visibility Management */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/30 text-[10px] uppercase font-bold text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">Strategy Idea</th>
                                    <th className="px-4 py-3 text-center">Visibility</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {savedIdeas && savedIdeas.length > 0 ? savedIdeas.map((idea: any) => (
                                    <tr key={idea.id} className="border-t border-border/50 hover:bg-muted/10 transition-colors">
                                        <td className="px-4 py-4 font-medium">{idea.title}</td>
                                        <td className="px-4 py-4 text-center">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                idea.isPublic === "true" ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                                            )}>
                                                {idea.isPublic === "true" ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                                {idea.isPublic === "true" ? "Public" : "Private"}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => shareMutation.mutate({ id: idea.id, isPublic: idea.isPublic !== "true" })}
                                                    className="p-1.5 rounded-lg hover:bg-muted/80 text-muted-foreground transition-colors"
                                                    title={idea.isPublic === "true" ? "Make Private" : "Make Public"}
                                                >
                                                    <Share2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => setSelectedIdeaId(idea.id)}
                                                    className={cn(
                                                        "p-1.5 rounded-lg hover:bg-primary/10 transition-colors",
                                                        selectedIdeaId === idea.id ? "text-primary bg-primary/10" : "text-muted-foreground"
                                                    )}
                                                    title="Collaborate"
                                                >
                                                    <Users className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground italic">Save some ideas to start collaborating.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Invite Panel */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-6">
                    <div className="space-y-1">
                        <h4 className="font-bold text-sm">Invite Collaborator</h4>
                        <p className="text-xs text-muted-foreground">Add another creator to your thinking session.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input 
                                type="email" 
                                placeholder="creator@email.com" 
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="w-full bg-muted/30 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>

                        <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-2">
                            <p className="text-[10px] font-bold uppercase text-primary">Target Blueprint</p>
                            <p className="text-sm font-semibold truncate">
                                {selectedIdeaId ? savedIdeas?.find((i: any) => i.id === selectedIdeaId)?.title : "Select an idea from the list"}
                            </p>
                        </div>

                        <button 
                            onClick={() => inviteMutation.mutate()}
                            disabled={!selectedIdeaId || !inviteEmail || inviteMutation.isPending}
                            className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                        >
                            {inviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                            Send Invite
                        </button>
                    </div>

                    <div className="pt-4 border-t border-border flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Pending invites (2)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
