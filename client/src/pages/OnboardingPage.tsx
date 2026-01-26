import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Youtube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OnboardingPage() {
    const { user, checkAuth } = useAuth(); // Assume checkAuth can be called to refresh user state
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [channelId, setChannelId] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!user) {
        // Should be protected route
        setLocation("/auth");
        return null;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch("/api/onboarding/channel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ channelId }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to link channel");
            }

            toast({ title: "Channel Linked!", description: "Setting up your dashboard..." });

            // Force refresh of user context to get isProfileComplete = true and channelId
            // A hard reload is safest to reset all state, or checkAuth()
            window.location.href = "/"; // Force reload to ensure fresh state
        } catch (error: any) {
            toast({ title: "Setup Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/30 blur-[100px] rounded-full opacity-30 pointer-events-none" />

            <Card className="w-full max-w-lg border-border/50 shadow-2xl relative z-10">
                <CardHeader>
                    <CardTitle className="text-2xl font-display font-bold">One Last Step</CardTitle>
                    <CardDescription>Link your YouTube channel to personalize your insights.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="channelId">YouTube Channel ID</Label>
                            <div className="relative">
                                <Youtube className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="channelId"
                                    value={channelId}
                                    onChange={(e) => setChannelId(e.target.value)}
                                    placeholder="UCxxxxxxxxxxxxxxxxxxxxxxx"
                                    className="pl-9 font-mono"
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                You can find this in your <a href="https://studio.youtube.com" target="_blank" className="underline hover:text-primary">YouTube Studio</a> URL or Advanced Settings.
                            </p>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading || !channelId.startsWith("UC")}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    verifying...
                                </>
                            ) : (
                                "Complete Setup"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
