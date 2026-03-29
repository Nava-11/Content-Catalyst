import { DashboardLayout } from "@/components/DashboardLayout";
import { PageTransition, FadeInUp } from "@/components/PageTransition";
import { useDashboardData } from "@/hooks/useDashboardData";
import { MessageSquare, Send, Sparkles, Brain, Code, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Message {
    role: string;
    content: string;
    citations?: string[];
    type?: "text" | "thought";
}

export default function RagChat() {
    const channelId = new URLSearchParams(window.location.search).get("channelId");
    const { analytics: analyticsRaw, recommendations, isLoading: statsLoading, isError } = useDashboardData(channelId);

    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial Welcome Message
    useEffect(() => {
        if (analyticsRaw && recommendations && messages.length === 0) {
            const vCount = analyticsRaw.analytics?.totalVideos || 0;
            const cCount = recommendations.topicClusters?.length || 0;
            setMessages([
                {
                    role: "assistant",
                    content: `I've ingested your latest World Model state for Channel ID ${channelId?.slice(0, 6)}... You have ${vCount} videos indexed across ${cCount} major clusters. What are we figuring out today?`,
                    type: "text"
                }
            ]);
        }
    }, [analyticsRaw, recommendations, messages.length, channelId]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    if (statsLoading) {
        return (
            <DashboardLayout title="Creator Intelligence (RAG)">
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
                </div>
            </DashboardLayout>
        );
    }

    if (!channelId || isError || !analyticsRaw) {
        return (
            <DashboardLayout title="Creator Intelligence (RAG)">
                <div className="flex flex-col h-[60vh] items-center justify-center text-center gap-4">
                    <div className="p-4 rounded-xl bg-brand-coral/10 border border-brand-coral/30 text-brand-coral">
                        No channel context found. Run an analysis from the homepage.
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const input = query.trim();
        if (!input || isLoading) return;

        // 1. Update UI with User Message
        const newMsgs: Message[] = [...messages, { role: "user", content: input, type: "text" }];
        setMessages(newMsgs);
        setQuery("");
        setIsLoading(true);

        try {
            // 2. Pure Conversational RAG Flow (Chat GPT style)
            const apiMessages = messages.map(m => ({ role: m.role, content: m.content }));
            const res = await fetch("/api/chat/message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    channelId,
                    message: input,
                    previousMessages: apiMessages
                })
            });

            if (!res.ok) throw new Error("Chat failed");
            const data = await res.json();

            // Handle potential structured response from backend
            setMessages(prev => [...prev, { 
                role: "assistant", 
                content: data.message, 
                type: "text" 
            }]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble processing that right now. Let's try another approach.", type: "text" }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageTransition>
            <DashboardLayout title="Creator Intelligence (RAG)">

                <div className="grid lg:grid-cols-4 gap-8 h-[calc(100vh-140px)]">

                    {/* Main Chat Area */}
                    <div className="lg:col-span-3 flex flex-col bg-space-800/20 rounded-2xl border border-borderBase overflow-hidden glass-card">

                        <div className="flex-1 p-6 overflow-y-auto space-y-8 flex flex-col custom-scrollbar">
                            {messages.map((m, i) => (
                                <FadeInUp key={i} className={cn("flex gap-4 max-w-[85%]", m.role === 'user' ? 'ml-auto flex-row-reverse' : '')}>

                                    <div className={cn(
                                        "w-8 h-8 rounded shrink-0 flex items-center justify-center mt-1",
                                        m.role === 'assistant' ? 'bg-brand-teal/20 text-brand-teal' : 'bg-brand-violet/20 text-brand-violet'
                                    )}>
                                        {m.role === 'assistant' ? <Brain className="w-4 h-4" /> : <span className="text-xs font-bold font-display">U</span>}
                                    </div>

                                    <div className={cn("flex flex-col gap-2", m.role === 'user' ? 'items-end' : 'items-start')}>
                                        <div className={cn(
                                            "p-4 rounded-xl text-sm leading-relaxed",
                                            m.role === 'user' ? 'bg-space-800 text-content-primary border border-white/5' : 'bg-transparent text-content-primary'
                                        )}>
                                            {m.content}
                                        </div>

                                        {m.citations && m.citations.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-1 pl-4">
                                                {m.citations.map(cite => (
                                                    <div key={cite} className="flex items-center gap-1.5 px-2 py-1 rounded bg-space-900 border border-borderBase text-[10px] text-content-secondary uppercase font-bold tracking-widest cursor-pointer hover:border-brand-teal/50 transition-colors">
                                                        <Code className="w-3 h-3 text-brand-teal" /> {cite}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </FadeInUp>
                            ))}
                            {isLoading && (
                                <FadeInUp className="flex gap-4 max-w-[85%]">
                                    <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-brand-teal/20 text-brand-teal">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    </div>
                                    <div className="p-4 rounded-xl text-sm italic text-content-tertiary animate-pulse">
                                        Synthesizing context...
                                    </div>
                                </FadeInUp>
                            )}
                            <div ref={scrollRef} />
                        </div>

                        <div className="p-4 bg-space-900 border-t border-borderBase">
                            <form onSubmit={handleSend} className="relative flex items-center">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Ask your World Model a question..."
                                    className="w-full bg-space-800 border border-content-tertiary/20 rounded-xl h-14 pl-6 pr-16 text-content-primary focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/50 transition-all font-body placeholder:text-content-tertiary/50"
                                />
                                <button
                                    type="submit"
                                    disabled={!query.trim() || isLoading}
                                    className="absolute right-2 w-10 h-10 rounded-lg bg-brand-teal text-space-900 flex items-center justify-center hover:bg-brand-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </form>
                            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-content-tertiary">
                                <span 
                                    onClick={() => setQuery("Analyze my recent drop in retention")}
                                    className="flex items-center gap-1 hover:text-content-secondary cursor-pointer transition-colors"
                                >
                                    <Sparkles className="w-3 h-3 text-brand-amber" /> Analyze my recent drop in retention
                                </span>
                                <span 
                                    onClick={() => setQuery("What cluster is most saturated right now?")}
                                    className="flex items-center gap-1 hover:text-content-secondary cursor-pointer transition-colors"
                                >
                                    <Sparkles className="w-3 h-3 text-brand-amber" /> What cluster is most saturated?
                                </span>
                            </div>
                        </div>

                    </div>

                    {/* Right Context Panel */}
                    <div className="hidden lg:flex flex-col gap-6">
                        <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
                            <h3 className="font-display font-bold text-sm text-content-primary uppercase tracking-widest flex items-center gap-2">
                                <Brain className="w-4 h-4 text-brand-teal" /> Conversational AI
                            </h3>

                            <div className="space-y-3">
                                <div className="flex flex-col gap-1 p-3 rounded bg-space-800/50 border border-borderBase text-xs">
                                    <span className="text-content-tertiary">Mode</span>
                                    <span className="text-content-primary font-bold italic">Deep World Model Search</span>
                                </div>

                                <div className="flex flex-col gap-1 p-3 rounded bg-space-800/50 border border-borderBase text-xs">
                                    <span className="text-content-tertiary">Context Depth</span>
                                    <span className="text-content-primary font-bold">Entire Channel Analytics</span>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded bg-brand-teal/5 border border-brand-teal/20 text-xs text-brand-teal mt-4">
                                    <span>RAG Pipeline</span>
                                    <span className="flex items-center gap-1">
                                        <span className={cn("w-1.5 h-1.5 rounded-full", isLoading ? "bg-brand-amber animate-pulse" : "bg-brand-teal")} />
                                        {isLoading ? "Summarizing..." : "Active"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </DashboardLayout>
        </PageTransition>
    );
}
