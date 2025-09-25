import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface ActivityType {
    id: number;
    name: string;
    color: string;
    icon?: string;
}

interface Ecosystem {
    id: number;
    name: string;
    activity_types: ActivityType[];
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    ecosystem: Ecosystem;
}

export function CreateActivityModal({ isOpen, onClose, ecosystem }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        activity_type_id: '',
        title: '',
        description: '',
        user_name: '',
        metadata: {},
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        post(`/ecosystems/${ecosystem.id}/activities`, {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const getIconComponent = (iconName?: string) => {
        switch (iconName) {
            case 'server':
                return '🖥️';
            case 'rocket':
                return '🚀';
            case 'shield':
                return '🛡️';
            case 'database':
                return '🗄️';
            default:
                return '📋';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Activity</DialogTitle>
                    <DialogDescription>
                        Track a new change or activity in {ecosystem.name}.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="activity_type_id">Activity Type</Label>
                            <Select
                                value={data.activity_type_id}
                                onValueChange={(value) => setData('activity_type_id', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select activity type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ecosystem.activity_types.map((type) => (
                                        <SelectItem key={type.id} value={type.id.toString()}>
                                            <div className="flex items-center gap-2">
                                                <span>{getIconComponent(type.icon)}</span>
                                                <span>{type.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.activity_type_id && (
                                <p className="text-sm text-destructive">{errors.activity_type_id}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Updated user permissions"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                            />
                            {errors.title && (
                                <p className="text-sm text-destructive">{errors.title}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description (optional)</Label>
                            <Textarea
                                id="description"
                                placeholder="Provide more details about this activity..."
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={3}
                            />
                            {errors.description && (
                                <p className="text-sm text-destructive">{errors.description}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="user_name">User Name</Label>
                            <Input
                                id="user_name"
                                placeholder="Who made this change?"
                                value={data.user_name}
                                onChange={(e) => setData('user_name', e.target.value)}
                            />
                            {errors.user_name && (
                                <p className="text-sm text-destructive">{errors.user_name}</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Adding...' : 'Add Activity'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}