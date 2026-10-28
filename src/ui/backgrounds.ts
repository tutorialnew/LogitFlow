/**
 * Фоновые решения интерфейса.
 *
 * Специально без стоковых фотографий: у финансового инструмента изображение либо
 * отвлекает от цифр, либо рекламит чужой бренд. Вместо этого — геометрия и свет:
 * дуги повторяют логарифмическую шкалу риска, «умывание» цветом грейда читает
 * вердикт ещё до текста, концентрический круг означают радар-профиль.
 *
 * SVG кодируется в data URI на модуле — без внешних запросов и без MIME-заголовков.
 */
import type { CSSProperties } from 'react'

/** SVG → CSS data URI. Однократно, детерминированно, без сети. */
const toDataUri = (svg: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}")`

/** Верхний баннер: свет латунью и дуги риска. */
const HERO_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='440' viewBox='0 0 1600 440'>
  <defs>
    <radialGradient id='glow' cx='1200' cy='330' r='640' gradientUnits='userSpaceOnUse'>
      <stop offset='0' stop-color='#c39a2c' stop-opacity='.22'/>
      <stop offset='.55' stop-color='#c39a2c' stop-opacity='.07'/>
      <stop offset='1' stop-color='#c39a2c' stop-opacity='0'/>
    </radialGradient>
    <linearGradient id='ramp' x1='0' y1='0' x2='1' y2='0'>
      <stop offset='0' stop-color='#34d399'/>
      <stop offset='.44' stop-color='#facc15'/>
      <stop offset='.7' stop-color='#f59e0b'/>
      <stop offset='1' stop-color='#be123c'/>
    </linearGradient>
  </defs>
  <rect width='1600' height='440' fill='url(#glow)'/>
  <g fill='none' stroke='url(#ramp)' stroke-opacity='.17' stroke-width='1.1' stroke-linecap='round'>
    <path d='M0 396 Q 340 318 680 286 T 1320 254 T 1600 242'/>
    <path d='M0 416 Q 360 338 720 306 T 1360 274 T 1600 262'/>
    <path d='M0 436 Q 380 358 760 326 T 1400 294 T 1600 282'/>
    <path d='M0 456 Q 400 378 800 346 T 1440 314 T 1600 302'/>
  </g>
  <g stroke='#ffffff' stroke-opacity='.05' stroke-width='1'>
    <line x1='0' y1='148' x2='1600' y2='148'/>
    <line x1='0' y1='212' x2='1600' y2='212'/>
    <line x1='0' y1='276' x2='1600' y2='276'/>
  </g>
</svg>`

export const heroBand = toDataUri(HERO_SVG)

/** Фирменное «умывание» вердикта цветом грейда. */
export function gradeWash(toneColor: string): CSSProperties {
  return {
    backgroundImage: `radial-gradient(130% 110% at 0% 0%, ${toneColor}26 0%, transparent 58%), radial-gradient(100% 90% at 100% 100%, ${toneColor}14 0%, transparent 62%)`,
  }
}

/** Концентрические круги — отсылка к радар-чарту. Для пустых состояний. */
const CONTOUR_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260' viewBox='0 0 260 260'>
  <g fill='none' stroke='#ffffff' stroke-opacity='.07' stroke-width='1'>
    <circle cx='130' cy='130' r='24'/>
    <circle cx='130' cy='130' r='48'/>
    <circle cx='130' cy='130' r='72'/>
    <circle cx='130' cy='130' r='96'/>
    <circle cx='130' cy='130' r='120'/>
  </g>
  <g fill='none' stroke='#ffffff' stroke-opacity='.05' stroke-width='1'>
    <line x1='130' y1='10' x2='130' y2='250'/>
    <line x1='10' y1='130' x2='250' y2='130'/>
  </g>
</svg>`

export const radarContour = toDataUri(CONTOUR_SVG)
