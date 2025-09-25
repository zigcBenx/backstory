import { Head, Link } from '@inertiajs/react';
import { Activity, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Welcome() {
    return (
        <>
            <Head title="BackStory - Track Your Ecosystem Changes" />
            <div className="min-h-screen bg-background">
                {/* Header */}
                <header className="absolute inset-x-0 top-0 z-50">
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
                                    Get Started
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </nav>
                </header>

                {/* Hero Section */}
                <main className="relative flex min-h-screen items-center justify-center px-6 py-24">
                    <div className="mx-auto max-w-4xl text-center">
                        {/* Gradient background effect */}
                        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                            <div
                                className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-cyan-400 to-blue-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                                style={{
                                    clipPath:
                                        'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                                }}
                            />
                        </div>

                        <div className="mb-8">
                            <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl">
                                Track Your{' '}
                                <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
                                    Ecosystem
                                </span>
                                {' '}Changes
                            </h1>
                        </div>

                        <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground leading-relaxed">
                            Keep track of all system changes, deployments, and updates across your entire ecosystem.
                            Never lose track of what happened when.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Button size="lg" className="text-base px-8 py-3" asChild>
                                <Link href="/register">
                                    Start Tracking
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="text-base px-8 py-3 border-border/50 hover:border-primary/50"
                                asChild
                            >
                                <Link href="/login">
                                    Sign In
                                </Link>
                            </Button>
                        </div>

                        {/* Screenshot Preview */}
                        <div className="mt-16 relative">
                            <div className="relative mx-auto max-w-5xl">
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-600/20 blur-3xl rounded-3xl"></div>
                                <img
                                    src="/screenshot.png"
                                    alt="BackStory Dashboard Interface"
                                    className="relative w-full h-auto rounded-2xl shadow-2xl opacity-80 hover:opacity-90 transition-opacity duration-500 border border-border/20"
                                    style={{
                                        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)',
                                        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Feature highlights */}
                        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
                            <div className="text-center">
                                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                                    <Activity className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">Timeline View</h3>
                                <p className="text-muted-foreground">Visualize all changes in a beautiful timeline interface</p>
                            </div>
                            <div className="text-center">
                                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                                    <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">Custom Categories</h3>
                                <p className="text-muted-foreground">Organize changes with custom activity types and colors</p>
                            </div>
                            <div className="text-center">
                                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                                    <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">Team Collaboration</h3>
                                <p className="text-muted-foreground">Share ecosystems with your team members</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom gradient effect */}
                    <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
                        <div
                            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-cyan-400 to-blue-600 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
                            style={{
                                clipPath:
                                    'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                            }}
                        />
                    </div>
                </main>
            </div>
        </>
    );
}