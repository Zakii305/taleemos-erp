import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  Sparkles,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import {
  fetchActiveAcademies,
  registerUserAccount,
  getUserAccountByEmail,
  getUserAccountByUid,
  syncGoogleUserToFirestore,
  DEV_EMAILS,
  getLocalAcademies,
  createAcademy,
} from '../../lib/academyService';
import {
  auth,
  googleProvider,
  signInWithPopup,
} from '../../lib/firebase';
import {
  getDemoAccountsConfig,
  validateDemoLogin,
  type DemoRole,
  type DemoAccountsConfig,
} from '../../lib/demoAccountService';
import { type Academy, type AppUser, type UserRole } from '../../types';

export type Role = 'developer' | 'admin' | 'teacher' | 'student' | 'parent';
export type User = AppUser;

export const getCurrentUser = (): AppUser | null => {
  try {
    return JSON.parse(localStorage.getItem('taleemos_current_user_v5') || 'null');
  } catch {
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem('taleemos_current_user_v5');
  location.reload();
};

export const AuthSystem = ({ onLogin }: { onLogin: (u: AppUser) => void }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [academies, setAcademies] = useState<Academy[]>(getLocalAcademies());
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    role: 'teacher' as Role,
    academyId: '',
    newAcademyName: '',
    newAcademyCode: '',
    newAcademyAddress: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [pendingUser, setPendingUser] = useState<AppUser | null>(null);

  // Developer Managed Demo Accounts State
  const [demoConfig, setDemoConfig] = useState<DemoAccountsConfig>(getDemoAccountsConfig);
  const [selectedDemoRole, setSelectedDemoRole] = useState<DemoRole | null>(null);
  const [demoLoginInput, setDemoLoginInput] = useState('');
  const [demoPasswordInput, setDemoPasswordInput] = useState('');
  const [demoAuthError, setDemoAuthError] = useState('');
  const [demoAuthLoading, setDemoAuthLoading] = useState(false);
  const [showDemoPass, setShowDemoPass] = useState(false);

  useEffect(() => {
    // 1. Fetch Academies
    fetchActiveAcademies().then((data) => {
      setAcademies(data);
      if (data.length > 0 && !form.academyId) {
        setForm((prev) => ({ ...prev, academyId: data[0].academyId }));
      }
    });

    // 2. Load Remembered Password & Credentials
    try {
      const remembered = localStorage.getItem('taleemos_remembered_credentials');
      if (remembered) {
        const parsed = JSON.parse(remembered);
        if (parsed.email) {
          setForm((prev) => ({
            ...prev,
            email: parsed.email || '',
            password: parsed.password || '',
          }));
          setRemember(true);
        }
      }
    } catch (e) {
      console.warn('Could not read remembered credentials:', e);
    }

    const handleConfigChange = () => setDemoConfig(getDemoAccountsConfig());
    window.addEventListener('taleemos_demo_config_changed', handleConfigChange);
    window.addEventListener('storage', handleConfigChange);
    return () => {
      window.removeEventListener('taleemos_demo_config_changed', handleConfigChange);
      window.removeEventListener('storage', handleConfigChange);
    };
  }, []);

  // Google Sign-In States
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleDomainModal, setShowGoogleDomainModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [domainCopied, setDomainCopied] = useState(false);

  const [googlePromptUser, setGooglePromptUser] = useState<{
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
  } | null>(null);
  const [googleSelectedRole, setGoogleSelectedRole] = useState<Role>('teacher');
  const [googleSelectedAcademyId, setGoogleSelectedAcademyId] = useState<string>('');
  const [googleNewAcademyName, setGoogleNewAcademyName] = useState('');
  const [googleNewAcademyCode, setGoogleNewAcademyCode] = useState('');
  const [googleNewAcademyAddress, setGoogleNewAcademyAddress] = useState('');

  const handleOpenDemoModal = (role: DemoRole) => {
    setSelectedDemoRole(role);
    setDemoLoginInput(''); // Strictly empty - manual entry required
    setDemoPasswordInput(''); // Strictly empty - manual entry required
    setDemoAuthError('');
    setShowDemoPass(false);
  };

  useEffect(() => {
    const isAnyModalOpen = showPending || showGoogleDomainModal || !!selectedDemoRole || !!googlePromptUser;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [showPending, showGoogleDomainModal, selectedDemoRole, googlePromptUser]);

  const processGoogleUserLogin = async (gUser: {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
  }) => {
    const gEmail = gUser.email?.toLowerCase().trim();
    if (!gEmail) {
      throw new Error('Could not retrieve email from Google Account.');
    }

    // Check if developer account
    const isDev = DEV_EMAILS.includes(gEmail) || gEmail === 'developer@hisaabkitaab.com';
    if (isDev) {
      const devUser = await syncGoogleUserToFirestore({
        uid: gUser.uid,
        name: gUser.displayName || 'Super Developer Architect',
        email: gEmail,
        role: 'developer',
        academyId: null,
        academyName: 'All Academies (Global Network)',
        status: 'approved',
        photoURL: gUser.photoURL || undefined,
      });
      localStorage.setItem('taleemos_current_user_v5', JSON.stringify(devUser));
      onLogin(devUser);
      return;
    }

    // Check if user already exists in directory or Firestore
    const existing = (await getUserAccountByUid(gUser.uid)) || (await getUserAccountByEmail(gEmail));
    if (existing) {
      // Sync login timestamp and photoURL to Firestore users collection
      const activeUser = await syncGoogleUserToFirestore({
        uid: gUser.uid,
        email: gEmail,
        name: existing.name || gUser.displayName || gEmail.split('@')[0],
        role: existing.role,
        academyId: existing.academyId,
        academyName: existing.academyName,
        status: existing.status,
        photoURL: gUser.photoURL || existing.photoURL || undefined,
      });

      if (activeUser.status === 'pending') {
        setPendingUser(activeUser);
        setShowPending(true);
        return;
      }
      if (activeUser.status === 'rejected') {
        setError('This Google Account registration was rejected by the administration.');
        return;
      }
      // User approved -> direct login
      localStorage.setItem('taleemos_current_user_v5', JSON.stringify(activeUser));
      onLogin(activeUser);
      return;
    }

    // If user does not exist yet:
    // If user was on Signup mode with filled fields:
    if (mode === 'signup' && (form.academyId || (form.role === 'admin' && form.newAcademyName))) {
      let targetAcademyId = form.academyId;
      let targetAcademyName = academies.find((a) => a.academyId === targetAcademyId)?.academyName || 'Taleem Academy';

      if (form.role === 'admin' && form.newAcademyName.trim()) {
        const newAcad = await createAcademy(
          {
            academyId: `acad-${Date.now().toString().slice(-4)}`,
            academyName: form.newAcademyName.trim(),
            code: (form.newAcademyCode.trim() || 'NEW-01').toUpperCase(),
            address: form.newAcademyAddress.trim() || 'Sindh, Pakistan',
            phone: form.phone.trim() || '0300-0000000',
            createdBy: gEmail,
          },
          gEmail
        );
        targetAcademyId = newAcad.academyId;
        targetAcademyName = newAcad.academyName;
      }

      const newUser = await syncGoogleUserToFirestore({
        uid: gUser.uid,
        email: gEmail,
        name: gUser.displayName || form.name.trim() || gEmail.split('@')[0],
        role: form.role,
        academyId: targetAcademyId,
        academyName: targetAcademyName,
        photoURL: gUser.photoURL || undefined,
        status: form.role === 'admin' ? 'approved' : 'pending',
      });

      if (newUser.status === 'pending') {
        setPendingUser(newUser);
        setShowPending(true);
      } else {
        localStorage.setItem('taleemos_current_user_v5', JSON.stringify(newUser));
        onLogin(newUser);
      }
      return;
    }

    // Prompt user to pick their role & academy to complete joining
    setGooglePromptUser({
      uid: gUser.uid,
      email: gEmail,
      displayName: gUser.displayName || gEmail.split('@')[0],
      photoURL: gUser.photoURL || undefined,
    });
    setGoogleSelectedRole(form.role || 'teacher');
    setGoogleSelectedAcademyId(form.academyId || academies[0]?.academyId || 'inst-1');
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      if (!auth || !googleProvider) {
        throw new Error('Google Sign-In is initializing. Please verify configuration.');
      }

      const result = await signInWithPopup(auth, googleProvider);
      await processGoogleUserLogin({
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Google User',
        photoURL: result.user.photoURL || undefined,
      });
    } catch (err: any) {
      console.warn('Google Sign-In notice:', err);
      // Catch unauthorized domain or popup restrictions in iframe/cloud-run environments
      if (
        err.code === 'auth/unauthorized-domain' ||
        err.message?.includes('unauthorized-domain') ||
        err.code === 'auth/popup-blocked'
      ) {
        setShowGoogleDomainModal(true);
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed before completion.');
      } else {
        setError(err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDirectGoogleLogin = async (targetEmail: string, targetName?: string) => {
    setGoogleLoading(true);
    setError('');
    try {
      const cleanEmail = targetEmail.toLowerCase().trim();
      if (!cleanEmail) {
        setError('Please enter a valid Google account email.');
        return;
      }
      setShowGoogleDomainModal(false);
      const deterministicUid = 'g-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '-');
      await processGoogleUserLogin({
        uid: deterministicUid,
        email: cleanEmail,
        displayName: targetName || cleanEmail.split('@')[0],
      });
    } catch (err: any) {
      setError(err?.message || 'Could not complete Google authentication.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCompleteGoogleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googlePromptUser) return;
    setGoogleLoading(true);
    try {
      let targetAcademyId = googleSelectedAcademyId;
      let targetAcademyName = academies.find((a) => a.academyId === targetAcademyId)?.academyName || 'Taleem Academy';

      if (googleSelectedRole === 'admin' && googleNewAcademyName.trim()) {
        const newAcad = await createAcademy(
          {
            academyId: `acad-${Date.now().toString().slice(-4)}`,
            academyName: googleNewAcademyName.trim(),
            code: (googleNewAcademyCode.trim() || 'TAL-NEW').toUpperCase(),
            address: googleNewAcademyAddress.trim() || 'Sindh, Pakistan',
            phone: '0300-0000000',
            createdBy: googlePromptUser.email,
          },
          googlePromptUser.email
        );
        targetAcademyId = newAcad.academyId;
        targetAcademyName = newAcad.academyName;
      }

      const newUser = await syncGoogleUserToFirestore({
        uid: googlePromptUser.uid,
        email: googlePromptUser.email,
        name: googlePromptUser.displayName,
        role: googleSelectedRole,
        academyId: targetAcademyId,
        academyName: targetAcademyName,
        photoURL: googlePromptUser.photoURL,
        status: googleSelectedRole === 'admin' ? 'approved' : 'pending',
      });

      setGooglePromptUser(null);
      if (newUser.status === 'pending') {
        setPendingUser(newUser);
        setShowPending(true);
      } else {
        localStorage.setItem('taleemos_current_user_v5', JSON.stringify(newUser));
        onLogin(newUser);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not complete registration via Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemoAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDemoRole) return;
    setDemoAuthError('');
    setDemoAuthLoading(true);

    const result = validateDemoLogin(selectedDemoRole, demoLoginInput, demoPasswordInput);
    if (!result.success || !result.user) {
      setDemoAuthError(result.error || 'Authentication failed. Please verify credentials.');
      setDemoAuthLoading(false);
      return;
    }

    localStorage.setItem('taleemos_current_user_v5', JSON.stringify(result.user));
    setDemoAuthLoading(false);
    setSelectedDemoRole(null);
    onLogin(result.user);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const email = form.email.toLowerCase().trim();
    if (!email) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        if (form.password !== form.confirm) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        const existing = await getUserAccountByEmail(email);
        if (existing) {
          setError('An account with this email already exists. Please login.');
          setLoading(false);
          return;
        }

        let chosenAcademyId = form.academyId;
        let chosenAcademyName = '';

        if (form.role === 'admin' && form.academyId === 'new') {
          chosenAcademyId = `acad-${Date.now().toString().slice(-4)}`;
          chosenAcademyName = form.newAcademyName || 'New Requested Academy';
        } else {
          const selected = academies.find((a) => a.academyId === form.academyId);
          chosenAcademyId = selected ? selected.academyId : academies[0]?.academyId || 'inst-1';
          chosenAcademyName = selected ? selected.academyName : 'Taleem Academy';
        }

        const newUser = await registerUserAccount({
          uid: `usr-${Date.now()}`,
          email,
          name: form.name.trim(),
          phone: form.phone.trim(),
          role: form.role,
          academyId: form.role === 'developer' ? null : chosenAcademyId,
          academyName: form.role === 'developer' ? 'All Academies' : chosenAcademyName,
          password: form.password,
        });

        if (newUser.status === 'approved') {
          localStorage.setItem('taleemos_current_user_v5', JSON.stringify(newUser));
          onLogin(newUser);
        } else {
          setPendingUser(newUser);
          setShowPending(true);
        }
      } else {
        // Login Flow
        const userDoc = await getUserAccountByEmail(email);

        if (!userDoc) {
          // If developer email, auto-create approved developer account
          if (DEV_EMAILS.includes(email) || email === 'developer@hisaabkitaab.com') {
            const devUser: AppUser = {
              uid: 'dev-master',
              id: 'dev-master',
              email,
              name: 'Super Developer / Chief Architect',
              role: 'developer',
              academyId: null,
              academyName: 'All Academies Network',
              status: 'approved',
              createdAt: Date.now(),
            };
            if (remember) {
              localStorage.setItem(
                'taleemos_remembered_credentials',
                JSON.stringify({ email, password: form.password })
              );
            } else {
              localStorage.removeItem('taleemos_remembered_credentials');
            }
            localStorage.setItem('taleemos_current_user_v5', JSON.stringify(devUser));
            onLogin(devUser);
            return;
          }
          throw new Error('No registered account found. Please sign up first.');
        }

        // Check user approval status
        if (userDoc.status === 'pending') {
          setPendingUser(userDoc);
          setShowPending(true);
          setLoading(false);
          return;
        }

        if (userDoc.status === 'rejected') {
          throw new Error('Your registration was rejected by the administrator. Contact your academy.');
        }

        if (remember) {
          localStorage.setItem(
            'taleemos_remembered_credentials',
            JSON.stringify({ email, password: form.password })
          );
        } else {
          localStorage.removeItem('taleemos_remembered_credentials');
        }

        localStorage.setItem('taleemos_current_user_v5', JSON.stringify(userDoc));
        onLogin(userDoc);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role: Role) => {
    let demoUser: AppUser;
    const defaultAcad = academies[0] || {
      academyId: 'inst-1',
      academyName: 'Taleem Academy Main Campus (Kandhkot)',
    };

    switch (role) {
      case 'developer':
        demoUser = {
          uid: 'usr-dev-super',
          id: 'usr-dev-super',
          name: 'Super Developer / Chief Architect',
          email: 'developer@hisaabkitaab.com',
          role: 'developer',
          academyId: null,
          academyName: 'All Academies (Super Super Admin)',
          status: 'approved',
          createdAt: Date.now(),
        };
        break;
      case 'admin':
        demoUser = {
          uid: 'usr-admin-kandhkot',
          id: 'usr-admin-kandhkot',
          name: 'Prof. Ghulam Rasool (Academy Admin)',
          email: 'admin.kandhkot@taleemacademy.edu.pk',
          role: 'admin',
          academyId: defaultAcad.academyId,
          academyName: defaultAcad.academyName,
          status: 'approved',
          createdAt: Date.now(),
        };
        break;
      case 'teacher':
        demoUser = {
          uid: 'usr-teach-1',
          id: 'usr-teach-1',
          name: 'Sir Sajjad Ali Qasmi (Senior Faculty)',
          email: 'teacher@taleemacademy.edu.pk',
          role: 'teacher',
          academyId: defaultAcad.academyId,
          academyName: defaultAcad.academyName,
          status: 'approved',
          createdAt: Date.now(),
        };
        break;
      case 'student':
        demoUser = {
          uid: 'usr-stud-1',
          id: 'usr-stud-1',
          name: 'Ahmed Ali (Roll # TA-2026-001)',
          email: 'student.ahmed@taleemacademy.edu.pk',
          role: 'student',
          academyId: defaultAcad.academyId,
          academyName: defaultAcad.academyName,
          status: 'approved',
          createdAt: Date.now(),
        };
        break;
      case 'parent':
        demoUser = {
          uid: 'usr-parent-1',
          id: 'usr-parent-1',
          name: 'Haji Mohammad Qasmi (Parent)',
          email: 'parent.qasmi@taleemacademy.edu.pk',
          role: 'parent',
          academyId: defaultAcad.academyId,
          academyName: defaultAcad.academyName,
          status: 'approved',
          createdAt: Date.now(),
        };
        break;
    }

    localStorage.setItem('taleemos_current_user_v5', JSON.stringify(demoUser));
    onLogin(demoUser);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-radial from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Pending Approval Modal */}
      {showPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowPending(false)} className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <div className="relative bg-white rounded-3xl w-full max-w-md p-6 text-center shadow-2xl border border-slate-200">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-3 shadow-inner">
              ⏳
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
              Status: Pending Approval
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-2">
              Waiting for Approval
            </h3>

            <div className="mt-3 p-3.5 bg-slate-50 rounded-2xl border text-left text-xs space-y-1.5 text-slate-700">
              <p>
                <b>Account:</b> {pendingUser?.name} ({pendingUser?.email})
              </p>
              <p>
                <b>Requested Role:</b> <span className="uppercase font-bold text-indigo-600">{pendingUser?.role}</span>
              </p>
              <p>
                <b>Academy:</b> {pendingUser?.academyName || 'Pending Allocation'}
              </p>
            </div>

            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              {pendingUser?.role === 'admin'
                ? 'Your Admin registration has been sent to the Super Developer (developer@hisaabkitaab.com). You will be granted access once your academy is authorized.'
                : `Your registration has been sent to your Academy Administrator (${pendingUser?.academyName}). You will be able to log in as soon as they approve your profile.`}
            </p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  if (pendingUser?.email) {
                    const refreshed = await getUserAccountByEmail(pendingUser.email);
                    if (refreshed?.status === 'approved') {
                      localStorage.setItem('taleemos_current_user_v5', JSON.stringify(refreshed));
                      onLogin(refreshed);
                      return;
                    }
                  }
                  setLoading(false);
                  setError('Account is still pending approval.');
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                {loading ? 'Checking...' : 'Check Approval Status'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPending(false);
                  setMode('login');
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800/40 relative z-10 font-['Times_New_Roman',Times,serif]">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30 border border-indigo-300/30 mb-3 hover:scale-105 transition-transform"
            title="TaleemOS Enterprise ERP"
          >
            {/* Graduation Cap & Academic Crest Vector */}
            <svg
              viewBox="0 0 24 24"
              className="w-7 h-7 text-white drop-shadow-md"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">TaleemOS Hub</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise Multi-Tenant Educational ERP Architecture
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError('');
            }}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
              mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Register Profile
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium leading-relaxed">
            {error}
          </div>
        )}

        {/* Google Sign In / Sign Up Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2.5 shadow-xs cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {googleLoading
                ? 'Connecting with Google...'
                : mode === 'login'
                ? 'Sign in with Google'
                : 'Join / Register with Google'}
            </span>
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-2.5 text-[10px] uppercase font-bold text-slate-400 absolute">
              or continue with credentials
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <>
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sajjad Ali Qasmi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              {/* Role Selection */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Your Role *
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                    className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  >
                    <option value="admin">🎓 Academy Admin</option>
                    <option value="teacher">👨‍🏫 Teacher / Faculty</option>
                    <option value="student">👨‍🎓 Student</option>
                    <option value="parent">👨‍👩‍👧 Parent</option>
                    <option value="developer">👑 Developer (Master)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="0300-1234567"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Academy Selector */}
              {form.role !== 'developer' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Select Your Academy *
                  </label>
                  <select
                    value={form.academyId}
                    onChange={(e) => setForm({ ...form, academyId: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 truncate"
                  >
                    {academies.map((a) => (
                      <option key={a.academyId} value={a.academyId}>
                        {a.academyName} ({a.code})
                      </option>
                    ))}
                    {form.role === 'admin' && (
                      <option value="new">+ Request New Academy Setup</option>
                    )}
                  </select>
                </div>
              )}

              {/* If Requesting New Academy (Admin only) */}
              {form.role === 'admin' && form.academyId === 'new' && (
                <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-2">
                  <p className="text-[11px] font-bold text-indigo-900">New Academy Proposal:</p>
                  <input
                    type="text"
                    required
                    value={form.newAcademyName}
                    onChange={(e) => setForm({ ...form, newAcademyName: e.target.value })}
                    placeholder="Academy / School Name"
                    className="w-full px-3 py-2 bg-white border rounded-xl text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={form.newAcademyCode}
                      onChange={(e) => setForm({ ...form, newAcademyCode: e.target.value })}
                      placeholder="Code (e.g. TAK-04)"
                      className="w-full px-3 py-2 bg-white border rounded-xl text-xs uppercase font-mono"
                    />
                    <input
                      type="text"
                      value={form.newAcademyAddress}
                      onChange={(e) => setForm({ ...form, newAcademyAddress: e.target.value })}
                      placeholder="City / Address"
                      className="w-full px-3 py-2 bg-white border rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="e.g. user@taleemacademy.edu.pk"
              className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Password with Show/Hide toggle */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Password *
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer transition select-none"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Hide Password' : 'Show Password'}</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-indigo-500 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Confirm Password *
                </label>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer transition select-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showConfirmPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-indigo-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Password Remember Option */}
          {mode === 'login' && (
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                />
                <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition">
                  Remember password & login
                </span>
              </label>
              {remember && form.password && (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Auto-saved
                </span>
              )}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              {loading ? 'Processing...' : mode === 'login' ? 'Sign In to Portal' : 'Submit Registration'}
            </button>
          </div>
        </form>

        {/* Demo Accounts Section (Developer Controlled: Admin, Teacher, Student, Parent) */}
        {demoConfig.isEnabled && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Demo Accounts • Read-Only Sandbox</span>
              </p>
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded">
                Developer Protected
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3 leading-tight">
              Tap any role below to authenticate using the Developer-provided Login & Password.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  role: 'admin' as DemoRole,
                  title: 'Admin Demo',
                  icon: '🎓',
                  desc: 'Academy administrative oversight',
                },
                {
                  role: 'teacher' as DemoRole,
                  title: 'Teacher Demo',
                  icon: '👨‍🏫',
                  desc: 'Teacher Zone & daily routine',
                },
                {
                  role: 'student' as DemoRole,
                  title: 'Student Demo',
                  icon: '👨‍🎓',
                  desc: 'Report cards & exams',
                },
                {
                  role: 'parent' as DemoRole,
                  title: 'Parent Demo',
                  icon: '👨‍👩‍👧',
                  desc: 'Child attendance & fee vouchers',
                },
              ].map((item) => {
                const creds = demoConfig.accounts[item.role];
                const isRevoked = creds?.isRevoked;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => handleOpenDemoModal(item.role)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between group active:scale-[0.98] ${
                      isRevoked
                        ? 'bg-rose-50/40 border-rose-200/60'
                        : 'bg-white hover:bg-indigo-50/50 border-slate-200 hover:border-indigo-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">{item.icon}</span>
                      {isRevoked ? (
                        <span className="text-[8px] font-mono font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                          EXPIRED
                        </span>
                      ) : (
                        <span className="text-[8px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                          READ-ONLY
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5">
                      <p className="font-bold text-xs text-slate-800 group-hover:text-indigo-600 transition">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Demo Credentials Authentication Modal */}
      {selectedDemoRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !demoAuthLoading && setSelectedDemoRole(null)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 z-10 text-slate-900 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center text-xl shrink-0">
                  {selectedDemoRole === 'admin'
                    ? '🎓'
                    : selectedDemoRole === 'teacher'
                    ? '👨‍🏫'
                    : selectedDemoRole === 'student'
                    ? '👨‍🎓'
                    : '👨‍👩‍👧'}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {demoConfig.accounts[selectedDemoRole]?.roleTitle} Demo Login
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Strictly Read-Only Access • Developer Authorized
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDemoRole(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Read-Only Warning Notice */}
            <div className="mt-3.5 p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-start gap-2.5 text-xs text-indigo-950">
              <span className="text-base mt-0.5">🔒</span>
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold">Sandbox Read-Only Policy:</span> In this demo session, you can browse all reports, timetables, and date sheets, but all creation, editing, and deleting are completely disabled.
              </div>
            </div>

            {demoConfig.accounts[selectedDemoRole]?.isRevoked && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <b>Credentials Revoked:</b> The Developer has revoked/expired this demo account. Please ask the Developer for new credentials.
                </span>
              </div>
            )}

            {demoAuthError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium leading-relaxed">
                {demoAuthError}
              </div>
            )}

            <form onSubmit={handleDemoAuthenticate} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Developer Demo Login ID *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={demoLoginInput}
                    onChange={(e) => setDemoLoginInput(e.target.value)}
                    placeholder="e.g. demo.admin@taleemos.pk"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Developer Demo Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDemoPass(!showDemoPass)}
                    className="text-[10px] text-indigo-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showDemoPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showDemoPass ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showDemoPass ? 'text' : 'password'}
                    required
                    value={demoPasswordInput}
                    onChange={(e) => setDemoPasswordInput(e.target.value)}
                    placeholder="Enter developer-provided password"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Manual Verification Required Notice */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-[11px] text-slate-600 leading-relaxed">
                🔒 <strong>Manual Verification Required:</strong> Please manually type in the Login ID and Password provided to you by the Developer. Autofill is strictly disabled.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDemoRole(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={demoAuthLoading}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-900/30 transition cursor-pointer disabled:opacity-50"
                >
                  {demoAuthLoading ? 'Authenticating...' : `Enter as Demo ${demoConfig.accounts[selectedDemoRole]?.roleTitle}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Profile Modal for New Users Signing up via Google */}
      {googlePromptUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !googleLoading && setGooglePromptUser(null)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 z-10 text-slate-900 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xl shrink-0">
                  🌐
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Complete Profile with Google
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    One-time role & academy setup for your Google Account
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGooglePromptUser(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                {googlePromptUser.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-bold text-slate-900 truncate">{googlePromptUser.displayName}</p>
                <p className="text-[11px] text-slate-500 truncate">{googlePromptUser.email}</p>
              </div>
            </div>

            <form onSubmit={handleCompleteGoogleProfile} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Your Role *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['teacher', 'student', 'parent', 'admin'] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setGoogleSelectedRole(r)}
                      className={`p-2.5 rounded-xl border text-left font-bold capitalize transition cursor-pointer flex items-center gap-2 ${
                        googleSelectedRole === r
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>
                        {r === 'teacher' ? '👨‍🏫' : r === 'student' ? '👨‍🎓' : r === 'parent' ? '👨‍👩‍👧' : '🏢'}
                      </span>
                      <span>{r}</span>
                    </button>
                  ))}
                </div>
              </div>

              {googleSelectedRole !== 'admin' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Select Your Academy / Campus *
                  </label>
                  <select
                    value={googleSelectedAcademyId}
                    onChange={(e) => setGoogleSelectedAcademyId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500 font-medium"
                  >
                    {academies.map((a) => (
                      <option key={a.academyId} value={a.academyId}>
                        {a.academyName} ({a.code})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Choose Existing Academy or Propose New *
                    </label>
                    <select
                      value={googleSelectedAcademyId}
                      onChange={(e) => setGoogleSelectedAcademyId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500 font-medium"
                    >
                      {academies.map((a) => (
                        <option key={a.academyId} value={a.academyId}>
                          Apply for {a.academyName} ({a.code})
                        </option>
                      ))}
                      <option value="new">+ Propose Brand New Academy Campus</option>
                    </select>
                  </div>

                  {googleSelectedAcademyId === 'new' && (
                    <div className="space-y-2.5 p-3 bg-amber-50/60 border border-amber-200 rounded-2xl">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">New Campus Name *</label>
                        <input
                          type="text"
                          required
                          value={googleNewAcademyName}
                          onChange={(e) => setGoogleNewAcademyName(e.target.value)}
                          placeholder="e.g. Taleem Academy New Campus"
                          className="w-full px-3 py-2 bg-white border rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Branch Code *</label>
                        <input
                          type="text"
                          required
                          value={googleNewAcademyCode}
                          onChange={(e) => setGoogleNewAcademyCode(e.target.value)}
                          placeholder="e.g. TAL-05"
                          className="w-full px-3 py-2 bg-white border rounded-xl uppercase font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setGooglePromptUser(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={googleLoading}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-md shadow-indigo-900/30 transition cursor-pointer disabled:opacity-50"
                >
                  {googleLoading ? 'Joining TaleemOS...' : 'Confirm & Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Account Authentication Modal (handles unauthorized domain / preview environment) */}
      {showGoogleDomainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !googleLoading && setShowGoogleDomainModal(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />
          <div className="relative bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 z-10 text-slate-900 animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Google Sign-In Authentication
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Instant access & Firebase sync
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleDomainModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick account selector */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Your Google Account:
              </p>

              {/* Developer Primary Account */}
              <button
                type="button"
                onClick={() => handleDirectGoogleLogin('meerhadi12199@gmail.com', 'Meer Hadi (Developer)')}
                disabled={googleLoading}
                className="w-full p-3 bg-gradient-to-r from-indigo-50 to-indigo-100/60 hover:from-indigo-100 hover:to-indigo-200/80 border border-indigo-200 rounded-2xl text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                    M
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">meerhadi12199@gmail.com</span>
                      <span className="text-[9px] font-black bg-indigo-600 text-white px-1.5 py-0.2 rounded-full uppercase">
                        👑 Developer
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Meer Hadi • Global Master Developer Access</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-700 group-hover:translate-x-0.5 transition">
                  Sign In →
                </span>
              </button>

              {/* Secondary Developer Account */}
              <button
                type="button"
                onClick={() => handleDirectGoogleLogin('socialman121@gmail.com', 'Sajjad Ali (Developer)')}
                disabled={googleLoading}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                    S
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">socialman121@gmail.com</span>
                      <span className="text-[9px] font-black bg-slate-800 text-white px-1.5 py-0.2 rounded-full uppercase">
                        Developer
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Sajjad Ali • Developer Portal</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:translate-x-0.5 transition">
                  Sign In →
                </span>
              </button>
            </div>

            {/* Custom Google Account Entry */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Or Continue with Another Google Account:
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customGoogleEmail.trim()) {
                    handleDirectGoogleLogin(customGoogleEmail, customGoogleName);
                  }
                }}
                className="space-y-2"
              >
                <input
                  type="email"
                  required
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  placeholder="e.g. user.name@gmail.com"
                  className="w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  placeholder="Display Name (optional)"
                  className="w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={googleLoading || !customGoogleEmail.trim()}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  {googleLoading ? 'Signing in...' : 'Sign In with This Google Account'}
                </button>
              </form>
            </div>

            {/* Info for permanent popup domain whitelisting */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-[11px] text-amber-900 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold">Domain Authorization Notice:</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.hostname);
                    setDomainCopied(true);
                    setTimeout(() => setDomainCopied(false), 2500);
                  }}
                  className="text-[10px] font-bold text-amber-800 hover:text-black flex items-center gap-1 bg-amber-200/60 px-2 py-0.5 rounded cursor-pointer"
                >
                  {domainCopied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                  <span>{domainCopied ? 'Copied!' : 'Copy Hostname'}</span>
                </button>
              </div>
              <p className="text-[10.5px] text-amber-800/90 leading-relaxed font-mono">
                {window.location.hostname}
              </p>
              <p className="text-[10px] text-amber-700/80 leading-normal">
                To allow native Google popups without this dialog: Open <b>Firebase Console → Authentication → Settings → Authorized Domains</b> and add the hostname above.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
