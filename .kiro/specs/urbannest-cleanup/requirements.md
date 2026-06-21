# Requirements Document: UrbanNEST Project Cleanup

## Introduction

This document specifies the requirements for cleaning up and refactoring the UrbanNEST project. The cleanup focuses on three main areas: removing unused code and files, migrating from a custom i18n translation system to Google Translate, and improving code structure and consistency. The goal is to reduce technical debt, simplify maintenance, and modernize the translation approach while preserving all working features.

## Glossary

- **System**: The UrbanNEST web application
- **Old_Translation_System**: The custom i18next-based translation infrastructure including i18n config, locale JSON files, and manual translation keys
- **Google_Translate**: Google's automatic page translation service via their translate widget
- **i18n**: Internationalization - the old custom translation system using i18next library
- **Dead_Code**: Code that is defined but never called or used in the application
- **Unused_Import**: Import statements that reference modules not used in the file
- **Duplicate_Code**: Code that appears in multiple locations with the same or very similar functionality
- **Translation_Key**: String identifiers used by i18next to look up translated text (e.g., "nav.home")
- **Language_Selector**: UI component that allows users to change the application language
- **Console_Log**: Debug logging statements using console.log, console.error, etc.
- **Commented_Code**: Code that has been commented out but left in the codebase

## Requirements

### Requirement 1: Remove Old Translation Infrastructure

**User Story:** As a developer, I want to remove the old i18next translation system, so that the codebase only uses Google Translate and is simpler to maintain.

#### Acceptance Criteria

1. THE System SHALL remove all i18next configuration files (i18n/config.ts)
2. THE System SHALL remove all locale JSON translation files (locales/en.json, locales/am.json, locales/om.json, and the entire locales directory)
3. THE System SHALL remove all i18next-related npm dependencies (i18next, react-i18next, i18next-browser-languagedetector) from package.json
4. THE System SHALL remove all i18next-related type definitions (@types/i18next) from package.json
5. THE System SHALL remove the i18n directory entirely
6. WHEN the old translation system is removed, THEN the System SHALL ensure no import statements reference removed i18n modules

### Requirement 2: Update Language Selector to Use Google Translate

**User Story:** As a user, I want the language selector to trigger Google Translate, so that I can view the entire site in my preferred language automatically.

#### Acceptance Criteria

1. THE System SHALL preserve the existing LanguageSelector component's UI design and user experience
2. THE System SHALL preserve the existing useGoogleTranslate hook that controls the Google Translate widget
3. THE System SHALL ensure the LanguageSelector component continues to use the useGoogleTranslate hook
4. THE System SHALL verify that clicking a language in the selector triggers the Google Translate widget's language change
5. THE System SHALL maintain support for the following languages: English, Amharic, Nuer, Oromo, Tigrinya, Somali, and French
6. THE System SHALL preserve the language selector's integration in the Navbar component

### Requirement 3: Integrate Google Translate Across All Pages

**User Story:** As a user, I want Google Translate to work on all pages of the application, so that I can navigate the entire site in my chosen language.

#### Acceptance Criteria

1. THE System SHALL ensure GoogleTranslateScript component is loaded in the application root or layout
2. THE System SHALL verify that the Google Translate widget initializes exactly once per page load
3. THE System SHALL ensure the Google Translate widget is available on all routes (Home, Properties, Contact, About, Login, Register, Dashboard, Profile, Settings, etc.)
4. THE System SHALL maintain the DOM patching mechanism that prevents React crashes when Google Translate modifies the DOM
5. WHEN a user changes language via the selector, THEN all page content SHALL be translated by Google Translate
6. THE System SHALL ensure the hidden google_translate_element div is present in the DOM

### Requirement 4: Remove Hardcoded Translation Keys from Navbar

**User Story:** As a developer, I want to remove hardcoded translation objects from the Navbar, so that Google Translate handles all translations automatically.

#### Acceptance Criteria

1. THE System SHALL remove the translations object (containing 'en' and 'am' translations) from the Navbar component
2. THE System SHALL replace all translation key references (e.g., t.forRent, t.signIn) with direct English text strings
3. THE System SHALL remove the language state and changeLanguage function specific to the hardcoded translations in Navbar
4. THE System SHALL preserve all navigation menu items and their functionality
5. THE System SHALL preserve all dropdown menus and their structure
6. WHEN the hardcoded translations are removed, THEN Google Translate SHALL automatically translate the English text to the selected language

### Requirement 5: Remove Unused Files and Directories

**User Story:** As a developer, I want to identify and remove unused files, so that the codebase is cleaner and easier to navigate.

#### Acceptance Criteria

1. WHEN a file is not imported or referenced anywhere in the application, THEN THE System SHALL mark it for removal
2. WHEN a directory contains only unused files, THEN THE System SHALL mark the entire directory for removal
3. THE System SHALL preserve all files that are actively used by the application
4. THE System SHALL preserve all asset files (images, fonts) that are referenced in the code
5. THE System SHALL create a list of files to be removed before deletion for user review

### Requirement 6: Remove Unused Imports

**User Story:** As a developer, I want to remove unused imports from all TypeScript and TypeScript React files, so that the code is cleaner and build sizes are optimized.

#### Acceptance Criteria

1. WHEN an import statement references a module that is not used in the file, THEN THE System SHALL remove that import statement
2. THE System SHALL preserve all imports that are used in the file (including types, components, functions, and constants)
3. THE System SHALL check all .ts and .tsx files in the src directory
4. THE System SHALL preserve side-effect imports (imports without named bindings that execute code)
5. THE System SHALL maintain proper import organization after cleanup

### Requirement 7: Remove Console Logs and Debug Code

**User Story:** As a developer, I want to remove console.log statements and debug code, so that the production application is professional and doesn't expose debug information.

#### Acceptance Criteria

1. THE System SHALL remove all console.log statements from production code files
2. THE System SHALL remove all console.debug statements from production code files
3. THE System SHALL preserve console.error and console.warn statements that handle actual errors
4. THE System SHALL remove all console statements within commented code blocks
5. THE System SHALL check all .ts and .tsx files in the src directory

### Requirement 8: Remove Commented Code

**User Story:** As a developer, I want to remove commented-out code blocks, so that the codebase is cleaner and easier to read.

#### Acceptance Criteria

1. WHEN a code block is commented out (using // or /* */), THEN THE System SHALL mark it for removal
2. THE System SHALL preserve code comments that document functionality (JSDoc, inline explanations)
3. THE System SHALL preserve TODO, FIXME, and NOTE comments that provide development guidance
4. THE System SHALL remove multi-line commented code blocks that contain actual code
5. THE System SHALL check all .ts and .tsx files in the src directory

### Requirement 9: Identify and Consolidate Duplicate Code

**User Story:** As a developer, I want to identify duplicate code patterns, so that I can consolidate them into reusable utilities or components.

#### Acceptance Criteria

1. WHEN similar code blocks appear in multiple files, THEN THE System SHALL report them as potential duplicates
2. THE System SHALL identify duplicate utility functions that can be consolidated
3. THE System SHALL identify duplicate type definitions that can be moved to a central location
4. THE System SHALL identify duplicate component patterns that can be abstracted
5. THE System SHALL create a report of duplicate code for developer review, not automatic consolidation

### Requirement 10: Standardize Import Organization

**User Story:** As a developer, I want imports to be organized consistently across all files, so that the code is more readable and maintainable.

#### Acceptance Criteria

1. THE System SHALL organize imports in the following order: external libraries, internal components, types, utilities, and assets
2. THE System SHALL group React imports at the top
3. THE System SHALL separate different import groups with blank lines
4. THE System SHALL sort imports alphabetically within each group
5. THE System SHALL apply consistent import organization to all .ts and .tsx files

### Requirement 11: Ensure Code Formatting Consistency

**User Story:** As a developer, I want consistent code formatting across all files, so that the codebase is professional and easy to read.

#### Acceptance Criteria

1. THE System SHALL ensure consistent indentation (2 spaces for TypeScript/React)
2. THE System SHALL ensure consistent spacing around operators and braces
3. THE System SHALL ensure consistent line breaks and blank lines between code sections
4. THE System SHALL ensure consistent quote usage (single vs. double quotes)
5. THE System SHALL apply formatting rules to all .ts and .tsx files

### Requirement 12: Remove Redundant Type Definitions

**User Story:** As a developer, I want to remove duplicate type definitions, so that types are defined once and imported where needed.

#### Acceptance Criteria

1. WHEN the same type is defined in multiple files, THEN THE System SHALL report it as a duplicate
2. THE System SHALL identify types that should be moved to src/types/index.ts
3. THE System SHALL preserve unique types that are specific to a single component
4. THE System SHALL create a report of duplicate types for developer review
5. THE System SHALL ensure all type exports are properly maintained

### Requirement 13: Preserve Working Features

**User Story:** As a user, I want all existing features to continue working after cleanup, so that my experience with the application is not disrupted.

#### Acceptance Criteria

1. THE System SHALL preserve all authentication functionality (login, register, logout, password reset)
2. THE System SHALL preserve all property browsing and search functionality
3. THE System SHALL preserve all payment and subscription functionality
4. THE System SHALL preserve all user profile and settings functionality
5. THE System SHALL preserve all routing and navigation functionality
6. THE System SHALL preserve dark mode and theme switching functionality
7. THE System SHALL preserve the chatbot functionality
8. WHEN cleanup is complete, THEN all existing features SHALL function identically to before cleanup

### Requirement 14: Maintain Build and Development Tools

**User Story:** As a developer, I want the build system and development tools to continue working, so that I can develop and deploy the application.

#### Acceptance Criteria

1. THE System SHALL ensure Vite build configuration remains functional
2. THE System SHALL ensure TypeScript compilation succeeds after cleanup
3. THE System SHALL ensure ESLint configuration remains functional
4. THE System SHALL update package.json only to remove unused i18n dependencies
5. THE System SHALL preserve all Vite, TypeScript, and development dependencies
6. WHEN cleanup is complete, THEN npm run dev, npm run build, and npm run lint SHALL execute successfully

### Requirement 15: Document Translation System Migration

**User Story:** As a developer, I want documentation on how the new translation system works, so that I can maintain and extend language support.

#### Acceptance Criteria

1. THE System SHALL create or update a README section explaining the Google Translate integration
2. THE System SHALL document how to add or remove supported languages
3. THE System SHALL document how the LanguageSelector component interacts with Google Translate
4. THE System SHALL document the DOM patching mechanism that prevents React crashes
5. THE System SHALL provide examples of how Google Translate automatically translates content
