
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, MessageSquare, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface ThinkingCompanionProps {
    channelId: string;
}

export function ThinkingCompanion({ channelId }: ThinkingCompanionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Want to explore your channel or rethink these ideas together?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setIsLoading(true);

        try {
            // Build previous messages for context (excluding the very first simplified prompt if needed, or sending all)
            // Sending strictly role/content
            const apiMessages = messages.map(m => ({ role: m.role, content: m.content }));

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    channelId,
                    message: userMsg,
                    previousMessages: apiMessages
                })
            });

            if (!res.ok) throw new Error("Failed to get response");
            const data = await res.json();

            setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. Let's try again in a moment." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn(
            "fixed bottom-0 right-0 md:right-8 z-50 transition-all duration-300 ease-in-out w-full md:w-[400px]",
            isOpen ? "h-[500px]" : "h-14"
        )}>
            <div className="flex flex-col h-full bg-card border border-border shadow-2xl rounded-t-xl overflow-hidden">
                {/* Header - Always visible */}
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-between px-4 h-14 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors"
                >
                    <div className="flex items-center gap-2 font-display font-semibold text-primary">
                        <Sparkles className="w-5 h-5" />
                        <span>Thinking Companion</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </Button>
                </div>

                {/* Chat Area */}
                {isOpen && (
                    <>
                        <ScrollArea className="flex-1 p-4 bg-background/50">
                            <div className="space-y-4">
                                {messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex w-full",
                                            msg.role === "user" ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "max-w-[85%] px-3 py-2 rounded-lg text-sm",
                                                msg.role === "user"
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-foreground"
                                            )}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-muted px-3 py-2 rounded-lg">
                                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                        </div>
                                    </div>
                                )}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>

                        {/* Input Area */}
                        <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-background">
                            <div className="flex gap-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about your metrics or new ideas..."
                                    className="flex-1"
                                />
                                <Button type="submit" size="icon" disabled={isLoading}>
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
