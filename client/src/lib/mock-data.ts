export const mockData = {
    channel: {
        name: "DevWithNavaneeth",
        subscribers: 12400,
        totalVideos: 48,
        stage: "ESTABLISHED",
        avgCRPS: 1.14,
        creativeHealthIndex: 72
    },
    clusters: [
        { name: "System Design", videos: 14, avgCRPS: 1.42, trend: "rising" },
        { name: "Career Advice", videos: 11, avgCRPS: 1.18, trend: "stable" },
        { name: "Tool Reviews", videos: 9, avgCRPS: 0.87, trend: "falling" },
        { name: "Project Walkthroughs", videos: 8, avgCRPS: 1.31, trend: "rising" },
        { name: "Interview Prep", videos: 6, avgCRPS: 0.94, trend: "stable" }
    ],
    recentIdeas: [
        {
            lens: "Expansion",
            title: "The System Design Mistake That Cost Me a Google Interview",
            audienceFit: 0.91,
            identityAlignment: 0.88,
            novelty: 0.64
        },
        {
            lens: "Contrast",
            title: "I Stopped Using VS Code for 30 Days — Here's What Happened",
            audienceFit: 0.76,
            identityAlignment: 0.72,
            novelty: 0.89
        },
        {
            lens: "Remix",
            title: "How I'd Approach My First System Design Project Today (Career + Technical)",
            audienceFit: 0.84,
            identityAlignment: 0.81,
            novelty: 0.77
        }
    ],
    tonefingerprint: {
        formal: 0.42,
        humorous: 0.28,
        technical: 0.78,
        narrative: 0.51,
        experimental: 0.33
    },
    formatDNA: {
        tutorial: 0.44,
        story: 0.21,
        listicle: 0.15,
        experiment: 0.12,
        other: 0.08
    }
};
