"use client";
import { useState, FormEvent, useRef, useEffect } from "react";
import { Eye, EyeOff, ArrowLeft, Loader2, Mail, Lock, ShieldCheck, KeyRound } from "lucide-react";
import { toast } from "react-toastify";
import {
  loginUser,
  forgotPasswordApi,
  resetPasswordApi,
} from "@/api/module/auth";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/zustand/authStore";
import MagnifyText from "@/app/components/MagnifyText";

type Mode = "login" | "forgot" | "otp" | "reset";

// ─── Floating label input ───────────────────────────────────────────────────
function FloatingInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  icon: Icon,
  required,
  minLength,
  maxLength,
  placeholder,
  autoFocus,
  rightNode,
  inputClassName = "",
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  autoFocus?: boolean;
  rightNode?: React.ReactNode;
  inputClassName?: string;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;
  return (
    <div className="relative group">
      {/* glow ring */}
      <div
        className={`absolute inset-0 rounded-xl transition-all duration-300 pointer-events-none ${focused
          ? "shadow-[0_0_0_1.5px_#9EFF00,0_0_18px_rgba(158,255,0,0.18)]"
          : "shadow-[0_0_0_1px_rgba(255,255,255,0.07)]"
          }`}
      />
      {Icon && (
        <div
          className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focused ? "text-[#9EFF00]" : "text-gray-600"
            }`}
        >
          <Icon size={15} />
        </div>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        placeholder={active ? placeholder ?? "" : ""}
        autoFocus={autoFocus}
        className={`w-full bg-[#141414] rounded-xl px-4 pt-6 pb-2.5 text-white outline-none text-base transition-all duration-200
          border border-[rgba(255,255,255,0.08)]
          focus:border-[#9EFF00]
          placeholder-gray-600
          ${Icon ? "pl-10" : ""}
          ${rightNode ? "pr-12" : ""}
          ${inputClassName}`}
      />
      <label
        htmlFor={id}
        className={`absolute transition-all duration-200 pointer-events-none font-medium
          ${Icon ? "left-10" : "left-4"}
          ${active
            ? `top-2 text-[11px] ${focused ? "text-[#9EFF00]" : "text-gray-400"}`
            : "top-1/2 -translate-y-1/2 text-base text-gray-500"
          }`}
      >
        {label}
        {required && <span className="text-[#9EFF00] ml-0.5">*</span>}
      </label>
      {rightNode && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">{rightNode}</div>
      )}
    </div>
  );
}

// ─── OTP Digit Boxes ─────────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, "").split("").slice(0, 6);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const next = digits.slice();
      if (next[i]) {
        next[i] = "";
      } else if (i > 0) {
        next[i - 1] = "";
        refs.current[i - 1]?.focus();
      }
      onChange(next.join(""));
    }
  };

  const handleChange = (i: number, raw: string) => {
    const ch = raw.replace(/\D/g, "").slice(-1);
    const next = digits.slice();
    next[i] = ch;
    onChange(next.join(""));
    if (ch && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted.padEnd(6, "").slice(0, 6));
    refs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={`w-11 h-13 text-center text-xl font-bold rounded-xl outline-none transition-all duration-200 bg-[#141414] border
            ${digits[i]
              ? "border-[#9EFF00] text-[#9EFF00] shadow-[0_0_10px_rgba(158,255,0,0.25)]"
              : "border-[rgba(255,255,255,0.1)] text-white"
            }
            focus:border-[#9EFF00] focus:shadow-[0_0_0_1.5px_#9EFF00]`}
          style={{ height: "52px" }}
        />
      ))}
    </div>
  );
}

// ─── Password Input with eye toggle ──────────────────────────────────────────
function PasswordInput({
  id, label, value, onChange, show, onToggle, autoFocus,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; autoFocus?: boolean;
}) {
  return (
    <FloatingInput
      id={id}
      label={label}
      type={show ? "text" : "password"}
      value={value}
      onChange={onChange}
      icon={Lock}
      required
      minLength={6}
      placeholder="••••••••"
      autoFocus={autoFocus}
      rightNode={
        <button
          type="button"
          onClick={onToggle}
          className="text-gray-500 hover:text-white transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
    />
  );
}

// ─── Submit Button ────────────────────────────────────────────────────────────
function SubmitBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full relative overflow-hidden rounded-xl py-3.5 font-bold text-sm tracking-widest text-black
        bg-[#9EFF00] transition-all duration-200
        hover:bg-[#a8ff1a] hover:shadow-[0_0_20px_rgba(158,255,0,0.4)]
        active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed
        flex items-center justify-center gap-2"
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setAuth } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Reset visibility toggles on mode change
  useEffect(() => {
    setShowPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }, [mode]);

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("All fields required");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await loginUser({ email: email.trim(), password });
      if (res.status === 200 || res.status === 201) {
        const data = res.data?.data;
        const client = data?.client;
        const user = data?.user;
        const normalizedUser = client
          ? {
            _id: client._id,
            fullname: client.name || client.fullname || client.username,
            email: client.email,
            profilePicture: undefined,
            nationalId: null,
            designation: "client",
            userType: "client",
          }
          : user
            ? {
              _id: user._id,
              fullname: user.fullname || user.username,
              email: user.email,
              profilePicture: user.profileImage || user.profilePicture,
              nationalId: user.nationalId || null,
              designation: user.role || user.designation,
              userType: user.role || "user",
            }
            : null;

        if (!data?.token || !normalizedUser) {
          toast.error("Login response missing token or user");
          setIsSubmitting(false);
          return;
        }

        if (normalizedUser.userType !== "client") {
          toast.error("Only client accounts can access the Client Portal");
          setIsSubmitting(false);
          return;
        }

        localStorage.setItem("token", data.token);
        setAuth({ token: data.token, user: normalizedUser });
        toast.success("Welcome back!");
        window.location.href = "/dashboard";
      } else {
        toast.error(res.data?.message || "Login failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── FORGOT ─────────────────────────────────────────────────────────────────
  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Email required"); return; }
    setIsSubmitting(true);
    try {
      const res = await forgotPasswordApi({ email: email.trim() });
      if (res.status === 200 || res.status === 201) {
        toast.success("OTP sent to your email!");
        setMode("otp");
      } else {
        toast.error(res.data?.message || "Email not found");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── OTP ────────────────────────────────────────────────────────────────────
  const handleOtp = (e: FormEvent) => {
    e.preventDefault();
    if (otp.replace(/\s/g, "").length !== 6) {
      toast.error("Enter all 6 digits");
      return;
    }
    setMode("reset");
  };

  // ── RESET ──────────────────────────────────────────────────────────────────
  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    if (newPassword.length < 6) { toast.error("Minimum 6 characters"); return; }
    setIsSubmitting(true);
    try {
      const res = await resetPasswordApi({ email, otp, newPassword });
      if (res.status === 200 || res.status === 201) {
        toast.success("Password reset! You can now sign in.");
        setMode("login");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.data?.message || "Reset failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── RIGHT PANEL DATA ───────────────────────────────────────────────────────
  const rightPanel = {
    login: {
      icon: <ShieldCheck size={44} strokeWidth={1.4} className="text-[#9EFF00]" />,
      title: "Welcome Back",
      sub: "Access your dashboard",
      desc: "Track proposals, manage your profile and stay connected with your project.",
    },
    forgot: {
      icon: <Mail size={44} strokeWidth={1.4} className="text-[#9EFF00]" />,
      title: "Check Your Email",
      sub: "OTP will be sent",
      desc: "Enter your registered email address to receive a one-time password.",
    },
    otp: {
      icon: <KeyRound size={44} strokeWidth={1.4} className="text-[#9EFF00]" />,
      title: "Verify OTP",
      sub: "Check your inbox",
      desc: "Enter the 6-digit code we sent you. It expires in 10 minutes.",
    },
    reset: {
      icon: <Lock size={44} strokeWidth={1.4} className="text-[#9EFF00]" />,
      title: "New Password",
      sub: "Almost there!",
      desc: "Choose a strong password to keep your account secure.",
    },
  };

  const rp = rightPanel[mode];
  const stepIndex = (["login", "forgot", "otp", "reset"] as Mode[]).indexOf(mode);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 pt-28 md:pt-32 bg-[#080808]">
      <div className="w-full max-w-[960px] rounded-3xl overflow-hidden border border-white/[0.06] flex flex-col md:flex-row shadow-[0_30px_80px_rgba(0,0,0,0.7)] min-h-[620px]">

        {/* ════════ LEFT PANEL ════════ */}
        <div className="w-full md:w-[52%] p-8 md:p-14 bg-[#0d0d0d] flex flex-col justify-center">

          {/* Header */}
          <div className="mb-10">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[#9EFF00] text-xs hover:opacity-80 transition-opacity mb-8"
            >
              <ArrowLeft size={13} />
              Back to Home
            </Link>

            <div className="flex items-center gap-3 mb-1">
              <div className="relative">
                <Image
                  src="/images/Logo.png"
                  alt="WG Logo"
                  width={36}
                  height={36}
                  className="object-contain animate-spin-slow"
                />
              </div>
              <span className="text-[#9EFF00] text-base font-bold tracking-wide">
                WG Tech Solutions
              </span>
            </div>
          </div>

          {/* ── LOGIN FORM ── */}
          {mode === "login" && (
            <div className="flex-1 flex flex-col">
              <h1 className="text-white text-3xl font-bold mb-2">
                <MagnifyText text="Sign In" />
              </h1>
              <p className="text-gray-500 text-sm mb-10">
                Enter your credentials to continue
              </p>
              <form onSubmit={handleLogin} className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-6">
                  <FloatingInput
                    id="login-email"
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    icon={Mail}
                    required
                    placeholder="your@email.com"
                    autoFocus
                  />
                  <PasswordInput
                    id="login-password"
                    label="Password"
                    value={password}
                    onChange={setPassword}
                    show={showPassword}
                    onToggle={() => setShowPassword((p) => !p)}
                  />

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-[#9EFF00] text-sm hover:opacity-70 transition-opacity font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <SubmitBtn loading={isSubmitting}>
                    {isSubmitting ? "Signing in…" : "SIGN IN"}
                  </SubmitBtn>

                  <p className="text-center text-gray-500 text-sm">
                    Don't have an account?{" "}
                    <Link href="/contact" className="text-[#9EFF00] hover:opacity-80 font-bold ml-1">
                      Contact Us
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* ── FORGOT FORM ── */}
          {mode === "forgot" && (
            <div className="flex-1 flex flex-col">
              <h1 className="text-white text-3xl font-bold mb-2">
                <MagnifyText text="Forgot Password" />
              </h1>
              <p className="text-gray-500 text-sm mb-10">
                Enter your registered email to receive an OTP
              </p>
              <form onSubmit={handleForgot} className="flex flex-col">
                <FloatingInput
                  id="forgot-email"
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  icon={Mail}
                  required
                  placeholder="your@email.com"
                  autoFocus
                />
                <div className="mt-4 space-y-4">
                  <SubmitBtn loading={isSubmitting}>
                    {isSubmitting ? "Sending OTP…" : "SEND OTP"}
                  </SubmitBtn>
                  <p className="text-center text-sm text-gray-500">
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-[#9EFF00] hover:opacity-80 inline-flex items-center gap-1.5 font-medium"
                    >
                      <ArrowLeft size={14} /> Back to Sign In
                    </button>
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* ── OTP FORM ── */}
          {mode === "otp" && (
            <div className="flex-1 flex flex-col">
              <h1 className="text-white text-3xl font-bold mb-2">
                <MagnifyText text="Verify OTP" />
              </h1>
              <p className="text-gray-400 text-sm mb-1">
                Code sent to{" "}
                <span className="text-[#9EFF00] font-medium">{email}</span>
              </p>
              <p className="text-gray-600 text-xs mb-10">Expires in 10 minutes</p>

              <form onSubmit={handleOtp} className="space-y-8 flex-1 flex flex-col justify-between">
                <div className="py-2">
                  <OtpInput value={otp} onChange={setOtp} />
                </div>

                <div className="mt-8 space-y-4">
                  <SubmitBtn loading={false}>VERIFY OTP</SubmitBtn>

                  <p className="text-center text-sm text-gray-500">
                    Didn't receive the code?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-[#9EFF00] hover:opacity-80 font-bold ml-1"
                    >
                      Resend OTP
                    </button>
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* ── RESET FORM ── */}
          {mode === "reset" && (
            <div className="flex-1 flex flex-col">
              <h1 className="text-white text-3xl font-bold mb-2">
                <MagnifyText text="Set New Password" />
              </h1>
              <p className="text-gray-500 text-sm mb-10">
                Choose a strong password for your account
              </p>
              <form onSubmit={handleReset} className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-6">
                  <PasswordInput
                    id="new-password"
                    label="New Password"
                    value={newPassword}
                    onChange={setNewPassword}
                    show={showNewPassword}
                    onToggle={() => setShowNewPassword((p) => !p)}
                    autoFocus
                  />
                  <PasswordInput
                    id="confirm-password"
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    show={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((p) => !p)}
                  />

                  {/* Strength indicator */}
                  {newPassword.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((lvl) => {
                          const strength = Math.min(
                            Math.floor(newPassword.length / 3),
                            4
                          );
                          return (
                            <div
                              key={lvl}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${lvl <= strength
                                ? strength >= 4
                                  ? "bg-[#9EFF00]"
                                  : strength >= 2
                                    ? "bg-yellow-400"
                                    : "bg-red-500"
                                : "bg-white/10"
                                }`}
                            />
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-gray-600">
                        {newPassword.length < 6
                          ? "Too short"
                          : newPassword.length < 9
                            ? "Moderate — try adding numbers & symbols"
                            : "Strong password ✓"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <SubmitBtn loading={isSubmitting}>
                    {isSubmitting ? "Resetting…" : "RESET PASSWORD"}
                  </SubmitBtn>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ════════ RIGHT PANEL ════════ */}
        <div className="hidden md:flex w-full md:w-[48%] bg-[#0a0a0a] border-l border-white/[0.06] p-8 md:p-14 relative overflow-hidden flex-col items-center justify-center">

          {/* Animated background grid */}
          <div aria-hidden className="wg-auth-tech-bg">
            <div className="wg-auth-tech-glow wg-auth-tech-glow--tr" />
            <div className="wg-auth-tech-glow wg-auth-tech-glow--bl" />
            <div className="wg-auth-tech-fade" />
            <div className="wg-auth-tech-lines">
              {[14, 24, 36, 48, 60, 72, 84].map((top, i) => (
                <div
                  key={i}
                  className="wg-auth-tech-line"
                  style={{
                    top: `${top}%`,
                    ["--dur" as any]: `${4 + (i % 3) * 0.7}s`,
                    ["--delay" as any]: `${-1 * (i + 1)}s`,
                  }}
                />
              ))}
              {[10, 26, 44, 68, 86].map((left, i) => (
                <div
                  key={i}
                  className="wg-auth-tech-vline"
                  style={{
                    left: `${left}%`,
                    ["--dur" as any]: `${5 + (i % 2) * 0.9}s`,
                    ["--delay" as any]: `${-2 * (i + 1)}s`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-[280px] mx-auto">

            {/* Icon circle */}
            <div className="w-20 h-20 rounded-2xl bg-[#9EFF00]/10 border border-[#9EFF00]/20 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(158,255,0,0.1)]">
              {rp.icon}
            </div>

            <h2 className="text-[#9EFF00] text-2xl font-bold mb-2">{rp.title}</h2>
            <p className="text-white/70 text-sm font-medium mb-1">{rp.sub}</p>
            <p className="text-white/40 text-xs leading-relaxed">{rp.desc}</p>

            {/* Step dots */}
            <div className="flex gap-2 mt-10">
              {(["login", "forgot", "otp", "reset"] as Mode[]).map((m, i) => (
                <div
                  key={m}
                  className={`rounded-full transition-all duration-300 ${mode === m
                    ? "bg-[#9EFF00] w-6 h-2"
                    : i < stepIndex
                      ? "bg-[#9EFF00]/50 w-2 h-2"
                      : "bg-white/15 w-2 h-2"
                    }`}
                />
              ))}
            </div>

            {/* Feature tags */}
            <div className="flex flex-wrap gap-2 justify-center mt-8">
              {["Secure", "Encrypted", "Fast"].map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium text-[#9EFF00]/70 bg-[#9EFF00]/5 border border-[#9EFF00]/15 rounded-full px-3 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
