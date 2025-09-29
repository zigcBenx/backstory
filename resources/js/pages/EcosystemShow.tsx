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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus, MoreHorizontal, Users, Calendar, User, Activity, Sparkles, Send, Clock, AlertTriangle } from 'lucide-react';
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
    const [showAIAssistant, setShowAIAssistant] = useState(false);
    const [incidentData, setIncidentData] = useState({
        type: '',
        description: '',
        timeframe: '1h',
        severity: 'medium'
    });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [currentHelpText, setCurrentHelpText] = useState(0);

    const helpTexts = [
        "Something broke? →",
        "Slow as hell? →",
        "Users complaining? →",
        "Deploy gone wrong? →",
        "Error 500 again? →",
        "App crashed? →",
        "Performance issues? →",
        "Need help debugging? →",
        "System acting up? →",
        "Things not working? →"
    ];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Cycle through help texts every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentHelpText(prev => (prev + 1) % helpTexts.length);
        }, 10000);

        return () => clearInterval(interval);
    }, [helpTexts.length]);

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

    // Analyze incident with AI
    const analyzeIncident = async () => {
        setIsAnalyzing(true);
        setAnalysisResult(null);

        try {
            // Get CSRF token from meta tag
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            if (!csrfToken) {
                throw new Error('CSRF token not found. Please refresh the page.');
            }

            const response = await fetch(`/ecosystems/${ecosystem.id}/ai-analysis/incident`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                },
                credentials: 'same-origin',
                body: JSON.stringify(incidentData),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setAnalysisResult(data.analysis);
            } else if (response.status === 419) {
                setAnalysisResult('Error: Session expired. Please refresh the page and try again.');
            } else {
                setAnalysisResult(`Error: ${data.error || data.message || 'Analysis failed'}`);
            }
        } catch (error) {
            console.error('AI Analysis error:', error);
            setAnalysisResult('Error: Failed to connect to AI service. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
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
                        {currentView === 'timeline' && (
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <span
                                        key={currentHelpText}
                                        className="text-sm text-muted-foreground font-medium animate-fade-in"
                                        style={{
                                            animation: 'fadeIn 0.5s ease-in-out'
                                        }}
                                    >
                                        {helpTexts[currentHelpText]}
                                    </span>
                                </div>
                                <Button
                                    onClick={() => setShowAIAssistant(true)}
                                    variant="outline"
                                    className="relative group bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-300/30 hover:border-purple-400/50 hover:from-purple-500/20 hover:to-blue-500/20 transition-all duration-300"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <Sparkles className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400 group-hover:animate-pulse" />
                                    <span className="text-purple-700 dark:text-purple-300 font-medium">AI Assistant</span>
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                                </Button>
                            </div>
                        )}
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

                {/* AI Assistant Modal */}
                <Dialog open={showAIAssistant} onOpenChange={setShowAIAssistant}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                                    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                AI Incident Analyzer
                            </DialogTitle>
                            <DialogDescription>
                                Describe your incident and I'll analyze your ecosystem's recent activity to provide insights and recommendations.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Quick Incident Form */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="incident-type">Incident Type</Label>
                                    <Select
                                        value={incidentData.type}
                                        onValueChange={(value) => setIncidentData(prev => ({ ...prev, type: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select incident type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="production-error">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                                    Production Error
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="performance-issue">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-yellow-500" />
                                                    Performance Issue
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="deployment-issue">
                                                <div className="flex items-center gap-2">
                                                    <Activity className="h-4 w-4 text-orange-500" />
                                                    Deployment Issue
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="service-outage">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-red-600" />
                                                    Service Outage
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="timeframe">Analysis Timeframe</Label>
                                    <Select
                                        value={incidentData.timeframe}
                                        onValueChange={(value) => setIncidentData(prev => ({ ...prev, timeframe: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1h">Last 1 hour</SelectItem>
                                            <SelectItem value="6h">Last 6 hours</SelectItem>
                                            <SelectItem value="24h">Last 24 hours</SelectItem>
                                            <SelectItem value="7d">Last 7 days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="severity">Severity Level</Label>
                                <Select
                                    value={incidentData.severity}
                                    onValueChange={(value) => setIncidentData(prev => ({ ...prev, severity: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                Low - Minor impact
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="medium">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                                                Medium - Moderate impact
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="high">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                                High - Significant impact
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="critical">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-red-700 rounded-full animate-pulse" />
                                                Critical - System down
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Describe the Issue</Label>
                                <Textarea
                                    id="description"
                                    placeholder="What's happening? Include error messages, symptoms, affected users, or any other relevant details..."
                                    value={incidentData.description}
                                    onChange={(e) => setIncidentData(prev => ({ ...prev, description: e.target.value }))}
                                    className="min-h-[120px] resize-none"
                                />
                            </div>

                            {/* AI Analysis Result */}
                            {isAnalyzing && (
                                <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
                                        <span className="font-medium">Analyzing ecosystem activity...</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                            Reviewing recent deployments and changes
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                                            Correlating activity patterns with incident timing
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                            Generating recommendations
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* AI Analysis Result */}
                            {analysisResult && (
                                <div className="mt-6 p-4 border rounded-lg bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Sparkles className="h-5 w-5 text-purple-600" />
                                        <span className="font-medium">AI Analysis Results</span>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono bg-muted/30 p-3 rounded border">
                                                {analysisResult}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowAIAssistant(false);
                                    setIncidentData({ type: '', description: '', timeframe: '1h', severity: 'medium' });
                                    setIsAnalyzing(false);
                                    setAnalysisResult(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={analyzeIncident}
                                disabled={!incidentData.description || !incidentData.type || isAnalyzing}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Analyze Incident
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}