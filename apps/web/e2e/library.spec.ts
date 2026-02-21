import { test, expect } from '@playwright/test'

// Uses the auth state saved by auth.setup.ts
// Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD to be set.

test('authenticated user can reach the library page', async ({ page }) => {
  await page.goto('/library')
  await expect(page.getByRole('heading', { name: /library/i })).toBeVisible()
})

test('authenticated user can open the Add book dialog', async ({ page }) => {
  await page.goto('/library')
  await page.getByRole('button', { name: /add book/i }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByPlaceholder(/search by title/i)).toBeVisible()
})

test('searching returns results', async ({ page }) => {
  await page.goto('/library')
  await page.getByRole('button', { name: /add book/i }).click()
  await page.getByPlaceholder(/search by title/i).fill('Clean Code')
  // Wait for the debounce + network response
  await page.waitForResponse((r) => r.url().includes('/api/books/search'), { timeout: 10_000 })
  await expect(page.getByText(/clean code/i).first()).toBeVisible()
})
