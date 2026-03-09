"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle2, AlertCircle, Loader2, Instagram, MessageSquare, Database, Sparkles, ShieldCheck, Bug, Wrench } from 'lucide-react';

export function AutomationShowcase() {
    const [activeTab, setActiveTab] = useState<'workflow' | 'guardian'>('workflow');
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [debugResults, setDebugResults] = useState<any[]>([]);

    const triggerAutomation = async () => {
        setStatus('running');
        setMessage('Triggering AI Instagram Workflow...');

        try {
            const response = await fetch('/api/automation/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ hashtags: ['blender3d', 'isometric'] }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage('Workflow triggered! Checking logs and Telegram for progress.');
            } else {
                setStatus('error');
                setMessage(data.error || 'Failed to trigger workflow');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Network error occurred');
        }
    };

    const triggerGuardian = async () => {
        setStatus('running');
        setMessage('Guardian is scanning codebase...');
        try {
            const response = await fetch('/api/automation/debug', { method: 'POST' });
            const data = await response.json();
            if (response.ok) {
                setDebugResults(data.findings || []);
                setStatus('success');
                setMessage(data.message);
            } else {
                setStatus('error');
                setMessage(data.error || 'Guardian failed to scan');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Network error occurred');
        }
    };

    const steps = [
        { icon: <Instagram className="w-4 h-4" />, label: "Trend Scraping" },
        { icon: <Database className="w-4 h-4" />, label: "DB Verification" },
        { icon: <Sparkles className="w-4 h-4" />, label: "GPT-4o Analysis" },
        { icon: <Play className="w-4 h-4" />, label: "Flux Generation" },
    ];

    return (
        <div className="w-full max-w-4xl mx-auto p-6">
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => { setActiveTab('workflow'); setStatus('idle'); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'workflow' ? 'bg-white text-black' : 'text-gray-400 hover:text-white bg-white/5'}`}
                >
                    Instagram Workflow
                </button>
                <button
                    onClick={() => { setActiveTab('guardian'); setStatus('idle'); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'guardian' ? 'bg-white text-black' : 'text-gray-400 hover:text-white bg-white/5'}`}
                >
                    Mistake Guardian
                </button>
            </div>

            <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative group rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 overflow-hidden"
            >
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors duration-500" />

                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
                    <div className="flex-1">
                        {activeTab === 'workflow' ? (
                            <>
                                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                    <Sparkles className="w-6 h-6 text-blue-400" />
                                    AI Content Engine
                                </h3>
                                <p className="text-gray-400 mb-6 max-w-md">
                                    Automated Instagram creation pipeline. Discover trends, analyze aesthetics, generate unique assets, and publish.
                                </p>
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    {steps.map((step, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                            <div className="p-2 rounded-lg bg-white/5 border border-white/10">{step.icon}</div>
                                            {step.label}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={triggerAutomation}
                                    disabled={status === 'running'}
                                    className="px-8 py-3 rounded-xl bg-white text-black font-semibold hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {status === 'running' ? 'Processing...' : 'Run Pipeline'}
                                </button>
                            </>
                        ) : (
                            <>
                                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                    <ShieldCheck className="w-6 h-6 text-green-400" />
                                    Mistake Guardian
                                </h3>
                                <p className="text-gray-400 mb-6 max-w-md">
                                    Autonomous backend agent that scans and fixes common mistakes like missing "use client" or hydration mismatches.
                                </p>

                                {debugResults.length > 0 && (
                                    <div className="mb-6 space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                        {debugResults.map((res, i) => (
                                            <div key={i} className="flex items-start gap-2 text-xs p-2 rounded bg-white/5 border border-white/10">
                                                {res.fixed ? <Wrench className="w-3 h-3 text-green-400 mt-0.5" /> : <Bug className="w-3 h-3 text-red-400 mt-0.5" />}
                                                <div>
                                                    <p className="text-white font-mono break-all">{res.file}</p>
                                                    <p className="text-gray-400">{res.issue} {res.fixed && <span className="text-green-500 font-bold">(FIXED)</span>}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={triggerGuardian}
                                    disabled={status === 'running'}
                                    className="px-8 py-3 rounded-xl bg-white text-black font-semibold hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {status === 'running' ? 'Scanning...' : 'Scan & Fix Code'}
                                </button>
                            </>
                        )}
                    </div>

                    <div className="w-full md:w-64 h-64 relative">
                        <div className="absolute inset-0 rounded-2xl border border-white/10 bg-black/40 flex flex-col items-center justify-center p-6 text-center">
                            <AnimatePresence mode="wait">
                                {status === 'idle' && (
                                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-500">
                                        <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                        <p className="text-xs uppercase tracking-widest font-bold">Standby</p>
                                    </motion.div>
                                )}
                                {status === 'running' && (
                                    <motion.div key="running" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-blue-400">
                                        <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
                                        <p className="text-xs uppercase tracking-widest font-bold text-white">Active</p>
                                    </motion.div>
                                )}
                                {status === 'success' && (
                                    <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-green-400">
                                        <CheckCircle2 className="w-12 h-12 mx-auto mb-4" />
                                        <p className="text-xs uppercase tracking-widest font-bold text-white">Success</p>
                                    </motion.div>
                                )}
                                {status === 'error' && (
                                    <motion.div key="error" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-red-400">
                                        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                                        <p className="text-xs uppercase tracking-widest font-bold text-white">Error</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
