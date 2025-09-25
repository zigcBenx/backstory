import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Server,
    Shield,
    Database,
    Settings,
    Plus,
    Check,
    X,
    GitBranch,
    User,
} from 'lucide-react';
import { ActivityDetailModal } from '@/components/modals/activity-detail-modal';
import { useForm } from '@inertiajs/react';

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

interface Ecosystem {
    id: number;
    name: string;
    activity_types: ActivityType[];
}

interface ActivityTimelineProps {
    activities: Activity[];
    ecosystem: Ecosystem;
    isAddingActivity?: boolean;
    onCancelAdd?: () => void;
}

const getActivityIcon = (iconName?: string) => {
    const iconMap = {
        server: Server,
        shield: Shield,
        rocket: GitBranch,
        database: Database,
        gear: Settings,
        user: User,
        file: Settings,
        code: Settings,
    };
    return iconMap[iconName as keyof typeof iconMap] || Settings;
};

const getActivityColor = (color: string) => {
    // Convert hex color to Tailwind text color
    const colorMap: Record<string, string> = {
        '#3b82f6': 'text-blue-400',
        '#10b981': 'text-green-400',
        '#f59e0b': 'text-yellow-400',
        '#ef4444': 'text-red-400',
        '#8b5cf6': 'text-purple-400',
        '#06b6d4': 'text-cyan-400',
        '#84cc16': 'text-lime-400',
        '#f97316': 'text-orange-400',
    };
    return colorMap[color] || 'text-gray-400';
};

function AddActivityForm({
    ecosystem,
    onCancel,
}: {
    ecosystem: Ecosystem;
    onCancel: () => void;
}) {
    const { data, setData, post, processing, reset } = useForm({
        activity_type_id: '',
        title: '',
        description: '',
        user_name: '',
        metadata: {},
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(`/ecosystems/${ecosystem.id}/activities`, {
            onSuccess: () => {
                reset();
                onCancel();
            },
        });
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

    return (
        <div className="relative">
            <div className="absolute left-6 top-0 w-0.5 h-full timeline-line" />

            <div className="flex items-start gap-6">
                <div className="relative z-10 p-3 rounded-xl bg-primary/20 border border-primary/30 premium-glow activity-pulse">
                    <Plus className="h-6 w-6 text-primary activity-icon-glow" />
                </div>

                <Card className="flex-1 glass-effect gradient-border">
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                            <h3 className="font-semibold text-lg text-primary">Add New Activity</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                value={data.activity_type_id}
                                onValueChange={(value) => setData('activity_type_id', value)}
                            >
                                <SelectTrigger className="glass-effect border-border/50">
                                    <SelectValue placeholder="Select activity type" />
                                </SelectTrigger>
                                <SelectContent className="glass-effect border-border/50">
                                    {ecosystem.activity_types.map((type) => (
                                        <SelectItem key={type.id} value={type.id.toString()}>
                                            <div className="flex items-center gap-2">
                                                <span>{getIconComponent(type.icon)}</span>
                                                <span>{type.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Input
                                placeholder="Your name"
                                value={data.user_name}
                                onChange={(e) => setData('user_name', e.target.value)}
                                className="glass-effect border-border/50"
                            />
                        </div>

                        <Input
                            placeholder="Activity title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            className="glass-effect border-border/50"
                        />

                        <Textarea
                            placeholder="Describe what happened..."
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className="glass-effect border-border/50 min-h-[80px]"
                        />

                        <div className="flex items-center gap-3 pt-2">
                            <Button type="submit" className="bg-primary hover:bg-primary/90 premium-glow" disabled={processing}>
                                <Check className="h-4 w-4 mr-2" />
                                {processing ? 'Adding...' : 'Add Activity'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                className="glass-effect border-border/50 bg-transparent"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}

export function ActivityTimeline({
    activities,
    ecosystem,
    isAddingActivity,
    onCancelAdd,
}: ActivityTimelineProps) {
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

    if (activities.length === 0 && !isAddingActivity) {
        return (
            <div className="glass-effect rounded-xl p-12 text-center gradient-border">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center premium-glow">
                    <Settings className="h-10 w-10 text-primary activity-icon-glow" />
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
            <div className="relative">
                {(activities.length > 0 || isAddingActivity) && (
                    <div className="absolute left-6 top-0 w-0.5 timeline-line" style={{ height: '100%' }} />
                )}

                <div className="space-y-8">
                    {isAddingActivity && onCancelAdd && (
                        <AddActivityForm ecosystem={ecosystem} onCancel={onCancelAdd} />
                    )}

                    {activities.map((activity, index) => {
                        const Icon = getActivityIcon(activity.activity_type.icon);
                        const colorClass = getActivityColor(activity.activity_type.color);

                        return (
                            <div key={activity.id} className="relative">
                                <div className="flex items-start gap-6">
                                    <div
                                        className={`relative z-10 p-3 rounded-xl bg-card border border-border/50 backdrop-blur-sm ${
                                            index === 0 ? 'premium-glow activity-pulse' : 'hover:premium-glow'
                                        } transition-all duration-300`}
                                    >
                                        <Icon
                                            className={`h-6 w-6 ${colorClass} ${
                                                index === 0 ? 'activity-icon-glow' : ''
                                            }`}
                                        />
                                        {activity.activity_type.name.toLowerCase().includes('deploy') && (
                                            <div
                                                className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-background animate-pulse"
                                                title="Auto-detected via CI/CD"
                                            />
                                        )}
                                    </div>

                                    <Card
                                        className="flex-1 glass-effect gradient-border hover:premium-glow transition-all duration-300 group cursor-pointer"
                                        onClick={() => handleActivityClick(activity)}
                                    >
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                                                        {activity.title}
                                                    </h3>
                                                    <Badge
                                                        variant="outline"
                                                        className="font-normal"
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
                                                    {activity.activity_type.name.toLowerCase().includes('deploy') && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-orange-400 border-orange-400/30 bg-orange-400/10 text-xs"
                                                        >
                                                            CI/CD
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="font-medium">{activity.user_name}</span>
                                                    <div className="w-px h-4 bg-border/50" />
                                                    <span>
                                                        {formatDistanceToNow(new Date(activity.created_at), {
                                                            addSuffix: true,
                                                        })}
                                                    </span>
                                                </div>
                                            </div>

                                            {activity.description && (
                                                <p className="text-muted-foreground mb-4 text-pretty leading-relaxed">
                                                    {activity.description}
                                                </p>
                                            )}

                                            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(activity.metadata).map(([key, value]) => (
                                                        <Badge
                                                            key={key}
                                                            variant="secondary"
                                                            className="text-xs bg-muted/20 text-muted-foreground border-border/30"
                                                        >
                                                            {key}: {String(value)}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        );
                    })}
                </div>
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