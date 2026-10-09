"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function IntroLoader() {
  const [isMounted, setIsMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  const loaderRef = useRef(null);
  const imageLogoRef = useRef(null);
  const wordsContainerRef = useRef(null);
  const word1Ref = useRef(null);
  const word2Ref = useRef(null);
  const word3Ref = useRef(null);
  const logoTextRef = useRef(null);
  const logoWord1Ref = useRef(null);
  const logoWord2Ref = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    if (sessionStorage.getItem("isEntered")) {
      setShouldRender(false);
    }
  }, []);

  useEffect(() => {
    if (!isMounted || !shouldRender) return;

    document.documentElement.style.overflow = "hidden";
    
    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem("isEntered", "true");
        setShouldRender(false);
        document.documentElement.style.overflow = "";
      },
    });

    // 1. Show Image Logo Centered
    tl.set(imageLogoRef.current, { display: "block", opacity: 0, x: 0 })
      .to(imageLogoRef.current, { duration: 1.0, opacity: 1, ease: "power3.out" })
      
    // 2. Shift Image Logo to the left
      .to(imageLogoRef.current, { duration: 0.8, x: -80, ease: "power3.inOut" })
      
    // 3. Texts sequence (they appear next to the logo)
      .set(word1Ref.current, { display: "block", opacity: 0, y: 15 })
      .to(word1Ref.current, { duration: 0.6, y: 0, opacity: 1, ease: "power3.out" }, "-=0.2")
      .to(word1Ref.current, { duration: 0.5, y: -15, opacity: 0, ease: "power2.inOut", delay: 0.4 })
      .set(word1Ref.current, { display: "none" })
      
      .set(word2Ref.current, { display: "block", opacity: 0, y: 15 })
      .to(word2Ref.current, { duration: 0.6, y: 0, opacity: 1, ease: "power3.out" })
      .to(word2Ref.current, { duration: 0.5, y: -15, opacity: 0, ease: "power2.inOut", delay: 0.4 })
      .set(word2Ref.current, { display: "none" })
      
      .set(word3Ref.current, { display: "block", opacity: 0, y: 15 })
      .to(word3Ref.current, { duration: 0.6, y: 0, opacity: 1, ease: "power3.out" })
      .to(word3Ref.current, { duration: 0.5, y: -15, opacity: 0, ease: "power2.inOut", delay: 0.5 })
      .set(word3Ref.current, { display: "none" })

    // 4. Show Name Logo next to image (hugues leger)
      .set(logoTextRef.current, { display: "flex" })
      .fromTo(logoWord1Ref.current, 
        { yPercent: 100 }, 
        { duration: 0.7, yPercent: 0, ease: "power3.out" }
      )
      .fromTo(logoWord2Ref.current, 
        { yPercent: 100 }, 
        { duration: 0.7, yPercent: 0, ease: "power3.out" },
        "-=0.5"
      )
      
      .to({}, { duration: 1.0 }) 
      
    // 5. Fade out center content, then slide up loader
      .to([imageLogoRef.current, logoTextRef.current], {
        duration: 0.6,
        opacity: 0,
        y: -20,
        ease: "power2.inOut"
      }, "exit")
      .to(loaderRef.current, {
        duration: 1.2,
        top: "-100vh",
        ease: "power4.inOut"
      }, "exit+=0.2");

    return () => {
      tl.kill();
      document.documentElement.style.overflow = "";
    };
  }, [isMounted, shouldRender]);

  if (!isMounted || !shouldRender) return null;

  return (
    <div className="intro-loader" ref={loaderRef}>
      <div className="intro-loader__inner">
        <div className="intro-loader__image" ref={imageLogoRef}>
          <img src="/logo/logo.png" alt="Logo Hugues Leger" />
        </div>

        <div className="intro-loader__content">
          <div className="intro-loader__words" ref={wordsContainerRef}>
            <div className="intro-loader__word" ref={word1Ref}>Hello</div>
            <div className="intro-loader__word" ref={word2Ref}>Salut</div>
            <div className="intro-loader__word" ref={word3Ref}>Patience ça arrive...</div>
          </div>
          
          <div className="intro-loader__logo-text" ref={logoTextRef}>
            <div className="intro-loader__logo-line">
              <span ref={logoWord1Ref} className="bold">hugues</span>
            </div>
            <div className="intro-loader__logo-line">
              <span ref={logoWord2Ref}>leger</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
