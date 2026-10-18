# Forbidden
- Never install external icon libraries (lucide, fontawesome, react-icons) — keep bundle size minimal and use inline SVGs.
- Never edit files outside explicitly stated scope — avoids unexpected regression and unintended changes.
- Never commit broken TypeScript types or lint failures — keeps main branch always buildable.

# Conventions
- All helper functions in src/lib must be pure functions with JSDoc comments.
- Component props must be typed explicitly using types from src/types.ts.
- Always check git status after file modifications to verify untouched scope.

# Stack & architecture
- Vite + React + TypeScript in ~/file-browser
- Pure domain models in src/types.ts, pure utilities in src/lib/

# Commands
- npm run dev — start Vite local development server
- npm run build — verify production TypeScript and Vite bundle
- npx tsc --noEmit — quick type check

# Open questions
- Sorting and filtering: implement client-side or prepare for backend API?
- File selection: single selection vs. multi-select state management?
