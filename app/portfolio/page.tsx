import CinematicHero from "@/components/ui/cinematic-hero";
import { GLSLHills } from "@/components/ui/glsl-hills";
import { AutomationShowcase } from "@/components/ui/automation-showcase";

export default function Home() {
  return (
    <main className="relative w-full min-h-screen bg-black">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <GLSLHills speed={0.2} planeSize={128} />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      </div>

      {/* Main Content Layer */}
      <div className="relative z-10 w-full space-y-24 pb-24">
        <CinematicHero />

        <section className="px-6">
          <AutomationShowcase />
        </section>

        {/* You can add further sections below the hero here */}
      </div>
    </main>
  );
}
