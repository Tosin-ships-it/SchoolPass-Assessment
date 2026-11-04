import fs from 'fs';
import path from 'path';

const schoolPassPath = 'C:\\Users\\gbola\\Desktop\\SchoolPass';

// 1. Edit ParentLoginForm.tsx
const parentLoginPath = path.join(schoolPassPath, 'src', 'app', 'auth', 'login', 'ParentLoginForm.tsx');
let parentLoginContent = fs.readFileSync(parentLoginPath, 'utf8');

// Replace href="/auth?view=forgot-password" with dynamic expression
const targetLoginPattern = /href=["']\/auth\?view=forgot-password["']/;
const replacementLoginHref = `href={
              email && email.trim()
                ? \`/auth?view=forgot-password&email=\${encodeURIComponent(email.trim().toLowerCase())}\`
                : '/auth?view=forgot-password'
            }`;

if (targetLoginPattern.test(parentLoginContent)) {
  parentLoginContent = parentLoginContent.replace(targetLoginPattern, replacementLoginHref);
  fs.writeFileSync(parentLoginPath, parentLoginContent, 'utf8');
  console.log('Successfully updated ParentLoginForm.tsx with dynamic email query link');
} else {
  console.log('ParentLoginForm.tsx already updated or target pattern not found');
}

// 2. Edit ForgotPasswordForm.tsx
const forgotPassPath = path.join(schoolPassPath, 'src', 'app', 'auth', 'forgot-password', 'ForgotPasswordForm.tsx');
let forgotPassContent = fs.readFileSync(forgotPassPath, 'utf8');

// Ensure useSearchParams is imported
if (!forgotPassContent.includes('useSearchParams')) {
  forgotPassContent = forgotPassContent.replace(
    /import Link from ['"]next\/link['"];/,
    "import Link from 'next/link';\nimport { useSearchParams } from 'next/navigation';"
  );
}

// Update component signature and initial state
const targetFunctionPattern = /export function ForgotPasswordForm\(\)\s*\{\s*const\s*\[email,\s*setEmail\]\s*=\s*useState\(['"]['"]\);/;
const replacementFunctionSig = `export function ForgotPasswordForm({ initialEmail }: { initialEmail?: string } = {}) {
  const searchParams = useSearchParams();
  const queryEmail = searchParams ? searchParams.get('email') || '' : '';
  const resolvedEmail = (initialEmail ?? queryEmail).trim().toLowerCase();

  const [email, setEmail] = useState(resolvedEmail);`;

if (targetFunctionPattern.test(forgotPassContent)) {
  forgotPassContent = forgotPassContent.replace(targetFunctionPattern, replacementFunctionSig);
  fs.writeFileSync(forgotPassPath, forgotPassContent, 'utf8');
  console.log('Successfully updated ForgotPasswordForm.tsx with prefill support');
} else {
  console.log('ForgotPasswordForm.tsx already updated or target pattern not found');
}
