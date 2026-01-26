import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function AuthPage() {
    const { login, register, user, isLoading, manualLogin } = useAuth();
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    // Form State
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        try {
            // Note: manualLogin is a new method/overload we need in AuthContext
            // If we didn't update Context yet, we need to.
            // Or assume login() can handle object input again (it was string idToken).
            // Better to update Context.
            await manualLogin({ username, password });
            toast({ title: "Welcome back!", description: "Verifying profile..." });
        } catch (error: any) {
            toast({ title: "Login Failed", description: error.message, variant: "destructive" });
        }
    }

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        try {
            // For Manual Register: 
            await register({ username, email: username, password }); // Username here is email
            toast({ title: "Account Created", description: "Let's set up your channel." });
        } catch (error: any) {
            toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
        }
    }

    // Redirect if already logged in (Context effect handles this too, but for speed)
    useEffect(() => {
        if (user && !isLoading) {
            // If profile complete, go to dashboard directly visually or let context handle
        }
    }, [user, isLoading]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 blur-[100px] rounded-full opacity-20 pointer-events-none" />

            <Card className="w-full max-w-sm border-border/50 shadow-2xl relative z-10 glass-card">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary font-bold text-xl">
                        C
                    </div>
                    <CardTitle className="text-2xl font-display font-bold">Welcome Back</CardTitle>
                    <CardDescription>Sign in to Content Catalyst</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="register">Register</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={username} // reusing state variable for email
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        placeholder="name@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Login
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="register">
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reg-email">Email</Label>
                                    <Input
                                        id="reg-email"
                                        type="email"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        placeholder="name@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg-password">Create Password</Label>
                                    <Input
                                        id="reg-password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Account
                                </Button>
                                <p className="text-xs text-center text-muted-foreground">
                                    You will be asked to link your channel next.
                                </p>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
