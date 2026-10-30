"use client";

import { useEffect, useState } from "react";
import SplittingWrapperWord from "@/components/ui/splitting/SplittingWrapperWord";
import Footer from "@/components/layout/Footer";
import CopyEmail from "@/components/ui/CopyEmail";

export default function ContactContent({ title, email }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Petit délai pour laisser la transition de page / le montage se terminer
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`page-contact__wrap${isVisible ? " page-contact--visible" : ""}`}>
      <div className="page-contact__inner">
        <h1 className="page-contact__title">
          <span className="title-1">
            <SplittingWrapperWord>{title.firstLine}</SplittingWrapperWord>
          </span>
          <span className="title-2">
            <SplittingWrapperWord>{title.secondLine}</SplittingWrapperWord>
          </span>
        </h1>

        <div className="page-contact__email-container">
          <CopyEmail
            email={email}
            className="page-contact__email-block"
            cursorColor={true}
          />
        </div>
      </div>

      <Footer className="site-footer--page-contact" />
    </div>
  );
}
