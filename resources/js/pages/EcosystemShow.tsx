import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus, MoreHorizontal, Users, Calendar, User, Activity } from 'lucide-react';
import { CreateActivityModal } from '@/components/modals/create-activity-modal';
import { ActivityTimeline } from '@/components/views/activity-timeline';
import { ActivityCompact } from '@/components/views/activity-compact';
import { ViewSwitcher, ViewMode } from '@/components/ui/view-switcher';
import { ActivityFilters } from '@/components/activity-filters';
import { useState, useEffect } from 'react';

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

interface EcosystemUser {
    id: number;
    name: string;
    email: string;
    pivot: {
        role: 'owner' | 'member';
    };
}

interface Ecosystem {
    id: number;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
    activities: Activity[];
    activity_types: ActivityType[];
    users: EcosystemUser[];
}

interface Props {
    ecosystem: Ecosystem;
}

const breadcrumbs = (ecosystem: Ecosystem): BreadcrumbItem[] => [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: ecosystem.name,
        href: `/ecosystems/${ecosystem.id}`,
    },
];

export default function EcosystemShow({ ecosystem }: Props) {
    const [isCreateActivityModalOpen, setIsCreateActivityModalOpen] = useState(false);
    const [currentView, setCurrentView] = useState<ViewMode>('timeline');
    const [selectedTypes, setSelectedTypes] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredActivities, setFilteredActivities] = useState(ecosystem.activities);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Filter activities based on selected types and search query
    useEffect(() => {
        let filtered = ecosystem.activities;

        if (selectedTypes.length > 0) {
            filtered = filtered.filter((activity) =>
                selectedTypes.includes(activity.activity_type.id)
            );
        }

        if (searchQuery) {
            filtered = filtered.filter(
                (activity) =>
                    activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (activity.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    activity.user_name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredActivities(filtered);
    }, [ecosystem.activities, selectedTypes, searchQuery]);

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
        <AppLayout breadcrumbs={breadcrumbs(ecosystem)}>
            <Head title={ecosystem.name} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold tracking-tight">{ecosystem.name}</h1>
                        {ecosystem.description && (
                            <p className="text-muted-foreground mt-2">{ecosystem.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{ecosystem.users.length} members</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Created {formatDate(ecosystem.created_at)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ViewSwitcher
                            currentView={currentView}
                            onViewChange={setCurrentView}
                        />
                        <Button onClick={() => {
                            if (currentView !== 'timeline') {
                                // In non-timeline views, open the modal
                                setIsCreateActivityModalOpen(true);
                            } else {
                                // In timeline view, activate the inline form
                                setIsCreateActivityModalOpen(true);
                            }
                        }} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Activity
                        </Button>
                    </div>
                </div>

                <ActivityFilters
                    activityTypes={ecosystem.activity_types}
                    selectedTypes={selectedTypes}
                    onTypesChange={setSelectedTypes}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    totalResults={filteredActivities.length}
                />

                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Activities</h2>
                            <p className="text-muted-foreground">
                                Track all system changes and updates in your ecosystem
                            </p>
                        </div>
                    </div>

                    {currentView === 'timeline' && (
                        <ActivityTimeline
                            activities={filteredActivities}
                            ecosystem={ecosystem}
                            isAddingActivity={isCreateActivityModalOpen}
                            onCancelAdd={() => setIsCreateActivityModalOpen(false)}
                        />
                    )}

                    {currentView === 'compact' && (
                        <ActivityCompact activities={filteredActivities} />
                    )}

                    {currentView === 'table' && (
                        <Card>
                            <CardContent className="p-6">
                                {filteredActivities.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary/20 border border-primary/30 premium-glow activity-pulse flex items-center justify-center">
                                            <Activity className="h-6 w-6 text-primary activity-icon-glow" />
                                        </div>
                                        <h3 className="mb-2 text-lg font-semibold">No activities yet</h3>
                                        <p className="mb-4 text-muted-foreground max-w-sm">
                                            Start tracking your ecosystem changes by adding your first activity.
                                        </p>
                                        <Button onClick={() => {
                                            if (currentView !== 'timeline') {
                                                setIsCreateActivityModalOpen(true);
                                            } else {
                                                setIsCreateActivityModalOpen(true);
                                            }
                                        }} className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Add First Activity
                                        </Button>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Activity</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>User</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredActivities.map((activity) => (
                                                <TableRow key={activity.id}>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{activity.title}</div>
                                                            {activity.description && (
                                                                <div className="text-sm text-muted-foreground line-clamp-2">
                                                                    {activity.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="secondary"
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
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-medium">{activity.user_name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {formatDate(activity.created_at)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                                                <DropdownMenuItem className="text-destructive">
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {currentView !== 'timeline' && (
                    <CreateActivityModal
                        isOpen={isCreateActivityModalOpen}
                        onClose={() => setIsCreateActivityModalOpen(false)}
                        ecosystem={ecosystem}
                    />
                )}
            </div>
        </AppLayout>
    );
}