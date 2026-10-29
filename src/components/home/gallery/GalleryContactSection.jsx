"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { GALLERY_PROJECTS } from "@/lib/galleryProjects";
import {
  getContactSlideDistance,
  getContactTextScrollDistance,
  getGalleryScrollSpan,
} from "@/lib/galleryLayout";
import Footer from "@/components/layout/Footer";
import CopyEmail from "@/components/ui/CopyEmail";
const STATEMENT =
  "I design interfaces, craft interactive experiences, and build fluid animations.";
const WORDS = STATEMENT.split(" ");
const NO_BREAK_AFTER = new Set(["fluid", "interactive", "build"]);
const EMAIL = "contactme@huguesleger.fr";
const COLOR_DIM = { r: 58, g: 58, b: 58 };
const COLOR_BRIGHT = { r: 255, g: 255, b: 255 };
const DIM_COLOR = "rgb(58, 58, 58)";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerpColor(t) {
  const r = Math.round(COLOR_DIM.r + (COLOR_BRIGHT.r - COLOR_DIM.r) * t);
  const g = Math.round(COLOR_DIM.g + (COLOR_BRIGHT.g - COLOR_DIM.g) * t);
  const b = Math.round(COLOR_DIM.b + (COLOR_BRIGHT.b - COLOR_DIM.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function getGalleryScroll() {
  const lenis = window.lenisInstance;
  if (lenis && typeof lenis.scroll === "number") {
    return lenis.scroll;
  }
  return window.scrollY;
}

export default function GalleryContactSection({ scrollEnabled }) {
  const sectionRef = useRef(null);
  const wordRefs = useRef([]);
  const emailBlockRef = useRef(null);
  const fadeRef = useRef({ value: 1 });

  useEffect(() => {
    const fade = fadeRef.current;

    const handleProjectOpen = () => {
      gsap.to(fade, { value: 0, duration: 0.4, ease: "power2.out" });
    };

    const handleProjectReturn = () => {
      gsap.to(fade, { value: 1, duration: 0.6, ease: "power2.inOut" });
    };

    window.addEventListener("gallery-project-open", handleProjectOpen);
    window.addEventListener("gallery-project-return", handleProjectReturn);
    return () => {
      gsap.killTweensOf(fade);
      window.removeEventListener("gallery-project-open", handleProjectOpen);
      window.removeEventListener("gallery-project-return", handleProjectReturn);
    };
  }, []);

  useEffect(() => {
    if (!scrollEnabled) return;

    let frameId = 0;
    const projectCount = GALLERY_PROJECTS.length;

    if (sessionStorage.getItem("returnTransitionFrom") != null) {
      fadeRef.current.value = 0;
    }

    const update = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollY = getGalleryScroll();
      const scrollSpan = getGalleryScrollSpan(
        projectCount,
        viewportWidth,
        viewportHeight,
      );
      const slideDistance = getContactSlideDistance(viewportHeight);
      const textScrollDistance = getContactTextScrollDistance(viewportHeight);
      const textStart = scrollSpan + slideDistance;

      const slideProgress = clamp((scrollY - scrollSpan) / slideDistance, 0, 1);
      const inSlideZone = scrollY >= scrollSpan - 1;

      const section = sectionRef.current;
      if (section) {
        if (!inSlideZone) {
          section.style.visibility = "hidden";
          section.style.pointerEvents = "none";
          section.style.transform = "translate3d(0, 100%, 0)";
        } else {
          const fade = fadeRef.current.value;
          section.style.visibility = fade > 0 ? "visible" : "hidden";
          section.style.opacity = String(fade);
          section.style.transform = `translate3d(0, ${(1 - slideProgress) * 100}%, 0)`;
          section.style.pointerEvents =
            slideProgress >= 0.98 && fade >= 1 ? "auto" : "none";
        }
      }

      const textProgress =
        slideProgress < 1
          ? 0
          : clamp((scrollY - textStart) / textScrollDistance, 0, 1);

      WORDS.forEach((_, index) => {
        const el = wordRefs.current[index];
        if (!el) return;
        if (textProgress <= 0) {
          el.style.color = DIM_COLOR;
          return;
        }
        const wordProgress = clamp(textProgress * WORDS.length - index, 0, 1);
        el.style.color = lerpColor(wordProgress);
      });

      const emailProgress = clamp((textProgress - 0.55) / 0.45, 0, 1);
      const emailEl = emailBlockRef.current;
      if (emailEl) {
        emailEl.style.opacity = String(emailProgress);
        emailEl.style.transform = `translateY(${(1 - emailProgress) * 20}px)`;
      }

      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [scrollEnabled]);

  if (!scrollEnabled) return null;

  return (
    <section
      ref={sectionRef}
      className="gallery-contact"
      aria-label="Contact"
    >
      <div className="gallery-contact__inner">
        <p className="gallery-contact__statement">
          {WORDS.map((word, index) => (
            <span
              key={`${word}-${index}`}
              ref={(node) => {
                wordRefs.current[index] = node;
              }}
              className="gallery-contact__word"
            >
              {word}
              {index < WORDS.length - 1
                ? NO_BREAK_AFTER.has(word)
                  ? "\u00A0"
                  : " "
                : ""}
            </span>
          ))}
        </p>

        <CopyEmail
          ref={emailBlockRef}
          email={EMAIL}
          className="gallery-contact__email-block"
        />

      </div>
      <Footer className="site-footer--contact" />
    </section>
  );
}
