import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { PageTransition, FadeInUp } from "@/components/PageTransition";
import { Check, ArrowRight, Loader2, Sparkles } from "lucide-react";

const STEPS = [
    "Connect Channel",
    "Ingest History",
    "Build World Model",
    "Extract Fingerprint",
    "Ready"
];

export default function OnboardingPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [, setLocation] = useLocation();

    // Parse channelId from URL
    const [channelIdQuery, setChannelIdQuery] = useState<string | null>(new URLSearchParams(window.location.search).get("channelId"));
    const [inputChannelId, setInputChannelId] = useState("");
    const [isLinking, setIsLinking] = useState(false);

    // Start analysis on mount if channelId is present
    useEffect(() => {
        if (!channelIdQuery) {
            // Not an error, just need them to input it.
            return;
        }

        const runAnalysis = async () => {
            try {
                // Simulate steps visually since /api/analyze is a long-polling monolithic endpoint.
                // In a highly async system, we'd use WebSockets for real progress.
                const stepInterval = setInterval(() => {
                    setCurrentStep(s => (s < 3 ? s + 1 : s));
                }, 3000);

                const res = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ channelId: channelIdQuery })
                });

                clearInterval(stepInterval);

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.message || "Analysis failed");
                }

                setCurrentStep(4); // Finished

            } catch (e: any) {
                setError(e.message);
            }
        };
        runAnalysis();
    }, [channelIdQuery]);

    const handleNext = () => {
        if (currentStep === 4 && channelIdQuery) {
            setLocation(`/dashboard/overview?channelId=${encodeURIComponent(channelIdQuery)}`);
        } else if (!channelIdQuery && error) {
            setLocation("/");
        }
    };

    const handleLinkChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLinking(true);
        setError(null);
        try {
            const res = await fetch("/api/onboarding/channel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ channelId: inputChannelId })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to link channel");
            }

            // Channel linked successfully, set state to trigger analysis
            setChannelIdQuery(inputChannelId);
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set("channelId", inputChannelId);
            window.history.pushState({}, "", newUrl);

        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLinking(false);
        }
    };

    return (
        <PageTransition className="min-h-screen bg-space-900 flex items-center justify-center p-6 text-content-primary">
            <div className="max-w-xl w-full">

                <FadeInUp>
                    <div className="text-center mb-12">
                        <h1 className="font-display font-bold text-3xl mb-3">Initialize Your World Model</h1>
                        <p className="text-content-secondary">We're mapping your creative DNA to build a personalized intelligence engine.</p>
                    </div>
                </FadeInUp>

                <div className="glass-card p-8 rounded-3xl mb-8 relative overflow-hidden">

                    <div className="absolute top-0 left-0 w-full h-1 bg-space-800">
                        <div
                            className="h-full bg-brand-teal transition-all duration-500 ease-out glow-teal"
                            style={{ width: `${(currentStep / 4) * 100}%` }}
                        />
                    </div>

                    <div className="space-y-8 mt-4">
                        {error && (
                            <div className="p-4 rounded-xl bg-brand-coral/10 border border-brand-coral/30 text-brand-coral text-sm font-bold">
                                Error: {error}
                            </div>
                        )}
                        {!channelIdQuery ? (
                            <form onSubmit={handleLinkChannel} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-content-secondary">YouTube Channel ID</label>
                                    <input
                                        type="text"
                                        value={inputChannelId}
                                        onChange={(e) => setInputChannelId(e.target.value)}
                                        placeholder="e.g. UCJvGL2mexQOuGGa..."
                                        className="w-full bg-space-900 border border-content-tertiary/20 rounded-xl px-4 py-3 text-content-primary focus:outline-none focus:border-brand-teal transition-colors"
                                        required
                                    />
                                    <p className="text-xs text-content-tertiary">Enter the alpha-numeric ID of the channel you wish to analyze.</p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLinking || !inputChannelId}
                                    className="w-full h-12 rounded-xl bg-brand-teal text-space-900 font-bold flex items-center justify-center gap-2 hover:bg-brand-teal/90 glow-teal transition-colors disabled:opacity-50"
                                >
                                    {isLinking ? <Loader2 className="w-5 h-5 animate-spin" /> : "Link Channel & Analyze"}
                                </button>
                            </form>
                        ) : (
                            STEPS.map((step, i) => {
                                const state = i < currentStep ? "done" : i === currentStep ? "active" : "pending";
                                return (
                                    <FadeInUp key={i} delay={i * 0.1}>
                                        <div className={`flex items-center gap-4 ${state === "pending" ? "opacity-40" : ""}`}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${state === "done" ? "bg-brand-teal border-brand-teal text-space-900 glow-teal" :
                                                state === "active" ? "border-brand-teal text-brand-teal" :
                                                    "border-borderBase bg-space-800 text-content-tertiary"
                                                }`}>
                                                {state === "done" ? <Check className="w-5 h-5" /> :
                                                    state === "active" ? <Loader2 className="w-5 h-5 animate-spin" /> :
                                                        <span className="font-mono text-sm">{i + 1}</span>}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className={`font-bold ${state === "active" ? "text-brand-teal" : "text-content-primary"}`}>{step}</h3>
                                                {state === "active" && (
                                                    <p className="text-xs text-content-secondary mt-1 animate-pulse">
                                                        {i === 0 ? "Fetching channel data from YouTube..." :
                                                            i === 1 ? "Analyzing history..." :
                                                                i === 2 ? "Generating semantic clusters via embeddings..." :
                                                                    i === 3 ? "Calculating vector similarity for tone..." :
                                                                        "Finalizing..."}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </FadeInUp>
                                );
                            })
                        )}
                    </div>

                </div>

                {channelIdQuery && (
                    <FadeInUp>
                        <button
                            onClick={handleNext}
                            disabled={currentStep < 4 && !error}
                            className="w-full h-14 rounded-xl bg-space-800 border border-content-tertiary/20 font-bold text-content-primary flex items-center justify-center gap-2 hover:bg-space-700 hover:border-brand-teal/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {error ? (
                                <span>Go Back Home</span>
                            ) : currentStep === 4 ? (
                                <span className="flex items-center gap-2 text-brand-teal glow-teal"><Sparkles className="w-5 h-5" /> Enter Dashboard</span>
                            ) : (
                                <span className="flex items-center gap-2">Analyzing Channel <Loader2 className="w-4 h-4 text-content-secondary animate-spin" /></span>
                            )}
                        </button>
                    </FadeInUp>
                )}

            </div>
        </PageTransition>
    );
}
