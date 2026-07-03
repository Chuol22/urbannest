// Loads Google Translate widget and patches DOM to prevent React crashes

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: new (
          config: {
            pageLanguage: string;
            includedLanguages: string;
            autoDisplay: boolean;
          },
          elementId: string,
        ) => void;
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

    // Prevent double initialization
    if (isInitialized.current) return;

    // Function to initialize Google Translate
    const initializeGoogleTranslate = () => {
      if (isInitialized.current) return;

      if (
        typeof window !== "undefined" &&
        window.google?.translate?.TranslateElement
      ) {
        const element = document.getElementById("google_translate_element");
        if (element && !element.hasAttribute("data-initialized")) {
          try {
            new window.google.translate.TranslateElement(
              {
                pageLanguage: "en",
                includedLanguages: "en,am,nu,om,ti,so,fr",
                autoDisplay: false,
              },
              "google_translate_element",
            );
            element.setAttribute("data-initialized", "true");
            isInitialized.current = true;
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
      document.head.appendChild(script);
      scriptRef.current = script;
    } else if (window.google?.translate?.TranslateElement) {
      initializeGoogleTranslate();
    }

    // Safe cleanup - check parentNode before removing
    return () => {
      // Only try to remove if we added the script and it's still in the DOM
      if (scriptRef.current && scriptRef.current.parentNode === document.head) {
        try {
          document.head.removeChild(scriptRef.current);
        } catch (error) {
          // Ignore - script may have been removed already
        }
      }
      // Clean up the global callback
      if (window.googleTranslateElementInit) {
        window.googleTranslateElementInit = undefined;
      }
    };
  }, []);

  return null;
}
