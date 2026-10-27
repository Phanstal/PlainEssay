import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('creates an essay, autosaves, survives reload, and exports both formats', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Essays' })).toBeVisible();
  await expect(page.getByText('No essays yet')).toBeVisible();

  await page.getByRole('button', { name: /New essay/i }).click();
  await expect(page.getByLabel('Essay title')).toBeVisible();

  await page.getByLabel('Essay title').fill('A Quiet Morning');
  await page.locator('.essay-body').click();
  await page.keyboard.type('A quiet place for ideas. ');
  await page.keyboard.press('Control+b');
  await page.keyboard.type('Bold thought');
  await page.keyboard.press('Control+b');
  await page.keyboard.type(' and ');
  await page.keyboard.press('Control+i');
  await page.keyboard.type('italic');
  await page.keyboard.press('Control+i');
  await page.keyboard.type('.');

  await expect(page.locator('.word-count')).toHaveText('9 words');
  await expect(page.locator('.save-status')).toHaveText('Saved');

  const markdownDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export .md' }).click();
  const markdown = await markdownDownload;
  expect(markdown.suggestedFilename()).toBe('A Quiet Morning.md');
  const markdownPath = await markdown.path();
  expect(markdownPath).not.toBeNull();
  const markdownContent = await readFile(markdownPath!, 'utf8');
  expect(markdownContent).toContain('# A Quiet Morning');
  expect(markdownContent).toContain('**Bold thought**');
  expect(markdownContent).toContain('*italic*');

  const docxDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export .docx' }).click();
  const docx = await docxDownload;
  expect(docx.suggestedFilename()).toBe('A Quiet Morning.docx');
  const docxPath = await docx.path();
  expect(docxPath).not.toBeNull();
  const docxBytes = await readFile(docxPath!);
  expect(docxBytes.byteLength).toBeGreaterThan(1_000);
  expect(docxBytes.subarray(0, 2).toString()).toBe('PK');

  await page.getByRole('button', { name: 'Back to essays' }).click();
  await expect(page.locator('.document-row')).toHaveCount(1);
  await expect(page.locator('.document-row strong')).toHaveText('A Quiet Morning');
  await expect(page.locator('.document-row')).toContainText('9 words');

  await page.reload();
  await expect(page.locator('.document-row')).toHaveCount(1);
  await page.locator('.document-row').click();
  await expect(page.getByLabel('Essay title')).toHaveValue('A Quiet Morning');
  await expect(page.locator('.essay-body')).toContainText('Bold thought');
});

test('uses the Untitled Essay fallback for a blank title', async ({ page }) => {
  await page.getByRole('button', { name: /New essay/i }).click();
  await page.locator('.essay-body').click();
  await page.keyboard.type('A few words without a title.');
  await expect(page.locator('.save-status')).toHaveText('Saved');
  await page.getByRole('button', { name: 'Back to essays' }).click();

  await expect(page.locator('.document-row strong')).toHaveText('Untitled Essay');
  await page.reload();
  await expect(page.locator('.document-row strong')).toHaveText('Untitled Essay');
});

test('deletes an essay from the row menu after confirmation', async ({ page }) => {
  await page.getByRole('button', { name: /New essay/i }).click();
  await page.getByLabel('Essay title').fill('Temporary thought');
  await page.getByRole('button', { name: 'Back to essays' }).click();
  await expect(page.locator('.document-row')).toHaveCount(1);

  await page.locator('.document-row').hover();
  await page
    .getByRole('button', { name: 'More options for Temporary thought', exact: true })
    .click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();

  await expect(page.getByText('No essays yet')).toBeVisible();
  await expect(page.locator('.document-row')).toHaveCount(0);
});

test('keeps the mobile layout usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: /New essay/i }).click();
  await page.getByLabel('Essay title').fill('Small screen');
  await page.locator('.essay-body').click();
  await page.keyboard.type('Writing on a phone works too.');
  await expect(page.locator('.save-status')).toHaveText('Saved');

  await expect(page.locator('.word-count')).toBeHidden();
  await expect(page.locator('.secondary-export')).toBeHidden();
  await expect(page.locator('.formatting-toolbar')).toBeVisible();
  await page.getByRole('button', { name: 'Bold' }).click();
  await page.keyboard.type(' Bold');
  await page.getByRole('button', { name: 'Back to essays' }).click();
  await expect(page.locator('.document-row strong')).toHaveText('Small screen');
});
