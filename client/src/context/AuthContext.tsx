import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";

type User = {
    id: number;
    email: string;
    name: string;
    picture?: string;
    channelId?: string;
    isProfileComplete?: boolean;
};

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    login: (idToken: string) => Promise<void>;
    manualLogin: (data: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType>({} as any);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [, setLocation] = useLocation();

    useEffect(() => {
        checkAuth();
    }, []);

    // Effect to redirect if user is logged in
    useEffect(() => {
        if (!isLoading && user) {
            const currentPath = window.location.pathname;

            if (user.channelId) {
                // If on homepage, auth page, or onboarding (if complete), redirect to dashboard
                // Check if user is already on dashboard to prevent Loop
                if (currentPath === "/" || currentPath.startsWith("/auth") || currentPath === "/onboarding") {
                    setLocation(`/dashboard/overview?channelId=${user.channelId}`);
                }
            } else {
                // User has no connected channel yet -> Force Onboarding
                if (currentPath !== "/onboarding") {
                    setLocation("/onboarding");
                }
            }
        }
    }, [user, isLoading, setLocation]);

    async function checkAuth() {
        try {
            const res = await fetch("/auth/me");
            if (res.ok) {
                const data = await res.json();
                if (data.user) {
                    setUser({ ...data.user, isProfileComplete: data.isProfileComplete, channelId: data.channelId });
                }
            }
        } catch {
            // ignore
        } finally {
            setIsLoading(false);
        }
    }

    // Unified Login Handler Helper (Internal)
    async function handleAuthResponse(res: Response) {
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message);
        }
        const data = await res.json();
        setUser({
            ...data.user,
            isProfileComplete: data.isProfileComplete,
            channelId: data.channelId
        });

        if (!data.isProfileComplete) {
            if (window.location.pathname !== "/onboarding") setLocation("/onboarding");
        } else {
            // Force redirect to dashboard if profile is complete (Fixes "Stuck" issue)
            setLocation(`/dashboard/overview?channelId=${data.channelId}`);
        }
    }

    async function login(idToken: string) {
        const res = await fetch("/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
        });
        await handleAuthResponse(res);
    }

    async function manualLogin(data: any) {
        const res = await fetch("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data), // { username: email, password }
        });
        await handleAuthResponse(res);
    }

    async function register(data: any) {
        const res = await fetch("/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data), // { email, password, username }
        });
        await handleAuthResponse(res);
    }

    async function logout() {
        await fetch("/auth/logout", { method: "POST" });
        setUser(null);
        setLocation("/auth");
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, manualLogin, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
