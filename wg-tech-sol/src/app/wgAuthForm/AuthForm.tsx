"use client";
import { useState, FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
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

  // ✅ LOGIN
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

        // Backend returns { client, token } for client logins and { user, token } for admin/worker.
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

  // ✅ FORGOT
  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email required");
      return;
    }
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

  // ✅ OTP
  const handleOtp = (e: FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter 6-digit OTP");
      return;
    }
    setMode("reset");
  };

  // ✅ RESET
  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Min 6 characters");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await resetPasswordApi({ email, otp, newPassword });
      if (res.status === 200 || res.status === 201) {
        toast.success("Password reset! Please login.");
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

  const inputClass =
    "w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white outline-none focus:border-[#9EFF00] transition-all placeholder-gray-600 text-sm";
  const labelClass =
    "text-gray-400 text-xs font-medium mb-1 block uppercase tracking-wider";
  const btnPrimary =
    "w-full bg-[#9EFF00] text-black font-bold py-3 rounded-xl hover:bg-[#8CE600] transition-all disabled:opacity-50 text-sm tracking-widest";
  const eyeBtn =
    "absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors";

  // Right panel content per mode
  const rightPanel = {
    login: {
      emoji: "🚀",
      title: "Welcome Back!",
      sub: "Access your dashboard",
      desc: "Track proposals, manage your profile and stay updated.",
    },
    forgot: {
      emoji: "📧",
      title: "Check Email!",
      sub: "OTP will be sent to you",
      desc: "Enter your registered email to receive a password reset OTP.",
    },
    otp: {
      emoji: "🔐",
      title: "Verify OTP",
      sub: "Check your inbox",
      desc: "Enter the 6-digit code sent to your email. Expires in 10 minutes.",
    },
    reset: {
      emoji: "🔑",
      title: "New Password",
      sub: "Almost done!",
      desc: "Choose a strong password to secure your account.",
    },
  };

  const rp = rightPanel[mode];

  return (
    // <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-black">
    <div className="min-h-screen flex items-center justify-center px-4 py-10 pt-30 md:pt-34 bg-black">
      <div className="w-full max-w-[880px] rounded-3xl overflow-hidden border border-[#222] flex flex-col md:flex-row shadow-2xl min-h-[560px]">
        {/* ===== LEFT PANEL ===== */}
        <div className="w-full md:w-1/2 p-8 md:p-10 bg-[#0d0d0d] flex flex-col justify-between">
          {/* Logo */}
          <div>
            <div className="mb-4">
              <Link href="/" className="text-[#9EFF00] text-xs hover:underline">
                ← Back to Home
              </Link>
            </div>
            {/* <div className="mb-6">
              <span className="text-[#9EFF00] text-lg font-bold tracking-wide">WG Tech Solutions</span>
            </div> */}
            <div className="mb-6 flex items-center gap-3">
              <Image
                src="/images/Logo.png"
                alt="WG Logo"
                width={40}
                height={40}
                className="object-contain animate-spin-slow"
              />
              <span className="text-[#9EFF00] text-lg font-bold tracking-wide">
                WG Tech Solutions
              </span>
            </div>
            {/* LOGIN */}
            {mode === "login" && (
              <>
                <h1 className="text-white text-2xl font-bold mb-1">
                  <MagnifyText text="Sign In" />
                </h1>
                <p className="text-gray-500 text-sm mb-6">
                  Enter your credentials to continue
                </p>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className={labelClass}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className={inputClass + " pr-12"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={eyeBtn}
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-[#9EFF00] text-xs hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={btnPrimary}
                  >
                    {isSubmitting ? "Signing in..." : "SIGN IN"}
                  </button>
                  <p className="text-center text-gray-500 text-xs pt-1">
                    Need an account?{" "}
                    <Link
                      href="/contact"
                      className="text-[#9EFF00] hover:underline font-semibold"
                    >
                      Contact Us
                    </Link>
                  </p>
                </form>
              </>
            )}

            {/* FORGOT */}
            {mode === "forgot" && (
              <>
                <h1 className="text-white text-2xl font-bold mb-1">
                  <MagnifyText text="Forgot Password" />
                </h1>
                <p className="text-gray-500 text-sm mb-6">
                  Enter your registered email to receive OTP
                </p>
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className={labelClass}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={btnPrimary}
                  >
                    {isSubmitting ? "Sending..." : "SEND OTP"}
                  </button>
                  <p className="text-center text-xs text-gray-500 pt-1">
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-[#9EFF00] hover:underline"
                    >
                      ← Back to Login
                    </button>
                  </p>
                </form>
              </>
            )}

            {/* OTP */}
            {mode === "otp" && (
              <>
                <h1 className="text-white text-2xl font-bold mb-1">
                  <MagnifyText text="Verify OTP" />
                </h1>
                <p className="text-gray-500 text-sm mb-1">
                  Code sent to <span className="text-[#9EFF00]">{email}</span>
                </p>
                <p className="text-gray-600 text-xs mb-6">
                  Expires in 10 minutes.
                </p>
                <form onSubmit={handleOtp} className="space-y-4">
                  <div>
                    <label className={labelClass}>6-Digit OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="0  0  0  0  0  0"
                      required
                      maxLength={6}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white outline-none focus:border-[#9EFF00] transition-all text-center text-xl tracking-[0.6em] placeholder-gray-700"
                    />
                  </div>
                  <button type="submit" className={btnPrimary}>
                    VERIFY OTP
                  </button>
                  <p className="text-center text-xs text-gray-500 pt-1">
                    Didn't receive?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-[#9EFF00] hover:underline"
                    >
                      Resend OTP
                    </button>
                  </p>
                </form>
              </>
            )}

            {/* RESET */}
            {mode === "reset" && (
              <>
                <h1 className="text-white text-2xl font-bold mb-1">
                  <MagnifyText text="New Password" />
                </h1>
                <p className="text-gray-500 text-sm mb-6">
                  Set your new secure password
                </p>
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className={labelClass}>New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className={inputClass + " pr-12"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className={eyeBtn}
                      >
                        {showNewPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className={inputClass + " pr-12"}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className={eyeBtn}
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={btnPrimary}
                  >
                    {isSubmitting ? "Resetting..." : "RESET PASSWORD"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* ===== RIGHT PANEL ===== */}
        <div className="w-full md:w-1/2 bg-[#0b0b0b] border-t md:border-t-0 md:border-l border-[#222] p-8 md:p-10 relative overflow-hidden">
          {/* Animated tech lines (chip/bus data flow) */}
          <div aria-hidden="true" className="wg-auth-tech-bg">
            <div className="wg-auth-tech-glow wg-auth-tech-glow--tr" />
            <div className="wg-auth-tech-glow wg-auth-tech-glow--bl" />
            <div className="wg-auth-tech-fade" />

            <div className="wg-auth-tech-lines">
              <div
                className="wg-auth-tech-line"
                style={{
                  top: "14%",
                  ["--dur" as any]: "4.8s",
                  ["--delay" as any]: "-1.2s",
                }}
              />
              <div
                className="wg-auth-tech-line"
                style={{
                  top: "24%",
                  ["--dur" as any]: "3.6s",
                  ["--delay" as any]: "-2.4s",
                }}
              />
              <div
                className="wg-auth-tech-line"
                style={{
                  top: "36%",
                  ["--dur" as any]: "5.4s",
                  ["--delay" as any]: "-0.6s",
                }}
              />
              <div
                className="wg-auth-tech-line"
                style={{
                  top: "48%",
                  ["--dur" as any]: "4.1s",
                  ["--delay" as any]: "-3.1s",
                }}
              />
              <div
                className="wg-auth-tech-line"
                style={{
                  top: "60%",
                  ["--dur" as any]: "6.2s",
                  ["--delay" as any]: "-2.0s",
                }}
              />
              <div
                className="wg-auth-tech-line"
                style={{
                  top: "72%",
                  ["--dur" as any]: "3.9s",
                  ["--delay" as any]: "-1.8s",
                }}
              />
              <div
                className="wg-auth-tech-line"
                style={{
                  top: "84%",
                  ["--dur" as any]: "5.9s",
                  ["--delay" as any]: "-0.9s",
                }}
              />

              {/* Vertical traces */}
              <div
                className="wg-auth-tech-vline"
                style={{
                  left: "10%",
                  ["--dur" as any]: "5.8s",
                  ["--delay" as any]: "-2.2s",
                }}
              />
              <div
                className="wg-auth-tech-vline"
                style={{
                  left: "26%",
                  ["--dur" as any]: "4.9s",
                  ["--delay" as any]: "-1.3s",
                }}
              />
              <div
                className="wg-auth-tech-vline"
                style={{
                  left: "44%",
                  ["--dur" as any]: "6.3s",
                  ["--delay" as any]: "-3.1s",
                }}
              />
              <div
                className="wg-auth-tech-vline"
                style={{
                  left: "68%",
                  ["--dur" as any]: "5.2s",
                  ["--delay" as any]: "-0.9s",
                }}
              />
              <div
                className="wg-auth-tech-vline"
                style={{
                  left: "86%",
                  ["--dur" as any]: "6.9s",
                  ["--delay" as any]: "-2.8s",
                }}
              />

              {/* Turning network paths (L-shapes) */}
              <div
                className="wg-auth-tech-path wg-auth-tech-path--hv"
                style={{
                  left: "8%",
                  top: "18%",
                  ["--w" as any]: "240px",
                  ["--h" as any]: "120px",
                  ["--elbow" as any]: "140px",
                  ["--dur" as any]: "6.4s",
                  ["--delay" as any]: "-1.8s",
                  ["--rot" as any]: "-6deg",
                }}
              />
              <div
                className="wg-auth-tech-path wg-auth-tech-path--vh"
                style={{
                  left: "62%",
                  top: "8%",
                  ["--w" as any]: "210px",
                  ["--h" as any]: "150px",
                  ["--elbow" as any]: "86px",
                  ["--dur" as any]: "5.7s",
                  ["--delay" as any]: "-2.6s",
                  ["--rot" as any]: "10deg",
                }}
              />
              <div
                className="wg-auth-tech-path wg-auth-tech-path--hv"
                style={{
                  left: "22%",
                  top: "58%",
                  ["--w" as any]: "260px",
                  ["--h" as any]: "130px",
                  ["--elbow" as any]: "110px",
                  ["--dur" as any]: "7.2s",
                  ["--delay" as any]: "-3.4s",
                  ["--rot" as any]: "4deg",
                }}
              />
              <div
                className="wg-auth-tech-path wg-auth-tech-path--vh"
                style={{
                  left: "6%",
                  top: "72%",
                  ["--w" as any]: "200px",
                  ["--h" as any]: "140px",
                  ["--elbow" as any]: "92px",
                  ["--dur" as any]: "6.1s",
                  ["--delay" as any]: "-0.7s",
                  ["--rot" as any]: "-12deg",
                }}
              />
              <div
                className="wg-auth-tech-path wg-auth-tech-path--hv"
                style={{
                  left: "58%",
                  top: "46%",
                  ["--w" as any]: "230px",
                  ["--h" as any]: "120px",
                  ["--elbow" as any]: "150px",
                  ["--dur" as any]: "5.4s",
                  ["--delay" as any]: "-4.1s",
                  ["--rot" as any]: "-2deg",
                }}
              />
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center text-center min-h-[280px] md:min-h-0">
            <div className="text-5xl mb-5 text-[#9EFF00]">{rp.emoji}</div>
            <h2 className="text-[#9EFF00] text-3xl font-bold mb-2">
              {rp.title}
            </h2>
            <p className="text-white/80 text-base font-medium mb-1">{rp.sub}</p>
            <p className="text-white/60 text-sm max-w-[260px] leading-relaxed">
              {rp.desc}
            </p>

            {/* Mode indicator dots */}
            <div className="flex gap-2 mt-8">
              {(["login", "forgot", "otp", "reset"] as Mode[]).map((m) => (
                <div
                  key={m}
                  className={`h-2 rounded-full transition-all ${mode === m ? "bg-[#9EFF00] w-5" : "bg-white/25 w-2"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
