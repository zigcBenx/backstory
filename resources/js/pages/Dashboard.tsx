import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Plus, Users, Activity, Clock } from 'lucide-react';
import { CreateEcosystemModal } from '@/components/modals/create-ecosystem-modal';
import { useState, useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface Ecosystem {
    id: number;
    name: string;
    description?: string;
    users_count?: number;
    activities_count?: number;
    latest_activity?: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    ecosystems: Ecosystem[];
}

export default function Dashboard({ ecosystems }: Props) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('create') === 'true') {
            setIsCreateModalOpen(true);
            // Clean up URL
            window.history.replaceState({}, document.title, '/dashboard');
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">BackStory</h1>
                        <p className="text-muted-foreground">
                            Track and manage changes across your ecosystems
                        </p>
                    </div>
                    <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Ecosystem
                    </Button>
                </div>

                {ecosystems.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="text-center">
                            <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary/20 border border-primary/30 premium-glow activity-pulse flex items-center justify-center">
                                <Activity className="h-6 w-6 text-primary activity-icon-glow" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold">No ecosystems yet</h3>
                            <p className="mb-4 text-muted-foreground max-w-sm">
                                Get started by creating your first ecosystem to track system changes and activities.
                            </p>
                            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create Your First Ecosystem
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {ecosystems.map((ecosystem) => (
                            <Link key={ecosystem.id} href={`/ecosystems/${ecosystem.id}`}>
                                <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            <span className="truncate">{ecosystem.name}</span>
                                        </CardTitle>
                                        {ecosystem.description && (
                                            <CardDescription className="line-clamp-2">
                                                {ecosystem.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                <span>{ecosystem.users_count || 0} members</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Activity className="h-4 w-4" />
                                                <span>{ecosystem.activities_count || 0} activities</span>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            <span>
                                                Created {new Date(ecosystem.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}

                <CreateEcosystemModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                />
            </div>
        </AppLayout>
    );
}
