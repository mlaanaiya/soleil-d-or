import { expect, test } from '@playwright/test'

test.describe('mobile', () => {
  test('menu plein écran accessible', async ({ page }) => {
    await page.goto('/')
    const toggle = page.getByRole('button', { name: 'Ouvrir le menu' })
    await toggle.click()
    const menu = page.getByRole('dialog', { name: 'Menu' })
    await expect(menu).toHaveAttribute('data-open', 'true')
    await expect(menu.getByRole('link', { name: /Galerie/ })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(menu).toHaveAttribute('data-open', 'false')
    await toggle.click()
    await menu.getByRole('link', { name: /Galerie/ }).click()
    await expect(page).toHaveURL(/\/galerie$/)
  })

  test('carte : vignettes compactes et aucun débordement horizontal', async ({ page }) => {
    await page.goto('/carte')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    await expect(page.getByRole('navigation', { name: 'Catégories de la carte' })).toBeVisible()
  })

  test('aucune page ne déborde horizontalement', async ({ page }) => {
    for (const path of ['/', '/restaurant', '/galerie', '/contact', '/carte/naan-kebab', '/mentions-legales']) {
      await page.goto(path)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow, path).toBeLessThanOrEqual(0)
    }
  })
})
