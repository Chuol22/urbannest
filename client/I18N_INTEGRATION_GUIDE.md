# UrbanNEST i18n Integration Guide

## Overview
This guide explains how the internationalization (i18n) system works in UrbanNEST and how to use it in your code.

## Architecture

### 1. **Dependencies**
The i18n system uses these packages:
- `i18next` - Core internationalization framework
- `react-i18next` - React bindings for i18next
- `i18next-browser-languagedetector` - Browser language detection

### 2. **Configuration**
**File:** `src/i18n/config.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '../locales/en.json';
import am from '../locales/am.json';
import om from '../locales/om.json';

const resources = {
  en: { translation: en },
  am: { translation: am },
  om: { translation: om }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: localStorage.getItem('language') || 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });
```

### 3. **Translation Files**
**Location:** `src/locales/`

Each language has its own JSON file:
- `en.json` - English translations
- `am.json` - Amharic translations
- `om.json` - Oromo translations

**Structure:**
```json
{
  "common": {
    "welcome": "Welcome",
    "loading": "Loading..."
  },
  "nav": {
    "home": "Home",
    "properties": "Properties"
  },
  "properties": {
    "title": "Properties",
    "forRent": "For Rent"
  }
}
```

### 4. **Language Selector Component**
**File:** `src/components/ui/LanguageSelector.tsx`

A dropdown component that allows users to switch between languages. It:
- Displays available languages with flags
- Saves user's language preference to localStorage
- Automatically updates the UI when language changes

## How to Use Translations in Your Code

### 1. **Import the useTranslation Hook**
```typescript
import { useTranslation } from 'react-i18next';
```

### 2. **Use the Hook in Your Component**
```typescript
function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <p>{t('properties.forRent')}</p>
    </div>
  );
}
```

### 3. **Access Nested Keys**
Translation keys use dot notation:
```typescript
// For nested keys like "nav.home"
t('nav.home')

// For deeply nested keys like "properties.sortOptions.newest"
t('properties.sortOptions.newest')
```

### 4. **Dynamic Values (Interpolation)**
You can pass dynamic values to translations:
```json
// In en.json
{
  "greeting": "Welcome, {{name}}!",
  "items": "You have {{count}} items"
}
```

```typescript
t('greeting', { name: 'John' })
t('items', { count: 5 })
```

### 5. **Pluralization**
```json
{
  "item": "{{count}} item",
  "item_plural": "{{count}} items"
}
```

```typescript
t('item', { count: 1 })  // "1 item"
t('item', { count: 5 })  // "5 items"
```

## Integration Steps

### Step 1: Initialize i18n
In `src/App.tsx`, import the i18n configuration:
```typescript
import './i18n/config';
```

This must be done before any component that uses translations.

### Step 2: Add Language Selector
Add the LanguageSelector component to your layout:
```typescript
import LanguageSelector from '../ui/LanguageSelector';

// In your JSX
<LanguageSelector />
```

### Step 3: Replace Hardcoded Text
Replace hardcoded strings with translation keys:
```typescript
// Before
<h1>Welcome to UrbanNEST</h1>
<button>Sign In</button>

// After
<h1>{t('common.welcome')}</h1>
<button>{t('auth.signIn')}</button>
```

### Step 4: Add Missing Translations
If a translation key is missing:
1. Add it to all three language files (`en.json`, `am.json`, `om.json`)
2. Use the same key structure in all files
3. Ensure translations are contextually accurate

## Best Practices

### 1. **Organize Translation Keys**
Group related translations together:
```json
{
  "auth": {
    "signIn": "Sign In",
    "signUp": "Sign Up",
    "logout": "Sign Out"
  }
}
```

### 2. **Use Descriptive Keys**
Avoid single-word keys when possible:
```typescript
// Bad
t('home')

// Good
t('nav.home')
```

### 3. **Keep Translations Contextual**
Ensure translations make sense in their context:
```json
// Good - specific to each context
{
  "auth.signIn": "Sign In",
  "nav.signIn": "Sign In"
}
```

### 4. **Handle Missing Keys**
i18next will fall back to the key itself if translation is missing:
```typescript
t('nonexistent.key')  // Returns "nonexistent.key"
```

### 5. **Test All Languages**
Always test your changes in all three languages to ensure:
- UI doesn't break with longer text (Amharic/Oromo can be longer)
- Layout remains responsive
- All translations are contextually correct

## Language-Specific Considerations

### Amharic (am)
- Written right-to-left in some contexts
- Can be significantly longer than English
- Uses unique characters (ሀ, ለ, ሐ, etc.)

### Oromo (om)
- Uses Latin script with special characters
- Can be longer than English
- May require different font considerations

## Troubleshooting

### Issue: Translations not showing
**Solution:** Ensure i18n config is imported in App.tsx before any component using translations.

### Issue: Language not persisting
**Solution:** LanguageSelector saves to localStorage. Check browser localStorage for 'language' key.

### Issue: Missing type errors
**Solution:** The i18n packages need to be installed. Run:
```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

### Issue: Fallback to English
**Solution:** This is normal behavior when a translation key is missing. Add the missing key to the language files.

## Example: Converting a Component

### Before:
```typescript
function PropertyCard({ property }) {
  return (
    <div className="card">
      <h2>{property.title}</h2>
      <p>For Rent</p>
      <span>{property.price} ETB</span>
      <button>View Details</button>
    </div>
  );
}
```

### After:
```typescript
import { useTranslation } from 'react-i18next';

function PropertyCard({ property }) {
  const { t } = useTranslation();
  
  return (
    <div className="card">
      <h2>{property.title}</h2>
      <p>{t('properties.forRent')}</p>
      <span>{property.price} ETB</span>
      <button>{t('property.viewDetails')}</button>
    </div>
  );
}
```

## Summary

The i18n system in UrbanNEST provides:
- **Easy integration** through react-i18next
- **Language persistence** via localStorage
- **Automatic language detection** from browser
- **Fallback to English** for missing translations
- **Flexible translation structure** for all UI elements

To add translations:
1. Use the `useTranslation` hook
2. Replace hardcoded strings with `t('key.path')`
3. Add translation keys to all three language files
4. Test in all languages

The system is designed to be scalable and maintainable, making it easy to add new languages or update existing translations.
