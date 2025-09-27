import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow, format } from 'date-fns';
import {
    Server,
    Shield,
    Database,
    AlertTriangle,
    Settings,
    Wrench,
    Zap,
    GitBranch,
    User,
    Clock,
    MapPin,
    FileText,
    Eye,
} from 'lucide-react';
import { useState } from 'react';

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

interface ActivityDetailModalProps {
    activity: Activity | null;
    isOpen: boolean;
    onClose: () => void;
}

const getActivityIcon = (iconName?: string) => {
    const iconMap = {
        server: Server,
        shield: Shield,
        rocket: GitBranch,
        database: Database,
        gear: Settings,
        user: User,
        file: FileText,
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

// Get actual diff data from activity metadata
const getActualDiff = (activity: Activity) => {
    if (!activity.metadata?.before_content || !activity.metadata?.after_content) {
        return null;
    }

    try {
        // Decode base64 content
        const beforeContent = atob(activity.metadata.before_content);
        const afterContent = atob(activity.metadata.after_content);

        return {
            before: beforeContent,
            after: afterContent,
        };
    } catch (error) {
        console.error('Failed to decode diff content:', error);
        return null;
    }
};

export function ActivityDetailModal({ activity, isOpen, onClose }: ActivityDetailModalProps) {
    const [showDiff, setShowDiff] = useState(false);

    if (!activity) return null;

    const Icon = getActivityIcon(activity.activity_type.icon);
    const colorClass = getActivityColor(activity.activity_type.color);
    const diff = getActualDiff(activity);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="min-w-[70vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-4">
                    <DialogTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 rounded-lg bg-card border border-border/50 backdrop-blur-sm">
                            <Icon className={`h-6 w-6 ${colorClass}`} />
                        </div>
                        {activity.title}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Activity Overview */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4 glass-effect">
                            <div className="flex items-center gap-3 mb-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Who</span>
                            </div>
                            <p className="font-semibold text-foreground">{activity.user_name}</p>
                        </Card>

                        <Card className="p-4 glass-effect">
                            <div className="flex items-center gap-3 mb-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">When</span>
                            </div>
                            <p className="font-semibold text-foreground">
                                {format(new Date(activity.created_at), 'PPpp')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                            </p>
                        </Card>

                        <Card className="p-4 glass-effect">
                            <div className="flex items-center gap-3 mb-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">What</span>
                            </div>
                            <Badge
                                variant="outline"
                                className={`${colorClass} border-current/30 bg-current/10`}
                                style={{
                                    backgroundColor: `${activity.activity_type.color}20`,
                                    color: activity.activity_type.color,
                                    borderColor: `${activity.activity_type.color}40`,
                                }}
                            >
                                {activity.activity_type.name}
                            </Badge>
                        </Card>

                        <Card className="p-4 glass-effect">
                            <div className="flex items-center gap-3 mb-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Where</span>
                            </div>
                            <p className="font-semibold text-foreground">
                                {activity.metadata?.environment || 'Production'}
                            </p>
                        </Card>
                    </div>

                    {/* Description */}
                    {activity.description && (
                        <Card className="p-4 glass-effect">
                            <h3 className="font-semibold mb-3 text-foreground">Description</h3>
                            <p className="text-muted-foreground leading-relaxed">{activity.description}</p>
                        </Card>
                    )}

                    {/* Diff View for Configuration Events */}
                    {diff && (
                        <Card className="p-4 glass-effect">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-foreground">Configuration Changes</h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowDiff(!showDiff)}
                                    className="glass-effect border-border/50"
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    {showDiff ? 'Hide' : 'View'} Diff
                                </Button>
                            </div>

                            {showDiff && (
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-red-400 mb-2">Before</h4>
                                        <pre className="text-xs bg-red-500/10 border border-red-500/20 rounded-lg p-3 overflow-x-auto">
                                            <code className="text-red-300">{diff.before}</code>
                                        </pre>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-green-400 mb-2">After</h4>
                                        <pre className="text-xs bg-green-500/10 border border-green-500/20 rounded-lg p-3 overflow-x-auto">
                                            <code className="text-green-300">{diff.after}</code>
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Metadata */}
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <Card className="p-4 glass-effect">
                            <h3 className="font-semibold mb-3 text-foreground">Additional Details</h3>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(activity.metadata)
                                    .filter(([key]) =>
                                        // Filter out content fields that are shown in diff view
                                        !['before_content', 'after_content', 'file_content'].includes(key)
                                    )
                                    .map(([key, value]) => (
                                        <Badge
                                            key={key}
                                            variant="secondary"
                                            className="text-xs bg-muted/20 text-muted-foreground border-border/30"
                                        >
                                            {key}: {String(value)}
                                        </Badge>
                                    ))}
                            </div>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}