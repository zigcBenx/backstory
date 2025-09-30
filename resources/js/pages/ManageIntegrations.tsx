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
    Terminal,
    Settings,
    Eye,
    EyeOff,
    CheckCircle
} from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';
import GitLabConfig from '@/components/integrations/GitLabConfig';

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
    const [isGitLabConfigModalOpen, setIsGitLabConfigModalOpen] = useState(false);
    const [isGitLabEditModalOpen, setIsGitLabEditModalOpen] = useState(false);
    const [selectedIntegrationForEdit, setSelectedIntegrationForEdit] = useState<Integration | null>(null);
    const [selectedMonitoringTypes, setSelectedMonitoringTypes] = useState<string[]>([]);
    const [customPaths, setCustomPaths] = useState<Record<string, string>>({});
    const [showInstallCommand, setShowInstallCommand] = useState<number | null>(null);
    const [createdToken, setCreatedToken] = useState<{id: number, token: string, name: string} | null>(null);
    const [showToken, setShowToken] = useState(false);
    const [isCreatingToken, setIsCreatingToken] = useState(false);
    const [copied, setCopied] = useState<'command' | 'token' | null>(null);
    const [previewIntegration, setPreviewIntegration] = useState<Integration | null>(null);

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
                    setShowInstallCommand(newIntegration.id);
                }, 300);
            }
        }
    }, [flashData, ecosystem.integrations, props]);

    const handleConnect = (integration: AvailableIntegration) => {
        if (integration.configurable && integration.type === 'server-monitor') {
            setSelectedIntegration(integration);
            setIsConnectModalOpen(false);
            setIsConfigModalOpen(true);
        } else if (integration.type === 'gitlab') {
            setSelectedIntegration(integration);
            setIsConnectModalOpen(false);
            setIsGitLabConfigModalOpen(true);
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

    const handleGitLabConfigSuccess = () => {
        setIsGitLabConfigModalOpen(false);
        setSelectedIntegration(null);
        router.reload();
    };

    const handleEditGitLabSettings = (integration: Integration) => {
        setSelectedIntegrationForEdit(integration);
        setIsGitLabEditModalOpen(true);
    };

    const handleGitLabEditSuccess = () => {
        setIsGitLabEditModalOpen(false);
        setSelectedIntegrationForEdit(null);
        router.reload();
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

    const handleDelete = (integration: Integration, event?: React.MouseEvent) => {
        event?.stopPropagation();
        if (window.confirm(`Are you sure you want to remove "${integration.name}"?`)) {
            destroy(`/integrations/${integration.id}`);
        }
    };


    const createInstallationToken = async () => {
        setIsCreatingToken(true);

        try {
            const response = await fetch(`/ecosystems/${ecosystem.id}/installation-tokens`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    name: `Server Monitor - ${new Date().toLocaleDateString()}`,
                    integration_type: 'server_monitor',
                    expires_hours: 24,
                    paths: [],
                    integration_id: showInstallCommand, // The integration ID from the modal
                }),
            });

            const data = await response.json();

            if (response.ok && data.token) {
                setCreatedToken(data.token);
                setShowToken(false); // Start hidden like GitLab
            } else {
                alert('Error creating token: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error creating token:', error);
            alert('Failed to create installation token');
        } finally {
            setIsCreatingToken(false);
        }
    };

    const copyToClipboard = async (text: string, type: 'command' | 'token') => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy to clipboard');
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

    const getConnectedServers = (integration: Integration) => {
        if (integration.type !== 'server-monitor' || !integration.config?.connected_servers) {
            return [];
        }
        return integration.config.connected_servers;
    };

    const getServerDisplayName = (integration: Integration) => {
        // Prioritize real hostname from heartbeat data over installation-time hostname
        const heartbeatHostname = integration.config?.last_heartbeat?.server_info?.hostname;
        if (heartbeatHostname) {
            return heartbeatHostname;
        }

        // Fallback to connected servers data
        const servers = getConnectedServers(integration);
        if (servers.length > 0) {
            return servers[0].hostname || servers[0].token_name;
        }

        return 'Unknown Server';
    };

    const renderServerInfo = (integration: Integration) => {
        if (integration.type !== 'server-monitor') {
            return null;
        }

        const servers = getConnectedServers(integration);

        if (servers.length === 0) {
            return (
                <div className="text-sm text-muted-foreground">
                    No servers connected
                </div>
            );
        }

        if (servers.length === 1) {
            return (
                <div className="text-sm font-medium">
                    {getServerDisplayName(integration)}
                </div>
            );
        }

        return (
            <div className="text-sm">
                <div className="font-medium">{getServerDisplayName(integration)}</div>
                <div className="text-muted-foreground">
                    +{servers.length - 1} more server{servers.length > 2 ? 's' : ''}
                </div>
            </div>
        );
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
                                        <Card key={integration.id} className="glass-effect border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer" onClick={() => setPreviewIntegration(integration)}>
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
                                                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {integration.type === 'server-monitor' && integration.connected && (
                                                                <DropdownMenuItem onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setShowInstallCommand(integration.id);
                                                                }}>
                                                                    <Terminal className="mr-2 h-4 w-4" />
                                                                    Server Installation Instructions
                                                                </DropdownMenuItem>
                                                            )}
                                                            {integration.type === 'gitlab' && integration.connected && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleEditGitLabSettings(integration)}
                                                                >
                                                                    <Settings className="mr-2 h-4 w-4" />
                                                                    Edit Settings
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
                                                                onClick={(e) => handleDelete(integration, e)}
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
                                                <div className="space-y-3">
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

                                                    {/* Server information for server-monitor integrations */}
                                                    {integration.type === 'server-monitor' && (
                                                        <div className="pt-2 border-t border-border/50">
                                                            {renderServerInfo(integration)}
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

                {/* Secure Installation Instructions */}
                {showInstallCommand && (() => {
                    const currentIntegration = connectedIntegrations.find(i => i.id === showInstallCommand);
                    const hasConnectedServers = currentIntegration && getConnectedServers(currentIntegration).length > 0;

                    return (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => {
                        setShowInstallCommand(null);
                        setCreatedToken(null);
                        setShowToken(false);
                        setCopied(null);
                    }}>
                        <div className="bg-card border border-border rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                            {/* Header - Fixed */}
                            <div className="flex items-center justify-between p-6 pb-4 border-b border-border/50">
                                <h3 className="text-xl font-bold text-foreground">Install BackStory Monitor</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setShowInstallCommand(null);
                                        setCreatedToken(null);
                                        setShowToken(false);
                                    }}
                                >
                                    ✕
                                </Button>
                            </div>

                            {/* Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-6 pt-4">
                                <div className="space-y-6">
                                    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">🔐 Secure Installation Process</h4>
                                        <p className="text-sm text-blue-800 dark:text-blue-200">
                                            For security, you'll need to create an installation token first, then use it during the interactive setup.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-lg font-semibold mb-2">Step 1: Create Installation Token</h4>
                                            <p className="text-muted-foreground mb-3">
                                                Create a secure installation token for this server:
                                            </p>
                                            {!createdToken ? (
                                                <Button
                                                    onClick={createInstallationToken}
                                                    disabled={isCreatingToken}
                                                    className="w-full"
                                                >
                                                    <Terminal className="h-4 w-4 mr-2" />
                                                    {isCreatingToken ? 'Creating Token...' : 'Create Installation Token'}
                                                </Button>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                                                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm font-medium mb-2">
                                                            <CheckCircle className="h-4 w-4" />
                                                            Token Created Successfully!
                                                        </div>
                                                        <p className="text-green-600 dark:text-green-400 text-sm">
                                                            Token: <strong>{createdToken.name}</strong>
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                                            Your Installation Token:
                                                        </label>
                                                        <div className="relative">
                                                            <textarea
                                                                value={showToken ? createdToken.token : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                                                                readOnly
                                                                className="w-full font-mono text-sm p-3 pr-20 bg-muted border rounded resize-none"
                                                                rows={2}
                                                            />
                                                            <div className="absolute right-2 top-2 flex gap-1">
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 p-0"
                                                                    onClick={() => setShowToken(!showToken)}
                                                                    title={showToken ? 'Hide token' : 'Show token'}
                                                                >
                                                                    {showToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                                </Button>
                                                                {showToken && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-6 w-6 p-0"
                                                                        onClick={() => copyToClipboard(createdToken.token, 'token')}
                                                                        title="Copy token"
                                                                    >
                                                                        {copied === 'token' ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h4 className="text-lg font-semibold mb-2">Step 2: Run Installation Command</h4>
                                            <p className="text-muted-foreground mb-3">
                                                Run this command on your Ubuntu server:
                                            </p>
                                            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm relative">
                                                <code>curl -sSL {window.location.origin}/install.sh | bash</code>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="absolute top-2 right-2 h-8"
                                                    onClick={() => copyToClipboard(`curl -sSL ${window.location.origin}/install.sh | bash`, 'command')}
                                                >
                                                    {copied === 'command' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                                                    Copy
                                                </Button>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-lg font-semibold mb-2">Step 3: Enter Your Token</h4>
                                            <p className="text-muted-foreground mb-3">
                                                {createdToken
                                                    ? 'When the script prompts for your installation token, paste the token shown above.'
                                                    : 'When the script prompts for your installation token, paste the token you created in Step 1.'
                                                }
                                            </p>
                                        </div>

                                        {hasConnectedServers && (
                                            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                                                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Adding Another Server</h4>
                                                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                                                    This integration already has connected servers. The new token will add another server to this integration.
                                                </p>
                                                <div className="text-sm text-blue-700 dark:text-blue-300">
                                                    <strong>Currently connected:</strong> {getConnectedServers(currentIntegration).map((s: any) =>
                                                        currentIntegration?.config?.last_heartbeat?.server_info?.hostname || s.hostname || s.token_name
                                                    ).join(', ')}
                                                </div>
                                            </div>
                                        )}

                                        <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                                            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">What this does:</h4>
                                            <ul className="text-sm text-green-800 dark:text-green-200 space-y-1 list-disc list-inside">
                                                <li>Downloads the secure installation script (no credentials embedded)</li>
                                                <li>Prompts you to enter your installation token interactively</li>
                                                <li>Validates the token and sets up monitoring for your configured file types</li>
                                                <li>Creates a secure API key for this server only</li>
                                                <li>Starts monitoring and reporting changes to BackStory</li>
                                            </ul>
                                        </div>

                                        <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">💡 Pro Tips:</h4>
                                            <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
                                                <li>Installation tokens are single-use and expire automatically for security</li>
                                                <li>You can revoke tokens anytime from the token management page</li>
                                                <li>Each server gets its own unique API key during installation</li>
                                                <li>View and manage all your installation tokens <Link href={`/ecosystems/${ecosystem.id}/installation-tokens`} className="underline font-medium">here</Link></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer - Fixed */}
                            <div className="p-6 pt-4 border-t border-border/50">
                                <div className="flex justify-between">
                                    <Button variant="outline" asChild>
                                        <Link href={`/ecosystems/${ecosystem.id}/installation-tokens`}>
                                            <Terminal className="h-4 w-4 mr-2" />
                                            Manage Tokens
                                        </Link>
                                    </Button>
                                    <Button onClick={() => {
                                        setShowInstallCommand(null);
                                        setCreatedToken(null);
                                        setShowToken(false);
                                    }}>
                                        Done
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    );
                })()}

                {/* Integration Preview Modal */}
                <Dialog open={!!previewIntegration} onOpenChange={() => setPreviewIntegration(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/20 border border-primary/30 text-primary">
                                    {previewIntegration && getIconComponent(previewIntegration.icon)}
                                </div>
                                {previewIntegration?.name}
                            </DialogTitle>
                            <DialogDescription>
                                {previewIntegration?.description}
                            </DialogDescription>
                        </DialogHeader>

                        {previewIntegration && (
                            <div className="space-y-6">
                                {/* Status Section */}
                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <Badge
                                            className={
                                                previewIntegration.activity_status === 'active'
                                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                                    : previewIntegration.activity_status === 'connected'
                                                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                                    : previewIntegration.activity_status === 'inactive'
                                                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                                    : "bg-muted text-muted-foreground"
                                            }
                                        >
                                            {previewIntegration.activity_status === 'active' ? (
                                                <>
                                                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                                                    Active
                                                </>
                                            ) : previewIntegration.activity_status === 'connected' ? (
                                                <>
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Connected
                                                </>
                                            ) : previewIntegration.activity_status === 'inactive' ? (
                                                <>
                                                    <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
                                                    Inactive
                                                </>
                                            ) : (
                                                "Disconnected"
                                            )}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {previewIntegration.category}
                                        </span>
                                    </div>
                                    {previewIntegration.last_sync_at && (
                                        <div className="text-sm text-muted-foreground">
                                            Last sync: {new Date(previewIntegration.last_sync_at).toLocaleString()}
                                        </div>
                                    )}
                                </div>

                                {/* Server Details for server-monitor */}
                                {previewIntegration.type === 'server-monitor' && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">Connected Servers</h3>
                                        {getConnectedServers(previewIntegration).length > 0 ? (
                                            <div className="grid gap-3">
                                                {getConnectedServers(previewIntegration).map((server, index) => (
                                                    <div key={index} className="p-3 rounded-lg border bg-muted/20">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <div className="font-medium">
                                                                    {index === 0 ? getServerDisplayName(previewIntegration) : (server.hostname || server.token_name)}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    IP: {server.ip}
                                                                </div>
                                                            </div>
                                                            <div className="text-right text-sm text-muted-foreground">
                                                                <div>Connected</div>
                                                                <div>{new Date(server.installed_at).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Server className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                <p>No servers connected yet</p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-2"
                                                    onClick={() => {
                                                        setPreviewIntegration(null);
                                                        setShowInstallCommand(previewIntegration.id);
                                                    }}
                                                >
                                                    Add Server
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* API Keys Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">API Keys</h3>
                                    <div className="text-sm text-muted-foreground">
                                        {previewIntegration.type === 'server-monitor'
                                            ? `${getConnectedServers(previewIntegration).length} server API key(s) generated`
                                            : 'Integration API access configured'
                                        }
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setPreviewIntegration(null)}>
                                Close
                            </Button>
                            {previewIntegration?.type === 'server-monitor' && (
                                <Button onClick={() => {
                                    setPreviewIntegration(null);
                                    setShowInstallCommand(previewIntegration.id);
                                }}>
                                    Add Another Server
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

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
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold">Monitoring Options</h3>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    if (selectedIntegration?.availableTypes) {
                                                        setSelectedMonitoringTypes(Object.keys(selectedIntegration.availableTypes));
                                                    }
                                                }}
                                            >
                                                Select All
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedMonitoringTypes([])}
                                            >
                                                Clear
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {selectedIntegration?.availableTypes && Object.entries(selectedIntegration.availableTypes).map(([key, typeInfo]: [string, any]) => {
                                            const isSelected = selectedMonitoringTypes.includes(key);
                                            return (
                                                <div
                                                    key={key}
                                                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                                        isSelected
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-border hover:border-primary/30 hover:bg-muted/50'
                                                    }`}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setSelectedMonitoringTypes(selectedMonitoringTypes.filter(t => t !== key));
                                                        } else {
                                                            setSelectedMonitoringTypes([...selectedMonitoringTypes, key]);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
                                                            isSelected
                                                                ? 'bg-primary border-primary'
                                                                : 'border-border'
                                                        }`}>
                                                            {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-base font-medium">
                                                                {typeInfo.name}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {typeInfo.description}
                                                            </p>
                                                            <div className="mt-3">
                                                                <p className="text-xs text-muted-foreground font-medium mb-2">Default monitored paths:</p>
                                                                <div className="text-xs text-muted-foreground font-mono bg-muted/50 rounded p-3 leading-relaxed">
                                                                    {typeInfo.default_paths?.join('\n')}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="mt-4 pt-3 border-t border-border/50">
                                                            <Label htmlFor={`custom-${key}`} className="text-sm font-medium">
                                                                Additional paths (optional):
                                                            </Label>
                                                            <Input
                                                                id={`custom-${key}`}
                                                                placeholder="e.g., /custom/nginx.conf, /etc/custom/apache.conf"
                                                                value={customPaths[key] || ''}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    setCustomPaths({
                                                                        ...customPaths,
                                                                        [key]: e.target.value
                                                                    });
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="mt-2"
                                                            />
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Comma-separated list of additional file paths to monitor
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
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

                {/* GitLab Configuration Modal */}
                <Dialog open={isGitLabConfigModalOpen} onOpenChange={setIsGitLabConfigModalOpen}>
                    <DialogContent className="min-w-[80vw] max-h-[90vh] flex flex-col p-0">
                        <div className="p-6 pb-4 border-b border-border/20">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">
                                    Configure GitLab Integration
                                </DialogTitle>
                                <DialogDescription>
                                    Connect to your GitLab instance and select repositories to monitor for releases
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            {selectedIntegration && (
                                <GitLabConfig
                                    ecosystem={ecosystem}
                                    onSuccess={handleGitLabConfigSuccess}
                                    onCancel={() => setIsGitLabConfigModalOpen(false)}
                                />
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* GitLab Edit Settings Modal */}
                <Dialog open={isGitLabEditModalOpen} onOpenChange={setIsGitLabEditModalOpen}>
                    <DialogContent className="min-w-[80vw] max-h-[90vh] flex flex-col p-0">
                        <div className="p-6 pb-4 border-b border-border/20">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">
                                    Edit GitLab Integration Settings
                                </DialogTitle>
                                <DialogDescription>
                                    Update your GitLab connection settings and manage tracked repositories
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            {selectedIntegrationForEdit && (
                                <GitLabConfig
                                    ecosystem={ecosystem}
                                    integration={selectedIntegrationForEdit}
                                    onSuccess={handleGitLabEditSuccess}
                                    onCancel={() => setIsGitLabEditModalOpen(false)}
                                />
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}