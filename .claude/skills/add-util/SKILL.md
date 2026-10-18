---
name: add-util
description: Adds a new pure utility function to src/lib/ with TypeScript types and JSDoc comments. Use whenever the user asks to add or scaffold a utility helper.
---
When adding a utility function:
1. Ensure the function is pure and placed in `src/lib/format.ts` or a new file under `src/lib/`.
2. Add comprehensive JSDoc comments with @param and @returns tags.
3. Validate type compilation by running `npx tsc --noEmit`.
