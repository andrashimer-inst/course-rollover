# InstUI designs: base template

Designer-owned repo for building screens from the InstUI component library and
previewing them on localhost. The owner is a designer, not a developer. Explain
steps in plain language and run commands for them where possible.

## Start every design from this base

- Left nav: `src/GlobalNav.tsx`, matching the Figma Global Nav (institution "Instructure", user
  "User Name", collapsible, Canvas label at the bottom). Don't swap in other nav components.
- Page shell: `src/DesktopWrapper.tsx`. Every full-page design goes inside it. It follows the
  Figma "Wrapper Guide": Global Nav (always), header with page title (always), content area
  (always), optional trailing area, and a user-opened utility panel (one at a time). Light and Dark
  use the Figma wrapper (`src/ModernWrapper.tsx`); Legacy keeps its own shell, see below.
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
- Use `DateInput`, never `DateInput2`: `DateInput2` has no dark-theme support (its labels turn
  unreadable in Dark). The 11.7 `DateInput` has the same API. Before using any component, check
  that it is not marked deprecated in `docs/instui-site/<Component>.md`.
- InstUI `View` ignores layout styles such as `flex` and `width`. Use plain `div` boxes for layout.
- Figma-only "(beta)" components (GlobalNav, Wrapper, ContentTabList, TrailingContentArea,
  UtilityPanel) don't exist in the package. Build them from `SideNavBar`, `Tray`, `Tabs` and so on.
- **Source of truth.** Design (how it looks, which variants, when to use it) follows the Figma
  components. Buildability follows the installed package, which is the latest code. The site docs
  mostly describe the legacy components, so use them for behavior and examples only. Where Figma
  and code disagree, design from Figma, build with the closest package component, and say what the
  code can't do. Details and name mappings are in `docs/compare.md`.
- Always prefer the `v2` (new theme) version of a component. Check `docs/compare.md` before using a
  component: it lists what is not in the package (for example Card), what is legacy only, and
  Figma-versus-code prop names.
- Before picking or configuring a component, check `docs/components.md`. It summarizes each
  Figma component page: variants, when to use it and when not, best practices, accessibility.
  Follow it, and use its "Choosing between similar components" list.
- **Wrapper layout, Light and Dark (Figma "Wrapper (beta)" page, full notes in `docs/wrapper.md`).**
  `DesktopWrapper` picks the layout from the theme. Light and Dark: Global Nav, then a container
  (32px padding, centered, 1100px at most or full width), then a header area and a content row, then
  an optional utility panel. Pass these props instead of drawing them yourself: `description`,
  `actions` (primary and secondary buttons), `headerSlot`, `tabs`, `showFilters` (search, order by,
  filter button that opens the Filters panel), `contentTabList` ({ title, items }), `trailingContent`
  (a 300px column; the page supplies its own card), `filterContent`, `fullWidth`. The header icon
  buttons (AI agent, notifications, expand width) and the three panels (AI agent, Notifications,
  Filters; 420px, one at a time, focus moves in and back) are built in. The content area is at least
  360px wide, areas are 24px apart. Legacy ignores all of these options and stays exactly as it was:
  never change `LegacyDesktopWrapper` or `LegacyNav` unless the owner asks.
- **Page look (from the Figma wrapper frames).** The wrapper sets the page background from the theme
  (light grey in Light, near black in Dark, white in Legacy). The global nav and the utility panels are
  floating cards on that background in Light and Dark, and a flush full-height nav in Legacy. The
  ContentTabList is a card too; the trailing area and the content are not cards unless the page makes
  them. All of this comes from theme tokens through `useSurfaceTokens()` in `src/appTheme.ts` (it also
  carries the Figma Global Nav tokens and the spacing tokens). In custom components, use those tokens,
  never hard-coded colors.
- **Header spacing (from Figma).** The header is a 40px-tall row with the breadcrumb centered on the left
  and the three 40px icon buttons on the right, then 8px, then the page title (36px, 45px tall), 4px,
  the description (20px). Below that the rows (custom slot, actions, tabs, filtering) are 24px apart,
  and the content row is 32px under the header. A tight title usually means a row is only as tall as
  its text. Check spacing against the Figma layer sizes (row heights, button sizes), not just the gap
  value. After building, measure the rendered gaps in the browser and compare them with the Figma
  numbers (`docs/wrapper.md` lists them).
- **Tables.** Tables sit directly on the page background with no fill: give `Table` and its parts
  (`Table.Head`, `Table.Body`, `Table.Row`, `Table.ColHeader`, `Table.Cell`) a transparent
  background with `themeOverride={{ background: 'transparent' }}` (see `src/CourseRollover.tsx`).
- **Global nav sub navigation (Figma "Multilevel Navigation Flow").** Clicking a main item with a
  chevron (Courses) opens a 200px panel inside the nav card: a 24px bold title, a separator, then
  the options, and a button at the top right to close it. An option with a chevron opens the next
  level in place (back button "‹ Courses" plus the new title). It is InstUI's `Drilldown`, with a
  transparent background so the options sit on the nav. When the sub nav is closed a 32px strip
  with an open button stays (also when the nav is collapsed). Going to a course marks both "Courses"
  and the course as current (check mark). All of it is in `src/GlobalNav.tsx` and reads theme tokens.
  The nav collapses to 104px (6px margin, icons only, the Inbox badge on the icon, the Canvas mark at
  the bottom) with the "Collapse sidebar" button. Light and Dark use the new (lucide) icons; the page
  you are on is filled, an item with its sub navigation open is tinted.
- **Legacy global nav.** In Legacy the left nav is the Canvas one: a flush, full-height dark bar
  (80px) with stacked icon-and-label items (Account, Admin, Dashboard, Courses, Calendar, Inbox,
  History, Portfolio, Help with a badge), the current item as a white tab, and a collapse arrow at
  the bottom. It is `LegacyNav` in `src/GlobalNav.tsx`. The Canvas logo at the top is a text
  placeholder. Light and Dark use the floating card nav described above.
- **Course menu.** A page inside a course passes `course={{ name, items }}` to `DesktopWrapper`
  (items: `label`, `unpublished`, `current`; `src/sampleCourse.ts` has a sample). The wrapper does
  the rest, so the page must NOT draw its own course menu. In Light and Dark the menu (with an eye
  icon on unpublished items and a check on the current one) is the first level of the Courses sub
  navigation, with a "‹ Courses" back button to the course list. In Legacy there is no sub
  navigation (no strip, no panel, no chevron on Courses). The wrapper draws the menu as a secondary
  navigation column of plain blue links with eye icons next to the dark bar (`LegacyCourseMenu`).
  In that layout the breadcrumb row (with the header buttons) spans the top, above the secondary
  navigation, and the page title and content start below it, to the right of the menu.
- **Alerts.** Use `src/FigmaAlert.tsx`, not the package `Alert`. The package Alert puts the new colors
  in the old layout. FigmaAlert draws the Figma design (solid floating, tinted inline) in Light and
  Dark and falls back to the package Alert in Legacy, which is already the Figma legacy design.
- A design branch must keep the theme context: `App.tsx` wraps the page in
  `AppThemeContext.Provider value={themeKey}` next to `InstUISettingsProvider`.
- Spacing between components: follow `docs/spacing.md` (tokens such as `gap.sections`,
  `gap.buttons`, `gap.cards.md`, `padding.card.lg`). Don't invent spacing values.
- For props, examples and details of any component or guide, read the matching file in
  `docs/instui-site/` (a local copy of https://instructure.design/; `index.md` lists everything).
  That site covers InstUI 11.7.9; this repo is on 11.7.8.
- Mock content is realistic and synthetic, never lorem ipsum.

## Figma

- File: InstUI Component Library, key `5WFqF3HVlNdfcJooCaiFoh`. All shared page links are in
  `docs/figma-links.md`. When the owner says the library changed, re-read those pages and update
  `docs/components.md`.
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

## Branches: template and designs

- `main` is the clean template. Never put a design on `main`.
- Each design lives on its own branch cut from `main`, named for the design (for example
  `course-rollover`). A design adds its own page file (for example `src/CourseRollover.tsx`) and
  points `src/App.tsx` at it. Keep `DesktopWrapper`, `GlobalNav` and the theme switcher as they are.
- Start a new design: `git checkout main && git pull && git checkout -b <design-name>`.
- Improvements to the template itself (wrapper, nav, switcher, docs) go on `main`, then get merged
  into the design branches that need them.
