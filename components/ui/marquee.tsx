import { cn } from "@/lib/utils";

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    vertical?: boolean;
    repeat?: number;
    pauseOnHover?: boolean;
}

export function Marquee({
    children,
    vertical = false,
    repeat = 4,
    pauseOnHover = false,
    className,
    ...props
}: MarqueeProps) {
    return (
        <div
            {...props}
            className={cn(
                "group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]",
                {
                    "flex-row": !vertical,
                    "flex-col": vertical,
                },
                className
            )}
        >
            {Array.from({ length: repeat }).map((_, i) => (
                <div
                    key={i}
                    className={cn("flex shrink-0 justify-around [gap:var(--gap)]", {
                        "animate-marquee flex-row": !vertical,
                        "animate-marquee-vertical flex-col": vertical,
                        "group-hover:[animation-play-state:paused]": pauseOnHover,
                    })}
                >
                    {children}
                </div>
            ))}
        </div>
    );
}
