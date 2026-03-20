import { DashboardLayout } from "@/components/DashboardLayout";
import { PageTransition } from "@/components/PageTransition";

export default function Settings() {
    return (
        <PageTransition>
            <DashboardLayout title="Settings">
                <div className="text-content-secondary max-w-xl">
                    <h2 className="font-display text-2xl font-bold text-content-primary mb-4">Account Settings</h2>
                    <p>Settings panel implementation is reserved for future scalability. Standard integration of billing, API tokens, and account limits would live here.</p>
                </div>
            </DashboardLayout>
        </PageTransition>
    );
}
