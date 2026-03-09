"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const DURATION = 0.25;
const STAGGER = 0.025;

interface FlipLinkProps {
    children: string;
    href: string;
}

const FlipLink = ({ children, href }: FlipLinkProps) => {
    return (
        <motion.a
            initial="initial"
            whileHover="hovered"
            href={href}
            className="relative inline-block overflow-hidden whitespace-nowrap text-sm font-medium text-primary hover:text-primary/80 align-bottom"
            style={{
                lineHeight: 1,
            }}
        >
            <span className="block">
                {children.split("").map((l, i) => (
                    <motion.span
                        variants={{
                            initial: {
                                y: 0,
                            },
                            hovered: {
                                y: "-100%",
                            },
                        }}
                        transition={{
                            duration: DURATION,
                            ease: "easeInOut",
                            delay: STAGGER * i,
                        }}
                        className="inline-block"
                        key={i}
                    >
                        {l}
                    </motion.span>
                ))}
            </span>
            <span className="absolute inset-0 block">
                {children.split("").map((l, i) => (
                    <motion.span
                        variants={{
                            initial: {
                                y: "100%",
                            },
                            hovered: {
                                y: 0,
                            },
                        }}
                        transition={{
                            duration: DURATION,
                            ease: "easeInOut",
                            delay: STAGGER * i,
                        }}
                        className="inline-block"
                        key={i}
                    >
                        {l}
                    </motion.span>
                ))}
            </span>
        </motion.a>
    );
};

export default function LoginPage() {
    const [loginType, setLoginType] = React.useState<"admin" | "client">("admin");
    const [showPassword, setShowPassword] = React.useState(false);
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [rememberMe, setRememberMe] = React.useState(false);
    const [error, setError] = React.useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); // Clear previous errors

        if (loginType === "admin") {
            const isValidAdmin1 = email === "anuj.baral69@gmail.com" && password === "Dell$12345";
            const isValidAdmin2 = email === "akbaral2204@gmail.com" && password === "Dell$123456";

            if (isValidAdmin1 || isValidAdmin2) {
                window.location.href = "/algo";
            } else {
                setError("Invalid administrator credentials. Access denied.");
            }
        } else {
            window.location.href = "/client";
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-background relative">
            {/* Back Button */}
            <Button
                variant="ghost"
                className="absolute top-6 left-6 z-50 gap-2 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
                onClick={() => window.location.href = "/"}
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
            </Button>

            {/* Left Side - Image */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="hidden w-1/2 lg:flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-background p-12"
            >
                <div className="max-w-md space-y-6">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="text-5xl font-bold text-foreground"
                    >
                        Welcome Back
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="text-lg text-muted-foreground"
                    >
                        Sign in to continue your journey with us. Access your dashboard and manage your account.
                    </motion.p>
                </div>
            </motion.div>

            {/* Right Side - Login Form */}
            <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md space-y-8"
                >
                    {/* Header */}
                    <div className="space-y-2 text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                            {loginType === "admin" ? "Welcome to Admin Panel" : "Welcome to Client Panel"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {loginType === "admin"
                                ? "Sign in to manage the algorithmic trading core."
                                : "Sign in to view your personalized trading insights."}
                        </p>
                    </div>

                    {/* Login Type Toggle */}
                    <div className="flex p-1 bg-muted/50 rounded-lg border border-border mt-6">
                        <button
                            type="button"
                            onClick={() => setLoginType("admin")}
                            className={cn(
                                "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                                loginType === "admin"
                                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Login as Admin
                        </button>
                        <button
                            type="button"
                            onClick={() => setLoginType("client")}
                            className={cn(
                                "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                                loginType === "client"
                                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Login as Client
                        </button>
                    </div>


                    {/* Error Message */}
                    {error && (
                        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center justify-center font-medium">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email Input */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="remember"
                                    checked={rememberMe}
                                    onCheckedChange={(checked) =>
                                        setRememberMe(checked as boolean)
                                    }
                                />
                                <Label
                                    htmlFor="remember"
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    Remember me
                                </Label>
                            </div>
                            <FlipLink href="#">Forgot password?</FlipLink>
                        </div>

                        {/* Submit Button */}
                        <Button type="submit" className="w-full cursor-pointer hover:bg-neutral-800">
                            Sign in
                        </Button>
                    </form>

                    {/* Sign Up Link */}
                    <div className="text-center text-sm text-muted-foreground mt-4">
                        Don't have an account?{" "}
                        <FlipLink href="#">Sign up</FlipLink>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
