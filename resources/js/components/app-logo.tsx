import { Activity } from 'lucide-react';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-primary/20 border border-primary/30 premium-glow activity-pulse">
                <Activity className="size-6 text-primary activity-icon-glow" />
            </div>
            <div className="ml-3 grid flex-1 text-left">
                <span className="truncate text-lg font-bold text-foreground">
                    BackStory
                </span>
            </div>
        </>
    );
}
