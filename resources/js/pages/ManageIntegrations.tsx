import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, Link } from '@inertiajs/react';
import {
    Plus,
    MoreHorizontal,
    Check,
    Trash2,
    ArrowLeft,
    GitBranch,
    Github,
    Shield,
    Box,
    Server,
    Webhook,
    Unplug,
    Plug
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface Integration {
    id: number;
    name: string;
    type: string;
    description?: string;
    icon?: string;
    category: string;
    connected: boolean;
    last_sync_at?: string;
}

interface AvailableIntegration {
    type: string;
    name: string;
    description: string;
    icon: string;
    category: string;
}

interface Ecosystem {
    id: number;
    name: string;
    description?: string;
    integrations: Integration[];
}

interface Props {
    ecosystem: Ecosystem;
    availableIntegrations: AvailableIntegration[];
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
    {
        title: 'Integrations',
        href: `/ecosystems/${ecosystem.id}/integrations`,
    },
];

export default function ManageIntegrations({ ecosystem, availableIntegrations }: Props) {
    const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
    const [selectedIntegration, setSelectedIntegration] = useState<AvailableIntegration | null>(null);

    const { post, put, delete: destroy, processing } = useForm();

    const handleConnect = (integration: AvailableIntegration) => {
        post(`/ecosystems/${ecosystem.id}/integrations`, {
            type: integration.type,
            name: integration.name,
            description: integration.description,
            icon: integration.icon,
            category: integration.category,
        }, {
            onSuccess: () => {
                setIsConnectModalOpen(false);
                setSelectedIntegration(null);
            },
        });
    };

    const handleToggleConnection = (integration: Integration) => {
        put(`/integrations/${integration.id}`, {
            connected: !integration.connected,
        });
    };

    const handleDelete = (integration: Integration) => {
        if (window.confirm(`Are you sure you want to remove "${integration.name}"?`)) {
            destroy(`/integrations/${integration.id}`);
        }
    };

    const openConnectModal = (integration: AvailableIntegration) => {
        setSelectedIntegration(integration);
        setIsConnectModalOpen(true);
    };

    const getIconComponent = (iconName?: string) => {
        switch (iconName) {
            case 'git-branch':
                return <GitBranch className="h-6 w-6" />;
            case 'github':
                return <Github className="h-6 w-6" />;
            case 'shield':
                return <Shield className="h-6 w-6" />;
            case 'box':
                return <Box className="h-6 w-6" />;
            case 'server':
                return <Server className="h-6 w-6" />;
            case 'webhook':
                return <Webhook className="h-6 w-6" />;
            default:
                return <Server className="h-6 w-6" />;
        }
    };

    const getConnectedIntegrations = () => {
        return ecosystem.integrations.filter(i => i.connected);
    };

    const getAvailableToConnect = () => {
        const connectedTypes = ecosystem.integrations.map(i => i.type);
        return availableIntegrations.filter(i => !connectedTypes.includes(i.type));
    };

    const groupIntegrationsByCategory = (integrations: Integration[]) => {
        return integrations.reduce((acc, integration) => {
            if (!acc[integration.category]) {
                acc[integration.category] = [];
            }
            acc[integration.category].push(integration);
            return acc;
        }, {} as Record<string, Integration[]>);
    };

    const connectedIntegrations = getConnectedIntegrations();
    const availableToConnect = getAvailableToConnect();
    const groupedConnected = groupIntegrationsByCategory(connectedIntegrations);

    return (
        <AppLayout breadcrumbs={breadcrumbs(ecosystem)}>
            <Head title={`Integrations - ${ecosystem.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/ecosystems/${ecosystem.id}`}>
                            <Button variant="outline" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Ecosystem
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
                            <p className="text-muted-foreground">
                                Connect your tools to automatically track activities
                            </p>
                        </div>
                    </div>
                    {availableToConnect.length > 0 && (
                        <Button onClick={() => setIsConnectModalOpen(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Integration
                        </Button>
                    )}
                </div>

                {connectedIntegrations.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="text-center">
                            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                <Plug className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold">No integrations yet</h3>
                            <p className="mb-4 text-muted-foreground max-w-sm">
                                Connect your development tools to automatically track system changes and activities.
                            </p>
                            <Button onClick={() => setIsConnectModalOpen(true)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Connect Your First Integration
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedConnected).map(([category, integrations]) => (
                            <div key={category} className="space-y-4">
                                <h2 className="text-xl font-semibold text-foreground border-b border-border/50 pb-2">
                                    {category}
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {integrations.map((integration) => (
                                        <Card key={integration.id} className="glass-effect border-border/50 hover:border-primary/30 transition-all duration-300">
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-primary/20 border border-primary/30 text-primary">
                                                            {getIconComponent(integration.icon)}
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-base">{integration.name}</CardTitle>
                                                            <CardDescription className="text-sm">
                                                                {integration.description}
                                                            </CardDescription>
                                                        </div>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => handleToggleConnection(integration)}
                                                            >
                                                                {integration.connected ? (
                                                                    <>
                                                                        <Unplug className="mr-2 h-4 w-4" />
                                                                        Disconnect
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Plug className="mr-2 h-4 w-4" />
                                                                        Connect
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(integration)}
                                                                className="text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Remove
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center justify-between">
                                                    <Badge
                                                        className={
                                                            integration.connected
                                                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                                                : "bg-muted text-muted-foreground"
                                                        }
                                                    >
                                                        {integration.connected ? (
                                                            <>
                                                                <Check className="h-3 w-3 mr-1" />
                                                                Connected
                                                            </>
                                                        ) : (
                                                            "Disconnected"
                                                        )}
                                                    </Badge>
                                                    {integration.connected && integration.last_sync_at && (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                            <span>Active</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Integration Modal */}
                <Dialog open={isConnectModalOpen} onOpenChange={setIsConnectModalOpen}>
                    <DialogContent className="min-w-[60vw] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">
                                Add Integration
                            </DialogTitle>
                            <DialogDescription>
                                Connect your tools to automatically track activities and changes
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-8 mt-6">
                            {availableIntegrations
                                .reduce((acc, integration) => {
                                    if (!acc.includes(integration.category)) {
                                        acc.push(integration.category);
                                    }
                                    return acc;
                                }, [] as string[])
                                .map((category) => (
                                    <div key={category} className="space-y-4">
                                        <h3 className="text-lg font-semibold text-foreground border-b border-border/50 pb-2">
                                            {category}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {availableToConnect
                                                .filter((integration) => integration.category === category)
                                                .map((integration) => (
                                                    <div
                                                        key={integration.type}
                                                        className="glass-effect rounded-xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 group cursor-pointer"
                                                        onClick={() => handleConnect(integration)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-lg bg-primary/20 border border-primary/30 text-primary">
                                                                    {getIconComponent(integration.icon)}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-semibold text-foreground">
                                                                        {integration.name}
                                                                    </h4>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {integration.description}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 hover:scale-105 transition-all duration-300"
                                                            >
                                                                <Plus className="h-3 w-3 mr-1" />
                                                                Connect
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                ))}
                        </div>

                        <DialogFooter className="mt-8 pt-6 border-t border-border/50">
                            <Button
                                variant="outline"
                                onClick={() => setIsConnectModalOpen(false)}
                                className="border-border/50 hover:border-primary/30"
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}