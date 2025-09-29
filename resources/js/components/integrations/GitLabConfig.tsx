import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    GitBranch,
    Plus,
    Search,
    Check,
    X,
    ExternalLink,
    AlertCircle,
    Loader2,
    Trash2,
    Settings,
    Webhook,
    Copy,
    HelpCircle,
    Eye,
    EyeOff,
} from 'lucide-react';

interface Repository {
    project_id: string;
    name: string;
    full_name: string;
    description: string;
    url: string;
    default_branch: string;
    namespace: string;
    last_activity_at?: string;
}

interface TrackedRepository {
    id: number;
    project_id: string;
    name: string;
    full_name: string;
    url: string;
    default_branch: string;
    production_branches: string[];
    staging_keywords: string[];
    track_deployments_only: boolean;
    last_release_tag?: string;
    last_release_at?: string;
    active: boolean;
}

interface GitLabConfigProps {
    ecosystem: {
        id: number;
        name: string;
    };
    integration?: {
        id: number;
        type: string;
        config?: {
            gitlab_url?: string;
            access_token?: string;
            webhook_token?: string;
        };
    };
    onSuccess: () => void;
    onCancel: () => void;
}

export default function GitLabConfig({ ecosystem, integration, onSuccess, onCancel }: GitLabConfigProps) {
    const { props } = usePage<any>();

    const [config, setConfig] = useState({
        gitlab_url: integration?.config?.gitlab_url || 'https://gitlab.com',
        access_token: integration?.config?.access_token || '',
        webhook_token: integration?.config?.webhook_token || generateWebhookToken(),
    });

    // Generate a random webhook token
    function generateWebhookToken() {
        return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
    }

    // Copy webhook token to clipboard
    const copyWebhookToken = async () => {
        try {
            await navigator.clipboard.writeText(config.webhook_token);
            setCopiedWebhookToken(true);
            setTimeout(() => setCopiedWebhookToken(false), 2000);
        } catch (error) {
            console.error('Failed to copy webhook token:', error);
        }
    };

    // Copy webhook URL to clipboard
    const copyWebhookUrl = async () => {
        try {
            const webhookUrl = `${window.location.origin}/api/gitlab/webhook`;
            await navigator.clipboard.writeText(webhookUrl);
            setCopiedWebhookUrl(true);
            setTimeout(() => setCopiedWebhookUrl(false), 2000);
        } catch (error) {
            console.error('Failed to copy webhook URL:', error);
        }
    };

    const [connectionTest, setConnectionTest] = useState<{
        loading: boolean;
        success?: boolean;
        error?: string;
        user?: string;
    }>({ loading: false });

    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [trackedRepositories, setTrackedRepositories] = useState<TrackedRepository[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Repository[]>([]);
    const [repositoryFilter, setRepositoryFilter] = useState('');
    const [loading, setLoading] = useState({
        repositories: false,
        search: false,
        adding: false,
        tracked: false,
    });

    const [showAddDialog, setShowAddDialog] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
    const [repoConfig, setRepoConfig] = useState({
        production_branches: ['main', 'master'],
        staging_keywords: ['beta', 'rc', 'staging', 'dev'],
        track_deployments_only: false,
    });

    const [step, setStep] = useState<'connection' | 'repositories'>(integration ? 'repositories' : 'connection');
    const [createdIntegration, setCreatedIntegration] = useState(integration);
    const [showAccessToken, setShowAccessToken] = useState(false);
    const [copiedWebhookToken, setCopiedWebhookToken] = useState(false);
    const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
    const [showRepositoryModal, setShowRepositoryModal] = useState(false);
    const [selectedRepositories, setSelectedRepositories] = useState<string[]>([]);

    // Create integration and test connection
    const createIntegrationAndTestConnection = async () => {
        setConnectionTest({ loading: true });

        try {
            // First create the integration using Inertia
            router.post(`/ecosystems/${ecosystem.id}/integrations`, {
                type: 'gitlab',
                name: 'GitLab',
                description: 'Track releases and deployments from GitLab repositories',
                icon: 'git-branch',
                category: 'Version Control',
                config: config,
            }, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    // Get the created integration ID from flash data
                    const flash = page.props.flash || {};
                    const newIntegrationId = flash.new_integration_id;

                    if (newIntegrationId) {
                        // Create a minimal integration object for API calls
                        const newIntegration = {
                            id: newIntegrationId,
                            type: 'gitlab',
                            config: config,
                        };
                        setCreatedIntegration(newIntegration);
                        console.log('Created integration with ID:', newIntegrationId);
                        // Test connection with the new integration
                        testConnectionWithIntegration(newIntegration);
                    } else {
                        console.error('No integration ID in flash data:', flash);
                        setConnectionTest({
                            loading: false,
                            success: false,
                            error: 'Failed to create integration - no ID returned',
                        });
                    }
                },
                onError: (errors) => {
                    setConnectionTest({
                        loading: false,
                        success: false,
                        error: 'Failed to create integration: ' + Object.values(errors).join(', '),
                    });
                }
            });
        } catch (error) {
            setConnectionTest({
                loading: false,
                success: false,
                error: 'Failed to create integration',
            });
        }
    };

    // Test connection with a specific integration
    const testConnectionWithIntegration = async (integrationToTest: any) => {
        try {
            // Use a Promise to handle the Inertia response
            const testResult = await new Promise<any>((resolve, reject) => {
                router.post(`/integrations/${integrationToTest.id}/gitlab/test-connection`, config, {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: (page: any) => {
                        // If the response contains success/error data, use it
                        const flash = page.props.flash || {};
                        if (flash.gitlab_test_result) {
                            resolve(flash.gitlab_test_result);
                        } else {
                            // Fallback for direct success
                            resolve({ success: true, user: 'Connected' });
                        }
                    },
                    onError: (errors: any) => {
                        reject(new Error(Object.values(errors).join(', ')));
                    },
                    onFinish: () => {
                        // If we get here without success/error, try to parse from response
                    }
                });
            });

            if (testResult.success) {
                setConnectionTest({
                    loading: false,
                    success: true,
                    user: testResult.user || testResult.username || 'Connected',
                });
                setStep('repositories');
                // Use the integration passed to this function
                loadRepositoriesForIntegration(integrationToTest);
                loadTrackedRepositoriesForIntegration(integrationToTest);
            } else {
                setConnectionTest({
                    loading: false,
                    success: false,
                    error: testResult.error || 'Connection failed',
                });
            }
        } catch (error: any) {
            setConnectionTest({
                loading: false,
                success: false,
                error: error.message || 'Network error occurred',
            });
        }
    };

    // Update existing integration configuration
    const updateIntegrationConfig = async () => {
        if (!integration) return;

        try {
            router.put(`/integrations/${integration.id}`, {
                config: config,
            }, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    console.log('Integration config updated successfully');
                },
                onError: (errors) => {
                    console.error('Failed to update integration config:', errors);
                }
            });
        } catch (error) {
            console.error('Error updating integration config:', error);
        }
    };

    // Test GitLab connection (for existing integrations)
    const testConnection = async () => {
        if (!integration) {
            return createIntegrationAndTestConnection();
        }

        // For existing integrations, first update the config, then test
        await updateIntegrationConfig();
        setConnectionTest({ loading: true });
        testConnectionWithIntegration(integration);
    };

    // Load user repositories for a specific integration
    const loadRepositoriesForIntegration = async (targetIntegration: any) => {
        if (!targetIntegration) {
            console.log('No integration provided for loading repositories');
            return;
        }

        console.log('Loading repositories for integration:', targetIntegration.id);
        setLoading(prev => ({ ...prev, repositories: true }));

        try {
            const response = await fetch(`/integrations/${targetIntegration.id}/gitlab/repositories`);
            console.log('Repository response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Repository request failed:', response.status, errorText);
                return;
            }

            const repos = await response.json();
            console.log('Repositories received:', repos);

            if (Array.isArray(repos)) {
                setRepositories(repos);
                console.log('Set repositories:', repos.length, 'items');
            } else {
                console.error('Invalid repositories response:', repos);
            }
        } catch (error) {
            console.error('Failed to load repositories:', error);
        } finally {
            setLoading(prev => ({ ...prev, repositories: false }));
        }
    };

    // Load user repositories (uses state)
    const loadRepositories = async () => {
        const currentIntegration = createdIntegration || integration;
        if (!currentIntegration) {
            console.log('No integration available for loading repositories');
            return;
        }

        loadRepositoriesForIntegration(currentIntegration);
    };

    // Load tracked repositories for a specific integration
    const loadTrackedRepositoriesForIntegration = async (targetIntegration: any) => {
        if (!targetIntegration) {
            console.log('No integration provided for loading tracked repositories');
            return;
        }

        console.log('Loading tracked repositories for integration:', targetIntegration.id);
        setLoading(prev => ({ ...prev, tracked: true }));

        try {
            const response = await fetch(`/integrations/${targetIntegration.id}/gitlab/tracked-repositories`);
            console.log('Tracked repositories response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Tracked repositories request failed:', response.status, errorText);
                return;
            }

            const tracked = await response.json();
            console.log('Tracked repositories received:', tracked);

            if (Array.isArray(tracked)) {
                setTrackedRepositories(tracked);
            }
        } catch (error) {
            console.error('Failed to load tracked repositories:', error);
        } finally {
            setLoading(prev => ({ ...prev, tracked: false }));
        }
    };

    // Load tracked repositories (uses state)
    const loadTrackedRepositories = async () => {
        const currentIntegration = createdIntegration || integration;
        if (!currentIntegration) {
            console.log('No integration available for loading tracked repositories');
            return;
        }

        loadTrackedRepositoriesForIntegration(currentIntegration);
    };

    // Load repositories and tracked repositories when editing existing integration
    useEffect(() => {
        if (integration) {
            console.log('Loading repositories for existing integration:', integration.id);
            setConnectionTest({
                loading: false,
                success: true,
                user: 'Connected', // We'll assume it's connected if integration exists
            });
            loadRepositoriesForIntegration(integration);
            loadTrackedRepositoriesForIntegration(integration);
        }
    }, [integration]);

    // Search repositories
    const searchRepositories = async () => {
        const currentIntegration = createdIntegration || integration;
        if (!currentIntegration || searchQuery.length < 2) return;

        setLoading(prev => ({ ...prev, search: true }));

        try {
            const response = await fetch(
                `/integrations/${currentIntegration.id}/gitlab/repositories/search?query=${encodeURIComponent(searchQuery)}`
            );
            const results = await response.json();

            if (Array.isArray(results)) {
                setSearchResults(results);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(prev => ({ ...prev, search: false }));
        }
    };

    // Add repository to tracking
    const addRepository = async () => {
        const currentIntegration = createdIntegration || integration;
        if (!selectedRepo || !currentIntegration) return;

        setLoading(prev => ({ ...prev, adding: true }));

        router.post(`/integrations/${currentIntegration.id}/gitlab/repositories`, {
            ...selectedRepo,
            ...repoConfig,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page: any) => {
                console.log('Repository added successfully');
                // Close dialog and reset form
                setShowAddDialog(false);
                setSelectedRepo(null);
                setRepoConfig({
                    production_branches: ['main', 'master'],
                    staging_keywords: ['beta', 'rc', 'staging', 'dev'],
                    track_deployments_only: false,
                });
                // Refresh tracked repositories
                loadTrackedRepositoriesForIntegration(currentIntegration);
            },
            onError: (errors: any) => {
                console.error('Failed to add repository:', errors);
                // You might want to show an error message to the user here
            },
            onFinish: () => {
                setLoading(prev => ({ ...prev, adding: false }));
            }
        });
    };

    // Remove repository from tracking
    const removeRepository = async (repoId: number) => {
        const currentIntegration = createdIntegration || integration;
        if (!currentIntegration) return;

        try {
            const response = await fetch(`/integrations/${currentIntegration.id}/gitlab/repositories/${repoId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                loadTrackedRepositories();
            }
        } catch (error) {
            console.error('Failed to remove repository:', error);
        }
    };

    // Complete the configuration
    const handleComplete = () => {
        onSuccess();
    };

    const openAddDialog = (repo: Repository) => {
        setSelectedRepo(repo);
        setRepoConfig({
            production_branches: [repo.default_branch || 'main'],
            staging_keywords: ['beta', 'rc', 'staging', 'dev'],
            track_deployments_only: false,
        });
        setShowAddDialog(true);
    };

    const isRepoTracked = (projectId: string) => {
        return trackedRepositories.some(repo => repo.project_id === projectId);
    };

    if (step === 'connection') {
        return (
            <div className="p-6 space-y-8">
                {/* Header Section */}
                <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                        <GitBranch className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">Connect to GitLab</h2>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                        Connect your GitLab account to automatically track releases and deployments
                    </p>
                </div>

                {/* Form Section */}
                <div className="space-y-6">
                    {/* GitLab Instance URL */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="gitlab_url" className="text-sm font-medium">GitLab Instance URL</Label>
                            <div className="group relative">
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                <div className="absolute left-0 top-6 w-64 p-3 bg-popover border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                    <p className="text-xs">
                                        Use <code>https://gitlab.com</code> for GitLab.com or enter your self-hosted GitLab URL (e.g., <code>https://gitlab.example.com</code>)
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Input
                            id="gitlab_url"
                            type="url"
                            value={config.gitlab_url}
                            onChange={(e) => setConfig(prev => ({ ...prev, gitlab_url: e.target.value }))}
                            placeholder="https://gitlab.com"
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                        />
                        <p className="text-xs text-muted-foreground">
                            Leave as gitlab.com for GitLab.com, or enter your self-hosted GitLab URL
                        </p>
                    </div>

                    {/* Personal Access Token */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="access_token" className="text-sm font-medium">Personal Access Token</Label>
                            <div className="group relative">
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                <div className="absolute left-0 top-6 w-72 p-3 bg-popover border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                    <p className="text-xs mb-2">
                                        Create a token in GitLab Settings → Access Tokens with these scopes:
                                    </p>
                                    <ul className="text-xs space-y-1">
                                        <li>• <code>read_api</code> - Read GitLab API</li>
                                        <li>• <code>read_repository</code> - Read repository data</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <Input
                                id="access_token"
                                type={showAccessToken ? "text" : "password"}
                                value={config.access_token}
                                onChange={(e) => setConfig(prev => ({ ...prev, access_token: e.target.value }))}
                                placeholder="Enter your GitLab Personal Access Token"
                                className="pr-10 transition-all focus:ring-2 focus:ring-primary/20"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowAccessToken(!showAccessToken)}
                            >
                                {showAccessToken ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Create a token with 'read_api' and 'read_repository' scopes in GitLab Settings → Access Tokens
                        </p>
                    </div>

                    {/* Webhook Secret Token */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="webhook_token" className="text-sm font-medium">Webhook Secret Token</Label>
                            <div className="group relative">
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                <div className="absolute left-0 top-6 w-64 p-3 bg-popover border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                    <p className="text-xs">
                                        This secure token verifies that webhook events come from GitLab. Copy this token for webhook configuration.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                id="webhook_token"
                                type="text"
                                value={config.webhook_token}
                                onChange={(e) => setConfig(prev => ({ ...prev, webhook_token: e.target.value }))}
                                placeholder="Webhook secret token"
                                className="font-mono text-sm flex-1"
                                readOnly
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={copyWebhookToken}
                                className="shrink-0"
                            >
                                {copiedWebhookToken ? (
                                    <>
                                        <Check className="h-4 w-4" />
                                        <span className="ml-1 hidden sm:inline">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        <span className="ml-1 hidden sm:inline">Copy</span>
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setConfig(prev => ({ ...prev, webhook_token: generateWebhookToken() }))}
                                className="shrink-0"
                            >
                                Regenerate
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            This token will be used to verify webhook authenticity. Copy this for GitLab webhook configuration.
                        </p>
                    </div>

                    {/* Test Connection Button */}
                    <div className="pt-2">
                        <Button
                            onClick={testConnection}
                            disabled={!config.access_token || connectionTest.loading}
                            className="w-full h-11 text-base font-medium"
                            size="lg"
                        >
                            {connectionTest.loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Testing Connection...
                                </>
                            ) : (
                                <>
                                    <GitBranch className="mr-2 h-5 w-5" />
                                    Test Connection & Continue
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Status Messages */}
                    {connectionTest.success && (
                        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
                            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <AlertDescription className="text-green-800 dark:text-green-200">
                                <span className="font-medium">Success!</span> Connected to GitLab as <strong>{connectionTest.user}</strong>
                            </AlertDescription>
                        </Alert>
                    )}

                    {connectionTest.error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-5 w-5" />
                            <AlertDescription>
                                <span className="font-medium">Connection Failed:</span> {connectionTest.error}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                        Your credentials are stored securely and encrypted
                    </p>
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8">
            {/* Connection Status */}
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                    <div className="flex items-center justify-between">
                        <span><span className="font-medium">Connected to GitLab</span> as <strong>{connectionTest.user}</strong></span>
                        {integration && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => setStep('connection')}
                            >
                                <Settings className="h-3 w-3 mr-1" />
                                Edit Connection
                            </Button>
                        )}
                    </div>
                </AlertDescription>
            </Alert>

            {/* Webhook Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Webhook className="h-5 w-5" />
                        Webhook Configuration
                    </CardTitle>
                    <CardDescription>
                        Configure GitLab webhooks to automatically receive release and deployment notifications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Webhook URL */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Webhook URL</Label>
                        <div className="flex gap-2">
                            <Input
                                value={`${window.location.origin}/api/gitlab/webhook`}
                                readOnly
                                className="font-mono text-sm flex-1"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copyWebhookUrl}
                                className="shrink-0"
                            >
                                {copiedWebhookUrl ? (
                                    <>
                                        <Check className="h-4 w-4" />
                                        <span className="ml-1 hidden sm:inline">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        <span className="ml-1 hidden sm:inline">Copy</span>
                                    </>
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Use this URL in your GitLab project webhook settings
                        </p>
                    </div>

                    {/* Secret Token */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Secret Token</Label>
                        <div className="flex gap-2">
                            <Input
                                value={config.webhook_token}
                                readOnly
                                className="font-mono text-sm flex-1"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copyWebhookToken}
                                className="shrink-0"
                            >
                                {copiedWebhookToken ? (
                                    <>
                                        <Check className="h-4 w-4" />
                                        <span className="ml-1 hidden sm:inline">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        <span className="ml-1 hidden sm:inline">Copy</span>
                                    </>
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            This token secures the webhook communication between GitLab and BackStory
                        </p>
                    </div>

                    {/* Setup Instructions */}
                    <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertDescription className="text-blue-800 dark:text-blue-200">
                            <div className="space-y-3">
                                <p className="font-medium">Webhook Setup Instructions:</p>
                                <ol className="list-decimal list-inside space-y-1.5 text-sm ml-2">
                                    <li>Go to your GitLab project → <strong>Settings</strong> → <strong>Webhooks</strong></li>
                                    <li>Paste the webhook URL from above into the <strong>URL</strong> field</li>
                                    <li>Paste the secret token into the <strong>Secret token</strong> field</li>
                                    <li>Under <strong>Trigger events</strong>, enable:
                                        <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
                                            <li>Release events</li>
                                            <li>Tag push events</li>
                                            <li>Pipeline events (optional)</li>
                                        </ul>
                                    </li>
                                    <li>Click <strong>Add webhook</strong> to save</li>
                                </ol>
                                <div className="mt-3 p-2 bg-blue-100/50 dark:bg-blue-900/20 rounded text-xs">
                                    <strong>💡 Tip:</strong> You can test the webhook after creation using GitLab's "Test" button to ensure it's working correctly.
                                </div>
                            </div>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            {/* Tracked Repositories */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <GitBranch className="h-5 w-5" />
                                Tracked Repositories
                                {trackedRepositories.length > 0 && (
                                    <Badge variant="secondary">
                                        {trackedRepositories.length} tracking
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                Repositories that will trigger activities when new releases are created
                            </CardDescription>
                        </div>
                        <Button
                            onClick={() => setShowRepositoryModal(true)}
                            className="shrink-0"
                            size="sm"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Repositories
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading.tracked ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : trackedRepositories.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                <GitBranch className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium mb-2">No repositories tracked yet</h3>
                            <p className="text-sm">Add repositories below to start tracking releases automatically.</p>
                        </div>
                    ) : (
                        <div className="max-h-60 overflow-y-auto pr-2 space-y-3">
                            {trackedRepositories.map((repo) => (
                                <div key={repo.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-medium truncate">{repo.full_name}</h4>
                                            <a
                                                href={repo.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary" className="text-xs">
                                                {repo.production_branches.join(', ')}
                                            </Badge>
                                            {repo.track_deployments_only && (
                                                <Badge variant="outline" className="text-xs">
                                                    Deployments Only
                                                </Badge>
                                            )}
                                            {repo.last_release_tag && (
                                                <Badge variant="outline" className="text-xs">
                                                    Last: {repo.last_release_tag}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeRepository(repo.id)}
                                        className="text-destructive hover:text-destructive ml-4 shrink-0"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>


            {/* Summary and Action Buttons */}
            <div className="space-y-6 pt-4 border-t">
                {trackedRepositories.length > 0 && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                            <div className="space-y-2">
                                <p><span className="font-medium">Setup Complete!</span> You're now tracking {trackedRepositories.length} repository{trackedRepositories.length !== 1 ? 's' : ''}.</p>
                                <div className="text-sm">
                                    <p className="font-medium mb-1">Tracked repositories:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {trackedRepositories.slice(0, 3).map((repo) => (
                                            <Badge key={repo.id} variant="secondary" className="text-xs">
                                                {repo.full_name}
                                            </Badge>
                                        ))}
                                        {trackedRepositories.length > 3 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{trackedRepositories.length - 3} more
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm">
                                    Release events from these repositories will automatically create activities in BackStory.
                                </p>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                        {trackedRepositories.length === 0 ? (
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                <span>No repositories selected. You can add them later if needed.</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span>{trackedRepositories.length} repository{trackedRepositories.length !== 1 ? 's' : ''} ready for tracking</span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onCancel} className="min-w-20">
                            Cancel
                        </Button>
                        <Button onClick={handleComplete} className="min-w-32">
                            {integration ? (
                                // Editing existing integration
                                <>
                                    <Settings className="h-4 w-4 mr-2" />
                                    Save Changes
                                </>
                            ) : (
                                // Creating new integration
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Complete Setup
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Add Repository Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Configure Repository Tracking</DialogTitle>
                        <DialogDescription>
                            Set up how releases should be detected for {selectedRepo?.full_name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label className="text-sm font-medium">Production Branches</Label>
                            <div className="mt-2 space-y-2">
                                {['main', 'master', 'production', 'release'].map((branch) => (
                                    <div key={branch} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={branch}
                                            checked={repoConfig.production_branches.includes(branch)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setRepoConfig(prev => ({
                                                        ...prev,
                                                        production_branches: [...prev.production_branches, branch]
                                                    }));
                                                } else {
                                                    setRepoConfig(prev => ({
                                                        ...prev,
                                                        production_branches: prev.production_branches.filter(b => b !== branch)
                                                    }));
                                                }
                                            }}
                                        />
                                        <Label htmlFor={branch} className="text-sm font-medium">
                                            {branch}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Releases from these branches are considered production releases
                            </p>
                        </div>

                        <div>
                            <Label className="text-sm font-medium">Staging Keywords</Label>
                            <Input
                                value={repoConfig.staging_keywords.join(', ')}
                                onChange={(e) => setRepoConfig(prev => ({
                                    ...prev,
                                    staging_keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                                }))}
                                placeholder="beta, rc, staging, dev"
                                className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Releases containing these keywords will be ignored
                            </p>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="deployments_only"
                                checked={repoConfig.track_deployments_only}
                                onCheckedChange={(checked) => setRepoConfig(prev => ({
                                    ...prev,
                                    track_deployments_only: !!checked
                                }))}
                            />
                            <Label htmlFor="deployments_only" className="text-sm">
                                Track deployments only
                            </Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            If enabled, only track releases that are deployed via CI/CD pipelines
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={addRepository} disabled={loading.adding}>
                            {loading.adding ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                'Add Repository'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Repository Selection Modal */}
            <Dialog open={showRepositoryModal} onOpenChange={setShowRepositoryModal}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <GitBranch className="h-5 w-5" />
                            Select Repositories to Track
                        </DialogTitle>
                        <DialogDescription>
                            Choose which repositories will trigger activities when releases are created
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col h-full">
                        {/* Search Bar */}
                        <div className="flex gap-2 mb-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search repositories..."
                                    value={repositoryFilter}
                                    onChange={(e) => setRepositoryFilter(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setRepositoryFilter('')}
                                disabled={!repositoryFilter}
                            >
                                Clear Filter
                            </Button>
                        </div>

                        {/* Repository List */}
                        <div className="flex-1 overflow-hidden">
                            {loading.repositories ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">Loading repositories...</p>
                                    </div>
                                </div>
                            ) : repositories.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                        <GitBranch className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold">No repositories found</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto">
                                        Make sure your access token has the required permissions.
                                    </p>
                                </div>
                            ) : (
                                <div className="border rounded-lg overflow-hidden h-full">
                                    {/* Header */}
                                    <div className="px-4 py-3 border-b bg-muted/50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium">
                                                {repositories.filter(repo =>
                                                    !repositoryFilter ||
                                                    repo.full_name.toLowerCase().includes(repositoryFilter.toLowerCase()) ||
                                                    repo.description?.toLowerCase().includes(repositoryFilter.toLowerCase()) ||
                                                    repo.namespace.toLowerCase().includes(repositoryFilter.toLowerCase())
                                                ).length} repositories
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                • {selectedRepositories.length} selected
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const filteredRepos = repositories.filter(repo =>
                                                        !repositoryFilter ||
                                                        repo.full_name.toLowerCase().includes(repositoryFilter.toLowerCase()) ||
                                                        repo.description?.toLowerCase().includes(repositoryFilter.toLowerCase()) ||
                                                        repo.namespace.toLowerCase().includes(repositoryFilter.toLowerCase())
                                                    );
                                                    const allVisible = filteredRepos.filter(repo => !isRepoTracked(repo.project_id));
                                                    setSelectedRepositories(allVisible.map(repo => repo.project_id));
                                                }}
                                            >
                                                Select All
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedRepositories([])}
                                            >
                                                Clear
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Repository List */}
                                    <div
                                        className="overflow-y-auto p-3"
                                        style={{ height: '400px' }}
                                    >
                                        <div className="space-y-2">
                                            {repositories
                                                .filter(repo =>
                                                    !repositoryFilter ||
                                                    repo.full_name.toLowerCase().includes(repositoryFilter.toLowerCase()) ||
                                                    repo.description?.toLowerCase().includes(repositoryFilter.toLowerCase()) ||
                                                    repo.namespace.toLowerCase().includes(repositoryFilter.toLowerCase())
                                                )
                                                .map((repo) => {
                                                    const isTracked = isRepoTracked(repo.project_id);
                                                    const isSelected = selectedRepositories.includes(repo.project_id);

                                                    return (
                                                        <div
                                                            key={repo.project_id}
                                                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                                                isTracked
                                                                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 opacity-50'
                                                                    : isSelected
                                                                    ? 'border-primary bg-primary/5'
                                                                    : 'border-border hover:border-primary/30 hover:bg-muted/50'
                                                            }`}
                                                            onClick={() => {
                                                                if (isTracked) return;

                                                                if (isSelected) {
                                                                    setSelectedRepositories(prev =>
                                                                        prev.filter(id => id !== repo.project_id)
                                                                    );
                                                                } else {
                                                                    setSelectedRepositories(prev =>
                                                                        [...prev, repo.project_id]
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className="mt-1">
                                                                    <Checkbox
                                                                        checked={isSelected || isTracked}
                                                                        disabled={isTracked}
                                                                        onCheckedChange={() => {}} // Handled by div click
                                                                    />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <h4 className="font-medium text-sm truncate">{repo.full_name}</h4>
                                                                        {isTracked && (
                                                                            <Badge variant="secondary" className="text-xs">
                                                                                <Check className="h-3 w-3 mr-1" />
                                                                                Already Tracking
                                                                            </Badge>
                                                                        )}
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {repo.default_branch}
                                                                        </Badge>
                                                                    </div>
                                                                    {repo.description && (
                                                                        <p className="text-sm text-muted-foreground mb-1 line-clamp-1">
                                                                            {repo.description}
                                                                        </p>
                                                                    )}
                                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                        <span>{repo.namespace}</span>
                                                                        {repo.last_activity_at && (
                                                                            <span>
                                                                                Last activity: {new Date(repo.last_activity_at).toLocaleDateString()}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <div className="flex items-center justify-between w-full">
                            <p className="text-sm text-muted-foreground">
                                {selectedRepositories.length} repositories selected
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowRepositoryModal(false);
                                        setSelectedRepositories([]);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={async () => {
                                        const currentIntegration = createdIntegration || integration;
                                        if (!currentIntegration) return;

                                        // Add selected repositories with default config
                                        for (const projectId of selectedRepositories) {
                                            const repo = repositories.find(r => r.project_id === projectId);
                                            if (repo) {
                                                try {
                                                    await new Promise<void>((resolve, reject) => {
                                                        router.post(`/integrations/${currentIntegration.id}/gitlab/repositories`, {
                                                            ...repo,
                                                            production_branches: [repo.default_branch || 'main'],
                                                            staging_keywords: ['beta', 'rc', 'staging', 'dev'],
                                                            track_deployments_only: false,
                                                        }, {
                                                            preserveScroll: true,
                                                            preserveState: true,
                                                            onSuccess: () => resolve(),
                                                            onError: () => reject(),
                                                        });
                                                    });
                                                } catch (error) {
                                                    console.error('Failed to add repository:', repo.full_name);
                                                }
                                            }
                                        }

                                        // Refresh tracked repositories
                                        loadTrackedRepositoriesForIntegration(currentIntegration);
                                        setShowRepositoryModal(false);
                                        setSelectedRepositories([]);
                                    }}
                                    disabled={selectedRepositories.length === 0}
                                >
                                    Add {selectedRepositories.length} Repositories
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}