---
date: 2026-10-25
reason: Epic 1 Retrospective open item A1 (component layer had no unit tests)
paths:
  - "src/components/**"
---

# Components ship with render and role assertions

The component layer had no unit tests, so accessibility policy could regress while build, lint and tests stayed green. Extends [component-tests.md](component-tests.md).

- Every component change comes with a test that renders the component and asserts its ARIA role (`tree`, `treeitem`, `group`, `button`) and the `aria-*` state it owns (`aria-selected`, `aria-expanded`, `tabIndex`).
- Query by role, not by class name or test id.
- No DOM test environment exists yet. Until it does, log the untested behavior in `_bmad-output/implementation-artifacts/deferred-work.md` and say it was not exercised in a browser. Do not claim it verified.

## Bad

```tsx
it('renders', () => {
  const { container } = render(<TreeNode {...props} />)
  expect(container.firstChild).toBeTruthy() // proves nothing about roles or state
})
```

## Good

```tsx
it('renders a selected, collapsed folder as an accessible treeitem', () => {
  render(<TreeNode {...folderProps} selected />)
  const item = screen.getByRole('treeitem', { name: 'src' })
  expect(item).toHaveAttribute('aria-selected', 'true')
  expect(item).toHaveAttribute('aria-expanded', 'false')
  expect(item).toHaveAttribute('tabindex', '0')
})
```
