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
            <div className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="gitlab_url">GitLab Instance URL</Label>
                        <Input
                            id="gitlab_url"
                            type="url"
                            value={config.gitlab_url}
                            onChange={(e) => setConfig(prev => ({ ...prev, gitlab_url: e.target.value }))}
                            placeholder="https://gitlab.com"
                            className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Leave as gitlab.com for GitLab.com, or enter your self-hosted GitLab URL
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="access_token">Personal Access Token</Label>
                        <Input
                            id="access_token"
                            type="password"
                            value={config.access_token}
                            onChange={(e) => setConfig(prev => ({ ...prev, access_token: e.target.value }))}
                            placeholder="Enter your GitLab Personal Access Token"
                            className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Create a token with 'read_api' and 'read_repository' scopes in GitLab Settings → Access Tokens
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="webhook_token">Webhook Secret Token</Label>
                        <div className="flex gap-2 mt-1">
                            <Input
                                id="webhook_token"
                                type="text"
                                value={config.webhook_token}
                                onChange={(e) => setConfig(prev => ({ ...prev, webhook_token: e.target.value }))}
                                placeholder="Webhook secret token"
                                className="font-mono text-sm"
                                readOnly
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setConfig(prev => ({ ...prev, webhook_token: generateWebhookToken() }))}
                            >
                                Regenerate
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            This token will be used to verify webhook authenticity. Copy this for GitLab webhook configuration.
                        </p>
                    </div>

                    <Button
                        onClick={testConnection}
                        disabled={!config.access_token || connectionTest.loading}
                        className="w-full"
                    >
                        {connectionTest.loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Testing Connection...
                            </>
                        ) : (
                            <>
                                <GitBranch className="mr-2 h-4 w-4" />
                                Test Connection
                            </>
                        )}
                    </Button>

                    {connectionTest.success && (
                        <Alert>
                            <Check className="h-4 w-4" />
                            <AlertDescription>
                                Successfully connected to GitLab as <strong>{connectionTest.user}</strong>
                            </AlertDescription>
                        </Alert>
                    )}

                    {connectionTest.error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{connectionTest.error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Connection Status */}
            <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                    Connected to GitLab as <strong>{connectionTest.user}</strong>
                    {integration && (
                        <Button
                            variant="link"
                            size="sm"
                            className="ml-2 h-auto p-0 text-sm"
                            onClick={() => setStep('connection')}
                        >
                            Edit Connection Settings
                        </Button>
                    )}
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
                        Configure GitLab webhooks to automatically receive release notifications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="text-sm font-medium">Webhook URL</Label>
                        <div className="flex gap-2 mt-1">
                            <Input
                                value={`${window.location.origin}/api/gitlab/webhook`}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/gitlab/webhook`)}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">Secret Token</Label>
                        <div className="flex gap-2 mt-1">
                            <Input
                                value={config.webhook_token}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigator.clipboard.writeText(config.webhook_token)}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Setup Instructions:</strong>
                            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                                <li>Go to your GitLab project → Settings → Webhooks</li>
                                <li>Add the webhook URL above</li>
                                <li>Paste the secret token</li>
                                <li>Enable: Release events, Tag push events, Pipeline events</li>
                                <li>Click "Add webhook"</li>
                            </ol>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            {/* Tracked Repositories */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GitBranch className="h-5 w-5" />
                        Tracked Repositories
                    </CardTitle>
                    <CardDescription>
                        Repositories that will trigger activities when new releases are created
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading.tracked ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : trackedRepositories.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No repositories are being tracked yet. Add some repositories below.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {trackedRepositories.map((repo) => (
                                <div key={repo.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium">{repo.full_name}</h4>
                                            <a
                                                href={repo.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </div>
                                        <div className="flex gap-2 mt-1">
                                            <Badge variant="secondary" className="text-xs">
                                                Branches: {repo.production_branches.join(', ')}
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
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Repository Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GitBranch className="h-5 w-5" />
                        Select Repositories to Track
                    </CardTitle>
                    <CardDescription>
                        Choose which repositories will trigger activities when releases are created. You can add more repositories later.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Your Repositories - More Prominent */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold">Your GitLab Repositories</h4>
                            {repositories.length > 0 && (
                                <Badge variant="outline" className="text-sm">
                                    {repositories.length} repositories found
                                </Badge>
                            )}
                        </div>

                        {loading.repositories ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-center">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">Loading your repositories...</p>
                                </div>
                            </div>
                        ) : repositories.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                    <GitBranch className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="mb-2 text-lg font-semibold">No repositories found</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">
                                    Your GitLab account doesn't have any accessible repositories. Make sure your access token has the required permissions.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {repositories.map((repo) => {
                                    const isTracked = isRepoTracked(repo.project_id);
                                    return (
                                        <div
                                            key={repo.project_id}
                                            className={`p-4 border rounded-lg transition-all hover:shadow-sm ${
                                                isTracked
                                                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30'
                                                    : 'border-border hover:border-primary/30'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h4 className="font-semibold text-sm truncate">{repo.full_name}</h4>
                                                        {isTracked && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                <Check className="h-3 w-3 mr-1" />
                                                                Tracking
                                                            </Badge>
                                                        )}
                                                        <Badge variant="outline" className="text-xs">
                                                            {repo.default_branch}
                                                        </Badge>
                                                    </div>
                                                    {repo.description && (
                                                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                                            {repo.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <ExternalLink className="h-3 w-3" />
                                                            {repo.namespace}
                                                        </span>
                                                        {repo.last_activity_at && (
                                                            <span>
                                                                Last activity: {new Date(repo.last_activity_at).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant={isTracked ? "secondary" : "default"}
                                                    onClick={() => isTracked ? undefined : openAddDialog(repo)}
                                                    disabled={isTracked}
                                                    className="ml-4 shrink-0"
                                                >
                                                    {isTracked ? (
                                                        <>
                                                            <Check className="h-4 w-4 mr-2" />
                                                            Tracking
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Track Repository
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Optional Search Section */}
                    <Separator />

                    <div>
                        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Search for Additional Repositories</h4>
                        <p className="text-xs text-muted-foreground mb-3">
                            Can't find a repository above? Search across all accessible repositories.
                        </p>

                        {/* Search */}
                        <div className="flex gap-2 mb-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search repositories..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchRepositories()}
                                    size="sm"
                                />
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={searchRepositories}
                                disabled={searchQuery.length < 2 || loading.search}
                            >
                                {loading.search ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                            </Button>
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {searchResults.map((repo) => (
                                    <div key={repo.project_id} className="flex items-center justify-between p-3 border rounded">
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{repo.full_name}</div>
                                            {repo.description && (
                                                <div className="text-xs text-muted-foreground truncate">
                                                    {repo.description}
                                                </div>
                                            )}
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {repo.namespace}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={isRepoTracked(repo.project_id) ? "secondary" : "default"}
                                            onClick={() => openAddDialog(repo)}
                                            disabled={isRepoTracked(repo.project_id)}
                                        >
                                            {isRepoTracked(repo.project_id) ? (
                                                <>
                                                    <Check className="h-4 w-4 mr-1" />
                                                    Tracked
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Track
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Summary and Action Buttons */}
            <div className="space-y-4">
                {trackedRepositories.length > 0 && (
                    <Alert>
                        <Check className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Ready to go!</strong> You're tracking {trackedRepositories.length} repository{trackedRepositories.length !== 1 ? 's' : ''}.
                            Release events from {trackedRepositories.map(r => r.full_name).join(', ')} will automatically create activities in BackStory.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                        {trackedRepositories.length === 0
                            ? "You can set up repository tracking later if needed."
                            : `${trackedRepositories.length} repository${trackedRepositories.length !== 1 ? 's' : ''} selected for tracking`
                        }
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button onClick={handleComplete}>
                            {integration ? (
                                // Editing existing integration
                                trackedRepositories.length > 0
                                    ? `Save Changes (${trackedRepositories.length} repo${trackedRepositories.length !== 1 ? 's' : ''} tracked)`
                                    : 'Save Changes'
                            ) : (
                                // Creating new integration
                                trackedRepositories.length > 0
                                    ? `Complete Setup (${trackedRepositories.length} repo${trackedRepositories.length !== 1 ? 's' : ''})`
                                    : 'Complete Setup'
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
        </div>
    );
}