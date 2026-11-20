import { test, expect } from '@playwright/test';

test.describe('角色权限管理页面', () => {
  test('切换到角色权限Tab', async ({ page }) => {
    await page.goto('/employees');
    await page.click('text=角色权限');
    await expect(page.locator('text=角色权限')).toHaveClass(/bg-gradient-to-r/);
  });

  test('角色列表展示', async ({ page }) => {
    await page.goto('/employees');
    await page.click('text=角色权限');
    await page.waitForSelector('table');
    const rows = page.locator('tbody tr');
    await expect(rows).toBeVisible();
  });

  test('添加角色弹窗', async ({ page }) => {
    await page.goto('/employees');
    await page.click('text=角色权限');
    await page.click('text=添加角色');
    await expect(page.locator('text=新增角色')).toBeVisible();
    await page.click('text=取消');
    await expect(page.locator('text=新增角色')).not.toBeVisible();
  });

  test('搜索角色功能', async ({ page }) => {
    await page.goto('/employees');
    await page.click('text=角色权限');
    const searchInput = page.locator('input[placeholder*="搜索角色"]');
    await searchInput.fill('管理员');
    await page.keyboard.press('Enter');
  });

  test('权限分配弹窗', async ({ page }) => {
    await page.goto('/employees');
    await page.click('text=角色权限');
    await page.click('text=权限设置');
    await expect(page.locator('text=权限分配')).toBeVisible();
    await page.click('text=取消');
    await expect(page.locator('text=权限分配')).not.toBeVisible();
  });
});