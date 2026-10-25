import { expect, test } from '@playwright/test'
import { settled } from './helpers'

test.describe('site public', () => {
  test('accueil : hero, sections et absence d’erreurs', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText("Soleil d'Or")
    await expect(page.locator('#featured-title')).toBeAttached()
    await expect(page.locator('#categories-title')).toBeAttached()
    await expect(page.getByRole('link', { name: 'Découvrir la carte' })).toBeVisible()
    // nothing invented: no price, address or hours are configured yet
    await expect(page.getByText('L’adresse sera publiée ici très prochainement.')).toBeAttached()
    expect(errors).toEqual([])
  })

  test('transition « lever de soleil » vers la carte', async ({ page }) => {
    await page.goto('/')
    await page
      .getByRole('navigation', { name: 'Navigation principale' })
      .getByRole('link', { name: 'La carte' })
      .click()
    await expect(page).toHaveURL(/\/carte$/)
    await settled(page)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('La carte')
  })

  test('carte : catégories, recherche et liste rapide', async ({ page }) => {
    await page.goto('/carte')
    for (const name of [
      'Sandwichs',
      'Assiettes',
      'Tacos',
      'Burgers',
      'Crousty riz',
      'Bowls',
      'Accompagnements',
      'Boissons',
    ]) {
      await expect(page.getByRole('heading', { level: 2, name, exact: true })).toBeAttached()
    }
    await page.getByLabel('Rechercher un produit').fill('kébab')
    await expect(page.getByText(/résultat\(s\) pour « kébab »/)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Burgers', exact: true })).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 3, name: 'Naan kebab' })).toBeVisible()
    await page.getByLabel('Rechercher un produit').fill('introuvable')
    await expect(page.getByText('Aucun produit ne correspond.')).toBeVisible()
    await page.getByRole('button', { name: 'Effacer la recherche' }).click()
    await page.getByRole('button', { name: 'Liste rapide' }).click()
    await expect(page.getByRole('button', { name: 'Liste rapide' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('Cette rubrique sera bientôt détaillée.')).toBeVisible()
  })

  test('fiche produit et produits voisins', async ({ page }) => {
    await page.goto('/carte/tacos-poulet')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tacos poulet')
    await expect(page.getByText('Prix communiqué au restaurant')).toBeVisible()
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent()
    expect(JSON.parse(ld!)['@type']).toBe('MenuItem')
    await page.getByRole('link', { name: /Suivant/ }).click()
    await expect(page).not.toHaveURL(/tacos-poulet/)
    await settled(page)
  })

  test('galerie : visionneuse au clavier', async ({ page }) => {
    await page.goto('/galerie')
    await page
      .getByRole('button', { name: /Agrandir/ })
      .first()
      .click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toHaveAttribute('data-open', 'true')
    await expect(dialog.getByText('01 /')).toBeVisible()
    await page.keyboard.press('ArrowRight')
    await expect(dialog.getByText('02 /')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveAttribute('data-open', 'false')
  })

  test('les services non activés n’existent pas', async ({ page }) => {
    expect((await page.goto('/commander'))!.status()).toBe(404)
    expect((await page.goto('/reserver'))!.status()).toBe(404)
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Commander' })).toHaveCount(0)
  })

  test('404 habillée', async ({ page }) => {
    const res = await page.goto('/cette-page-n-existe-pas')
    expect(res!.status()).toBe(404)
    await expect(page.getByRole('heading', { name: /Éclipse/ })).toBeVisible()
  })

  test('mouvements réduits : pas d’animation de révélation', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    await page.goto('/')
    await expect(page.locator('html')).not.toHaveAttribute('data-motion', '')
    await ctx.close()
  })
})

test.describe('référencement et sécurité', () => {
  test('robots, sitemap, images sociales', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toContain('Disallow: /admin')
    expect(robots).toContain('http://localhost:3200/sitemap.xml')
    const sitemap = await (await request.get('/sitemap.xml')).text()
    expect(sitemap).toContain('/carte/double-cheeseburger')
    expect(sitemap).not.toContain('/commander')
    const og = await request.get('/opengraph-image')
    expect(og.headers()['content-type']).toBe('image/png')
  })

  test('en-têtes de sécurité', async ({ request }) => {
    const res = await request.get('/')
    const h = res.headers()
    expect(h['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(h['content-security-policy']).toMatch(/script-src 'self' 'nonce-/)
    expect(h['x-content-type-options']).toBe('nosniff')
    expect(h['x-frame-options']).toBe('DENY')
    expect(h['x-powered-by']).toBeUndefined()
    const admin = await request.get('/admin/connexion')
    expect(admin.headers()['x-robots-tag']).toContain('noindex')
  })

  test('routes protégées', async ({ request }) => {
    const upload = await request.post('/api/admin/media', {
      multipart: { kind: 'photo' },
      headers: { origin: 'http://localhost:3200' },
    })
    expect(upload.status()).toBe(401)
    const cross = await request.post('/api/admin/media', {
      multipart: { kind: 'photo' },
      headers: { origin: 'https://evil.example' },
    })
    expect(cross.status()).toBe(403)
    expect((await request.get('/media/..%2F..%2Fsoleil-d-or.sqlite/800.webp')).status()).toBe(404)
    expect((await request.get('/media/abcdefghij/../../x')).status()).toBe(404)
    const page = await request.get('/admin/produits', { maxRedirects: 0 })
    expect(page.status()).toBe(307)
    expect(page.headers().location).toContain('/admin/connexion')
  })
})
