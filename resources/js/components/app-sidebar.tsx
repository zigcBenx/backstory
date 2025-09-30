import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Settings, Link as LinkIcon, ArrowLeft, Terminal } from 'lucide-react';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/zigcBenx/backstory',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const page = usePage();
    const currentUrl = page.url;

    // Extract ecosystem ID from URL pattern like /ecosystems/1 or /ecosystems/1/activity-types
    const ecosystemMatch = currentUrl.match(/\/ecosystems\/(\d+)/);
    const ecosystemId = ecosystemMatch ? ecosystemMatch[1] : null;
    const isOnEcosystemPage = ecosystemId !== null;
    const isOnActivityTypesPage = currentUrl.includes('/activity-types');

    // Get ecosystem data from page props if available
    const currentEcosystem = (page.props as any)?.ecosystem || null;
    const ecosystems = (page.props as any)?.ecosystems || [];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <WorkspaceSwitcher
                    ecosystems={ecosystems}
                    currentEcosystem={currentEcosystem}
                />
            </SidebarHeader>

            <SidebarContent>
                {isOnEcosystemPage ? (
                    <SidebarGroup>
                        <SidebarGroupLabel>Settings</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={isOnActivityTypesPage}>
                                        <Link href={`/ecosystems/${ecosystemId}/activity-types`}>
                                            <Settings className="h-4 w-4" />
                                            <span>Activity Types</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href={`/ecosystems/${ecosystemId}/integrations`}>
                                            <LinkIcon className="h-4 w-4" />
                                            <span>Integrations</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href={`/ecosystems/${ecosystemId}/installation-tokens`}>
                                            <Terminal className="h-4 w-4" />
                                            <span>Installation Tokens</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ) : (
                    <NavMain items={mainNavItems} />
                )}
            </SidebarContent>

            <SidebarFooter>
                {isOnEcosystemPage && (
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href={dashboard()}>
                                            <ArrowLeft className="h-4 w-4" />
                                            <span>Back to Dashboard</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
                <NavFooter items={footerNavItems} />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
