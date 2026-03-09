"use client";

import Hero from "@/components/ui/animated-shader-hero";
import { TrendingUp, BarChart, ShieldCheck } from "lucide-react";

export default function WelcomePage() {
    const handlePrimaryClick = () => {
        // Navigate to the AI Trading Terminal
        window.location.href = "/terminal";
    };

    return (
        <main className="w-full min-h-screen bg-black">
            <Hero
                headline={{
                    line1: "Developer &",
                    line2: "Admin Portal"
                }}
                subtitle="The central command for system administration, UI/UX refinements, and algorithm logic updates. Manage your trading infrastructure with precision."
                buttons={{
                    primary: {
                        text: "Launch Algo Dashboard",
                        onClick: () => window.location.href = "/login"
                    },
                    secondary: {
                        text: "System Logs",
                        onClick: () => window.location.href = "/terminal"
                    }
                }}
            />
        </main>
    );
}
