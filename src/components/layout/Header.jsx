"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-logo">
        <Link href="/">
          <img src="/logo/logo.png" alt="Hugues Leger Logo" />
          <span className="logo-text">Hugues Leger</span>
        </Link>
      </div>
      <nav className="header-nav">
        <ul>
          <li>
            <Link href="#works">Works</Link>
          </li>
          <li>
            <Link href="#about">About</Link>
          </li>
          <li>
            <Link href="#contact">Contact</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
