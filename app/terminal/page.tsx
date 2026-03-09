"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ArrowLeft, RefreshCw, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TerminalPage() {
    const [logs, setLogs] = useState<string>("Initializing system logs...\n");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const fetchLogs = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch('/api/algo/logs');
            const data = await res.json();
            if (data.success && data.logs) {
                setLogs(data.logs);
            } else {
                setLogs("No logs available yet.");
            }
        } catch (error) {
            setLogs("Error fetching logs. Attempting to reconnect...");
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono p-4 md:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-green-500/20 pb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => window.location.href = "/"} className="text-green-500 hover:text-green-400 hover:bg-green-500/10 cursor-pointer">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Terminal className="h-6 w-6" />
                        <h1 className="text-xl font-bold uppercase tracking-widest">System Terminal</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={fetchLogs} className={`text-green-500 hover:bg-green-500/10 cursor-pointer ${isRefreshing ? "animate-spin" : ""}`}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 bg-black/50 border border-green-500/20 rounded-lg p-4 overflow-y-auto relative shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {logs}
                </pre>
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
