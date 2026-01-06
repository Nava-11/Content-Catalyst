import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useChannelAnalytics, useChannelRecommendations } from "@/hooks/use-analytics";
import { Navigation } from "@/components/Navigation";
import { MetricCard } from "@/components/MetricCard";
import { ViewsChart, FormatChart } from "@/components/Charts";
import { Loader2, Users, Play, MessageSquare, Clock, Calendar, AlertCircle, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// --- Sub-components for clean code ---

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
      <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
      <p className="text-lg font-medium">Crunching the numbers...</p>
      <p className="text-sm opacity-60">This might take a few seconds.</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-destructive">
      <AlertCircle className="w-12 h-12 mb-4" />
      <h3 className="text-xl font-bold mb-2">Analysis Failed</h3>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

// --- Main Dashboard Page ---

export default function Dashboard() {
  const [location] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const channelId = params.get("channelId");

  // Determine current tab from URL
  const currentTab = location.split("/").pop() || "overview";

  const { data: analyticsData, isLoading: isLoadingAnalytics, error: analyticsError } = useChannelAnalytics(channelId);
  const { data: recommendationsData, isLoading: isLoadingRecs } = useChannelRecommendations(channelId);

  // If no channel ID, redirect home
  useEffect(() => {
    if (!channelId) {
      window.location.href = "/";
    }
  }, [channelId]);

  if (!channelId) return null;

  // Render Logic
  const isLoading = isLoadingAnalytics || (currentTab !== "overview" && isLoadingRecs);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <LoadingState />
      </div>
    );
  }

  if (analyticsError || !analyticsData) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <ErrorState message={analyticsError?.message || "Channel not found"} />
      </div>
    );
  }

  const { analytics, viewsOverTime, avgCrpsByFormat, keywords } = analyticsData;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {currentTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-display font-bold">Channel Overview</h1>
                  <p className="text-muted-foreground">Performance metrics for channel <span className="text-primary font-mono">{channelId}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Data Freshness</p>
                  <p className="text-sm font-medium">Just Now</p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                  title="Total Videos" 
                  value={analytics.totalVideos || 0}
                  icon={Play}
                  className="border-blue-500/20"
                  delay={0}
                />
                <MetricCard 
                  title="Avg Views" 
                  value={new Intl.NumberFormat('en', { notation: "compact" }).format(analytics.avgViews || 0)}
                  icon={Users}
                  trend="+12%" // Placeholder trend - would need historical data
                  trendUp={true}
                  className="border-green-500/20"
                  delay={0.1}
                />
                <MetricCard 
                  title="Avg Engagement" 
                  value={new Intl.NumberFormat('en', { notation: "compact" }).format((analytics.avgLikes || 0) + (analytics.avgComments || 0))}
                  icon={MessageSquare}
                  className="border-purple-500/20"
                  delay={0.2}
                />
                <MetricCard 
                  title="Optimal Duration" 
                  value={`${Math.floor((analytics.optimalDurationMin || 0) / 60)}-${Math.ceil((analytics.optimalDurationMax || 0) / 60)}m`}
                  icon={Clock}
                  className="border-orange-500/20"
                  delay={0.3}
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-card border border-border/50 rounded-xl p-6 shadow-lg shadow-black/20">
                  <h3 className="font-display font-bold text-lg mb-6">Views Trajectory</h3>
                  <ViewsChart data={viewsOverTime} />
                </div>
                
                <div className="bg-card border border-border/50 rounded-xl p-6 shadow-lg shadow-black/20">
                  <h3 className="font-display font-bold text-lg mb-6">Best Formats (CRPS)</h3>
                  <FormatChart data={avgCrpsByFormat} />
                </div>
              </div>

              {/* Keywords Cloud */}
              <div className="bg-card border border-border/50 rounded-xl p-6">
                <h3 className="font-display font-bold text-lg mb-4">Dominant Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((k, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-primary hover:text-white transition-colors cursor-default"
                      style={{ opacity: 1 - (i * 0.05) }} // Fade out slightly for lower ranked keywords
                    >
                      {k.keyword}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {currentTab === "ideas" && (
            <motion.div
              key="ideas"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-display font-bold">Recommended Content Experiments</h1>
                  <p className="text-muted-foreground">Strategic experiments based on your channel diagnosis</p>
                </div>
              </div>

              {recommendationsData?.diagnosis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                    <h4 className="text-xs font-bold uppercase text-green-500 mb-2">Diagnosis Strengths</h4>
                    <ul className="text-sm space-y-1">
                      {recommendationsData.diagnosis.strengths.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                    <h4 className="text-xs font-bold uppercase text-orange-500 mb-2">Diagnosis Constraints</h4>
                    <ul className="text-sm space-y-1">
                      {recommendationsData.diagnosis.constraints.map((c: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-orange-500 mt-1">•</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {recommendationsData?.experiments && recommendationsData.experiments.map((exp: any, expIdx: number) => (
                <div key={expIdx} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <h2 className="text-sm font-bold uppercase tracking-widest text-primary px-4 bg-background">
                      {exp.experimentType}
                    </h2>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {exp.ideas.map((idea: any, i: number) => (
                      <div 
                        key={i} 
                        className="group bg-card border border-border/50 rounded-xl p-6 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Lightbulb className="w-24 h-24 rotate-12" />
                        </div>
                        
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary">
                              {idea.format}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {idea.suggestedPostingTime}
                            </span>
                          </div>
                          
                          <h3 className="font-display font-bold text-xl mb-2 group-hover:text-primary transition-colors">
                            {idea.title}
                          </h3>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {currentTab === "guidance" && (
             <motion.div
             key="guidance"
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: 20 }}
             transition={{ duration: 0.3 }}
             className="max-w-4xl mx-auto space-y-8"
           >
             <div className="text-center mb-12">
               <h1 className="text-3xl font-display font-bold">Strategic Guidance</h1>
               <p className="text-muted-foreground">Detailed breakdown of experiment hypotheses</p>
             </div>

             {recommendationsData?.experiments && (
               <div className="space-y-12">
                 {/* Detail Cards for Ideas */}
                 <div className="grid grid-cols-1 gap-6">
                    {recommendationsData.experiments.flatMap((e: any) => e.ideas).map((idea: any, i: number) => (
                      <div key={i} className="bg-card border border-border/50 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-primary underline">{idea.title}</h4>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground px-2 py-1 bg-muted rounded">
                            {idea.format}
                          </span>
                        </div>
                        <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            <span className="font-semibold text-foreground block mb-1">Experiment Hypothesis:</span>
                            {idea.whyItWorks}
                          </p>
                        </div>
                      </div>
                    ))}
                 </div>

                 {/* Hero Stats */}
                 {recommendationsData.guidance && (
                   <>
                     <div className="grid grid-cols-3 gap-4 mb-8">
                       <div className="bg-primary/10 border border-primary/20 p-6 rounded-xl text-center">
                         <p className="text-xs text-primary uppercase font-bold tracking-wider mb-1">Winning Format</p>
                         <p className="text-xl font-bold font-display">{recommendationsData.guidance.topFormat}</p>
                       </div>
                       <div className="bg-card border border-border p-6 rounded-xl text-center">
                         <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Outperformance</p>
                         <p className="text-xl font-bold font-display text-green-500">+{recommendationsData.guidance.diffVsOther}%</p>
                       </div>
                       <div className="bg-card border border-border p-6 rounded-xl text-center">
                         <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Ideal Length</p>
                         <p className="text-xl font-bold font-display">{recommendationsData.guidance.optimalLength}</p>
                       </div>
                     </div>

                     {/* Structure Timeline */}
                     <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                       <div className="p-6 border-b border-border/50 bg-secondary/30">
                         <h3 className="font-display font-bold text-lg">Optimal Video Structure</h3>
                       </div>
                       
                       <div className="p-8 space-y-8 relative">
                         {/* Connecting Line */}
                         <div className="absolute left-[2.25rem] top-12 bottom-12 w-0.5 bg-border" />

                         <div className="relative pl-12">
                            <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center font-bold border-4 border-card z-10">
                              1
                            </div>
                            <h4 className="font-bold text-lg mb-2">The Hook (0:00 - 0:30)</h4>
                            <p className="text-muted-foreground leading-relaxed">{recommendationsData.guidance.structure.hook}</p>
                         </div>

                         <div className="relative pl-12">
                            <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold border-4 border-card z-10">
                              2
                            </div>
                            <h4 className="font-bold text-lg mb-2">The Core Value</h4>
                            <p className="text-muted-foreground leading-relaxed">{recommendationsData.guidance.structure.body}</p>
                         </div>

                         <div className="relative pl-12">
                            <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center font-bold border-4 border-card z-10">
                              3
                            </div>
                            <h4 className="font-bold text-lg mb-2">The Call to Action</h4>
                            <p className="text-muted-foreground leading-relaxed">{recommendationsData.guidance.structure.cta}</p>
                         </div>
                       </div>
                     </div>
                   </>
                 )}
               </div>
             )}
           </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
