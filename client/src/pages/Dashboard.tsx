import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useChannelAnalytics, useChannelRecommendations } from "@/hooks/use-analytics";
import { Navigation } from "@/components/Navigation";
import { MetricCard } from "@/components/MetricCard";
import { ViewsChart, FormatChart } from "@/components/Charts";
import { Loader2, Users, Play, MessageSquare, Clock, AlertCircle, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ThinkingCompanion } from "@/components/ThinkingCompanion";

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
  const [selectedIdeaId, setSelectedIdeaId] = useState<number | null>(null);
  const [ideaDeepDive, setIdeaDeepDive] = useState<any | null>(null);
  const [isLoadingDeepDive, setIsLoadingDeepDive] = useState(false);

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

  async function handleIdeaClick(id: number) {
    setSelectedIdeaId(id);
    setIsLoadingDeepDive(true);
    setIdeaDeepDive(null);
    // Fire and forget interaction log
    fetch("/api/user/interact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ideaId: id, actionType: "clicked" }),
    }).catch(() => { }); // Ignore errors for analytics

    try {
      const res = await fetch(`/api/idea/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load idea details");
      const data = await res.json();
      setIdeaDeepDive(data.ideaBlueprint);
    } catch (e) {
      setIdeaDeepDive(null);
    } finally {
      setIsLoadingDeepDive(false);
    }
  }

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
                  <p className="text-muted-foreground">Semantic topic families and experiment ideas tailored to your channel</p>
                </div>
              </div>

              {recommendationsData?.topicClusters && recommendationsData.topicClusters.length > 0 && (
                <div className="bg-card border border-border/50 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-lg">Topic Clusters</h3>
                    <p className="text-xs text-muted-foreground">Derived from video titles & descriptions using semantic embeddings</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {recommendationsData.topicClusters.map((c: any) => (
                      <div key={c.index} className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs shadow-sm border border-border/50">
                        <div className="font-semibold text-sm">{c.label}</div>
                        <div className="text-[11px] text-muted-foreground mt-1">{c.performanceSummary}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recommendationsData?.diagnosis && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                    <h4 className="text-xs font-bold uppercase text-green-500 mb-2">Where viewers feel at home</h4>
                    <ul className="text-sm space-y-1">
                      {recommendationsData.diagnosis.comfortable.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <h4 className="text-xs font-bold uppercase text-blue-500 mb-2">Where curiosity seems to grow</h4>
                    <ul className="text-sm space-y-1">
                      {recommendationsData.diagnosis.curious.map((c: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                    <h4 className="text-xs font-bold uppercase text-orange-500 mb-2">Where attention tends to fade</h4>
                    <ul className="text-sm space-y-1">
                      {recommendationsData.diagnosis.disengaged.map((c: string, i: number) => (
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
                    {exp.ideas && exp.ideas.length > 0 ? exp.ideas.map((idea: any, i: number) => (
                      <div
                        key={i}
                        onClick={() => handleIdeaClick(idea.id)}
                        className={cn(
                          "group bg-card border border-border/50 rounded-xl p-6 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden cursor-pointer",
                          selectedIdeaId === idea.id && "border-primary/70"
                        )}
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Lightbulb className="w-24 h-24 rotate-12" />
                        </div>

                        {/* Rank Number */}
                        <div className="absolute top-4 right-4 text-4xl font-display font-bold text-primary/20 group-hover:text-primary/10 transition-colors">
                          #{i + 1}
                        </div>

                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary">
                              {idea.format}
                            </span>

                            {/* Confidence Badge */}
                            {idea.score !== undefined && (
                              <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border backdrop-blur-sm",
                                idea.score >= 70 ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" :
                                  idea.score >= 40 ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30" :
                                    "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30"
                              )}>
                                {idea.score >= 70 ? "High Confidence" : idea.score >= 40 ? "Experimental" : "Risky"} ({idea.score}%)
                              </span>
                            )}

                            <span className="text-xs text-muted-foreground">
                              {idea.suggestedPostingTime}
                            </span>
                          </div>

                          <h3 className="font-display font-bold text-xl mb-2 group-hover:text-primary transition-colors">
                            {idea.title}
                          </h3>

                          {/* Short Explanation */}
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {idea.note || idea.rationale}
                          </p>
                        </div>
                      </div>
                    )) : (
                      <div className="text-sm text-muted-foreground">No ideas generated for this experiment yet.</div>
                    )}
                  </div>
                </div>
              ))}

              {selectedIdeaId && (
                <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-lg">Idea Deep Dive</h3>
                      <p className="text-xs text-muted-foreground">Why this idea fits your channel and how to execute it</p>
                    </div>
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => { setSelectedIdeaId(null); setIdeaDeepDive(null); }}
                    >
                      Close
                    </button>
                  </div>

                  {isLoadingDeepDive && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating explanation from your channel data…</span>
                    </div>
                  )}

                  {!isLoadingDeepDive && ideaDeepDive && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[11px] uppercase font-bold text-primary tracking-widest mb-1">Selected Spark</p>
                        <p className="font-display font-semibold text-lg">{ideaDeepDive.title || selectedIdeaId}</p>
                      </div>

                      <div className="p-4 rounded-lg bg-secondary/40 border border-border/50">
                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">The Creative Tension</p>
                        <p className="text-sm text-foreground leading-relaxed">{ideaDeepDive.note || "No details available."}</p>
                      </div>

                      {ideaDeepDive.rationale && (
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Why this works</p>
                          <p className="text-sm text-muted-foreground">{ideaDeepDive.rationale}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                        <button
                          className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-1"
                          onClick={() => {
                            fetch("/api/user/interact", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ ideaId: selectedIdeaId, actionType: "saved" }),
                            }).then(() => alert("Saved to Library!"));
                          }}
                        >
                          Save to Library
                        </button>
                        <button
                          className="bg-green-500/10 text-green-600 hover:bg-green-500/20 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-1 border border-green-500/20"
                          onClick={() => {
                            fetch("/api/user/interact", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ ideaId: selectedIdeaId, actionType: "published" }),
                            }).then(() => alert("Marked as Published! (Reward signal sent)"));
                          }}
                        >
                          Mark as Published
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {currentTab === "ideas" && (
          <ThinkingCompanion channelId={channelId} />
        )}
      </main>
    </div>
  );
}
