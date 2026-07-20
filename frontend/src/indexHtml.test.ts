import { describe, expect, it } from 'vitest'
import html from '../index.html?raw'

describe('index.html localization', () => {
  it('declares Spanish and uses a Spanish document title', () => {
    expect(html).toContain('<html lang="es">')
    expect(html).toContain('<title>JEB | Demostración transparente del carrito</title>')
    expect(html).not.toContain('JEB transparent cart demo')
  })
})
