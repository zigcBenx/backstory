import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Calendar } from 'lucide-react';
import { ActivityDetailModal } from '@/components/modals/activity-detail-modal';

interface ActivityType {
    id: number;
    name: string;
    color: string;
    icon?: string;
}

interface Activity {
    id: number;
    title: string;
    description?: string;
    user_name: string;
    metadata?: any;
    created_at: string;
    updated_at: string;
    activity_type: ActivityType;
}

interface ActivityCompactProps {
    activities: Activity[];
}

export function ActivityCompact({ activities }: ActivityCompactProps) {
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const handleActivityClick = (activity: Activity) => {
        setSelectedActivity(activity);
        setIsDetailModalOpen(true);
    };

    const getIconComponent = (iconName?: string) => {
        switch (iconName) {
            case 'server':
                return '🖥️';
            case 'rocket':
                return '🚀';
            case 'shield':
                return '🛡️';
            case 'database':
                return '🗄️';
            default:
                return '📋';
        }
    };

    if (activities.length === 0) {
        return (
            <div className="glass-effect rounded-xl p-12 text-center gradient-border">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center premium-glow">
                    <Calendar className="h-10 w-10 text-primary activity-icon-glow" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">No activities found</h3>
                <p className="text-muted-foreground text-pretty">
                    Try adjusting your filters or add a new activity to get started.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="grid gap-3">
                {activities.map((activity) => (
                    <Card
                        key={activity.id}
                        className="p-4 glass-effect hover:premium-glow transition-all duration-300 cursor-pointer group"
                        onClick={() => handleActivityClick(activity)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Badge
                                    variant="outline"
                                    className="font-normal flex-shrink-0"
                                    style={{
                                        backgroundColor: `${activity.activity_type.color}20`,
                                        color: activity.activity_type.color,
                                        borderColor: `${activity.activity_type.color}40`,
                                    }}
                                >
                                    <span className="mr-1">
                                        {getIconComponent(activity.activity_type.icon)}
                                    </span>
                                    {activity.activity_type.name}
                                </Badge>

                                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                    {activity.title}
                                </h3>

                                {activity.description && (
                                    <p className="text-sm text-muted-foreground truncate flex-1">
                                        {activity.description}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
                                <div className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    <span className="font-medium">{activity.user_name}</span>
                                </div>
                                <div className="w-px h-4 bg-border/50" />
                                <span>
                                    {formatDistanceToNow(new Date(activity.created_at), {
                                        addSuffix: true,
                                    })}
                                </span>
                            </div>
                        </div>

                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {Object.entries(activity.metadata).slice(0, 3).map(([key, value]) => (
                                    <Badge
                                        key={key}
                                        variant="secondary"
                                        className="text-xs bg-muted/20 text-muted-foreground border-border/30"
                                    >
                                        {key}: {String(value)}
                                    </Badge>
                                ))}
                                {Object.keys(activity.metadata).length > 3 && (
                                    <Badge
                                        variant="secondary"
                                        className="text-xs bg-muted/20 text-muted-foreground border-border/30"
                                    >
                                        +{Object.keys(activity.metadata).length - 3} more
                                    </Badge>
                                )}
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            <ActivityDetailModal
                activity={selectedActivity}
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedActivity(null);
                }}
            />
        </>
    );
}