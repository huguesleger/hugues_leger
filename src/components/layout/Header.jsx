"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { getIntroGate } from "@/lib/introGate";

const NAV_ITEMS = [
  { href: "/works", label: "Works" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export default function Header() {
  const headerRef = useRef(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const targets = header.querySelectorAll("[data-header-reveal]");
    gsap.set(targets, { y: 0, yPercent: 170 });

    let cancelled = false;
    let tween = null;
    getIntroGate().then(() => {
      if (cancelled) return;
      tween = gsap.to(targets, {
        yPercent: 0,
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.06,
        delay: 0.35,
      });
    });

    return () => {
      cancelled = true;
      tween?.kill();
    };
  }, []);

  return (
    <header ref={headerRef} className="site-header">
      <div className="header-logo">
        <Link href="/">
          <img data-header-reveal src="/logo/logo.png" alt="Hugues Leger Logo" />
          <span className="logo-text">Hugues Leger</span>
        </Link>
      </div>
      <nav className="header-nav">
        <div className="nav-items">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link key={href} href={href} className="item-link">
              <div className="item-mask">
                <div className="item-wrap" data-header-reveal>
                  <span className="item">{label}</span>
                  <span className="item-hover">{label}</span>
                  <span className="item-circle"></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
