import CinematicHero from "@/components/ui/cinematic-hero";
import { GLSLHills } from "@/components/ui/glsl-hills";

export default function Home() {
  return (
    <main className="relative w-full min-h-screen bg-black">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <GLSLHills speed={0.2} planeSize={128} />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      </div>

      {/* Main Content Layer */}
      <div className="relative z-10 w-full">
        <CinematicHero />
        {/* You can add further sections below the hero here */}
      </div>
    </main>
  );
}
