import { test, expect } from '@playwright/test';

test.describe('门店管理页面', () => {
  test('切换到门店管理Tab', async ({ page }) => {
    await page.goto('/employees');
    await page.click('text=门店管理');
    await expect(page.locator('text=门店管理')).toHaveClass(/bg-gradient-to-r/);
  });

  test('门店列表展示', async ({ page }) => {
    await page.goto('/employees');
    await page.click('text=门店管理');
    await page.waitForSelector('table');
    const rows = page.locator('tbody tr');
    await expect(rows).toBeVisible();
  });

  test('当前门店展示', async ({ page }) => {
    await page.goto('/employees');
    await page.click('text=门店管理');
    await expect(page.locator('text=当前门店')).toBeVisible();
  });

  test('添加门店弹窗', async ({ page }) => {
    await page.goto('/employees');
    await page.click('text=门店管理');
    await page.click('text=添加门店');
    await expect(page.locator('text=新增门店')).toBeVisible();
    await page.click('text=取消');
    await expect(page.locator('text=新增门店')).not.toBeVisible();
  });

  test('搜索门店功能', async ({ page }) => {
    await page.goto('/employees');
    await page.click('text=门店管理');
    const searchInput = page.locator('input[placeholder*="搜索门店"]');
    await searchInput.fill('测试门店');
    await page.keyboard.press('Enter');
  });
});