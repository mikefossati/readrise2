import { test, expect } from '@playwright/test'

// These tests run WITHOUT the saved auth state (no storageState dependency)
// so they test the unauthenticated experience.

test.use({ storageState: { cookies: [], origins: [] } })

test('unauthenticated user is redirected from /dashboard to /login', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login/)
})

test('unauthenticated user is redirected from /library to /login', async ({ page }) => {
  await page.goto('/library')
  await expect(page).toHaveURL(/\/login/)
})

test('login page is accessible', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
})
