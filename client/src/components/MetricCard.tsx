import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  delay?: number;
}

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp, 
  className,
  delay = 0 
}: MetricCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "bg-card border border-border/50 rounded-xl p-6 relative overflow-hidden group hover:border-primary/50 transition-colors",
        className
      )}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon className="w-16 h-16 text-primary" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2 text-muted-foreground">
          <Icon className="w-5 h-5" />
          <span className="text-sm font-medium uppercase tracking-wider">{title}</span>
        </div>
        
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-bold font-display tracking-wide">{value}</h3>
          {trend && (
            <span className={cn(
              "text-sm font-medium px-2 py-0.5 rounded-full",
              trendUp ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
            )}>
              {trend}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
