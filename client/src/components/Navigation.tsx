import { useLocation, useSearch } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Lightbulb, Search, ChevronDown, Plus } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { NudgeCenter } from "./NudgeCenter";
import { useQuery } from "@tanstack/react-query";

export function Navigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const channelId = params.get("channelId");

  // Fetch all profiles for the switcher
  const { data: profiles } = useQuery<any[]>({
    queryKey: ["/api/user/profiles"],
    enabled: !!user
  });

  const isDashboard = location.includes('/dashboard');

  const getDashboardHref = (tab: string, id?: string) => {
    const targetId = id || channelId;
    return `/dashboard/${tab}${targetId ? `?channelId=${targetId}` : ''}`;
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer shrink-0">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold font-display text-xl group-hover:scale-105 transition-transform">
                C
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-foreground hidden sm:inline">
                Content<span className="text-primary">Catalyst</span>
              </span>
            </Link>

            {isDashboard && (
              <div className="hidden md:flex items-center space-x-1">
                <Link
                  href={getDashboardHref('overview')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                    location.includes('overview')
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Overview
                </Link>
                <Link
                  href={getDashboardHref('ideas')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                    location.includes('ideas')
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Lightbulb className="w-4 h-4" />
                  Ideas
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Channel Switcher */}
                {profiles && (profiles as any[]).length > 0 && (
                  <div className="relative group hidden sm:block">
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border border-border/50 hover:bg-muted transition-all">
                      <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
                        <Plus className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-xs font-bold truncate max-w-[100px]">
                        {(profiles as any[]).find((p: any) => p.channelId === channelId)?.channelTitle || "Select Channel"}
                      </span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </button>
                    
                    <div className="absolute top-full right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all z-[60] overflow-hidden">
                      <div className="p-2 border-b border-border bg-muted/20">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground px-2">Your Channels</p>
                      </div>
                      <div className="p-1 max-h-64 overflow-y-auto">
                        {(profiles as any[]).map((p: any) => (
                          <Link 
                            key={p.channelId} 
                            href={getDashboardHref(location.split('/').pop() || 'overview', p.channelId)}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors text-sm",
                              p.channelId === channelId && "bg-primary/10 text-primary font-bold"
                            )}
                          >
                            <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px]">
                              {(p.channelTitle as string).charAt(0)}
                            </div>
                            <span className="truncate">{p.channelTitle}</span>
                          </Link>
                        ))}
                      </div>
                      <Link href="/onboarding" className="flex items-center gap-2 p-3 text-xs font-bold text-primary border-t border-border hover:bg-primary/5 transition-colors">
                        <Plus className="w-3 h-3" />
                        Add New Channel
                      </Link>
                    </div>
                  </div>
                )}

                {/* Intelligence Nudges */}
                {channelId && <NudgeCenter channelId={channelId} />}

                <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

                {/* User Menu */}
                <div className="flex items-center gap-3">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-border shadow-sm" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      {user.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <button
                    onClick={logout}
                    className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link href="/auth">
                  <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Login
                  </button>
                </Link>
                <Link href="/auth">
                  <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all hover:-translate-y-0.5 active:translate-y-0">
                    Get Started
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

