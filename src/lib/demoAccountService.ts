/**
 * Demo Account & Sandbox Management Service
 * Controls demo credentials for Admin, Teacher, Student, Parent.
 * Supports:
 * - Developer Hide / Show toggle on Login Page
 * - Random password and login reset (per-role and all)
 * - Developer revocation / expiration of credentials
 * - Strict authentication against developer-provided credentials
 * - Read-only flag enforcement (no write allowed)
 */

import { type AppUser } from '../types';

export type DemoRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface DemoRoleCredentials {
  role: DemoRole;
  roleTitle: string;
  loginId: string;
  password: string;
  userName: string;
  isRevoked: boolean;
  lastResetAt: number;
}

export interface DemoAccountsConfig {
  isEnabled: boolean; // Controls whether demo accounts appear on login page
  accounts: Record<DemoRole, DemoRoleCredentials>;
}

const STORAGE_KEY = 'taleemos_demo_accounts_config_v1';

// Seed Initial Demo Credentials
const DEFAULT_CONFIG: DemoAccountsConfig = {
  isEnabled: true,
  accounts: {
    admin: {
      role: 'admin',
      roleTitle: 'Academy Administrator',
      loginId: 'demo.admin@taleemos.pk',
      password: 'AdminDemo#2026',
      userName: 'Prof. Ghulam Rasool (Demo Admin)',
      isRevoked: false,
      lastResetAt: 1761500000000,
    },
    teacher: {
      role: 'teacher',
      roleTitle: 'Teacher / Faculty',
      loginId: 'demo.teacher@taleemos.pk',
      password: 'TeachDemo#2026',
      userName: 'Sir Sajjad Ali Qasmi (Demo Faculty)',
      isRevoked: false,
      lastResetAt: 1761500000000,
    },
    student: {
      role: 'student',
      roleTitle: 'Enrolled Student',
      loginId: 'demo.student@taleemos.pk',
      password: 'StudentDemo#2026',
      userName: 'Ahmed Ali (Demo Student TA-01)',
      isRevoked: false,
      lastResetAt: 1761500000000,
    },
    parent: {
      role: 'parent',
      roleTitle: 'Parent Portal',
      loginId: 'demo.parent@taleemos.pk',
      password: 'ParentDemo#2026',
      userName: 'Haji M. Qasmi (Demo Parent)',
      isRevoked: false,
      lastResetAt: 1761500000000,
    },
  },
};

/**
 * Generate a cryptographically distinct, easy-to-read random password
 * E.g. "Taleem#9482" or "Pass@7319"
 */
export function generateRandomPassword(): string {
  const prefixes = ['Taleem', 'Demo', 'Portal', 'School', 'Academy', 'Smart', 'Campus'];
  const symbols = ['#', '@', '!', '$', '%'];
  const randPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randSymbol = symbols[Math.floor(Math.random() * symbols.length)];
  const randNum = Math.floor(1000 + Math.random() * 9000);
  return `${randPrefix}${randSymbol}${randNum}`;
}

/**
 * Generate a random login identifier for a demo role
 * E.g. "demo.admin.742@taleemos.pk"
 */
export function generateRandomLoginId(role: DemoRole): string {
  const randNum = Math.floor(100 + Math.random() * 900);
  return `demo.${role}.${randNum}@taleemos.pk`;
}

/**
 * Retrieve the current Demo Accounts Configuration from localStorage
 */
export function getDemoAccountsConfig(): DemoAccountsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.isEnabled === 'boolean' && parsed.accounts) {
        return {
          isEnabled: parsed.isEnabled,
          accounts: {
            admin: { ...DEFAULT_CONFIG.accounts.admin, ...(parsed.accounts.admin || {}) },
            teacher: { ...DEFAULT_CONFIG.accounts.teacher, ...(parsed.accounts.teacher || {}) },
            student: { ...DEFAULT_CONFIG.accounts.student, ...(parsed.accounts.student || {}) },
            parent: { ...DEFAULT_CONFIG.accounts.parent, ...(parsed.accounts.parent || {}) },
          },
        };
      }
    }
  } catch (err) {
    console.warn('Failed to parse demo accounts config:', err);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG));
  } catch {}
  return DEFAULT_CONFIG;
}

/**
 * Save Demo Accounts Configuration and dispatch custom event
 */
export function saveDemoAccountsConfig(config: DemoAccountsConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('taleemos_demo_config_changed', { detail: config }));
  } catch (err) {
    console.error('Failed to save demo accounts config:', err);
  }
}

/**
 * Toggle hide/show of Demo Accounts on Login Page (Developer Authority)
 */
export function toggleDemoVisibility(show: boolean): DemoAccountsConfig {
  const config = getDemoAccountsConfig();
  config.isEnabled = show;
  saveDemoAccountsConfig(config);
  return config;
}

/**
 * Reset random login and password for a specific role or all roles
 */
export function resetRandomDemoCredentials(targetRole?: DemoRole): DemoAccountsConfig {
  const config = getDemoAccountsConfig();
  const roles: DemoRole[] = targetRole ? [targetRole] : ['admin', 'teacher', 'student', 'parent'];

  roles.forEach((r) => {
    config.accounts[r] = {
      ...config.accounts[r],
      loginId: generateRandomLoginId(r),
      password: generateRandomPassword(),
      isRevoked: false,
      lastResetAt: Date.now(),
    };
  });

  saveDemoAccountsConfig(config);
  return config;
}

/**
 * Revoke (expire) demo credentials for a specific role or all roles
 * When revoked, anyone using those credentials will be rejected.
 */
export function revokeDemoCredentials(targetRole?: DemoRole): DemoAccountsConfig {
  const config = getDemoAccountsConfig();
  const roles: DemoRole[] = targetRole ? [targetRole] : ['admin', 'teacher', 'student', 'parent'];

  roles.forEach((r) => {
    config.accounts[r] = {
      ...config.accounts[r],
      isRevoked: true,
      lastResetAt: Date.now(),
    };
  });

  saveDemoAccountsConfig(config);
  return config;
}

/**
 * Restore / Reactivate demo credentials for a role
 */
export function restoreDemoCredentials(targetRole?: DemoRole): DemoAccountsConfig {
  const config = getDemoAccountsConfig();
  const roles: DemoRole[] = targetRole ? [targetRole] : ['admin', 'teacher', 'student', 'parent'];

  roles.forEach((r) => {
    config.accounts[r] = {
      ...config.accounts[r],
      isRevoked: false,
      lastResetAt: Date.now(),
    };
  });

  saveDemoAccountsConfig(config);
  return config;
}

/**
 * Update custom login ID or password set manually by Developer
 */
export function updateCustomDemoCredentials(
  role: DemoRole,
  customLoginId: string,
  customPassword: string
): DemoAccountsConfig {
  const config = getDemoAccountsConfig();
  if (config.accounts[role]) {
    config.accounts[role] = {
      ...config.accounts[role],
      loginId: customLoginId.trim(),
      password: customPassword.trim(),
      isRevoked: false,
      lastResetAt: Date.now(),
    };
    saveDemoAccountsConfig(config);
  }
  return config;
}

/**
 * Validates login attempt against active Developer-provided Demo Credentials
 * Requires exact match of Login ID and Password.
 * Rejects if developer has revoked or expired the credentials.
 * On success, returns user object with `isDemo: true` and `readOnly: true`.
 */
export function validateDemoLogin(
  role: DemoRole,
  enteredLoginId: string,
  enteredPassword: string
): { success: boolean; user?: AppUser; error?: string } {
  const config = getDemoAccountsConfig();

  if (!config.isEnabled) {
    return {
      success: false,
      error: 'Demo accounts are currently disabled by the Developer.',
    };
  }

  const roleCreds = config.accounts[role];
  if (!roleCreds) {
    return {
      success: false,
      error: 'Invalid demo role selected.',
    };
  }

  // Check if developer revoked or expired this demo account
  if (roleCreds.isRevoked) {
    return {
      success: false,
      error: `⛔ Demo Access Expired: The ${roleCreds.roleTitle} demo credentials have been revoked by the Developer. Please request current credentials from the developer.`,
    };
  }

  const cleanEnteredId = enteredLoginId.trim().toLowerCase();
  const cleanTargetId = roleCreds.loginId.trim().toLowerCase();

  // Validate Login ID and Password strictly
  if (cleanEnteredId !== cleanTargetId || enteredPassword.trim() !== roleCreds.password.trim()) {
    return {
      success: false,
      error: '❌ Authentication Failed: Invalid Demo Login ID or Password. Please ensure you entered the exact credentials provided by the Developer.',
    };
  }

  // Construct Demo User with STRICT read-only properties
  const demoUser: AppUser = {
    uid: `demo-usr-${role}-${Date.now()}`,
    id: `demo-usr-${role}-${Date.now()}`,
    email: roleCreds.loginId,
    name: roleCreds.userName,
    role: role,
    academyId: 'inst-1',
    academyName: 'Taleem Academy Main Campus (Demo Sandbox)',
    status: 'approved',
    createdAt: Date.now(),
    isDemo: true,
    readOnly: true,
  };

  return {
    success: true,
    user: demoUser,
  };
}
