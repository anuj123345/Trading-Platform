"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Search,
    FileText,
    Globe,
    BarChart3,
    Database,
    Send,
    Upload,
    Download,
    Sparkles,
    Brain,
    Zap,
    Activity,
    FileSearch,
    MessageSquare,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    ExternalLink,
    Terminal as TerminalIcon
} from 'lucide-react';
import axios from 'axios';

interface FeatureCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    status: 'active' | 'idle';
    onClick: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, status, onClick }) => {
    return (
        <Card
            className="cursor-pointer hover:border-primary transition-all hover:shadow-md"
            onClick={onClick}
        >
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            {icon}
                        </div>
                        <div>
                            <CardTitle className="text-lg">{title}</CardTitle>
                            <CardDescription className="mt-1">{description}</CardDescription>
                        </div>
                    </div>
                    {status === 'active' && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                            <Activity className="h-3 w-3 mr-1" />
                            Active
                        </Badge>
                    )}
                </div>
            </CardHeader>
        </Card>
    );
};

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

interface TaskLog {
    id: string;
    task: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    result?: string;
    timestamp: Date;
}

export default function AIAgentDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [researchQuery, setResearchQuery] = useState('');
    const [chatMessages, setChatMessages] = useState<Message[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [crawlUrl, setCrawlUrl] = useState('');
    const [crawlGoal, setCrawlGoal] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
    const [dbStatus, setDbStatus] = useState<'connected' | 'initializing' | 'error'>('connected');

    const features = [
        {
            title: 'AI Research Engine',
            description: 'Multi-source research with query expansion and synthesis',
            icon: <Search className="h-5 w-5 text-primary" />,
            status: 'idle' as const,
        },
        {
            title: 'RAG Document Chat',
            description: 'Context-aware Q&A with vector search (PGVector)',
            icon: <FileText className="h-5 w-5 text-primary" />,
            status: 'idle' as const,
        },
        {
            title: 'Autonomous Crawler',
            description: 'AI-powered web navigation and content extraction',
            icon: <Globe className="h-5 w-5 text-primary" />,
            status: 'idle' as const,
        },
        {
            title: 'Data Analyst Agent',
            description: 'Natural language analysis for CSV/Excel files',
            icon: <BarChart3 className="h-5 w-5 text-primary" />,
            status: 'idle' as const,
        },
    ];

    const addLog = (task: string, status: TaskLog['status'], result?: string) => {
        const id = Date.now().toString();
        setTaskLogs(prev => [{
            id,
            task,
            status,
            result,
            timestamp: new Date(),
        }, ...prev]);
        return id;
    };

    const updateLog = (id: string, status: TaskLog['status'], result?: string) => {
        setTaskLogs(prev => prev.map(log =>
            log.id === id ? { ...log, status, result } : log
        ));
    };

    const handleInitDb = async () => {
        setDbStatus('initializing');
        const logId = addLog('Initializing Database...', 'running');
        try {
            await axios.post('/api/init-db');
            setDbStatus('connected');
            updateLog(logId, 'completed', 'Database initialized successfully');
        } catch (error) {
            setDbStatus('error');
            updateLog(logId, 'error', 'Database initialization failed');
        }
    };

    const handleResearch = async () => {
        if (!researchQuery.trim()) return;

        setIsProcessing(true);
        const logId = addLog(`Research: "${researchQuery}"`, 'running');

        try {
            const response = await axios.post('/api/research', { query: researchQuery });
            updateLog(logId, 'completed', 'Research report generated successfully');

            // Add report to chat or show as result
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: `### Research Report: ${researchQuery}\n\n${response.data.report}`,
                timestamp: new Date()
            }]);
            setActiveTab('rag');
        } catch (error) {
            updateLog(logId, 'error', 'Research failed');
        } finally {
            setIsProcessing(false);
            setResearchQuery('');
        }
    };

    const handleCrawl = async () => {
        if (!crawlUrl.trim() || !crawlGoal.trim()) return;

        setIsProcessing(true);
        const logId = addLog(`Crawl: ${crawlUrl}`, 'running');

        try {
            await axios.post('/api/crawl', { url: crawlUrl, goal: crawlGoal });
            updateLog(logId, 'completed', 'Site crawled and archived successfully');
        } catch (error) {
            updateLog(logId, 'error', 'Crawl failed');
        } finally {
            setIsProcessing(false);
            setCrawlUrl('');
            setCrawlGoal('');
        }
    };

    const handleChatSubmit = async () => {
        if (!chatInput.trim()) return;

        const userMessage: Message = {
            role: 'user',
            content: chatInput,
            timestamp: new Date(),
        };

        setChatMessages(prev => [...prev, userMessage]);
        setChatInput('');
        setIsProcessing(true);

        try {
            const response = await axios.post('/api/chat/document', { query: userMessage.content });
            const assistantMessage: Message = {
                role: 'assistant',
                content: response.data.answer,
                timestamp: new Date(),
            };
            setChatMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            setChatMessages(prev => [...prev, {
                role: 'system',
                content: 'Failed to get answer from documents.',
                timestamp: new Date()
            }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleIngest = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const logId = addLog(`Ingesting: ${file.name}`, 'running');
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            try {
                await axios.post('/api/ingest', { text, filename: file.name });
                updateLog(logId, 'completed', 'Document ingested successfully');
            } catch (err) {
                updateLog(logId, 'error', 'Ingestion failed');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="min-h-screen bg-background p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                            <Brain className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">AI Agent Dashboard</h1>
                            <p className="text-muted-foreground mt-1">
                                Research, RAG, Autonomous Crawling & Data Analysis
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleInitDb} disabled={dbStatus === 'initializing'}>
                        <Database className="h-4 w-4 mr-2" />
                        {dbStatus === 'initializing' ? 'Initializing...' : 'Init DB'}
                    </Button>
                    <Button size="sm" className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Active Mode
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {features.map((feature) => (
                    <FeatureCard
                        key={feature.title}
                        {...feature}
                        onClick={() => {
                            if (feature.title.includes('Research')) setActiveTab('research');
                            if (feature.title.includes('RAG')) setActiveTab('rag');
                            if (feature.title.includes('Crawler')) setActiveTab('crawler');
                            if (feature.title.includes('Analyst')) setActiveTab('analyst');
                        }}
                    />
                ))}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">
                        <Zap className="h-4 w-4 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="research">
                        <Search className="h-4 w-4 mr-2" />
                        Research
                    </TabsTrigger>
                    <TabsTrigger value="rag">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        RAG Chat
                    </TabsTrigger>
                    <TabsTrigger value="crawler">
                        <Globe className="h-4 w-4 mr-2" />
                        Crawler
                    </TabsTrigger>
                    <TabsTrigger value="analyst">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analyst
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Status</CardTitle>
                            <CardDescription>Overview of all AI agents and services</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-2 w-2 ${dbStatus === 'connected' ? 'bg-green-500' : 'bg-yellow-500'} rounded-full animate-pulse`} />
                                        <div>
                                            <div className="font-medium">Vector Store (PGVector)</div>
                                            <div className="text-sm text-muted-foreground">{dbStatus === 'connected' ? 'Connected' : 'Action Required'}</div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={dbStatus === 'connected' ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"}>
                                        {dbStatus === 'connected' ? 'Operational' : 'Idle'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                                        <div>
                                            <div className="font-medium">Google Gemini API</div>
                                            <div className="text-sm text-muted-foreground">@google/generative-ai</div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="bg-green-500/10 text-green-600">Active</Badge>
                                </div>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                                        <div>
                                            <div className="font-medium">Crawler Agent</div>
                                            <div className="text-sm text-muted-foreground">Autonomous navigation ready</div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="bg-green-500/10 text-green-600">Ready</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Latest AI agent tasks and operations</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[300px] pr-4">
                                {taskLogs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                        <Activity className="h-12 w-12 mb-4 opacity-50" />
                                        <p>No recent activity</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {taskLogs.map((log) => (
                                            <div key={log.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                                                <div className="mt-1">
                                                    {log.status === 'running' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                                                    {log.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                                    {log.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">{log.task}</div>
                                                    {log.result && (
                                                        <div className="text-sm text-muted-foreground mt-1">{log.result}</div>
                                                    )}
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {log.timestamp.toLocaleTimeString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="research" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Research Engine</CardTitle>
                            <CardDescription>
                                Multi-source research with query expansion and synthesis
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter your research query (e.g., 'Future of autonomous agents')..."
                                    value={researchQuery}
                                    onChange={(e) => setResearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
                                />
                                <Button onClick={handleResearch} disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                </Button>
                            </div>
                            <div className="grid gap-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <ChevronRight className="h-4 w-4" />
                                    <span>Expands queries for comprehensive coverage</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <ChevronRight className="h-4 w-4" />
                                    <span>Synthesizes multi-source information</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <ChevronRight className="h-4 w-4" />
                                    <span>Generates structured Markdown reports</span>
                                </div>
                            </div>
                            <Separator />
                            <div className="bg-muted/50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileSearch className="h-4 w-4 text-primary" />
                                    <span className="font-medium text-sm">Orchestration</span>
                                </div>
                                <code className="text-xs text-muted-foreground">app/api/research/route.ts</code>
                                <div className="text-xs text-muted-foreground mt-2">
                                    Uses text-embedding-004 and gemini-2.0-flash
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="rag" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Document Ingestion</CardTitle>
                                <CardDescription>Upload documents for vector embedding</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <label className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer block">
                                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                    <p className="text-xs text-muted-foreground mt-1">TXT, Markdown or raw text</p>
                                    <input type="file" className="hidden" onChange={handleIngest} accept=".txt,.md" />
                                </label>
                                <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Database className="h-3 w-3" />
                                        <span className="font-medium">Vector Store: PGVector</span>
                                    </div>
                                    <div className="text-muted-foreground">Chunking & embedding in lib/ai/ingest.ts</div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>RAG Chat Interface</CardTitle>
                                <CardDescription>Context-aware document Q&A</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ScrollArea className="h-[200px] border rounded-lg p-4">
                                    {chatMessages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                            <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                                            <p className="text-sm">Start a conversation</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {chatMessages.map((msg, idx) => (
                                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`rounded-lg px-3 py-2 max-w-[90%] whitespace-pre-wrap ${msg.role === 'user'
                                                            ? 'bg-primary text-primary-foreground'
                                                            : msg.role === 'system' ? 'bg-red-500/10 text-red-500 text-xs' : 'bg-muted'
                                                        }`}>
                                                        <p className="text-sm">{msg.content}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Ask about your documents..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                                    />
                                    <Button onClick={handleChatSubmit} disabled={isProcessing}>
                                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="crawler" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Autonomous Web Crawler</CardTitle>
                            <CardDescription>
                                AI-powered navigation and content extraction
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    placeholder="Starting URL (e.g., https://openai.com)..."
                                    value={crawlUrl}
                                    onChange={(e) => setCrawlUrl(e.target.value)}
                                />
                                <Textarea
                                    placeholder="Crawling Goal (e.g., 'Find all information about recent model updates')..."
                                    value={crawlGoal}
                                    onChange={(e) => setCrawlGoal(e.target.value)}
                                />
                                <Button className="w-full" onClick={handleCrawl} disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Globe className="h-4 w-4 mr-2" />}
                                    {isProcessing ? 'Crawling...' : 'Start Autonomous Crawl'}
                                </Button>
                            </div>
                            <div className="grid gap-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <ChevronRight className="h-4 w-4" />
                                    <span>Recursive link following with agent decision loop</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <ChevronRight className="h-4 w-4" />
                                    <span>Intelligent content extraction and goal tracking</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analyst" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Data Analyst</CardTitle>
                            <CardDescription>
                                Natural language analysis for tabular data
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm font-medium">Streamlit Integration</p>
                                <p className="text-xs text-muted-foreground mt-1">Dedicated Python interface for DuckDB & Pandas analysis</p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TerminalIcon className="h-4 w-4 text-primary" />
                                    <span className="font-medium text-sm">Launch Command</span>
                                </div>
                                <div className="font-mono text-xs bg-black/10 p-2 rounded">
                                    streamlit run ai_data_analyst.py
                                </div>
                            </div>
                            <Button className="w-full" variant="outline" onClick={() => window.open('http://localhost:8501', '_blank')}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open Analyst Interface
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
