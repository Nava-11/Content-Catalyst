import { Check } from "lucide-react";
import { HoverCard3D } from "../HoverCard3D";

const PLANS = [
    {
        name: "Starter",
        price: "Free",
        desc: "1 channel",
        features: ["Up to 20 videos analyzed", "World model (basic)", "5 idea sparks/week", "Starter roadmap"],
        glow: "none"
    },
    {
        name: "Creator",
        price: "$12",
        period: "/mo",
        desc: "1 channel",
        features: ["Up to 100 videos", "Full world model", "Unlimited idea sparks", "RAG chatbot", "Fatigue detection"],
        glow: "teal"
    },
    {
        name: "Pro",
        price: "$29",
        period: "/mo",
        desc: "3 channels",
        popular: true,
        features: ["Unlimited videos", "Everything in Creator", "Creative Twin Finder", "Semantic Mood Board", "Series arc detector"],
        glow: "violet"
    }
];

export function Pricing() {
    return (
        <section id="pricing" className="py-32 relative z-10 px-6 border-t border-borderBase bg-space-900">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-content-primary mb-4">Simple pricing. Powerful intelligence.</h2>
                    <p className="text-content-secondary text-lg">Stop guessing. Start creating with clarity.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {PLANS.map((plan, i) => (
                        <HoverCard3D key={i} glowColor={plan.glow as any}>
                            <div className={`p-8 h-full flex flex-col relative ${plan.popular ? 'border-brand-violet ring-1 ring-brand-violet/50' : 'border-borderBase'}`}>

                                {plan.popular && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-violet text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                                        Most Popular
                                    </div>
                                )}

                                <h3 className="font-display font-bold text-xl text-content-primary mb-2">{plan.name}</h3>
                                <div className="text-content-secondary text-sm mb-6 pb-6 border-b border-borderBase">{plan.desc}</div>

                                <div className="flex items-baseline gap-1 mb-8">
                                    <span className="text-4xl font-display font-bold text-content-primary">{plan.price}</span>
                                    {plan.period && <span className="text-content-secondary">{plan.period}</span>}
                                </div>

                                <ul className="space-y-4 mb-8 flex-1">
                                    {plan.features.map((feat, j) => (
                                        <li key={j} className="flex items-start gap-3 text-sm text-content-primary">
                                            <Check className="w-5 h-5 text-brand-teal shrink-0" />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>

                                <button className={`w-full py-4 rounded-xl font-bold text-sm transition-all ${plan.popular
                                        ? 'bg-brand-violet text-white hover:bg-brand-violet/90 glow-violet'
                                        : plan.name === 'Creator'
                                            ? 'bg-brand-teal text-space-900 hover:bg-brand-teal/90 glow-teal'
                                            : 'bg-space-800 text-content-primary hover:bg-space-700 border border-content-tertiary/20'
                                    }`}>
                                    Get Started
                                </button>
                            </div>
                        </HoverCard3D>
                    ))}
                </div>
            </div>
        </section>
    );
}
