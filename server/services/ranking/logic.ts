/**
 * Bandit Helper: Beta distribution sample (Thompson Sampling approximation)
 */
export function sampleBeta(alpha: number, beta: number): number {
  const mean = alpha / (alpha + beta);
  const variance = (alpha * beta) / (Math.pow(alpha + beta, 2) * (alpha + beta + 1));
  const noise = (Math.random() - 0.5) * Math.sqrt(variance);
  return mean + noise;
}

/**
 * Risk Penalty Multiplier based on user profile and format
 */
export function getRiskMultiplier(riskProfile: string | null, format: string): number {
  if (!riskProfile || riskProfile === "moderate") return 1.0;

  const riskyFormats = ["challenge", "rant", "experiment"];
  const safeFormats = ["tutorial", "listicle", "review"];

  const isRisky = riskyFormats.includes(format.toLowerCase());
  const isSafe = safeFormats.includes(format.toLowerCase());

  if (riskProfile === "conservative") {
    if (isRisky) return 0.6;
    if (isSafe) return 1.2;
  }

  if (riskProfile === "aggressive") {
    if (isRisky) return 1.3;
    if (isSafe) return 0.9;
  }

  return 1.0;
}
