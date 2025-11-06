# Button System Documentation

## Overview
This document describes the standardized button component system implemented across the application. The system provides consistent styling, behavior, and visual hierarchy using Tailwind CSS and Heroicons.

**Design Philosophy**: Outlined buttons by default, solid (filled) buttons only for critical CTAs.

## Components

### Button Component (`components/ui/Button.tsx`)
A reusable button component with multiple variants, sizes, and features.

#### Default Behavior
- **Default Variant**: `outlined-primary` (outlined blue)
- **Philosophy**: Minimalist, modern design with outlined buttons as the standard
- **Solid Buttons**: Reserved for high-priority CTAs (submit, save, confirm major actions)

#### Variants
**Outlined (Default Style)**:
- **outlined-primary** - Blue outlined (DEFAULT - most common use)
- **outlined-secondary** - Gray outlined (cancel, neutral actions)
- **outlined-success** - Green outlined (confirm, approve)
- **outlined-danger** - Red outlined (delete, destructive actions)
- **outlined-warning** - Yellow outlined (warning confirmations)

**Solid (CTA Style - Use Sparingly)**:
- **primary** - Solid blue (main CTAs: save, submit, final confirmation)
- **secondary** - Solid gray (rare use, avoid when possible)
- **success** - Solid green (high-priority success actions)
- **danger** - Solid red (critical destructive actions)
- **warning** - Solid yellow (critical warnings)

**Special**:
- **ghost** - Transparent with hover (minimal UI impact, close buttons)

#### Sizes
- **sm** - Small (px-3 py-1.5, text-xs, icon: w-4 h-4)
- **md** - Medium (px-4 py-2.5, text-sm, icon: w-5 h-5) - Default
- **lg** - Large (px-6 py-3, text-base, icon: w-6 h-6)

#### Features
- **Loading State** - Built-in spinner animation when `loading` prop is true
- **Icons** - Support for left or right positioned icons via `icon` prop
- **Disabled State** - Automatic styling with `disabled` prop
- **Full Width** - Optional `fullWidth` prop for 100% width buttons
- **Hover Effects** - Elevation effect with -translate-y-0.5
- **Dark Mode** - Full support with appropriate dark: variants

#### Usage Examples

```tsx
import { Button } from '@/components/ui/Button';
import { SaveIcon, CheckIcon, TrashIcon, PlusIcon } from '@/components/ui/Icons';

// Standard button (outlined by default - no variant needed)
<Button icon={<EditIcon />}>Editar</Button>

// Add new item (outlined is default)
<Button icon={<PlusIcon />}>Nuevo Servicio</Button>

// Primary CTA (solid, most prominent)
<Button variant="primary" loading={saving} icon={<SaveIcon />}>
  Guardar Cambios
</Button>

// Confirm action (outlined success for visual distinction)
<Button variant="outlined-success" icon={<CheckIcon />} size="sm">
  Confirmar
</Button>

// Delete action (outlined danger)
<Button variant="outlined-danger" icon={<TrashIcon />} size="sm">
  Eliminar
</Button>

// Cancel action (outlined secondary)
<Button variant="outlined-secondary">
  Cancelar
</Button>

// Minimal close button
<Button variant="ghost" size="sm" icon={<CloseIcon />} />

// Full width submit button (solid primary CTA)
<Button type="submit" variant="primary" loading={submitting} fullWidth>
  Confirmar Reserva
</Button>
```

### Icon Component Library (`components/ui/Icons.tsx`)
Reusable Heroicon SVG components with consistent styling.

#### Available Icons
- **CheckIcon** - Checkmark/success
- **XIcon** - Close/cancel/error  
- **EditIcon** - Edit/modify (pencil)
- **TrashIcon** - Delete (trash can)
- **PlusIcon** - Add/create
- **CheckCircleIcon** - Complete/done (checkmark in circle)
- **ExclamationIcon** - Warning/alert (exclamation in triangle)
- **SaveIcon** - Save (floppy disk)
- **CloseIcon** - Close modal (X in square)
- **InfoIcon** - Information (i in circle)

#### Icon Features
- Default size: w-5 h-5
- Configurable via `className` prop
- Consistent strokeWidth={2}
- All icons extend React.SVGAttributes for full customization

#### Usage Examples

```tsx
import { CheckIcon, EditIcon } from '@/components/ui/Icons';

// Default size
<CheckIcon />

// Custom size
<EditIcon className="w-6 h-6" />

// Custom color
<ExclamationIcon className="w-6 h-6 text-yellow-500" />
```

## Design Patterns

### Visual Hierarchy
1. **Primary CTAs** - Use `variant="primary"` ONLY for the most critical action (save, submit, final confirmation)
2. **Standard Actions** - Use default (outlined-primary) for most buttons
3. **Positive Actions** - Use `variant="outlined-success"` for confirmations
4. **Negative Actions** - Use `variant="outlined-danger"` for deletions
5. **Cancel Actions** - Use `variant="outlined-secondary"` for cancel/close buttons
6. **Minimal Actions** - Use `variant="ghost"` for close/dismiss buttons

### Button Combinations

#### Modal Action Buttons
```tsx
<div className="flex gap-3">
  <Button variant="outlined-secondary">Cancelar</Button>
  <Button variant="primary" loading={saving} icon={<SaveIcon />}>
    Guardar
  </Button>
</div>
```

#### Confirmation Modals
```tsx
<div className="flex gap-3">
  <Button variant="outlined-secondary" fullWidth>Cancelar</Button>
  <Button variant="danger" loading={deleting} fullWidth>Eliminar</Button>
</div>
```

#### Table Action Buttons
```tsx
<div className="flex gap-2">
  <Button variant="outlined-success" size="sm" icon={<CheckIcon />}>
    Confirmar
  </Button>
  <Button variant="outlined-danger" size="sm" icon={<XIcon />}>
    Cancelar
  </Button>
  <Button size="sm" icon={<EditIcon />}>
    Editar
  </Button>
</div>
```

#### Form Navigation
```tsx
{/* Previous button */}
<Button variant="outlined-secondary" fullWidth size="lg">
  ← Anterior
</Button>

{/* Next button - solid primary for emphasis */}
<Button variant="primary" fullWidth size="lg">
  Siguiente →
</Button>

{/* Final submit - solid primary CTA */}
<Button type="submit" variant="primary" loading={submitting} fullWidth size="lg">
  Confirmar Reserva
</Button>
```

## Dark Mode Support
All button variants include dark mode variants:
- Proper text contrast
- Background color adjustments
- Border color changes for outlined variants
- Hover states adapted for dark backgrounds

## Accessibility
- Focus ring on keyboard focus (`focus:ring-2`)
- Disabled states with reduced opacity
- Touch-friendly targets (adequate padding)
- Support for `aria-label` and other ARIA attributes
- Proper color contrast ratios

## Implementation Status

### ✅ Completed Pages
- **Client-Facing**:
  - ✅ `components/ReservaForm.tsx` - All buttons standardized with outlined default
  
- **Admin Protected**:
  - ✅ `app/admin/(protected)/dashboard/page.tsx` - All buttons standardized
  - ✅ `app/admin/(protected)/servicios/page.tsx` - All buttons standardized
  - ✅ `app/admin/(protected)/schedule/page.tsx` - Imports added
  - ✅ `app/admin/(protected)/layout.tsx` - Imports added
  
- **Admin Public**:
  - ✅ `app/admin/page.tsx` - Login form standardized
  - ✅ `app/admin/galeria/page.tsx` - Imports added
  - ✅ `app/admin/categorias/page.tsx` - Imports added
  - ✅ `app/admin/imagenes/page.tsx` - Imports added

- **Core Components**:
  - ✅ `components/ui/Button.tsx` - Default changed to `outlined-primary`
  - ✅ `components/ui/Icons.tsx` - Complete icon library

### ⏳ Pending Button Replacements (Imports Ready)
- `app/admin/(protected)/contenido/page.tsx` - Large file, imports added
- `app/admin/(protected)/schedule/page.tsx` - Needs button replacements
- `app/admin/galeria/page.tsx` - Needs button replacements
- `app/admin/categorias/page.tsx` - Needs button replacements
- `app/admin/imagenes/page.tsx` - Needs button replacements
- `app/admin/(protected)/layout.tsx` - Change password modal buttons

## Migration Guide

### Before
```tsx
<button
  onClick={handleClick}
  disabled={saving}
  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
>
  {saving ? <Spinner /> : "Guardar"}
</button>
```

### After
```tsx
{/* Most buttons - outlined by default (no variant needed) */}
<Button
  onClick={handleClick}
  disabled={saving}
  icon={<SaveIcon />}
>
  Guardar
</Button>

{/* Critical CTAs - use primary variant */}
<Button
  onClick={handleClick}
  disabled={saving}
  variant="primary"
  loading={saving}
  icon={<SaveIcon />}
>
  Guardar
</Button>
```

## When to Use Solid vs Outlined

### Use Solid (variant="primary", "success", "danger")
✅ Final form submission  
✅ "Confirmar Reserva" / "Guardar Cambios" in modals  
✅ Critical one-time actions  
✅ Primary navigation ("Siguiente" in multi-step forms)  
✅ Initialize/setup actions  

### Use Outlined (default or explicit variants)
✅ Edit/Delete in tables  
✅ Add new items ("Nuevo Servicio", "Nueva Categoría")  
✅ Secondary actions  
✅ Cancel/Close buttons  
✅ Confirmation/rejection of minor actions  
✅ Navigation ("Anterior")  

## Benefits
1. **Visual Clarity** - Outlined default creates cleaner, less cluttered UI
2. **Emphasis** - Solid buttons stand out for truly important actions
3. **Consistency** - All buttons follow the same design language
4. **Maintainability** - Single source of truth for button styling
5. **Accessibility** - Built-in accessibility features
6. **Dark Mode** - Automatic dark mode support
7. **Loading States** - No need to implement spinners separately
8. **Type Safety** - Full TypeScript support with proper typing
9. **Developer Experience** - Simple, intuitive API with smart defaults

## Color Palette
- **Primary (Blue)**: `blue-600` / `blue-700` (hover)
- **Secondary (Gray)**: `gray-600` / `gray-700` (hover)
- **Success (Green)**: `green-600` / `green-700` (hover)
- **Danger (Red)**: `red-600` / `red-700` (hover)
- **Warning (Yellow)**: `yellow-600` / `yellow-700` (hover)

All colors have corresponding outlined variants with transparent backgrounds and colored borders/text.
