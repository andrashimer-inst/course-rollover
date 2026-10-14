import { createContext, useContext } from 'react'
import { canvas, dark, light } from '@instructure/ui/v11_7'

// The three themes the template can show. "legacy" is InstUI's `canvas` theme.
export const THEMES = { legacy: canvas, light, dark }
export type ThemeKey = keyof typeof THEMES

// Lets custom components (wrapper, nav, FigmaAlert) read the active theme's own tokens.
export const AppThemeContext = createContext<ThemeKey>('light')
export const useAppThemeKey = () => useContext(AppThemeContext)

type Shadow = Record<string, { x: string; y: string; blur: string; spread: string; color: string }>
export const shadowCss = (shadow: Shadow) =>
  Object.values(shadow)
    .map((s) => `${s.x} ${s.y} ${s.blur} ${s.spread} ${s.color}`)
    .join(', ')

// Colors, radius and shadows from the theme's own shared tokens (the same ones Figma uses),
// so custom surfaces follow Legacy, Light and Dark without hard-coded values.
export function useSurfaceTokens() {
  const key = useAppThemeKey()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nt = (THEMES[key] as any).newTheme
  const semantic = nt.semantics(nt.primitives)
  const shared = nt.sharedTokens(semantic)
  return {
    key,
    pageColor: shared.background.pageColor as string, // page background (light grey in Light)
    containerColor: shared.background.containerColor as string, // cards, nav, panels
    inverseColor: shared.background.inverseColor as string, // dark navy bar in Legacy
    onColor: shared.background.onColor as string, // text and icons on dark surfaces
    linkColor: semantic.color.text.info as string,
    fontFamily: semantic.fontFamily.base as string,
    borderColor: shared.stroke.mutedColor as string,
    borderWidth: shared.strokeWidth.sm as string,
    radius: shared.borderRadius.lg as string,
    shadowResting: shadowCss(shared.boxShadow.elevation1),
    shadowRaised: shadowCss(shared.boxShadow.elevation2),
  }
}
