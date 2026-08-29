// useGoogleTranslate.ts — sync UI with Google Translate widget and googtrans cookies
"use client";

import { useCallback, useEffect, useState } from "react";

export type Language = {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
};

// Supported site languages (using Google Translate language codes)
export const LANGUAGES: Language[] = [
    {
        code: "en",
        name: "English",
        nativeName: "English",
        flag: "https://flagcdn.com/w40/gb.png",
    },
    {
        code: "am",
        name: "Amharic",
        nativeName: "አማርኛ",
        flag: "https://flagcdn.com/w40/et.png",
    },
    {
        code: "nus",
        name: "Nuer",
        nativeName: "Thok Nath",
        flag: "https://flagcdn.com/w40/ss.png",
    },
    {
        code: "om",
        name: "Oromo",
        nativeName: "Afaan Oromoo",
        flag: "https://flagcdn.com/w40/et.png",
    },
    {
        code: "so",
        name: "Somali",
        nativeName: "Soomaali",
        flag: "https://flagcdn.com/w40/so.png",
    },
    {
        code: "ti",
        name: "Tigrinya",
        nativeName: "ትግርኛ",
        flag: "https://flagcdn.com/w40/er.png",
    },
    {
        code: "fr",
        name: "French",
        nativeName: "Français",
        flag: "https://flagcdn.com/w40/fr.png",
    },
    {
        code: "ar",
        name: "Arabic",
        nativeName: "العربية",
        flag: "https://flagcdn.com/w40/sa.png",
    },
];

function getGoogleTranslateSelect(): HTMLSelectElement | null {
    let select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;

    if (!select) {
        const iframe = document.querySelector("iframe.goog-te-menu-frame") as HTMLIFrameElement | null;
        if (iframe && iframe.contentDocument) {
            select = iframe.contentDocument.querySelector(".goog-te-combo") as HTMLSelectElement | null;
        }
    }

    return select;
}

function setGoogtransCookie(langCode: string) {
    const domain = window.location.hostname;
    if (langCode === "en") {
        // Clear cookies for English
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
        if (domain.includes(".")) {
            const rootDomain = domain.substring(domain.lastIndexOf(".", domain.lastIndexOf(".") - 1));
            document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${rootDomain};`;
        }
    } else {
        const cookieVal = `/en/${langCode}`;
        document.cookie = `googtrans=${cookieVal}; path=/;`;
        document.cookie = `googtrans=${cookieVal}; path=/; domain=${domain};`;
        if (domain.includes(".")) {
            const rootDomain = domain.substring(domain.lastIndexOf(".", domain.lastIndexOf(".") - 1));
            document.cookie = `googtrans=${cookieVal}; path=/; domain=${rootDomain};`;
        }
    }
}

// Get saved language from localStorage or googtrans cookie
function getSavedLanguage(): Language {
    const saved = localStorage.getItem("selectedLanguage");
    if (saved) {
        const match = LANGUAGES.find((l) => l.code === saved);
        if (match) return match;
    }

    // Check googtrans cookie
    const cookies = document.cookie.split(";");
    for (const c of cookies) {
        const trimmed = c.trim();
        if (trimmed.startsWith("googtrans=")) {
            const val = trimmed.substring("googtrans=".length);
            const parts = val.split("/");
            const targetCode = parts[parts.length - 1];
            const match = LANGUAGES.find((l) => l.code === targetCode);
            if (match) return match;
        }
    }

    return LANGUAGES[0]; // Default to English
}

export function useGoogleTranslate() {
    const [currentLang, setCurrentLang] = useState<Language>(getSavedLanguage);
    const [isReady, setIsReady] = useState(true);

    // Initial check and synchronization
    useEffect(() => {
        const savedLang = getSavedLanguage();
        setCurrentLang(savedLang);
        document.documentElement.lang = savedLang.code;
        document.documentElement.dir = savedLang.code === "ar" ? "rtl" : "ltr";

        // If a non-English language was saved, ensure googtrans cookie is set
        if (savedLang.code !== "en") {
            setGoogtransCookie(savedLang.code);
        }

        const checkReady = () => {
            const select = getGoogleTranslateSelect();
            if (select) {
                setIsReady(true);
                if (savedLang.code !== "en" && select.value !== savedLang.code) {
                    select.value = savedLang.code;
                    select.dispatchEvent(new Event("change", { bubbles: true }));
                }
            }
        };

        const interval = setInterval(checkReady, 500);
        return () => clearInterval(interval);
    }, []);

    // Change language function
    const changeLanguage = useCallback((lang: Language) => {
        try {
            setCurrentLang(lang);
            localStorage.setItem("selectedLanguage", lang.code);
            document.documentElement.lang = lang.code;
            document.documentElement.dir = lang.code === "ar" ? "rtl" : "ltr";

            // 1. Set / clear Google Translate cookie
            setGoogtransCookie(lang.code);

            // 2. Attempt to trigger the select element
            const select = getGoogleTranslateSelect();
            if (select) {
                select.value = lang.code;
                select.dispatchEvent(new Event("change", { bubbles: true }));
                select.dispatchEvent(new Event("input", { bubbles: true }));
                if (select.onchange) {
                    select.onchange(new Event("change") as any);
                }
                console.log(`✅ Google Translate changed to: ${lang.name} (${lang.code})`);
            } else {
                // If the combo select is not rendered yet, reload with the cookie set
                console.log(`Setting cookie and reloading to apply ${lang.name}...`);
                window.location.reload();
            }
        } catch (error) {
            console.error("Error changing language:", error);
        }
    }, []);

    return { currentLang, changeLanguage, languages: LANGUAGES, isReady };
}
