import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Sparkles } from 'lucide-react';

interface ActivityType {
    id: number;
    name: string;
    color: string;
    icon?: string;
}

interface ActivityFiltersProps {
    activityTypes: ActivityType[];
    selectedTypes: number[];
    onTypesChange: (types: number[]) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    totalResults: number;
}

export function ActivityFilters({
    activityTypes,
    selectedTypes,
    onTypesChange,
    searchQuery,
    onSearchChange,
    totalResults,
}: ActivityFiltersProps) {
    const [showFilters, setShowFilters] = useState(false);

    const toggleType = (typeId: number) => {
        if (selectedTypes.includes(typeId)) {
            onTypesChange(selectedTypes.filter((t) => t !== typeId));
        } else {
            onTypesChange([...selectedTypes, typeId]);
        }
    };

    const clearFilters = () => {
        onTypesChange([]);
        onSearchChange('');
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
        <div className="glass-effect gradient-border rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search activities..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-12 pr-4 py-3 glass-effect border-border/50 focus:border-primary/50 focus:premium-glow transition-all duration-300 text-base"
                        />
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`glass-effect border-border/50 hover:border-primary/50 transition-all duration-300 px-4 py-3 ${
                            showFilters ? 'premium-glow border-primary/50' : ''
                        }`}
                    >
                        <Filter className="h-5 w-5 mr-2" />
                        Filters
                        {selectedTypes.length > 0 && (
                            <Badge
                                variant="secondary"
                                className="ml-2 px-2 py-1 text-xs bg-primary/20 text-primary border-primary/30"
                            >
                                {selectedTypes.length}
                            </Badge>
                        )}
                    </Button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 glass-effect px-4 py-2 rounded-lg border border-border/30">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">{totalResults} results</span>
                    </div>
                    {(selectedTypes.length > 0 || searchQuery) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {showFilters && (
                <div className="border-t border-border/30 pt-5">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">Activity Types</h3>
                            <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {activityTypes.map((type) => {
                                const isSelected = selectedTypes.includes(type.id);
                                return (
                                    <Button
                                        key={type.id}
                                        variant={isSelected ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => toggleType(type.id)}
                                        className={`glass-effect transition-all duration-300 px-4 py-2 ${
                                            isSelected
                                                ? 'border-primary/50 text-primary premium-glow'
                                                : 'border-border/50 hover:border-primary/30 hover:bg-primary/5'
                                        }`}
                                        style={
                                            isSelected
                                                ? {
                                                      backgroundColor: `${type.color}20`,
                                                      borderColor: `${type.color}50`,
                                                      color: type.color,
                                                  }
                                                : {}
                                        }
                                    >
                                        <span className="mr-2">{getIconComponent(type.icon)}</span>
                                        {type.name}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}