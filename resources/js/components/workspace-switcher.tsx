import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, usePage, router } from '@inertiajs/react';
import { ChevronsUpDown, Plus, Check } from 'lucide-react';
import { Activity } from 'lucide-react';

interface Ecosystem {
    id: number;
    name: string;
    description?: string;
}

interface WorkspaceSwitcherProps {
    ecosystems?: Ecosystem[];
    currentEcosystem?: Ecosystem | null;
}

export function WorkspaceSwitcher({ ecosystems = [], currentEcosystem }: WorkspaceSwitcherProps) {
    const [open, setOpen] = useState(false);

    // Ensure current ecosystem is included in the list
    const allEcosystems = currentEcosystem && !ecosystems.find(e => e.id === currentEcosystem.id)
        ? [currentEcosystem, ...ecosystems]
        : ecosystems;

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-auto p-3 text-left font-normal hover:bg-accent/50"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 premium-glow activity-pulse">
                            <Activity className="size-4 text-primary activity-icon-glow" />
                        </div>
                        <div className="grid flex-1 text-left text-sm">
                            <div className="font-bold text-foreground">
                                {currentEcosystem ? currentEcosystem.name : 'BackStory'}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                                {currentEcosystem ? (
                                    currentEcosystem.description || 'Current ecosystem'
                                ) : (
                                    'Select ecosystem...'
                                )}
                            </div>
                        </div>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[240px]" align="start">
                <div className="p-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                        My Ecosystems
                    </div>
                </div>
                {allEcosystems.map((ecosystem) => {
                    const isSelected = currentEcosystem?.id === ecosystem.id;
                    return (
                        <DropdownMenuItem key={ecosystem.id} asChild>
                            <Link
                                href={`/ecosystems/${ecosystem.id}`}
                                className={`flex items-center gap-2 px-2 py-2 ${
                                    isSelected
                                        ? 'bg-primary/10 text-primary'
                                        : 'hover:bg-accent hover:text-accent-foreground'
                                }`}
                            >
                                <div className={`flex aspect-square size-6 items-center justify-center rounded-md border ${
                                    isSelected ? 'bg-primary/20 border-primary/30' : 'bg-primary/10 border-primary/20'
                                }`}>
                                    <Activity className="size-3 text-primary activity-icon-glow" />
                                </div>
                                <div className="flex-1 truncate">
                                    <div className={`font-medium text-sm ${isSelected ? 'text-primary' : ''}`}>
                                        {ecosystem.name}
                                    </div>
                                    {ecosystem.description && (
                                        <div className="text-xs text-muted-foreground truncate">
                                            {ecosystem.description}
                                        </div>
                                    )}
                                </div>
                                {isSelected && (
                                    <Check className="h-4 w-4 text-primary" />
                                )}
                            </Link>
                        </DropdownMenuItem>
                    );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => {
                        setOpen(false);
                        router.visit('/dashboard?create=true');
                    }}
                    className="flex items-center gap-2 px-2 py-2 text-primary cursor-pointer"
                >
                    <div className="flex aspect-square size-6 items-center justify-center rounded-md bg-primary/10">
                        <Plus className="size-3" />
                    </div>
                    <span className="font-medium">New Ecosystem</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}