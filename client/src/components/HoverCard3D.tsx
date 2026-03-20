import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { MouseEvent, ReactNode, useRef } from "react";
import { cn } from "@/lib/utils";

interface HoverCard3DProps {
    children: ReactNode;
    className?: string;
    glowColor?: "teal" | "violet" | "amber" | "coral" | "none";
}

export function HoverCard3D({ children, className, glowColor = "teal" }: HoverCard3DProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Motion values to track mouse position relative to the center of the card
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
        if (!containerRef.current) return;
        const { left, top, width, height } = containerRef.current.getBoundingClientRect();

        // Calculate distance from center (normalized from -1 to 1)
        const x = (e.clientX - left - width / 2) / (width / 2);
        const y = (e.clientY - top - height / 2) / (height / 2);

        mouseX.set(x);
        mouseY.set(y);
    }

    function handleMouseLeave() {
        mouseX.set(0);
        mouseY.set(0);
    }

    // Create smooth transform string using the 3X factor for rotation degrees
    const rotateX = useMotionTemplate`${mouseY} * -8deg`;
    const rotateY = useMotionTemplate`${mouseX} * 8deg`;

    // Dynamic glow mapping
    const glows = {
        teal: "group-hover:shadow-[0_0_40px_rgba(29,255,210,0.15)] group-hover:border-brand-teal/40",
        violet: "group-hover:shadow-[0_0_40px_rgba(139,92,246,0.2)] group-hover:border-brand-violet/40",
        amber: "group-hover:shadow-[0_0_40px_rgba(245,158,11,0.15)] group-hover:border-brand-amber/40",
        coral: "group-hover:shadow-[0_0_40px_rgba(255,107,107,0.15)] group-hover:border-brand-coral/40",
        none: ""
    };

    return (
        <motion.div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                perspective: "1000px",
            }}
            className="group realtive z-10 w-full"
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                }}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={cn(
                    "glass-card w-full h-full rounded-2xl relative transition-colors duration-300",
                    glows[glowColor],
                    className
                )}
            >
                {children}
            </motion.div>
        </motion.div>
    );
}
