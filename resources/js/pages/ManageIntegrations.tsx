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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, Link, router, usePage } from '@inertiajs/react';
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
    Plug,
    Download,
    Copy,
    Terminal
} from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';

interface Integration {
    id: number;
    name: string;
    type: string;
    description?: string;
    icon?: string;
    category: string;
    connected: boolean;
    last_sync_at?: string;
    activity_status: 'active' | 'inactive' | 'connected' | 'disconnected';
}

interface AvailableIntegration {
    type: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    isActive?: boolean;
    configurable?: boolean;
    availableTypes?: Record<string, any>;
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
    flash?: {
        success?: string;
        new_integration_id?: number;
        show_install_command?: boolean;
    };
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

export default function ManageIntegrations({ ecosystem, availableIntegrations, flash }: Props) {
    const { props } = usePage<any>();
    const flashData = props.flash || flash;

    const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
    const [selectedIntegration, setSelectedIntegration] = useState<AvailableIntegration | null>(null);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [selectedMonitoringTypes, setSelectedMonitoringTypes] = useState<string[]>([]);
    const [customPaths, setCustomPaths] = useState<Record<string, string>>({});
    const [showInstallCommand, setShowInstallCommand] = useState<number | null>(null);
    const [installCommand, setInstallCommand] = useState<string>('');

    const { post, put, delete: destroy, processing } = useForm();
    const { post: postForm } = useForm();

    // Auto-show install command if integration was just created
    useEffect(() => {
        // Try both sources of flash data
        const flash = props.flash || flashData;

        if (flash?.show_install_command && flash?.new_integration_id) {
            const newIntegration = ecosystem.integrations.find(i => i.id === flash.new_integration_id);

            if (newIntegration && newIntegration.type === 'server-monitor') {
                // Small delay to ensure the page is fully loaded
                setTimeout(() => {
                    handleShowInstallCommand(newIntegration);
                }, 300);
            }
        }
    }, [flashData, ecosystem.integrations, props]);

    const handleConnect = (integration: AvailableIntegration) => {
        if (integration.configurable && integration.type === 'server-monitor') {
            setSelectedIntegration(integration);
            setIsConnectModalOpen(false);
            setIsConfigModalOpen(true);
        } else {
            router.post(`/ecosystems/${ecosystem.id}/integrations`, {
                type: integration.type,
                name: integration.name,
                description: integration.description,
                icon: integration.icon,
                category: integration.category,
            }, {
                onSuccess: () => {
                    setIsConnectModalOpen(false);
                    setSelectedIntegration(null);
                    router.reload();
                },
            });
        }
    };

    const handleConfigureServerMonitor = () => {
        if (!selectedIntegration) {
            return;
        }

        if (selectedMonitoringTypes.length === 0) {
            return;
        }

        const configData = {
            monitoring: selectedMonitoringTypes,
            custom_paths: Object.entries(customPaths).reduce((acc, [key, value]) => {
                if (value && value.trim()) {
                    acc[key] = value.split(',').map(path => path.trim()).filter(Boolean);
                }
                return acc;
            }, {} as Record<string, string[]>),
        };

        const submitData = {
            type: selectedIntegration.type,
            name: selectedIntegration.name,
            description: selectedIntegration.description,
            icon: selectedIntegration.icon,
            category: selectedIntegration.category,
            config: configData,
        };

        try {
            router.post(`/ecosystems/${ecosystem.id}/integrations`, submitData, {
                onSuccess: (data: any) => {
                    setIsConfigModalOpen(false);
                    setSelectedIntegration(null);
                    setSelectedMonitoringTypes([]);
                    setCustomPaths({});
                    // Page will reload and auto-show install command via useEffect
                    router.reload();
                },
                onError: (errors: any) => {
                    alert('Error creating integration: ' + JSON.stringify(errors));
                },
            });
        } catch (error) {
            console.error('Exception during post:', error);
        }
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

    const handleShowInstallCommand = async (integration: Integration) => {
        try {
            const response = await fetch(`/integrations/${integration.id}/install-command`);
            const data = await response.json();

            if (response.ok) {
                setInstallCommand(data.command);
                setShowInstallCommand(integration.id);
            } else {
                alert('Error fetching install command: ' + data.error);
            }
        } catch (error) {
            console.error('Error fetching install command:', error);
            alert('Failed to fetch install command');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Command copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy to clipboard');
        });
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
                                                            {integration.type === 'server-monitor' && integration.connected && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleShowInstallCommand(integration)}
                                                                >
                                                                    <Terminal className="mr-2 h-4 w-4" />
                                                                    Get Install Command
                                                                </DropdownMenuItem>
                                                            )}
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
                                                            integration.activity_status === 'active'
                                                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                                                : integration.activity_status === 'connected'
                                                                ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                                                : integration.activity_status === 'inactive'
                                                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                                                : "bg-muted text-muted-foreground"
                                                        }
                                                    >
                                                        {integration.activity_status === 'active' ? (
                                                            <>
                                                                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                                                                Active
                                                            </>
                                                        ) : integration.activity_status === 'connected' ? (
                                                            <>
                                                                <Check className="h-3 w-3 mr-1" />
                                                                Connected
                                                            </>
                                                        ) : integration.activity_status === 'inactive' ? (
                                                            <>
                                                                <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
                                                                Inactive
                                                            </>
                                                        ) : (
                                                            "Disconnected"
                                                        )}
                                                    </Badge>
                                                    {integration.activity_status === 'active' && integration.last_sync_at && (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <span>Last seen: {new Date(integration.last_sync_at).toLocaleTimeString()}</span>
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

                {/* Install Command Display */}
                {showInstallCommand && installCommand && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowInstallCommand(null)}>
                        <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                            {/* Header - Fixed */}
                            <div className="flex items-center justify-between p-6 pb-4 border-b border-border/50">
                                <h3 className="text-xl font-bold text-foreground">Install BackStory Monitor</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowInstallCommand(null)}
                                >
                                    ✕
                                </Button>
                            </div>

                            {/* Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-6 pt-4">
                                <p className="text-muted-foreground mb-4">
                                    Run this command on your Ubuntu server to install and start the BackStory monitor:
                                </p>

                                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm relative mb-4">
                                    <code>{installCommand}</code>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="absolute top-2 right-2 h-8"
                                        onClick={() => copyToClipboard(installCommand)}
                                    >
                                        <Copy className="h-4 w-4 mr-1" />
                                        Copy
                                    </Button>
                                </div>

                                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What this does:</h4>
                                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                                        <li>Downloads the monitoring script with your API key embedded</li>
                                        <li>Checks for required dependencies (inotify-tools)</li>
                                        <li>Starts monitoring your selected configuration files</li>
                                        <li>Reports changes to BackStory automatically</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Footer - Fixed */}
                            <div className="p-6 pt-4 border-t border-border/50">
                                <div className="flex justify-end">
                                    <Button onClick={() => setShowInstallCommand(null)}>
                                        Done
                                    </Button>
                                </div>
                            </div>
                        </div>
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
                                                        className={`glass-effect rounded-xl p-6 border border-border/50 transition-all duration-300 group ${
                                                            integration.isActive !== false
                                                                ? 'hover:border-primary/30 cursor-pointer'
                                                                : 'opacity-50 cursor-not-allowed'
                                                        }`}
                                                        onClick={() => integration.isActive !== false && handleConnect(integration)}
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
                                                                className={`border border-primary/30 transition-all duration-300 ${
                                                                    integration.isActive !== false
                                                                        ? 'bg-primary/20 hover:bg-primary/30 text-primary hover:scale-105'
                                                                        : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                                                                }`}
                                                                disabled={integration.isActive === false}
                                                            >
                                                                {integration.isActive !== false ? (
                                                                    <>
                                                                        <Plus className="h-3 w-3 mr-1" />
                                                                        {integration.configurable ? 'Configure' : 'Connect'}
                                                                    </>
                                                                ) : (
                                                                    'Coming Soon'
                                                                )}
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

                {/* Server Monitor Configuration Modal */}
                <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
                    <DialogContent className="min-w-[50vw] max-h-[90vh] flex flex-col p-0">
                        {/* Fixed Header */}
                        <div className="p-6 pb-4 border-b border-border/20">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">
                                    Configure Server Monitor
                                </DialogTitle>
                                <DialogDescription>
                                    Select which server configuration files you want to monitor for changes
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Monitoring Options</h3>
                                    <div className="space-y-4">
                                        {selectedIntegration?.availableTypes && Object.entries(selectedIntegration.availableTypes).map(([key, typeInfo]: [string, any]) => (
                                            <div key={key} className="border border-border/50 rounded-lg p-4 space-y-3">
                                                <div className="flex items-start space-x-3">
                                                    <Checkbox
                                                        id={key}
                                                        checked={selectedMonitoringTypes.includes(key)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setSelectedMonitoringTypes([...selectedMonitoringTypes, key]);
                                                            } else {
                                                                setSelectedMonitoringTypes(selectedMonitoringTypes.filter(t => t !== key));
                                                            }
                                                        }}
                                                    />
                                                    <div className="flex-1">
                                                        <Label htmlFor={key} className="text-base font-medium cursor-pointer">
                                                            {typeInfo.name}
                                                        </Label>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {typeInfo.description}
                                                        </p>
                                                        <div className="mt-2">
                                                            <p className="text-xs text-muted-foreground font-medium mb-1">Default paths:</p>
                                                            <div className="text-xs text-muted-foreground font-mono bg-muted/30 rounded p-2">
                                                                {typeInfo.default_paths?.join('\n')}
                                                            </div>
                                                        </div>
                                                        {selectedMonitoringTypes.includes(key) && (
                                                            <div className="mt-3">
                                                                <Label htmlFor={`custom-${key}`} className="text-sm">
                                                                    Custom paths (optional, comma-separated):
                                                                </Label>
                                                                <Input
                                                                    id={`custom-${key}`}
                                                                    placeholder="e.g., /custom/nginx.conf, /etc/custom/apache.conf"
                                                                    value={customPaths[key] || ''}
                                                                    onChange={(e) => setCustomPaths({
                                                                        ...customPaths,
                                                                        [key]: e.target.value
                                                                    })}
                                                                    className="mt-1"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedMonitoringTypes.length > 0 && (
                                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What happens next?</h4>
                                        <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                                            <li>We'll generate a secure monitoring script for your server</li>
                                            <li>The script will monitor selected files using inotify</li>
                                            <li>Changes will be reported to BackStory automatically</li>
                                            <li>You'll see server configuration changes as activities</li>
                                        </ol>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Fixed Footer */}
                        <div className="p-6 pt-4 border-t border-border/20 bg-background">
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsConfigModalOpen(false);
                                        setSelectedMonitoringTypes([]);
                                        setCustomPaths({});
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleConfigureServerMonitor}
                                    disabled={selectedMonitoringTypes.length === 0 || processing}
                                >
                                    {processing ? 'Creating...' : `Monitor ${selectedMonitoringTypes.length} Type${selectedMonitoringTypes.length !== 1 ? 's' : ''}`}
                                </Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}