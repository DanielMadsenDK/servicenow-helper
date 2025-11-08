# UI Design System

This document defines the comprehensive design system for the ServiceNow Helper application. All UI components must adhere to these design principles to maintain visual consistency and provide a cohesive user experience.

## Design Philosophy

The ServiceNow Helper uses a **modern, glassmorphic design system** featuring:
- Smooth, tactile animations for all interactive elements
- Semi-transparent backgrounds with backdrop blur effects
- Colored shadows for depth and visual hierarchy
- Rounded, pill-shaped UI elements (chip-style buttons, pill badges)
- Consistent spacing, typography, and color usage
- Full dark mode support with semantic color variants
- Accessibility-first approach (WCAG AA compliance)

---

## Design System Standards

### Chip-Style Buttons

Primary and secondary buttons use rounded, pill-shaped design with smooth animations.

**Border Radius:**
- Use `rounded-full` for all primary and secondary buttons

**Gradients:**
- **Primary buttons**: `bg-gradient-to-r from-blue-500 to-indigo-600`
- **Hover states**: `hover:from-blue-600 hover:to-indigo-700`
- **Disabled states**: `disabled:from-gray-400 disabled:to-gray-400`

**Shadows:**
- **Base shadow**: `shadow-md shadow-blue-500/25`
- **Hover shadow**: `hover:shadow-lg hover:shadow-blue-500/30`
- Opacity variants: `/5`, `/10`, `/25`, `/30` for different depth levels

**Animations:**
- **Hover**: `hover:scale-105` (standard buttons)
- **Active**: `active:scale-95` (tactile press feedback)
- **Disabled**: `disabled:hover:scale-100` (no animation when disabled)
- **Transition**: `transition-all duration-200`

**Font Weight:**
- Use `font-medium` for all button text

**Example:**
```tsx
<button className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-full shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2 font-medium">
  <Send className="w-4 h-4" />
  <span>Send to ServiceNow</span>
</button>
```

---

### Pill-Style Badges

Status indicators, tags, and badges use consistent pill-shaped styling.

**Shape:**
- Use `rounded-full` for all badges and status indicators

**Padding:**
- Apply `px-2.5 py-1` for consistent sizing

**Typography:**
- Use `text-xs font-medium` for badge text

**Colors:**
- Use semantic colors with dark mode variants
- Examples:
  - Success: `bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`
  - Warning: `bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`
  - Error: `bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`
  - Info: `bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`

**Example:**
```tsx
<div className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
  Online
</div>
```

---

### Modern Cards & Containers

Cards and containers use glassmorphism effects for modern, semi-transparent appearance.

**Border Radius:**
- Use `rounded-2xl` for standard cards
- Use `rounded-3xl` for prominent cards (e.g., welcome sections)

**Glassmorphism:**
- **Background**: `bg-white/95 dark:bg-gray-800/95`
- **Backdrop Blur**: `backdrop-blur-xl`
- **Borders**: `border border-gray-200/50 dark:border-gray-700/50`

**Shadows:**
- **Base shadow**: `shadow-lg shadow-blue-500/5`
- **Prominent cards**: `shadow-2xl shadow-blue-500/10`
- **Hover effects**: `hover:shadow-xl hover:shadow-blue-500/10`

**Example:**
```tsx
<div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/5 border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all hover:shadow-xl hover:shadow-blue-500/10">
  Card content
</div>
```

---

### Modal Overlays

Modals use consistent backdrop blur and entrance animations.

**Backdrop:**
- Use `backdrop-blur-md bg-black/40` for modal overlays
- Include `fixed inset-0` for full-screen coverage
- Add `z-50` for proper stacking

**Animations:**
- **Overlay entrance**: `animate-in fade-in-0 duration-200`
- **Modal entrance**: `animate-in slide-in-from-bottom-4 duration-300`

**Modal Container:**
- Apply glassmorphism: `bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl`
- Use `rounded-2xl` for consistency
- Add colored shadows: `shadow-2xl shadow-blue-500/10`
- Semi-transparent borders: `border border-gray-200/50 dark:border-gray-700/50`

**Example:**
```tsx
<div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center p-4 z-50 animate-in fade-in-0 duration-200">
  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/10 border border-gray-200/50 dark:border-gray-700/50 w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
    Modal content
  </div>
</div>
```

---

### Interactive Elements

All clickable elements should provide tactile feedback through scale animations.

**Scale Animations:**
- **Small elements** (icons, close buttons): `hover:scale-110 active:scale-95`
- **Buttons**: `hover:scale-105 active:scale-95`
- **Large cards**: `hover:scale-[1.02] active:scale-[0.98]` (subtle)

**Transitions:**
- Always use `transition-all duration-200` for smooth animations

**Hover Backgrounds:**
- **Icon buttons**: `hover:bg-gray-100 dark:hover:bg-gray-700`
- **List items**: `hover:bg-gray-50 dark:hover:bg-gray-700/50`

**Icon Sizes:**
- **Standard UI elements**: `w-5 h-5`
- **Small contexts** (badges, compact areas): `w-4 h-4`
- **Large contexts** (headers, prominent buttons): `w-6 h-6`

**Example:**
```tsx
<button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95">
  <Icon className="w-5 h-5" />
</button>
```

---

### Close Buttons

Standardized styling for all close/dismiss buttons across the application.

**Styling:**
- Base: `p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg`
- Animations: `hover:scale-110 active:scale-95 hover:bg-gray-100 dark:hover:bg-gray-700`
- Transitions: `transition-all duration-200`

**Accessibility:**
- Include `title` attribute for tooltips
- Add `aria-label` for screen readers

**Example:**
```tsx
<button
  onClick={onClose}
  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 hover:bg-gray-100 dark:hover:bg-gray-700"
  title="Close"
  aria-label="Close modal"
>
  <X className="w-5 h-5" />
</button>
```

---

### Color System

Consistent color usage across the application for visual harmony.

**Primary Colors:**
- **Gradients**: Blue-to-indigo (`from-blue-500 to-indigo-600`)
- **Hover gradients**: Darker variants (`from-blue-600 to-indigo-700`)

**Shadow Opacity Variants:**
- `/5` - Very subtle depth (base cards)
- `/10` - Light depth (prominent cards, modals)
- `/25` - Medium depth (base button shadows)
- `/30` - Strong depth (hover button shadows)

**Border Opacity:**
- `/50` - Semi-transparent borders for glassmorphism effect

**Background Opacity:**
- `/95` - Semi-transparent backgrounds for glassmorphism
- `/40` - Modal overlay backgrounds
- `/20` - Very subtle backgrounds

**Semantic Colors:**
- **Success**: Green variants (`green-100`, `green-800`, `green-900/30`, `green-400`)
- **Warning**: Yellow variants (`yellow-100`, `yellow-800`, `yellow-900/30`, `yellow-400`)
- **Error**: Red variants (`red-100`, `red-800`, `red-900/30`, `red-400`)
- **Info**: Blue variants (`blue-100`, `blue-800`, `blue-900/30`, `blue-400`)

---

## Component-Specific Patterns

### Forms & Inputs

**Input Borders:**
- Use `border-2` instead of `border` for stronger visual hierarchy
- Base: `border-2 border-gray-300 dark:border-gray-600`

**Focus States:**
- Apply `focus:ring-2 focus:ring-blue-500 focus:border-transparent`
- Remove default border on focus for cleaner appearance

**Secondary Buttons:**
- Use `border-2 border-gray-300 dark:border-gray-600`
- Apply chip-style animations: `hover:scale-105 active:scale-95`
- Add `rounded-full` for consistency

**Example:**
```tsx
<input
  type="text"
  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
/>

<button className="px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 active:scale-95 font-medium">
  Cancel
</button>
```

---

### Navigation & Menus

**Back Buttons:**
- Use `hover:scale-110 active:scale-95` for tactile feedback
- Apply hover backgrounds: `hover:bg-gray-100 dark:hover:bg-gray-700`

**Menu Items:**
- Include smooth hover backgrounds
- Use `transition-all duration-200` for smooth state changes

**Example:**
```tsx
<button
  onClick={() => router.back()}
  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
  title="Go back"
>
  <ArrowLeft className="w-5 h-5" />
</button>
```

---

### Status Indicators

**Badge Style:**
- Use pill-style badges with semantic colors
- Include appropriate icons from `lucide-react`
- Maintain `px-2.5 py-1` padding for consistency

**Example:**
```tsx
<div className="flex items-center gap-2">
  <Wifi className="w-4 h-4 text-green-500" />
  <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
    Online
  </div>
</div>
```

---

## Accessibility Requirements

### ARIA Attributes

**Interactive Elements:**
- Include `aria-label` for screen readers on icon-only buttons
- Add `title` attributes for tooltip information
- Use `aria-expanded` for collapsible sections
- Apply `aria-disabled` for disabled states

**Example:**
```tsx
<button
  aria-label="Close modal"
  title="Close"
  aria-disabled={isDisabled}
>
  <X className="w-5 h-5" />
</button>
```

---

### Color Contrast

**WCAG AA Compliance:**
- Maintain minimum 4.5:1 contrast ratio for normal text
- Maintain minimum 3:1 contrast ratio for large text (18pt+)
- Ensure sufficient contrast in both light and dark modes

**Testing:**
- Use browser dev tools to verify contrast ratios
- Test all color combinations in both themes

---

### Keyboard Navigation

**Focus States:**
- All interactive elements must have visible focus states
- Use `focus:ring-2 focus:ring-blue-500` for keyboard focus
- Maintain logical tab order

**Keyboard Shortcuts:**
- **Escape**: Close modals and dropdowns
- **Enter/Space**: Activate buttons
- **Arrow keys**: Navigate lists and menus

**Example:**
```tsx
<button
  onKeyDown={(e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' || e.key === ' ') onSubmit();
  }}
  className="focus:ring-2 focus:ring-blue-500 focus:outline-none"
>
  Submit
</button>
```

---

### Disabled States

**Visual Distinction:**
- Use `disabled:opacity-50` for clear disabled appearance
- Add `disabled:cursor-not-allowed` to indicate non-interactive state
- Remove hover effects: `disabled:hover:scale-100`

**Example:**
```tsx
<button
  disabled={isLoading}
  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:scale-105 active:scale-95 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100"
>
  Submit
</button>
```

---

## Dark Mode Support

### Semantic Color Classes

**Always provide dark mode variants:**
- Text: `text-gray-900 dark:text-gray-100`
- Backgrounds: `bg-white dark:bg-gray-800`
- Borders: `border-gray-200 dark:border-gray-700`
- Hover states: `hover:bg-gray-100 dark:hover:bg-gray-700`

### Theme-Aware Components

**Test in both modes:**
- Verify all color combinations work in light and dark themes
- Ensure sufficient contrast in both modes
- Check that glassmorphism effects are visible in both themes

**Example:**
```tsx
<div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-gray-100">
  Content
</div>
```

---

## Consistency Enforcement

### Before Creating or Modifying UI Components

**Checklist:**
1. **Reference existing components** - Look at `AIModelModal`, `FilterModal`, `SendScriptModal` as examples
2. **Apply all design patterns** - Use chip-style buttons, pill badges, glassmorphism cards
3. **Test hover states** - Verify scale animations and color transitions
4. **Test transitions** - Ensure smooth `transition-all duration-200` animations
5. **Verify dark mode** - Check appearance in both light and dark themes
6. **Check accessibility** - Test keyboard navigation, ARIA labels, focus states
7. **Validate contrast** - Ensure WCAG AA compliance for all text
8. **Test disabled states** - Verify disabled buttons have proper styling and cursor

### Reference Components

**Examples of properly implemented patterns:**
- `src/components/AIModelModal.tsx` - Modal with chip-style buttons
- `src/components/FilterModal.tsx` - Modal with glassmorphism and animations
- `src/components/SendScriptModal.tsx` - Modal with gradient buttons
- `src/components/PWAInstallPrompt.tsx` - Card with chip-style buttons
- `src/components/NetworkStatusIndicator.tsx` - Pill-style badges
- `src/components/ThemeToggle.tsx` - Icon button with scale animation
- `src/components/LoginForm.tsx` - Form with glassmorphism card
- `src/components/Settings.tsx` - Navigation with scale animations

### Code Review Points

**When reviewing UI code, verify:**
- All buttons use `rounded-full` (chip-style)
- All badges use `rounded-full` with `px-2.5 py-1` (pill-style)
- All cards use `rounded-2xl` or `rounded-3xl` with glassmorphism
- All interactive elements have `hover:scale-*` animations
- All transitions use `transition-all duration-200`
- All modals use `backdrop-blur-md bg-black/40` overlays
- All components support dark mode with `dark:` variants
- All interactive elements have proper ARIA labels
- All disabled states include `disabled:hover:scale-100`

---

## Migration Guide

### Updating Existing Components

**Step-by-step process:**

1. **Identify component type** (button, card, modal, badge, etc.)
2. **Find the relevant design pattern** in this document
3. **Update base styling** (border radius, background, borders)
4. **Add glassmorphism** if applicable (backdrop-blur, opacity)
5. **Add colored shadows** with appropriate opacity variants
6. **Implement scale animations** (hover:scale-*, active:scale-*)
7. **Update transitions** to `transition-all duration-200`
8. **Add dark mode variants** for all colors
9. **Test in both themes** (light and dark)
10. **Verify accessibility** (ARIA, keyboard, contrast)

**Example transformation:**

Before:
```tsx
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
  Submit
</button>
```

After:
```tsx
<button className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 hover:scale-105 active:scale-95 font-medium">
  Submit
</button>
```

---

## Design System Tools

### TailwindCSS Configuration

The application uses **TailwindCSS 4.1.16** with custom configuration for the design system.

**Key features:**
- Custom color palette with semantic colors
- Extended spacing scale for consistent padding/margins
- Custom animation utilities (`animate-in`, `slide-in-from-*`, `fade-in-0`)
- Dark mode support with `dark:` variant

### Icon Library

**Lucide React** is used for all icons throughout the application.

**Standard sizes:**
- Small: `w-4 h-4`
- Standard: `w-5 h-5`
- Large: `w-6 h-6`

**Import pattern:**
```tsx
import { Icon1, Icon2 } from 'lucide-react';
```

### Component Memoization

**Performance optimization:**
- Use `React.memo()` for expensive components
- Implement custom comparison functions when needed
- Apply to components that render frequently without prop changes

---

## Summary

This design system ensures:
- **Visual consistency** across all components
- **Smooth, polished interactions** with tactile feedback
- **Modern glassmorphism aesthetics** with depth and transparency
- **Full accessibility support** for inclusive user experience
- **Complete dark mode support** with semantic color variants
- **High performance** through optimized animations and transitions

**When in doubt, reference existing components** that follow these patterns and maintain consistency with the established design system.
