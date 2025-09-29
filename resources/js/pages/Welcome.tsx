import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    X,
    Check,
    Clock,
    MessageCircle,
    Search,
    GitBranch,
    Server,
    Settings,
    Users,
    Zap,
    Eye,
    Target,
    AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Welcome() {
    return (
        <>
            <Head title="BackStory - When Production Breaks, Know Exactly What Changed" />
            <div className="min-h-screen bg-background">
                {/* Header */}
                <header className="absolute inset-x-0 top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/10">
                    <nav className="flex items-center justify-between p-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-primary/20 border border-primary/30 premium-glow activity-pulse">
                                <Activity className="h-8 w-8 text-primary activity-icon-glow" />
                            </div>
                            <span className="text-xl font-bold text-foreground">BackStory</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/login"
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Sign in
                            </Link>
                            <Button asChild>
                                <Link href="/register">
                                    Start Tracking
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </nav>
                </header>

                {/* Hero Section */}
                <section className="relative min-h-screen flex items-center justify-center px-6 py-24 overflow-hidden">
                    {/* Background gradient effects */}
                    <div className="absolute inset-x-0 -top-40 -z-20 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                        <div
                            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-red-400 to-orange-600 opacity-15 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                            style={{
                                clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                            }}
                        />
                    </div>

                    {/* Premium Animated Gradient Orbs */}
                    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                        {/* Orb 1 - Large Blue */}
                        <div
                            className="absolute w-96 h-96 rounded-full opacity-20"
                            style={{
                                background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)',
                                filter: 'blur(120px)',
                                top: '10%',
                                left: '-10%',
                                animation: 'float-orb-1 20s ease-in-out infinite',
                            }}
                        />

                        {/* Orb 2 - Medium Cyan */}
                        <div
                            className="absolute w-80 h-80 rounded-full opacity-25"
                            style={{
                                background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)',
                                filter: 'blur(100px)',
                                top: '20%',
                                right: '-15%',
                                animation: 'float-orb-2 25s ease-in-out infinite',
                            }}
                        />

                        {/* Orb 3 - Large Purple */}
                        <div
                            className="absolute w-[28rem] h-[28rem] rounded-full opacity-15"
                            style={{
                                background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)',
                                filter: 'blur(150px)',
                                bottom: '5%',
                                left: '15%',
                                animation: 'float-orb-3 18s ease-in-out infinite',
                            }}
                        />

                        {/* Orb 4 - Small Blue-Cyan */}
                        <div
                            className="absolute w-72 h-72 rounded-full opacity-30"
                            style={{
                                background: 'radial-gradient(circle, #0EA5E9 0%, transparent 70%)',
                                filter: 'blur(80px)',
                                bottom: '30%',
                                right: '20%',
                                animation: 'float-orb-4 22s ease-in-out infinite',
                            }}
                        />

                        {/* Orb 5 - Medium Blue center */}
                        <div
                            className="absolute w-64 h-64 rounded-full opacity-20"
                            style={{
                                background: 'radial-gradient(circle, #1D4ED8 0%, transparent 70%)',
                                filter: 'blur(110px)',
                                top: '45%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                animation: 'float-orb-5 24s ease-in-out infinite',
                            }}
                        />
                    </div>

                    <div className="mx-auto max-w-4xl text-center relative z-10">
                        {/* Alert badge */}
                        <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-full text-sm font-medium">
                            <AlertTriangle className="h-4 w-4" />
                            Production is down. Again.
                        </div>

                        <div className="mb-8">
                            <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl mb-4">
                                Stop Asking{' '}
                                <span className="bg-gradient-to-r from-red-400 to-orange-600 bg-clip-text text-transparent">
                                    "What Changed
                                </span>
                                {' '}Before The Crash?"
                            </h1>
                        </div>

                        <p className="mx-auto mb-12 max-w-3xl text-xl text-muted-foreground leading-relaxed">
                            Did someone push to prod? Change nginx config? Update permissions?
                            <br />
                            <span className="text-foreground font-medium">See everything that happened before the incident in one timeline.</span>
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Button size="lg" className="text-base px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700" asChild>
                                <Link href="/register">
                                    Start Tracking
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Problem Section */}
                <section className="py-24 px-6 bg-muted/30">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-foreground mb-4">
                                The Midnight Debugging Nightmare
                            </h2>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                When production breaks, every second counts. But where do you even start looking?
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            {/* Without BackStory */}
                            <div className="space-y-6">
                                <div className="text-center lg:text-left">
                                    <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center justify-center lg:justify-start gap-3">
                                        <div className="p-2 bg-destructive/20 rounded-lg">
                                            <X className="h-6 w-6 text-destructive" />
                                        </div>
                                        Without BackStory
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                                        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                                        <div>
                                            <div className="font-medium text-foreground">Production down at 3 AM</div>
                                            <div className="text-sm text-muted-foreground">Customers can't access the service</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 bg-muted/50 border border-border/50 rounded-lg">
                                        <Search className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <div className="font-medium text-foreground">Checking GitLab, server logs, deployment tools separately</div>
                                            <div className="text-sm text-muted-foreground">5 different places to check what changed</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 bg-muted/50 border border-border/50 rounded-lg">
                                        <MessageCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <div className="font-medium text-foreground">Asking in Slack "did anyone change anything?"</div>
                                            <div className="text-sm text-muted-foreground">Waking up team members, scattered responses</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                                        <Clock className="h-5 w-5 text-destructive mt-0.5" />
                                        <div>
                                            <div className="font-medium text-foreground">30 minutes wasted hunting across different places</div>
                                            <div className="text-sm text-muted-foreground">While customers are still affected</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* With BackStory */}
                            <div className="space-y-6">
                                <div className="text-center lg:text-left">
                                    <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center justify-center lg:justify-start gap-3">
                                        <div className="p-2 bg-green-500/20 rounded-lg">
                                            <Check className="h-6 w-6 text-green-600" />
                                        </div>
                                        With BackStory
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                                        <Eye className="h-5 w-5 text-green-600 mt-0.5" />
                                        <div>
                                            <div className="font-medium text-foreground">One timeline showing all changes</div>
                                            <div className="text-sm text-muted-foreground">Everything in chronological order</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                                        <Target className="h-5 w-5 text-green-600 mt-0.5" />
                                        <div>
                                            <div className="font-medium text-foreground">See exactly what happened before the incident</div>
                                            <div className="text-sm text-muted-foreground">Correlate timing with the issue</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                                        <Activity className="h-5 w-5 text-green-600 mt-0.5" />
                                        <div>
                                            <div className="font-medium text-foreground">GitLab deploys + server configs + permissions in one view</div>
                                            <div className="text-sm text-muted-foreground">All sources unified</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                                        <Zap className="h-5 w-5 text-green-600 mt-0.5" />
                                        <div>
                                            <div className="font-medium text-foreground">Find the cause in 2 minutes</div>
                                            <div className="text-sm text-muted-foreground">Get back to fixing, not hunting</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Enhanced Screenshot Section */}
                <section className="py-24 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-foreground mb-4">
                                See The Complete Picture
                            </h2>
                            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                                Real incident timeline showing GitLab deployments, server changes, and configuration updates that led to the outage
                            </p>
                        </div>

                        <div className="relative group">
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 blur-3xl rounded-3xl group-hover:from-blue-600/30 group-hover:to-cyan-600/30 transition-all duration-500"></div>

                            {/* Screenshot */}
                            <div className="relative">
                                <img
                                    src="/screenshot.png"
                                    alt="BackStory incident timeline showing multiple system changes before production outage"
                                    className="relative w-full h-auto rounded-2xl shadow-2xl opacity-90 group-hover:opacity-100 transition-all duration-500 border border-border/20 group-hover:scale-[1.02]"
                                />

                                {/* Callout annotations */}
                                <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm border border-border/50 rounded-lg p-3 max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <div className="flex items-center gap-2 mb-2">
                                        <GitBranch className="h-4 w-4 text-blue-600" />
                                        <span className="font-medium text-sm">GitLab Deploy</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Database migration deployed 5 minutes before incident</p>
                                </div>

                                <div className="absolute top-1/2 right-4 bg-background/90 backdrop-blur-sm border border-border/50 rounded-lg p-3 max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Server className="h-4 w-4 text-orange-600" />
                                        <span className="font-medium text-sm">Config Change</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Nginx upstream modified 2 minutes before crash</p>
                                </div>

                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm border border-border/50 rounded-lg p-3 max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Settings className="h-4 w-4 text-purple-600" />
                                        <span className="font-medium text-sm">Permission Update</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Database permissions changed by admin</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="py-24 px-6 bg-muted/30">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-foreground mb-4">
                                How It Works
                            </h2>
                            <p className="text-xl text-muted-foreground">
                                Three simple steps to never lose track of changes again
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="mb-6 relative">
                                    <div className="w-16 h-16 bg-primary/20 rounded-2xl mx-auto flex items-center justify-center">
                                        <Users className="h-8 w-8 text-primary" />
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-3">Connect Your Tools</h3>
                                <p className="text-muted-foreground">Link GitLab, servers, databases, and any other tools your team uses to make changes</p>
                            </div>

                            <div className="text-center">
                                <div className="mb-6 relative">
                                    <div className="w-16 h-16 bg-primary/20 rounded-2xl mx-auto flex items-center justify-center">
                                        <Activity className="h-8 w-8 text-primary" />
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-3">Auto-Track Changes</h3>
                                <p className="text-muted-foreground">All changes are automatically captured and organized in real-time as they happen</p>
                            </div>

                            <div className="text-center">
                                <div className="mb-6 relative">
                                    <div className="w-16 h-16 bg-primary/20 rounded-2xl mx-auto flex items-center justify-center">
                                        <Zap className="h-8 w-8 text-primary" />
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-3">Debug Instantly</h3>
                                <p className="text-muted-foreground">When issues arise, see exactly what changed when in one unified timeline</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Social Proof Section */}
                <section className="py-24 px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center">
                            <div className="bg-muted/50 border border-border/50 rounded-2xl p-8 lg:p-12">
                                <div className="mb-6">
                                    <div className="flex justify-center mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <blockquote className="text-2xl font-medium text-foreground mb-4">
                                        "BackStory saved our team 2 hours during our last incident. We found the problematic deployment in under 3 minutes instead of hunting through logs and git history."
                                    </blockquote>
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold">
                                            AS
                                        </div>
                                        <div className="text-left">
                                            <div className="font-semibold text-foreground">Alex Smith</div>
                                            <div className="text-sm text-muted-foreground">Senior DevOps Engineer</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Urgency CTA Section */}
                <section className="py-24 px-6 bg-gradient-to-b from-background to-muted/30">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="mb-8">
                            <h2 className="text-4xl font-bold text-foreground mb-4">
                                The Next Production Incident Is Coming
                            </h2>
                            <p className="text-xl text-muted-foreground mb-2">
                                Will you be ready?
                            </p>
                            <p className="text-muted-foreground">
                                Don't waste precious time hunting for clues when every second counts
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                            <Button
                                size="lg"
                                className="text-lg px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300"
                                asChild
                            >
                                <Link href="/register">
                                    Start Tracking Now
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Free to start • No credit card required • 2 minute setup
                        </p>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-12 px-6 border-t border-border/50">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                                <Activity className="h-6 w-6 text-primary" />
                            </div>
                            <span className="text-lg font-bold text-foreground">BackStory</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Track system changes. Debug incidents faster.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}