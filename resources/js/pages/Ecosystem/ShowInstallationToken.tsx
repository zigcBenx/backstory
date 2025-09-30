import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Copy, AlertTriangle, CheckCircle, Clock, Ban, Trash2, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

interface Props {
    ecosystem: {
        id: number;
        name: string;
    };
    token: {
        id: number;
        name: string;
        token: string | null;
        integration_type: string;
        status: 'active' | 'used' | 'expired' | 'revoked';
        created_at: string;
        expires_at: string;
        used_at: string | null;
        created_by: string;
        metadata: {
            paths?: string[];
            created_from_ip?: string;
        };
    };
    install_command: string;
}

export default function ShowInstallationToken({ ecosystem, token, install_command }: Props) {
    const [copied, setCopied] = useState<'command' | 'token' | null>(null);
    const [showToken, setShowToken] = useState(false);

    const copyToClipboard = async (text: string, type: 'command' | 'token') => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    const handleRevoke = () => {
        if (confirm('Are you sure you want to revoke this installation token? This action cannot be undone.')) {
            router.post(route('ecosystems.installation-tokens.revoke', { ecosystem: ecosystem.id, token: token.id }));
        }
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this installation token? This action cannot be undone.')) {
            router.delete(route('ecosystems.installation-tokens.destroy', { ecosystem: ecosystem.id, token: token.id }));
        }
    };

    const getStatusBadge = () => {
        switch (token.status) {
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

    const isActive = token.status === 'active';

    return (
        <div className="min-h-screen bg-background">
            <Head title={`Installation Token: ${token.name} - ${ecosystem.name}`} />

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <Link
                            href={route('ecosystems.installation-tokens.index', ecosystem.id)}
                            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Tokens
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">{token.name}</h1>
                            <p className="text-muted-foreground">{ecosystem.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {getStatusBadge()}
                        {isActive && (
                            <Button variant="outline" size="sm" onClick={handleRevoke} className="text-red-600 hover:text-red-700">
                                <Ban className="w-4 h-4 mr-2" />
                                Revoke Token
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Status Alert */}
                {!isActive && (
                    <Alert className="mb-6">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            This installation token is {token.status} and cannot be used for new installations.
                            {token.status === 'used' && token.used_at && ` It was used on ${new Date(token.used_at).toLocaleString()}.`}
                            {token.status === 'expired' && ` It expired on ${new Date(token.expires_at).toLocaleString()}.`}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-6">
                    {/* Installation Instructions */}
                    {isActive && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <RotateCcw className="w-5 h-5 mr-2" />
                                    Server Installation
                                </CardTitle>
                                <CardDescription>
                                    Follow these steps to install BackStory monitoring on your server
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium mb-2">Step 1: Run this command on your server</h4>
                                    <div className="relative">
                                        <Textarea
                                            value={install_command}
                                            readOnly
                                            className="font-mono text-sm pr-12"
                                            rows={1}
                                        />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="absolute right-2 top-2 h-6 w-6 p-0"
                                            onClick={() => copyToClipboard(install_command, 'command')}
                                        >
                                            {copied === 'command' ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        This script will check dependencies and prompt for your installation token
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium mb-2">Step 2: When the script asks for your token, paste this:</h4>
                                    <div className="relative">
                                        <Textarea
                                            value={token.token ?
                                                (showToken ? token.token : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••') :
                                                'Token not available (expired/used/revoked)'
                                            }
                                            readOnly
                                            className="font-mono text-sm pr-20 bg-muted"
                                            rows={2}
                                        />
                                        {token.token && (
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
                                                        onClick={() => copyToClipboard(token.token!, 'token')}
                                                        title="Copy token"
                                                    >
                                                        {copied === 'token' ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        The script will validate this token and create a monitoring integration
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium mb-2">Step 3: Monitor will start automatically</h4>
                                    <p className="text-sm text-muted-foreground">
                                        After token validation, the script will create a local monitoring script and offer to start it immediately.
                                        File changes will appear in your BackStory dashboard within seconds.
                                    </p>
                                </div>

                                <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Important:</strong> This token can only be used once and will expire on {new Date(token.expires_at).toLocaleString()}.
                                        Keep it secure and do not share it with others.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    )}

                    {/* Token Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Token Details</CardTitle>
                            <CardDescription>Information about this installation token</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                                    <p className="text-sm">{token.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Type</label>
                                    <p className="text-sm capitalize">{token.integration_type.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <div className="mt-1">{getStatusBadge()}</div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Created By</label>
                                    <p className="text-sm">{token.created_by}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                                    <p className="text-sm">{new Date(token.created_at).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Expires</label>
                                    <p className="text-sm">{new Date(token.expires_at).toLocaleString()}</p>
                                </div>
                                {token.used_at && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Used At</label>
                                        <p className="text-sm">{new Date(token.used_at).toLocaleString()}</p>
                                    </div>
                                )}
                                {token.metadata.created_from_ip && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Created From IP</label>
                                        <p className="text-sm font-mono">{token.metadata.created_from_ip}</p>
                                    </div>
                                )}
                            </div>

                            {token.metadata.paths && token.metadata.paths.length > 0 && (
                                <div className="mt-4">
                                    <label className="text-sm font-medium text-muted-foreground">Monitored Paths</label>
                                    <ul className="mt-2 space-y-1">
                                        {token.metadata.paths.map((path, index) => (
                                            <li key={index} className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                                {path}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}