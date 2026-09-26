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
    <div className="min-h-screen w-full flex bg-slate-50 antialiased font-sans">
      {/* Left Column: Enterprise Hero Banner (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white relative flex-col justify-between p-12 overflow-hidden border-r border-slate-800/80">
        {/* Subtle Decorative Glows */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">Conceps Media</span>
              <span className="block text-[10px] uppercase font-semibold tracking-wider text-indigo-400">
                Workflow Portal
              </span>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-900/60 border border-indigo-700/50 text-[11px] font-medium text-indigo-300">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Enterprise Content Governance</span>
          </div>
        </div>

        {/* Hero Value Proposition */}
        <div className="relative z-10 my-auto py-8 space-y-6 max-w-md">
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Deterministic approvals for multi-brand campaigns.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Manage drafting, assigned reviewer sign-offs, 2-hour scheduling conflict checks, and automated publishing across X, Instagram, LinkedIn, and Facebook.
            </p>
          </div>

          {/* Key Feature Pillars */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs font-semibold text-slate-200">Strict Multi-Tier RBAC</h2>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Admin governance, creator draft permissions, and reviewer client scoping with zero self-approval.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs">
              <Clock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs font-semibold text-slate-200">Conflict-Free Scheduling</h2>
                <p className="text-[11px] text-slate-400 leading-normal">
                  2-hour collision window prevention per brand and automated cron publishing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs">
              <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs font-semibold text-slate-200">Immutable Audit Trail</h2>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Every state mutation stamped with actor ID, IP address, user-agent, and version tracking.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="relative z-10 pt-6 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Conceps Media v1.0</span>
          <span>SOC-2 Ready • 256-bit JWT</span>
        </div>
      </div>

      {/* Right Column: Clean, Compact Sign-In Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile Brand Header */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white mx-auto shadow-md mb-2">
              <Layers className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Conceps Media</h1>
            <p className="text-xs text-slate-500">Content Approval System</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-6 sm:p-7">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Sign In</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Access your campaigns and approval workflow
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@concepsmedia.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition bg-slate-50/30"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <span className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer">
                    Forgot?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition bg-slate-50/30"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
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
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-2">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Instant Demo Login
                </span>
                <span className="text-[10px] text-slate-400">Click to enter</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@concepsmedia.com', 'Admin@123')}
                  disabled={isSubmitting}
                  className="py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-[11px] font-semibold text-slate-700 transition text-center cursor-pointer disabled:opacity-50"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('creator1@concepsmedia.com', 'Creator@123')}
                  disabled={isSubmitting}
                  className="py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-[11px] font-semibold text-slate-700 transition text-center cursor-pointer disabled:opacity-50"
                >
                  Creator
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('reviewer1@concepsmedia.com', 'Reviewer@123')}
                  disabled={isSubmitting}
                  className="py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-[11px] font-semibold text-slate-700 transition text-center cursor-pointer disabled:opacity-50"
                >
                  Reviewer
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-4">
            Conceps Media • Role-Based Access Control
          </p>
        </div>
      </div>
    </div>
  );
};
