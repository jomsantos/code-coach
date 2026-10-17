import { expect, test } from '@playwright/test'

test('learner selects an exercise, edits code, and sees a passing check', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Say hello.' })).toBeVisible()
  await page.getByRole('button', { name: /Add two numbers/ }).click()
  const editor = page.getByRole('textbox', { name: 'Your Gleam solution' })
  await editor.fill('pub fn add_two(a: Int, b: Int) -> Int {\n  a + b\n}')
  await page.getByRole('button', { name: /Run checks/ }).click()
  await expect(page.getByText('All checks passed')).toBeVisible()
})

test('shows a failing check and exercise-specific hint', async ({ page }) => {
  await page.goto('/')
  await page
    .getByRole('textbox', { name: 'Your Gleam solution' })
    .fill('pub fn greeting() -> String { "Hi" }')
  await page.getByRole('button', { name: /Run checks/ }).click()
  await expect(page.getByText('One check still needs work')).toBeVisible()

  await page.getByRole('button', { name: /Give me a hint/ }).click()
  await expect(page.getByText(/A Gleam string is written between double quotes/)).toBeVisible()
})

test('recovers after a hint request cannot reach the local service', async ({ page }) => {
  let failOnce = true
  await page.route('http://127.0.0.1:3000/api/v1/exercises/hello-world/hint', async (route) => {
    if (failOnce) {
      failOnce = false
      await route.abort('failed')
      return
    }
    await route.continue()
  })

  await page.goto('/')
  await page.getByRole('button', { name: /Give me a hint/ }).click()
  await expect(
    page.getByRole('alert').filter({ hasText: 'Could not reach the local Code Coach service' }),
  ).toBeVisible()
  await page.getByRole('button', { name: /Try again/ }).click()
  await expect(page.getByText(/A Gleam string is written between double quotes/)).toBeVisible()
})

test('keeps exercise selection and help available on a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'Available exercises' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Give me a hint/ })).toBeVisible()
})
