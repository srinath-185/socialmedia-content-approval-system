import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Layers,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
      toast.success('Welcome back!');
      navigate('/');
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || 'Invalid email or password. Please try again.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsSubmitting(true);
    try {
      await login({ email: demoEmail, password: demoPass });
      toast.success('Welcome back!');
      navigate('/');
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || 'Authentication failed. Please verify credentials.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen max-h-screen w-full flex bg-zinc-50/70 antialiased font-sans overflow-hidden">
      {/* Left Column: Compact Sign-In Form (Guaranteed Zero Scroll) */}
      <div className="w-full lg:w-[440px] xl:w-[470px] shrink-0 h-full flex flex-col justify-center items-center p-6 sm:p-8 lg:p-10 overflow-hidden bg-white/60 border-r border-zinc-200/60">
        <div className="w-full max-w-[380px] my-auto">
          {/* Mobile Brand Header */}
          <div className="lg:hidden text-center mb-4">
            <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center text-white mx-auto shadow-md mb-1.5">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-base font-bold text-black tracking-tight">Conceps Media</h1>
            <p className="text-xs text-zinc-500">Content Approval System</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-200/80 p-6 sm:p-7">
            <div className="mb-4">
              <div className="hidden lg:flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-xl bg-black flex items-center justify-center text-white shadow-xs">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-xs font-bold tracking-tight text-black block leading-none">
                    Conceps Media
                  </span>
                  <span className="text-[9px] font-semibold text-zinc-400 tracking-wider uppercase">
                    Workflow Platform
                  </span>
                </div>
              </div>
              <h2 className="text-xl font-bold text-black tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Enter your credentials to manage campaigns and approvals
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@concepsmedia.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-black focus:border-black transition bg-zinc-50/40"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider">
                    Password
                  </label>
                  <span className="text-[11px] text-zinc-500 hover:text-black font-medium cursor-pointer transition">
                    Forgot?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-black focus:border-black transition bg-zinc-50/40"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-700 focus:outline-hidden cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-black/10 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  'Signing in...'
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access Pills */}
            <div className="mt-4 pt-3.5 border-t border-zinc-100">
              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 mb-2">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Instant Demo Login
                </span>
                <span className="text-[10px] text-zinc-400 font-normal">1-click test</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@concepsmedia.com', 'Admin@123')}
                  disabled={isSubmitting}
                  className="py-1.5 px-2 rounded-lg border border-zinc-200 bg-zinc-50/80 hover:bg-zinc-100 hover:border-zinc-300 text-center transition cursor-pointer disabled:opacity-50 group"
                >
                  <span className="block text-[11px] font-bold text-zinc-900 group-hover:text-black">Admin</span>
                  <span className="block text-[9px] text-zinc-400 font-medium">All Clients</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('creator1@concepsmedia.com', 'Creator@123')}
                  disabled={isSubmitting}
                  className="py-1.5 px-2 rounded-lg border border-zinc-200 bg-zinc-50/80 hover:bg-zinc-100 hover:border-zinc-300 text-center transition cursor-pointer disabled:opacity-50 group"
                >
                  <span className="block text-[11px] font-bold text-zinc-900 group-hover:text-black">Creator</span>
                  <span className="block text-[9px] text-zinc-400 font-medium">Draft Posts</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('reviewer1@concepsmedia.com', 'Reviewer@123')}
                  disabled={isSubmitting}
                  className="py-1.5 px-2 rounded-lg border border-zinc-200 bg-zinc-50/80 hover:bg-zinc-100 hover:border-zinc-300 text-center transition cursor-pointer disabled:opacity-50 group"
                >
                  <span className="block text-[11px] font-bold text-zinc-900 group-hover:text-black">Reviewer</span>
                  <span className="block text-[9px] text-zinc-400 font-medium">Approve/Edit</span>
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] text-zinc-400 mt-3">
            Conceps Media • Role-Based Access Control • 256-bit JWT
          </p>
        </div>
      </div>

      {/* Right Column: Wide Enterprise Hero Banner (Proportional Font Size & Guaranteed 100% Fit) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-black via-zinc-950 to-neutral-950 text-white relative flex-col justify-between p-8 xl:p-10 2xl:p-12 overflow-hidden h-full">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[450px] h-[450px] bg-zinc-700/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[450px] h-[450px] bg-zinc-800/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 shrink-0">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-white shadow-md">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block leading-none">
                Conceps Media
              </span>
              <span className="block text-[9px] uppercase font-semibold tracking-wider text-zinc-400 mt-0.5">
                Workflow Portal
              </span>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-900/90 border border-zinc-700/60 text-[11px] font-medium text-zinc-300">
            <Sparkles className="w-3 h-3 text-zinc-300" />
            <span>Enterprise Content Governance</span>
          </div>
        </div>

        {/* Hero Value Proposition (Proportional Font & Complete Texts Visible) */}
        <div className="relative z-10 my-auto py-2 space-y-4 max-w-2xl w-full">
          <div className="space-y-2">
            <h1 className="text-2xl xl:text-3xl font-bold tracking-tight text-white leading-snug">
              Deterministic approvals for multi-brand campaigns.
            </h1>
            <p className="text-xs xl:text-sm text-zinc-400 leading-relaxed font-normal max-w-xl">
              Manage drafting, assigned reviewer sign-offs, 2-hour scheduling conflict checks, and automated publishing across X, Instagram, LinkedIn, and Facebook.
            </p>
          </div>

          {/* Key Feature Pillars (Proportional & Complete) */}
          <div className="space-y-2.5 pt-1 w-full">
            <div className="flex items-start gap-3 p-3 xl:p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xs transition hover:border-zinc-700">
              <CheckCircle2 className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs xl:text-sm font-semibold text-white">Strict Multi-Tier RBAC</h2>
                <p className="text-[11px] xl:text-xs text-zinc-400 leading-normal mt-0.5">
                  Admin governance, creator draft permissions, and reviewer client scoping with zero self-approval.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 xl:p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xs transition hover:border-zinc-700">
              <Clock className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs xl:text-sm font-semibold text-white">Conflict-Free Scheduling</h2>
                <p className="text-[11px] xl:text-xs text-zinc-400 leading-normal mt-0.5">
                  2-hour collision window prevention per brand and automated cron publishing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 xl:p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xs transition hover:border-zinc-700">
              <ShieldCheck className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs xl:text-sm font-semibold text-white">Immutable Audit Trail</h2>
                <p className="text-[11px] xl:text-xs text-zinc-400 leading-normal mt-0.5">
                  Every state mutation stamped with actor ID, IP address, user-agent, and version tracking.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="relative z-10 pt-3 border-t border-zinc-800/70 flex items-center justify-between text-[11px] text-zinc-400 shrink-0">
          <span>Conceps Media v1.0</span>
          <span>SOC-2 Ready • 256-bit JWT</span>
        </div>
      </div>
    </div>
  );
};
