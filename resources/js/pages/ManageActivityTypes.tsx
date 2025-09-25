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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { Plus, MoreHorizontal, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface ActivityType {
    id: number;
    name: string;
    color: string;
    icon?: string;
    activities_count?: number;
}

interface Ecosystem {
    id: number;
    name: string;
    description?: string;
    activity_types: ActivityType[];
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
    {
        title: 'Manage Activity Types',
        href: `/ecosystems/${ecosystem.id}/activity-types`,
    },
];

const iconOptions = [
    { value: 'server', label: '🖥️ Server' },
    { value: 'rocket', label: '🚀 Rocket' },
    { value: 'shield', label: '🛡️ Shield' },
    { value: 'database', label: '🗄️ Database' },
    { value: 'gear', label: '⚙️ Gear' },
    { value: 'user', label: '👤 User' },
    { value: 'file', label: '📄 File' },
    { value: 'code', label: '💻 Code' },
];

const colorOptions = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
    '#ec4899', '#6366f1', '#14b8a6', '#eab308'
];

export default function ManageActivityTypes({ ecosystem }: Props) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<ActivityType | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        color: '#3b82f6',
        icon: 'server',
    });

    const handleCreate: FormEventHandler = (e) => {
        e.preventDefault();
        post(`/ecosystems/${ecosystem.id}/activity-types`, {
            onSuccess: () => {
                reset();
                setIsCreateModalOpen(false);
            },
        });
    };

    const handleUpdate: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingType) return;

        put(`/activity-types/${editingType.id}`, {
            onSuccess: () => {
                reset();
                setEditingType(null);
            },
        });
    };

    const handleDelete = (activityType: ActivityType) => {
        if (window.confirm(`Are you sure you want to delete "${activityType.name}"?`)) {
            destroy(`/activity-types/${activityType.id}`);
        }
    };

    const openEditModal = (activityType: ActivityType) => {
        setData({
            name: activityType.name,
            color: activityType.color,
            icon: activityType.icon || 'server',
        });
        setEditingType(activityType);
    };

    const closeModal = () => {
        reset();
        setIsCreateModalOpen(false);
        setEditingType(null);
    };

    const getIconComponent = (iconName?: string) => {
        const option = iconOptions.find(opt => opt.value === iconName);
        return option ? option.label.split(' ')[0] : '📋';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(ecosystem)}>
            <Head title={`Manage Activity Types - ${ecosystem.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/ecosystems/${ecosystem.id}`}>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Ecosystem
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Activity Types</h1>
                            <p className="text-muted-foreground">
                                Manage activity types for {ecosystem.name}
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Activity Type
                    </Button>
                </div>

                {ecosystem.activity_types.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="text-center">
                            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                <Plus className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold">No activity types yet</h3>
                            <p className="mb-4 text-muted-foreground max-w-sm">
                                Activity types help categorize your ecosystem changes. Default types were created when you set up this ecosystem.
                            </p>
                            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add First Activity Type
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {ecosystem.activity_types.map((activityType) => (
                            <Card key={activityType.id} className="relative">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <Badge
                                            variant="secondary"
                                            className="font-normal w-fit"
                                            style={{
                                                backgroundColor: `${activityType.color}20`,
                                                color: activityType.color,
                                                borderColor: `${activityType.color}40`,
                                            }}
                                        >
                                            <span className="mr-1">
                                                {getIconComponent(activityType.icon)}
                                            </span>
                                            {activityType.name}
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEditModal(activityType)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(activityType)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-muted-foreground">
                                        Color: {activityType.color}
                                    </div>
                                    {activityType.activities_count !== undefined && (
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {activityType.activities_count} activities
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Create/Edit Modal */}
                <Dialog open={isCreateModalOpen || editingType !== null} onOpenChange={closeModal}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>
                                {editingType ? 'Edit Activity Type' : 'Create Activity Type'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingType
                                    ? 'Update the activity type details.'
                                    : 'Add a new activity type to categorize ecosystem activities.'
                                }
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={editingType ? handleUpdate : handleCreate}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., Code Deploy, Database Migration"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="color">Color</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {colorOptions.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                className={`h-8 w-8 rounded-full border-2 ${
                                                    data.color === color
                                                        ? 'border-foreground'
                                                        : 'border-transparent'
                                                }`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => setData('color', color)}
                                            />
                                        ))}
                                    </div>
                                    {errors.color && (
                                        <p className="text-sm text-destructive">{errors.color}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="icon">Icon</Label>
                                    <Select
                                        value={data.icon}
                                        onValueChange={(value) => setData('icon', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select icon" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {iconOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.icon && (
                                        <p className="text-sm text-destructive">{errors.icon}</p>
                                    )}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={closeModal}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? (editingType ? 'Updating...' : 'Creating...')
                                        : (editingType ? 'Update' : 'Create')
                                    }
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}