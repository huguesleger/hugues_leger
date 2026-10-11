"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SplittingWrapperWord from "@/components/splitting/SplittingWrapperWord";
import Footer from "@/components/layout/Footer";

const EMAIL = "contactme@huguesleger.fr";

export default function ContactContent() {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyResetTimerRef = useRef(null);

  useEffect(() => {
    // Petit délai pour laisser la transition de page / le montage se terminer
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      if (copyResetTimerRef.current) {
        window.clearTimeout(copyResetTimerRef.current);
      }
      copyResetTimerRef.current = window.setTimeout(() => {
        setCopied(false);
        copyResetTimerRef.current = null;
      }, 2500);
    } catch {
      setCopied(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`page-contact__wrap${isVisible ? " page-contact--visible" : ""}`}>
      <div className="page-contact__inner">
        <h1 className="page-contact__title">
          <span className="title-1">
            <SplittingWrapperWord>Envoyez-moi</SplittingWrapperWord>
          </span>
          <span className="title-2">
            <SplittingWrapperWord>un message</SplittingWrapperWord>
          </span>
        </h1>

        <div className="page-contact__email-container">
          <button
            type="button"
            className={`page-contact__email-block wrap-copy${copied ? " copied" : ""}`}
            data-cursor-label="Copy"
            onClick={copyEmail}
          >
            <div className="inner-label">
              <span className="copy-label">copy to clipboard</span>
              <span className="copied-label">copied</span>
            </div>
            <span className="copy-email">{EMAIL}</span>
          </button>
        </div>
      </div>

      <Footer className="site-footer--page-contact" />
    </div>
  );
}
