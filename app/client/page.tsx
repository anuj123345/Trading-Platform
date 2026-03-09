"use client";

import React, { useState, useEffect } from "react";
import {
    Activity,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Eye,
    EyeOff,
    Terminal as TerminalIcon,
    Play,
    CheckCircle2,
    ChevronDown,
    Bell,
    Settings,
    User,
    ArrowLeft,
    Clock,
    RefreshCw,
    LogOut
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { ApiKeysModal } from "@/components/ui/api-keys-modal";

// Types
interface Order {
    id: string;
    type: "buy" | "sell";
    symbol: string;
    quantity: number;
    price: number;
    status: "pending" | "executed" | "cancelled";
    timestamp: Date;
}

interface Position {
    symbol: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
}

// Client strategies definition (No code exposed!)
const STRATEGIES = [
    { id: "Nifty", name: "Nifty Mean Reversion", desc: "Monitors Nifty for mean reversion opportunities." },
    { id: "Bank Nifty", name: "Bank Nifty Breakout", desc: "High momentum breakout tracking for Bank Nifty." },
    { id: "Sensex", name: "Sensex Momentum", desc: "Trend following strategy for Sensex." },
    { id: "Stocks", name: "Alpha Stock Picker", desc: "Scans for high alpha individual stocks." },
];

export default function ClientPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [marginInfo, setMarginInfo] = useState({ cash: 0, used: 0 });
    const [showBalance, setShowBalance] = useState(true);
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [mounted, setMounted] = useState(false);
    const [selectedStrategy, setSelectedStrategy] = useState(STRATEGIES[0]);
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [scanPermission, setScanPermission] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { theme, setTheme } = useTheme();

    const fetchAccountData = async () => {
        try {
            // Polling the same secure sync endpoint
            const res = await fetch("/api/algo/sync");
            const result = await res.json();

            if (result.success && result.data) {
                const { marginInfo, positions, orders } = result.data;

                if (marginInfo) {
                    setMarginInfo(marginInfo);
                }

                if (Array.isArray(positions)) {
                    setPositions(positions);
                }

                if (Array.isArray(orders)) {
                    setOrders(orders);
                }
            }
        } catch (e) {
            console.error("Failed to fetch sync data", e);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchAccountData();
        const accountInterval = setInterval(fetchAccountData, 10000);
        setCurrentTime(new Date());
        const timerInterval = setInterval(() => setCurrentTime(new Date()), 1000);

        return () => {
            clearInterval(accountInterval);
            clearInterval(timerInterval);
        };
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(value);
    };

    const handleScan = async () => {
        setIsScanning(true);
        try {
            const res = await fetch("/api/env/check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ permissionGranted: true, action: "scan" }),
            });
            const result = await res.json();
            if (result.success) {
                setScanResult(result.data);
                setScanPermission(true);
            }
        } catch (e) {
            console.error("Scan failed", e);
        } finally {
            setIsScanning(false);
        }
    };

    const handleOpenIDE = async () => {
        try {
            // Secure launch: only sending strategyId, NO code from frontend
            const res = await fetch("/api/env/check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "open",
                    strategyId: selectedStrategy.id,
                    filename: "strategy_runner.py"
                }),
            });
            const result = await res.json();
            if (!result.success) {
                alert(result.error || "Failed to launch IDE securely.");
            }
        } catch (e) {
            console.error("Launch failed", e);
            alert("An error occurred while trying to launch the strategy.");
        }
    };

    const portfolioValue = positions.reduce((acc, pos) => acc + (pos.quantity * pos.currentPrice), 0);
    const totalPnL = positions.reduce((acc, pos) => acc + pos.pnl, 0);
    const investedValue = portfolioValue - totalPnL;
    const totalPnLPercent = investedValue !== 0 ? (totalPnL / investedValue) * 100 : 0;
    const isDark = mounted && (theme === "dark" || (theme === "system" && typeof window !== 'undefined' && window.matchMedia("(prefers-color-scheme: dark)").matches));

    return (
        <div className="min-h-screen bg-background text-foreground relative pb-12">
            {/* Header */}
            <div className="border-b border-border bg-card relative">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => window.location.href = "/"} className="cursor-pointer">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="flex items-center gap-2">
                                <User className="h-6 w-6 text-primary" />
                                <h1 className="text-xl font-bold">Client Dashboard</h1>
                            </div>
                            <Badge variant="outline" className="gap-1 ml-2">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                Connected
                            </Badge>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-xs text-muted-foreground hidden md:flex items-center gap-2 mr-2 border-r border-border pr-4">
                                <Clock className="h-3 w-3" />
                                <span>{currentTime ? currentTime.toLocaleTimeString() : "--:--:--"}</span>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="cursor-pointer">
                                        <User className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem className="cursor-pointer text-muted-foreground disabled:opacity-50" disabled>
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="cursor-pointer text-destructive focus:text-destructive"
                                        onClick={() => window.location.href = "/login"}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Logout</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>

            {/* Portfolio Summary */}
            <div className="border-b border-border bg-muted/20 backdrop-blur-sm sticky top-0 z-10 transition-all duration-300">
                <div className="container mx-auto px-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="flex flex-col gap-1 p-2">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Portfolio Value</span>
                                    <button
                                        onClick={() => {
                                            setIsRefreshing(true);
                                            fetchAccountData().finally(() => setIsRefreshing(false));
                                        }}
                                        disabled={isRefreshing}
                                        className="text-muted-foreground hover:text-primary cursor-pointer transition-all disabled:opacity-50"
                                        title="Refresh Account Data"
                                    >
                                        <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
                                    </button>
                                </div>
                                <button onClick={() => setShowBalance(!showBalance)} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                                    {showBalance ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                </button>
                            </div>
                            <div className="text-3xl font-black font-mono">
                                {showBalance ? formatCurrency(portfolioValue) : "••••••••"}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 p-2">
                            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Total Day P&L</span>
                            <div className={`text-3xl font-black font-mono flex items-center gap-2 ${totalPnL >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                {totalPnL >= 0 ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
                                {showBalance ? formatCurrency(Math.abs(totalPnL)) : "••••••••"}
                                <span className="text-sm font-bold opacity-80">({totalPnLPercent.toFixed(2)}%)</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 p-2">
                            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Available Margin</span>
                            <div className="text-3xl font-black font-mono text-primary">
                                {showBalance ? formatCurrency(marginInfo.cash) : "••••••••"}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 p-2">
                            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Margin Used</span>
                            <div className="text-3xl font-black font-mono">
                                {showBalance ? formatCurrency(marginInfo.used) : "••••••••"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column - Strategy Choice & Account Status */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                            <CardHeader className="bg-muted/30 border-b border-border/50">
                                <CardTitle className="text-lg">Available Strategies</CardTitle>
                                <CardDescription>Select an approved strategy to deploy</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="flex flex-col">
                                    {STRATEGIES.map((strat) => {
                                        const isSelected = selectedStrategy.id === strat.id;
                                        return (
                                            <div key={strat.id} className="flex flex-col border-b border-border/30 last:border-0">
                                                <button
                                                    onClick={() => setSelectedStrategy(strat)}
                                                    className={`flex items-center justify-between p-4 text-left hover:bg-primary/5 transition-all cursor-pointer ${isSelected ? "bg-primary/10 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"}`}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm tracking-tight">{strat.name}</span>
                                                        <span className="text-[10px] text-muted-foreground uppercase font-mono mt-1">Status: Approved</span>
                                                    </div>
                                                </button>

                                                {isSelected && (
                                                    <div className="px-4 pb-4 space-y-3 bg-primary/5 animate-in slide-in-from-top-1 duration-200">
                                                        {!scanPermission ? (
                                                            <div className="pt-2">
                                                                <Button
                                                                    onClick={handleScan}
                                                                    disabled={isScanning}
                                                                    size="sm"
                                                                    className="w-full text-[10px] h-8 bg-zinc-800 hover:bg-zinc-700 text-white gap-2 cursor-pointer"
                                                                >
                                                                    {isScanning ? <Activity className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                                                                    Setup Secure Runner
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div className="pt-2 space-y-2">
                                                                <div className="flex items-center justify-between text-[10px]">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={`w-2 h-2 rounded-full ${scanResult?.python?.installed ? "bg-emerald-500" : "bg-rose-500"}`} title={scanResult?.isVercel ? "Disabled on Vercel" : ""} />
                                                                        <span className="font-bold text-muted-foreground">Python Engine:</span>
                                                                        <span>{scanResult?.python?.installed ? scanResult.python.version : (scanResult?.isVercel ? "Cloud Mode" : "Not Found")}</span>
                                                                    </div>
                                                                </div>
                                                                {scanResult?.isVercel && (
                                                                    <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg mt-2 animate-in fade-in zoom-in duration-300">
                                                                        <p className="text-[10px] leading-relaxed text-blue-400/80">
                                                                            <strong className="text-blue-400 block mb-1">PRO-TIP: SECURE RUNNER</strong>
                                                                            You are viewing the Cloud Version. For security, web browsers cannot scan your local files from a public URL.
                                                                            <br /><br />
                                                                            To use the <strong>IDE & Local Runner</strong>, simply run this project on your computer:
                                                                            <code className="block mt-1 bg-black/40 p-1 rounded text-primary">npm run dev</code>
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {scanResult?.python?.installed && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="default"
                                                                        className="w-full h-8 text-[12px] gap-2 border-primary/20 cursor-pointer mt-2"
                                                                        onClick={handleOpenIDE}
                                                                    >
                                                                        <Play className="h-3 w-3" /> Run Securely
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Active Positions</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[300px] overflow-y-auto">
                                    {positions.length > 0 ? positions.map((pos, i) => (
                                        <div key={i} className="p-4 border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-black text-sm font-mono">{pos.symbol}</span>
                                                <Badge variant="outline" className="font-mono">{pos.quantity} Qty</Badge>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">Avg: ₹{pos.avgPrice.toFixed(2)}</span>
                                                <span className={`font-black font-mono ${pos.pnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                    {pos.pnl >= 0 ? "+" : ""}{formatCurrency(pos.pnl)}
                                                </span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-8 text-center text-muted-foreground italic text-sm">
                                            No active positions found
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Strategy Detail & Logs (NO CODE) */}
                    <div className="lg:col-span-8 space-y-6">
                        <Card className="border-primary/20 border-2 bg-black/40 backdrop-blur-xl">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-border/30 pb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">SECURE EXECUTION</Badge>
                                    </div>
                                    <CardTitle className="text-2xl font-black tracking-tight">{selectedStrategy.name}</CardTitle>
                                    <CardDescription className="mt-1 flex items-center gap-2">
                                        End-to-end encrypted strategy execution
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">About This Strategy</h3>
                                        <div className="p-4 bg-muted/40 rounded-xl border border-border/30">
                                            <p className="text-sm leading-relaxed text-muted-foreground">
                                                {selectedStrategy.desc}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">Deployment Instructions</h3>
                                        <ol className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <li className="p-4 bg-muted/40 rounded-xl border border-border/30 flex flex-col gap-2 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-2 opacity-50"><Settings className="w-12 h-12 text-muted-foreground" /></div>
                                                <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold relative z-10">1</div>
                                                <p className="text-xs leading-relaxed font-medium relative z-10">Click <strong>"Setup Secure Runner"</strong> in the sidebar to securely link your local environment.</p>
                                            </li>
                                            <li className="p-4 bg-green-900/20 rounded-xl border border-green-500/30 flex flex-col gap-2 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-2 opacity-50"><Play className="w-12 h-12 text-green-500" /></div>
                                                <div className="h-6 w-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs font-bold relative z-10">2</div>
                                                <p className="text-xs leading-relaxed font-medium relative z-10">Click <strong>"Run Securely"</strong>. The algorithm will execute locally without exposing proprietary IP.</p>
                                            </li>
                                        </ol>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity / Order Logs */}
                        <Card className="border-border/50 bg-card/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base uppercase tracking-wider text-muted-foreground font-bold">Live Execution Activity</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[300px] overflow-y-auto px-4 pb-4">
                                    {orders.length > 0 ? orders.map((order) => (
                                        <div key={order.id} className="flex items-center justify-between py-3 border-b border-border/10 last:border-0">
                                            <div className="flex items-center gap-4">
                                                <Badge className={order.type === "buy" ? "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30" : "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30"}>
                                                    {order.type.toUpperCase()}
                                                </Badge>
                                                <div>
                                                    <div className="font-black text-sm font-mono">{order.symbol}</div>
                                                    <div className="text-[10px] text-muted-foreground uppercase font-medium">
                                                        {order.quantity} Shares @ {formatCurrency(order.price)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1 ${order.status === 'executed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                                                    {order.status.toUpperCase()}
                                                </div>
                                                <div className="text-[10px] font-mono text-muted-foreground">
                                                    {order.timestamp.toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 text-muted-foreground text-sm font-medium border-2 border-dashed border-border/30 rounded-xl mt-2">
                                            No algorithmic trades detected today
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
