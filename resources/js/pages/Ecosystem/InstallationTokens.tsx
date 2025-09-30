import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Plus, Copy, CheckCircle, Clock, Ban, Eye, EyeOff, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

interface Props {
    ecosystem: {
        id: number;
        name: string;
    };
    tokens: Array<{
        id: number;
        name: string;
        token: string | null;
        integration_type: string;
        status: 'active' | 'used' | 'expired' | 'revoked';
        created_at: string;
        expires_at: string;
        used_at: string | null;
        created_by: string;
    }>;
}

const breadcrumbs = (ecosystem: {id: number, name: string}): BreadcrumbItem[] => [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: ecosystem.name,
        href: `/ecosystems/${ecosystem.id}`,
    },
    {
        title: 'Installation Tokens',
        href: `/ecosystems/${ecosystem.id}/installation-tokens`,
    },
];

export default function InstallationTokens({ ecosystem, tokens }: Props) {
    const { props } = usePage<any>();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createdToken, setCreatedToken] = useState<{id: number, token: string, name: string} | null>(null);
    const [copied, setCopied] = useState<'command' | 'token' | null>(null);
    const [showToken, setShowToken] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        integration_type: 'server_monitor',
        expires_hours: 24,
        paths: [] as string[],
    });

    const handleDelete = (tokenId: number) => {
        if (confirm('Are you sure you want to delete this installation token? This action cannot be undone.')) {
            router.delete(`/ecosystems/${ecosystem.id}/installation-tokens/${tokenId}`);
        }
    };

    const handleCreateToken = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/ecosystems/${ecosystem.id}/installation-tokens`, {
            onSuccess: () => {
                reset();
                setIsCreateModalOpen(false);
                // Token will be shown via flash data and useEffect
            },
        });
    };

    const copyToClipboard = async (text: string, type: 'command' | 'token') => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    const installCommand = `curl -sSL ${window.location.origin}/install.sh | bash`;

    // Check for flash data containing newly created token
    useEffect(() => {
        if (props.flash?.newToken) {
            setCreatedToken(props.flash.newToken);
        }
    }, [props.flash]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
            case 'used':
                return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"><CheckCircle className="w-3 h-3 mr-1" />Used</Badge>;
            case 'expired':
                return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"><Clock className="w-3 h-3 mr-1" />Expired</Badge>;
            case 'revoked':
                return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"><Ban className="w-3 h-3 mr-1" />Revoked</Badge>;
        }
    };

    const activeTokens = tokens.filter(token => token.status === 'active');
    const inactiveTokens = tokens.filter(token => token.status !== 'active');

    return (
        <AppLayout breadcrumbs={breadcrumbs(ecosystem)}>
            <Head title={`Installation Tokens - ${ecosystem.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Installation Tokens</h1>
                        <p className="text-muted-foreground">Manage secure installation tokens for {ecosystem.name}</p>
                    </div>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Token
                    </Button>
                </div>

                {/* Instructions */}
                <Alert className="mb-6">
                    <Copy className="h-4 w-4" />
                    <AlertDescription>
                        <strong>How to install BackStory monitoring:</strong>
                        <br />
                        1. Create an installation token below
                        <br />
                        2. Run this command on your server: <code className="bg-muted px-1 rounded">curl -sSL {window.location.origin}/install.sh | bash</code>
                        <br />
                        3. When prompted, paste your installation token
                    </AlertDescription>
                </Alert>

                <div className="space-y-6">
                    {/* Active Tokens */}
                    {activeTokens.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-green-600">Active Tokens</CardTitle>
                                <CardDescription>
                                    These tokens can be used for new installations
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Expires</TableHead>
                                            <TableHead>Created By</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activeTokens.map((token) => (
                                            <TableRow key={token.id}>
                                                <TableCell className="font-medium">{token.name}</TableCell>
                                                <TableCell className="capitalize">{token.integration_type.replace('_', ' ')}</TableCell>
                                                <TableCell>{getStatusBadge(token.status)}</TableCell>
                                                <TableCell>{new Date(token.expires_at).toLocaleDateString()}</TableCell>
                                                <TableCell>{token.created_by}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/ecosystems/${ecosystem.id}/installation-tokens/${token.id}`}>
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                View
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDelete(token.id)}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {/* Inactive Tokens */}
                    {inactiveTokens.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-muted-foreground">Used/Expired/Revoked Tokens</CardTitle>
                                <CardDescription>
                                    Historical tokens that can no longer be used
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead>Used/Expired</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {inactiveTokens.map((token) => (
                                            <TableRow key={token.id} className="opacity-75">
                                                <TableCell className="font-medium">{token.name}</TableCell>
                                                <TableCell className="capitalize">{token.integration_type.replace('_', ' ')}</TableCell>
                                                <TableCell>{getStatusBadge(token.status)}</TableCell>
                                                <TableCell>{new Date(token.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    {token.used_at ? new Date(token.used_at).toLocaleDateString() : new Date(token.expires_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/ecosystems/${ecosystem.id}/installation-tokens/${token.id}`}>
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                View
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDelete(token.id)}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {/* Empty State */}
                    {tokens.length === 0 && (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="rounded-full bg-muted p-4">
                                        <Plus className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium">No installation tokens</h3>
                                        <p className="text-muted-foreground">
                                            Create your first installation token to start monitoring servers
                                        </p>
                                    </div>
                                    <Button onClick={() => setIsCreateModalOpen(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Token
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Create Token Modal */}
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center">
                                <Plus className="w-5 h-5 mr-2" />
                                Create Installation Token
                            </DialogTitle>
                            <DialogDescription>
                                Create a secure token to install BackStory monitoring on your servers
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateToken} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Token Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g., Production Server, Development Environment"
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="integration_type">Integration Type</Label>
                                <Select
                                    value={data.integration_type}
                                    onValueChange={(value) => setData('integration_type', value)}
                                >
                                    <SelectTrigger className={errors.integration_type ? 'border-red-500' : ''}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="server_monitor">Server Monitor</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.integration_type && (
                                    <p className="text-sm text-red-600">{errors.integration_type}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="expires_hours">Token Expiry</Label>
                                <Select
                                    value={data.expires_hours.toString()}
                                    onValueChange={(value) => setData('expires_hours', parseInt(value))}
                                >
                                    <SelectTrigger className={errors.expires_hours ? 'border-red-500' : ''}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 hour</SelectItem>
                                        <SelectItem value="6">6 hours</SelectItem>
                                        <SelectItem value="24">24 hours (recommended)</SelectItem>
                                        <SelectItem value="72">3 days</SelectItem>
                                        <SelectItem value="168">7 days</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.expires_hours && (
                                    <p className="text-sm text-red-600">{errors.expires_hours}</p>
                                )}
                            </div>

                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="text-sm">
                                    Installation tokens are single-use and automatically deactivated after successful installation.
                                </AlertDescription>
                            </Alert>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Creating...' : 'Create Token'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Token Created Success Modal */}
                <Dialog open={!!createdToken} onOpenChange={() => {
                    setCreatedToken(null);
                    setShowToken(false);
                }}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center text-green-600">
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Installation Token Created!
                            </DialogTitle>
                            <DialogDescription>
                                Your token "{createdToken?.name}" has been created successfully. Follow the steps below to install monitoring.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">⚠️ Important Security Notice</h4>
                                <p className="text-sm text-green-800 dark:text-green-200">
                                    This is the only time you'll see this token. Copy it now and keep it secure.
                                    The token will expire automatically and is single-use only.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Step 1: Copy your installation token</h4>
                                    <div className="relative">
                                        <Textarea
                                            value={showToken ? (createdToken?.token || '') : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                                            readOnly
                                            className="font-mono text-sm pr-20 bg-muted"
                                            rows={3}
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
                                                    onClick={() => copyToClipboard(createdToken?.token || '', 'token')}
                                                    title="Copy token"
                                                >
                                                    {copied === 'token' ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Step 2: Run this command on your server</h4>
                                    <div className="relative">
                                        <Textarea
                                            value={installCommand}
                                            readOnly
                                            className="font-mono text-sm pr-12"
                                            rows={1}
                                        />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="absolute right-2 top-2 h-6 w-6 p-0"
                                            onClick={() => copyToClipboard(installCommand, 'command')}
                                        >
                                            {copied === 'command' ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Step 3: Paste the token when prompted</h4>
                                    <p className="text-sm text-muted-foreground">
                                        The installation script will prompt you to enter your token. Paste the token from Step 1.
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What happens next?</h4>
                                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                                    <li>The script validates your token and sets up monitoring</li>
                                    <li>A unique API key is created for this server</li>
                                    <li>File monitoring starts automatically</li>
                                    <li>Changes appear in your BackStory dashboard within seconds</li>
                                </ul>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button onClick={() => {
                                setCreatedToken(null);
                                setShowToken(false);
                            }}>
                                Done
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}