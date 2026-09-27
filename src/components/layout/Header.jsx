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
        <div className="nav-items">
          <Link href="#works" className="item-link">
            <div className="item-wrap">
              <span className="item">Works</span>
              <span className="item-hover">Works</span>
              <span className="item-circle"></span>
            </div>
          </Link>
          <Link href="#about" className="item-link">
            <div className="item-wrap">
              <span className="item">About</span>
              <span className="item-hover">About</span>
              <span className="item-circle"></span>
            </div>
          </Link>
          <Link href="#contact" className="item-link">
            <div className="item-wrap">
              <span className="item">Contact</span>
              <span className="item-hover">Contact</span>
              <span className="item-circle"></span>
            </div>
          </Link>
        </div>
      </nav>
    </header>
  );
}
