import { Button } from '@/components/ui/button';
import { Activity, Table, List } from 'lucide-react';

export type ViewMode = 'timeline' | 'table' | 'compact';

interface ViewSwitcherProps {
    currentView: ViewMode;
    onViewChange: (view: ViewMode) => void;
}

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
    const views: { id: ViewMode; label: string; icon: any }[] = [
        { id: 'timeline', label: 'Timeline', icon: Activity },
        { id: 'table', label: 'Table', icon: Table },
        { id: 'compact', label: 'Compact', icon: List },
    ];

    return (
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            {views.map((view) => {
                const Icon = view.icon;
                return (
                    <Button
                        key={view.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewChange(view.id)}
                        className={`gap-2 transition-all ${
                            currentView === view.id
                                ? 'bg-background shadow-sm text-foreground border border-border'
                                : 'hover:bg-background/50 text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{view.label}</span>
                    </Button>
                );
            })}
        </div>
    );
}