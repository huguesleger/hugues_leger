"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { getIntroGate } from "@/lib/introGate";
import TransitionLink from "@/components/transition/TransitionLink";

const NAV_ITEMS = [
  { href: "/works", label: "Works" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
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
        <TransitionLink href="/">
          <Image
            data-header-reveal
            src="/logo/logo.png"
            alt="Hugues Leger Logo"
            width={35}
            height={35}
            loading="eager"
          />
          <span className="logo-text">Hugues Leger</span>
        </TransitionLink>
      </div>
      <nav className="header-nav">
        <div className="nav-items">
          {NAV_ITEMS.map(({ href, label }) => {
            const LinkComponent = href.startsWith("#") ? Link : TransitionLink;
            const isActive = pathname === href;
            return (
              <LinkComponent
                key={href}
                href={href}
                className={`item-link${isActive ? " item-active" : ""}`}
              >
                <div className="item-mask">
                  <div className="item-wrap" data-header-reveal>
                    <span className="item">{label}</span>
                    <span className="item-hover">{label}</span>
                    <span className="item-circle"></span>
                  </div>
                </div>
              </LinkComponent>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
