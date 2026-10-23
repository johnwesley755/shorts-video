// src/components/layout/Header.tsx
import { Link, useLocation } from "react-router-dom";
import { Menu, ArrowUpRight, Film, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";

export const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHome = location.pathname === "/";
  const isVault = location.pathname === "/library";

  const handleBrandClick = () => {
    if (isHome) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 select-none flex items-center justify-between ${
        isScrolled
          ? "bg-[#04050c]/80 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] py-3 px-5 sm:px-10"
          : "bg-transparent border-b border-transparent py-4 sm:py-6 px-5 sm:px-10"
      }`}
    >
      {/* Left — Flowstate brand link */}
      <Link
        to="/"
        onClick={handleBrandClick}
        className="pointer-events-auto flex items-center gap-2.5 font-medium text-lg sm:text-xl text-[var(--on-media)] tracking-tight hover:opacity-90 transition-opacity z-10"
      >
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 stroke-current text-white"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2.5 9c2.5 0 2.5 4.2 5 4.2S10 9 12 9s2.5 4.2 5 4.2S19.5 9 21.5 9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M2.5 15c2.5 0 2.5 4.2 5 4.2S10 15 12 15s2.5 4.2 5 4.2S19.5 15 21.5 15"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
        <span className="font-medium tracking-tight">Flowstate</span>
        <span className="text-[10px] font-sans tracking-wider text-[var(--body-muted)] uppercase px-2 py-0.5 rounded-full border border-white/10 bg-white/5">
          AI Shorts
        </span>
      </Link>

      {/* Center — Glass link pill */}
      <nav
        className="pointer-events-auto hidden md:flex absolute left-1/2 -translate-x-1/2 h-11 items-center gap-7 rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill)] px-6 backdrop-blur-xl shadow-lg z-10"
        aria-label="Main Navigation"
      >
        <Link
          to="/"
          onClick={handleBrandClick}
          className={`text-sm font-medium transition-colors cursor-pointer ${
            isHome
              ? "text-white font-semibold underline underline-offset-8 decoration-2 decoration-white/60"
              : "text-[var(--body-muted)] hover:text-white"
          }`}
        >
          Overview
        </Link>

        <Link
          to="/library"
          className={`text-sm font-medium transition-colors ${
            isVault
              ? "text-white font-semibold underline underline-offset-8 decoration-2 decoration-white/60"
              : "text-[var(--body-muted)] hover:text-white"
          }`}
        >
          Vault
        </Link>

        {/* <a
          href="/flowstate.html"
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-[var(--body-muted)] hover:text-white transition-colors flex items-center gap-1"
        >
          <span>Hero Demo</span>
          <ArrowUpRight className="w-3 h-3 opacity-60" />
        </a> */}
      </nav>

      {/* Right — Contextual Action Button */}
      <div className="pointer-events-auto flex items-center gap-3 z-10">
        {isVault ? (
          <Link
            to="/"
            className="btn-pill-white text-xs h-9 px-4 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            <span>Generate Short</span>
          </Link>
        ) : (
          <Link
            to="/library"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20 transition-all text-xs font-medium backdrop-blur-md cursor-pointer"
          >
            <Film className="w-3.5 h-3.5 text-purple-400" />
            <span>Explore Vault</span>
          </Link>
        )}

        {/* Mobile menu sheet trigger (md:hidden) */}
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Open navigation menu"
                className="w-10 h-10 rounded-full border border-white/15 bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/15 transition-all cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-[#04050c]/98 backdrop-blur-2xl border-l border-white/15 text-[var(--heading)] p-6"
            >
              <div className="flex flex-col h-full space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
                  <svg
                    className="w-6 h-6 stroke-current text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2.5 9c2.5 0 2.5 4.2 5 4.2S10 9 12 9s2.5 4.2 5 4.2S19.5 9 21.5 9"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M2.5 15c2.5 0 2.5 4.2 5 4.2S10 15 12 15s2.5 4.2 5 4.2S19.5 15 21.5 15"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      opacity="0.5"
                    />
                  </svg>
                  <span className="font-medium text-lg">Flowstate AI</span>
                </div>

                <nav className="flex flex-col gap-4 text-base">
                  <Link
                    to="/"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleBrandClick();
                    }}
                    className={`py-2 px-3 text-left rounded-xl transition-colors cursor-pointer ${
                      isHome
                        ? "bg-white/10 text-white font-medium"
                        : "text-[var(--body-muted)] hover:text-white"
                    }`}
                  >
                    Overview & Creator
                  </Link>

                  <Link
                    to="/library"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`py-2 px-3 rounded-xl transition-colors ${
                      isVault
                        ? "bg-white/10 text-white font-medium"
                        : "text-[var(--body-muted)] hover:text-white"
                    }`}
                  >
                    Vault
                  </Link>

                  <a
                    href="/flowstate.html"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2 px-3 rounded-xl text-[var(--body-muted)] hover:text-white flex items-center justify-between"
                  >
                    <span>Hero Standalone Demo</span>
                    <ArrowUpRight className="w-4 h-4 opacity-70" />
                  </a>
                </nav>

                <div className="mt-auto pt-6 border-t border-white/10 text-xs text-[var(--body-muted)] space-y-2">
                  <div className="flex justify-between">
                    <span>Engine:</span>
                    <span className="text-emerald-400">Online // SD-Turbo</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Compositor:</span>
                    <span className="text-white">60 FPS 9:16 Ken Burns</span>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
