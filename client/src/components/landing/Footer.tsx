export function Footer() {
    return (
        <footer className="py-12 border-t border-borderBase bg-space-900 relative z-10 px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">

                <div className="flex flex-col items-center md:items-start gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-space-800 border border-brand-teal/30 flex items-center justify-center">
                            <span className="font-display font-bold text-brand-teal text-[10px]">CC</span>
                        </div>
                        <span className="font-display font-bold text-content-primary">Content Catalyst</span>
                    </div>
                    <p className="text-content-tertiary text-xs">
                        Creative intelligence for the modern creator.
                    </p>
                </div>

                <nav className="flex items-center gap-6 text-sm text-content-secondary">
                    <a href="#" className="hover:text-brand-teal transition-colors">Features</a>
                    <a href="#" className="hover:text-brand-teal transition-colors">Pricing</a>
                    <a href="#" className="hover:text-brand-teal transition-colors">Blog</a>
                    <a href="#" className="hover:text-brand-teal transition-colors">Docs</a>
                </nav>

                <p className="text-content-tertiary text-xs">
                    Built with TypeScript, Kafka, and love.
                </p>
            </div>
        </footer>
    );
}
