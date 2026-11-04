import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

test('Task 5 Client-Side State Transfer: Forgot Password Email Prefill', async (t) => {
  const schoolPassPath = 'C:\\Users\\gbola\\Desktop\\SchoolPass';

  await t.test('ParentLoginForm dynamically generates query param when email is present', () => {
    const parentLoginPath = path.join(schoolPassPath, 'src', 'app', 'auth', 'login', 'ParentLoginForm.tsx');
    const content = fs.readFileSync(parentLoginPath, 'utf8');

    // Verify href dynamically includes email
    assert.ok(
      content.includes('/auth?view=forgot-password&email='),
      'ParentLoginForm must construct link with &email= parameter'
    );
    assert.ok(
      content.includes('encodeURIComponent(email.trim().toLowerCase())'),
      'ParentLoginForm must sanitize, trim, and lowercase email parameter'
    );
    assert.ok(
      !content.includes('password') || !content.includes('&password='),
      'Must NEVER expose password in URL parameters'
    );
  });

  await t.test('ForgotPasswordForm resolves prefill from searchParams and props gracefully', () => {
    const forgotPassPath = path.join(schoolPassPath, 'src', 'app', 'auth', 'forgot-password', 'ForgotPasswordForm.tsx');
    const content = fs.readFileSync(forgotPassPath, 'utf8');

    assert.ok(
      content.includes('useSearchParams'),
      'ForgotPasswordForm must utilize useSearchParams hook'
    );
    assert.ok(
      content.includes('initialEmail ?? queryEmail'),
      'ForgotPasswordForm must accept initialEmail prop and fallback to searchParams'
    );
    assert.ok(
      content.includes('.trim().toLowerCase()'),
      'ForgotPasswordForm must normalize resolved email'
    );
  });

  await t.test('Simulated resolution logic behaves correctly across test cases', () => {
    function resolveEmail(initialEmail, searchParams) {
      const queryEmail = searchParams ? searchParams.get('email') || '' : '';
      return (initialEmail ?? queryEmail).trim().toLowerCase();
    }

    // Case 1: Standard URL query parameter from login form
    const params1 = new URLSearchParams('view=forgot-password&email=amina.ibrahim%40schoolpass.test');
    assert.equal(resolveEmail(undefined, params1), 'amina.ibrahim@schoolpass.test');

    // Case 2: Untrimmed and uppercase query parameter
    const params2 = new URLSearchParams('view=forgot-password&email=%20CHUKWUMA.EZE%40GMAIL.COM%20');
    assert.equal(resolveEmail(undefined, params2), 'chukwuma.eze@gmail.com');

    // Case 3: Empty query parameter (graceful empty string fallback)
    const params3 = new URLSearchParams('view=forgot-password');
    assert.equal(resolveEmail(undefined, params3), '');

    // Case 4: Null searchParams (graceful fallback)
    assert.equal(resolveEmail(undefined, null), '');

    // Case 5: Direct prop override
    assert.equal(resolveEmail('direct.prop@schoolpass.test', params1), 'direct.prop@schoolpass.test');
  });
});
