import React, { useState } from 'react';
import { Sparkles, Eye, EyeOff, Loader2, ArrowLeft, Mail, Lock, User, AtSign, ChevronDown } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { AuraLogo } from '../../components/common/AuraLogo';

// ─── Tab IDs ────────────────────────────────────────────────────────────────
const TAB_SIGNIN   = 'signin';
const TAB_REGISTER = 'register';
const TAB_RECOVER  = 'recover';

// ─── Reusable Input ──────────────────────────────────────────────────────────
function InputField({ icon: Icon, type = 'text', placeholder, value, onChange, rightSlot, ...rest }) {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition${Icon ? ' pl-10' : ''}${rightSlot ? ' pr-12' : ''}`}
        {...rest}
      />
      {rightSlot && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {rightSlot}
        </div>
      )}
    </div>
  );
}

// ─── Password Input ──────────────────────────────────────────────────────────
function PasswordInput({ placeholder, value, onChange, ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <InputField
      icon={Lock}
      type={show ? 'text' : 'password'}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rightSlot={
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="text-slate-500 hover:text-slate-300 transition"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      }
      {...rest}
    />
  );
}

// ─── Error Message ───────────────────────────────────────────────────────────
function ErrorMsg({ msg }) {
  if (!msg) return null;
  return (
    <p className="text-red-400 text-xs text-center px-2 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
      {msg}
    </p>
  );
}

// ─── Success Message ─────────────────────────────────────────────────────────
function SuccessMsg({ msg }) {
  if (!msg) return null;
  return (
    <p className="text-green-400 text-xs text-center px-2 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
      {msg}
    </p>
  );
}

// ─── Primary Button ──────────────────────────────────────────────────────────
function PrimaryButton({ children, loading, ...rest }) {
  return (
    <button
      className="w-full py-3 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
      disabled={loading}
      {...rest}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
}

// ─── Tab Button ──────────────────────────────────────────────────────────────
function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${
        active
          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/25'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  );
}

// ─── LOGO ────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div className="flex flex-col items-center gap-3 mb-2">
      <AuraLogo size="lg" />
      <div className="flex items-center gap-2">
        <span className="font-black text-2xl tracking-tight text-white">AURA</span>
        <span className="px-2 py-0.5 text-[10px] uppercase font-extrabold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
          Beta
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SIGN IN TAB
// ═══════════════════════════════════════════════════════════════════════════
function SignInTab({ onLoginSuccess, setTab }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const user = await authService.login(email.trim(), password);
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputField
        icon={Mail}
        type="email"
        placeholder="Email address"
        value={email}
        onChange={e => setEmail(e.target.value)}
        autoComplete="email"
      />
      <PasswordInput
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        autoComplete="current-password"
      />
      <ErrorMsg msg={error} />
      <PrimaryButton type="submit" loading={loading}>
        Sign In
      </PrimaryButton>
      <div className="flex flex-col gap-1 items-center pt-1">
        <button type="button" onClick={() => setTab(TAB_RECOVER)} className="text-xs text-slate-400 hover:text-purple-400 transition">
          Forgot your password?
        </button>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <span>No account?</span>
          <button type="button" onClick={() => setTab(TAB_REGISTER)} className="text-purple-400 hover:text-pink-400 font-semibold transition">
            Create one free
          </button>
        </div>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// REGISTER TAB
// ═══════════════════════════════════════════════════════════════════════════
function RegisterTab({ onLoginSuccess, setTab }) {
  const [displayName,   setDisplayName]   = useState('');
  const [username,      setUsername]      = useState('');
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [confirm,       setConfirm]       = useState('');
  const [gender,        setGender]        = useState('');
  const [error,         setError]         = useState('');
  const [loading,       setLoading]       = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!displayName.trim())    { setError('Display name is required.'); return; }
    if (!username.trim())       { setError('Username is required.'); return; }
    if (!/^[a-z0-9_]{3,20}$/i.test(username.trim())) {
      setError('Username must be 3–20 characters: letters, numbers, underscores only.');
      return;
    }
    if (!email.trim())          { setError('Email is required.'); return; }
    if (!password)              { setError('Password is required.'); return; }
    if (password.length < 6)   { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm)   { setError('Passwords do not match.'); return; }
    if (!gender)                { setError('Please select your gender.'); return; }

    setLoading(true);
    try {
      const user = await authService.register(email.trim(), password, username.trim(), displayName.trim(), gender);
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <InputField
        icon={User}
        placeholder="Display name"
        value={displayName}
        onChange={e => setDisplayName(e.target.value)}
        autoComplete="name"
      />
      <InputField
        icon={AtSign}
        placeholder="Username (letters, numbers, _)"
        value={username}
        onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
        autoComplete="username"
      />
      <InputField
        icon={Mail}
        type="email"
        placeholder="Email address"
        value={email}
        onChange={e => setEmail(e.target.value)}
        autoComplete="email"
      />
      <PasswordInput
        placeholder="Password (min 6 chars)"
        value={password}
        onChange={e => setPassword(e.target.value)}
        autoComplete="new-password"
      />
      <PasswordInput
        placeholder="Confirm password"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        autoComplete="new-password"
      />
      {/* Gender Selector */}
      <div className="relative">
        <select
          value={gender}
          onChange={e => setGender(e.target.value)}
          className="w-full appearance-none bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition pr-10"
        >
          <option value="" disabled>Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      </div>

      <ErrorMsg msg={error} />
      <PrimaryButton type="submit" loading={loading}>
        Create Account
      </PrimaryButton>
      <div className="flex items-center justify-center gap-1 text-xs text-slate-500 pt-1">
        <span>Already have an account?</span>
        <button type="button" onClick={() => setTab(TAB_SIGNIN)} className="text-purple-400 hover:text-pink-400 font-semibold transition">
          Sign in
        </button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RECOVER PASSWORD TAB
// ═══════════════════════════════════════════════════════════════════════════
function RecoverTab({ setTab }) {
  const [email,   setEmail]   = useState('');
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSuccess('If an account exists for that email, a reset link has been sent. Check your inbox.');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-slate-400 text-center leading-relaxed">
        Enter the email address you registered with and we'll send you a password reset link.
      </p>
      <InputField
        icon={Mail}
        type="email"
        placeholder="Your email address"
        value={email}
        onChange={e => setEmail(e.target.value)}
        autoComplete="email"
      />
      <ErrorMsg msg={error} />
      <SuccessMsg msg={success} />
      <PrimaryButton type="submit" loading={loading}>
        Send Reset Link
      </PrimaryButton>
      <div className="flex items-center justify-center pt-1">
        <button type="button" onClick={() => setTab(TAB_SIGNIN)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-purple-400 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN AUTH PAGE
// ═══════════════════════════════════════════════════════════════════════════
export function AuthPage({ onLoginSuccess, onBack }) {
  const [tab, setTab] = useState(TAB_SIGNIN);

  const tabLabels = {
    [TAB_SIGNIN]:   'Sign In',
    [TAB_REGISTER]: 'Create Account',
    [TAB_RECOVER]:  'Recover Password',
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col items-center justify-center px-4 py-10">
      {/* Back to landing */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="fixed top-5 left-5 flex items-center gap-1.5 text-xs text-slate-400 hover:text-purple-400 transition z-10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to home</span>
        </button>
      )}

      <div className="glass-card rounded-3xl p-8 w-full max-w-md space-y-6 border border-slate-800">
        {/* Logo */}
        <Logo />

        {/* Tab switcher */}
        <div className="flex items-center justify-center gap-1 bg-slate-900/60 rounded-2xl p-1">
          {[TAB_SIGNIN, TAB_REGISTER, TAB_RECOVER].map(t => (
            <TabButton key={t} active={tab === t} onClick={() => setTab(t)}>
              {tabLabels[t]}
            </TabButton>
          ))}
        </div>

        {/* Tab heading */}
        <div className="text-center">
          <h1 className="text-lg font-bold text-white">
            {tab === TAB_SIGNIN   && 'Welcome back'}
            {tab === TAB_REGISTER && 'Join AURA'}
            {tab === TAB_RECOVER  && 'Reset your password'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {tab === TAB_SIGNIN   && 'Sign in to your AURA account'}
            {tab === TAB_REGISTER && 'Create your free account and start earning Aura'}
            {tab === TAB_RECOVER  && 'We\'ll send you a link to reset your password'}
          </p>
        </div>

        {/* Tab content */}
        {tab === TAB_SIGNIN   && <SignInTab   onLoginSuccess={onLoginSuccess} setTab={setTab} />}
        {tab === TAB_REGISTER && <RegisterTab onLoginSuccess={onLoginSuccess} setTab={setTab} />}
        {tab === TAB_RECOVER  && <RecoverTab  setTab={setTab} />}

        {/* Footer note */}
        <p className="text-[10px] text-slate-600 text-center leading-relaxed">
          By continuing you agree to AURA's{' '}
          <span className="text-slate-500 cursor-pointer hover:text-purple-400 transition">Terms of Service</span>{' '}
          and{' '}
          <span className="text-slate-500 cursor-pointer hover:text-purple-400 transition">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
