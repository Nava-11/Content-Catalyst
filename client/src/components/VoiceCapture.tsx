import { Mic, Square, Loader2, Sparkles, X } from "lucide-react";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VoiceCaptureProps {
    channelId: string;
}

export function VoiceCapture({ channelId }: VoiceCaptureProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const voiceMutation = useMutation({
        mutationFn: async (audioBase64: string) => {
            const res = await fetch("/api/intelligence/voice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ audio: audioBase64, channelId })
            });
            return res.json();
        },
        onSuccess: (data) => {
            toast({ title: "Idea Captured!", description: `Transcribed: "${data.title}"` });
            queryClient.invalidateQueries({ queryKey: [`/api/ideas/${channelId}`] });
            setShowModal(false);
        }
    });

    const startRecording = () => {
        setIsRecording(true);
        // In a real app: navigator.mediaDevices.getUserMedia -> MediaRecorder
    };

    const stopRecording = () => {
        setIsRecording(false);
        // In a real app: finalize blob -> convert to base64
        // Mocking for MVP
        setTimeout(() => {
            voiceMutation.mutate("mock_base64_audio");
        }, 1500);
    };

    return (
        <>
            <button 
                onClick={() => setShowModal(true)}
                className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-110 transition-transform duration-500 rounded-full" />
                <Mic className="w-6 h-6 relative z-10" />
            </button>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                            onClick={() => setShowModal(false)}
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-card border border-border w-full max-w-md p-8 rounded-3xl shadow-2xl relative z-10 text-center space-y-6"
                        >
                            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-display font-bold">Voice Idea Capture</h3>
                                <p className="text-sm text-muted-foreground italic">Thinking out loud? We'll transcribe and structure it.</p>
                            </div>

                            <div className="flex flex-col items-center justify-center space-y-6 py-6">
                                <motion.div 
                                    animate={isRecording ? { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] } : {}}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className={cn(
                                        "w-24 h-24 rounded-full flex items-center justify-center border-4",
                                        isRecording ? "bg-red-500/10 border-red-500 text-red-500" : "bg-primary/10 border-primary text-primary"
                                    )}
                                >
                                    {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-8 h-8" />}
                                </motion.div>

                                <button 
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={cn(
                                        "px-8 py-3 rounded-2xl font-bold transition-all shadow-lg",
                                        isRecording ? "bg-red-500 text-white hover:bg-red-600 scale-105" : "bg-primary text-white hover:bg-primary/90"
                                    )}
                                    disabled={voiceMutation.isPending}
                                >
                                    {voiceMutation.isPending ? "Processing..." : isRecording ? "Stop & Transcribe" : "Start Recording"}
                                </button>
                            </div>

                            {voiceMutation.isPending && (
                                <div className="flex items-center justify-center gap-2 text-primary font-bold animate-bounce">
                                    <Sparkles className="w-5 h-5" />
                                    <span>AI is identifying creative signals...</span>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
