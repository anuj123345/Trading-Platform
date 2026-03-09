"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogIn, Lock, Mail, ArrowLeft } from "lucide-react"

interface SpinnerProps {
    size?: number;
    color?: string;
}

const bars = [
    {
        animationDelay: "-1.2s",
        transform: "rotate(.0001deg) translate(146%)"
    },
    {
        animationDelay: "-1.1s",
        transform: "rotate(30deg) translate(146%)"
    },
    {
        animationDelay: "-1.0s",
        transform: "rotate(60deg) translate(146%)"
    },
    {
        animationDelay: "-0.9s",
        transform: "rotate(90deg) translate(146%)"
    },
    {
        animationDelay: "-0.8s",
        transform: "rotate(120deg) translate(146%)"
    },
    {
        animationDelay: "-0.7s",
        transform: "rotate(150deg) translate(146%)"
    },
    {
        animationDelay: "-0.6s",
        transform: "rotate(180deg) translate(146%)"
    },
    {
        animationDelay: "-0.5s",
        transform: "rotate(210deg) translate(146%)"
    },
    {
        animationDelay: "-0.4s",
        transform: "rotate(240deg) translate(146%)"
    },
    {
        animationDelay: "-0.3s",
        transform: "rotate(270deg) translate(146%)"
    },
    {
        animationDelay: "-0.2s",
        transform: "rotate(300deg) translate(146%)"
    },
    {
        animationDelay: "-0.1s",
        transform: "rotate(330deg) translate(146%)"
    }
];

const Spinner = ({ size = 20, color = "#8f8f8f" }: SpinnerProps) => {
    return (
        <div style={{ width: size, height: size }}>
            <style jsx>
                {`
          @keyframes spin {
              0% {
                  opacity: 0.15;
              }
              100% {
                  opacity: 1;
              }
          }
        `}
            </style>
            <div className="relative top-1/2 left-1/2" style={{ width: size, height: size }}>
                {bars.map((item) => (
                    <div
                        key={item.transform}
                        className="absolute h-[8%] w-[24%] -left-[10%] -top-[3.9%] rounded-[5px]"
                        style={{ backgroundColor: color, animation: "spin 1.2s linear infinite", ...item }}
                    />
                ))}
            </div>
        </div>
    );
};

const sizes = [
    {
        tiny: "px-1.5 h-6 text-sm",
        small: "px-1.5 h-8 text-sm",
        medium: "px-2.5 h-10 text-sm",
        large: "px-3.5 h-12 text-base"
    },
    {
        tiny: "w-6 h-6 text-sm",
        small: "w-8 h-8 text-sm",
        medium: "w-10 h-10 text-sm",
        large: "w-12 h-12 text-base"
    }
];

const types = {
    primary: "bg-[#171717] dark:bg-[#ededed] hover:bg-[#383838] dark:hover:bg-[#cccccc] text-white dark:text-[#0a0a0a] fill-white dark:fill-[#0a0a0a]",
    secondary: "bg-white dark:bg-[#171717] hover:bg-[#00000014] dark:hover:bg-[#ffffff17] text-[#171717] dark:text-[#ededed] fill-[#171717] dark:fill-[#ededed] border border-[#00000014] dark:border-[#ffffff24]",
    tertiary: "bg-white dark:bg-[#171717] hover:bg-[#00000014] dark:hover:bg-[#ffffff17] text-[#171717] dark:text-[#ededed] fill-[#171717] dark:fill-[#ededed]",
    error: "bg-[#ea001d] dark:bg-[#e2162a] hover:bg-[#ae292f] dark:hover:bg-[#ff565f] text-[#f5f5f5] dark:text-white fill-[#f5f5f5] dark:fill-white",
    warning: "bg-[#ff9300] hover:bg-[#d27504] text-[#0a0a0a] fill-[#0a0a0a]"
};

const shapes = {
    square: {
        tiny: "rounded",
        small: "rounded-md",
        medium: "rounded-md",
        large: "rounded-lg"
    },
    circle: {
        tiny: "rounded-[100%]",
        small: "rounded-[100%]",
        medium: "rounded-[100%]",
        large: "rounded-[100%]"
    },
    rounded: {
        tiny: "rounded-[100px]",
        small: "rounded-[100px]",
        medium: "rounded-[100px]",
        large: "rounded-[100px]"
    }
};

interface ButtonProps {
    size?: keyof typeof sizes[0];
    type?: keyof typeof types;
    shape?: keyof typeof shapes;
    svgOnly?: boolean;
    children?: React.ReactNode;
    prefix?: React.ReactNode;
    suffix?: React.ReactNode;
    shadow?: boolean;
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    onClick?: () => void;
    ref?: React.Ref<HTMLButtonElement>;
}

const Button = ({
    size = "medium",
    type = "primary",
    shape = "square",
    svgOnly = false,
    children,
    prefix,
    suffix,
    shadow = false,
    loading = false,
    disabled = false,
    fullWidth = false,
    onClick,
    ref,
    ...rest
}: ButtonProps) => {
    return (
        <button
            ref={ref}
            type="submit"
            disabled={disabled}
            onClick={onClick}
            tabIndex={0}
            className={`flex justify-center items-center gap-0.5 duration-150 ${sizes[+svgOnly][size]} ${(disabled || loading) ? "bg-[#f2f2f2] dark:bg-[#1a1a1a] text-[#8f8f8f] fill-[#8f8f8f] border border-[#ebebeb] dark:border-[#2e2e2e] cursor-not-allowed" : types[type]} ${shapes[shape][size]}${shadow ? " shadow-[0_0_0_1px_#00000014,_0px_2px_2px_#0000000a] border-none" : ""}${fullWidth ? " w-full" : ""} focus:shadow-[0_0_0_2px_hsla(0,0%,100%,1),0_0_0_4px_oklch(57.61% 0.2508 258.23)]`}
            {...rest}
        >
            {loading ? (
                <Spinner size={size === "large" ? 24 : 16} />
            ) : prefix}
            <span className={`overflow-hidden whitespace-nowrap overflow-ellipsis font-sans${size === "tiny" ? "" : " px-1.5"}`}>
                {children}
            </span>
            {!loading && suffix}
        </button>
    );
};

const LoginComponent = () => {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSignIn = () => {
        if (!email || !password) {
            setError("Please enter both email and password.");
            return;
        }
        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }
        setError("");
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            router.push("/dashboard");
        }, 1500);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 relative">
            <a
                href="/"
                className="absolute top-8 left-8 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-medium"
            >
                <ArrowLeft className="w-5 h-5" />
                Back to Home
            </a>
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 flex flex-col items-center border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 mb-6 shadow-lg">
                    <LogIn className="w-8 h-8 text-slate-700 dark:text-slate-200" />
                </div>

                <h2 className="text-3xl font-semibold mb-2 text-center text-slate-900 dark:text-slate-100">
                    Welcome Back
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 text-center">
                    Sign in to your account to continue
                </p>

                <div className="w-full flex flex-col gap-4 mb-4">
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Mail className="w-5 h-5" />
                        </span>
                        <input
                            placeholder="Email address"
                            type="email"
                            value={email}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm transition-all"
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Lock className="w-5 h-5" />
                        </span>
                        <input
                            placeholder="Password"
                            type="password"
                            value={password}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm transition-all"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="w-full flex justify-between items-center">
                        {error && (
                            <div className="text-sm text-red-500 dark:text-red-400">{error}</div>
                        )}
                        <button className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:underline font-medium ml-auto">
                            Forgot password?
                        </button>
                    </div>
                </div>

                <Button
                    onClick={handleSignIn}
                    loading={loading}
                    disabled={loading}
                    fullWidth
                    size="large"
                    type="primary"
                    shape="rounded"
                >
                    Sign In
                </Button>

                <div className="flex items-center w-full my-6">
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                    <span className="mx-4 text-xs text-slate-400 dark:text-slate-500">Or continue with</span>
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                </div>

                <div className="flex gap-3 w-full justify-center">
                    <button className="flex items-center justify-center w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                        <img
                            src="https://www.svgrepo.com/show/475656/google-color.svg"
                            alt="Google"
                            className="w-6 h-6"
                        />
                    </button>
                    <button className="flex items-center justify-center w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                        <img
                            src="https://www.svgrepo.com/show/448224/facebook.svg"
                            alt="Facebook"
                            className="w-6 h-6"
                        />
                    </button>
                    <button className="flex items-center justify-center w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                        <img
                            src="https://www.svgrepo.com/show/511330/apple-173.svg"
                            alt="Apple"
                            className="w-6 h-6"
                        />
                    </button>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mt-6 text-center">
                    Don't have an account?{" "}
                    <button className="text-slate-900 dark:text-slate-100 font-medium hover:underline">
                        Sign up
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginComponent;
