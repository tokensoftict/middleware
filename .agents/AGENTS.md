# Ebills Middleware Agent Rules & Guidelines

Welcome to the Ebills Middleware project! This document outlines rules, styling guidelines, and constraints for AI agents working on this codebase.

## 🛠️ Technology Stack
- **Backend:** Laravel (PHP)
- **Frontend:** React 19 + TypeScript + Vite
- **Routing & State:** InertiaJS (bridges Laravel backend with React frontend)
- **Styling:** Tailwind CSS v4 + Vanilla CSS + Radix UI + shadcn/ui components

---

## 💻 Codebase & Styling Rules

### 1. General Workflow
- Always verify frontend changes compile correctly using `npm run dev`.
- Make sure to format resources using `npm run format` and check types using `npm run types:check` when making TypeScript/React modifications.
- Keep PHP code styled according to Laravel Pint rules.

### 2. Frontend Development (React & TypeScript)
- **React 19 & TypeScript:** Write fully-typed functional components. Avoid using `any` types; prefer custom interfaces/types.
- **InertiaJS:** Leverage Inertia's data routing. Do not introduce client-side routers (like react-router). Pass variables from Laravel Controllers to frontend pages via `Inertia::render()`.
- **Components:** Reuse existing layout and form components under `resources/js/components/`. If creating new UI elements, follow the patterns established by Radix UI and shadcn/ui.
- **Tailwind CSS v4:** Utilize Tailwind utility classes for layout, spacing, and colors. Do not mix with arbitrary styled-components libraries.

### 3. Backend Development (Laravel)
- **Controllers & Routing:** Define routes inside `routes/web.php` or `routes/api.php` utilizing Inertia routes where appropriate.
- **Validation:** Use Form Requests or `$request->validate()` for request validation.
- **Database & Eloquent:** Adhere to Laravel's naming conventions for models, migrations, and relationships.

---

## 🔍 Code Quality Tools
- Format JavaScript/TypeScript files: `npm run format`
- Lint JavaScript/TypeScript files: `npm run lint`
- Check TypeScript types: `npm run types:check`
- Format PHP code: Run `vendor/bin/pint`
