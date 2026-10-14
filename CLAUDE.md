# InstUI designs: base template

Designer-owned repo for building screens from the InstUI component library and
previewing them on localhost. The owner is a designer, not a developer. Explain
steps in plain language and run commands for them where possible.

## Start every design from this base

- Page shell: `src/DesktopWrapper.tsx`. Every full-page design goes inside it. It follows the
  Figma "Wrapper Guide": Global Nav (always), header with page title (always), content area
  (always), optional trailing area, and a user-opened utility panel (one at a time).
- Theme switcher (Legacy, Light, Dark) lives in `src/App.tsx`. Keep it on every design so the
  designer can check all three themes.
- Rules from the guide: one wrapper per page, never nest. `fullWidth` for dashboards and
  tables, narrow for forms and reading pages. Modals, trays and drawers don't use the wrapper.

## Build rules

- Use only components from the InstUI package. Import from `@instructure/ui/v11_7` (the default
  `@instructure/ui` entry has no `light` or `dark` themes).
- Keep `@instructure/ui` pinned to `11.7.8`. Version 11.7.9 has a broken package on npm.
- No hard-coded colors, fonts, or spacing. Use component props and theme tokens so all three
  themes work. Keep Text and Heading components separate.
- InstUI `View` ignores layout styles such as `flex` and `width`. Use plain `div` boxes for layout.
- Figma-only "(beta)" components (GlobalNav, Wrapper, ContentTabList, TrailingContentArea,
  UtilityPanel) don't exist in the package. Build them from `SideNavBar`, `Tray`, `Tabs` and so on.
- Show the Badge on header buttons and the Alert on pages only when the Figma guidance fits.
  Figma component pages: Alert, Badge, Avatar and AI components are read.

## Figma

- File: InstUI Component Library, key `5WFqF3HVlNdfcJooCaiFoh`.
- Read-only. Never edit the file, and never set up Code Connect (it would change the shared library).
- The connector can't list pages and fails on pages that are too large. Ask for a link to one
  component page or one frame at a time (right-click, Copy link to selection).
- Call `get_design_context` with `disableCodeConnect: true`.

## Data

- Use synthetic data only (made-up names, courses, grades). Real student or employee data
  falls under FERPA and PII rules. Flag it and get Security or Privacy review before it goes
  anywhere shared.

## Run it

- Node lives in `~/.local/node` (linked into `~/.local/bin`). Add that folder to PATH if
  `node` is not found.
- Preview: `npm run dev`, then open http://localhost:5173
- Check a build: `npm run build`
- Commit and push only when the owner asks. Git author is set for this repo only.
