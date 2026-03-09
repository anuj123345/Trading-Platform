"use client"

import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
    TrendingUp,
    TrendingDown,
    Clock,
    Eye,
    EyeOff,
    BarChart3,
    DollarSign,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Menu,
    Bell,
    Search,
    Filter,
    MoreVertical
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Asset {
    id: string;
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    volume24h: number;
    marketCap: number;
    sparkline: number[];
    holdings?: number;
    value?: number;
}

const mockAssets: Asset[] = [
    {
        id: "1",
        symbol: "AAPL",
        name: "Apple Inc.",
        price: 178.45,
        change24h: 2.34,
        volume24h: 52847392,
        marketCap: 2847392847392,
        sparkline: [175.2, 176.1, 175.8, 176.5, 177.2, 176.9, 177.5, 178.1, 178.45],
        holdings: 50,
        value: 8922.50
    },
    {
        id: "2",
        symbol: "MSFT",
        name: "Microsoft Corp.",
        price: 412.83,
        change24h: -1.27,
        volume24h: 28453921,
        marketCap: 3092578623410,
        sparkline: [418.3, 416.1, 415.5, 414.2, 413.8, 413.2, 412.9, 412.5, 412.83],
        holdings: 25,
        value: 10320.75
    },
    {
        id: "3",
        symbol: "GOOGL",
        name: "Alphabet Inc.",
        price: 142.65,
        change24h: 3.86,
        volume24h: 19845391,
        marketCap: 1847519283740,
        sparkline: [137.2, 138.4, 139.1, 139.8, 140.5, 141.2, 141.8, 142.3, 142.65],
        holdings: 75,
        value: 10698.75
    },
    {
        id: "4",
        symbol: "TSLA",
        name: "Tesla Inc.",
        price: 248.32,
        change24h: 5.12,
        volume24h: 98567123,
        marketCap: 789456123456,
        sparkline: [236.1, 238.3, 240.5, 242.4, 244.7, 245.8, 246.9, 247.5, 248.32],
        holdings: 30,
        value: 7449.60
    }
];

const SparklineChart = ({ data, color, width = 80, height = 30 }: { data: number[], color: string, width?: number, height?: number }) => {
    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);
    const range = maxVal - minVal || 1;

    const points = data.map((value, index) => {
        const x = (data.length > 1 ? (index / (data.length - 1)) : 0.5) * width;
        const y = height - (range !== 0 ? ((value - minVal) / range) * height : height / 2);
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="overflow-visible">
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

const TradingDashboard = () => {
    const [mounted, setMounted] = useState(false);
    const [assets, setAssets] = useState<Asset[]>(mockAssets);
    const [selectedAsset, setSelectedAsset] = useState<Asset>(mockAssets[0]);
    const [timeFrame, setTimeFrame] = useState<'1D' | '1W' | '1M'>('1D');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showBalance, setShowBalance] = useState(true);
    const shouldReduceMotion = useReducedMotion();

    const portfolioValue = assets.reduce((sum, asset) => sum + (asset.value || 0), 0);
    const portfolioChange = 2847.32;

    useEffect(() => {
        setMounted(true);
        const interval = setInterval(() => {
            setAssets(prev => prev.map(asset => {
                const change = asset.price * (Math.random() * 0.002 - 0.001);
                const newPrice = asset.price + change;
                return {
                    ...asset,
                    price: newPrice,
                    sparkline: [...asset.sparkline.slice(1), newPrice],
                    value: asset.holdings ? asset.holdings * newPrice : asset.value
                };
            }));
            setCurrentTime(new Date());
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <BarChart3 className="h-8 w-8 text-primary" />
                    <h1 className="text-2xl font-bold">Trading Dashboard</h1>
                </div>
                <div className="flex items-center gap-4">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{mounted ? currentTime.toLocaleTimeString() : '--:--:--'}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Market Overview: {selectedAsset.symbol}</CardTitle>
                        <div className="flex gap-2">
                            {['1D', '1W', '1M'].map((tf) => (
                                <button
                                    key={tf}
                                    onClick={() => setTimeFrame(tf as any)}
                                    className={`px-3 py-1 text-xs rounded ${timeFrame === tf ? 'bg-primary text-white' : 'bg-muted'}`}
                                >
                                    {tf}
                                </button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center bg-muted/20 rounded-lg m-6">
                        <SparklineChart
                            data={selectedAsset.sparkline}
                            color={selectedAsset.change24h >= 0 ? "#10B981" : "#EF4444"}
                            width={600}
                            height={200}
                        />
                    </CardContent>
                    <div className="px-6 pb-6 flex gap-4">
                        <div className="flex-1 p-4 bg-muted/30 rounded-lg">
                            <div className="text-sm text-muted-foreground">Price</div>
                            <div className="text-xl font-bold">{formatCurrency(selectedAsset.price)}</div>
                        </div>
                        <div className="flex-1 p-4 bg-muted/30 rounded-lg">
                            <div className="text-sm text-muted-foreground">24h Change</div>
                            <div className={selectedAsset.change24h >= 0 ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                                {selectedAsset.change24h}%
                            </div>
                        </div>
                    </div>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Your Portfolio</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-muted-foreground font-medium">Total Balance</span>
                                <button onClick={() => setShowBalance(!showBalance)}>
                                    {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </button>
                            </div>
                            <div className="text-2xl font-bold">
                                {showBalance ? formatCurrency(portfolioValue) : "••••••••"}
                            </div>
                        </div>
                        <div className="space-y-2">
                            {assets.map((asset) => (
                                <motion.div
                                    key={asset.id}
                                    className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-lg cursor-pointer border border-transparent hover:border-border transition-all"
                                    onClick={() => setSelectedAsset(asset)}
                                    whileHover={{ x: 5 }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center font-bold text-xs">
                                            {asset.symbol[0]}
                                        </div>
                                        <div>
                                            <div className="font-semibold">{asset.symbol}</div>
                                            <div className="text-xs text-muted-foreground">{asset.name}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium">{formatCurrency(asset.price)}</div>
                                        <div className={`text-xs ${asset.change24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                                            {asset.change24h >= 0 ? "↑" : "↓"} {Math.abs(asset.change24h)}%
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TradingDashboard;
