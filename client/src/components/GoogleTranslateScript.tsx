// Loads Google Translate widget and patches DOM to prevent React crashes

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: {
          new(
            config: {
              pageLanguage: string;
              includedLanguages?: string;
              autoDisplay: boolean;
              layout?: any;
            },
            elementId: string,
          ): void;
          InlineLayout: {
            SIMPLE: any;
            HORIZONTAL: any;
            VERTICAL: any;
          };
        };
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

export function GoogleTranslateScript() {
  const isInitialized = useRef(false);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // ---------------------------------------------------------
    // CRITICAL FIX FOR REACT 18 + GOOGLE TRANSLATE CRASH:
    // Google Translate replaces text nodes with <font> tags.
    // When React unmounts components, it crashes because the node
    // it tries to remove is no longer a direct child.
    // We patch removeChild and insertBefore to silently catch this.
    // ---------------------------------------------------------
    if (
      typeof Node === "function" &&
      Node.prototype &&
      !(window as unknown as { __googleTranslatePatched?: boolean })
        .__googleTranslatePatched
    ) {
      const originalRemoveChild = Node.prototype.removeChild;
      Node.prototype.removeChild = function <T extends Node>(child: T): T {
        if (child.parentNode !== this) {
          return child;
        }
        return originalRemoveChild.apply(this, [child]) as T;
      };

      const originalInsertBefore = Node.prototype.insertBefore;
      Node.prototype.insertBefore = function <T extends Node>(
        newNode: T,
        referenceNode: Node | null,
      ): T {
        if (referenceNode && referenceNode.parentNode !== this) {
          return newNode;
        }
        return originalInsertBefore.apply(this, [newNode, referenceNode]) as T;
      };
      (
        window as unknown as { __googleTranslatePatched?: boolean }
      ).__googleTranslatePatched = true;
    }

    // Function to initialize Google Translate
    const initializeGoogleTranslate = () => {
      if (isInitialized.current) return;

      if (
        typeof window !== "undefined" &&
        window.google?.translate?.TranslateElement
      ) {
        let element = document.getElementById("google_translate_element");
        if (!element) {
          // If element doesn't exist, create it
          element = document.createElement("div");
          element.id = "google_translate_element";
          element.style.position = "absolute";
          element.style.left = "-9999px";
          element.style.top = "-9999px";
          element.style.width = "1px";
          element.style.height = "1px";
          element.style.overflow = "hidden";
          document.body.appendChild(element);
        }

        if (!element.hasAttribute("data-initialized")) {
          try {
            new window.google.translate.TranslateElement(
              {
                pageLanguage: "en",
                autoDisplay: false,
                layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              },
              "google_translate_element",
            );
            element.setAttribute("data-initialized", "true");
            isInitialized.current = true;
            console.log("✅ Google Translate initialized successfully");

            // Apply saved language if any
            const savedLang = localStorage.getItem("selectedLanguage");
            if (savedLang && savedLang !== "en") {
              setTimeout(() => {
                const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
                if (select && select.value !== savedLang) {
                  select.value = savedLang;
                  select.dispatchEvent(new Event("change", { bubbles: true }));
                }
              }, 600);
            }
          } catch (error) {
            console.error("Error initializing Google Translate:", error);
          }
        }
      }
    };

    // Set global callback
    window.googleTranslateElementInit = initializeGoogleTranslate;

    // Check if script already exists
    const scriptId = "google-translate-script";
    const existingScript = document.getElementById(scriptId);

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.defer = true;
      script.onerror = () =>
        console.error("Failed to load Google Translate script");
      script.onload = () => {
        console.log("Google Translate script tag loaded");
        if (window.google?.translate?.TranslateElement) {
          initializeGoogleTranslate();
        }
      };
      document.head.appendChild(script);
      scriptRef.current = script;
    } else if (window.google?.translate?.TranslateElement) {
      initializeGoogleTranslate();
    }

    return () => {
      // Keep script loaded throughout SPA lifecycle
    };
  }, []);

  return null;
}
