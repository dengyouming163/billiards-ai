import { test, expect } from '@playwright/test';

test.describe('员工管理页面', () => {
  test('页面加载正常', async ({ page }) => {
    await page.goto('/employees');
    await expect(page.locator('h1')).toContainText('员工管理');
  });

  test('Tab切换功能', async ({ page }) => {
    await page.goto('/employees');
    
    await page.click('text=门店管理');
    await expect(page.locator('text=门店管理')).toHaveClass(/bg-gradient-to-r/);
    
    await page.click('text=角色权限');
    await expect(page.locator('text=角色权限')).toHaveClass(/bg-gradient-to-r/);
    
    await page.click('text=员工管理');
    await expect(page.locator('text=员工管理')).toHaveClass(/bg-gradient-to-r/);
  });

  test('员工列表展示', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForSelector('table');
    const rows = page.locator('tbody tr');
    await expect(rows).toBeVisible();
  });

  test('搜索功能', async ({ page }) => {
    await page.goto('/employees');
    const searchInput = page.locator('input[placeholder*="搜索"]');
    await searchInput.fill('测试员工');
    await page.keyboard.press('Enter');
  });

  test('添加员工弹窗', async ({ page }) => {
    await page.goto('/employees');
    await page.click('text=添加员工');
    await expect(page.locator('text=新增员工')).toBeVisible();
    await page.click('text=取消');
    await expect(page.locator('text=新增员工')).not.toBeVisible();
  });
});