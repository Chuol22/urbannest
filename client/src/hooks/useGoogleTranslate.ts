// useGoogleTranslate.ts — sync UI with Google Translate widget
"use client";

import { useCallback, useEffect, useState } from "react";

export type Language = {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
};

// Supported site languages
const LANGUAGES: Language[] = [
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
        code: "nu",
        name: "nuer",
        nativeName: "Nuer",
        flag: "https://flagcdn.com/w40/ss.png",
    },
    {
        code: "om",
        name: "Oromo",
        nativeName: "Afaan Oromoo",
        flag: "https://flagcdn.com/w40/et.png",
    },
    {
        code: "ti",
        name: "Tigrinya",
        nativeName: "ትግርኛ",
        flag: "https://flagcdn.com/w40/er.png",
    },
    {
        code: "so",
        name: "Somali",
        nativeName: "Soomaali",
        flag: "https://flagcdn.com/w40/so.png",
    },
    {
        code: "fr",
        name: "French",
        nativeName: "Français",
        flag: "https://flagcdn.com/w40/fr.png",
    },
];

function getGoogleTranslateSelect(): HTMLSelectElement | null {
    return document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
}

export function useGoogleTranslate() {
    const [currentLang, setCurrentLang] = useState<Language>(LANGUAGES[0]);

    // Drive the hidden Google Translate select
    const changeLanguage = useCallback((lang: Language) => {
        const select = getGoogleTranslateSelect();
        if (select) {
            select.value = lang.code;
            select.dispatchEvent(new Event("change"));
        }
        setCurrentLang(lang);
        document.documentElement.lang = lang.code;
        document.documentElement.dir = lang.code === "ar" ? "rtl" : "ltr";
    }, []);

    // Poll widget when user changes language outside our UI
    useEffect(() => {
        const syncFromWidget = () => {
            const select = getGoogleTranslateSelect();
            if (!select?.value) return;
            const match = LANGUAGES.find((l) => l.code === select.value);
            if (match && match.code !== currentLang.code) {
                setCurrentLang(match);
                document.documentElement.lang = match.code;
            }
        };

        const interval = setInterval(syncFromWidget, 1000);
        return () => clearInterval(interval);
    }, [currentLang.code]);

    return { currentLang, changeLanguage, languages: LANGUAGES };
}
