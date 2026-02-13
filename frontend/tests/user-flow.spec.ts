import { test, expect } from '@playwright/test';

test.describe('User Flow Test', () => {
  test('register → create project → apply → accept → pay → confirm → payout', async ({ page }) => {
    // Шаг 1: Регистрация пользователя
    await page.goto('/auth/register');
    await page.fill('[data-testid="email"]', 'testuser@example.com');
    await page.fill('[data-testid="password"]', 'SecurePassword123');
    await page.fill('[data-testid="firstName"]', 'Test');
    await page.fill('[data-testid="lastName"]', 'User');
    await page.click('[data-testid="register-button"]');
    
    await expect(page).toHaveURL('/dashboard');
    
    // Шаг 2: Создание проекта (если пользователь зарегистрировался как клиент)
    await page.click('[data-testid="create-project"]');
    await page.fill('[data-testid="project-title"]', 'Test Project');
    await page.fill('[data-testid="project-description"]', 'This is a test project');
    await page.fill('[data-testid="project-budget"]', '500');
    await page.click('[data-testid="submit-project"]');
    
    await expect(page.locator('[data-testid="project-created"]')).toBeVisible();
    
    // Шаг 3: Логин как фрилансер (в реальном тесте потребуется второй пользователь)
    // Для демонстрации предположим, что мы переключаемся на другого пользователя
    await page.click('[data-testid="logout"]');
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'freelancer@example.com');
    await page.fill('[data-testid="password"]', 'SecurePassword123');
    await page.click('[data-testid="login-button"]');
    
    // Шаг 4: Поиск и отклик на проект
    await page.goto('/projects');
    await page.click('[data-testid="project-apply"]');
    await page.fill('[data-testid="proposal-content"]', 'I can complete this project');
    await page.fill('[data-testid="proposal-price"]', '450');
    await page.click('[data-testid="submit-proposal"]');
    
    await expect(page.locator('[data-testid="proposal-submitted"]')).toBeVisible();
    
    // Шаг 5: Логин как клиент для принятия предложения
    await page.click('[data-testid="logout"]');
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'testuser@example.com');
    await page.fill('[data-testid="password"]', 'SecurePassword123');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/my-projects');
    await page.click('[data-testid="view-proposals"]');
    await page.click('[data-testid="accept-proposal"]');
    
    await expect(page.locator('[data-testid="deal-created"]')).toBeVisible();
    
    // Шаг 6: Оплата (используя тестовую карту Stripe)
    await page.click('[data-testid="pay-now"]');
    // В реальном тесте здесь будет интеграция с Stripe элементами
    await page.fill('[data-testid="card-number"]', '424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/30');
    await page.fill('[data-testid="card-cvc"]', '123');
    await page.click('[data-testid="pay-button"]');
    
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
    
    // Шаг 7: Подтверждение выполнения работы
    await page.click('[data-testid="confirm-work"]');
    await expect(page.locator('[data-testid="work-confirmed"]')).toBeVisible();
    
    // Шаг 8: Вывод средств
    await page.goto('/wallet');
    await page.click('[data-testid="payout"]');
    await page.fill('[data-testid="payout-amount"]', '450');
    await page.click('[data-testid="request-payout"]');
    
    await expect(page.locator('[data-testid="payout-requested"]')).toBeVisible();
  });
});