import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    Globe2,
    Sparkles,
    Activity,
    GitMerge,
    Image as ImageIcon,
    MessageSquare,
    Settings,
    Bell,
    Plus,
    ChevronDown,
    LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockData } from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useQuery } from "@tanstack/react-query";
import { NudgeCenter } from "./NudgeCenter";
import { VoiceCapture } from "./VoiceCapture";

const NAV_ITEMS = [
    { path: "/dashboard/overview", label: "Overview", icon: LayoutDashboard },
    { path: "/dashboard/world-model", label: "World Model", icon: Globe2 },
    { path: "/dashboard/ideas", label: "Ideas Engine", icon: Sparkles },
    { path: "/dashboard/health", label: "Creative Health", icon: Activity },
    { path: "/dashboard/simulator", label: "What-If Simulator", icon: GitMerge },
    { path: "/dashboard/thumbnail-generator", label: "Thumbnail Generator", icon: ImageIcon },
    { path: "/dashboard/roadmap", label: "Dynamic Roadmap", icon: Activity },
    { path: "/dashboard/chat", label: "Chat (RAG)", icon: MessageSquare },
    { path: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardLayout({ children, title = "Dashboard" }: { children: ReactNode, title?: string }) {
    const [location] = useLocation();
    const { user, logout } = useAuth();
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

    const searchParams = new URLSearchParams(window.location.search);
    const urlChannelId = searchParams.get("channelId");

    // Fallback to user's linked channel if URL parameter is missing due to hard refresh
    const channelId = urlChannelId || user?.channelId || null;
    const queryAppend = channelId ? `?channelId=${encodeURIComponent(channelId)}` : "";
    const { analytics: rawAnalyics } = useDashboardData(channelId);

    // Fetch all profiles for the switcher (only if logged in)
    const { data: profiles } = useQuery<any[]>({
        queryKey: ["/api/user/profiles"],
        enabled: !!user,
        retry: false,
        staleTime: 5 * 60 * 1000,
        meta: { 
            persist: false // Don't persist auth errors
        }
    });

    // Fetch current channel's public profile info to avoid 401/auth issues and show real data
    const { data: profileData } = useQuery<any>({
        queryKey: ["channelProfile", channelId],
        queryFn: async () => {
            if (!channelId) return null;
            const res = await fetch(`/api/social/profile/${channelId}`);
            if (!res.ok) return null;
            return res.json();
        },
        enabled: !!channelId
    });

    const activeProfile = profileData?.profile;
    const channelName = activeProfile?.channelTitle || user?.channelTitle || user?.name || mockData.channel.name;
    
    // Use real subscriber count from DB if available, else fallback sparingly
    const displaySubs = activeProfile?.subscriberCount ? activeProfile.subscriberCount.toLocaleString() : "Syncing...";
    const displayPhase = activeProfile?.subscriberCount && activeProfile.subscriberCount > 50000 ? "ESTABLISHED" : "GROWING";

    return (
        <div className="flex bg-space-900 min-h-screen text-content-primary selection:bg-brand-teal/30">

            {/* Sidebar - Fixed */}
            <aside className="w-[260px] border-r border-borderBase bg-space-900 flex flex-col fixed inset-y-0 left-0 z-30">

                {/* Creator Profile Summary */}
                <div className="p-6 border-b border-borderBase relative">
                    <div 
                        className="flex items-center gap-3 mb-4 cursor-pointer group/profile"
                        onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                    >
                        <div className="w-10 h-10 rounded-full bg-brand-violet/20 border border-brand-violet/50 flex items-center justify-center text-brand-violet font-display font-bold uppercase overflow-hidden shrink-0">
                            {user?.picture ? <img src={user.picture} alt="Profile" className="w-full h-full object-cover" /> : channelName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="font-display font-bold text-sm tracking-tight truncate flex items-center gap-1">
                                {channelName}
                                <ChevronDown className={cn("w-3 h-3 text-content-tertiary transition-transform", isSwitcherOpen && "rotate-180")} />
                            </h2>
                            <p className="text-content-secondary text-xs">{displaySubs} subs</p>
                        </div>
                    </div>
                    
                    <AnimatePresence>
                        {isSwitcherOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-[calc(100%-10px)] left-4 right-4 bg-space-800 border border-borderBase rounded-xl shadow-2xl z-50 overflow-hidden"
                            >
                                <div className="p-2 border-b border-borderBase bg-space-900/50">
                                    <p className="text-[10px] font-bold uppercase text-content-tertiary px-2">Switch Channel</p>
                                </div>
                                <div className="max-h-60 overflow-y-auto p-1">
                                    {(profiles && profiles.length > 0) ? profiles.map((p: any) => (
                                        <Link 
                                            key={p.channelId} 
                                            href={`${location}${queryAppend.replace(channelId ? encodeURIComponent(channelId) : '', encodeURIComponent(p.channelId))}`}
                                            onClick={() => setIsSwitcherOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 p-2 rounded-lg hover:bg-brand-teal/5 transition-colors text-sm",
                                                p.channelId === channelId && "bg-brand-teal/10 text-brand-teal font-bold"
                                            )}
                                        >
                                            <div className="w-6 h-6 rounded bg-space-700 flex items-center justify-center text-[10px]">
                                                {p.channelTitle.charAt(0)}
                                            </div>
                                            <span className="truncate">{p.channelTitle}</span>
                                        </Link>
                                    )) : (
                                        <div className="p-2 text-xs text-content-tertiary italic">
                                            {activeProfile ? activeProfile.channelTitle : "No other channels"}
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={logout}
                                    className="w-full flex items-center gap-2 p-3 text-xs font-bold text-content-secondary border-t border-borderBase hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                >
                                    <LogOut className="w-3 h-3" />
                                    Logout Session
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="inline-flex px-2 py-1 bg-space-800 border border-borderBase rounded text-[10px] font-bold uppercase tracking-wider text-brand-teal">
                        Phase: {displayPhase}
                    </div>
                </div>

                {/* Navigation Map */}
                <nav className="flex-1 py-6 px-4 space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = location === item.path;
                        return (
                            <Link key={item.path} href={`${item.path}${queryAppend}`} className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                                isActive
                                    ? "text-brand-teal bg-brand-teal/10"
                                    : "text-content-secondary hover:text-content-primary hover:bg-space-800"
                            )}>
                                {isActive && (
                                    <motion.div layoutId="nav-pill" className="absolute left-0 w-1 h-full bg-brand-teal rounded-r-full" />
                                )}
                                <item.icon className={cn("w-4 h-4", isActive ? "text-brand-teal" : "text-content-tertiary group-hover:text-content-secondary")} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Upgrade Card */}
                <div className="p-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-space-800 to-space-900 border border-brand-teal/20 glow-teal relative overflow-hidden group">
                        <div className="absolute inset-0 bg-brand-teal/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <h4 className="font-display font-bold text-sm mb-1 text-content-primary relative z-10">Upgrade to Pro</h4>
                        <p className="text-xs text-content-secondary mb-3 relative z-10">Unlock Twin Finder and arc detector.</p>
                        <button className="w-full py-2 bg-brand-teal text-space-900 text-xs font-bold rounded hover:bg-brand-teal/90 transition-colors relative z-10">
                            Upgrade
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-[260px] flex flex-col min-h-screen">

                {/* Top Header */}
                <header className="h-16 px-8 border-b border-borderBase flex items-center justify-between bg-space-900/80 backdrop-blur-md sticky top-0 z-20">
                    <h1 className="font-display font-bold text-xl">{title}</h1>

                    <div className="flex items-center gap-6 text-sm">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-space-800 border border-borderBase">
                            <span className="text-content-tertiary">ID:</span>
                            <span className="font-mono text-content-secondary overflow-hidden text-ellipsis max-w-[150px] whitespace-nowrap">
                                {channelId || "No Channel"}
                            </span>
                        </div>
                        <div className="text-content-tertiary text-xs">
                            Last synced: 2m ago
                        </div>
                        
                        {/* Nudge Center Integration */}
                        {channelId && <NudgeCenter channelId={channelId} />}
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <div className="p-8 flex-1 relative overflow-x-hidden">
                    {children}
                </div>

                {/* Voice Ingestion Floating Button */}
                {channelId && <VoiceCapture channelId={channelId} />}
            </main>
        </div>
    );
}
