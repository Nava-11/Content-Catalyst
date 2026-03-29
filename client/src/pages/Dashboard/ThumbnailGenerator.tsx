import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageTransition, StaggerContainer, FadeInUp } from "@/components/PageTransition";
import { 
    Send, 
    Image as ImageIcon, 
    RefreshCw, 
    Edit3, 
    Download, 
    Zap, 
    Palette, 
    BookOpen, 
    Moon, 
    Loader2,
    Sparkles,
    Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Message = {
    role: 'user' | 'assistant';
    content: string;
    image?: string;
    style?: string;
    concept?: any;
};

type ThumbnailStyle = 'Clickbait' | 'Minimal' | 'Educational' | 'Dark';

export default function ThumbnailGenerator() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Welcome to the Visual Intelligence Engine. Describe your video concept, and I'll architect a high-fidelity thumbnail for you."
        }
    ]);
    const [input, setInput] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState<ThumbnailStyle>('Clickbait');
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [interpretedIdea, setInterpretedIdea] = useState<string | null>(null);
    
    const { toast } = useToast();
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (overridePrompt?: string) => {
        const text = overridePrompt || input;
        if (!text.trim() || isGenerating) return;

        const isEditing = !!currentImage && !overridePrompt;

        if (!overridePrompt) {
            setMessages(prev => [...prev, { role: 'user', content: text }]);
            setInput("");
        }
        
        setIsGenerating(true);

        try {
            const endpoint = isEditing ? "/api/features/thumbnail/edit" : "/api/features/thumbnail/generate";
            const body = isEditing 
                ? { 
                    image: currentImage, 
                    instruction: text, 
                    history: history
                  } 
                : { 
                    idea: text, 
                    style: selectedStyle
                  };

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (!response.ok) throw new Error(isEditing ? "Editing failed" : "Generation failed");

            const data = await response.json();
            
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: data.suggestionText || (isEditing ? "Refined the visual based on your instruction." : "Generated your thumbnail concept."),
                image: data.image,
                style: selectedStyle,
                concept: data.concept
            }]);
            
            setCurrentImage(data.image);
            if (data.interpretedIdea) setInterpretedIdea(data.interpretedIdea);

            if (!isEditing) {
                setCurrentPrompt(data.prompt);
                setHistory([data.interpretedIdea || text]);
            } else {
                setHistory(prev => [...prev, text]);
            }
            
            toast({
                title: isEditing ? "Visual Refined" : "Concept Generated",
                description: isEditing ? "Applied iterative modification." : "Architected high-fidelity thumbnail.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Pipeline error. Check your API configuration.",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUndo = () => {
        if (messages.length <= 2) return;
        const newMessages = [...messages];
        let foundImage = null;
        newMessages.pop(); // Assistant response
        newMessages.pop(); // User message
        for (let i = newMessages.length - 1; i >= 0; i--) {
            if (newMessages[i].image) {
                foundImage = newMessages[i].image;
                break;
            }
        }
        setMessages(newMessages);
        setCurrentImage(foundImage);
        setHistory(prev => prev.slice(0, -1));
        toast({ title: "Iteration Reverted", description: "Returning to previous visual state." });
    };

    const handleDownload = () => {
        if (!currentImage) return;
        const link = document.createElement("a");
        link.href = currentImage;
        link.download = `catalyst-thumb-${Date.now()}.png`;
        link.click();
    };

    const styles: { id: ThumbnailStyle, label: string, icon: any, color: string }[] = [
        { id: 'Clickbait', label: 'Clickbait', icon: Zap, color: 'text-brand-amber' },
        { id: 'Minimal', label: 'Minimal', icon: Palette, color: 'text-brand-teal' },
        { id: 'Educational', label: 'Educational', icon: BookOpen, color: 'text-blue-400' },
        { id: 'Dark', label: 'Dark', icon: Moon, color: 'text-brand-violet' },
    ];

    return (
        <PageTransition>
            <DashboardLayout title="Intelligent Visual Pipeline">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
                    
                    {/* Left Panel: Chat Refinement */}
                    <div className="flex flex-col bg-space-800/30 rounded-2xl border border-borderBase overflow-hidden glass-card">
                        <div className="p-4 border-b border-borderBase bg-space-900/50 flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-content-tertiary flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-brand-teal" /> Visual Architect
                            </h3>
                            <div className="flex gap-1 items-center">
                                {history.length > 1 && (
                                    <button onClick={handleUndo} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-space-700 transition-all text-content-tertiary hover:text-brand-teal mr-2 border border-borderBase/50">
                                        <RefreshCw className="w-4 h-4 rotate-180" />
                                    </button>
                                )}
                                {styles.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSelectedStyle(s.id)}
                                        className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                            selectedStyle === s.id ? "bg-space-700 ring-1 ring-brand-teal/50 shadow-glow-teal" : "hover:bg-space-700/50"
                                        )}
                                        title={s.label}
                                    >
                                        <s.icon className={cn("w-4 h-4", selectedStyle === s.id ? s.color : "text-content-tertiary")} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            <AnimatePresence initial={false}>
                                {messages.map((m, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn("flex flex-col max-w-[85%]", m.role === 'user' ? "ml-auto items-end" : "items-start")}
                                    >
                                        <div className={cn(
                                            "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                                            m.role === 'user' ? "bg-brand-teal text-space-900 font-medium" : "bg-space-700 border border-borderBase text-content-primary"
                                        )}>
                                            {m.content}
                                        </div>
                                        {m.image && (
                                            <div className="mt-2 text-[10px] font-bold uppercase text-brand-teal flex items-center gap-1">
                                                <Zap className="w-3 h-3" /> Intelligent Visualization Ready
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {isGenerating && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-brand-teal">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-xs font-medium animate-pulse italic">Architecting visual concept...</span>
                                </motion.div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="p-4 bg-space-900/50 border-t border-borderBase">
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={currentImage ? "Add an instruction (e.g. 'More blue neon')..." : "Enter thumbnail idea (e.g. '15+78' or 'Coding solo')..."}
                                    className="w-full bg-space-800 border-borderBase rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-1 focus:ring-brand-teal/50 transition-all text-sm group-hover:bg-space-700"
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || isGenerating}
                                    className="absolute right-2 top-1.5 w-9 h-9 bg-brand-teal text-space-900 rounded-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale shadow-glow-teal"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Output & Intelligence */}
                    <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                        <div className="aspect-video w-full bg-space-800/50 rounded-2xl border-2 border-dashed border-borderBase flex flex-col items-center justify-center overflow-hidden relative group shadow-2xl">
                            {currentImage ? (
                                <>
                                    <img src={currentImage} alt="Generated Thumbnail" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                        <button 
                                            onClick={() => handleSend(history[0])}
                                            className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                                            title="Regenerate Original Concept"
                                        >
                                            <RefreshCw className="w-5 h-5 text-white" />
                                        </button>
                                        <button 
                                            onClick={handleDownload}
                                            className="w-12 h-12 bg-brand-teal rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-glow-teal"
                                            title="Download 4K"
                                        >
                                            <Download className="w-5 h-5 text-space-900" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-8">
                                    <div className="w-16 h-16 bg-space-700 rounded-2xl flex items-center justify-center mb-4 mx-auto border border-borderBase shadow-glow-teal/10">
                                        <ImageIcon className="w-8 h-8 text-brand-teal/50" />
                                    </div>
                                    <p className="text-content-secondary font-medium">No active visualization</p>
                                    <p className="text-content-tertiary text-xs mt-1">Submit a concept on the left to start architecting</p>
                                </div>
                            )}
                        </div>

                        {/* Concept Metadata Card */}
                        <AnimatePresence>
                            {messages.length > 2 && messages[messages.length-1].concept && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-space-800/30 rounded-2xl border border-borderBase p-6 glass-card"
                                >
                                    <h4 className="font-bold text-sm mb-4 flex items-center gap-2 text-brand-teal uppercase tracking-widest">
                                        <Info className="w-4 h-4" /> Concept Architecture
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 rounded-xl bg-space-900/50 border border-borderBase">
                                                <p className="text-[8px] font-bold uppercase text-content-tertiary mb-1">Interpreted Intent</p>
                                                <p className="text-xs font-medium text-white">{interpretedIdea}</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-space-900/50 border border-borderBase">
                                                <p className="text-[8px] font-bold uppercase text-content-tertiary mb-1">Emotional Arc</p>
                                                <p className="text-xs font-medium text-white">{messages[messages.length-1].concept.emotion}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="p-3 rounded-xl bg-space-900/50 border border-borderBase">
                                            <p className="text-[8px] font-bold uppercase text-content-tertiary mb-1">Visual Transformation</p>
                                            <p className="text-xs font-medium text-white">{messages[messages.length-1].concept.transformation}</p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-brand-teal/5 border border-brand-teal/20">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[8px] font-bold uppercase text-brand-teal">Safety & Precision</span>
                                                <span className="text-[8px] font-medium text-brand-teal/80">Sanitized for SDXL</span>
                                            </div>
                                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                                <div className="bg-brand-teal h-full w-[95%] shadow-glow-teal" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </DashboardLayout>
        </PageTransition>
    );
}
