// src/components/layout/Layout.tsx
import { ReactNode } from "react";
import Header from "./Header";
import { FluidBackground } from "../common/FluidBackground";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="relative min-h-screen bg-[var(--hero-base)] text-[var(--heading)] font-sans overflow-x-hidden selection:bg-white/20 selection:text-white">
      {/* Background WebGL Fluid Simulation & Radial Scrim */}
      <FluidBackground />

      {/* Floating Header */}
      <Header />

      {/* Main Page Content */}
      <main className="relative z-10 flex-grow">
        {children}
      </main>
    </div>
  );
};

export default Layout;