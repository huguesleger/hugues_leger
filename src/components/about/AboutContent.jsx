"use client";

import { useEffect, useState } from "react";
import SplittingWrapperWord from "@/components/splitting/SplittingWrapperWord";
import Footer from "@/components/layout/Footer";

export default function AboutContent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Petit délai pour laisser la transition de page / le montage se terminer
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`page-about__wrap${isVisible ? " page-about--visible" : ""}`}>
      <header className="page-about__header">
        <div className="page-about__inner">
          <h1 className="page-about__title">
            <span className="title-1">
              <SplittingWrapperWord>Creative developer</SplittingWrapperWord>
            </span>
            <span className="title-2">
              <SplittingWrapperWord>& front developer</SplittingWrapperWord>
            </span>
          </h1>
        </div>
      </header>

      <Footer className="site-footer--page-about" />
    </div>
  );
}
