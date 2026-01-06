import { useLocation, useSearch } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Lightbulb, Compass, Search } from "lucide-react";
import { Link } from "wouter";

export function Navigation() {
  const [location] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const channelId = params.get("channelId");

  // Simple check to see if we are in a dashboard view
  const isDashboard = location.includes('/dashboard');

  const getDashboardHref = (tab: string) => {
    return `/dashboard/${tab}${channelId ? `?channelId=${channelId}` : ''}`;
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold font-display text-xl group-hover:scale-105 transition-transform">
              C
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">
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
              <Link 
                href={getDashboardHref('guidance')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                  location.includes('guidance') 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Compass className="w-4 h-4" />
                Guidance
              </Link>
            </div>
          )}

          <div className="flex items-center gap-4">
             {isDashboard && (
               <Link href="/">
                 <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                   <Search className="w-5 h-5" />
                 </button>
               </Link>
             )}
          </div>
        </div>
      </div>
    </nav>
  );
}
