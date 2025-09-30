import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
    ecosystem: {
        id: number;
        name: string;
    };
}

export default function CreateInstallationToken({ ecosystem }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        integration_type: 'server_monitor',
        expires_hours: 24,
        paths: [] as string[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('ecosystems.installation-tokens.store', ecosystem.id));
    };

    return (
        <div className="min-h-screen bg-background">
            <Head title={`Create Installation Token - ${ecosystem.name}`} />

            <div className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Header */}
                <div className="flex items-center space-x-4 mb-6">
                    <Link
                        href={route('ecosystems.installation-tokens.index', ecosystem.id)}
                        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Tokens
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Create Installation Token</h1>
                        <p className="text-muted-foreground">{ecosystem.name}</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Plus className="w-5 h-5 mr-2" />
                            New Installation Token
                        </CardTitle>
                        <CardDescription>
                            Create a secure token to install BackStory monitoring on your servers
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
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
                                <p className="text-sm text-muted-foreground">
                                    A descriptive name to help you identify this token
                                </p>
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
                                <p className="text-sm text-muted-foreground">
                                    The type of monitoring to install
                                </p>
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
                                <p className="text-sm text-muted-foreground">
                                    How long the token remains valid for installation
                                </p>
                            </div>

                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Security Notice:</strong> Installation tokens are single-use and will be automatically
                                    deactivated after successful installation. You can revoke tokens at any time from the token management page.
                                </AlertDescription>
                            </Alert>

                            <div className="flex justify-end space-x-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    asChild
                                >
                                    <Link href={route('ecosystems.installation-tokens.index', ecosystem.id)}>
                                        Cancel
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Creating...' : 'Create Token'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}