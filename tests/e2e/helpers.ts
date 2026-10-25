import { expect, type Page } from '@playwright/test'

export const ADMIN = { username: 'e2e', password: 'e2e-mot-de-passe' }

export async function login(page: Page) {
  await page.goto('/admin/connexion')
  await page.getByLabel('Identifiant').fill(ADMIN.username)
  await page.getByLabel('Mot de passe').fill(ADMIN.password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page).toHaveURL(/\/admin$/)
}

/** Waits for the page-transition veil to be gone. */
export async function settled(page: Page) {
  await expect(page.locator('[data-active="true"][aria-hidden="true"]')).toHaveCount(0)
}

export async function toast(page: Page) {
  const t = page.locator('.adm-toast')
  await expect(t).toBeVisible()
  return (await t.innerText()).trim()
}
