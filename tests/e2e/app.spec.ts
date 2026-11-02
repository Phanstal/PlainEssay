import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import JSZip from 'jszip';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('creates an essay, autosaves, survives reload, and exports both formats', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Essays' })).toBeVisible();
  await expect(page.getByText('Start a new essay')).toBeVisible();

  await page.getByRole('button', { name: 'New essay', exact: true }).click();
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

  await page.getByRole('button', { name: 'Export .docx' }).click();
  const dialog = page.getByRole('dialog', { name: 'Export document' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Export typeface')).toHaveValue('times');
  await expect(dialog.getByLabel('Export line spacing')).toHaveValue('double');
  await expect(dialog.getByLabel('Export paper size')).toHaveValue('letter');

  const docxDownload = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Export .docx' }).click();
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

test('uses the Plain wordmark in the library and editor', async ({ page }) => {
  await expect(page.locator('.home-nav .wordmark')).toHaveText('Plain');
  await page.getByRole('button', { name: 'New essay', exact: true }).click();
  await expect(page.locator('.toolbar .wordmark')).toHaveText('Plain');
});

test('exports docx with selected typeface, spacing, paper size, indent, and clean quotes', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'New essay', exact: true }).click();
  await page.getByLabel('Essay title').fill('Quotes');
  await page.locator('.essay-body').click();
  await page.keyboard.type('She said, "it\'s fine."');

  await page.getByRole('button', { name: 'Export .docx' }).click();
  const dialog = page.getByRole('dialog', { name: 'Export document' });
  await dialog.getByLabel('Export typeface').selectOption('arial');
  await dialog.getByLabel('Export line spacing').selectOption('single');
  await dialog.getByLabel('Export paper size').selectOption('a4');

  const downloadPromise = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Export .docx' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const zip = await JSZip.loadAsync(await readFile(path!));
  const xml = await zip.file('word/document.xml')!.async('string');

  expect(xml).toContain('w:ascii="Arial"');
  expect(xml).toContain('w:line="240"');
  expect(xml).toContain('w:pgSz w:w="11907" w:h="16839"');
  expect(xml).toContain('<w:ind w:firstLine="720"/>');
  expect(xml).toContain('She said, “it’s fine.”');
});

test('uses the Untitled Essay fallback for a blank title', async ({ page }) => {
  await page.getByRole('button', { name: 'New essay', exact: true }).click();
  await page.locator('.essay-body').click();
  await page.keyboard.type('A few words without a title.');
  await expect(page.locator('.save-status')).toHaveText('Saved');
  await page.getByRole('button', { name: 'Back to essays' }).click();

  await expect(page.locator('.document-row strong')).toHaveText('Untitled Essay');
  await page.reload();
  await expect(page.locator('.document-row strong')).toHaveText('Untitled Essay');
});

test('deletes an essay from the row menu after confirmation', async ({ page }) => {
  await page.getByRole('button', { name: 'New essay', exact: true }).click();
  await page.getByLabel('Essay title').fill('Temporary thought');
  await page.getByRole('button', { name: 'Back to essays' }).click();
  await expect(page.locator('.document-row')).toHaveCount(1);

  await page.locator('.document-row').hover();
  await page
    .getByRole('button', { name: 'More options for Temporary thought', exact: true })
    .click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();

  await expect(page.getByText('Start a new essay')).toBeVisible();
  await expect(page.locator('.document-row')).toHaveCount(0);
});

test('finds, replaces, reports selected words, and undoes changes', async ({ page }) => {
  await page.getByRole('button', { name: 'New essay', exact: true }).click();
  await page.locator('.essay-body').click();
  await page.keyboard.type('alpha beta alpha');
  await expect(page.locator('.word-count')).toHaveText('3 words');

  await page.keyboard.press('Control+f');
  await expect(page.getByRole('search', { name: 'Find and replace' })).toBeVisible();
  await page.getByLabel('Find text').fill('alpha');
  await expect(page.locator('.find-bar span')).toHaveText('1 of 2');

  await page.keyboard.press('Enter');
  await expect(page.locator('.word-count')).toHaveText('1 selected');

  await page.getByLabel('Replacement text').fill('omega');
  await page.getByRole('button', { name: 'Replace', exact: true }).click();
  await expect(page.locator('.essay-body')).toContainText('omega beta alpha');

  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page.locator('.essay-body')).toContainText('omega beta omega');

  await page.getByRole('button', { name: 'Close find' }).click();
  await expect(page.getByRole('search')).toHaveCount(0);

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.essay-body')).toContainText('omega beta alpha');
});

test('pastes a local image and keeps it after reload', async ({ page }) => {
  const tinyPng =
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAYAAAC56t6BAAAAEUlEQVR42mNk+M9Qz8DAwMAAAA0AAf8B9YQAAAAASUVORK5CYII=';

  await page.getByRole('button', { name: 'New essay', exact: true }).click();
  await page.locator('.essay-body').click();
  await page.evaluate((base64) => {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const file = new File([bytes], 'dot.png', { type: 'image/png' });
    const data = new DataTransfer();
    data.items.add(file);
    const event = new ClipboardEvent('paste', {
      clipboardData: data,
      bubbles: true,
      cancelable: true,
    });
    document.querySelector('.essay-body')?.dispatchEvent(event);
  }, tinyPng);

  await expect(page.locator('.essay-body img')).toHaveCount(1);
  await expect(page.locator('.save-status')).toHaveText('Saved');

  await page.reload();
  await page.locator('.document-row').click();
  await expect(page.locator('.essay-body img')).toHaveCount(1);
});

test('keeps the mobile layout usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'New essay', exact: true }).click();
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
