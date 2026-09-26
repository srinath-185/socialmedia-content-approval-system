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
    <div className="h-screen max-h-screen w-full flex bg-slate-50/80 antialiased font-sans overflow-hidden">
      {/* Left Column: Compact Sign-In Form (Zero Scroll) */}
      <div className="w-full lg:w-[440px] xl:w-[470px] shrink-0 h-full flex flex-col justify-center items-center p-6 sm:p-8 lg:p-10 overflow-hidden bg-white/70 border-r border-slate-200/80">
        <div className="w-full max-w-[380px] my-auto">
          {/* Mobile Brand Header */}
          <div className="lg:hidden text-center mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#4f39f6] flex items-center justify-center text-white mx-auto shadow-md shadow-[#4f39f6]/30 mb-1.5">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Conceps Media</h1>
            <p className="text-xs text-slate-500">Content Approval System</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/90 p-6 sm:p-7">
            <div className="mb-4">
              <div className="hidden lg:flex items-center gap-2 mb-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#4f39f6] flex items-center justify-center text-white shadow-xs shadow-[#4f39f6]/30">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-xs font-bold tracking-tight text-slate-900 block leading-none">
                    Conceps Media
                  </span>
                  <span className="text-[9px] font-semibold text-[#4f39f6] tracking-wider uppercase">
                    Workflow Platform
                  </span>
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your credentials to manage campaigns and approvals
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@concepsmedia.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#4f39f6] focus:border-[#4f39f6] transition bg-slate-50/50"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <span className="text-[11px] text-[#4f39f6] hover:text-[#422de0] font-medium cursor-pointer transition">
                    Forgot?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#4f39f6] focus:border-[#4f39f6] transition bg-slate-50/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 focus:outline-hidden cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#4f39f6] hover:bg-[#422de0] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-[#4f39f6]/25 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
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
            <div className="mt-4 pt-3.5 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-2">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#4f39f6]" />
                  Instant Demo Login
                </span>
                <span className="text-[10px] text-slate-400 font-normal">1-click test</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@concepsmedia.com', 'Admin@123')}
                  disabled={isSubmitting}
                  className="py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-[#4f39f6]/10 hover:border-[#4f39f6]/40 text-center transition cursor-pointer disabled:opacity-50 group"
                >
                  <span className="block text-[11px] font-bold text-slate-800 group-hover:text-[#4f39f6]">Admin</span>
                  <span className="block text-[9px] text-slate-400 font-medium">All Clients</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('creator1@concepsmedia.com', 'Creator@123')}
                  disabled={isSubmitting}
                  className="py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-[#4f39f6]/10 hover:border-[#4f39f6]/40 text-center transition cursor-pointer disabled:opacity-50 group"
                >
                  <span className="block text-[11px] font-bold text-slate-800 group-hover:text-[#4f39f6]">Creator</span>
                  <span className="block text-[9px] text-slate-400 font-medium">Draft Posts</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('reviewer1@concepsmedia.com', 'Reviewer@123')}
                  disabled={isSubmitting}
                  className="py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-[#4f39f6]/10 hover:border-[#4f39f6]/40 text-center transition cursor-pointer disabled:opacity-50 group"
                >
                  <span className="block text-[11px] font-bold text-slate-800 group-hover:text-[#4f39f6]">Reviewer</span>
                  <span className="block text-[9px] text-slate-400 font-medium">Approve/Edit</span>
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-3">
            Conceps Media • Role-Based Access Control • 256-bit JWT
          </p>
        </div>
      </div>

      {/* Right Column: Branded Hero Banner using exact #4f39f6 color from image.png */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#452de4] via-[#4f39f6] to-[#3922cf] text-white relative flex-col justify-between p-8 xl:p-10 2xl:p-12 overflow-hidden h-full shadow-2xl">
        {/* Subtle Ambient Light Reflections */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[450px] h-[450px] bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[450px] h-[450px] bg-indigo-950/30 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 shrink-0">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-md backdrop-blur-xs">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block leading-none">
                Conceps Media
              </span>
              <span className="block text-[9px] uppercase font-semibold tracking-wider text-indigo-200 mt-0.5">
                Workflow Portal
              </span>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/25 text-[11px] font-medium text-white backdrop-blur-xs">
            <Sparkles className="w-3 h-3 text-white" />
            <span>Enterprise Content Governance</span>
          </div>
        </div>

        {/* Hero Value Proposition (Proportional Font & Complete Texts Visible) */}
        <div className="relative z-10 my-auto py-2 space-y-4 max-w-2xl w-full">
          <div className="space-y-2">
            <h1 className="text-2xl xl:text-3xl font-bold tracking-tight text-white leading-snug">
              Deterministic approvals for multi-brand campaigns.
            </h1>
            <p className="text-xs xl:text-sm text-indigo-100/90 leading-relaxed font-normal max-w-xl">
              Manage drafting, assigned reviewer sign-offs, 2-hour scheduling conflict checks, and automated publishing across X, Instagram, LinkedIn, and Facebook.
            </p>
          </div>

          {/* Key Feature Pillars (Expansive Cards with Glass Styling) */}
          <div className="space-y-2.5 pt-1 w-full">
            <div className="flex items-start gap-3 p-3 xl:p-3.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md transition hover:bg-white/15">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs xl:text-sm font-semibold text-white">Strict Multi-Tier RBAC</h2>
                <p className="text-[11px] xl:text-xs text-indigo-100 leading-normal mt-0.5">
                  Admin governance, creator draft permissions, and reviewer client scoping with zero self-approval.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 xl:p-3.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md transition hover:bg-white/15">
              <Clock className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs xl:text-sm font-semibold text-white">Conflict-Free Scheduling</h2>
                <p className="text-[11px] xl:text-xs text-indigo-100 leading-normal mt-0.5">
                  2-hour collision window prevention per brand and automated cron publishing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 xl:p-3.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md transition hover:bg-white/15">
              <ShieldCheck className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs xl:text-sm font-semibold text-white">Immutable Audit Trail</h2>
                <p className="text-[11px] xl:text-xs text-indigo-100 leading-normal mt-0.5">
                  Every state mutation stamped with actor ID, IP address, user-agent, and version tracking.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="relative z-10 pt-3 border-t border-white/15 flex items-center justify-between text-[11px] text-indigo-200 shrink-0">
          <span>Conceps Media v1.0</span>
          <span>SOC-2 Ready • 256-bit JWT</span>
        </div>
      </div>
    </div>
  );
};
