import { db } from "@/api/base44Client";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, Ticket } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";
import { parseAndValidateInviteCode } from "@/lib/workspace";
import { clearSessionCache } from "@/lib/sessionCache";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // Smart role invite links: /register?invite_token=XXXXXX (or ?invite_code=) auto-maps
  // the new user into the parent workspace with their predefined staff role.
  useEffect(() => {
    // Fresh signup in a possibly stale browser session — flush any cached auth
    // tokens / workspace state from a previous account so role & trial data never leak.
    clearSessionCache();
    const p = new URLSearchParams(window.location.search);
    const t = (p.get("invite_token") || p.get("invite_code") || "").toUpperCase();
    if (t) setInviteCode(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await db.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await db.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        db.auth.setToken(result.access_token);
      }
      if (inviteCode.trim()) {
        // Dynamic role-prefixed invite token (e.g. S-WS-6B2A8F-9F2B-K9X2M4) — legacy 6-digit codes pass through un-parsed.
        if (inviteCode.trim().includes("-")) {
          try { parseAndValidateInviteCode(inviteCode.trim()); } catch (err) {
            setError(err.message || "Invalid invite code");
            setLoading(false);
            return;
          }
        }
        try { await db.functions.invoke("verifyInviteCode", { code: inviteCode.trim(), email }); } catch { /* invalid code — proceed */ }
      } else {
        // Independent signup with no workspace invite code — permanently set this
        // account as the Business Owner. Retried once; the post-auth route guard
        // bootstrap self-heals any residual 'user' default role.
        const ensureOwner = async () => {
          try { const r = await db.functions.invoke("ensureOwnerRole"); return r?.data?.role === "admin"; } catch { return false; }
        };
        await ensureOwner() || await ensureOwner();
      }
      // 14-day unrestricted trial — start & expiry timestamps persist on the user profile
      // so the countdown runs continuously on the server clock.
      try {
        const now = new Date();
        await db.auth.updateMe({ trial_start_at: now.toISOString(), trial_expires_at: new Date(now.getTime() + 14 * 86400000).toISOString() });
      } catch { /* proceed */ }
      window.location.href = safeReturnTo();
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");