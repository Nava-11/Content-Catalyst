import { motion } from "framer-motion";
import { ReactNode } from "react";

export function PageTransition({ children, className }: { children: ReactNode, className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} // smooth apple-like ease out
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Fade in up for children staggered
export const StaggerContainer = ({ children, className, delay = 0 }: { children: ReactNode, className?: string, delay?: number }) => {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
                visible: {
                    transition: {
                        staggerChildren: 0.1,
                        delayChildren: delay,
                    }
                },
                hidden: {}
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export const FadeInUp = ({ children, className, delay = 0 }: { children: ReactNode, className?: string, delay?: number }) => {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay } }
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};
