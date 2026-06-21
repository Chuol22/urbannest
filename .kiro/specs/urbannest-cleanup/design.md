# Design Document: UrbanNEST Project Cleanup

## Overview

This design document outlines the technical approach for cleaning up and refactoring the UrbanNEST project. The cleanup addresses three main goals:

1. **Translation System Migration**: Replace the custom i18next translation system with Google Translate for automatic, comprehensive translation
2. **Code Cleanup**: Remove unused files, imports, console logs, commented code, and organize code structure
3. **Standardization**: Establish consistent patterns for imports, formatting, and code organization

The cleanup will maintain all existing features while significantly reducing technical debt and simplifying maintenance.

### Key Principles

- **Zero Feature Loss**: All working features must continue functioning identically
- **Safety First**: Create backups and validation checkpoints throughout the process
- **Incremental Changes**: Apply changes in small, testable increments
- **Comprehensive Testing**: Verify functionality at each stage

## Architecture Overview

### Current Architecture

The UrbanNEST client application is a React + TypeScript application built with Vite. The current architecture includes:

```
UrbanNEST/client/
├── src/
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── context/          # React contexts (Auth, Theme, Property, DarkMode)
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API service layers
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript type definitions
│   ├── i18n/             # OLD: i18next configuration (TO BE REMOVED)
│   ├── locales/          # OLD: JSON translation files (TO BE REMOVED)
│   ├── assets/           # Images, fonts, static assets
│   ├── App.tsx           # Root application component
│   └── main.tsx          # Application entry point
├── public/               # Static public assets
└── package.json          # Dependencies and scripts
```


### Target Architecture

After cleanup, the architecture will be streamlined:

```
UrbanNEST/client/
├── src/
│   ├── components/        # React components
│   │   ├── GoogleTranslateScript.tsx  # Google Translate loader
│   │   └── LanguageSelector.tsx       # Language switcher UI
│   ├── hooks/
│   │   └── useGoogleTranslate.ts      # Google Translate integration hook
│   ├── pages/            # Page components (with direct English text)
│   ├── context/          # React contexts
│   ├── services/         # API services
│   ├── utils/            # Utilities
│   ├── types/            # Type definitions
│   ├── assets/           # Static assets
│   ├── App.tsx           # Root component
│   └── main.tsx          # Entry point
├── public/               # Static assets
└── package.json          # Updated dependencies (i18n removed)
```

**Key Changes:**
- i18n directory removed
- locales directory removed
- All translation keys replaced with direct English text
- Google Translate handles all translations automatically

## Google Translate Integration

### Integration Strategy

The Google Translate integration is already implemented and working. The design preserves this implementation while removing the old i18next system.

### Components and Their Roles

#### 1. GoogleTranslateScript Component
**Location**: `src/components/GoogleTranslateScript.tsx`

**Purpose**: Loads the Google Translate widget and applies critical DOM patches to prevent React crashes

**Key Features**:
- Loads Google Translate script asynchronously
- Initializes the translate widget with language configuration
- Applies DOM patches to Node.prototype to handle Google Translate's DOM mutations
- Prevents double initialization
- Manages cleanup safely


**DOM Patching Mechanism**:
```typescript
// Patches removeChild to handle Google Translate's node replacements
Node.prototype.removeChild = function <T extends Node>(child: T): T {
  if (child.parentNode !== this) {
    return child; // Silently handle missing parent
  }
  return originalRemoveChild.apply(this, [child]) as T;
};

// Patches insertBefore to handle Google Translate's node insertions
Node.prototype.insertBefore = function <T extends Node>(
  newNode: T,
  referenceNode: Node | null
): T {
  if (referenceNode && referenceNode.parentNode !== this) {
    return newNode; // Silently handle missing reference
  }
  return originalInsertBefore.apply(this, [newNode, referenceNode]) as T;
};
```

**Initialization Flow**:
1. Script loads once in component mount
2. `googleTranslateElementInit` callback fires when script ready
3. TranslateElement created on `google_translate_element` div
4. Widget becomes available in the DOM
5. LanguageSelector can now control the widget

#### 2. useGoogleTranslate Hook
**Location**: `src/hooks/useGoogleTranslate.ts`

**Purpose**: Provides interface to control Google Translate widget from React components

**Exports**:
- `currentLang`: Current selected language object
- `changeLanguage(lang)`: Function to change language
- `languages`: Array of supported languages

**Supported Languages**:
- English (en)
- Amharic (am)
- Nuer (nu)
- Oromo (om)
- Tigrinya (ti)
- Somali (so)
- French (fr)


**How it Works**:
1. Finds the Google Translate `<select>` element in the DOM (`.goog-te-combo`)
2. When `changeLanguage()` is called, updates the select value
3. Dispatches a `change` event to trigger Google Translate
4. Updates document language attributes (`lang` and `dir`)
5. Polls the widget every second to detect external changes

#### 3. LanguageSelector Component
**Location**: `src/components/LanguageSelector.tsx`

**Purpose**: Provides UI for users to select language

**Features**:
- Dropdown interface with language flags
- Shows current language with native name
- Uses `useGoogleTranslate` hook for functionality
- Animated dropdown with framer-motion
- Click-outside detection to close dropdown
- Accessible ARIA labels

**Integration Status**: Already implemented and working

### Google Translate Widget Configuration

The widget is configured with these settings:

```typescript
{
  pageLanguage: "en",              // Default page language
  includedLanguages: "en,am,nu,om,ti,so,fr", // Supported languages
  autoDisplay: false               // Don't show default widget UI
}
```

### Hidden Widget Element

A hidden div must exist in the DOM for Google Translate to inject its controls:

```html
<div id="google_translate_element" style="display: none;"></div>
```

**Current Implementation**: This div should be added to Layout.tsx if not already present.


## Component Changes

### 1. Layout Component Updates

**File**: `src/components/layout/Layout.tsx`

**Required Changes**:
1. Import and render `GoogleTranslateScript` component
2. Add hidden `google_translate_element` div to DOM

**Implementation**:
```tsx
import { GoogleTranslateScript } from '../GoogleTranslateScript';

const Layout: React.FC<LayoutProps> = ({ children, showSidebar = false }) => {
  // ... existing code ...
  
  return (
    <>
      <Helmet>{/* ... */}</Helmet>
      <GoogleTranslateScript />
      <div id="google_translate_element" style={{ display: 'none' }} />
      
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-grow">
          {/* ... existing content ... */}
        </main>
        <Footer />
        <ScrollToTop />
        <ChatBot isOpen={showChat} onToggle={() => setShowChat(!showChat)} />
      </div>
    </>
  );
};
```

### 2. Navbar Component Updates

**File**: `src/components/layout/Navbar.tsx`

**Current State**: Contains hardcoded translation objects for English and Amharic

**Required Changes**:
1. Remove `translations` object (lines defining `translations.en` and `translations.am`)
2. Remove `language` state variable
3. Remove `changeLanguage` function specific to hardcoded translations
4. Remove language initialization `useEffect`
5. Replace all `t.propertyName` references with direct English strings
6. Replace the custom language dropdown with `LanguageSelector` component
7. Keep all navigation structure, menu items, and functionality


**Before (Example)**:
```tsx
const translations = {
  en: {
    forRent: 'For Rent',
    forSell: 'For Sell',
    // ... more translations
  },
  am: {
    forRent: 'ለኪራይ',
    forSell: 'ለሽያጭ',
    // ... more translations
  }
};

const [language, setLanguage] = useState<'en' | 'am'>('en');
const t = translations[language] || translations['en'];

// Navigation items
{
  label: t.forRent,
  dropdown: [
    { to: '/properties?type=rent&category=house', label: t.houses },
    // ...
  ]
}
```

**After**:
```tsx
// No translations object
// No language state

import { LanguageSelector } from '../LanguageSelector';

// Navigation items with direct English text
{
  label: 'For Rent',
  dropdown: [
    { to: '/properties?type=rent&category=house', label: 'Houses/Home' },
    // ...
  ]
}

// In the desktop navigation section
<LanguageSelector />

// Remove custom language dropdown
```

**Translation Key Mapping**:
- `t.forRent` → `'For Rent'`
- `t.forSell` → `'For Sell'`
- `t.commercial` → `'Commercial'`
- `t.findAgent` → `'Find Agent'`
- `t.aboutUs` → `'About Us'`
- `t.contact` → `'Contact'`
- `t.signIn` → `'Login'`
- `t.register` → `'Register'`
- And all other navigation labels


### 3. Other Components Using i18next

**Discovery Method**: Search for files importing from 'react-i18next'

```bash
grep -r "from 'react-i18next'" src/
grep -r 'useTranslation' src/
grep -r '{t(' src/
```

**For Each Component Found**:
1. Remove i18next imports (`import { useTranslation } from 'react-i18next'`)
2. Remove `const { t } = useTranslation()` or similar hooks
3. Replace `t('key')` with direct English text strings
4. Update any conditional rendering based on language with English-only approach

**Common Patterns to Replace**:
- `t('common.loading')` → `'Loading...'`
- `t('common.error')` → `'Error'`
- `t('common.save')` → `'Save'`
- `t('nav.home')` → `'Home'`
- And so on based on locales/en.json mapping

## File Removal Plan

### Files to Remove

#### 1. Translation System Files

**i18n Configuration**:
- `src/i18n/config.ts` - i18next initialization and configuration

**Locale Files**:
- `src/locales/en.json` - English translations
- `src/locales/am.json` - Amharic translations  
- `src/locales/om.json` - Oromo translations

**Directories**:
- `src/i18n/` - Entire i18n directory
- `src/locales/` - Entire locales directory

#### 2. Documentation Files

**Optional Removal** (check with user first):
- `client/I18N_INTEGRATION_GUIDE.md` - Documentation for old i18n system


#### 3. Package Dependencies

**Remove from package.json dependencies**:
```json
{
  "i18next": "^23.16.8",
  "i18next-browser-languagedetector": "^7.2.0",
  "react-i18next": "^13.5.0"
}
```

**Remove from package.json devDependencies**:
```json
{
  "@types/i18next": "^12.1.0"
}
```

#### 4. Unused Files Discovery

**Method**: Use static analysis and import tracking

**Candidate Files** (to be verified):
- Any components in `src/components/` not imported anywhere
- Any hooks in `src/hooks/` not used
- Any utilities in `src/utils/` not referenced
- Any types in `src/types/` not imported

**Verification Process**:
1. Generate import graph of entire codebase
2. Identify files with zero incoming references
3. Check if files are dynamically imported or used in non-standard ways
4. Manually review each candidate before deletion

**Preservation Rules**:
- Keep all files in `src/assets/` (images, fonts)
- Keep all files in `public/`
- Keep all page components in `src/pages/` (may be lazy-loaded)
- Keep all context providers
- Keep all service files (even if temporarily unused)

### Removal Safety Procedure

1. **Backup First**: Create git commit before any deletions
2. **List Generation**: Generate complete list of files to remove
3. **User Review**: Present list to user for approval
4. **Incremental Deletion**: Remove files in small batches
5. **Test After Each Batch**: Run build and basic tests
6. **Rollback Ready**: Keep ability to restore files if issues arise


## Code Cleanup Strategy

### 1. Remove Unused Imports

**Scope**: All `.ts` and `.tsx` files in `src/`

**Detection Method**: Use TypeScript compiler and ESLint

**Tools**:
- TypeScript language server (already available)
- ESLint with unused-imports plugin (if available)
- Manual review for edge cases

**Process**:
1. Run TypeScript diagnostics on each file
2. Identify imports marked as unused
3. Verify imports are truly unused (not just type-only)
4. Remove unused import statements
5. Preserve side-effect imports (imports with no bindings)

**Examples**:
```typescript
// REMOVE - unused import
import { useState, useEffect, useMemo } from 'react'; // if useMemo is unused
// BECOMES
import { useState, useEffect } from 'react';

// PRESERVE - side-effect import
import './styles.css'; // Keep even with no bindings

// REMOVE - unused named import
import { Button, Card, Alert } from './components'; // if Alert is unused
// BECOMES
import { Button, Card } from './components';
```

**Special Cases**:
- React import: Keep even if seemingly unused (JSX transform)
- Type imports: Remove if type is not used
- Default imports: Remove if not referenced

### 2. Remove Console Logs and Debug Code

**Scope**: All `.ts` and `.tsx` files in `src/`

**Patterns to Remove**:
- `console.log(...)`
- `console.debug(...)`
- `console.info(...)`
- Debug comments like `// TODO: remove this debug code`

**Patterns to Preserve**:
- `console.error(...)` - Actual error handling
- `console.warn(...)` - Legitimate warnings
- `console.table(...)` if used for actual error reporting


**Detection Method**:
```bash
# Find all console.log statements
grep -rn "console\.log" src/

# Find all console.debug statements  
grep -rn "console\.debug" src/
```

**Removal Strategy**:
1. Scan all source files for console statements
2. Categorize: debug vs error-handling
3. Remove debug statements
4. Preserve error-handling statements
5. Verify no functionality depends on console output

### 3. Remove Commented Code

**Scope**: All `.ts` and `.tsx` files in `src/`

**Types of Comments**:

**Remove**:
- Commented-out code blocks (multi-line)
- Commented-out single lines of code
- Old implementation notes that are obsolete

**Preserve**:
- JSDoc documentation comments
- Explanatory comments describing why code works a certain way
- TODO, FIXME, NOTE comments with actionable information
- Copyright and license headers

**Examples**:
```typescript
// REMOVE - commented code
// const oldFunction = () => {
//   return "old implementation";
// };

// PRESERVE - explanatory comment
// This uses a ref because the callback needs the latest value
// without triggering re-renders
const callbackRef = useRef(callback);

// PRESERVE - actionable TODO
// TODO: Implement pagination when API supports it

// REMOVE - obsolete note
// This was needed for the old translation system
```


**Detection Method**:
- Pattern matching for comment blocks containing code-like patterns
- Manual review for context
- Avoid removing legitimate documentation

### 4. Identify Duplicate Code

**Scope**: All `.ts` and `.tsx` files in `src/`

**Purpose**: Identify, not automatically consolidate (requires human judgment)

**Types of Duplication**:

1. **Duplicate Utility Functions**
   - Similar functions in multiple files
   - Candidates for centralization in `src/utils/`

2. **Duplicate Type Definitions**
   - Same interface defined in multiple components
   - Candidates for `src/types/index.ts`

3. **Duplicate Component Patterns**
   - Similar UI patterns repeated
   - Candidates for abstraction into reusable components

4. **Duplicate API Calls**
   - Similar API patterns across services
   - Candidates for centralization in service layer

**Process**:
1. Use code similarity detection (manual review or tools)
2. Generate report of duplicates with locations
3. Categorize by duplication type
4. Present to user with consolidation suggestions
5. User decides which to consolidate

**Output**: Markdown report listing duplicates, not automatic changes


## Import Organization Standards

### Import Order

All TypeScript and TSX files should follow this import order:

```typescript
// 1. React and React-related libraries (if applicable)
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// 2. External libraries (node_modules)
import axios from 'axios';
import { z } from 'zod';
import { motion } from 'framer-motion';

// 3. Internal absolute imports - contexts
import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from '@/context/DarkModeContext';

// 4. Internal absolute imports - components
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Navbar from '@/components/layout/Navbar';

// 5. Internal absolute imports - hooks
import { useProperties } from '@/hooks/useProperties';
import { useDebounce } from '@/hooks/useDebounce';

// 6. Internal absolute imports - services and utilities
import { propertyService } from '@/services/propertyService';
import { formatPrice } from '@/utils/formatters';

// 7. Internal absolute imports - types
import type { Property, User } from '@/types';

// 8. Relative imports - sibling/parent components
import { PropertyCard } from './PropertyCard';
import { PropertyFilters } from './PropertyFilters';

// 9. Assets (images, styles)
import logo from '@/assets/images/logo.png';
import './PropertyList.css';
```

### Import Grouping Rules

1. **Separate groups with blank lines**
2. **Sort alphabetically within each group**
3. **React imports always first** (if present)
4. **Type-only imports after value imports** in same group
5. **Relative imports after absolute imports**


### Path Alias Configuration

The project uses `@/` as a path alias for `src/`:

```typescript
// tsconfig.json or vite.config.ts
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Conversion Strategy**:
- Prefer `@/` imports over relative imports for clarity
- Exception: Sibling components can use `./` for locality

### Import Consolidation

**Combine related imports**:
```typescript
// BEFORE
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

// AFTER
import { Button, Card, Input } from '@/components/ui';
```

**Note**: Only consolidate if an index file exports these members

## Code Formatting Standards

### General Formatting

**Indentation**: 2 spaces (no tabs)
**Line Length**: 100 characters (soft limit), 120 (hard limit)
**Quotes**: Single quotes for strings, double quotes in JSX
**Semicolons**: Required at end of statements
**Trailing Commas**: Required in multi-line arrays/objects

### TypeScript/React Conventions

**Function Components**:
```typescript
// Preferred: Arrow function with explicit type
export const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  return (
    <div>
      {/* content */}
    </div>
  );
};

// Alternative: Function declaration
export function ComponentName({ prop1, prop2 }: Props) {
  return (
    <div>
      {/* content */}
    </div>
  );
}
```


**Prop Types**:
```typescript
// Define interface above component
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  variant = 'primary',
  disabled = false 
}) => {
  // implementation
};
```

**Hooks**:
```typescript
// Group hooks at top of component
const [state, setState] = useState(initial);
const [loading, setLoading] = useState(false);
const { user } = useAuth();
const navigate = useNavigate();

// Separate effects with blank lines
useEffect(() => {
  // effect 1
}, [dependency]);

useEffect(() => {
  // effect 2
}, [dependency2]);
```

### Spacing and Blank Lines

**Between sections**: 1 blank line
**Between functions**: 1 blank line
**Between logical blocks**: 1 blank line
**Around operators**: 1 space on each side

**Example**:
```typescript
const calculateTotal = (items: Item[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;
  
  return total;
};

const formatCurrency = (amount: number) => {
  return `$${amount.toFixed(2)}`;
};
```


## Type Definition Consolidation

### Current State

Type definitions are scattered across:
- Individual component files
- `src/types/index.ts` (central type file)
- Service files
- Utility files

### Target State

**Centralized Types** (`src/types/index.ts`):
- Domain models (User, Property, Booking, Payment)
- API response/request types
- Shared enum types
- Global utility types

**Component-Local Types**:
- Props interfaces specific to one component
- Internal component state types
- Local helper types

### Type Organization in index.ts

```typescript
// src/types/index.ts

// ============================================
// Domain Models
// ============================================

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  created_at: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  // ... more fields
}

// ============================================
// Enums and Constants
// ============================================

export enum UserRole {
  USER = 'user',
  AGENT = 'agent',
  ADMIN = 'admin'
}

export enum PropertyType {
  APARTMENT = 'apartment',
  HOUSE = 'house',
  OFFICE = 'office',
  LAND = 'land'
}

// ============================================
// API Types
// ============================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

// ============================================
// Utility Types
// ============================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>}[Keys];
```


### Duplicate Type Detection

**Process**:
1. Extract all type/interface definitions from all `.ts` and `.tsx` files
2. Compare by structure (not just name)
3. Identify duplicates or near-duplicates
4. Generate report with recommendations
5. User decides which to consolidate

**Consolidation Decision Criteria**:
- Used in 3+ files → Move to `types/index.ts`
- Used in 1-2 files in same directory → Keep local
- Domain model → Always centralize
- Component props → Keep local unless shared

## Testing Strategy

### Pre-Cleanup Testing

**Baseline Tests** (before any changes):
1. Run full build: `npm run build`
2. Check for TypeScript errors
3. Run linter: `npm run lint`
4. Manually test critical user flows:
   - Login/Register
   - Browse properties
   - View property details
   - Change language (Google Translate)
   - Dark mode toggle
   - Create listing (if logged in)
   - Payment flow

### Incremental Testing

**After Each Major Change**:
1. Run TypeScript compiler: `tsc --noEmit`
2. Check for new errors
3. Run build: `npm run build`
4. Test affected features manually

### Post-Cleanup Testing

**Full Verification**:
1. Clean build from scratch
2. Full TypeScript compilation
3. ESLint check
4. Manual testing of all features:
   - Authentication (login, register, logout)
   - Property browsing and filtering
   - Property details view
   - Language switching (all 7 languages)
   - Dark mode
   - Responsive design (mobile, tablet, desktop)
   - Payment integration
   - User profile and settings
   - Create listing flow


**Regression Checklist**:
- [ ] All pages load without errors
- [ ] All navigation links work
- [ ] All forms submit correctly
- [ ] Authentication flow works
- [ ] Language selector shows all languages
- [ ] Changing language translates page content
- [ ] Dark mode toggles correctly
- [ ] Images and assets load
- [ ] API calls succeed
- [ ] No console errors in browser
- [ ] Mobile responsive design works

### Browser Testing

**Test in**:
- Chrome (latest)
- Firefox (latest)
- Safari (latest, if available)
- Edge (latest)

**Test Google Translate Compatibility**:
- Verify widget loads
- Verify language changes work
- Verify no React crash errors
- Verify DOM patching prevents errors

## Migration Steps

### Phase 1: Preparation and Backup

**Step 1.1: Create Git Checkpoint**
```bash
git add .
git commit -m "Pre-cleanup checkpoint: Working state before i18n removal"
git tag pre-cleanup-v1
```

**Step 1.2: Document Current State**
- List all pages and features
- Document critical user flows
- Take screenshots of key interfaces
- Note any known issues

**Step 1.3: Run Baseline Tests**
- Execute pre-cleanup testing checklist
- Document any existing issues
- Establish working baseline


### Phase 2: Remove i18next Dependencies

**Step 2.1: Update package.json**
```bash
npm uninstall i18next react-i18next i18next-browser-languagedetector
npm uninstall --save-dev @types/i18next
```

**Step 2.2: Verify package.json**
- Confirm dependencies removed
- Check for any peer dependency warnings

**Step 2.3: Update lock file**
```bash
npm install  # Regenerate package-lock.json
```

**Step 2.4: Test Build**
```bash
npm run build
```
Expected: Build may fail with import errors (fix in next phase)

**Commit Point**:
```bash
git add package.json package-lock.json
git commit -m "Remove i18next dependencies from package.json"
```

### Phase 3: Update Layout Component

**Step 3.1: Add Google Translate to Layout**
- Import `GoogleTranslateScript`
- Render component in Layout
- Add hidden `google_translate_element` div

**Step 3.2: Verify Placement**
- Ensure script loads on all routes
- Verify widget initializes once

**Step 3.3: Test**
```bash
npm run dev
```
- Open browser
- Check console for Google Translate initialization
- Verify no duplicate initialization warnings

**Commit Point**:
```bash
git add src/components/layout/Layout.tsx
git commit -m "Add GoogleTranslateScript to Layout component"
```


### Phase 4: Update Navbar Component

**Step 4.1: Remove Hardcoded Translations**
- Remove `translations` object
- Remove `language` state
- Remove `changeLanguage` function
- Remove language initialization useEffect

**Step 4.2: Replace Translation Keys**
- Replace all `t.propertyName` with English strings
- Update navigation items
- Update button labels

**Step 4.3: Replace Language Selector**
- Import `LanguageSelector` component
- Replace custom language dropdown
- Remove custom language UI code

**Step 4.4: Test Navbar**
```bash
npm run dev
```
- Verify all navigation items display
- Verify all dropdowns work
- Verify LanguageSelector appears
- Click language selector and change languages
- Verify Google Translate translates content

**Commit Point**:
```bash
git add src/components/layout/Navbar.tsx
git commit -m "Replace hardcoded translations with direct English text in Navbar"
```

### Phase 5: Remove i18n Imports from All Components

**Step 5.1: Find All i18n Imports**
```bash
grep -rl "from 'react-i18next'" src/
grep -rl "useTranslation" src/
```

**Step 5.2: Update Each File**
For each file found:
1. Remove i18next imports
2. Remove `useTranslation()` hook usage
3. Replace `t('key')` with direct English text from `locales/en.json`
4. Test that component still renders

**Step 5.3: Batch Testing**
After updating 5-10 files:
```bash
npm run build
```
Fix any errors before continuing

**Commit Points**: After each logical group of files
```bash
git add [updated-files]
git commit -m "Remove i18n from [component-names]"
```


### Phase 6: Remove i18n Files and Directories

**Step 6.1: Remove i18n Configuration**
```bash
rm -rf src/i18n/
```

**Step 6.2: Remove Locale Files**
```bash
rm -rf src/locales/
```

**Step 6.3: Verify No References**
```bash
grep -r "from.*i18n/config" src/
grep -r "from.*locales/" src/
```
Expected: No results

**Step 6.4: Test Build**
```bash
npm run build
```
Expected: Successful build with no errors

**Commit Point**:
```bash
git add .
git commit -m "Remove i18n directory and locale files"
```

### Phase 7: Code Cleanup - Remove Unused Imports

**Step 7.1: Generate Unused Imports Report**
- Use TypeScript diagnostics
- Use ESLint (if configured)
- Manual review of each file

**Step 7.2: Remove Unused Imports**
- Process files in batches
- Remove identified unused imports
- Preserve side-effect imports

**Step 7.3: Test After Each Batch**
```bash
tsc --noEmit
npm run build
```

**Commit Points**: After each batch
```bash
git add [files]
git commit -m "Remove unused imports from [component-group]"
```


### Phase 8: Code Cleanup - Remove Console Logs

**Step 8.1: Find All Console Statements**
```bash
grep -rn "console\." src/ > console-statements.txt
```

**Step 8.2: Categorize Console Statements**
- Debug logs → Remove
- Error handling → Keep
- Info/warn for actual issues → Keep

**Step 8.3: Remove Debug Logs**
- Process files systematically
- Remove debug console.log statements
- Keep error handling console.error

**Step 8.4: Test**
```bash
npm run build
npm run dev
```
Verify no functionality depends on console output

**Commit Point**:
```bash
git add .
git commit -m "Remove debug console.log statements"
```

### Phase 9: Code Cleanup - Remove Commented Code

**Step 9.1: Manual Review**
- Review each file for commented code blocks
- Distinguish between documentation and code

**Step 9.2: Remove Obsolete Comments**
- Remove commented-out code
- Keep meaningful documentation comments
- Keep TODO/FIXME with context

**Step 9.3: Test**
```bash
npm run build
```

**Commit Point**:
```bash
git add .
git commit -m "Remove commented-out code blocks"
```


### Phase 10: Standardize Import Organization

**Step 10.1: Process Files Systematically**
- Go through each .ts and .tsx file
- Reorganize imports following the standard order
- Group and sort imports

**Step 10.2: Apply Import Standards**
- React imports first
- External libraries
- Internal imports (contexts, components, hooks, services, types)
- Relative imports
- Assets last

**Step 10.3: Test After Batches**
```bash
tsc --noEmit
npm run build
```

**Commit Points**: After each logical group
```bash
git add [files]
git commit -m "Standardize import organization in [component-group]"
```

### Phase 11: Generate Reports

**Step 11.1: Duplicate Code Report**
- Identify duplicate utility functions
- Identify duplicate type definitions
- Identify duplicate component patterns
- Generate markdown report

**Step 11.2: Unused Files Report**
- Analyze import graph
- Identify unreferenced files
- Generate list for user review

**Step 11.3: Present to User**
- Share reports
- Get approval for further consolidation
- Discuss which duplicates to consolidate

**Commit Point**:
```bash
git add docs/cleanup-reports/
git commit -m "Generate code duplication and unused files reports"
```


### Phase 12: Final Testing and Documentation

**Step 12.1: Full Clean Build**
```bash
rm -rf node_modules
rm -rf dist
npm install
npm run build
```

**Step 12.2: Run Full Test Suite**
- Execute complete post-cleanup testing checklist
- Test all features manually
- Test in multiple browsers
- Test Google Translate in all supported languages

**Step 12.3: Update Documentation**
- Create or update README section on Google Translate
- Document language selector usage
- Document how to add/remove languages
- Remove references to old i18n system

**Step 12.4: Create Migration Documentation**
```markdown
# Google Translate Integration

## How It Works

UrbanNEST uses Google Translate to provide automatic translation of the entire site into 7 languages:
- English, Amharic, Nuer, Oromo, Tigrinya, Somali, French

## Components

- **GoogleTranslateScript**: Loads the Google Translate widget and patches DOM to prevent React crashes
- **useGoogleTranslate**: Hook that controls the Google Translate widget
- **LanguageSelector**: UI component for selecting language

## Adding a New Language

1. Add language to `useGoogleTranslate.ts` LANGUAGES array
2. Update includedLanguages in `GoogleTranslateScript.tsx`
3. Language will automatically appear in selector

## Technical Details

Google Translate modifies the DOM by replacing text nodes with `<font>` tags. This normally causes React to crash when unmounting components. We patch `Node.prototype.removeChild` and `Node.prototype.insertBefore` to silently handle these cases.
```

**Commit Point**:
```bash
git add .
git commit -m "Final cleanup: Update documentation and complete testing"
git tag post-cleanup-v1
```


## Error Handling

### Common Issues and Solutions

#### Issue 1: Build Fails After Removing i18n

**Symptom**: TypeScript errors about missing i18n imports

**Solution**:
1. Find remaining i18n imports: `grep -r "from 'react-i18next'" src/`
2. Update each file to remove i18n usage
3. Replace translation keys with English text

#### Issue 2: Google Translate Not Loading

**Symptom**: Language selector appears but doesn't translate

**Solution**:
1. Check browser console for script loading errors
2. Verify `google_translate_element` div exists in DOM
3. Check network tab for translate.google.com requests
4. Verify script initialization in console

#### Issue 3: React Crashes When Changing Language

**Symptom**: "Cannot read property 'removeChild' of null" errors

**Solution**:
1. Verify DOM patches are applied in GoogleTranslateScript
2. Check that `__googleTranslatePatched` flag is set
3. Ensure GoogleTranslateScript loads before any components use text

#### Issue 4: Unused Import False Positives

**Symptom**: Imports appear unused but are actually needed

**Solution**:
- React import: Keep for JSX
- Type imports: Check if type is referenced
- Side-effect imports: Always keep
- Default imports: Verify not used anywhere

#### Issue 5: Missing Translations After Cleanup

**Symptom**: UI shows translation keys instead of text

**Solution**:
1. Find the translation key in `locales/en.json`
2. Replace `t('key')` with the English text value
3. Google Translate will handle other languages

