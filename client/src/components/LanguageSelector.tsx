"use client";

// Language dropdown — switches site language via Google Translate
import React, { useState, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGoogleTranslate } from "../hooks/useGoogleTranslate";

export const LanguageSelector: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { currentLang, changeLanguage, languages } = useGoogleTranslate();

    const handleClickOutside = (e: MouseEvent) => {
        if (
            dropdownRef.current &&
            !dropdownRef.current.contains(e.target as Node)
        ) {
            setIsOpen(false);
        }
    };

    React.useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 border border-gray-200 dark:border-gray-700"
                aria-label="Select language"
            >
                <span
                    aria-hidden="true"
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 overflow-hidden"
                >
                    <img
                        src={currentLang.flag}
                        alt=""
                        className="w-full h-full object-contain"
                    />
                </span>
                <span className="text-sm font-medium hidden sm:inline text-gray-700 dark:text-gray-200">
                    {currentLang.nativeName}
                </span>
                <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                    >
                        <div className="py-1 max-h-96 overflow-y-auto">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        changeLanguage(lang);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 ${lang.code === currentLang.code
                                        ? "bg-orange-50 dark:bg-orange-900/20"
                                        : ""
                                        }`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 overflow-hidden"
                                    >
                                        <img
                                            src={lang.flag}
                                            alt=""
                                            className="w-full h-full object-contain"
                                        />
                                    </span>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {lang.name}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {lang.nativeName}
                                        </div>
                                    </div>
                                    {lang.code === currentLang.code && (
                                        <Check className="w-4 h-4 text-orange-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
