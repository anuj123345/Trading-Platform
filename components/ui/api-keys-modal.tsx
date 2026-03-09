"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ApiKeysModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ApiKeysModal({ open, onOpenChange }: ApiKeysModalProps) {
    const [geminiKey, setGeminiKey] = useState("");

    // Load from local storage on mount
    useEffect(() => {
        if (open) {
            try {
                const storedGemini = localStorage.getItem("gemini_api_key");
                if (storedGemini) {
                    setGeminiKey(storedGemini);
                }
            } catch (e) {
                console.error("Failed to load Gemini key from local storage", e);
            }
        }
    }, [open]);

    const handleSaveGemini = () => {
        localStorage.setItem("gemini_api_key", geminiKey);
        alert("Google Gen AI key securely saved to your local session.");
    };

    const handleClearAll = () => {
        if (confirm("Are you sure you want to delete your stored Gemini credentials from your browser?")) {
            localStorage.removeItem("gemini_api_key");
            setGeminiKey("");
            alert("Credentials wiped successfully.");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Connected Services & API Keys</DialogTitle>
                    <DialogDescription>
                        Manage your connection settings. These keys are stored securely in your browser's local storage and are never saved to our database.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-4 rounded-lg border border-border p-4 bg-muted/50">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">Google Gen AI (Gemini)</span>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="geminikey">Gemini AI Studio API Key</Label>
                            <Input
                                id="geminikey"
                                value={geminiKey}
                                onChange={e => setGeminiKey(e.target.value)}
                                type="password"
                                placeholder="AIzaSy..."
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Used to power the "✨ AI Review" feature inside the Algorithmic IDE.
                            </p>
                        </div>
                        <Button className="w-full cursor-pointer" onClick={handleSaveGemini}>Save Gen AI Key</Button>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
                        <p className="text-xs text-amber-500 font-medium">
                            Note: Shoonya Broker credentials are now managed directly within your local IDE instances for enhanced security.
                        </p>
                    </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-between">
                    <Button variant="ghost" className="text-destructive hover:bg-destructive/10 cursor-pointer text-xs" onClick={handleClearAll}>
                        Clear Local Credentials
                    </Button>
                    <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
