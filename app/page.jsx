"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@supabase/supabase-js";

const FLOWER_GROUPS = ["Lục", "Lam", "Tím", "Vàng", "Đỏ", "Đỏ 30"];
const MEMBER_FLOWER_GROUP_ORDER = ["Đỏ 30", "Đỏ", "Vàng", "Tím", "Lam", "Lục"];
const SUPABASE_URL = "https://tewaxvsxbktcexduvfjv.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRld2F4dnN4Ymt0Y2V4ZHV2Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTIxMjksImV4cCI6MjA5MTcyODEyOX0.0VpLpXpR_gGk7p5RiCEL0bK4_EnhAUoqhLpieTL-4zI";
const ADMIN_EMAILS = ["lehuuhung133132@gmail.com", "tranduytunghp160992@gmail.com"];
const SUPER_ADMIN_EMAILS = ["lehuuhung133132@gmail.com"];
const MANAGER_EMAILS = ["tranduytunghp160992@gmail.com"];
const FLOWER_ICON_BUCKET = "flower-icons";
const SUPABASE_STORAGE_KEY_PREFIX = "sb-";
const ACCOUNT_PROFILE_STORAGE_KEY = "selina-account-profile";
const DEFAULT_SPIRIT_HUNT_SLOTS = [
  { slotKey: "slot_1", title: "Khung giờ 1", timeLabel: "12:00 - 13:00", memberIds: [] },
  { slotKey: "slot_2", title: "Khung giờ 2", timeLabel: "20:00 - 21:00", memberIds: [] },
];
const DEFAULT_PRIORITY_RACE_FORM = { memberId: "none", flowerIds: [] };
const DEFAULT_ART_VASE_FORM = {
  name: "",
  iconUrl: "",
  vaseGroup: "Lục",
  mainFlowerIds: [],
  secondaryFlowerIds: [],
  accentFlowerIds: [],
};
const GARDEN_PACKAGE_SLOT_LABELS = [
  { key: "slot1", label: "Ô 1" },
  { key: "slot2", label: "Ô 2" },
  { key: "slot3", label: "Ô 3" },
  { key: "fullPage", label: "Bonus" },
];
function createDefaultGardenPackagePages() {
  return Array.from({ length: 15 }, (_, index) => ({
    pageNumber: index + 1,
    slot1: [],
    slot2: [],
    slot3: [],
    fullPage: [],
  }));
}
function normalizeGardenPackagePages(rawPages) {
  const fallback = createDefaultGardenPackagePages();
  if (!Array.isArray(rawPages) || rawPages.length === 0) return fallback;
  return fallback.map((page) => {
    const matched = rawPages.find((item) => Number(item?.pageNumber || item?.page_number) === page.pageNumber) || {};
    return {
      pageNumber: page.pageNumber,
      slot1: Array.isArray(matched.slot1) ? matched.slot1.map(String) : [],
      slot2: Array.isArray(matched.slot2) ? matched.slot2.map(String) : [],
      slot3: Array.isArray(matched.slot3) ? matched.slot3.map(String) : [],
      fullPage: Array.isArray(matched.fullPage) ? matched.fullPage.map(String) : [],
    };
  });
}
function prioritizeGardenPackageRowsBySamePage(rows) {
  const pageCountMap = new Map();
  rows.forEach((row) => {
    const key = Number(row.pageNumber) || 0;
    pageCountMap.set(key, (pageCountMap.get(key) || 0) + 1);
  });
  return [...rows].sort((a, b) => {
    const samePageA = pageCountMap.get(Number(a.pageNumber) || 0) || 0;
    const samePageB = pageCountMap.get(Number(b.pageNumber) || 0) || 0;
    if (samePageA !== samePageB) return samePageB - samePageA;
    if (a.ownerCount !== b.ownerCount) return a.ownerCount - b.ownerCount;
    const byPage = a.pageNumber - b.pageNumber;
    if (byPage !== 0) return byPage;
    return a.flower.name.localeCompare(b.flower.name, "vi");
  });
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const GROUP_STYLES = {
  Lục: "!border-green-400 !bg-green-500 !text-white",
  Lam: "!border-blue-400 !bg-blue-500 !text-white",
  Tím: "!border-violet-400 !bg-violet-500 !text-white",
  Vàng: "!border-amber-400 !bg-amber-500 !text-white",
  Đỏ: "!border-red-400 !bg-red-500 !text-white",
  "Đỏ 30": "!border-rose-500 !bg-rose-700 !text-white",
};

const TITLE_STYLES = {
  "hội trưởng": "!border-red-400 !bg-red-500 !text-white",
  "hội phó": "!border-orange-400 !bg-orange-500 !text-white",
  "quản lý": "!border-violet-400 !bg-violet-500 !text-white",
  "tinh anh": "!border-blue-400 !bg-blue-500 !text-white",
  "thành viên": "!border-green-400 !bg-green-500 !text-white",
  "ngọn cỏ ven đường": "!border-slate-400 !bg-slate-500 !text-white",
};

const VAR_OWNER_BADGE_CLASS = "inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[12px] font-semibold text-red-700";
const MEMBER_STAT_IMAGE = "";

function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

function Card({ children, className = "" }) {
  return <div className={cn("rounded-[22px] border border-white/70 bg-white/85 shadow-[0_16px_45px_-24px_rgba(15,23,42,0.32)]", className)}>{children}</div>;
}
function CardHeader({ children, className = "" }) {
  return <div className={cn("p-5 pb-3", className)}>{children}</div>;
}
function CardContent({ children, className = "" }) {
  return <div className={cn("p-5 pt-0", className)}>{children}</div>;
}
function CardTitle({ children, className = "" }) {
  return <h2 className={cn("text-lg font-semibold text-slate-950", className)}>{children}</h2>;
}
function Button({ children, className = "", variant = "default", size = "default", type = "button", ...props }) {
  const variants = {
    default: "bg-slate-900 text-white hover:bg-slate-800 border-transparent",
    outline: "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    secondary: "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200",
  };
  const sizes = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 px-3 text-xs",
  };
  return <button type={type} className={cn("inline-flex items-center justify-center rounded-xl border font-medium transition disabled:cursor-not-allowed disabled:opacity-60", variants[variant], sizes[size], className)} {...props}>{children}</button>;
}
function Input({ className = "", autoFocus = false, ...props }) {
  return <input data-auto-focus={autoFocus ? "true" : undefined} className={cn("w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400", className)} {...props} />;
}
function Label({ children, className = "", ...props }) {
  return <label className={cn("text-sm font-medium text-slate-700", className)} {...props}>{children}</label>;
}
function Badge({ children, className = "", variant = "outline" }) {
  const styles = variant === "secondary" ? "border-slate-200 bg-slate-100 text-slate-700" : "border-slate-200 bg-white text-slate-700";
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", styles, className)}>{children}</span>;
}
function Checkbox({ checked, onCheckedChange, disabled }) {
  return <input type="checkbox" checked={!!checked} disabled={disabled} onChange={() => onCheckedChange?.(!checked)} className="mt-1 h-4 w-4 rounded border-slate-300" />;
}
function ScrollArea({ children, className = "" }) {
  return <div className={cn("overflow-auto", className)}>{children}</div>;
}
function Dialog({ open, onOpenChange, children }) {
  const items = React.Children.toArray(children);
  const trigger = items.find((child) => React.isValidElement(child) && child.type === DialogTrigger);
  const content = items.find((child) => React.isValidElement(child) && child.type === DialogContent);
  return (
    <>
      {trigger ? React.cloneElement(trigger, { onOpenChange }) : null}
      {open ? React.cloneElement(content, { onOpenChange }) : null}
    </>
  );
}
function DialogTrigger({ asChild, children, onOpenChange }) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (...args) => {
        children.props?.onClick?.(...args);
        onOpenChange?.(true);
      },
    });
  }
  return <button type="button" onClick={() => onOpenChange?.(true)}>{children}</button>;
}
function DialogContent({ children, className = "", onOpenChange }) {
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const timer = window.setTimeout(() => {
      const root = contentRef.current;
      if (!root) return;
      const autoTarget = root.querySelector("[data-auto-focus='true']");
      const firstInput = root.querySelector("input:not([type='hidden']):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])");
      const target = autoTarget || firstInput;
      if (target && typeof target.focus === "function") {
        target.focus();
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
          try {
            const length = target.value?.length || 0;
            target.setSelectionRange?.(length, length);
          } catch {}
        }
      }
    }, 30);
    return () => window.clearTimeout(timer);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onOpenChange?.(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mounted, onOpenChange]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }} onMouseDown={(event) => { if (event.target === event.currentTarget) onOpenChange?.(false); }}>
      <div className={cn("relative max-h-[90vh] w-full max-w-xl overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-[0_32px_100px_-36px_rgba(15,23,42,0.55)]", className)}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),transparent_60%),radial-gradient(circle_at_right,_rgba(168,85,247,0.10),transparent_55%)]" />
        <button
          type="button"
          onClick={() => onOpenChange?.(false)}
          className="absolute right-5 top-5 z-10 inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          Đóng
        </button>
        <div ref={contentRef} className="max-h-[90vh] overflow-auto px-5 pb-5 pt-14 sm:px-6 sm:pb-6 sm:pt-16">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
function DialogHeader({ children, className = "" }) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}
function DialogTitle({ children, className = "" }) {
  return <h3 className={cn("text-lg font-semibold", className)}>{children}</h3>;
}
function Select({ value, onValueChange, children }) {
  const options = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === SelectContent) {
      React.Children.forEach(child.props.children, (item) => {
        if (React.isValidElement(item) && item.type === SelectItem) {
          options.push({ value: item.props.value, label: item.props.children });
        }
      });
    }
  });
  return (
    <select className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm" value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {options.map((option) => <option key={option.value} value={option.value}>{typeof option.label === "string" ? option.label : String(option.value)}</option>)}
    </select>
  );
}
function SelectTrigger() { return null; }
function SelectValue() { return null; }
function SelectContent({ children }) { return <>{children}</>; }
function SelectItem() { return null; }
const TabsContext = React.createContext(null);
function TabsProvider({ value, onValueChange, children, className = "" }) {
  return <TabsContext.Provider value={{ value, onValueChange }}><div className={className}>{children}</div></TabsContext.Provider>;
}
function TabsContent({ value, children }) {
  const parent = React.useContext(TabsContext);
  if (!parent || parent.value !== value) return null;
  return <div>{children}</div>;
}

function SearchIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function PlusIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}
function UsersIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function Flower2Icon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 7c0-2.5 1.5-4 3-4s3 1.5 3 4-1.5 4-3 4-3-1.5-3-4Z" />
      <path d="M12 7c0-2.5-1.5-4-3-4S6 4.5 6 7s1.5 4 3 4 3-1.5 3-4Z" />
      <path d="M7 14c-2.5 0-4-1.5-4-3s1.5-3 4-3 4 1.5 4 3-1.5 3-4 3Z" />
      <path d="M17 14c2.5 0 4-1.5 4-3s-1.5-3-4-3-4 1.5-4 3 1.5 3 4 3Z" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 14v7" />
      <path d="M9 21h6" />
    </svg>
  );
}
function DatabaseIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <ellipse cx="12" cy="5" rx="7" ry="3" />
      <path d="M5 5v6c0 1.66 3.13 3 7 3s7-1.34 7-3V5" />
      <path d="M5 11v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
    </svg>
  );
}
function AlertCircleIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}
function TrophyIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 5h3v2a4 4 0 0 1-4 4h-1" />
      <path d="M7 5H4v2a4 4 0 0 0 4 4h1" />
    </svg>
  );
}
function ShieldIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  );
}

function groupBadgeClass(group) {
  return GROUP_STYLES[group] || "border-slate-200 bg-slate-50 text-slate-700";
}
function priorityRaceGroupRank(group) {
  switch (group) {
    case "Đỏ 30": return 6;
    case "Đỏ": return 5;
    case "Vàng": return 4;
    case "Tím": return 3;
    case "Lam": return 2;
    case "Lục": return 1;
    default: return 0;
  }
}
function priorityRaceRankToGroup(rank) {
  switch (rank) {
    case 6: return "Đỏ 30";
    case 5: return "Đỏ";
    case 4: return "Vàng";
    case 3: return "Tím";
    case 2: return "Lam";
    case 1: return "Lục";
    default: return "";
  }
}
function titleBadgeClass(titleName) {
  return TITLE_STYLES[String(titleName || "").trim().toLowerCase()] || "border-slate-200 bg-slate-50 text-slate-700";
}
function hasTitleName(title) {
  return Boolean(String(title?.name || "").trim());
}
function normalizeFlowerLookupText(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();
}
function normalizeMemberGender(value) {
  const x = String(value || "").trim().toLowerCase();
  if (!x) return "";
  if (["nam", "male", "m"].includes(x)) return "Nam";
  if (["nữ", "nu", "female", "f"].includes(x)) return "Nữ";
  return "Khác";
}
function getMemberAge(member) {
  const year = Number(member?.birthYear);
  if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear()) return null;
  return new Date().getFullYear() - year;
}
function formatMemberMeta(member) {
  const parts = [];
  const age = getMemberAge(member);
  const gender = normalizeMemberGender(member?.gender);
  if (age !== null) parts.push(`${age} tuổi`);
  if (gender) parts.push(gender);
  return parts.join(" • ");
}
function isFormerMember(member) { return Boolean(member?.leftGuild); }
function shouldShowFormerMemberInLookup(member) { return !isFormerMember(member) || Boolean(member?.showInLookup); }
function extractFlowerNamesFromHistoryDetails(details) {
  const text = String(details || "").trim();
  if (!text) return [];
  const idx = text.indexOf(":");
  const part = idx >= 0 ? text.slice(idx + 1) : text;
  return part.split(",").map((x) => x.trim()).filter(Boolean);
}
function normalizeOwnershipRow(row) { return { id: String(row.id), memberId: String(row.member_id), flowerId: String(row.flower_id) }; }
function isInvalidRefreshTokenError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return message.includes("invalid refresh token") || message.includes("refresh token not found");
}
function isAuthLockError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return message.includes("lock broken") || message.includes("aborterror") || message.includes("steal option");
}
function clearSupabaseAuthStorage() {
  if (typeof window === "undefined") return;
  try {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(SUPABASE_STORAGE_KEY_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {}
}
function saveAccountProfileToStorage(profile) {
  if (typeof window === "undefined") return;
  try {
    if (!profile) {
      window.localStorage.removeItem(ACCOUNT_PROFILE_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(ACCOUNT_PROFILE_STORAGE_KEY, JSON.stringify({
      id: String(profile.id || ""),
      email: String(profile.email || "").toLowerCase(),
      nickname: String(profile.nickname || ""),
      role: String(profile.role || "member_editor"),
      memberIds: Array.isArray(profile.memberIds) ? profile.memberIds.map(String) : [],
    }));
  } catch {}
}
function loadAccountProfileFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACCOUNT_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      id: String(parsed.id || ""),
      email: String(parsed.email || "").toLowerCase(),
      nickname: String(parsed.nickname || ""),
      role: String(parsed.role || "member_editor"),
      memberIds: Array.isArray(parsed.memberIds) ? parsed.memberIds.map(String) : [],
    };
  } catch {
    return null;
  }
}
async function getSafeCurrentUser() {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      if (isInvalidRefreshTokenError(sessionError)) {
        clearSupabaseAuthStorage();
        try { await supabase.auth.signOut({ scope: "local" }); } catch {}
        return { user: null, message: "Phiên đăng nhập cũ đã hết hạn và đã được làm sạch.", shouldRetry: false };
      }
      if (isAuthLockError(sessionError)) return { user: null, message: "Trình duyệt đang đồng bộ phiên đăng nhập.", shouldRetry: true };
      return { user: null, message: `Không đọc được phiên đăng nhập: ${sessionError.message}`, shouldRetry: false };
    }

    const sessionUser = sessionData?.session?.user || null;
    if (!sessionUser) return { user: null, message: "", shouldRetry: false };

    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (isInvalidRefreshTokenError(error)) {
        clearSupabaseAuthStorage();
        try { await supabase.auth.signOut({ scope: "local" }); } catch {}
        return { user: null, message: "Phiên đăng nhập cũ đã hết hạn và đã được làm sạch.", shouldRetry: false };
      }
      if (isAuthLockError(error)) return { user: sessionUser, message: "Trình duyệt đang đồng bộ phiên đăng nhập.", shouldRetry: true };
      return { user: sessionUser, message: `Không xác minh được phiên đăng nhập: ${error.message}`, shouldRetry: false };
    }

    return { user: data.user || sessionUser || null, message: "", shouldRetry: false };
  } catch (error) {
    if (isAuthLockError(error)) return { user: null, message: "Trình duyệt đang đồng bộ phiên đăng nhập.", shouldRetry: true };
    return { user: null, message: `Không khởi tạo được xác thực: ${error?.message || "Lỗi không xác định"}`, shouldRetry: false };
  }
}
async function fetchAllOwnershipRows() {
  const pageSize = 1000;
  let from = 0;
  let allRows = [];
  while (true) {
    const { data, error } = await supabasePublic.from("member_flowers").select("id, member_id, flower_id").order("id", { ascending: true }).range(from, from + pageSize - 1);
    if (error) return { data: null, error };
    const rows = data || [];
    allRows = [...allRows, ...rows];
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return { data: allRows, error: null };
}
function shouldLoadTitlesForTab(tab, isAdmin) {
  return isAdmin || tab === "dashboard" || tab === "members" || tab === "history" || tab === "titlemanagement" || tab === "spirithunt";
}
function shouldLoadHistoryForTab(tab) { return tab === "history"; }
function shouldLoadSpiritHuntForTab(tab) { return tab === "spirithunt"; }
function shouldLoadPriorityRaceForTab(tab) { return tab === "spirithunt"; }

function PlaceholderFlowerIcon({ size = "md" }) {
  return <span className={size === "sm" ? "text-sm" : "text-base"}>✿</span>;
}
function FlowerThumbnail({ flower, size = "md" }) {
  const sizeClass = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  if (flower?.iconUrl) return <div className={cn("overflow-hidden rounded-2xl border bg-white", sizeClass)}><img src={flower.iconUrl} alt={flower.name} className="h-full w-full object-cover" loading="lazy" decoding="async" /></div>;
  return <div className={cn("flex items-center justify-center rounded-2xl border bg-slate-50 text-slate-500", sizeClass)}><PlaceholderFlowerIcon size={size} /></div>;
}
function CircleProgress({ percent = 0, strokeColor = "#0f172a", glowClass = "bg-slate-100" }) {
  const radius = 26;
  const stroke = 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative h-14 w-14 sm:h-16 sm:w-16">
      <div className={cn("absolute inset-0 rounded-full blur-md", glowClass)} />
      <svg viewBox={`0 0 ${radius * 2} ${radius * 2}`} className="relative h-full w-full -rotate-90">
        <circle stroke="#e5e7eb" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
        <circle stroke={strokeColor} fill="transparent" strokeWidth={stroke} strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={offset} strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">{percent}%</div>
    </div>
  );
}
function groupProgressCircleStyle(group) {
  switch (group) {
    case "Đỏ 30": return { strokeColor: "#be123c", glowClass: "bg-rose-100" };
    case "Đỏ": return { strokeColor: "#ef4444", glowClass: "bg-red-100" };
    case "Vàng": return { strokeColor: "#f59e0b", glowClass: "bg-amber-100" };
    case "Tím": return { strokeColor: "#8b5cf6", glowClass: "bg-violet-100" };
    case "Lam": return { strokeColor: "#3b82f6", glowClass: "bg-blue-100" };
    default: return { strokeColor: "#22c55e", glowClass: "bg-green-100" };
  }
}
function memberProgressCircleStyle(percent) {
  if (percent <= 0) return { strokeColor: "#d1d5db", glowClass: "bg-slate-100" };
  if (percent >= 100) return groupProgressCircleStyle("Đỏ");
  if (percent >= 75) return groupProgressCircleStyle("Vàng");
  if (percent >= 50) return groupProgressCircleStyle("Tím");
  if (percent >= 25) return groupProgressCircleStyle("Lam");
  return groupProgressCircleStyle("Lục");
}
function SectionEmpty({ children }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">{children}</div>;
}
function StatCard({ icon, title, value }) {
  return (
    <Card className="h-full">
      <CardContent className="flex min-h-[98px] items-center justify-center px-6 py-5">
        <div className="mx-auto flex items-center justify-center gap-4 text-center">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
            {icon}
          </div>
          <div className="flex min-w-0 flex-col items-center justify-center text-center">
            <p className="text-sm leading-none text-slate-500">{title}</p>
            <p className="mt-2 text-[18px] font-bold leading-none text-slate-950">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EditMemberForm({ member, onSave }) {
  const [name, setName] = useState(member.name || "");
  const [birthYear, setBirthYear] = useState(member.birthYear ? String(member.birthYear) : "");
  const [gender, setGender] = useState(member.gender || "");
  const [leftGuild, setLeftGuild] = useState(Boolean(member.leftGuild));
  const [showInLookup, setShowInLookup] = useState(Boolean(member.showInLookup));
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  return <div className="space-y-4"><div className="space-y-2"><Label>Tên thành viên</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Năm sinh</Label><Input value={birthYear} onChange={(e) => setBirthYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} /></div><div className="space-y-2"><Label>Giới tính</Label><Select value={gender || "unknown"} onValueChange={(value) => setGender(value === "unknown" ? "" : value)}><SelectContent><SelectItem value="unknown">Chưa chọn</SelectItem><SelectItem value="Nam">Nam</SelectItem><SelectItem value="Nữ">Nữ</SelectItem><SelectItem value="Khác">Khác</SelectItem></SelectContent></Select></div></div><div className="space-y-2"><Label>Trạng thái hội</Label><Select value={leftGuild ? "former" : "active"} onValueChange={(value) => setLeftGuild(value === "former")}><SelectContent><SelectItem value="active">Đang trong hội</SelectItem><SelectItem value="former">Đã rời hội</SelectItem></SelectContent></Select></div>{leftGuild ? <div className="space-y-2"><Label>Danh sách hoa trong mục tra cứu</Label><Select value={showInLookup ? "on" : "off"} onValueChange={(value) => setShowInLookup(value === "on")}><SelectContent><SelectItem value="on">Bật</SelectItem><SelectItem value="off">Tắt</SelectItem></SelectContent></Select><p className="text-xs text-slate-500">Bật: vẫn tìm được trong mục tra cứu nhưng không tính vào tiến độ hội. Tắt: ẩn khỏi các mục tra cứu.</p></div> : null}<Button className="w-full" disabled={saving} onClick={async () => { setSaving(true); const result = await onSave({ name, birthYear: birthYear ? Number(birthYear) : null, gender, leftGuild, showInLookup }); setSaving(false); setMessage(result.message); }}>{saving ? "Đang lưu..." : "Lưu thông tin thành viên"}</Button>{message ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{message}</div> : null}</div>;
}

function EditFlowerForm({ flower, onSave, onUploadIcon, uploadingIcon = false }) {
  const [name, setName] = useState(flower.name || "");
  const [group, setGroup] = useState(flower.group || "Lục");
  const [iconUrl, setIconUrl] = useState(flower.iconUrl || "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(flower.name || "");
    setGroup(flower.group || "Lục");
    setIconUrl(flower.iconUrl || "");
    setMessage("");
    setSaving(false);
  }, [flower]);

  return <div className="space-y-4"><div className="space-y-2"><Label>Tên hoa</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div><div className="space-y-2"><Label>Nhóm hoa</Label><Select value={group} onValueChange={setGroup}><SelectContent>{FLOWER_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Icon URL</Label><Input value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} /></div><div className="space-y-2"><Label>Tải icon lên</Label><div className="flex items-center gap-3">{iconUrl ? <div className="h-14 w-14 overflow-hidden rounded-2xl border bg-slate-50"><img src={iconUrl} alt={name || flower.name || "Icon hoa"} className="h-full w-full object-cover" /></div> : <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-slate-50 text-slate-400"><PlaceholderFlowerIcon size="sm" /></div>}<label className="block flex-1"><input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (!file || !onUploadIcon) return; const result = await onUploadIcon(file); if (result?.url) { setIconUrl(result.url); setMessage(result.message || "Đã tải icon lên thành công."); } else if (result?.message) { setMessage(result.message); } e.target.value = ""; }} /><span className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">{uploadingIcon ? "Đang tải icon..." : "Tải icon lên"}</span></label></div></div><Button className="w-full" disabled={saving} onClick={async () => { setSaving(true); const result = await onSave({ name, group, iconUrl }); setSaving(false); setMessage(result.message); }}>{saving ? "Đang lưu..." : "Lưu thông tin hoa"}</Button>{message ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{message}</div> : null}</div>;
}

function MemberFlowersCheckDialogContent({ member, flowersByGroup }) {
  const [searchText, setSearchText] = useState("");
  const normalizedSearch = normalizeFlowerLookupText(searchText);
  const filteredFlowersByGroup = useMemo(() => {
    const next = { "Đỏ 30": [], Đỏ: [], Vàng: [], Tím: [], Lam: [], Lục: [] };
    MEMBER_FLOWER_GROUP_ORDER.forEach((group) => {
      next[group] = (flowersByGroup[group] || []).filter((flower) => !normalizedSearch || normalizeFlowerLookupText(flower.name).includes(normalizedSearch));
    });
    return next;
  }, [flowersByGroup, normalizedSearch]);
  const totalFiltered = useMemo(() => Object.values(filteredFlowersByGroup).reduce((sum, list) => sum + list.length, 0), [filteredFlowersByGroup]);
  return <div className="space-y-3"><div className="flex items-center justify-between gap-3"><div><p className="text-[15px] font-semibold text-slate-900">{member.name}</p><p className="text-[11px] text-slate-500">Toàn bộ hoa đang sở hữu</p></div><Badge variant="secondary" className="text-[11px]">{totalFiltered} hoa</Badge></div><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Gõ để tìm nhanh 1 loại hoa..." className="pl-9" /></div><div className="grid grid-cols-1 gap-3 md:grid-cols-5">{MEMBER_FLOWER_GROUP_ORDER.map((group) => <div key={group} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-2.5"><div className="mb-2 flex items-center justify-between gap-2"><Badge className={`${groupBadgeClass(group)} text-[10px]`}>{group}</Badge><span className="text-[10px] font-semibold text-slate-500">{filteredFlowersByGroup[group]?.length || 0}</span></div><div className="max-h-[325px] space-y-1.5 overflow-y-auto pr-1">{(filteredFlowersByGroup[group] || []).length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 bg-white px-2.5 py-2 text-[10px] text-slate-400">Không có kết quả</div> : filteredFlowersByGroup[group].map((flower) => <div key={`${member.id}-${group}-${flower.id}`} className="flex items-center gap-2 rounded-xl border bg-white px-2.5 py-2"><FlowerThumbnail flower={flower} size="sm" /><span className="block break-words text-[10px] font-medium text-slate-700">{flower.name}</span></div>)}</div></div>)}</div></div>;
}

function runLocalSelfChecks() {
  console.assert(normalizeFlowerLookupText("Đóa") === "doa", "normalize should strip accents");
  console.assert(priorityRaceGroupRank("Đỏ") === 5, "Đỏ should rank highest");
  console.assert(priorityRaceRankToGroup(2) === "Lam", "rank 2 should map Lam");
  console.assert(formatMemberMeta({ birthYear: new Date().getFullYear() - 20, gender: "Nam" }).includes("Nam"), "formatMemberMeta should include gender");
  console.assert(Array.isArray(extractFlowerNamesFromHistoryDetails("Thêm: A, B")), "history parser should return array");
}

export default function HoaHoiGameCanvasApp() {
  const [flowers, setFlowers] = useState([]);
  const [members, setMembers] = useState([]);
  const [ownerships, setOwnerships] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [titles, setTitles] = useState([]);
  const [memberTitles, setMemberTitles] = useState([]);
  const [spiritHuntSlots, setSpiritHuntSlots] = useState(DEFAULT_SPIRIT_HUNT_SLOTS);
  const [priorityRaceEntries, setPriorityRaceEntries] = useState([]);
  const [priorityRaceForm, setPriorityRaceForm] = useState(DEFAULT_PRIORITY_RACE_FORM);
  const [loading, setLoading] = useState(true);
  const [pageMessage, setPageMessage] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [titlesLoaded, setTitlesLoaded] = useState(false);
  const [spiritHuntLoaded, setSpiritHuntLoaded] = useState(false);
  const [priorityRaceLoaded, setPriorityRaceLoaded] = useState(false);
  const [titleFeatureAvailable, setTitleFeatureAvailable] = useState(true);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberSortField, setMemberSortField] = useState("flowers");
  const [memberSortDirection, setMemberSortDirection] = useState("desc");
  const [flowerSearch, setFlowerSearch] = useState("");
  const [memberFlowerLookup, setMemberFlowerLookup] = useState("all");
  const [memberFlowerLookupSearch, setMemberFlowerLookupSearch] = useState("");
  const [memberFlowerLookupPickerOpen, setMemberFlowerLookupPickerOpen] = useState(false);
  const [dashboardMissingGroupFilter, setDashboardMissingGroupFilter] = useState("all");
  const [dashboardRareGroupFilter, setDashboardRareGroupFilter] = useState("all");
  const [selectedExistingMemberId, setSelectedExistingMemberId] = useState("none");
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [memberPickerSearch, setMemberPickerSearch] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [selectedFlowerIds, setSelectedFlowerIds] = useState([]);
  const [selectedRemovalFlowerIds, setSelectedRemovalFlowerIds] = useState([]);
  const [removalFlowerSearch, setRemovalFlowerSearch] = useState("");
  const [updateSearch, setUpdateSearch] = useState("");
  const [updateGroupFilter, setUpdateGroupFilter] = useState("all");
  const [updateMessage, setUpdateMessage] = useState("");
  const [savingOwnership, setSavingOwnership] = useState(false);
  const [newFlowerName, setNewFlowerName] = useState("");
  const [flowerManageSearch, setFlowerManageSearch] = useState("");
  const [flowerManageGroupFilter, setFlowerManageGroupFilter] = useState("all");
  const [newFlowerIconUrl, setNewFlowerIconUrl] = useState("");
  const [newFlowerGroup, setNewFlowerGroup] = useState("Lục");
  const [flowerCreateMessage, setFlowerCreateMessage] = useState("");
  const [savingFlower, setSavingFlower] = useState(false);
  const [user, setUser] = useState(null);
  const [loginNickname, setLoginNickname] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [newTitleName, setNewTitleName] = useState("");
  const [titleMessage, setTitleMessage] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const [selectedTitleId, setSelectedTitleId] = useState("none");
  const [selectedTitleMemberIds, setSelectedTitleMemberIds] = useState([]);
  const [titleManageSearch, setTitleManageSearch] = useState("");
  const [titleMemberSearch, setTitleMemberSearch] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [spiritHuntMessage, setSpiritHuntMessage] = useState("");
  const [savingSpiritHunt, setSavingSpiritHunt] = useState(false);
  const [spiritHuntMemberSearch, setSpiritHuntMemberSearch] = useState({ slot_1: "", slot_2: "" });
  const [priorityRaceMessage, setPriorityRaceMessage] = useState("");
  const [savingPriorityRace, setSavingPriorityRace] = useState(false);
  const [priorityRaceFlowerSearch, setPriorityRaceFlowerSearch] = useState("");
  const [priorityRaceGroupFilter, setPriorityRaceGroupFilter] = useState("all");
  const [priorityRaceSelectedFlowerSearch, setPriorityRaceSelectedFlowerSearch] = useState("");
  const [priorityRaceListSearch, setPriorityRaceListSearch] = useState("");
  const [priorityRaceMemberPickerOpen, setPriorityRaceMemberPickerOpen] = useState(false);
  const [priorityRaceMemberSearch, setPriorityRaceMemberSearch] = useState("");
  const [oneQuestMemberIds, setOneQuestMemberIds] = useState([]);
  const [completedMemberIds, setCompletedMemberIds] = useState([]);
  const [twoGroupMemberIds, setTwoGroupMemberIds] = useState([]);
  const [oneQuestMemberSearch, setOneQuestMemberSearch] = useState("");
  const [completedMemberSearch, setCompletedMemberSearch] = useState("");
  const [twoGroupMemberSearch, setTwoGroupMemberSearch] = useState("");
  const [artVases, setArtVases] = useState([]);
  const [artVasesLoaded, setArtVasesLoaded] = useState(false);
  const [artVaseMessage, setArtVaseMessage] = useState("");
  const [savingArtVase, setSavingArtVase] = useState(false);
  const [selectedArtVaseId, setSelectedArtVaseId] = useState("new");
  const [artVaseForm, setArtVaseForm] = useState(DEFAULT_ART_VASE_FORM);
  const [artFlowerSearchByType, setArtFlowerSearchByType] = useState({ mainFlowerIds: "", secondaryFlowerIds: "", accentFlowerIds: "" });
  const [artLookupMemberPickerOpen, setArtLookupMemberPickerOpen] = useState(false);
  const [artLookupMemberSearch, setArtLookupMemberSearch] = useState("");
  const [artLookupMemberId, setArtLookupMemberId] = useState("guild");
  const [artLookupSuggestionSearch, setArtLookupSuggestionSearch] = useState("");
  const [artSelectedSuggestionFlowerIds, setArtSelectedSuggestionFlowerIds] = useState([]);
  const [artLookupSearchResults, setArtLookupSearchResults] = useState([]);
  const [artVarSuggestions, setArtVarSuggestions] = useState([]);
  const [artPriorityVarSearch, setArtPriorityVarSearch] = useState("");
  const [artPriorityVarOwners, setArtPriorityVarOwners] = useState([]);
  const [artDashboardGroupFilter, setArtDashboardGroupFilter] = useState("all");
  const [artRareFlowerGroupFilter, setArtRareFlowerGroupFilter] = useState("all");
  const [uploadingArtVaseIcon, setUploadingArtVaseIcon] = useState(false);
  const [accountIdentities, setAccountIdentities] = useState([]);
  const [accountMemberPermissions, setAccountMemberPermissions] = useState([]);
  const [accountPermissionsLoaded, setAccountPermissionsLoaded] = useState(false);
  const [accountPermissionMessage, setAccountPermissionMessage] = useState("");
  const [permissionEmailInput, setPermissionEmailInput] = useState("");
  const [permissionNicknameInput, setPermissionNicknameInput] = useState("");
  const [permissionRoleInput, setPermissionRoleInput] = useState("member_editor");
  const [permissionMemberIds, setPermissionMemberIds] = useState([]);
  const [permissionMemberSearch, setPermissionMemberSearch] = useState("");
  const [savingAccountPermission, setSavingAccountPermission] = useState(false);
  const [currentAccountProfile, setCurrentAccountProfile] = useState(null);
  const [memberCheckDialogOpenId, setMemberCheckDialogOpenId] = useState(null);
  const [memberEditDialogOpenId, setMemberEditDialogOpenId] = useState(null);
  const [createMemberDialogOpen, setCreateMemberDialogOpen] = useState(false);
  const [createMemberName, setCreateMemberName] = useState("");
  const [createMemberBirthYear, setCreateMemberBirthYear] = useState("");
  const [createMemberGender, setCreateMemberGender] = useState("");
  const [createMemberMessage, setCreateMemberMessage] = useState("");
  const [savingNewMember, setSavingNewMember] = useState(false);
  const [flowerEditDialogOpenId, setFlowerEditDialogOpenId] = useState(null);
  const [statCardAssets, setStatCardAssets] = useState([]);
  const [statCardAssetsLoaded, setStatCardAssetsLoaded] = useState(false);
  const [statCardAssetMessage, setStatCardAssetMessage] = useState("");
  const [uploadingStatCardKey, setUploadingStatCardKey] = useState("");
  const [uploadingFlowerIconId, setUploadingFlowerIconId] = useState("");
  const [localStatCardAssetMap, setLocalStatCardAssetMap] = useState({});
  const [editingAccountEmail, setEditingAccountEmail] = useState("");
  const [gardenPackagePages, setGardenPackagePages] = useState(createDefaultGardenPackagePages());
  const [gardenPackageLoaded, setGardenPackageLoaded] = useState(false);
  const [gardenPackageMessage, setGardenPackageMessage] = useState("");
  const [savingGardenPackage, setSavingGardenPackage] = useState(false);
  const [gardenPackageAdminPage, setGardenPackageAdminPage] = useState("1");
  const [gardenPackageFlowerSearch, setGardenPackageFlowerSearch] = useState("");
  const [gardenPackageMemberPickerOpen, setGardenPackageMemberPickerOpen] = useState(false);
  const [gardenPackageMemberSearch, setGardenPackageMemberSearch] = useState("");
  const [gardenPackageSuggestionMemberId, setGardenPackageSuggestionMemberId] = useState("none");
  const [gardenPackagePurchasePurpose, setGardenPackagePurchasePurpose] = useState("single");
  const [siteHeaderTitle, setSiteHeaderTitle] = useState("Quản Lý Hoa Hội SELINA");
  const [siteHeaderTitleInput, setSiteHeaderTitleInput] = useState("Quản Lý Hoa Hội SELINA");
  const [siteSettingsMessage, setSiteSettingsMessage] = useState("");

  const activeTabRef = useRef("dashboard");
  const isAdminRef = useRef(false);
  const realtimeRefreshTimerRef = useRef(null);
  const syncBroadcastChannelRef = useRef(null);
  const supabaseSyncChannelRef = useRef(null);

  const userEmail = useMemo(() => user?.email?.toLowerCase() || "", [user]);
  const accountRole = useMemo(() => {
    if (!user) return "guest";
    if (ADMIN_EMAILS.map((x) => x.toLowerCase()).includes(userEmail) || currentAccountProfile?.role === "admin") return "admin";
    if (MANAGER_EMAILS.map((x) => x.toLowerCase()).includes(userEmail) || currentAccountProfile?.role === "manager") return "manager";
    if (currentAccountProfile?.role === "member_editor" && Array.isArray(currentAccountProfile?.memberIds) && currentAccountProfile.memberIds.length > 0) return "member_editor";
    return "guest";
  }, [user, userEmail, currentAccountProfile]);
  const isAdmin = accountRole === "admin";
  const isSuperAdmin = useMemo(() => SUPER_ADMIN_EMAILS.map((x) => x.toLowerCase()).includes(userEmail), [userEmail]);
  const canAccessAdminPanel = isAdmin;
  const isManager = accountRole === "manager";
  const adminButtonLabel = useMemo(() => {
    if (isAdmin) return "Admin";
    if (isManager) return "Manager";
    if (user && currentAccountProfile?.nickname) return currentAccountProfile.nickname;
    if (user) return "Tài khoản";
    return "Đăng nhập";
  }, [isAdmin, isManager, user, currentAccountProfile]);
  const canManageArt = useMemo(() => isAdmin || isManager, [isAdmin, isManager]);
  const canManageMembers = useMemo(() => isAdmin || isManager, [isAdmin, isManager]);
  const canManageFlowers = useMemo(() => isAdmin || isManager, [isAdmin, isManager]);
  const canManageTitles = useMemo(() => isAdmin || isManager, [isAdmin, isManager]);
  const canManageSpiritHunt = useMemo(() => isAdmin || isManager, [isAdmin, isManager]);
  const canManagePriorityRace = useMemo(() => isAdmin || isManager, [isAdmin, isManager]);
  const isRestrictedEditor = accountRole === "member_editor";
  const canAccessOwnershipUpdate = isAdmin || isManager || isRestrictedEditor;
  const restrictedMemberIds = useMemo(() => Array.isArray(currentAccountProfile?.memberIds) ? currentAccountProfile.memberIds.map(String) : [], [currentAccountProfile]);

  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { isAdminRef.current = isAdmin; }, [isAdmin]);
  useEffect(() => { runLocalSelfChecks(); }, []);

  useEffect(() => {
    let active = true;
    let retryTimer;
    async function initAuth(attempt = 0) {
      const result = await getSafeCurrentUser();
      if (!active) return;
      setUser(result.user || null);
      if (result.user?.email) {
        const normalizedEmail = String(result.user.email).toLowerCase();
        if (!ADMIN_EMAILS.map((item) => item.toLowerCase()).includes(normalizedEmail)) {
          const cachedProfile = loadAccountProfileFromStorage();
          const profile = cachedProfile?.email === normalizedEmail ? cachedProfile : await getAccountAccessProfileForEmail(normalizedEmail);
          if (active) {
            setCurrentAccountProfile(profile);
            saveAccountProfileToStorage(profile);
          }
        } else {
          setCurrentAccountProfile(null);
          saveAccountProfileToStorage(null);
        }
      } else {
        setCurrentAccountProfile(null);
        saveAccountProfileToStorage(null);
      }
      if (result.message) setLoginMessage(result.message);
      if (result.shouldRetry && attempt < 3) retryTimer = window.setTimeout(() => initAuth(attempt + 1), 500 + attempt * 300);
    }
    initAuth();
    const sub = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      setUser(session?.user || null);
      if (session?.user?.email) {
        const normalizedEmail = String(session.user.email).toLowerCase();
        if (!ADMIN_EMAILS.map((item) => item.toLowerCase()).includes(normalizedEmail)) {
          const cachedProfile = loadAccountProfileFromStorage();
          const profile = cachedProfile?.email === normalizedEmail ? cachedProfile : await getAccountAccessProfileForEmail(normalizedEmail);
          if (active) {
            setCurrentAccountProfile(profile);
            saveAccountProfileToStorage(profile);
          }
        } else {
          setCurrentAccountProfile(null);
          saveAccountProfileToStorage(null);
        }
      } else {
        setCurrentAccountProfile(null);
        saveAccountProfileToStorage(null);
      }
      if (session?.user) setLoginMessage("");
    });
    return () => { active = false; if (retryTimer) window.clearTimeout(retryTimer); sub.data.subscription.unsubscribe(); };
  }, []);

  async function loadOwnershipData() {
    const result = await fetchAllOwnershipRows();
    if (result.error) throw new Error(result.error.message);
    const map = new Map();
    (result.data || []).forEach((row) => {
      const key = `${row.member_id}-${row.flower_id}`;
      if (!map.has(key)) map.set(key, row);
    });
    setOwnerships(Array.from(map.values()).map(normalizeOwnershipRow));
  }
  async function loadTitlesData() {
    const [titlesRes, memberTitlesRes] = await Promise.all([
      supabasePublic.from("titles").select("id, name").order("name", { ascending: true }),
      supabasePublic.from("member_titles").select("id, member_id, title_id"),
    ]);
    if (titlesRes.error || memberTitlesRes.error) {
      setTitleFeatureAvailable(false);
      setTitles([]);
      setMemberTitles([]);
      setTitlesLoaded(true);
      return;
    }
    setTitleFeatureAvailable(true);
    setTitles((titlesRes.data || []).map((t) => ({ id: String(t.id), name: t.name })));
    setMemberTitles((memberTitlesRes.data || []).map((row) => ({ id: String(row.id), memberId: String(row.member_id), titleId: String(row.title_id) })));
    setTitlesLoaded(true);
  }
  async function loadHistoryData() {
    const { data, error } = await supabasePublic.from("action_logs").select("id, action_type, actor_name, target_type, target_name, details, created_at").order("created_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message || "Không tải được lịch sử thao tác.");
    setHistoryLogs((data || []).map((log) => ({ id: String(log.id), actionType: log.action_type || "", actorName: log.actor_name || "Hệ thống", targetType: log.target_type || "", targetName: log.target_name || "", details: log.details || "", createdAt: log.created_at || "" })));
    setHistoryLoaded(true);
  }
  async function loadSpiritHuntData() {
    const { data, error } = await supabasePublic.from("spirit_hunt_slots").select("slot_key, title, time_label, member_ids").order("slot_key", { ascending: true });
    if (error) {
      setSpiritHuntSlots(DEFAULT_SPIRIT_HUNT_SLOTS);
      setSpiritHuntLoaded(true);
      return;
    }
    const slotMap = new Map(DEFAULT_SPIRIT_HUNT_SLOTS.map((slot) => [slot.slotKey, slot]));
    (data || []).forEach((row) => {
      slotMap.set(String(row.slot_key), {
        slotKey: String(row.slot_key),
        title: row.title || "",
        timeLabel: row.time_label || "",
        memberIds: Array.isArray(row.member_ids) ? row.member_ids.map(String) : [],
      });
    });
    setSpiritHuntSlots(DEFAULT_SPIRIT_HUNT_SLOTS.map((slot) => slotMap.get(slot.slotKey) || slot));
    setSpiritHuntLoaded(true);
  }
  async function loadPriorityRaceData() {
    const { data, error } = await supabasePublic.from("priority_race_config").select("entries").eq("config_key", "main").maybeSingle();
    if (error) {
      setPriorityRaceEntries([]);
      setOneQuestMemberIds([]);
      setCompletedMemberIds([]);
      setTwoGroupMemberIds([]);
      setPriorityRaceLoaded(true);
      return;
    }
    const rawEntries = Array.isArray(data?.entries) ? data.entries : [];
    const metaEntry = rawEntries.find((entry) => entry?.__metaType === "priority_race_meta") || null;
    const normalEntries = rawEntries.filter((entry) => entry?.__metaType !== "priority_race_meta");
    setPriorityRaceEntries(normalEntries.map((entry, index) => ({ id: String(entry?.id || `${entry?.member_id || "member"}-${index}`), memberId: String(entry?.member_id || "none"), flowerIds: Array.isArray(entry?.flower_ids) ? entry.flower_ids.map(String) : [] })));
    setOneQuestMemberIds(Array.isArray(metaEntry?.one_quest_member_ids) ? metaEntry.one_quest_member_ids.map(String) : []);
    setCompletedMemberIds(Array.isArray(metaEntry?.completed_member_ids) ? metaEntry.completed_member_ids.map(String) : []);
    setTwoGroupMemberIds(Array.isArray(metaEntry?.two_group_member_ids) ? metaEntry.two_group_member_ids.map(String) : []);
    setPriorityRaceLoaded(true);
  }
  async function persistPriorityRaceConfig(nextEntries, nextOneQuestMemberIds = oneQuestMemberIds, nextCompletedMemberIds = completedMemberIds, nextTwoGroupMemberIds = twoGroupMemberIds) {
    const payloadEntries = [
      ...nextEntries.map((entry) => ({ id: entry.id, member_id: entry.memberId, flower_ids: entry.flowerIds })),
      {
        __metaType: "priority_race_meta",
        one_quest_member_ids: nextOneQuestMemberIds.map(String),
        completed_member_ids: nextCompletedMemberIds.map(String),
        two_group_member_ids: nextTwoGroupMemberIds.map(String),
      },
    ];
    return supabase.from("priority_race_config").upsert({ config_key: "main", entries: payloadEntries }, { onConflict: "config_key" });
  }
  async function loadAccountPermissionsData() {
    const tryWithPrimary = await Promise.all([
      supabase.from("account_identities").select("id, email, nickname, role").order("nickname", { ascending: true }),
      supabase.from("account_member_permissions").select("id, account_email, member_id").order("account_email", { ascending: true }),
      supabase.from("account_permissions").select("id, email, role, member_id").order("email", { ascending: true }),
    ]);
    let [identitiesRes, permissionRowsRes, legacyRes] = tryWithPrimary;
    const needPublicFallback = Boolean(identitiesRes.error && permissionRowsRes.error);
    if (needPublicFallback) {
      [identitiesRes, permissionRowsRes, legacyRes] = await Promise.all([
        supabasePublic.from("account_identities").select("id, email, nickname, role").order("nickname", { ascending: true }),
        supabasePublic.from("account_member_permissions").select("id, account_email, member_id").order("account_email", { ascending: true }),
        supabasePublic.from("account_permissions").select("id, email, role, member_id").order("email", { ascending: true }),
      ]);
    }
    if (!identitiesRes.error && !permissionRowsRes.error) {
      setAccountIdentities((identitiesRes.data || []).map((row) => ({ id: String(row.id), email: String(row.email || "").toLowerCase(), nickname: String(row.nickname || ""), role: row.role || "member_editor" })));
      setAccountMemberPermissions((permissionRowsRes.data || []).map((row) => ({ id: String(row.id), accountEmail: String(row.account_email || "").toLowerCase(), memberId: row.member_id ? String(row.member_id) : "" })));
      setAccountPermissionsLoaded(true);
      return;
    }
    if (!legacyRes.error) {
      const legacyRows = (legacyRes.data || []).map((row, index) => ({ id: `legacy-${index}`, email: String(row.email || "").toLowerCase(), nickname: String(row.email || "").split("@")[0] || "", role: row.role || "member_editor", memberId: row.member_id ? String(row.member_id) : "" }));
      const identityMap = new Map();
      legacyRows.forEach((row) => {
        if (!identityMap.has(row.email)) identityMap.set(row.email, { id: `legacy-${row.email}`, email: row.email, nickname: row.nickname, role: row.role });
      });
      setAccountIdentities(Array.from(identityMap.values()));
      setAccountMemberPermissions(legacyRows.filter((row) => row.memberId).map((row, index) => ({ id: `legacy-perm-${index}`, accountEmail: row.email, memberId: row.memberId })));
      setAccountPermissionsLoaded(true);
      return;
    }
    setAccountIdentities([]);
    setAccountMemberPermissions([]);
    setAccountPermissionsLoaded(true);
  }
  async function getAccountAccessProfileForEmail(email) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) return null;

    const primary = await Promise.all([
      supabase.from("account_identities").select("id, email, nickname, role").eq("email", normalizedEmail).maybeSingle(),
      supabase.from("account_member_permissions").select("id, account_email, member_id").eq("account_email", normalizedEmail),
      supabase.from("account_permissions").select("id, email, role, member_id").eq("email", normalizedEmail),
    ]);

    let [identityRes, permissionsRes, legacyRes] = primary;
    const needPublicFallback = Boolean(identityRes.error && permissionsRes.error);
    if (needPublicFallback) {
      [identityRes, permissionsRes, legacyRes] = await Promise.all([
        supabasePublic.from("account_identities").select("id, email, nickname, role").eq("email", normalizedEmail).maybeSingle(),
        supabasePublic.from("account_member_permissions").select("id, account_email, member_id").eq("account_email", normalizedEmail),
        supabasePublic.from("account_permissions").select("id, email, role, member_id").eq("email", normalizedEmail),
      ]);
    }

    if (!identityRes.error && identityRes.data) {
      const memberIds = !permissionsRes.error ? (permissionsRes.data || []).map((row) => String(row.member_id)).filter(Boolean) : [];
      return {
        id: String(identityRes.data.id),
        email: String(identityRes.data.email || "").toLowerCase(),
        nickname: String(identityRes.data.nickname || ""),
        role: identityRes.data.role || "member_editor",
        memberIds,
      };
    }
    if (!legacyRes.error && (legacyRes.data || []).length > 0) {
      const first = legacyRes.data[0];
      return {
        id: `legacy-${normalizedEmail}`,
        email: normalizedEmail,
        nickname: normalizedEmail.split("@")[0] || "",
        role: first.role || "member_editor",
        memberIds: (legacyRes.data || []).map((row) => String(row.member_id)).filter(Boolean),
      };
    }
    return null;
  }
  async function getAccountIdentityByNickname(rawNickname) {
    const nickname = String(rawNickname || "").trim();
    if (!nickname) return null;

    const primary = await supabase.from("account_identities").select("id, email, nickname, role").ilike("nickname", nickname).maybeSingle();
    const fallback = primary.error ? await supabasePublic.from("account_identities").select("id, email, nickname, role").ilike("nickname", nickname).maybeSingle() : primary;
    const { data, error } = fallback;
    if (error || !data) return null;
    return { id: String(data.id), email: String(data.email || "").toLowerCase(), nickname: String(data.nickname || ""), role: data.role || "member_editor" };
  }
  async function loadArtVasesData() {
    const { data, error } = await supabasePublic.from("art_vases").select("id, name, icon_url, vase_group, main_flower_ids, secondary_flower_ids, accent_flower_ids").order("name", { ascending: true });
    if (error) { setArtVases([]); setArtVaseMessage("Chưa có bảng art_vases trong Supabase hoặc chưa tải được dữ liệu Hoa nghệ thuật."); setArtVasesLoaded(true); return; }
    setArtVases((data || []).map((row) => ({ id: String(row.id), name: row.name || "", iconUrl: row.icon_url || "", vaseGroup: row.vase_group || "Lục", mainFlowerIds: Array.isArray(row.main_flower_ids) ? row.main_flower_ids.map(String) : [], secondaryFlowerIds: Array.isArray(row.secondary_flower_ids) ? row.secondary_flower_ids.map(String) : [], accentFlowerIds: Array.isArray(row.accent_flower_ids) ? row.accent_flower_ids.map(String) : [] })));
    setArtVaseMessage("");
    setArtVasesLoaded(true);
  }
  async function loadGardenPackageData() {
    const { data, error } = await supabasePublic.from("garden_package_config").select("config_key, pages").eq("config_key", "main").maybeSingle();
    if (error) {
      setGardenPackagePages(createDefaultGardenPackagePages());
      setGardenPackageLoaded(true);
      return;
    }
    setGardenPackagePages(normalizeGardenPackagePages(data?.pages));
    setGardenPackageLoaded(true);
  }
  async function saveGardenPackageData(nextPages) {
    const normalized = normalizeGardenPackagePages(nextPages);
    setSavingGardenPackage(true);
    const { error } = await supabase.from("garden_package_config").upsert({ config_key: "main", pages: normalized }, { onConflict: "config_key" });
    setSavingGardenPackage(false);
    if (error) {
      setGardenPackageMessage(`Không lưu được Gói Vườn Hoa: ${error.message}`);
      return false;
    }
    setGardenPackagePages(normalized);
    setGardenPackageMessage("Đã lưu danh sách Gói Vườn Hoa.");
    await logAction({ actionType: "update_garden_package", actorName: user?.email || "Quản trị hội", targetType: "garden_package", targetName: "Gói Vườn Hoa", details: "Cập nhật danh sách 15 trang gói vườn hoa" });
    return true;
  }
  function toggleGardenPackageFlower(pageNumber, slotKey, flowerId) {
    setGardenPackagePages((prev) => prev.map((page) => {
      if (page.pageNumber !== Number(pageNumber)) return page;
      const currentIds = Array.isArray(page[slotKey]) ? page[slotKey].map(String) : [];
      const nextIds = currentIds.includes(String(flowerId)) ? currentIds.filter((id) => id !== String(flowerId)) : [...currentIds, String(flowerId)];
      return { ...page, [slotKey]: nextIds };
    }));
  }
  async function loadSiteSettingsData() {
    let localTitle = "";
    try {
      localTitle = window.localStorage.getItem("selina-site-header-title") || "";
    } catch {}
    if (localTitle.trim()) {
      setSiteHeaderTitle(localTitle.trim());
      setSiteHeaderTitleInput(localTitle.trim());
    }
    const { data, error } = await supabasePublic.from("site_settings").select("setting_key, setting_value").eq("setting_key", "header_title").maybeSingle();
    if (error || !data) return;
    const nextTitle = String(data.setting_value || "").trim() || "Quản Lý Hoa Hội SELINA";
    setSiteHeaderTitle(nextTitle);
    setSiteHeaderTitleInput(nextTitle);
    try { window.localStorage.setItem("selina-site-header-title", nextTitle); } catch {}
  }
  async function saveSiteHeaderTitle() {
    if (!isAdmin) return;
    const nextTitle = String(siteHeaderTitleInput || "").trim() || "Quản Lý Hoa Hội SELINA";
    setSiteSettingsMessage("");
    const { error } = await supabase.from("site_settings").upsert({ setting_key: "header_title", setting_value: nextTitle, updated_at: new Date().toISOString() }, { onConflict: "setting_key" });
    setSiteHeaderTitle(nextTitle);
    setSiteHeaderTitleInput(nextTitle);
    try { window.localStorage.setItem("selina-site-header-title", nextTitle); } catch {}
    if (error) {
      setSiteSettingsMessage("Đã đổi tiêu đề tạm trên trình duyệt này. Nếu muốn lưu vĩnh viễn cho mọi máy, cần tạo bảng site_settings trong Supabase.");
      return;
    }
    setSiteSettingsMessage("Đã lưu tiêu đề đầu trang.");
    broadcastOwnershipRefresh("site_settings_changed");
  }
  async function loadStatCardAssetsData() {
    const { data, error } = await supabasePublic.from("dashboard_stat_assets").select("id, stat_key, image_url").order("stat_key", { ascending: true });
    if (error) {
      if (String(error.message || "").toLowerCase().includes("row-level security")) {
        setStatCardAssetMessage("Bảng dashboard_stat_assets đang bị chặn bởi Row Level Security. Ảnh vẫn có thể xem tạm trong phiên hiện tại sau khi upload, nhưng để lưu vĩnh viễn bạn cần thêm policy INSERT/UPDATE/DELETE/SELECT cho bảng này trong Supabase.");
      }
      setStatCardAssets([]);
      setStatCardAssetsLoaded(true);
      return;
    }
    setStatCardAssets((data || []).map((row) => ({ id: String(row.id), statKey: String(row.stat_key || ""), imageUrl: String(row.image_url || "") })));
    setStatCardAssetsLoaded(true);
  }
  async function loadAllData(options = {}) {
    const { silent = false, includeTitles = false, includeHistory = false, includeSpiritHunt = false, includePriorityRace = false } = options;
    if (!silent) { setLoading(true); setPageMessage(""); }
    const corePromise = Promise.all([
      supabasePublic.from("members").select("id, name, birth_year, gender, left_guild, show_in_lookup").order("name", { ascending: true }),
      supabasePublic.from("flowers").select("id, name, group_name, icon_url").order("name", { ascending: true }),
    ]);
    let releasedLoading = false;
    const releaseLoading = (message = "") => {
      if (silent || releasedLoading) return;
      releasedLoading = true;
      setLoading(false);
      if (message) setPageMessage(message);
    };
    const softTimeout = window.setTimeout(() => {
      releaseLoading("Đang tải dữ liệu hơi chậm. Giao diện đã mở trước, dữ liệu sẽ tự cập nhật khi Supabase phản hồi xong.");
    }, 2500);
    try {
      const [membersRes, flowersRes] = await corePromise;
      window.clearTimeout(softTimeout);
      if (membersRes.error || flowersRes.error) throw new Error(membersRes.error?.message || flowersRes.error?.message || "Không tải được dữ liệu.");
      setMembers((membersRes.data || []).map((m) => ({ id: String(m.id), name: m.name, birthYear: m.birth_year || null, gender: m.gender || "", leftGuild: Boolean(m.left_guild), showInLookup: Boolean(m.show_in_lookup) })));
      setFlowers((flowersRes.data || []).map((f) => ({ id: String(f.id), name: f.name, group: f.group_name, iconUrl: f.icon_url || "" })));
      setLastSyncedAt(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      releaseLoading("");
      const backgroundTasks = [loadOwnershipData().catch((error) => setPageMessage(`Không tải được sở hữu hoa: ${error?.message || "Lỗi không xác định"}`))];
      if (includeTitles) backgroundTasks.push(loadTitlesData().catch((error) => setPageMessage(`Không tải được chức danh: ${error?.message || "Lỗi không xác định"}`)));
      if (includeHistory) backgroundTasks.push(loadHistoryData().catch((error) => setPageMessage(`Không tải được lịch sử: ${error?.message || "Lỗi không xác định"}`)));
      if (includeSpiritHunt) backgroundTasks.push(loadSpiritHuntData().catch((error) => setPageMessage(`Không tải được săn hoa linh: ${error?.message || "Lỗi không xác định"}`)));
      if (includePriorityRace) backgroundTasks.push(loadPriorityRaceData().catch((error) => setPageMessage(`Không tải được ưu tiên đua hội: ${error?.message || "Lỗi không xác định"}`)));
      Promise.allSettled(backgroundTasks);
    } catch (error) {
      window.clearTimeout(softTimeout);
      releaseLoading(`Không tải được dữ liệu: ${error?.message || "Lỗi không xác định"}`);
    }
  }
  async function refreshCoreDataSilently(extra = {}) {
    await loadAllData({ silent: true, includeTitles: extra.includeTitles ?? titlesLoaded, includeHistory: extra.includeHistory ?? historyLoaded, includeSpiritHunt: extra.includeSpiritHunt ?? spiritHuntLoaded, includePriorityRace: extra.includePriorityRace ?? priorityRaceLoaded });
  }
  function queueRealtimeRefresh(extra = {}) {
    if (typeof window === "undefined") return;
    if (realtimeRefreshTimerRef.current) window.clearTimeout(realtimeRefreshTimerRef.current);
    realtimeRefreshTimerRef.current = window.setTimeout(() => {
      refreshCoreDataSilently(extra);
    }, 120);
  }
  function broadcastOwnershipRefresh(reason = "ownership_changed") {
    if (typeof window === "undefined") return;
    const payload = {
      type: "selina_sync",
      reason,
      at: Date.now(),
      includeTitles: true,
      includeHistory: historyLoaded,
      includeSpiritHunt: spiritHuntLoaded,
      includePriorityRace: priorityRaceLoaded,
    };
    try {
      syncBroadcastChannelRef.current?.postMessage(payload);
    } catch {}
    try {
      window.localStorage.setItem("selina-sync-event", JSON.stringify(payload));
    } catch {}
    try {
      supabaseSyncChannelRef.current?.send({ type: "broadcast", event: "sync", payload });
    } catch {}
  }

  useEffect(() => { loadAllData({ includeTitles: shouldLoadTitlesForTab(activeTabRef.current, isAdminRef.current), includeHistory: shouldLoadHistoryForTab(activeTabRef.current), includeSpiritHunt: shouldLoadSpiritHuntForTab(activeTabRef.current), includePriorityRace: shouldLoadPriorityRaceForTab(activeTabRef.current) }); loadSiteSettingsData(); }, []);
  useEffect(() => {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel("selina-sync");
    syncBroadcastChannelRef.current = channel;
    channel.onmessage = (event) => {
      if (event?.data?.type !== "selina_sync") return;
      queueRealtimeRefresh({
        includeTitles: true,
        includeHistory: historyLoaded,
        includeSpiritHunt: spiritHuntLoaded,
        includePriorityRace: priorityRaceLoaded,
      });
    };
    return () => {
      channel.close();
      syncBroadcastChannelRef.current = null;
    };
  }, [historyLoaded, spiritHuntLoaded, priorityRaceLoaded]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event) => {
      if (event.key !== "selina-sync-event" || !event.newValue) return;
      queueRealtimeRefresh({
        includeTitles: true,
        includeHistory: historyLoaded,
        includeSpiritHunt: spiritHuntLoaded,
        includePriorityRace: priorityRaceLoaded,
      });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [historyLoaded, spiritHuntLoaded, priorityRaceLoaded]);
  useEffect(() => {
    const channel = supabase
      .channel("selina-cross-device-sync", { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "sync" }, ({ payload }) => {
        if (payload?.type !== "selina_sync") return;
        queueRealtimeRefresh({
          includeTitles: true,
          includeHistory: historyLoaded,
          includeSpiritHunt: spiritHuntLoaded,
          includePriorityRace: priorityRaceLoaded,
        });
      })
      .subscribe();
    supabaseSyncChannelRef.current = channel;
    return () => {
      if (supabaseSyncChannelRef.current === channel) supabaseSyncChannelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [historyLoaded, spiritHuntLoaded, priorityRaceLoaded]);
  useEffect(() => {
    const channel = supabase
      .channel("selina-realtime-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "member_flowers" }, () => {
        queueRealtimeRefresh({ includeHistory: historyLoaded, includeTitles: titlesLoaded, includeSpiritHunt: spiritHuntLoaded, includePriorityRace: priorityRaceLoaded });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, () => {
        queueRealtimeRefresh({ includeHistory: historyLoaded, includeTitles: titlesLoaded, includeSpiritHunt: spiritHuntLoaded, includePriorityRace: priorityRaceLoaded });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "flowers" }, () => {
        queueRealtimeRefresh({ includeHistory: historyLoaded, includeTitles: titlesLoaded, includeSpiritHunt: spiritHuntLoaded, includePriorityRace: priorityRaceLoaded });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "member_titles" }, () => {
        queueRealtimeRefresh({ includeTitles: true, includeHistory: historyLoaded, includeSpiritHunt: spiritHuntLoaded, includePriorityRace: priorityRaceLoaded });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "titles" }, () => {
        queueRealtimeRefresh({ includeTitles: true, includeHistory: historyLoaded, includeSpiritHunt: spiritHuntLoaded, includePriorityRace: priorityRaceLoaded });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "action_logs" }, () => {
        if (historyLoaded) queueRealtimeRefresh({ includeHistory: true, includeTitles: titlesLoaded, includeSpiritHunt: spiritHuntLoaded, includePriorityRace: priorityRaceLoaded });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "priority_race_config" }, () => {
        queueRealtimeRefresh({ includeTitles: true, includeHistory: historyLoaded, includeSpiritHunt: spiritHuntLoaded, includePriorityRace: true });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () => {
        loadSiteSettingsData();
      })
      .subscribe();
    return () => {
      if (realtimeRefreshTimerRef.current) window.clearTimeout(realtimeRefreshTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [historyLoaded, titlesLoaded, spiritHuntLoaded, priorityRaceLoaded]);
  useEffect(() => {
    const needTitles = shouldLoadTitlesForTab(activeTab, isAdmin);
    const needHistory = shouldLoadHistoryForTab(activeTab);
    const needSpiritHunt = shouldLoadSpiritHuntForTab(activeTab);
    const needPriorityRace = shouldLoadPriorityRaceForTab(activeTab);
    if (needTitles && !titlesLoaded) loadTitlesData().catch((e) => setPageMessage(e.message));
    if (needHistory && !historyLoaded) loadHistoryData().catch((e) => setPageMessage(e.message));
    if (needSpiritHunt && !spiritHuntLoaded) loadSpiritHuntData().catch((e) => setPageMessage(e.message));
    if (needPriorityRace && !priorityRaceLoaded) loadPriorityRaceData().catch((e) => setPageMessage(e.message));
    if (activeTab === "addflower" && !artVasesLoaded) loadArtVasesData().catch((e) => setPageMessage(e.message));
    if (activeTab === "gardenpackage" && !gardenPackageLoaded) loadGardenPackageData().catch((e) => setPageMessage(e.message));
    if (!statCardAssetsLoaded) loadStatCardAssetsData().catch((e) => setPageMessage(e.message));
    if (activeTab === "adminpanel" && canAccessAdminPanel && !accountPermissionsLoaded) loadAccountPermissionsData().catch((e) => setPageMessage(e.message));
  }, [activeTab, isAdmin, titlesLoaded, historyLoaded, spiritHuntLoaded, priorityRaceLoaded, accountPermissionsLoaded, artVasesLoaded, statCardAssetsLoaded, isSuperAdmin, gardenPackageLoaded]);

  const memberById = useMemo(() => new Map(members.map((m) => [String(m.id), m])), [members]);
  const flowerById = useMemo(() => new Map(flowers.map((f) => [String(f.id), f])), [flowers]);
  const memberNameById = useMemo(() => new Map(members.map((m) => [String(m.id), m.name])), [members]);
  const titleById = useMemo(() => new Map(titles.map((t) => [String(t.id), t])), [titles]);
  const titleByMemberId = useMemo(() => {
    const map = new Map();
    memberTitles.forEach((row) => map.set(String(row.memberId), titleById.get(String(row.titleId)) || null));
    return map;
  }, [memberTitles, titleById]);
  const lookupVisibleMembers = useMemo(() => members.filter((m) => shouldShowFormerMemberInLookup(m)), [members]);
  const lookupVisibleMemberIds = useMemo(() => new Set(lookupVisibleMembers.map((m) => String(m.id))), [lookupVisibleMembers]);
  const ownersByFlower = useMemo(() => {
    const map = new Map();
    flowers.forEach((f) => map.set(String(f.id), []));
    ownerships.forEach((row) => {
      if (!lookupVisibleMemberIds.has(String(row.memberId))) return;
      const name = memberNameById.get(String(row.memberId));
      if (!name) return;
      const list = map.get(String(row.flowerId)) || [];
      if (!list.includes(name)) list.push(name);
      map.set(String(row.flowerId), list);
    });
    return map;
  }, [flowers, ownerships, memberNameById, lookupVisibleMemberIds]);
  const memberFlowerCounts = useMemo(() => {
    const counts = {};
    ownerships.forEach((row) => { counts[String(row.memberId)] = (counts[String(row.memberId)] || 0) + 1; });
    return counts;
  }, [ownerships]);
  const activeMembers = useMemo(() => members.filter((m) => !isFormerMember(m)), [members]);
  const activeMemberIds = useMemo(() => new Set(activeMembers.map((m) => String(m.id))), [activeMembers]);
  const activeOwnerships = useMemo(() => ownerships.filter((row) => activeMemberIds.has(String(row.memberId))), [ownerships, activeMemberIds]);
  const activeMemberFlowerCounts = useMemo(() => {
    const counts = {};
    activeOwnerships.forEach((row) => { counts[String(row.memberId)] = (counts[String(row.memberId)] || 0) + 1; });
    return counts;
  }, [activeOwnerships]);
  const memberGroupCounts = useMemo(() => {
    const counts = {};
    ownerships.forEach((row) => {
      const memberId = String(row.memberId);
      const flower = flowerById.get(String(row.flowerId));
      if (!flower) return;
      if (!counts[memberId]) counts[memberId] = { "Đỏ 30": 0, Đỏ: 0, Vàng: 0, Tím: 0, Lam: 0, Lục: 0 };
      counts[memberId][flower.group] = (counts[memberId][flower.group] || 0) + 1;
    });
    return counts;
  }, [ownerships, flowerById]);
  const activeOwnersByFlower = useMemo(() => {
    const map = new Map();
    flowers.forEach((f) => map.set(String(f.id), []));
    activeOwnerships.forEach((row) => {
      const name = memberNameById.get(String(row.memberId));
      if (!name) return;
      const list = map.get(String(row.flowerId)) || [];
      if (!list.includes(name)) list.push(name);
      map.set(String(row.flowerId), list);
    });
    return map;
  }, [flowers, activeOwnerships, memberNameById]);
  const summary = useMemo(() => {
    const ownedFlowerIds = new Set(activeOwnerships.map((x) => String(x.flowerId)));
    const totalMembers = activeMembers.filter((member) => String(titleByMemberId.get(String(member.id))?.name || "").trim().toLowerCase() !== "clone").length;
    return { totalMembers, totalFlowers: flowers.length, ownedFlowers: ownedFlowerIds.size, missingFlowers: flowers.length - ownedFlowerIds.size, completionRate: flowers.length ? Math.round((ownedFlowerIds.size / flowers.length) * 100) : 0 };
  }, [activeMembers, flowers, activeOwnerships, titleByMemberId]);
  const topMembers = useMemo(() => [...activeMembers].map((m) => ({ ...m, ownedCount: activeMemberFlowerCounts[String(m.id)] || 0 })).sort((a, b) => b.ownedCount - a.ownedCount).slice(0, 3), [activeMembers, activeMemberFlowerCounts]);
  const groupOwnedCounts = useMemo(() => {
    const ownedIds = new Set(activeOwnerships.map((r) => String(r.flowerId)));
    const counts = { "Đỏ 30": 0, Đỏ: 0, Vàng: 0, Tím: 0, Lam: 0, Lục: 0 };
    flowers.forEach((f) => { if (ownedIds.has(String(f.id))) counts[f.group] = (counts[f.group] || 0) + 1; });
    return counts;
  }, [flowers, activeOwnerships]);
  const groupProgressRows = useMemo(() => MEMBER_FLOWER_GROUP_ORDER.map((group) => {
    const total = flowers.filter((f) => f.group === group).length;
    const owned = groupOwnedCounts[group] || 0;
    return { group, total, owned, percent: total ? Math.round((owned / total) * 100) : 0 };
  }), [flowers, groupOwnedCounts]);
  const missingFlowers = useMemo(() => {
    const groupOrder = MEMBER_FLOWER_GROUP_ORDER.reduce((acc, group, index) => {
      acc[group] = index;
      return acc;
    }, {});
    return flowers
      .filter((f) => !activeOwnersByFlower.get(String(f.id))?.length)
      .sort((a, b) => {
        const byGroup = (groupOrder[a.group] ?? 99) - (groupOrder[b.group] ?? 99);
        if (byGroup !== 0) return byGroup;
        return a.name.localeCompare(b.name, "vi");
      });
  }, [flowers, activeOwnersByFlower]);
  const rareFlowers = useMemo(() => [...flowers].filter((f) => { const count = activeOwnersByFlower.get(String(f.id))?.length || 0; return count >= 1 && count <= 3; }).sort((a, b) => { const aCount = activeOwnersByFlower.get(String(a.id))?.length || 0; const bCount = activeOwnersByFlower.get(String(b.id))?.length || 0; if (aCount !== bCount) return aCount - bCount; return a.name.localeCompare(b.name, "vi"); }), [flowers, activeOwnersByFlower]);
  const filteredMissingFlowers = useMemo(() => missingFlowers.filter((f) => dashboardMissingGroupFilter === "all" || f.group === dashboardMissingGroupFilter), [missingFlowers, dashboardMissingGroupFilter]);
  const filteredRareFlowers = useMemo(() => rareFlowers.filter((f) => dashboardRareGroupFilter === "all" || f.group === dashboardRareGroupFilter), [rareFlowers, dashboardRareGroupFilter]);
  const filteredMembers = useMemo(() => {
    const genderRankMaps = { male_first: { Nam: 0, Nữ: 1, Khác: 2, "": 3 }, female_first: { Nữ: 0, Nam: 1, Khác: 2, "": 3 } };
    const normalizedMembers = [...members].map((m) => ({ ...m, ownedCount: memberFlowerCounts[String(m.id)] || 0, normalizedGender: normalizeMemberGender(m.gender), ageValue: getMemberAge(m) })).filter((m) => m.name.toLowerCase().includes(memberSearch.trim().toLowerCase()));
    normalizedMembers.sort((a, b) => {
      if (memberSortField === "name") return memberSortDirection === "asc" ? a.name.localeCompare(b.name, "vi") : b.name.localeCompare(a.name, "vi");
      if (memberSortField === "flowers") {
        if (a.ownedCount !== b.ownedCount) return memberSortDirection === "desc" ? b.ownedCount - a.ownedCount : a.ownedCount - b.ownedCount;
        return a.name.localeCompare(b.name, "vi");
      }
      if (memberSortField === "age") {
        const ageA = a.ageValue ?? -1;
        const ageB = b.ageValue ?? -1;
        if (ageA !== ageB) return memberSortDirection === "desc" ? ageB - ageA : ageA - ageB;
        return a.name.localeCompare(b.name, "vi");
      }
      const rankMap = memberSortDirection === "male_first" ? genderRankMaps.male_first : genderRankMaps.female_first;
      const rankA = rankMap[a.normalizedGender] ?? 99;
      const rankB = rankMap[b.normalizedGender] ?? 99;
      if (rankA !== rankB) return rankA - rankB;
      return a.name.localeCompare(b.name, "vi");
    });
    return normalizedMembers;
  }, [members, memberFlowerCounts, memberSearch, memberSortField, memberSortDirection]);
  const memberSortDirectionOptions = useMemo(() => {
    if (memberSortField === "name") return [{ value: "asc", label: "A đến Z" }, { value: "desc", label: "Z đến A" }];
    if (memberSortField === "flowers") return [{ value: "desc", label: "Nhiều đến ít" }, { value: "asc", label: "Ít đến nhiều" }];
    if (memberSortField === "age") return [{ value: "desc", label: "Nhiều đến ít" }, { value: "asc", label: "Ít đến nhiều" }];
    return [{ value: "male_first", label: "Nam đến Nữ" }, { value: "female_first", label: "Nữ đến Nam" }];
  }, [memberSortField]);
  const filteredCloneMembers = useMemo(() => filteredMembers.filter((m) => {
    if (isFormerMember(m)) return false;
    const memberTitle = titleByMemberId.get(String(m.id));
    return String(memberTitle?.name || "").trim().toLowerCase() === "clone";
  }), [filteredMembers, titleByMemberId]);
  const filteredActiveMembers = useMemo(() => filteredMembers.filter((m) => {
    if (isFormerMember(m)) return false;
    const memberTitle = titleByMemberId.get(String(m.id));
    return String(memberTitle?.name || "").trim().toLowerCase() !== "clone";
  }), [filteredMembers, titleByMemberId]);
  const filteredFormerMembers = useMemo(() => filteredMembers.filter((m) => isFormerMember(m)), [filteredMembers]);
  const memberFlowersByMemberId = useMemo(() => {
    const grouped = {};
    ownerships.forEach((row) => {
      const flower = flowerById.get(String(row.flowerId));
      if (!flower) return;
      const memberId = String(row.memberId);
      if (!grouped[memberId]) grouped[memberId] = { "Đỏ 30": [], Đỏ: [], Vàng: [], Tím: [], Lam: [], Lục: [] };
      grouped[memberId][flower.group].push(flower);
    });
    Object.values(grouped).forEach((groupMap) => MEMBER_FLOWER_GROUP_ORDER.forEach((group) => { groupMap[group] = (groupMap[group] || []).sort((a, b) => a.name.localeCompare(b.name, "vi")); }));
    return grouped;
  }, [ownerships, flowerById]);
  const filteredExistingMembers = useMemo(() => {
    const sourceMembers = isRestrictedEditor ? activeMembers.filter((member) => restrictedMemberIds.includes(String(member.id))) : activeMembers;
    return sourceMembers.filter((m) => m.name.toLowerCase().includes(memberPickerSearch.trim().toLowerCase())).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [activeMembers, memberPickerSearch, isRestrictedEditor, restrictedMemberIds]);
  const filteredFlowers = useMemo(() => flowers.filter((flower) => normalizeFlowerLookupText(flower.name).includes(normalizeFlowerLookupText(flowerSearch))), [flowers, flowerSearch]);
  const filteredMemberFlowerLookupOptions = useMemo(() => activeMembers.filter((m) => !memberFlowerLookupSearch.trim() || m.name.toLowerCase().includes(memberFlowerLookupSearch.trim().toLowerCase())).sort((a, b) => a.name.localeCompare(b.name, "vi")), [activeMembers, memberFlowerLookupSearch]);
  const selectedMemberFlowerLookup = useMemo(() => activeMembers.find((m) => String(m.id) === String(memberFlowerLookup)) || null, [activeMembers, memberFlowerLookup]);
  const selectedExistingMember = useMemo(() => members.find((m) => String(m.id) === String(selectedExistingMemberId)) || null, [members, selectedExistingMemberId]);
  const flowersBySelectedMember = useMemo(() => {
    if (!selectedMemberFlowerLookup) return [];
    const ids = new Set(ownerships.filter((row) => String(row.memberId) === String(selectedMemberFlowerLookup.id)).map((row) => String(row.flowerId)));
    return flowers.filter((flower) => ids.has(String(flower.id)));
  }, [selectedMemberFlowerLookup, ownerships, flowers]);
  const memberFlowersByGroup = useMemo(() => {
    const grouped = { "Đỏ 30": [], Đỏ: [], Vàng: [], Tím: [], Lam: [], Lục: [] };
    flowersBySelectedMember.forEach((flower) => grouped[flower.group].push(flower));
    return grouped;
  }, [flowersBySelectedMember]);
  const selectableFlowers = useMemo(() => {
    const q = normalizeFlowerLookupText(updateSearch);
    const ownedIds = selectedExistingMember ? new Set(ownerships.filter((row) => String(row.memberId) === String(selectedExistingMember.id)).map((row) => String(row.flowerId))) : new Set();
    return flowers.filter((flower) => normalizeFlowerLookupText(flower.name).includes(q) && (updateGroupFilter === "all" || flower.group === updateGroupFilter) && !ownedIds.has(String(flower.id)));
  }, [flowers, updateSearch, updateGroupFilter, selectedExistingMember, ownerships]);
  const removableFlowers = useMemo(() => {
    if (!selectedExistingMember) return [];
    const ownedIds = new Set(ownerships.filter((row) => String(row.memberId) === String(selectedExistingMember.id)).map((row) => String(row.flowerId)));
    const q = normalizeFlowerLookupText(removalFlowerSearch);
    return flowers.filter((flower) => ownedIds.has(String(flower.id)) && (!q || normalizeFlowerLookupText(flower.name).includes(q))).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [selectedExistingMember, ownerships, flowers, removalFlowerSearch]);
  const filteredManageFlowers = useMemo(() => {
    const q = normalizeFlowerLookupText(flowerManageSearch);
    return flowers.filter((flower) => (!q || normalizeFlowerLookupText(flower.name).includes(q)) && (flowerManageGroupFilter === "all" || flower.group === flowerManageGroupFilter));
  }, [flowers, flowerManageSearch, flowerManageGroupFilter]);
  const membersByTitleId = useMemo(() => {
    const map = new Map();
    titles.forEach((title) => map.set(String(title.id), []));
    memberTitles.forEach((row) => {
      const member = memberById.get(String(row.memberId));
      if (!member) return;
      const list = map.get(String(row.titleId)) || [];
      list.push(member);
      map.set(String(row.titleId), list);
    });
    return map;
  }, [titles, memberTitles, memberById]);
  const filteredTitleMembers = useMemo(() => activeMembers.filter((member) => member.name.toLowerCase().includes(titleMemberSearch.trim().toLowerCase())).sort((a, b) => a.name.localeCompare(b.name, "vi")), [activeMembers, titleMemberSearch]);
  const filteredTitles = useMemo(() => titles.filter((title) => title.name.toLowerCase().includes(titleManageSearch.trim().toLowerCase())).sort((a, b) => a.name.localeCompare(b.name, "vi")), [titles, titleManageSearch]);
  const priorityRaceMember = useMemo(() => members.find((member) => String(member.id) === String(priorityRaceForm.memberId)) || null, [members, priorityRaceForm.memberId]);
  const priorityRaceAvailableFlowers = useMemo(() => {
    if (!priorityRaceMember) return [];
    const owned = new Set(ownerships.filter((row) => String(row.memberId) === String(priorityRaceMember.id)).map((row) => String(row.flowerId)));
    const groupOrder = MEMBER_FLOWER_GROUP_ORDER.reduce((acc, group, index) => { acc[group] = index; return acc; }, {});
    return flowers.filter((flower) => owned.has(String(flower.id))).sort((a, b) => {
      const byGroup = (groupOrder[a.group] ?? 99) - (groupOrder[b.group] ?? 99);
      if (byGroup !== 0) return byGroup;
      return a.name.localeCompare(b.name, "vi");
    });
  }, [priorityRaceMember, ownerships, flowers]);
  const filteredPriorityRaceAvailableFlowers = useMemo(() => {
    const q = normalizeFlowerLookupText(priorityRaceFlowerSearch);
    return priorityRaceAvailableFlowers.filter((flower) => (!q || normalizeFlowerLookupText(flower.name).includes(q)) && (priorityRaceGroupFilter === "all" || flower.group === priorityRaceGroupFilter));
  }, [priorityRaceAvailableFlowers, priorityRaceFlowerSearch, priorityRaceGroupFilter]);
  const priorityRaceSelectedFlowers = useMemo(() => {
    const selectedIds = new Set(priorityRaceForm.flowerIds.map(String));
    return flowers.filter((flower) => selectedIds.has(String(flower.id))).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [flowers, priorityRaceForm.flowerIds]);
  const filteredPriorityRaceSelectedFlowers = useMemo(() => {
    const q = normalizeFlowerLookupText(priorityRaceSelectedFlowerSearch);
    return priorityRaceSelectedFlowers.filter((flower) => !q || normalizeFlowerLookupText(flower.name).includes(q));
  }, [priorityRaceSelectedFlowers, priorityRaceSelectedFlowerSearch]);
  const effectivePriorityRaceEntries = useMemo(() => {
    const completedSet = new Set(completedMemberIds.map(String));
    const localTwoGroupMemberIdSet = new Set(twoGroupMemberIds.map(String));
    return activeMembers.map((member) => {
      const memberId = String(member.id);
      if (completedSet.has(memberId)) return null;
      const ownedFlowers = activeOwnerships
        .filter((row) => String(row.memberId) === memberId)
        .map((row) => flowerById.get(String(row.flowerId)))
        .filter(Boolean);
      if (ownedFlowers.length === 0) return null;
      const highestRank = ownedFlowers.reduce((max, flower) => Math.max(max, priorityRaceGroupRank(flower.group)), 0);
      if (highestRank <= 0) return null;
      const selectedRanks = new Set([highestRank]);
      if (localTwoGroupMemberIdSet.has(memberId) && highestRank > 1) selectedRanks.add(highestRank - 1);
      const selectedFlowers = ownedFlowers
        .filter((flower) => selectedRanks.has(priorityRaceGroupRank(flower.group)))
        .sort((a, b) => {
          const byRank = priorityRaceGroupRank(a.group) - priorityRaceGroupRank(b.group);
          if (byRank !== 0) return byRank;
          return a.name.localeCompare(b.name, "vi");
        });
      if (selectedFlowers.length === 0) return null;
      const memberTitle = titleByMemberId.get(memberId);
      const isClone = String(memberTitle?.name || "").trim().toLowerCase() === "clone";
      return {
        id: `derived-${memberId}`,
        memberId,
        flowerIds: selectedFlowers.map((flower) => String(flower.id)),
        highestGroupRank: highestRank,
        flowerCount: selectedFlowers.length,
        memberName: member.name,
        ownedTotalCount: activeMemberFlowerCounts[memberId] || 0,
        isClone,
      };
    }).filter(Boolean).sort((a, b) => {
      if (a.highestGroupRank !== b.highestGroupRank) return a.highestGroupRank - b.highestGroupRank;
      if (a.ownedTotalCount !== b.ownedTotalCount) return a.ownedTotalCount - b.ownedTotalCount;
      if (a.flowerCount !== b.flowerCount) return a.flowerCount - b.flowerCount;
      return a.memberName.localeCompare(b.memberName, "vi");
    }).map(({ id, memberId, flowerIds, isClone, ownedTotalCount, highestGroupRank, flowerCount, memberName }) => ({ id, memberId, flowerIds, isClone, ownedTotalCount, highestGroupRank, flowerCount, memberName }));
  }, [activeMembers, activeOwnerships, flowerById, completedMemberIds, twoGroupMemberIds, titleByMemberId, activeMemberFlowerCounts]);
  const filteredPriorityRaceEntries = useMemo(() => {
    const q = normalizeFlowerLookupText(priorityRaceListSearch);
    return effectivePriorityRaceEntries.map((entry) => {
      const member = memberById.get(String(entry.memberId)) || null;
      const allFlowersForEntry = entry.flowerIds.map((id) => flowerById.get(String(id))).filter(Boolean);
      const matchedFlowersForEntry = q ? allFlowersForEntry.filter((flower) => normalizeFlowerLookupText(flower.name).includes(q)) : allFlowersForEntry;
      return { ...entry, member, flowersForEntry: matchedFlowersForEntry, totalFlowersForEntry: allFlowersForEntry.length };
    }).filter((entry) => entry.flowersForEntry.length > 0);
  }, [effectivePriorityRaceEntries, priorityRaceListSearch, memberById, flowerById]);
  const filteredPriorityRaceMemberEntries = useMemo(() => filteredPriorityRaceEntries.filter((entry) => !entry.isClone), [filteredPriorityRaceEntries]);
  const filteredPriorityRaceCloneEntries = useMemo(() => filteredPriorityRaceEntries.filter((entry) => entry.isClone), [filteredPriorityRaceEntries]);
  const filteredPriorityRaceMembers = useMemo(() => {
    const q = priorityRaceMemberSearch.trim().toLowerCase();
    return activeMembers.filter((member) => !q || member.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [activeMembers, priorityRaceMemberSearch]);
  const filteredOneQuestMembers = useMemo(() => {
    const q = oneQuestMemberSearch.trim().toLowerCase();
    return activeMembers.filter((member) => !q || member.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [activeMembers, oneQuestMemberSearch]);
  const filteredCompletedMembers = useMemo(() => {
    const q = completedMemberSearch.trim().toLowerCase();
    return activeMembers.filter((member) => !q || member.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [activeMembers, completedMemberSearch]);
  const oneQuestMembers = useMemo(() => oneQuestMemberIds.map((id) => memberById.get(String(id))).filter(Boolean), [oneQuestMemberIds, memberById]);
  const completedMembers = useMemo(() => completedMemberIds.map((id) => memberById.get(String(id))).filter(Boolean), [completedMemberIds, memberById]);
  const filteredTwoGroupMembers = useMemo(() => {
    const q = twoGroupMemberSearch.trim().toLowerCase();
    return activeMembers.filter((member) => !q || member.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [activeMembers, twoGroupMemberSearch]);
  const twoGroupMembers = useMemo(() => twoGroupMemberIds.map((id) => memberById.get(String(id))).filter(Boolean), [twoGroupMemberIds, memberById]);
  const oneQuestMemberIdSet = useMemo(() => new Set(oneQuestMemberIds.map(String)), [oneQuestMemberIds]);
  const twoGroupMemberIdSet = useMemo(() => new Set(twoGroupMemberIds.map(String)), [twoGroupMemberIds]);
  const historyEntries = useMemo(() => historyLogs.map((log) => {
    const member = members.find((item) => item.name === log.targetName) || null;
    const memberTitle = member ? titleByMemberId.get(String(member.id)) : null;
    const flowerItems = extractFlowerNamesFromHistoryDetails(log.details).map((name) => ({ name, flower: flowers.find((flower) => normalizeFlowerLookupText(flower.name) === normalizeFlowerLookupText(name)) || null }));
    let summaryText = log.details || "";
    if (log.actionType === "update_ownership") summaryText = `Đã thêm ${flowerItems.length} hoa`;
    if (log.actionType === "remove_ownership") summaryText = `Đã gỡ ${flowerItems.length} hoa`;
    if (log.actionType === "create_account_identity") summaryText = "Đã tạo tài khoản cập nhật";
    if (log.actionType === "update_account_identity") summaryText = "Đã cập nhật tài khoản cập nhật";
    if (log.actionType === "delete_account_identity" || log.actionType === "remove_account_identity") summaryText = "Đã xoá tài khoản cập nhật";
    return { ...log, member, memberTitle, flowerItems, summaryText };
  }), [historyLogs, members, flowers, titleByMemberId]);
  const visibleHistoryEntries = useMemo(() => {
    if (isAdmin) return historyEntries;
    return historyEntries.filter((log) => String(log.targetType || "") !== "account_identity");
  }, [historyEntries, isAdmin]);
  const artFlowerMapByType = useMemo(() => ({ mainFlowerIds: artVaseForm.mainFlowerIds.map((id) => flowerById.get(String(id))).filter(Boolean), secondaryFlowerIds: artVaseForm.secondaryFlowerIds.map((id) => flowerById.get(String(id))).filter(Boolean), accentFlowerIds: artVaseForm.accentFlowerIds.map((id) => flowerById.get(String(id))).filter(Boolean) }), [artVaseForm, flowerById]);
  const filteredArtLookupMembers = useMemo(() => activeMembers.filter((member) => !artLookupMemberSearch.trim() || member.name.toLowerCase().includes(artLookupMemberSearch.trim().toLowerCase())).sort((a, b) => a.name.localeCompare(b.name, "vi")), [activeMembers, artLookupMemberSearch]);
  const selectedArtLookupMember = useMemo(() => activeMembers.find((member) => String(member.id) === String(artLookupMemberId)) || null, [activeMembers, artLookupMemberId]);
  const isGuildArtLookup = artLookupMemberId === "guild";
  const scopedArtOwnerships = useMemo(() => {
    if (isGuildArtLookup) return activeOwnerships;
    if (!selectedArtLookupMember) return [];
    return ownerships.filter((row) => String(row.memberId) === String(selectedArtLookupMember.id));
  }, [isGuildArtLookup, activeOwnerships, ownerships, selectedArtLookupMember]);
  const filteredArtFlowersByType = useMemo(() => {
    const build = (key) => {
      const q = normalizeFlowerLookupText(artFlowerSearchByType[key] || "");
      return flowers.filter((flower) => !q || normalizeFlowerLookupText(flower.name).includes(q)).sort((a, b) => a.name.localeCompare(b.name, "vi"));
    };
    return { mainFlowerIds: build("mainFlowerIds"), secondaryFlowerIds: build("secondaryFlowerIds"), accentFlowerIds: build("accentFlowerIds") };
  }, [flowers, artFlowerSearchByType]);
  const artUsedFlowerIds = useMemo(() => {
    const ids = new Set();
    artVases.forEach((vase) => [...vase.mainFlowerIds, ...vase.secondaryFlowerIds, ...vase.accentFlowerIds].forEach((id) => ids.add(String(id))));
    return ids;
  }, [artVases]);
  const artVaseStats = useMemo(() => {
    const scopedOwnedFlowerIds = new Set(scopedArtOwnerships.map((row) => String(row.flowerId)));
    const ownedFlowerIdsByMember = new Map();
    scopedArtOwnerships.forEach((row) => {
      const memberId = String(row.memberId);
      const set = ownedFlowerIdsByMember.get(memberId) || new Set();
      set.add(String(row.flowerId));
      ownedFlowerIdsByMember.set(memberId, set);
    });
    return artVases.map((vase) => {
      const mainIds = vase.mainFlowerIds.map(String);
      const secondaryIds = vase.secondaryFlowerIds.map(String);
      const accentIds = vase.accentFlowerIds.map(String);
      const totalCombos = mainIds.length && secondaryIds.length && accentIds.length ? mainIds.length * secondaryIds.length * accentIds.length : 0;
      const ownedComboKeys = new Set();
      ownedFlowerIdsByMember.forEach((memberOwnedIds) => {
        const ownedMainIds = mainIds.filter((id) => memberOwnedIds.has(id));
        const ownedSecondaryIds = secondaryIds.filter((id) => memberOwnedIds.has(id));
        const ownedAccentIds = accentIds.filter((id) => memberOwnedIds.has(id));
        if (!ownedMainIds.length || !ownedSecondaryIds.length || !ownedAccentIds.length) return;
        ownedMainIds.forEach((mainId) => ownedSecondaryIds.forEach((secondaryId) => ownedAccentIds.forEach((accentId) => ownedComboKeys.add(`${mainId}__${secondaryId}__${accentId}`))));
      });
      const uniqueFlowerIds = Array.from(new Set([...mainIds, ...secondaryIds, ...accentIds]));
      return { ...vase, totalCombos, ownedCombos: ownedComboKeys.size, ownedFlowerCount: uniqueFlowerIds.filter((id) => scopedOwnedFlowerIds.has(String(id))).length, totalFlowerCount: uniqueFlowerIds.length };
    });
  }, [artVases, scopedArtOwnerships]);
  const filteredArtVaseStats = useMemo(() => {
    const groupOrder = MEMBER_FLOWER_GROUP_ORDER.reduce((acc, group, index) => { acc[group] = index; return acc; }, {});
    return artVaseStats.filter((vase) => artDashboardGroupFilter === "all" || vase.vaseGroup === artDashboardGroupFilter).sort((a, b) => { const byGroup = (groupOrder[a.vaseGroup] ?? 99) - (groupOrder[b.vaseGroup] ?? 99); if (byGroup !== 0) return byGroup; return a.name.localeCompare(b.name, "vi"); });
  }, [artVaseStats, artDashboardGroupFilter]);
  const artSummary = useMemo(() => {
    const totalCombos = filteredArtVaseStats.reduce((sum, vase) => sum + vase.totalCombos, 0);
    const ownedCombos = filteredArtVaseStats.reduce((sum, vase) => sum + vase.ownedCombos, 0);
    return { totalCombos, ownedCombos, percent: totalCombos ? Math.round((ownedCombos / totalCombos) * 100) : 0 };
  }, [filteredArtVaseStats]);
  const artRareFlowers = useMemo(() => {
    const groupOrder = MEMBER_FLOWER_GROUP_ORDER.reduce((acc, group, index) => { acc[group] = index; return acc; }, {});
    const rows = [];
    artUsedFlowerIds.forEach((flowerId) => {
      const flower = flowerById.get(String(flowerId));
      if (!flower) return;
      const ownerCount = activeOwnersByFlower.get(String(flowerId))?.length || 0;
      if (ownerCount < 1 || ownerCount > 3) return;
      if (artRareFlowerGroupFilter !== "all" && flower.group !== artRareFlowerGroupFilter) return;
      const relatedVases = artVases.filter((vase) => [...vase.mainFlowerIds, ...vase.secondaryFlowerIds, ...vase.accentFlowerIds].includes(String(flowerId)));
      const filteredRelatedVases = relatedVases.filter((vase) => artDashboardGroupFilter === "all" || vase.vaseGroup === artDashboardGroupFilter);
      if (filteredRelatedVases.length === 0) return;
      rows.push({ flower, ownerCount, vaseNames: filteredRelatedVases.map((vase) => vase.name) });
    });
    return rows.sort((a, b) => { const byGroup = (groupOrder[a.flower.group] ?? 99) - (groupOrder[b.flower.group] ?? 99); if (byGroup !== 0) return byGroup; if (a.ownerCount !== b.ownerCount) return a.ownerCount - b.ownerCount; return a.flower.name.localeCompare(b.flower.name, "vi"); });
  }, [artUsedFlowerIds, flowerById, activeOwnersByFlower, artVases, artDashboardGroupFilter, artRareFlowerGroupFilter]);
  const artLookupSuggestions = useMemo(() => {
    const ownedIds = new Set(scopedArtOwnerships.map((row) => String(row.flowerId)));
    const map = new Map();
    artVases.forEach((vase) => {
      [...vase.mainFlowerIds, ...vase.secondaryFlowerIds, ...vase.accentFlowerIds].forEach((flowerId) => {
        if (ownedIds.has(String(flowerId))) return;
        const flower = flowerById.get(String(flowerId));
        if (!flower) return;
        const key = String(flower.id);
        const current = map.get(key) || { flower, vaseNames: [] };
        if (!current.vaseNames.includes(vase.name)) current.vaseNames.push(vase.name);
        map.set(key, current);
      });
    });
    const groupOrder = MEMBER_FLOWER_GROUP_ORDER.reduce((acc, group, index) => { acc[group] = index; return acc; }, {});
    return Array.from(map.values()).sort((a, b) => { const byGroup = (groupOrder[a.flower.group] ?? 99) - (groupOrder[b.flower.group] ?? 99); if (byGroup !== 0) return byGroup; return a.flower.name.localeCompare(b.flower.name, "vi"); });
  }, [scopedArtOwnerships, artVases, flowerById]);
  const filteredArtLookupSuggestions = useMemo(() => {
    const q = normalizeFlowerLookupText(artLookupSuggestionSearch);
    return artLookupSuggestions.filter((row) => !q || normalizeFlowerLookupText(row.flower.name).includes(q));
  }, [artLookupSuggestions, artLookupSuggestionSearch]);
  const artPriorityVarOwnerOptions = useMemo(() => {
    const ownerSet = new Set();
    artLookupSearchResults.forEach((row) => row.owners.forEach((owner) => ownerSet.add(owner)));
    const q = normalizeFlowerLookupText(artPriorityVarSearch);
    return Array.from(ownerSet).filter((owner) => !q || normalizeFlowerLookupText(owner).includes(q)).sort((a, b) => a.localeCompare(b, "vi"));
  }, [artLookupSearchResults, artPriorityVarSearch]);
  const statCardAssetByKey = useMemo(() => {
    const map = new Map();
    statCardAssets.forEach((item) => map.set(String(item.statKey), item));
    Object.entries(localStatCardAssetMap).forEach(([statKey, imageUrl]) => {
      if (imageUrl) map.set(String(statKey), { id: `local-${statKey}`, statKey: String(statKey), imageUrl: String(imageUrl) });
    });
    return map;
  }, [statCardAssets, localStatCardAssetMap]);
  const selectedGardenPackagePage = useMemo(() => gardenPackagePages.find((page) => String(page.pageNumber) === String(gardenPackageAdminPage)) || createDefaultGardenPackagePages()[0], [gardenPackagePages, gardenPackageAdminPage]);
  const filteredGardenPackageFlowers = useMemo(() => {
    const q = normalizeFlowerLookupText(gardenPackageFlowerSearch);
    return flowers.filter((flower) => !q || normalizeFlowerLookupText(flower.name).includes(q)).sort((a, b) => {
      const byGroup = MEMBER_FLOWER_GROUP_ORDER.indexOf(a.group) - MEMBER_FLOWER_GROUP_ORDER.indexOf(b.group);
      if (byGroup !== 0) return byGroup;
      return a.name.localeCompare(b.name, "vi");
    });
  }, [flowers, gardenPackageFlowerSearch]);
  const gardenPackageFlowerRows = useMemo(() => {
    return gardenPackagePages.map((page) => ({
      ...page,
      slots: GARDEN_PACKAGE_SLOT_LABELS.map((slot) => ({
        key: slot.key,
        label: slot.label,
        flowers: (page[slot.key] || []).map((id) => flowerById.get(String(id))).filter(Boolean),
      })),
    }));
  }, [gardenPackagePages, flowerById]);
  const gardenPackageFlowerList = useMemo(() => {
    const rows = [];
    gardenPackagePages.forEach((page) => {
      GARDEN_PACKAGE_SLOT_LABELS.forEach((slot) => {
        (page[slot.key] || []).forEach((flowerId) => {
          const flower = flowerById.get(String(flowerId));
          if (!flower) return;
          rows.push({
            flower,
            pageNumber: page.pageNumber,
            slotKey: slot.key,
            slotLabel: slot.label,
            ownerCount: activeOwnersByFlower.get(String(flower.id))?.length || 0,
          });
        });
      });
    });
    return rows;
  }, [gardenPackagePages, flowerById, activeOwnersByFlower]);
  const gardenPackagePageSuggestions = useMemo(() => {
    return gardenPackagePages.map((page) => {
      const slotFlowers = ["slot1", "slot2", "slot3"].map((slotKey) => (page[slotKey] || []).map((id) => flowerById.get(String(id))).filter(Boolean)).flat();
      const bonusFlowers = (page.fullPage || []).map((id) => flowerById.get(String(id))).filter(Boolean);
      return {
        pageNumber: page.pageNumber,
        slotFlowers,
        bonusFlowers,
      };
    });
  }, [gardenPackagePages, flowerById]);
  const filteredGardenPackageMembers = useMemo(() => activeMembers.filter((member) => !gardenPackageMemberSearch.trim() || member.name.toLowerCase().includes(gardenPackageMemberSearch.trim().toLowerCase())).sort((a, b) => a.name.localeCompare(b.name, "vi")), [activeMembers, gardenPackageMemberSearch]);
  const selectedGardenPackageMember = useMemo(() => activeMembers.find((member) => String(member.id) === String(gardenPackageSuggestionMemberId)) || null, [activeMembers, gardenPackageSuggestionMemberId]);
  const gardenPackageSuggestionResult = useMemo(() => {
    if (!selectedGardenPackageMember) return { message: "", rows: [], pageRows: [], highestGroup: "" };

    const ownedFlowers = ownerships
      .filter((row) => String(row.memberId) === String(selectedGardenPackageMember.id))
      .map((row) => flowerById.get(String(row.flowerId)))
      .filter(Boolean);

    const highestRank = ownedFlowers.reduce((max, flower) => Math.max(max, priorityRaceGroupRank(flower.group)), 0);
    const highestGroup = priorityRaceRankToGroup(highestRank);
    const ownedFlowerIds = new Set(ownedFlowers.map((flower) => String(flower.id)));

    const artVaseNamesByFlowerId = new Map();
    artVases.forEach((vase) => {
      [...vase.mainFlowerIds, ...vase.secondaryFlowerIds, ...vase.accentFlowerIds].forEach((flowerId) => {
        const key = String(flowerId);
        const list = artVaseNamesByFlowerId.get(key) || [];
        if (!list.includes(vase.name)) list.push(vase.name);
        artVaseNamesByFlowerId.set(key, list);
      });
    });

    let allowedGroups = [];
    let message = "";
    let pageModeDescription = "";

    if (highestGroup === "Đỏ 30") {
      allowedGroups = ["Vàng", "Tím"];
      message = "Bạn hiện đã sở hữu Hoa đỏ 30 - phẩm cao nhất nên mình sẽ gợi ý các hoa vàng và tím ít người sở hữu nhé";
      pageModeDescription = "";
    } else if (highestGroup === "Tím") {
      allowedGroups = [gardenPackagePurchasePurpose === "page" ? "Vàng" : "Tím"];
      pageModeDescription = gardenPackagePurchasePurpose === "page"
        ? "Bạn đang sở hữu phẩm cao nhất là Tím, nếu mua cả trang có hoa phẩm Vàng bạn sẽ sở hữu phẩm Vàng, vì bạn cần đua hội với phẩm hoa cao nhất nên mình sẽ gợi ý cho bạn các trang chỉ có phẩm Tím, nhưng các Trang như vậy không nhiều, nên mình sẽ gợi ý thêm các trang có nhiều hoa phẩm Vàng trong trường hợp bạn muốn nâng phẩm sở hữu"
        : "";
    } else if (highestGroup === "Vàng") {
      allowedGroups = ["Vàng"];
      pageModeDescription = "";
    } else if (highestGroup === "Đỏ") {
      allowedGroups = ["Vàng", "Tím"];
      message = "Bạn hiện đã sở hữu Hoa đỏ - phẩm Tiên nên việc sở hữu hoa vàng hay tím không có nhiều ý nghĩa cho đấu hội. Vì vậy tôi sẽ gợi ý cho bạn các hoa ít người sở hữu nhé";
      pageModeDescription = "";
    } else {
      allowedGroups = highestGroup ? [highestGroup] : ["Lục", "Lam", "Tím", "Vàng"];
      pageModeDescription = "Gợi ý các trang có số lượng hoa chưa sở hữu nhiều nhất.";
    }

    const filteredRows = gardenPackageFlowerList
      .filter((row) => !ownedFlowerIds.has(String(row.flower.id)))
      .filter((row) => allowedGroups.includes(row.flower.group))
      .map((row) => ({
        ...row,
        vaseNames: artVaseNamesByFlowerId.get(String(row.flower.id)) || [],
        isBonus: row.slotKey === "fullPage",
        bonusNote: row.slotKey === "fullPage" ? `Hoa Bonus của trang ${row.pageNumber}, cần mua cả trang để sở hữu` : "",
      }));

    const singleRows = [...filteredRows]
      .filter((row) => row.slotKey !== "fullPage")
      .sort((a, b) => {
      if (highestGroup === "Đỏ" || highestGroup === "Đỏ 30") {
        const groupRankDiff = priorityRaceGroupRank(b.flower.group) - priorityRaceGroupRank(a.flower.group);
        if (groupRankDiff !== 0) return groupRankDiff;
      }
      if (a.ownerCount !== b.ownerCount) return a.ownerCount - b.ownerCount;
      const pageDiff = a.pageNumber - b.pageNumber;
      if (pageDiff !== 0) return pageDiff;
      return a.flower.name.localeCompare(b.flower.name, "vi");
    });

    const pageRowsBase = gardenPackagePageSuggestions
      .map((page) => {
        const allSlotFlowers = page.slotFlowers.map((flower) => ({
          ...flower,
          ownerCount: activeOwnersByFlower.get(String(flower.id))?.length || 0,
          isOwned: ownedFlowerIds.has(String(flower.id)),
        }));
        const ownedSlotFlowers = allSlotFlowers.filter((flower) => flower.isOwned);
        const bonusFlowers = page.bonusFlowers.map((flower) => ({
          ...flower,
          ownerCount: activeOwnersByFlower.get(String(flower.id))?.length || 0,
          isOwned: ownedFlowerIds.has(String(flower.id)),
        }));
        const hasOwnedBonus = bonusFlowers.some((flower) => flower.isOwned);
        const missingPreferredFlowers = allSlotFlowers.filter((flower) => !flower.isOwned && allowedGroups.includes(flower.group));
        const missingPurpleFlowers = allSlotFlowers.filter((flower) => !flower.isOwned && flower.group === "Tím");
        const missingYellowFlowers = allSlotFlowers.filter((flower) => !flower.isOwned && flower.group === "Vàng");
        const ownerCounts = missingPreferredFlowers.map((flower) => flower.ownerCount || 0);
        const pageFlowerGroups = Array.from(new Set(allSlotFlowers.map((flower) => flower.group)));
        const hasOnlyPurpleSlots = allSlotFlowers.length > 0 && allSlotFlowers.every((flower) => flower.group === "Tím");
        return {
          pageNumber: page.pageNumber,
          allSlotFlowers,
          ownedSlotFlowers,
          bonusFlowers,
          hasOwnedBonus,
          matchedCount: missingPreferredFlowers.length,
          ownedCount: ownedSlotFlowers.length,
          minOwnerCount: ownerCounts.length ? Math.min(...ownerCounts) : 999,
          avgOwnerCount: ownerCounts.length ? ownerCounts.reduce((sum, value) => sum + value, 0) / ownerCounts.length : 999,
          missingPreferredFlowers,
          missingPurpleFlowers,
          missingYellowFlowers,
          pageFlowerGroups,
          hasOnlyPurpleSlots,
        };
      })
      .filter((page) => !page.hasOwnedBonus);

    let pageRows = [];
    if (highestGroup === "Tím" && gardenPackagePurchasePurpose === "page") {
      const purpleOnlyPages = pageRowsBase
        .filter((page) => page.hasOnlyPurpleSlots && page.missingPurpleFlowers.length > 0)
        .sort((a, b) => {
          if (b.ownedCount !== a.ownedCount) return b.ownedCount - a.ownedCount;
          if (b.missingPurpleFlowers.length !== a.missingPurpleFlowers.length) return b.missingPurpleFlowers.length - a.missingPurpleFlowers.length;
          return a.pageNumber - b.pageNumber;
        })
        .map((page) => ({
          ...page,
          matchedCount: page.missingPurpleFlowers.length,
          suggestionType: "purple_only",
        }));

      const yellowPages = pageRowsBase
        .filter((page) => page.missingYellowFlowers.length > 0)
        .sort((a, b) => {
          if (b.ownedCount !== a.ownedCount) return b.ownedCount - a.ownedCount;
          if (b.missingYellowFlowers.length !== a.missingYellowFlowers.length) return b.missingYellowFlowers.length - a.missingYellowFlowers.length;
          return a.pageNumber - b.pageNumber;
        })
        .map((page) => ({
          ...page,
          matchedCount: page.missingYellowFlowers.length,
          suggestionType: "yellow_upgrade",
        }));

      const usedPages = new Set(purpleOnlyPages.map((page) => page.pageNumber));
      pageRows = [...purpleOnlyPages, ...yellowPages.filter((page) => !usedPages.has(page.pageNumber))];
    } else {
      pageRows = pageRowsBase
        .filter((page) => page.matchedCount > 0)
        .sort((a, b) => {
          if (b.ownedCount !== a.ownedCount) return b.ownedCount - a.ownedCount;
          if (b.matchedCount !== a.matchedCount) return b.matchedCount - a.matchedCount;
          if (highestGroup === "Đỏ") {
            if (a.minOwnerCount !== b.minOwnerCount) return a.minOwnerCount - b.minOwnerCount;
            if (a.avgOwnerCount !== b.avgOwnerCount) return a.avgOwnerCount - b.avgOwnerCount;
          }
          return a.pageNumber - b.pageNumber;
        })
        .map((page) => ({
          ...page,
          suggestionType: "default",
        }));
    }

    return { message, pageModeDescription, rows: singleRows, pageRows, highestGroup };
  }, [selectedGardenPackageMember, ownerships, flowerById, gardenPackageFlowerList, gardenPackagePageSuggestions, activeOwnersByFlower, artVases, gardenPackagePurchasePurpose]);

  async function signInAsAdmin() {
    setLoginMessage("");
    if (!loginNickname.trim() || !loginPassword.trim()) return setLoginMessage("Vui lòng nhập nickname và mật khẩu.");
    setLoggingIn(true);
    try {
      let resolvedEmail = "";
      const rawLogin = loginNickname.trim();
      if (rawLogin.includes("@")) resolvedEmail = rawLogin.toLowerCase();
      else {
        const identity = await getAccountIdentityByNickname(rawLogin);
        if (!identity?.email) {
          setLoggingIn(false);
          return setLoginMessage("Không tìm thấy nickname này. Hãy kiểm tra lại hoặc dùng email cũ để đăng nhập trong lúc chuyển đổi.");
        }
        resolvedEmail = identity.email;
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email: resolvedEmail, password: loginPassword });
      if (error) return setLoginMessage(`Đăng nhập thất bại: ${error.message}`);
      const email = data.user?.email?.toLowerCase() || "";
      const profile = await getAccountAccessProfileForEmail(email);
      const hardcodedAdmin = ADMIN_EMAILS.map((item) => item.toLowerCase()).includes(email);
      const allowedAdmin = hardcodedAdmin || profile?.role === "admin";
      const allowedManager = profile?.role === "manager";
      const allowedEditor = profile?.role === "member_editor" && Array.isArray(profile?.memberIds) && profile.memberIds.length > 0;
      if (!allowedAdmin && !allowedManager && !allowedEditor) {
        await supabase.auth.signOut({ scope: "local" });
        setUser(null);
        setCurrentAccountProfile(null);
        return setLoginMessage("Tài khoản này chưa được phân quyền. Guest không cần đăng nhập và chỉ có quyền xem/tra cứu.");
      }
      setCurrentAccountProfile(hardcodedAdmin ? null : profile);
      saveAccountProfileToStorage(hardcodedAdmin ? null : profile);
      setUser(data.user || null);
      setLoginPassword("");
      setAdminDialogOpen(false);
    } catch (error) {
      setLoginMessage(`Đăng nhập thất bại: ${error?.message || "Lỗi không xác định"}`);
    } finally {
      setLoggingIn(false);
    }
  }
  async function signOutAdmin() {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await supabase.auth.signOut({ scope: "local" }); } catch {}
    setUser(null);
    setCurrentAccountProfile(null);
    saveAccountProfileToStorage(null);
    setLoginMessage("");
    setLoginPassword("");
    setLoginNickname("");
    setLoggingOut(false);
  }
  async function logAction({ actionType, actorName = "Hệ thống", targetType, targetName, details = "" }) {
    const payload = { action_type: actionType, actor_name: actorName, target_type: targetType, target_name: targetName, details };
    const { data, error } = await supabase.from("action_logs").insert([payload]).select("id, action_type, actor_name, target_type, target_name, details, created_at").single();
    if (error) return;
    const nextLog = { id: String(data.id), actionType: data.action_type || "", actorName: data.actor_name || "Hệ thống", targetType: data.target_type || "", targetName: data.target_name || "", details: data.details || "", createdAt: data.created_at || new Date().toISOString() };
    setHistoryLogs((prev) => [nextLog, ...prev.filter((item) => String(item.id) !== String(nextLog.id))].slice(0, 50));
    setHistoryLoaded(true);
  }
  async function addFlowerToDatabase() {
    if (!canManageMembers) return;
    setFlowerCreateMessage("");
    const name = newFlowerName.trim();
    if (!name || !newFlowerGroup) return setFlowerCreateMessage("Vui lòng nhập đủ tên hoa và nhóm hoa.");
    if (flowers.some((f) => normalizeFlowerLookupText(f.name) === normalizeFlowerLookupText(name))) return setFlowerCreateMessage("Loại hoa này đã tồn tại.");
    setSavingFlower(true);
    const { data, error } = await supabase.from("flowers").insert([{ name, group_name: newFlowerGroup, icon_url: newFlowerIconUrl.trim() || null }]).select("id, name").single();
    setSavingFlower(false);
    if (error) return setFlowerCreateMessage(`Không thêm được hoa mới: ${error.message}`);
    await logAction({ actionType: "add_flower", actorName: user?.email || "Quản trị hội", targetType: "flower", targetName: data.name, details: `Thêm hoa mới vào nhóm ${newFlowerGroup}` });
    await refreshCoreDataSilently();
    setNewFlowerName("");
    setNewFlowerIconUrl("");
    setNewFlowerGroup("Lục");
    setFlowerCreateMessage(`Đã thêm hoa mới: ${data.name}.`);
  }
  useEffect(() => {
    if (isRestrictedEditor && restrictedMemberIds.length > 0) {
      setNewMemberName("");
      if (!restrictedMemberIds.includes(String(selectedExistingMemberId))) setSelectedExistingMemberId(String(restrictedMemberIds[0]));
    }
  }, [isRestrictedEditor, restrictedMemberIds, selectedExistingMemberId]);
  async function createMemberFromMembersTab() {
    if (!canManageMembers) return;
    const name = String(createMemberName || "").trim().split(" ").filter(Boolean).join(" ");
    const birthYearText = String(createMemberBirthYear || "").trim();
    const genderText = String(createMemberGender || "").trim();
    setCreateMemberMessage("");
    if (!name) return setCreateMemberMessage("Vui lòng nhập tên tài khoản.");
    if (members.some((member) => normalizeFlowerLookupText(member.name) === normalizeFlowerLookupText(name))) return setCreateMemberMessage("Thành viên này đã tồn tại.");
    setSavingNewMember(true);
    const payload = { name, birth_year: birthYearText ? Number(birthYearText) : null, gender: genderText || null, left_guild: false, show_in_lookup: false };
    const { data, error } = await supabase.from("members").insert([payload]).select("id, name").single();
    setSavingNewMember(false);
    if (error) return setCreateMemberMessage("Không tạo được thành viên mới: " + error.message);
    await logAction({ actionType: "create_member", actorName: user?.email || "Quản trị hội", targetType: "member", targetName: data?.name || name, details: "Tạo thành viên mới" });
    setCreateMemberName("");
    setCreateMemberBirthYear("");
    setCreateMemberGender("");
    setCreateMemberMessage("Đã tạo thành viên mới.");
    setCreateMemberDialogOpen(false);
    await refreshCoreDataSilently({ includeTitles: true, includeHistory: historyLoaded, includeSpiritHunt: spiritHuntLoaded, includePriorityRace: priorityRaceLoaded });
    broadcastOwnershipRefresh("member_created");
  }
  async function getOrCreateMember() {
    if (isRestrictedEditor) {
      if (!selectedExistingMemberId || selectedExistingMemberId === "none") return { error: "Hãy chọn thành viên được cấp quyền cập nhật." };
      if (!restrictedMemberIds.includes(String(selectedExistingMemberId))) return { error: "Tài khoản này không có quyền cập nhật cho thành viên đã chọn." };
      const restrictedMember = members.find((m) => String(m.id) === String(selectedExistingMemberId));
      if (!restrictedMember) return { error: "Không tìm thấy thành viên được cấp quyền cập nhật." };
      return { member: restrictedMember };
    }
    if (selectedExistingMemberId !== "none") {
      const member = members.find((m) => String(m.id) === selectedExistingMemberId);
      if (!member) return { error: "Không tìm thấy thành viên đã chọn." };
      return { member };
    }
    return { error: "Hãy chọn thành viên cần cập nhật." };
  }
  function toggleFlowerSelection(flowerId) { setSelectedFlowerIds((prev) => prev.includes(String(flowerId)) ? prev.filter((id) => id !== String(flowerId)) : [...prev, String(flowerId)]); }
  function toggleRemovalFlowerSelection(flowerId) { setSelectedRemovalFlowerIds((prev) => prev.includes(String(flowerId)) ? prev.filter((id) => id !== String(flowerId)) : [...prev, String(flowerId)]); }
  async function saveOwnershipUpdate() {
    if (!canAccessOwnershipUpdate) return;
    setUpdateMessage("");
    if (selectedFlowerIds.length === 0) return setUpdateMessage("Hãy chọn ít nhất 1 loại hoa.");
    setSavingOwnership(true);
    const memberResult = await getOrCreateMember();
    if (memberResult.error) { setSavingOwnership(false); return setUpdateMessage(memberResult.error); }
    const member = memberResult.member;
    const alreadyOwned = new Set(ownerships.filter((o) => String(o.memberId) === String(member.id)).map((o) => String(o.flowerId)));
    const additions = [...new Set(selectedFlowerIds)].filter((flowerId) => !alreadyOwned.has(String(flowerId))).map((flowerId) => ({ member_id: member.id, flower_id: flowerId }));
    if (additions.length === 0) { setSavingOwnership(false); return setUpdateMessage(`${member.name} đã có sẵn toàn bộ các hoa được chọn.`); }
    const { error } = await supabase.from("member_flowers").upsert(additions, { onConflict: "member_id,flower_id", ignoreDuplicates: true });
    setSavingOwnership(false);
    if (error) return setUpdateMessage(`Không lưu được cập nhật sở hữu: ${error.message}`);
    await logAction({ actionType: "update_ownership", actorName: user?.email || member.name, targetType: "member", targetName: member.name, details: `Thêm ${additions.length} hoa: ${additions.map((item) => flowerById.get(String(item.flower_id))?.name || item.flower_id).join(", ")}` });
    setSelectedFlowerIds([]);
    setSelectedExistingMemberId("none");
    setNewMemberName("");
    setUpdateMessage(`Đã cập nhật ${additions.length} loại hoa mới cho ${member.name}.`);
    await refreshCoreDataSilently({ includeTitles: true, includeHistory: historyLoaded, includeSpiritHunt: spiritHuntLoaded, includePriorityRace: priorityRaceLoaded });
    broadcastOwnershipRefresh("ownership_added");
  }
  async function removeOwnershipFromMember() {
    if (!canAccessOwnershipUpdate || !selectedExistingMember) return;
    if (selectedRemovalFlowerIds.length === 0) return setUpdateMessage("Hãy chọn ít nhất 1 loại hoa cần gỡ.");
    setSavingOwnership(true);
    const { data, error } = await supabase.from("member_flowers").delete().eq("member_id", selectedExistingMember.id).in("flower_id", selectedRemovalFlowerIds).select("id, flower_id");
    setSavingOwnership(false);
    if (error) return setUpdateMessage(`Không gỡ được hoa khỏi thành viên: ${error.message}`);
    const removedFlowerIds = [...new Set((data || []).map((row) => String(row.flower_id)))];
    await logAction({ actionType: "remove_ownership", actorName: user?.email || "Quản trị hội", targetType: "member", targetName: selectedExistingMember.name, details: `Gỡ ${removedFlowerIds.length} hoa: ${removedFlowerIds.map((id) => flowerById.get(id)?.name || id).join(", ")}` });
    setSelectedRemovalFlowerIds([]);
    setUpdateMessage(`Đã gỡ ${removedFlowerIds.length} loại hoa khỏi ${selectedExistingMember.name}.`);
    await refreshCoreDataSilently({ includeTitles: true, includeHistory: historyLoaded, includeSpiritHunt: spiritHuntLoaded, includePriorityRace: priorityRaceLoaded });
    broadcastOwnershipRefresh("ownership_removed");
  }
  async function renameMember(memberId, payload) {
    const trimmed = String(payload?.name || "").trim();
    if (!trimmed) return { ok: false, message: "Tên thành viên không được để trống." };
    const { error } = await supabase.from("members").update({ name: trimmed, birth_year: payload?.birthYear ?? null, gender: payload?.gender || null, left_guild: Boolean(payload?.leftGuild), show_in_lookup: Boolean(payload?.showInLookup) }).eq("id", memberId);
    if (error) return { ok: false, message: `Không sửa được thông tin thành viên: ${error.message}` };
    await refreshCoreDataSilently({ includeTitles: true, includeHistory: historyLoaded, includeSpiritHunt: spiritHuntLoaded, includePriorityRace: priorityRaceLoaded });
    broadcastOwnershipRefresh("member_changed");
    return { ok: true, message: "Đã cập nhật thông tin thành viên." };
  }
  async function restoreFormerMember(member) {
    if (!canManageSpiritHunt) return;
    const { error } = await supabase.from("members").update({ left_guild: false, show_in_lookup: false }).eq("id", member.id);
    if (error) return;
    await logAction({ actionType: "restore_member", actorName: user?.email || "Quản trị hội", targetType: "member", targetName: member.name, details: "Cho thành viên vào hội lại" });
    await refreshCoreDataSilently();
  }
  async function toggleFormerMemberLookup(member) {
    if (!isAdmin || !isFormerMember(member)) return;
    const nextValue = !Boolean(member.showInLookup);
    const { error } = await supabase.from("members").update({ show_in_lookup: nextValue }).eq("id", member.id);
    if (error) return;
    await logAction({ actionType: "toggle_former_member_lookup", actorName: user?.email || "Quản trị hội", targetType: "member", targetName: member.name, details: nextValue ? "Bật danh sách hoa cho mục tra cứu" : "Tắt danh sách hoa cho mục tra cứu" });
    await refreshCoreDataSilently({ includeTitles: true, includeHistory: historyLoaded, includeSpiritHunt: spiritHuntLoaded, includePriorityRace: priorityRaceLoaded });
    broadcastOwnershipRefresh("member_changed");
  }
  async function renameFlower(flowerId, payload) {
    const trimmedName = String(payload?.name || "").trim();
    if (!trimmedName || !payload?.group) return { ok: false, message: "Tên hoa và nhóm hoa không được để trống." };
    const { error } = await supabase.from("flowers").update({ name: trimmedName, group_name: payload.group, icon_url: payload.iconUrl?.trim() || null }).eq("id", flowerId);
    if (error) return { ok: false, message: `Không sửa được hoa: ${error.message}` };
    await refreshCoreDataSilently({ includeTitles: true, includeHistory: historyLoaded, includeSpiritHunt: spiritHuntLoaded, includePriorityRace: priorityRaceLoaded });
    broadcastOwnershipRefresh("flower_changed");
    return { ok: true, message: "Đã cập nhật thông tin hoa." };
  }
  function toggleTitleMember(memberId) { setSelectedTitleMemberIds((prev) => prev.includes(String(memberId)) ? prev.filter((id) => id !== String(memberId)) : [...prev, String(memberId)]); }
  async function addTitleToDatabase() {
    if (!canManageTitles || !titleFeatureAvailable) return;
    const name = newTitleName.trim();
    if (!name) return setTitleMessage("Vui lòng nhập tên chức danh.");
    if (titles.some((title) => title.name.toLowerCase() === name.toLowerCase())) return setTitleMessage("Chức danh này đã tồn tại.");
    setSavingTitle(true);
    const { data, error } = await supabase.from("titles").insert([{ name }]).select("id, name").single();
    setSavingTitle(false);
    if (error) return setTitleMessage(`Không thêm được chức danh: ${error.message}`);
    await logAction({ actionType: "add_title", actorName: user?.email || "Quản trị hội", targetType: "title", targetName: data.name, details: "Thêm chức danh mới" });
    setNewTitleName("");
    setTitleMessage(`Đã thêm chức danh: ${data.name}.`);
    await refreshCoreDataSilently({ includeTitles: true });
  }
  async function saveTitleAssignments() {
    if (!canManageTitles || !titleFeatureAvailable) return;
    if (selectedTitleId === "none") return setTitleMessage("Vui lòng chọn chức danh cần trao.");
    if (selectedTitleMemberIds.length === 0) return setTitleMessage("Vui lòng chọn ít nhất 1 thành viên.");
    setSavingTitle(true);
    const rows = selectedTitleMemberIds.map((memberId) => ({ member_id: String(memberId), title_id: String(selectedTitleId) }));
    const { error } = await supabase.from("member_titles").upsert(rows, { onConflict: "member_id" });
    setSavingTitle(false);
    if (error) return setTitleMessage(`Không lưu được chức danh: ${error.message}`);
    setSelectedTitleId("none");
    setSelectedTitleMemberIds([]);
    setTitleMessage("Đã lưu trao chức danh.");
    await refreshCoreDataSilently({ includeTitles: true });
  }
  async function removeTitleFromMember(titleId, memberId) {
    if (!canManageTitles || !titleFeatureAvailable) return;
    const { error } = await supabase.from("member_titles").delete().eq("title_id", titleId).eq("member_id", memberId);
    if (error) return setTitleMessage(`Không gỡ được chức danh: ${error.message}`);
    setTitleMessage("Đã gỡ chức danh khỏi thành viên.");
    await refreshCoreDataSilently({ includeTitles: true });
  }
  function updateSpiritHuntSlot(slotKey, updater) { setSpiritHuntSlots((prev) => prev.map((slot) => (slot.slotKey === slotKey ? { ...slot, ...updater(slot) } : slot))); }
  function toggleSpiritHuntMember(slotKey, memberId) { updateSpiritHuntSlot(slotKey, (slot) => ({ memberIds: slot.memberIds.includes(String(memberId)) ? slot.memberIds.filter((id) => id !== String(memberId)) : [...slot.memberIds, String(memberId)] })); }
  async function saveSpiritHuntSlots() {
    if (!canManageSpiritHunt) return;
    setSavingSpiritHunt(true);
    const payload = spiritHuntSlots.map((slot) => ({ slot_key: slot.slotKey, title: String(slot.title || "").trim() || slot.title, time_label: String(slot.timeLabel || "").trim(), member_ids: slot.memberIds.map(String) }));
    const { error } = await supabase.from("spirit_hunt_slots").upsert(payload, { onConflict: "slot_key" });
    setSavingSpiritHunt(false);
    if (error) return setSpiritHuntMessage(`Không lưu được săn hoa linh: ${error.message}`);
    setSpiritHuntMessage("Đã cập nhật danh sách săn hoa linh.");
    await loadSpiritHuntData();
  }
  function togglePriorityRaceFlower(flowerId) { setPriorityRaceForm((prev) => ({ ...prev, flowerIds: prev.flowerIds.includes(String(flowerId)) ? prev.flowerIds.filter((id) => id !== String(flowerId)) : [...prev.flowerIds, String(flowerId)] })); }
  async function rebuildPriorityRaceFromHighestQuality() {
    if (!isAdmin) return;
    const completedSet = new Set(completedMemberIds.map(String));
    const ownershipFlowerIdsByMember = new Map();
    activeOwnerships.forEach((row) => {
      const memberId = String(row.memberId);
      const list = ownershipFlowerIdsByMember.get(memberId) || [];
      list.push(String(row.flowerId));
      ownershipFlowerIdsByMember.set(memberId, list);
    });
    const rebuiltEntries = activeMembers.map((member) => {
      if (completedSet.has(String(member.id))) return null;
      const ownedFlowerIds = ownershipFlowerIdsByMember.get(String(member.id)) || [];
      const ownedFlowers = ownedFlowerIds.map((flowerId) => flowerById.get(String(flowerId))).filter(Boolean);
      if (ownedFlowers.length === 0) return null;
      const highestRank = ownedFlowers.reduce((max, flower) => Math.max(max, priorityRaceGroupRank(flower.group)), 0);
      if (highestRank <= 0) return null;
      const selectedRanks = new Set([highestRank]);
      if (twoGroupMemberIdSet.has(String(member.id)) && highestRank > 1) selectedRanks.add(highestRank - 1);
      const selectedFlowers = ownedFlowers.filter((flower) => selectedRanks.has(priorityRaceGroupRank(flower.group))).sort((a, b) => {
        const byRank = priorityRaceGroupRank(a.group) - priorityRaceGroupRank(b.group);
        if (byRank !== 0) return byRank;
        return a.name.localeCompare(b.name, "vi");
      });
      if (selectedFlowers.length === 0) return null;
      return { id: `auto-${member.id}`, memberId: String(member.id), flowerIds: selectedFlowers.map((flower) => String(flower.id)), highestGroupRank: highestRank, flowerCount: selectedFlowers.length, memberName: member.name };
    }).filter(Boolean).sort((a, b) => { if (a.highestGroupRank !== b.highestGroupRank) return a.highestGroupRank - b.highestGroupRank; if (a.flowerCount !== b.flowerCount) return a.flowerCount - b.flowerCount; return a.memberName.localeCompare(b.memberName, "vi"); }).map(({ id, memberId, flowerIds }) => ({ id, memberId, flowerIds }));
    setSavingPriorityRace(true);
    const { error } = await persistPriorityRaceConfig(rebuiltEntries, oneQuestMemberIds, completedMemberIds, twoGroupMemberIds);
    setSavingPriorityRace(false);
    if (error) return setPriorityRaceMessage(`Không cập nhật được danh sách ưu tiên đua hội: ${error.message}`);
    await logAction({ actionType: "rebuild_priority_race", actorName: user?.email || "Quản trị hội", targetType: "priority_race", targetName: "Ưu tiên đua hội", details: `Làm mới tự động ${rebuiltEntries.length} account theo phẩm hoa cao nhất` });
    setPriorityRaceEntries(rebuiltEntries);
    setPriorityRaceMessage(`Đã cập nhật lại danh sách ưu tiên đua hội cho ${rebuiltEntries.length} account.`);
  }
  async function savePriorityRace() {
    if (!isAdmin) return;
    if (!priorityRaceForm.memberId || priorityRaceForm.memberId === "none") return setPriorityRaceMessage("Hãy chọn thành viên ưu tiên.");
    if (priorityRaceForm.flowerIds.length === 0) return setPriorityRaceMessage("Hãy chọn ít nhất 1 hoa ưu tiên.");
    setSavingPriorityRace(true);
    const existingIndex = priorityRaceEntries.findIndex((entry) => String(entry.memberId) === String(priorityRaceForm.memberId));
    const existingFlowerIds = existingIndex >= 0 ? priorityRaceEntries[existingIndex].flowerIds.map(String) : [];
    const mergedFlowerIds = Array.from(new Set([...existingFlowerIds, ...priorityRaceForm.flowerIds.map(String)]));
    const nextEntry = { id: existingIndex >= 0 ? priorityRaceEntries[existingIndex].id : `${priorityRaceForm.memberId}-${Date.now()}`, memberId: String(priorityRaceForm.memberId), flowerIds: mergedFlowerIds };
    const nextEntries = existingIndex >= 0 ? priorityRaceEntries.map((entry, index) => (index === existingIndex ? nextEntry : entry)) : [...priorityRaceEntries, nextEntry];
    const { error } = await persistPriorityRaceConfig(nextEntries);
    setSavingPriorityRace(false);
    if (error) return setPriorityRaceMessage(`Không lưu được ưu tiên đua hội: ${error.message}`);
    const savedMember = memberById.get(String(priorityRaceForm.memberId));
    const addedFlowerNames = priorityRaceForm.flowerIds.map((id) => flowerById.get(String(id))?.name).filter(Boolean);
    await logAction({ actionType: "update_priority_race", actorName: user?.email || "Quản trị hội", targetType: "priority_race", targetName: savedMember?.name || "Ưu tiên đua hội", details: `${savedMember?.name || "Không rõ thành viên"} thêm ưu tiên ${addedFlowerNames.join(", ")}` });
    setPriorityRaceEntries(nextEntries);
    setPriorityRaceForm(DEFAULT_PRIORITY_RACE_FORM);
    setPriorityRaceFlowerSearch("");
    setPriorityRaceSelectedFlowerSearch("");
    setPriorityRaceGroupFilter("all");
    setPriorityRaceMemberSearch("");
    setPriorityRaceMessage(`Đã cộng thêm hoa ưu tiên cho ${savedMember?.name || "Không rõ thành viên"}.`);
  }
  async function removePriorityRaceEntry(entryId) {
    if (!isAdmin) return;
    const nextEntries = priorityRaceEntries.filter((entry) => String(entry.id) !== String(entryId));
    setSavingPriorityRace(true);
    const { error } = await persistPriorityRaceConfig(nextEntries);
    setSavingPriorityRace(false);
    if (error) return setPriorityRaceMessage(`Không xoá được mục ưu tiên đua hội: ${error.message}`);
    setPriorityRaceEntries(nextEntries);
    setPriorityRaceMessage("Đã xoá một mục ưu tiên đua hội.");
  }
  async function removePriorityRaceFlowerFromEntry(entryId, flowerId) {
    if (!isAdmin) return;
    const currentEntry = priorityRaceEntries.find((entry) => String(entry.id) === String(entryId));
    if (!currentEntry) return;
    const nextEntries = priorityRaceEntries.map((entry) => String(entry.id) !== String(entryId) ? entry : { ...entry, flowerIds: entry.flowerIds.filter((id) => String(id) !== String(flowerId)) }).filter((entry) => entry.flowerIds.length > 0);
    setSavingPriorityRace(true);
    const { error } = await persistPriorityRaceConfig(nextEntries);
    setSavingPriorityRace(false);
    if (error) return setPriorityRaceMessage(`Không gỡ được hoa khỏi ưu tiên đua hội: ${error.message}`);
    const member = memberById.get(String(currentEntry.memberId));
    const flower = flowerById.get(String(flowerId));
    await logAction({ actionType: "remove_priority_race_flower", actorName: user?.email || "Quản trị hội", targetType: "priority_race", targetName: member?.name || "Ưu tiên đua hội", details: `Gỡ hoa ưu tiên ${flower?.name || flowerId}` });
    setPriorityRaceEntries(nextEntries);
    setPriorityRaceMessage(`Đã gỡ ${flower?.name || "1 hoa"} khỏi danh sách ưu tiên.`);
  }
  async function addNextPriorityRaceGroup(entryId) {
    if (!isAdmin) return;
    const currentEntry = priorityRaceEntries.find((entry) => String(entry.id) === String(entryId));
    if (!currentEntry) return;
    const member = memberById.get(String(currentEntry.memberId));
    if (!member) return;
    const currentFlowers = currentEntry.flowerIds.map((id) => flowerById.get(String(id))).filter(Boolean);
    if (currentFlowers.length === 0) return;
    const currentLowestRank = currentFlowers.reduce((min, flower) => {
      const rank = priorityRaceGroupRank(flower.group);
      return min === 0 ? rank : Math.min(min, rank);
    }, 0);
    const nextRank = currentLowestRank - 1;
    const nextGroup = priorityRaceRankToGroup(nextRank);
    if (!nextGroup) return setPriorityRaceMessage(`${member.name} không còn phẩm thấp hơn để thêm.`);
    const memberOwnedFlowerIds = new Set(ownerships.filter((row) => String(row.memberId) === String(member.id)).map((row) => String(row.flowerId)));
    const nextGroupFlowerIds = flowers.filter((flower) => memberOwnedFlowerIds.has(String(flower.id)) && flower.group === nextGroup).sort((a, b) => a.name.localeCompare(b.name, "vi")).map((flower) => String(flower.id));
    if (nextGroupFlowerIds.length === 0) return setPriorityRaceMessage(`${member.name} không có hoa phẩm ${nextGroup} để thêm.`);
    const mergedFlowerIds = Array.from(new Set([...currentEntry.flowerIds.map(String), ...nextGroupFlowerIds]));
    const nextEntries = priorityRaceEntries.map((entry) => (String(entry.id) === String(entryId) ? { ...entry, flowerIds: mergedFlowerIds } : entry));
    setSavingPriorityRace(true);
    const { error } = await persistPriorityRaceConfig(nextEntries);
    setSavingPriorityRace(false);
    if (error) return setPriorityRaceMessage(`Không thêm được phẩm cho ưu tiên đua hội: ${error.message}`);
    await logAction({ actionType: "add_priority_race_group", actorName: user?.email || "Quản trị hội", targetType: "priority_race", targetName: member.name, details: `Thêm phẩm ${nextGroup} cho ưu tiên đua hội` });
    setPriorityRaceEntries(nextEntries);
    setPriorityRaceMessage(`Đã thêm phẩm ${nextGroup} cho ${member.name}.`);
  }
  function setArtVaseFormFromVase(vase) {
    setArtVaseForm({ name: vase?.name || "", iconUrl: vase?.iconUrl || "", vaseGroup: vase?.vaseGroup || "Lục", mainFlowerIds: vase?.mainFlowerIds || [], secondaryFlowerIds: vase?.secondaryFlowerIds || [], accentFlowerIds: vase?.accentFlowerIds || [] });
  }
  function toggleArtVaseFlower(key, flowerId) {
    setArtVaseForm((prev) => {
      const current = prev[key].map(String);
      const id = String(flowerId);
      if (current.includes(id)) return { ...prev, [key]: current.filter((item) => item !== id) };
      if (current.length >= 3) return prev;
      return { ...prev, [key]: [...current, id] };
    });
  }
  async function uploadArtVaseIcon(file) {
    if (!canManageArt || !file) return;
    setUploadingArtVaseIcon(true);
    setArtVaseMessage("");
    try {
      const extension = String(file.name || "png").split(".").pop()?.toLowerCase() || "png";
      const safeExt = extension.replace(/[^a-z0-9]/g, "") || "png";
      const filePath = `vase-icons/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;
      const { error: uploadError } = await supabase.storage.from(FLOWER_ICON_BUCKET).upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (uploadError) { setArtVaseMessage(`Không tải được icon bình: ${uploadError.message}`); return; }
      const { data } = supabase.storage.from(FLOWER_ICON_BUCKET).getPublicUrl(filePath);
      const publicUrl = data?.publicUrl || "";
      if (!publicUrl) { setArtVaseMessage("Đã tải ảnh lên nhưng không lấy được URL công khai."); return; }
      setArtVaseForm((prev) => ({ ...prev, iconUrl: publicUrl }));
      setArtVaseMessage("Đã tải icon bình lên thành công.");
    } catch (error) {
      setArtVaseMessage(`Không tải được icon bình: ${error?.message || "Lỗi không xác định"}`);
    } finally {
      setUploadingArtVaseIcon(false);
    }
  }
  async function uploadStatCardAsset(statKey, file) {
    if (!isAdmin || !file || !statKey) return;
    setUploadingStatCardKey(String(statKey));
    setStatCardAssetMessage("");
    try {
      const extension = String(file.name || "png").split(".").pop()?.toLowerCase() || "png";
      const safeExt = extension.replace(/[^a-z0-9]/g, "") || "png";
      const filePath = `dashboard-stats/${statKey}-${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;
      const { error: uploadError } = await supabase.storage.from(FLOWER_ICON_BUCKET).upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (uploadError) { setStatCardAssetMessage(`Không tải được ảnh: ${uploadError.message}`); return; }
      const { data: publicData } = supabase.storage.from(FLOWER_ICON_BUCKET).getPublicUrl(filePath);
      const publicUrl = publicData?.publicUrl || "";
      if (!publicUrl) { setStatCardAssetMessage("Đã tải ảnh lên nhưng không lấy được URL công khai."); return; }
      const { error: saveError } = await supabase.from("dashboard_stat_assets").upsert([{ stat_key: statKey, image_url: publicUrl }], { onConflict: "stat_key" });
      if (saveError) {
        if (String(saveError.message || "").toLowerCase().includes("row-level security")) {
          setLocalStatCardAssetMap((prev) => ({ ...prev, [String(statKey)]: publicUrl }));
          setStatCardAssetMessage("Ảnh đã upload lên storage và đang hiển thị tạm trên giao diện, nhưng chưa lưu được vào database vì bảng dashboard_stat_assets đang bị Row Level Security chặn. Cần thêm policy cho bảng này trong Supabase.");
          return;
        }
        setStatCardAssetMessage(`Không lưu được ảnh vào database: ${saveError.message}`);
        return;
      }
      setLocalStatCardAssetMap((prev) => {
        const next = { ...prev };
        delete next[String(statKey)];
        return next;
      });
      await logAction({ actionType: "update_dashboard_stat_asset", actorName: user?.email || "Quản trị hội", targetType: "dashboard_stat_asset", targetName: statKey, details: "Cập nhật ảnh ô thống kê" });
      setStatCardAssetMessage("Đã tải và lưu ảnh ô thống kê.");
      await loadStatCardAssetsData();
    } catch (error) {
      setStatCardAssetMessage(`Không tải được ảnh: ${error?.message || "Lỗi không xác định"}`);
    } finally {
      setUploadingStatCardKey("");
    }
  }
  async function uploadFlowerIcon(flowerId, file) {
    if (!canManageFlowers || !file || !flowerId) return { ok: false, message: "Thiếu dữ liệu tải icon." };
    setUploadingFlowerIconId(String(flowerId));
    try {
      const extension = String(file.name || "png").split(".").pop()?.toLowerCase() || "png";
      const safeExt = extension.replace(/[^a-z0-9]/g, "") || "png";
      const filePath = `icons/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;
      const { error: uploadError } = await supabase.storage.from(FLOWER_ICON_BUCKET).upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (uploadError) return { ok: false, message: `Không tải được icon: ${uploadError.message}` };
      const { data } = supabase.storage.from(FLOWER_ICON_BUCKET).getPublicUrl(filePath);
      const publicUrl = data?.publicUrl || "";
      if (!publicUrl) return { ok: false, message: "Đã tải ảnh lên nhưng không lấy được URL công khai." };
      return { ok: true, url: publicUrl, message: "Đã tải icon lên thành công." };
    } catch (error) {
      return { ok: false, message: `Không tải được icon: ${error?.message || "Lỗi không xác định"}` };
    } finally {
      setUploadingFlowerIconId("");
    }
  }
  async function removeStatCardAsset(statKey) {
    if (!isAdmin || !statKey) return;
    const hasLocalOnly = Boolean(localStatCardAssetMap[String(statKey)]);
    if (hasLocalOnly) {
      setLocalStatCardAssetMap((prev) => {
        const next = { ...prev };
        delete next[String(statKey)];
        return next;
      });
      setStatCardAssetMessage("Đã xoá ảnh tạm trên giao diện. Ảnh này trước đó chưa lưu được vào database vì bị RLS chặn.");
      return;
    }
    const { error } = await supabase.from("dashboard_stat_assets").delete().eq("stat_key", statKey);
    if (error) {
      if (String(error.message || "").toLowerCase().includes("row-level security")) {
        setStatCardAssetMessage("Không xoá được ảnh trong database vì bảng dashboard_stat_assets đang bị Row Level Security chặn.");
        return;
      }
      setStatCardAssetMessage(`Không xoá được ảnh: ${error.message}`);
      return;
    }
    await logAction({ actionType: "remove_dashboard_stat_asset", actorName: user?.email || "Quản trị hội", targetType: "dashboard_stat_asset", targetName: statKey, details: "Xoá ảnh ô thống kê" });
    setStatCardAssetMessage("Đã xoá ảnh ô thống kê.");
    await loadStatCardAssetsData();
  }
  async function saveArtVase() {
    if (!canManageArt) return;
    const name = String(artVaseForm.name || "").trim();
    if (!name) return setArtVaseMessage("Vui lòng nhập tên bình hoa.");
    setSavingArtVase(true);
    const payload = { name, icon_url: String(artVaseForm.iconUrl || "").trim() || null, vase_group: artVaseForm.vaseGroup || "Lục", main_flower_ids: artVaseForm.mainFlowerIds.map(String), secondary_flower_ids: artVaseForm.secondaryFlowerIds.map(String), accent_flower_ids: artVaseForm.accentFlowerIds.map(String) };
    const query = selectedArtVaseId !== "new" ? supabase.from("art_vases").update(payload).eq("id", selectedArtVaseId) : supabase.from("art_vases").insert([payload]);
    const { error } = await query;
    setSavingArtVase(false);
    if (error) return setArtVaseMessage(`Không lưu được bình hoa: ${error.message}`);
    await logAction({ actionType: selectedArtVaseId !== "new" ? "update_art_vase" : "create_art_vase", actorName: user?.email || "Quản trị hội", targetType: "art_vase", targetName: name, details: `Phẩm ${payload.vase_group} • Chính ${payload.main_flower_ids.length} / Phụ ${payload.secondary_flower_ids.length} / Kèm ${payload.accent_flower_ids.length}` });
    setArtVaseMessage(selectedArtVaseId !== "new" ? "Đã cập nhật bình hoa." : "Đã tạo bình hoa mới.");
    setSelectedArtVaseId("new");
    setArtVaseForm(DEFAULT_ART_VASE_FORM);
    await loadArtVasesData();
  }
  async function deleteArtVase() {
    if (!canManageArt || selectedArtVaseId === "new") return;
    setSavingArtVase(true);
    const currentVase = artVases.find((item) => String(item.id) === String(selectedArtVaseId));
    const { error } = await supabase.from("art_vases").delete().eq("id", selectedArtVaseId);
    setSavingArtVase(false);
    if (error) return setArtVaseMessage(`Không xoá được bình hoa: ${error.message}`);
    await logAction({ actionType: "delete_art_vase", actorName: user?.email || "Quản trị hội", targetType: "art_vase", targetName: currentVase?.name || "Bình hoa", details: "Xoá bình hoa nghệ thuật" });
    setSelectedArtVaseId("new");
    setArtVaseForm(DEFAULT_ART_VASE_FORM);
    setArtVaseMessage("Đã xoá bình hoa.");
    await loadArtVasesData();
  }
  function toggleArtSuggestionFlower(flowerId) { setArtSelectedSuggestionFlowerIds((prev) => prev.includes(String(flowerId)) ? prev.filter((id) => id !== String(flowerId)) : [...prev, String(flowerId)]); }
  function runArtSuggestionSearch() {
    const selectedIds = new Set(artSelectedSuggestionFlowerIds.map(String));
    const results = filteredArtLookupSuggestions.filter((row) => selectedIds.has(String(row.flower.id))).map((row) => ({ ...row, owners: (ownersByFlower.get(String(row.flower.id)) || []).slice().sort((a, b) => a.localeCompare(b, "vi")) }));
    setArtLookupSearchResults(results);
    setArtVarSuggestions([]);
  }
  function runArtVarSuggestion() {
    const priorityOwnerSet = new Set(artPriorityVarOwners.map(String));
    const ownerMap = new Map();
    artLookupSearchResults.forEach((row) => {
      row.owners.forEach((owner) => {
        const current = ownerMap.get(owner) || { owner, flowers: [] };
        if (!current.flowers.some((item) => String(item.id) === String(row.flower.id))) current.flowers.push(row.flower);
        ownerMap.set(owner, current);
      });
    });
    const sortedOwners = Array.from(ownerMap.values()).map((item) => ({ ...item, flowers: item.flowers.sort((a, b) => { const byGroup = (MEMBER_FLOWER_GROUP_ORDER.indexOf(a.group) ?? 99) - (MEMBER_FLOWER_GROUP_ORDER.indexOf(b.group) ?? 99); if (byGroup !== 0) return byGroup; return a.name.localeCompare(b.name, "vi"); }) })).sort((a, b) => { const aPriority = priorityOwnerSet.has(String(a.owner)) ? 0 : 1; const bPriority = priorityOwnerSet.has(String(b.owner)) ? 0 : 1; if (aPriority !== bPriority) return aPriority - bPriority; if (b.flowers.length !== a.flowers.length) return b.flowers.length - a.flowers.length; return a.owner.localeCompare(b.owner, "vi"); });
    const assignedFlowerIds = new Set();
    const grouped = sortedOwners.map((item) => ({ ...item, flowers: item.flowers.filter((flower) => { const key = String(flower.id); if (assignedFlowerIds.has(key)) return false; assignedFlowerIds.add(key); return true; }) })).filter((item) => item.flowers.length > 0);
    setArtVarSuggestions(grouped);
  }
  function toggleArtPriorityVarOwner(owner) { setArtPriorityVarOwners((prev) => prev.includes(String(owner)) ? prev.filter((item) => item !== String(owner)) : [...prev, String(owner)]); }
  async function toggleOneQuestMember(memberId) {
    if (!canManagePriorityRace) return;
    const id = String(memberId);
    const nextOneQuest = oneQuestMemberIds.includes(id) ? oneQuestMemberIds.filter((item) => String(item) !== id) : [...oneQuestMemberIds, id];
    const nextCompleted = completedMemberIds.filter((item) => String(item) !== id);
    const { error } = await persistPriorityRaceConfig(priorityRaceEntries, nextOneQuest, nextCompleted, twoGroupMemberIds);
    if (error) return setPriorityRaceMessage(`Không lưu được danh sách còn 1 quest: ${error.message}`);
    setOneQuestMemberIds(nextOneQuest);
    setCompletedMemberIds(nextCompleted);
    broadcastOwnershipRefresh("priority_race_meta_changed");
  }
  async function toggleCompletedMember(memberId) {
    if (!canManagePriorityRace) return;
    const id = String(memberId);
    const isRemoving = completedMemberIds.includes(id);
    const nextCompleted = isRemoving ? completedMemberIds.filter((item) => String(item) !== id) : [...completedMemberIds, id];
    const nextOneQuest = oneQuestMemberIds.filter((item) => String(item) !== id);
    const nextTwoGroup = twoGroupMemberIds.filter((item) => String(item) !== id);
    const nextEntries = isRemoving ? priorityRaceEntries : priorityRaceEntries.filter((entry) => String(entry.memberId) !== id);
    const { error } = await persistPriorityRaceConfig(nextEntries, nextOneQuest, nextCompleted, nextTwoGroup);
    if (error) return setPriorityRaceMessage(`Không lưu được danh sách hoàn thành: ${error.message}`);
    setCompletedMemberIds(nextCompleted);
    setOneQuestMemberIds(nextOneQuest);
    setTwoGroupMemberIds(nextTwoGroup);
    setPriorityRaceEntries(nextEntries);
    broadcastOwnershipRefresh("priority_race_meta_changed");
    if (!isRemoving && String(priorityRaceForm.memberId) === id) setPriorityRaceForm(DEFAULT_PRIORITY_RACE_FORM);
  }
  async function toggleTwoGroupMember(memberId) {
    if (!(isAdmin || isManager)) return;
    const id = String(memberId);
    const nextTwoGroup = twoGroupMemberIds.includes(id) ? twoGroupMemberIds.filter((item) => String(item) !== id) : [...twoGroupMemberIds, id];
    const { error } = await persistPriorityRaceConfig(priorityRaceEntries, oneQuestMemberIds, completedMemberIds, nextTwoGroup);
    if (error) return setPriorityRaceMessage(`Không lưu được danh sách đua 2 phẩm: ${error.message}`);
    setTwoGroupMemberIds(nextTwoGroup);
    broadcastOwnershipRefresh("priority_race_meta_changed");
  }
  async function clearOneQuestMembers() {
    if (!canManagePriorityRace) return;
    const { error } = await persistPriorityRaceConfig(priorityRaceEntries, [], completedMemberIds, twoGroupMemberIds);
    if (error) return setPriorityRaceMessage(`Không xoá được danh sách còn 1 quest: ${error.message}`);
    setOneQuestMemberIds([]);
    broadcastOwnershipRefresh("priority_race_meta_changed");
  }
  async function clearCompletedMembers() {
    if (!canManagePriorityRace) return;
    const { error } = await persistPriorityRaceConfig(priorityRaceEntries, oneQuestMemberIds, [], twoGroupMemberIds);
    if (error) return setPriorityRaceMessage(`Không xoá được danh sách hoàn thành: ${error.message}`);
    setCompletedMemberIds([]);
    broadcastOwnershipRefresh("priority_race_meta_changed");
  }
  async function clearTwoGroupMembers() {
    if (!(isAdmin || isManager)) return;
    const { error } = await persistPriorityRaceConfig(priorityRaceEntries, oneQuestMemberIds, completedMemberIds, []);
    if (error) return setPriorityRaceMessage(`Không xoá được danh sách đua 2 phẩm: ${error.message}`);
    setTwoGroupMemberIds([]);
    broadcastOwnershipRefresh("priority_race_meta_changed");
  }

  const visibleTabs = [
    { value: "dashboard", label: "Tổng quan" },
    { value: "members", label: "Thành viên" },
    { value: "flowerlookup", label: "Tra cứu theo hoa" },
    { value: "memberflowerlookup", label: "Tra cứu theo thành viên" },
    ...(canAccessOwnershipUpdate ? [{ value: "update", label: "Cập nhật sở hữu" }] : []),
    ...(canManageTitles ? [{ value: "titlemanagement", label: "Quản lý chức danh" }] : []),
    { value: "addflower", label: "Hoa nghệ thuật" },
    { value: "gardenpackage", label: "Gói Vườn Hoa" },
    { value: "history", label: "Lịch sử" },
    { value: "spirithunt", label: "Hoa linh/Đấu hội" },
    ...(canAccessAdminPanel ? [{ value: "adminpanel", label: "Quản trị" }] : []),
  ];

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-8"><div className="mx-auto max-w-7xl rounded-3xl border bg-white p-8 text-slate-600 space-y-3"><div>Đang tải dữ liệu...</div><div className="text-sm text-slate-500">Canvas sẽ tự mở giao diện sau vài giây kể cả khi Supabase phản hồi chậm.</div></div></div>;
  }

  const artVaseManagementCard = canManageArt ? (
    <Card className="rounded-[28px]">
      <CardHeader><CardTitle>Tạo và quản lý bình hoa</CardTitle></CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <div className="space-y-2"><Label>Chọn bình hoa</Label><Select value={selectedArtVaseId} onValueChange={(value) => { setSelectedArtVaseId(value); const vase = artVases.find((item) => String(item.id) === String(value)); if (vase) setArtVaseFormFromVase(vase); else setArtVaseForm(DEFAULT_ART_VASE_FORM); }}><SelectContent><SelectItem value="new">+ Tạo bình hoa mới</SelectItem>{artVases.map((vase) => (<SelectItem key={vase.id} value={String(vase.id)}>{vase.name} • {vase.vaseGroup || "Lục"}</SelectItem>))}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Tên bình hoa</Label><Input value={artVaseForm.name} onChange={(e) => setArtVaseForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Ví dụ: Bình trăng tím" /></div>
          <div className="space-y-2"><Label>Icon bình</Label><Input value={artVaseForm.iconUrl} onChange={(e) => setArtVaseForm((prev) => ({ ...prev, iconUrl: e.target.value }))} placeholder="https://..." /></div>
          <div className="space-y-2"><Label>Phẩm bình</Label><Select value={artVaseForm.vaseGroup} onValueChange={(value) => setArtVaseForm((prev) => ({ ...prev, vaseGroup: value }))}><SelectContent>{MEMBER_FLOWER_GROUP_ORDER.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}</SelectContent></Select></div>
          <div className="grid gap-2"><Button onClick={saveArtVase} disabled={savingArtVase}>{savingArtVase ? "Đang lưu..." : selectedArtVaseId === "new" ? "Tạo bình hoa" : "Cập nhật bình hoa"}</Button>{selectedArtVaseId !== "new" ? <Button variant="outline" onClick={deleteArtVase} disabled={savingArtVase}>Xoá bình hoa</Button> : null}</div>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {[{ key: "mainFlowerIds", title: "Hoa chính" }, { key: "secondaryFlowerIds", title: "Hoa phụ" }, { key: "accentFlowerIds", title: "Hoa kèm" }].map((section) => (
            <div key={section.key} className="rounded-3xl border p-4">
              <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{section.title}</h3><Badge variant="secondary">{artVaseForm[section.key].length}/3</Badge></div>
              <div className="relative mb-3"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={artFlowerSearchByType[section.key]} onChange={(e) => setArtFlowerSearchByType((prev) => ({ ...prev, [section.key]: e.target.value }))} placeholder={`Tìm ${section.title.toLowerCase()}...`} className="pl-9" /></div>
              <ScrollArea className="h-[360px] pr-3"><div className="space-y-3">{filteredArtFlowersByType[section.key].map((flower) => { const checked = artVaseForm[section.key].includes(String(flower.id)); const blocked = !checked && artVaseForm[section.key].length >= 3; return (<label key={`${section.key}-${flower.id}`} className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border p-3", blocked ? "opacity-50" : "hover:bg-slate-50")}><Checkbox checked={checked} disabled={blocked} onCheckedChange={() => toggleArtVaseFlower(section.key, flower.id)} /><FlowerThumbnail flower={flower} size="sm" /><div className="min-w-0 flex-1"><p className="font-medium break-words">{flower.name}</p></div><Badge className={groupBadgeClass(flower.group)}>{flower.group}</Badge></label>); })}</div></ScrollArea>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  ) : null;

  const gardenPackageManagementCard = isAdmin ? (
    <Card className="rounded-[28px]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Quản lý Gói Vườn Hoa</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={gardenPackageAdminPage} onValueChange={setGardenPackageAdminPage}>
              <SelectContent>{Array.from({ length: 15 }, (_, index) => <SelectItem key={`garden-page-${index + 1}`} value={String(index + 1)}>{`Trang ${index + 1}`}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={() => saveGardenPackageData(gardenPackagePages)} disabled={savingGardenPackage}>{savingGardenPackage ? "Đang lưu..." : "Lưu"}</Button>
          </div>
        </div>
        {gardenPackageMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{gardenPackageMessage}</div> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div>
          <Input value={gardenPackageFlowerSearch} onChange={(e) => setGardenPackageFlowerSearch(e.target.value)} placeholder="Tìm hoa để thêm vào gói vườn hoa..." className="pl-9" />
        </div>
        <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
          <div className="rounded-3xl border p-4">
            <div className="mb-3 flex items-center justify-between"><Label>{`Trang ${selectedGardenPackagePage.pageNumber}`}</Label><Badge variant="secondary">4 ô</Badge></div>
            <div className="space-y-3">{GARDEN_PACKAGE_SLOT_LABELS.map((slot) => { const selectedFlowers = (selectedGardenPackagePage[slot.key] || []).map((id) => flowerById.get(String(id))).filter(Boolean); return <div key={`garden-admin-slot-${slot.key}`} className="rounded-2xl border p-3"><div className="mb-2 flex items-center justify-between gap-2"><p className="font-semibold text-sm">{slot.label}</p><Badge variant="secondary">{selectedFlowers.length} hoa</Badge></div><div className="flex flex-wrap gap-2">{selectedFlowers.length === 0 ? <span className="text-xs text-slate-400">Chưa chọn hoa</span> : selectedFlowers.map((flower) => <div key={`garden-admin-picked-${slot.key}-${flower.id}`} className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-[12px]"><span>{flower.name}</span><Badge className={groupBadgeClass(flower.group)}>{flower.group}</Badge></div>)}</div></div>; })}</div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {GARDEN_PACKAGE_SLOT_LABELS.map((slot) => <div key={`garden-admin-selector-${slot.key}`} className="rounded-3xl border p-4"><div className="mb-3 flex items-center justify-between"><Label>{slot.label}</Label><Badge variant="secondary">{(selectedGardenPackagePage[slot.key] || []).length} hoa</Badge></div><ScrollArea className="h-[300px] pr-3"><div className="space-y-2.5">{filteredGardenPackageFlowers.map((flower) => { const checked = (selectedGardenPackagePage[slot.key] || []).includes(String(flower.id)); return <label key={`garden-admin-${slot.key}-${flower.id}`} className="flex cursor-pointer items-start gap-3 rounded-2xl border p-3 hover:bg-slate-50"><Checkbox checked={checked} onCheckedChange={() => toggleGardenPackageFlower(selectedGardenPackagePage.pageNumber, slot.key, flower.id)} /><FlowerThumbnail flower={flower} size="sm" /><div className="min-w-0 flex-1"><p className="font-medium break-words">{flower.name}</p></div><Badge className={groupBadgeClass(flower.group)}>{flower.group}</Badge></label>; })}</div></ScrollArea></div>)}
          </div>
        </div>
      </CardContent>
    </Card>
  ) : null;

  const adminPanelContent = (
    <div className="space-y-4">
      <Card className="rounded-[28px]">
        <CardHeader>
          <CardTitle>Quản lý tài khoản cập nhật</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4 rounded-3xl border p-4">
            <p className="text-sm text-slate-600">Tạo liên kết email - nickname - thành viên. Một email-nickname có thể chỉnh sửa nhiều thành viên. Nickname là duy nhất và được dùng để đăng nhập.</p>
            <div className="rounded-2xl border bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p className="font-semibold">Mật khẩu tạo thủ công trong Supabase Auth</p>
              <p className="mt-1">Web này hiện chỉ quản lý liên kết <span className="font-semibold">email - nickname - thành viên</span>. Mật khẩu chưa tạo trực tiếp trong web. Sau khi lưu liên kết ở đây, hãy vào <span className="font-semibold">Supabase Authentication &gt; Users</span> để tạo user bằng đúng email đó và đặt mật khẩu thủ công.</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span>{editingAccountEmail ? `Đang sửa tài khoản: ${editingAccountEmail}` : "Đang ở chế độ tạo tài khoản cập nhật mới"}</span>
              {editingAccountEmail ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingAccountEmail("");
                    setPermissionEmailInput("");
                    setPermissionNicknameInput("");
                    setPermissionRoleInput("member_editor");
                    setPermissionMemberIds([]);
                    setPermissionMemberSearch("");
                    setAccountPermissionMessage("Đã thoát chế độ sửa tài khoản.");
                  }}
                >
                  Huỷ sửa
                </Button>
              ) : null}
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_220px]">
              <div className="space-y-2">
                <Label>Email tài khoản</Label>
                <Input value={permissionEmailInput} onChange={(e) => setPermissionEmailInput(e.target.value)} placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Nickname đăng nhập</Label>
                <Input value={permissionNicknameInput} onChange={(e) => setPermissionNicknameInput(e.target.value)} placeholder="nickname duy nhất" />
              </div>
              <div className="space-y-2">
                <Label>Vai trò</Label>
                <Select value={permissionRoleInput} onValueChange={setPermissionRoleInput}>
                  <SelectContent>
                    <SelectItem value="member_editor">Tài khoản cập nhật</SelectItem>
                    <SelectItem value="manager">Tài khoản Manager</SelectItem>
                    <SelectItem value="admin">Tài khoản Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Chọn nhiều thành viên được phép chỉnh sửa</Label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div>
                <Input value={permissionMemberSearch} onChange={(e) => setPermissionMemberSearch(e.target.value)} placeholder="Tìm thành viên..." className="pl-9" />
              </div>
              <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                <ScrollArea className="h-[260px] rounded-3xl border p-3 pr-2">
                  <div className="space-y-2.5">
                    {activeMembers
                      .filter((member) => !permissionMemberSearch.trim() || member.name.toLowerCase().includes(permissionMemberSearch.trim().toLowerCase()))
                      .sort((a, b) => a.name.localeCompare(b.name, "vi"))
                      .map((member) => {
                        const checked = permissionMemberIds.includes(String(member.id));
                        const memberTitle = titleByMemberId.get(String(member.id));
                        return (
                          <label key={`permission-member-${member.id}`} className="flex cursor-pointer items-start gap-2.5 rounded-2xl border p-3 hover:bg-slate-50">
                            <Checkbox checked={checked} onCheckedChange={() => setPermissionMemberIds((prev) => prev.includes(String(member.id)) ? prev.filter((id) => id !== String(member.id)) : [...prev, String(member.id)])} />
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-[13px] font-medium leading-snug">{member.name}</p>
                                </div>
                                {hasTitleName(memberTitle) ? <Badge className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </ScrollArea>
                <div className="space-y-3 rounded-3xl border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Đã chọn</Label>
                    <Badge variant="secondary">{permissionMemberIds.length} thành viên</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {permissionMemberIds.length === 0 ? <span className="text-sm text-slate-400">Chưa chọn thành viên nào.</span> : permissionMemberIds.map((memberId) => {
                      const member = memberById.get(String(memberId));
                      const memberTitle = titleByMemberId.get(String(memberId));
                      return <div key={`permission-picked-${memberId}`} className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-[12px]"><span>{member?.name || memberId}</span>{hasTitleName(memberTitle) ? <Badge className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div>;
                    })}
                  </div>
                  <Button
                    disabled={savingAccountPermission}
                    onClick={async () => {
                      const email = String(permissionEmailInput || "").trim().toLowerCase();
                      const nickname = String(permissionNicknameInput || "").trim();
                      if (!email) return setAccountPermissionMessage("Vui lòng nhập email tài khoản.");
                      if (!nickname) return setAccountPermissionMessage("Vui lòng nhập nickname đăng nhập.");
                      if (permissionRoleInput === "member_editor" && permissionMemberIds.length === 0) return setAccountPermissionMessage("Tài khoản cập nhật cần chọn ít nhất 1 thành viên được phép cập nhật.");
                      setSavingAccountPermission(true);
                      const existingConflict = accountIdentities.find((item) => item.nickname.trim().toLowerCase() === nickname.trim().toLowerCase() && item.email !== email);
                      if (existingConflict) {
                        setSavingAccountPermission(false);
                        return setAccountPermissionMessage("Nickname này đã được dùng cho tài khoản khác.");
                      }
                      const identityUpsert = await supabase.from("account_identities").upsert([{ email, nickname, role: permissionRoleInput }], { onConflict: "email" });
                      if (identityUpsert.error) {
                        setSavingAccountPermission(false);
                        return setAccountPermissionMessage(`Không lưu được email-nickname: ${identityUpsert.error.message}`);
                      }
                      const deleteOld = await supabase.from("account_member_permissions").delete().eq("account_email", email);
                      if (deleteOld.error) {
                        setSavingAccountPermission(false);
                        return setAccountPermissionMessage(`Không cập nhật được danh sách thành viên: ${deleteOld.error.message}`);
                      }
                      let insertRows = { error: null };
                      if (permissionRoleInput === "member_editor" && permissionMemberIds.length > 0) {
                        insertRows = await supabase.from("account_member_permissions").insert(permissionMemberIds.map((memberId) => ({ account_email: email, member_id: memberId })));
                      }
                      setSavingAccountPermission(false);
                      if (insertRows.error) return setAccountPermissionMessage(`Không lưu được thành viên được phép cập nhật: ${insertRows.error.message}`);
                      await logAction({ actionType: editingAccountEmail ? "update_account_identity" : "create_account_identity", actorName: user?.email || "Quản trị hội", targetType: "account_identity", targetName: nickname, details: `${email} • ${permissionRoleInput === "member_editor" ? `${permissionMemberIds.length} thành viên` : permissionRoleInput === "manager" ? "Tài khoản Manager" : "Tài khoản Admin"}` });
                      setAccountPermissionMessage(editingAccountEmail ? "Đã cập nhật phân quyền tài khoản. Hãy kiểm tra user và mật khẩu thủ công trong Supabase Auth nếu cần." : "Đã lưu phân quyền tài khoản. Tiếp theo hãy tạo user/mật khẩu thủ công trong Supabase Auth bằng đúng email này.");
                      setEditingAccountEmail("");
                      setPermissionEmailInput("");
                      setPermissionNicknameInput("");
                      setPermissionMemberIds([]);
                      setPermissionMemberSearch("");
                      await loadAccountPermissionsData();
                    }}
                  >
                    {savingAccountPermission ? "Đang lưu..." : editingAccountEmail ? "Cập nhật tài khoản" : "Lưu liên kết"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {accountPermissionMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{accountPermissionMessage}</div> : null}<div className="space-y-3">
            {accountIdentities.length === 0 ? <SectionEmpty>Chưa có tài khoản cập nhật nào được cấp quyền.</SectionEmpty> : accountIdentities.map((identity) => {
              const linkedMemberIds = accountMemberPermissions.filter((row) => row.accountEmail === identity.email).map((row) => String(row.memberId));
              return (
                <div key={identity.id} className="flex flex-col gap-3 rounded-2xl border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{identity.nickname}</p>
                        <Badge className={identity.role === "admin" ? "border-rose-200 bg-rose-50 text-rose-700" : identity.role === "manager" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}>
                          {identity.role === "admin" ? "Tài khoản Admin" : identity.role === "manager" ? "Tài khoản Manager" : "Tài khoản cập nhật"}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">{identity.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{linkedMemberIds.length} thành viên</Badge>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingAccountEmail(identity.email);
                          setPermissionEmailInput(identity.email);
                          setPermissionNicknameInput(identity.nickname);
                          setPermissionRoleInput(identity.role || "member_editor");
                          setPermissionMemberIds(linkedMemberIds);
                          setPermissionMemberSearch("");
                          setAccountPermissionMessage(`Đã nạp dữ liệu tài khoản ${identity.nickname} để chỉnh sửa ở form phía trên.`);
                          window.requestAnimationFrame(() => {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          });
                        }}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          const deletePermissions = await supabase.from("account_member_permissions").delete().eq("account_email", identity.email);
                          if (deletePermissions.error) return setAccountPermissionMessage(`Không xoá được quyền thành viên: ${deletePermissions.error.message}`);
                          const deleteIdentity = await supabase.from("account_identities").delete().eq("email", identity.email);
                          if (deleteIdentity.error) return setAccountPermissionMessage(`Không xoá được email-nickname: ${deleteIdentity.error.message}`);
                          await logAction({ actionType: "delete_account_identity", actorName: user?.email || "Quản trị hội", targetType: "account_identity", targetName: identity.nickname || identity.email, details: `${identity.email} • Xoá liên kết email-nickname-thành viên` });
                          setAccountPermissionMessage("Đã xoá tài khoản cập nhật.");
                          await loadAccountPermissionsData();
                        }}
                      >
                        Xoá
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {linkedMemberIds.length === 0 ? <span className="text-sm text-slate-400">Chưa liên kết thành viên nào.</span> : linkedMemberIds.map((memberId) => {
                      const member = memberById.get(String(memberId));
                      const memberTitle = titleByMemberId.get(String(memberId));
                      return <div key={`${identity.id}-${memberId}`} className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-[12px]"><span>{member?.name || memberId}</span>{hasTitleName(memberTitle) ? <Badge className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div>;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[28px]">
        <CardHeader>
          <CardTitle>Sửa tiêu đề đầu trang</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Dòng chữ lớn đang hiển thị ngoài đầu trang.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_140px] md:items-end">
            <div className="space-y-2">
              <Label>Tiêu đề</Label>
              <Input value={siteHeaderTitleInput} onChange={(e) => setSiteHeaderTitleInput(e.target.value)} placeholder="Quản Lý Hoa Hội SELINA" />
            </div>
            <Button onClick={saveSiteHeaderTitle}>Lưu tiêu đề</Button>
          </div>
          <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-600">Đang hiển thị: <span className="font-semibold text-slate-900">{siteHeaderTitle}</span></div>
          {siteSettingsMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{siteSettingsMessage}</div> : null}
        </CardContent>
      </Card>

      <Card className="rounded-[28px]">
        <CardHeader>
          <CardTitle>Thêm và quản lý hoa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
            <div className="space-y-4 rounded-3xl border p-4">
              <div className="space-y-2">
                <Label>Tên hoa mới</Label>
                <Input value={newFlowerName} onChange={(e) => setNewFlowerName(e.target.value)} placeholder="Nhập tên hoa..." />
              </div>
              <div className="space-y-2">
                <Label>Nhóm hoa</Label>
                <Select value={newFlowerGroup} onValueChange={setNewFlowerGroup}>
                  <SelectContent>
                    {FLOWER_GROUPS.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Icon URL</Label>
                <Input value={newFlowerIconUrl} onChange={(e) => setNewFlowerIconUrl(e.target.value)} placeholder="https://..." />
              </div>
              <Button className="w-full" onClick={addFlowerToDatabase} disabled={savingFlower}>{savingFlower ? "Đang thêm..." : "Thêm hoa mới"}</Button>
              {flowerCreateMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{flowerCreateMessage}</div> : null}
            </div>
            <div className="rounded-3xl border p-4">
              <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div>
                  <Input value={flowerManageSearch} onChange={(e) => setFlowerManageSearch(e.target.value)} placeholder="Tìm hoa..." className="pl-9" />
                </div>
                <Select value={flowerManageGroupFilter} onValueChange={setFlowerManageGroupFilter}>
                  <SelectContent>
                    <SelectItem value="all">Tất cả nhóm</SelectItem>
                    {FLOWER_GROUPS.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <ScrollArea className="h-[520px] pr-3">
                <div className="space-y-3">
                  {filteredManageFlowers.map((flower) => (
                    <div key={`admin-manage-${flower.id}`} className="flex items-center justify-between gap-3 rounded-2xl border p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <FlowerThumbnail flower={flower} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium break-words">{flower.name}</p>
                          <Badge className={`${groupBadgeClass(flower.group)} mt-1`}>{flower.group}</Badge>
                        </div>
                      </div>
                      <Dialog open={flowerEditDialogOpenId === `flower-${flower.id}`} onOpenChange={(open) => setFlowerEditDialogOpenId(open ? `flower-${flower.id}` : null)}>
                        <DialogTrigger asChild><Button variant="outline" size="sm">Sửa hoa</Button></DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Sửa hoa</DialogTitle></DialogHeader>
                          <EditFlowerForm flower={flower} uploadingIcon={uploadingFlowerIconId === String(flower.id)} onUploadIcon={(file) => uploadFlowerIcon(flower.id, file)} onSave={async (payload) => { const result = await renameFlower(flower.id, payload); if (result?.ok) setFlowerEditDialogOpenId(null); return result; }} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>

      {artVaseManagementCard}

      {canManageTitles ? (
        <Card className="rounded-[28px]">
          <CardHeader>
            <CardTitle>Thêm chức danh mới</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Tạo chức danh mới để sử dụng trong TAG Quản lý chức danh.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_180px] md:items-end">
              <div className="space-y-2">
                <Label>Tên chức danh</Label>
                <Input value={newTitleName} onChange={(e) => setNewTitleName(e.target.value)} placeholder="Ví dụ: Trưởng nhóm" />
              </div>
              <Button onClick={addTitleToDatabase} disabled={savingTitle}><PlusIcon className="mr-2 h-4 w-4" />Thêm chức danh</Button>
            </div>
            {titleMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{titleMessage}</div> : null}
          </CardContent>
        </Card>
      ) : null}

      {gardenPackageManagementCard}

      <Card className="rounded-[28px]">
        <CardHeader>
          <CardTitle>Ảnh đầu trang và 4 ô thống kê</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Chỉ tài khoản admin nhìn thấy phần quản trị này. Ảnh sau khi lưu sẽ hiển thị cho tất cả mọi người ngoài trang chính.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[{ key: "hero", label: "Icon to đầu trang" }, { key: "members", label: "Thành viên" }, { key: "flowers", label: "Tổng loại hoa" }, { key: "owned", label: "Hội đã sở hữu" }, { key: "missing", label: "Hội còn thiếu" }].map((item) => {
              const currentAsset = statCardAssetByKey.get(item.key);
              return (
                <div key={item.key} className="space-y-3 rounded-3xl border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Label>{item.label}</Label>
                    <Badge variant="secondary">{currentAsset?.imageUrl ? "Đã có ảnh" : "Chưa có ảnh"}</Badge>
                  </div>
                  <div className="relative flex h-20 items-center justify-center overflow-hidden rounded-2xl border bg-slate-50">
                    {currentAsset?.imageUrl ? <img src={currentAsset.imageUrl} alt={item.label} className="absolute inset-0 h-full w-full object-cover" /> : <span className="text-xs text-slate-400">Chưa có ảnh</span>}
                  </div>
                  <label className="block">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadStatCardAsset(item.key, file); e.target.value = ""; }} />
                    <span className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">{uploadingStatCardKey === item.key ? "Đang tải ảnh..." : "Upload ảnh"}</span>
                  </label>
                  {currentAsset?.imageUrl ? <Button variant="outline" className="w-full" onClick={() => removeStatCardAsset(item.key)}>Xoá ảnh</Button> : null}
                </div>
              );
            })}
          </div>
          {statCardAssetMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{statCardAssetMessage}</div> : null}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden antialiased text-slate-900 p-4 md:p-8" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(120deg,#eff6ff_0%,#eef2ff_22%,#f5f3ff_45%,#ecfeff_68%,#eff6ff_100%)] bg-[length:220%_220%] animate-[gradientShift_14s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-80 bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.22),transparent_26%),radial-gradient(circle_at_82%_22%,rgba(168,85,247,0.18),transparent_28%),radial-gradient(circle_at_50%_78%,rgba(34,197,94,0.14),transparent_26%)] animate-[gradientFloat_18s_ease-in-out_infinite]" />
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes gradientFloat {
          0% { transform: scale(1) translate3d(0, 0, 0); }
          33% { transform: scale(1.06) translate3d(1.5%, -1.5%, 0); }
          66% { transform: scale(1.04) translate3d(-1.5%, 1.5%, 0); }
          100% { transform: scale(1) translate3d(0, 0, 0); }
        }
      `}</style>
      <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
        <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.35)] backdrop-blur sm:p-5 md:rounded-[32px] md:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] xl:grid-cols-[minmax(0,1fr)_250px] xl:items-stretch">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Selina Flower Dashboard</div>
              <h1 className="mt-3 font-serif text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl" style={{ color: "#ec4899" }}>{siteHeaderTitle}</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-600">Thành viên chỉ có thể tra cứu thông tin. Các tài khoản quản trị/cập nhật đăng nhập bằng nickname để mở đúng quyền được cấp.</p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {topMembers.map((member, index) => <div key={member.id} className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs shadow-sm"><TrophyIcon className="h-3.5 w-3.5" /><span>Top {index + 1}: {member.name} ({member.ownedCount})</span></div>)}
                <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
                  <DialogTrigger asChild><Button variant="outline" className="h-8 rounded-xl px-3 text-xs"><ShieldIcon className="mr-1 h-3.5 w-3.5" />{adminButtonLabel}</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-[560px]">
                    <DialogHeader className="mb-6">
                      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Selina Admin</div>
                      <DialogTitle className="mt-4 text-[28px] font-bold tracking-tight text-slate-950">{isAdmin ? "Tài khoản quản trị" : "Đăng nhập quản trị"}</DialogTitle>
                      <p className="mt-2 text-sm leading-6 text-slate-500">Đăng nhập bằng nickname + mật khẩu. Hệ thống sẽ tự map nickname sang email để dùng Supabase Auth an toàn.</p>
                    </DialogHeader>
                    {(isAdmin || isManager || isRestrictedEditor) ? (
                      <div className="space-y-4">
                        <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">Đã đăng nhập với tài khoản: <span className="font-semibold text-slate-900">{currentAccountProfile?.nickname ? `${currentAccountProfile.nickname} • ` : ""}{user?.email}</span></div>
                        <Button className="h-11 w-full rounded-2xl" variant="outline" onClick={signOutAdmin} disabled={loggingOut}>{loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</Button>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="space-y-2.5"><Label className="text-[15px] font-semibold text-slate-700">Nickname đăng nhập</Label><Input autoFocus value={loginNickname} onChange={(e) => setLoginNickname(e.target.value)} placeholder="Nhập nickname..." className="h-12 rounded-[18px] border-slate-200 px-4 text-[15px]" /></div>
                        <div className="space-y-2.5"><Label className="text-[15px] font-semibold text-slate-700">Mật khẩu</Label><Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" className="h-12 rounded-[18px] border-slate-200 px-4 text-[15px]" /></div>
                        <Button className="h-12 w-full rounded-[18px] text-[15px] font-semibold shadow-[0_16px_40px_-22px_rgba(15,23,42,0.55)]" onClick={signInAsAdmin} disabled={loggingIn}>{loggingIn ? "Đang đăng nhập..." : "Đăng nhập"}</Button>
                        {loginMessage ? <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-700">{loginMessage}</div> : null}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
              {pageMessage ? <div className="mt-4 rounded-2xl border bg-red-50 p-3 text-sm text-red-700">{pageMessage}</div> : null}
              {lastSyncedAt ? <div className="mt-4 text-xs text-slate-500">Đồng bộ lần cuối: {lastSyncedAt}</div> : null}
            </div>
            <div className="hidden lg:flex lg:items-stretch lg:justify-end">
              <div className="relative h-full min-h-[170px] w-full max-w-[250px] overflow-hidden rounded-[28px] border border-slate-200/80 bg-slate-50/80 shadow-inner">
                {statCardAssetByKey.get("hero")?.imageUrl ? (
                  <img src={statCardAssetByKey.get("hero")?.imageUrl} alt="Icon lớn đầu trang" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                    <UsersIcon className="h-16 w-16" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard icon={statCardAssetByKey.get("members")?.imageUrl ? <img src={statCardAssetByKey.get("members")?.imageUrl} alt="Thành viên" className="absolute inset-0 h-full w-full object-cover" /> : <UsersIcon className="h-5 w-5" />} title="Thành viên" value={summary.totalMembers} />
          <StatCard icon={statCardAssetByKey.get("flowers")?.imageUrl ? <img src={statCardAssetByKey.get("flowers")?.imageUrl} alt="Tổng loại hoa" className="absolute inset-0 h-full w-full object-cover" /> : <Flower2Icon className="h-5 w-5" />} title="Tổng loại hoa" value={summary.totalFlowers} />
          <StatCard icon={statCardAssetByKey.get("owned")?.imageUrl ? <img src={statCardAssetByKey.get("owned")?.imageUrl} alt="Hội đã sở hữu" className="absolute inset-0 h-full w-full object-cover" /> : <DatabaseIcon className="h-5 w-5" />} title="Hội đã sở hữu" value={summary.ownedFlowers} />
          <StatCard icon={statCardAssetByKey.get("missing")?.imageUrl ? <img src={statCardAssetByKey.get("missing")?.imageUrl} alt="Hội còn thiếu" className="absolute inset-0 h-full w-full object-cover" /> : <AlertCircleIcon className="h-5 w-5" />} title="Hội còn thiếu" value={summary.missingFlowers} />
        </div>

        <TabsProvider value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="grid grid-cols-3 auto-rows-fr gap-2 rounded-[20px] border border-white/70 bg-white/85 p-2 md:hidden">
            {visibleTabs.map((tab) => <button key={tab.value} type="button" onClick={() => setActiveTab(tab.value)} className={cn("min-h-[56px] w-full rounded-2xl px-2 py-3 text-center text-[11px] leading-tight break-words transition-all", activeTab === tab.value ? "bg-slate-900 text-white shadow-md" : "bg-transparent text-slate-600")}>{tab.label}</button>)}
          </div>
          <div className="hidden md:flex md:w-full md:items-center md:gap-2 md:rounded-[28px] md:border md:border-slate-200/80 md:bg-white/90 md:p-2 md:shadow-sm">{visibleTabs.map((tab) => <button key={tab.value} type="button" onClick={() => setActiveTab(tab.value)} className={cn("flex h-12 min-w-0 flex-1 items-center justify-center rounded-[18px] px-3 text-center text-[13px] font-medium leading-tight transition-all duration-200", activeTab === tab.value ? "bg-slate-900 text-white shadow-sm" : "bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900")}><span className="line-clamp-2 break-words">{tab.label}</span></button>)}</div>

          <TabsContent value="dashboard"><div className="grid gap-4 xl:grid-cols-[1.1fr_1fr_1fr]"><Card className="rounded-[28px]"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Tiến độ sưu tập của hội</CardTitle><span className="text-sm text-slate-500">Theo nhóm</span></CardHeader><CardContent className="space-y-4"><div className="flex items-center gap-4 rounded-3xl border p-4"><CircleProgress percent={summary.completionRate} /><div><p className="text-sm text-slate-500">Tổng tiến độ</p><p className="text-2xl font-bold">{summary.ownedFlowers}/{summary.totalFlowers} ({summary.completionRate}%)</p></div></div><div className="grid gap-3 sm:grid-cols-2">{groupProgressRows.map((row) => { const style = groupProgressCircleStyle(row.group); return <div key={row.group} className="rounded-3xl border p-3"><div className="mb-2 flex items-center justify-between"><Badge className={groupBadgeClass(row.group)}>{row.group}</Badge><span className="text-sm font-semibold">{row.owned}/{row.total}</span></div><div className="flex items-center gap-3"><CircleProgress percent={row.percent} strokeColor={style.strokeColor} glowClass={style.glowClass} /><div><p className="font-semibold">Phẩm {row.group}</p><p className="text-sm text-slate-500">{row.percent}% hoàn thành</p></div></div></div>; })}</div></CardContent></Card><Card className="rounded-[28px]"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Hoa ít người sở hữu (1-3)</CardTitle><Select value={dashboardRareGroupFilter} onValueChange={setDashboardRareGroupFilter}><SelectContent><SelectItem value="all">Tất cả nhóm</SelectItem>{FLOWER_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></CardHeader><CardContent><ScrollArea className="h-[520px] pr-3"><div className="space-y-3">{filteredRareFlowers.map((flower) => <div key={flower.id} className="rounded-3xl border p-3"><div className="flex items-start gap-3"><FlowerThumbnail flower={flower} size="sm" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="font-semibold break-words">{flower.name}</p><Badge className={groupBadgeClass(flower.group)}>{flower.group}</Badge></div><p className="text-sm text-slate-500">{activeOwnersByFlower.get(String(flower.id))?.length || 0} người sở hữu</p><div className="mt-2 flex flex-wrap gap-2">{(activeOwnersByFlower.get(String(flower.id)) || []).map((owner) => <Badge key={`${flower.id}-${owner}`} variant="secondary">{owner}</Badge>)}</div></div></div></div>)}</div></ScrollArea></CardContent></Card><Card className="rounded-[28px]"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Hoa hội còn thiếu</CardTitle><Select value={dashboardMissingGroupFilter} onValueChange={setDashboardMissingGroupFilter}><SelectContent><SelectItem value="all">Tất cả nhóm</SelectItem>{FLOWER_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></CardHeader><CardContent><ScrollArea className="h-[520px] pr-3"><div className="space-y-3">{filteredMissingFlowers.map((flower) => <div key={flower.id} className="rounded-3xl border p-3"><div className="flex items-start gap-3"><FlowerThumbnail flower={flower} size="sm" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="font-semibold break-words">{flower.name}</p><Badge className={groupBadgeClass(flower.group)}>{flower.group}</Badge></div><p className="text-sm text-slate-500">Chưa có ai trong hội sở hữu</p></div></div></div>)}</div></ScrollArea></CardContent></Card></div></TabsContent>

          <TabsContent value="members"><Card className="rounded-[28px]"><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle>Thành viên</CardTitle><p className="mt-1 text-sm text-slate-500">Số lượng thành viên: {summary.totalMembers} • Số lượng account: {activeMembers.length}</p></div>{canManageMembers ? <Dialog open={createMemberDialogOpen} onOpenChange={setCreateMemberDialogOpen}><DialogTrigger asChild><Button><PlusIcon className="mr-2 h-4 w-4" />Tạo Thành viên mới</Button></DialogTrigger><DialogContent className="sm:max-w-[560px]"><DialogHeader><DialogTitle>Tạo Thành viên mới</DialogTitle></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Tên tài khoản</Label><Input autoFocus value={createMemberName} onChange={(e) => setCreateMemberName(e.target.value)} placeholder="Ví dụ: Min (Trần Huyền)" /><p className="text-xs text-slate-500">Ghi thêm tên zalo đằng sau nhé, ví dụ: Min (Trần Huyền)</p></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Năm sinh</Label><Input value={createMemberBirthYear} onChange={(e) => setCreateMemberBirthYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} placeholder="Có thể bỏ trống" /></div><div className="space-y-2"><Label>Giới tính</Label><Select value={createMemberGender || "unknown"} onValueChange={(value) => setCreateMemberGender(value === "unknown" ? "" : value)}><SelectContent><SelectItem value="unknown">Có thể bỏ trống</SelectItem><SelectItem value="Nam">Nam</SelectItem><SelectItem value="Nữ">Nữ</SelectItem></SelectContent></Select></div></div><Button className="w-full" onClick={createMemberFromMembersTab} disabled={savingNewMember}>{savingNewMember ? "Đang tạo..." : "Tạo thành viên"}</Button>{createMemberMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{createMemberMessage}</div> : null}</div></DialogContent></Dialog> : null}</div></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 lg:grid-cols-[1fr_220px_220px] lg:items-end"><div className="hidden lg:block" /><div className="space-y-1"><Label>Sắp xếp theo</Label><Select value={memberSortField} onValueChange={(value) => { setMemberSortField(value); if (value === "name") setMemberSortDirection("asc"); if (value === "flowers") setMemberSortDirection("desc"); if (value === "age") setMemberSortDirection("desc"); if (value === "gender") setMemberSortDirection("male_first"); }}><SelectContent><SelectItem value="name">Tên</SelectItem><SelectItem value="flowers">Số lượng hoa</SelectItem><SelectItem value="age">Tuổi</SelectItem><SelectItem value="gender">Giới tính</SelectItem></SelectContent></Select></div><div className="space-y-1"><Label>Thứ tự</Label><Select value={memberSortDirection} onValueChange={setMemberSortDirection}><SelectContent>{memberSortDirectionOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div></div><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Tìm theo tên thành viên..." className="pl-9" /></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredActiveMembers.map((member) => { const ownedCount = memberFlowerCounts[String(member.id)] || 0; const percent = summary.totalFlowers ? Math.round((ownedCount / summary.totalFlowers) * 100) : 0; const style = memberProgressCircleStyle(percent); const memberTitle = titleByMemberId.get(String(member.id)); const quickCounts = memberGroupCounts[String(member.id)] || { "Đỏ 30": 0, Đỏ: 0, Vàng: 0, Tím: 0, Lam: 0, Lục: 0 }; return <Card key={member.id} className="relative rounded-[24px]"><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-xl">{member.name}</CardTitle>{formatMemberMeta(member) ? <p className="mt-1 text-sm text-slate-500">{formatMemberMeta(member)}</p> : null}{hasTitleName(memberTitle) ? <Badge className={`mt-2 ${titleBadgeClass(memberTitle.name)}`}>{memberTitle.name}</Badge> : null}</div><div className="flex items-center gap-1.5"><Badge variant="secondary" className="px-2 py-1 text-[11px]">{ownedCount} hoa</Badge><Dialog open={memberCheckDialogOpenId === String(member.id)} onOpenChange={(open) => setMemberCheckDialogOpenId(open ? String(member.id) : null)}><DialogTrigger asChild><Button variant="outline" size="sm" className="hidden h-7 rounded-lg px-2 text-[10px] md:inline-flex">Check hoa</Button></DialogTrigger><DialogContent className="sm:max-w-7xl"><DialogHeader><DialogTitle>Check hoa thành viên</DialogTitle></DialogHeader><MemberFlowersCheckDialogContent member={member} flowersByGroup={memberFlowersByMemberId[String(member.id)] || { "Đỏ 30": [], Đỏ: [], Vàng: [], Tím: [], Lam: [], Lục: [] }} /></DialogContent></Dialog>{canManageMembers ? <Dialog open={memberEditDialogOpenId === String(member.id)} onOpenChange={(open) => setMemberEditDialogOpenId(open ? String(member.id) : null)}><DialogTrigger asChild><Button variant="outline" size="sm" className="h-7 rounded-lg px-2 text-[10px]">Sửa tên</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Sửa thông tin thành viên</DialogTitle></DialogHeader><EditMemberForm member={member} onSave={async (payload) => { const result = await renameMember(member.id, payload); if (result?.ok) setMemberEditDialogOpenId(null); return result; }} /></DialogContent></Dialog> : null}</div></div></CardHeader><CardContent><div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]"><div className="flex items-center gap-4"><CircleProgress percent={percent} strokeColor={style.strokeColor} glowClass={style.glowClass} /><div><p className="text-sm text-slate-500">Tiến độ sưu tập</p><p className="text-lg font-semibold">{ownedCount}/{summary.totalFlowers}</p></div></div><div className="rounded-2xl border bg-slate-50 p-3"><div className="grid grid-cols-2 gap-2 text-sm">{MEMBER_FLOWER_GROUP_ORDER.filter((group) => (quickCounts[group] || 0) > 0).map((group) => <div key={`${member.id}-${group}`} className="flex items-center justify-between rounded-xl border bg-white px-2.5 py-2"><Badge className={`${groupBadgeClass(group)} text-[10px]`}>{group}</Badge><span className="font-semibold text-slate-900">{quickCounts[group] || 0}</span></div>)}</div></div></div></CardContent></Card>; })}</div>{filteredCloneMembers.length > 0 ? <div className="space-y-3"><div className="flex items-center gap-2"><Badge className="border-slate-300 bg-slate-100 text-slate-700">Clone</Badge><span className="text-sm text-slate-500">{filteredCloneMembers.length} người</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredCloneMembers.map((member) => { const ownedCount = memberFlowerCounts[String(member.id)] || 0; const percent = summary.totalFlowers ? Math.round((ownedCount / summary.totalFlowers) * 100) : 0; const style = memberProgressCircleStyle(percent); const memberTitle = titleByMemberId.get(String(member.id)); const quickCounts = memberGroupCounts[String(member.id)] || { "Đỏ 30": 0, Đỏ: 0, Vàng: 0, Tím: 0, Lam: 0, Lục: 0 }; return <Card key={`clone-${member.id}`} className="relative rounded-[24px] border-slate-300/80 bg-slate-50/50"><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-xl">{member.name}</CardTitle>{formatMemberMeta(member) ? <p className="mt-1 text-sm text-slate-500">{formatMemberMeta(member)}</p> : null}{hasTitleName(memberTitle) ? <Badge className={`mt-2 ${titleBadgeClass(memberTitle.name)}`}>{memberTitle.name}</Badge> : null}</div><div className="flex items-center gap-1.5"><Badge variant="secondary" className="px-2 py-1 text-[11px]">{ownedCount} hoa</Badge><Dialog open={memberCheckDialogOpenId === String(member.id)} onOpenChange={(open) => setMemberCheckDialogOpenId(open ? String(member.id) : null)}><DialogTrigger asChild><Button variant="outline" size="sm" className="hidden h-7 rounded-lg px-2 text-[10px] md:inline-flex">Check hoa</Button></DialogTrigger><DialogContent className="sm:max-w-7xl"><DialogHeader><DialogTitle>Check hoa thành viên</DialogTitle></DialogHeader><MemberFlowersCheckDialogContent member={member} flowersByGroup={memberFlowersByMemberId[String(member.id)] || { "Đỏ 30": [], Đỏ: [], Vàng: [], Tím: [], Lam: [], Lục: [] }} /></DialogContent></Dialog>{canManageMembers ? <Dialog open={memberEditDialogOpenId === String(member.id)} onOpenChange={(open) => setMemberEditDialogOpenId(open ? String(member.id) : null)}><DialogTrigger asChild><Button variant="outline" size="sm" className="h-7 rounded-lg px-2 text-[10px]">Sửa tên</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Sửa thông tin thành viên</DialogTitle></DialogHeader><EditMemberForm member={member} onSave={async (payload) => { const result = await renameMember(member.id, payload); if (result?.ok) setMemberEditDialogOpenId(null); return result; }} /></DialogContent></Dialog> : null}</div></div></CardHeader><CardContent><div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]"><div className="flex items-center gap-4"><CircleProgress percent={percent} strokeColor={style.strokeColor} glowClass={style.glowClass} /><div><p className="text-sm text-slate-500">Tiến độ sưu tập</p><p className="text-lg font-semibold">{ownedCount}/{summary.totalFlowers}</p></div></div><div className="rounded-2xl border bg-slate-50 p-3"><div className="grid grid-cols-2 gap-2 text-sm">{MEMBER_FLOWER_GROUP_ORDER.filter((group) => (quickCounts[group] || 0) > 0).map((group) => <div key={`${member.id}-${group}`} className="flex items-center justify-between rounded-xl border bg-white px-2.5 py-2"><Badge className={`${groupBadgeClass(group)} text-[10px]`}>{group}</Badge><span className="font-semibold text-slate-900">{quickCounts[group] || 0}</span></div>)}</div></div></div></CardContent></Card>; })}</div></div> : null}{filteredFormerMembers.length > 0 ? <div className="space-y-3"><div className="flex items-center gap-2"><Badge className="border-amber-200 bg-amber-50 text-amber-700">Đã rời hội</Badge><span className="text-sm text-slate-500">{filteredFormerMembers.length} người</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredFormerMembers.map((member) => <Card key={member.id} className="rounded-[24px] border-amber-200/60 bg-amber-50/30"><CardHeader><div className="flex items-start justify-between gap-3"><div className="space-y-2"><CardTitle className="text-xl">{member.name}</CardTitle><div className="flex flex-wrap gap-2"><Badge className={member.showInLookup ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-100 text-slate-600"}>{member.showInLookup ? "Danh sách hoa: Bật" : "Danh sách hoa: Tắt"}</Badge></div></div><div className="flex flex-wrap gap-2">{isAdmin ? <Button variant="outline" size="sm" className="h-8 rounded-xl px-3 text-[11px]" onClick={() => toggleFormerMemberLookup(member)}>{member.showInLookup ? "Tắt danh sách hoa" : "Bật danh sách hoa"}</Button> : null}{isAdmin ? <Button variant="outline" size="sm" className="h-8 rounded-xl px-3 text-[11px]" onClick={() => restoreFormerMember(member)}>Cho vào hội lại</Button> : null}</div></div></CardHeader><CardContent><p className="text-sm text-slate-500">{memberFlowerCounts[String(member.id)] || 0} hoa đã sở hữu</p><p className="mt-2 text-xs text-slate-500">Bật: vẫn tìm được trong mục tra cứu theo hoa nhưng không tính vào tiến độ hội. Tắt: ẩn khỏi các mục tra cứu.</p></CardContent></Card>)}</div></div> : null}</CardContent></Card></TabsContent>

          <TabsContent value="flowerlookup"><Card className="rounded-[28px]"><CardHeader><CardTitle>Tra cứu theo hoa</CardTitle></CardHeader><CardContent className="space-y-4"><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={flowerSearch} onChange={(e) => setFlowerSearch(e.target.value)} placeholder="Tìm theo tên hoa..." className="pl-9" /></div><div className="space-y-3">{filteredFlowers.map((flower) => <div key={flower.id} className="rounded-3xl border p-4"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><FlowerThumbnail flower={flower} size="sm" /><div><p className="font-semibold">{flower.name}</p><p className="mt-1 text-sm text-slate-500">Nhóm {flower.group}</p></div></div><div className="flex items-center gap-2"><Badge variant="secondary">{ownersByFlower.get(String(flower.id))?.length || 0} người</Badge>{canManageFlowers ? <Dialog open={flowerEditDialogOpenId === `flower-${flower.id}`} onOpenChange={(open) => setFlowerEditDialogOpenId(open ? `flower-${flower.id}` : null)}><DialogTrigger asChild><Button variant="outline" size="sm">Sửa hoa</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Sửa hoa</DialogTitle></DialogHeader><EditFlowerForm flower={flower} uploadingIcon={uploadingFlowerIconId === String(flower.id)} onUploadIcon={(file) => uploadFlowerIcon(flower.id, file)} onSave={async (payload) => { const result = await renameFlower(flower.id, payload); if (result?.ok) setFlowerEditDialogOpenId(null); return result; }} /></DialogContent></Dialog> : null}</div></div><div className="mt-3 flex flex-wrap gap-2">{(ownersByFlower.get(String(flower.id)) || []).map((owner) => <Badge key={`${flower.id}-${owner}`} variant="secondary">{owner}</Badge>)}</div></div>)}</div></CardContent></Card></TabsContent>

          <TabsContent value="memberflowerlookup"><Card className="rounded-[28px]"><CardHeader><CardTitle>Tra cứu theo thành viên</CardTitle></CardHeader><CardContent className="space-y-4"><Dialog open={memberFlowerLookupPickerOpen} onOpenChange={setMemberFlowerLookupPickerOpen}><DialogTrigger asChild><Button variant="outline" className="w-full justify-start">{selectedMemberFlowerLookup ? selectedMemberFlowerLookup.name : "Chọn thành viên"}</Button></DialogTrigger><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Chọn thành viên</DialogTitle></DialogHeader><div className="space-y-3"><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={memberFlowerLookupSearch} onChange={(e) => setMemberFlowerLookupSearch(e.target.value)} placeholder="Tìm thành viên..." className="pl-9" /></div><ScrollArea className="h-[320px] pr-3"><div className="space-y-2">{filteredMemberFlowerLookupOptions.map((member) => <button key={member.id} type="button" onClick={() => { setMemberFlowerLookup(String(member.id)); setMemberFlowerLookupPickerOpen(false); }} className="w-full rounded-2xl border bg-white px-4 py-3 text-left hover:bg-slate-50">{member.name}</button>)}</div></ScrollArea></div></DialogContent></Dialog>{!selectedMemberFlowerLookup ? <SectionEmpty>Hãy chọn một thành viên để xem bộ sưu tập theo nhóm hoa.</SectionEmpty> : <div className="space-y-4"><div className="rounded-2xl border bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{selectedMemberFlowerLookup.name}</p>{formatMemberMeta(selectedMemberFlowerLookup) ? <p className="text-sm text-slate-500">{formatMemberMeta(selectedMemberFlowerLookup)}</p> : null}</div><Badge variant="secondary">{flowersBySelectedMember.length} hoa</Badge></div></div><div className="grid gap-4 md:grid-cols-5">{MEMBER_FLOWER_GROUP_ORDER.map((group) => <div key={group} className="rounded-3xl border p-3"><div className="mb-3 flex items-center justify-between"><Badge className={groupBadgeClass(group)}>{group}</Badge><span className="text-sm font-semibold">{memberFlowersByGroup[group]?.length || 0}</span></div><ScrollArea className="h-[500px] pr-2"><div className="space-y-2">{(memberFlowersByGroup[group] || []).length === 0 ? <SectionEmpty>Chưa có hoa</SectionEmpty> : memberFlowersByGroup[group].map((flower) => <div key={flower.id} className="flex items-center gap-3 rounded-2xl border p-2"><FlowerThumbnail flower={flower} size="sm" /><p className="text-sm font-medium break-words">{flower.name}</p></div>)}</div></ScrollArea></div>)}</div></div>}</CardContent></Card></TabsContent>

          {canAccessOwnershipUpdate ? <TabsContent value="update"><div className="space-y-4"><Card className="rounded-[28px]"><CardHeader><CardTitle>Cập nhật sở hữu</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 lg:grid-cols-[1fr_1fr]"><div className="space-y-4"><div className="space-y-2"><Label>{isRestrictedEditor ? "Chọn thành viên được cấp quyền" : "Chọn thành viên có sẵn"}</Label><Dialog open={memberPickerOpen} onOpenChange={setMemberPickerOpen}><DialogTrigger asChild><Button variant="outline" className="w-full justify-start">{selectedExistingMember ? selectedExistingMember.name : (isRestrictedEditor ? "Chọn thành viên được cấp quyền" : "Chọn thành viên")}</Button></DialogTrigger><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{isRestrictedEditor ? "Chọn thành viên được cấp quyền" : "Chọn thành viên"}</DialogTitle></DialogHeader><div className="space-y-3"><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={memberPickerSearch} onChange={(e) => setMemberPickerSearch(e.target.value)} placeholder="Tìm thành viên..." className="pl-9" /></div><ScrollArea className="h-[320px] pr-3"><div className="space-y-2">{filteredExistingMembers.map((member) => <button key={member.id} type="button" onClick={() => { setSelectedExistingMemberId(String(member.id)); setMemberPickerOpen(false); }} className="w-full rounded-2xl border bg-white px-4 py-3 text-left hover:bg-slate-50">{member.name}</button>)}</div></ScrollArea></div></DialogContent></Dialog></div>{isRestrictedEditor ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-600">Tài khoản này được phép cập nhật cho <span className="font-semibold text-slate-900">{restrictedMemberIds.length}</span> thành viên: <span className="font-semibold text-slate-900">{restrictedMemberIds.map((id) => memberById.get(String(id))?.name || id).join(", ")}</span></div> : null}<div className="grid gap-3 md:grid-cols-[1fr_180px_auto]"><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={updateSearch} onChange={(e) => setUpdateSearch(e.target.value)} placeholder="Tìm hoa cần thêm..." className="pl-9" /></div><Select value={updateGroupFilter} onValueChange={setUpdateGroupFilter}><SelectContent><SelectItem value="all">Tất cả nhóm</SelectItem>{FLOWER_GROUPS.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}</SelectContent></Select><div className="flex items-center md:justify-end"><Badge variant="secondary" className="h-10 px-3 text-sm">Đang chọn: {selectedFlowerIds.length}</Badge></div></div><ScrollArea className="h-[380px] pr-3"><div className="space-y-3">{selectableFlowers.map((flower) => { const checked = selectedFlowerIds.includes(String(flower.id)); return <label key={`add-${flower.id}`} className="flex cursor-pointer items-start gap-3 rounded-2xl border p-3 hover:bg-slate-50"><Checkbox checked={checked} onCheckedChange={() => toggleFlowerSelection(flower.id)} /><FlowerThumbnail flower={flower} size="sm" /><div className="min-w-0 flex-1"><p className="font-medium break-words">{flower.name}</p></div><Badge className={groupBadgeClass(flower.group)}>{flower.group}</Badge></label>; })}</div></ScrollArea><Button className="w-full" onClick={saveOwnershipUpdate} disabled={savingOwnership}>{savingOwnership ? "Đang lưu..." : "Thêm hoa cho thành viên"}</Button></div><div className="space-y-4"><div className="space-y-2"><Label>Gỡ hoa khỏi thành viên</Label><div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-600">{selectedExistingMember ? `Đang gỡ hoa cho: ${selectedExistingMember.name}` : "Hãy chọn thành viên ở cột trái để gỡ hoa."}</div></div><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={removalFlowerSearch} onChange={(e) => setRemovalFlowerSearch(e.target.value)} placeholder="Tìm hoa cần gỡ..." className="pl-9" /></div><ScrollArea className="h-[380px] pr-3"><div className="space-y-3">{removableFlowers.map((flower) => { const checked = selectedRemovalFlowerIds.includes(String(flower.id)); return <label key={`remove-${flower.id}`} className="flex cursor-pointer items-start gap-3 rounded-2xl border p-3 hover:bg-slate-50"><Checkbox checked={checked} onCheckedChange={() => toggleRemovalFlowerSelection(flower.id)} /><FlowerThumbnail flower={flower} size="sm" /><div className="min-w-0 flex-1"><p className="font-medium break-words">{flower.name}</p></div><Badge className={groupBadgeClass(flower.group)}>{flower.group}</Badge></label>; })}</div></ScrollArea><Button variant="outline" className="w-full" onClick={removeOwnershipFromMember} disabled={savingOwnership || !selectedExistingMember}>{savingOwnership ? "Đang gỡ..." : "Gỡ hoa đã chọn"}</Button></div></div>{updateMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{updateMessage}</div> : null}</CardContent></Card></div></TabsContent> : null}

          <TabsContent value="addflower"><div className="space-y-4"><Card className="rounded-[28px]"><CardHeader><CardTitle>Hoa nghệ thuật</CardTitle></CardHeader><CardContent className="space-y-4">{artVaseMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{artVaseMessage}</div> : null}<div className="grid gap-4 xl:grid-cols-[1.15fr_1fr]"><Card className="rounded-[24px] border shadow-none"><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="text-lg">Dashboard hoa nghệ thuật</CardTitle><Select value={artDashboardGroupFilter} onValueChange={setArtDashboardGroupFilter}><SelectContent><SelectItem value="all">Tất cả phẩm</SelectItem>{MEMBER_FLOWER_GROUP_ORDER.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}</SelectContent></Select></div></CardHeader><CardContent className="space-y-4"><div className="flex items-center gap-4 rounded-3xl border p-4"><CircleProgress percent={artSummary.percent} /><div><p className="text-sm text-slate-500">{isGuildArtLookup ? "Số lượng tổ hợp hoa nghệ thuật hội đã sở hữu, tính việc sở hữu 1 tổ hợp hoa hoàn chỉnh của mỗi một thành viên trong hội" : `Số lượng tổ hợp hoa nghệ thuật ${selectedArtLookupMember?.name || "thành viên"} đã sở hữu`}</p><p className="text-2xl font-bold">{artSummary.ownedCombos}/{artSummary.totalCombos}</p></div></div><div className="grid gap-3 md:grid-cols-2">{filteredArtVaseStats.map((vase) => { const vasePercent = vase.totalCombos ? Math.round((vase.ownedCombos / vase.totalCombos) * 100) : 0; const vaseStyle = memberProgressCircleStyle(vasePercent); return (<div key={vase.id} className="rounded-3xl border p-3"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3">{vase.iconUrl ? (<div className="h-11 w-11 overflow-hidden rounded-2xl border bg-white"><img src={vase.iconUrl} alt={vase.name} className="h-full w-full object-cover" loading="lazy" decoding="async" /></div>) : (<div className="flex h-11 w-11 items-center justify-center rounded-2xl border bg-slate-50 text-slate-500"><PlaceholderFlowerIcon size="sm" /></div>)}<div className="min-w-0"><div className="mb-1 flex flex-wrap items-center gap-2"><p className="font-semibold break-words">{vase.name}</p><Badge className={groupBadgeClass(vase.vaseGroup)}>{vase.vaseGroup}</Badge></div><div className="flex flex-wrap items-center gap-2 text-sm text-slate-500"><span>{vase.ownedCombos}/{vase.totalCombos} tổ hợp</span><span>•</span><span>{vase.ownedFlowerCount}/{vase.totalFlowerCount} hoa</span></div></div></div><CircleProgress percent={vasePercent} strokeColor={vaseStyle.strokeColor} glowClass={vaseStyle.glowClass} /></div></div>); })}</div></CardContent></Card><Card className="rounded-[24px] border shadow-none"><CardHeader><CardTitle className="text-lg">Gợi ý hoa cắm bình chưa sở hữu</CardTitle></CardHeader><CardContent className="space-y-4"><Dialog open={artLookupMemberPickerOpen} onOpenChange={setArtLookupMemberPickerOpen}><DialogTrigger asChild><Button variant="outline" className="w-full justify-start">{isGuildArtLookup ? "Cả Hội" : selectedArtLookupMember ? selectedArtLookupMember.name : "Chọn thành viên"}</Button></DialogTrigger><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Chọn thành viên</DialogTitle></DialogHeader><div className="space-y-3"><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={artLookupMemberSearch} onChange={(e) => setArtLookupMemberSearch(e.target.value)} placeholder="Tìm thành viên..." className="pl-9" /></div><ScrollArea className="h-[320px] pr-3"><div className="space-y-2"><button type="button" onClick={() => { setArtLookupMemberId("guild"); setArtLookupMemberPickerOpen(false); }} className={cn("w-full rounded-2xl border px-4 py-3 text-left hover:bg-slate-50", isGuildArtLookup ? "bg-slate-50 border-slate-300" : "bg-white")}>Cả Hội</button>{filteredArtLookupMembers.map((member) => (<button key={member.id} type="button" onClick={() => { setArtLookupMemberId(String(member.id)); setArtLookupMemberPickerOpen(false); }} className="w-full rounded-2xl border bg-white px-4 py-3 text-left hover:bg-slate-50">{member.name}</button>))}</div></ScrollArea></div></DialogContent></Dialog><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={artLookupSuggestionSearch} onChange={(e) => setArtLookupSuggestionSearch(e.target.value)} placeholder="Tìm trong danh sách gợi ý..." className="pl-9" /></div><ScrollArea className="h-[420px] pr-3"><div className="space-y-3">{artLookupMemberId === "none" ? (<SectionEmpty>Hãy chọn Cả Hội hoặc một thành viên để xem các hoa cắm bình chưa sở hữu.</SectionEmpty>) : filteredArtLookupSuggestions.length === 0 ? (<SectionEmpty>Thành viên này hiện không thiếu hoa nào trong các bình đã tạo.</SectionEmpty>) : (filteredArtLookupSuggestions.map((row) => { const checked = artSelectedSuggestionFlowerIds.includes(String(row.flower.id)); return (<label key={row.flower.id} className="flex cursor-pointer items-start gap-3 rounded-3xl border p-3 hover:bg-slate-50"><Checkbox checked={checked} onCheckedChange={() => toggleArtSuggestionFlower(row.flower.id)} /><FlowerThumbnail flower={row.flower} size="sm" /><div className="min-w-0 flex-1"><p className="font-semibold break-words">{row.flower.name}</p><p className="mt-1 text-sm text-slate-500">Bình: {row.vaseNames.join(", ")}</p></div><Badge className={groupBadgeClass(row.flower.group)}>{row.flower.group}</Badge></label>); }))}</div></ScrollArea><div className="flex justify-end"><Button type="button" variant="outline" onClick={runArtSuggestionSearch}>Tìm kiếm</Button></div><div className="rounded-3xl border p-4"><div className="mb-3 flex items-center justify-between gap-3"><Label>Kết quả tìm kiếm người sở hữu</Label><Badge variant="secondary">{artLookupSearchResults.length} hoa</Badge></div><div className="space-y-3">{artLookupSearchResults.length === 0 ? (<SectionEmpty>Hãy tick chọn các hoa trong danh sách gợi ý rồi bấm Tìm kiếm.</SectionEmpty>) : (artLookupSearchResults.map((row) => (<div key={`owner-search-${row.flower.id}`} className="rounded-3xl border p-3"><div className="flex items-start gap-3"><FlowerThumbnail flower={row.flower} size="sm" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="font-semibold break-words">{row.flower.name}</p><Badge className={groupBadgeClass(row.flower.group)}>{row.flower.group}</Badge></div><p className="mt-1 text-sm text-slate-500">Bình: {row.vaseNames.join(", ")}</p><div className="mt-2 flex flex-wrap gap-2">{row.owners.length === 0 ? (<Badge variant="secondary">Chưa ai sở hữu</Badge>) : (row.owners.map((owner) => (<Badge key={`${row.flower.id}-${owner}`} variant="secondary">{owner}</Badge>)))}</div></div></div></div>)))}</div></div><div className="rounded-3xl border p-4"><div className="mb-3 flex items-center justify-between gap-3"><Label>Chọn người ưu tiên var</Label><Badge variant="secondary">{artPriorityVarOwners.length} người</Badge></div><div className="relative mb-3"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={artPriorityVarSearch} onChange={(e) => setArtPriorityVarSearch(e.target.value)} placeholder="Tìm tên thành viên ưu tiên..." className="pl-9" /></div><ScrollArea className="h-[180px] pr-3"><div className="space-y-2">{artPriorityVarOwnerOptions.length === 0 ? (<SectionEmpty>Hãy bấm Tìm kiếm trước để có danh sách người sở hữu.</SectionEmpty>) : (artPriorityVarOwnerOptions.map((owner) => { const checked = artPriorityVarOwners.includes(String(owner)); return (<label key={`priority-var-${owner}`} className="flex cursor-pointer items-center gap-3 rounded-2xl border p-3 hover:bg-slate-50"><Checkbox checked={checked} onCheckedChange={() => toggleArtPriorityVarOwner(owner)} /><span className="text-sm font-medium text-slate-700">{owner}</span></label>); }))}</div></ScrollArea><div className="mt-3 flex justify-end"><Button type="button" variant="outline" onClick={runArtVarSuggestion}>Gợi ý</Button></div></div><div className="rounded-3xl border p-4"><div className="mb-3 flex items-center justify-between gap-3"><Label>Gợi ý var nhau</Label><Badge variant="secondary">{artVarSuggestions.length} người</Badge></div><div className="space-y-3">{artVarSuggestions.length === 0 ? (<SectionEmpty>Hãy bấm Gợi ý để gom danh sách theo người sở hữu.</SectionEmpty>) : (artVarSuggestions.map((item) => (<div key={`var-${item.owner}`} className="rounded-3xl border p-3"><div className="flex flex-wrap items-center gap-2 text-sm leading-7 text-slate-700"><span>Hãy var</span><span className={VAR_OWNER_BADGE_CLASS}>{item.owner}</span><span>để húp:</span><div className="inline-flex flex-wrap items-center gap-2">{item.flowers.map((flower) => (<span key={`${item.owner}-${flower.id}`} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${groupBadgeClass(flower.group)}`}><FlowerThumbnail flower={flower} size="sm" /><span>{flower.name}</span></span>))}</div></div></div>)))}</div></div></CardContent></Card></div><Card className="rounded-[24px] border shadow-none"><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="text-lg">Hoa cắm bình ít người sở hữu (1-3)</CardTitle><Select value={artRareFlowerGroupFilter} onValueChange={setArtRareFlowerGroupFilter}><SelectContent><SelectItem value="all">Tất cả nhóm</SelectItem>{MEMBER_FLOWER_GROUP_ORDER.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}</SelectContent></Select></div></CardHeader><CardContent><ScrollArea className="h-[260px] pr-3"><div className="space-y-3">{artRareFlowers.length === 0 ? (<SectionEmpty>Chưa có hoa cắm bình nào rơi vào nhóm 1-3 người sở hữu.</SectionEmpty>) : (artRareFlowers.map((row) => (<div key={row.flower.id} className="rounded-3xl border p-3"><div className="flex items-start gap-3"><FlowerThumbnail flower={row.flower} size="sm" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="font-semibold break-words">{row.flower.name}</p><Badge className={groupBadgeClass(row.flower.group)}>{row.flower.group}</Badge></div><p className="text-sm text-slate-500">{row.ownerCount} người sở hữu</p><p className="mt-1 text-sm text-slate-500">Bình: {row.vaseNames.join(", ")}</p></div></div></div>)))}</div></ScrollArea></CardContent></Card></CardContent></Card></div></TabsContent>

          {canManageTitles ? <TabsContent value="titlemanagement"><div className="space-y-4"><Card className="rounded-[28px]"><CardHeader><CardTitle>Quản lý chức danh</CardTitle></CardHeader><CardContent>{!titleFeatureAvailable ? <SectionEmpty>Supabase chưa có bảng titles và member_titles.</SectionEmpty> : <div className="grid gap-4 lg:grid-cols-[300px_1fr_360px]"><div className="rounded-3xl border p-4 space-y-4"><div className="space-y-2"><Label>Chọn chức danh để trao</Label><Select value={selectedTitleId} onValueChange={setSelectedTitleId}><SelectContent><SelectItem value="none">-- Chọn chức danh --</SelectItem>{titles.map((title) => <SelectItem key={title.id} value={String(title.id)}>{title.name}</SelectItem>)}</SelectContent></Select></div><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={titleMemberSearch} onChange={(e) => setTitleMemberSearch(e.target.value)} placeholder="Tìm tên thành viên..." className="pl-9" /></div><Button className="w-full" onClick={saveTitleAssignments} disabled={savingTitle}>Trao chức danh cho thành viên đã chọn</Button>{titleMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{titleMessage}</div> : null}</div><div className="rounded-3xl border p-4"><ScrollArea className="h-[720px] pr-3"><div className="space-y-3">{filteredTitleMembers.map((member) => { const checked = selectedTitleMemberIds.includes(String(member.id)); const memberTitle = titleByMemberId.get(String(member.id)); return <label key={member.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 hover:bg-slate-50"><Checkbox checked={checked} onCheckedChange={() => toggleTitleMember(member.id)} /><div className="flex-1"><p className="font-medium">{member.name}</p><p className="text-sm text-slate-500">{memberTitle?.name || "Chưa có chức danh"}</p></div></label>; })}</div></ScrollArea></div><div className="rounded-3xl border p-4"><div className="mb-3 relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={titleManageSearch} onChange={(e) => setTitleManageSearch(e.target.value)} placeholder="Tìm chức danh..." className="pl-9" /></div><ScrollArea className="h-[720px] pr-3"><div className="space-y-4">{filteredTitles.map((title) => { const assignedMembers = membersByTitleId.get(String(title.id)) || []; return <div key={title.id} className="rounded-3xl border p-3"><div className="mb-3 flex items-center justify-between"><Badge className={titleBadgeClass(title.name)}>{title.name}</Badge><span className="text-sm font-semibold">{assignedMembers.length} người</span></div><div className="space-y-2">{assignedMembers.length === 0 ? <SectionEmpty>Chưa có thành viên nào</SectionEmpty> : assignedMembers.map((member) => <div key={`${title.id}-${member.id}`} className="flex items-center justify-between gap-3 rounded-2xl border p-2"><span className="text-sm font-medium break-words">{member.name}</span><Button variant="outline" size="sm" onClick={() => removeTitleFromMember(title.id, member.id)}>Gỡ</Button></div>)}</div></div>; })}</div></ScrollArea></div></div>}</CardContent></Card></div></TabsContent> : null}

          {canAccessAdminPanel ? <TabsContent value="adminpanel">{adminPanelContent}</TabsContent> : null}

          <TabsContent value="gardenpackage"><div className="space-y-4"><div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]"><Card className="rounded-[28px]"><CardHeader><CardTitle>Danh sách hoa trong Gói Vườn Hoa</CardTitle></CardHeader><CardContent><ScrollArea className="h-[720px] pr-3"><div className="space-y-4">{gardenPackageFlowerRows.map((page) => <div key={`garden-view-${page.pageNumber}`} className="rounded-3xl border p-4"><div className="mb-3 flex items-center justify-between"><p className="font-semibold">{`Trang ${page.pageNumber}`}</p><Badge variant="secondary">{page.slots.reduce((sum, slot) => sum + slot.flowers.length, 0)} hoa</Badge></div><div className="grid gap-3 md:grid-cols-2">{page.slots.map((slot) => <div key={`garden-view-slot-${page.pageNumber}-${slot.key}`} className="rounded-2xl border bg-slate-50 p-3"><div className="mb-2 flex items-center justify-between"><Label>{slot.label}</Label><Badge variant="secondary">{slot.flowers.length}</Badge></div><div className="space-y-2">{slot.flowers.length === 0 ? <SectionEmpty>Chưa có hoa</SectionEmpty> : slot.flowers.map((flower) => <div key={`garden-view-flower-${page.pageNumber}-${slot.key}-${flower.id}`} className="flex items-center gap-3 rounded-2xl border bg-white p-2.5"><FlowerThumbnail flower={flower} size="sm" /><div className="min-w-0 flex-1"><p className="text-sm font-medium break-words">{flower.name}</p></div><Badge className={groupBadgeClass(flower.group)}>{flower.group}</Badge></div>)}</div></div>)}</div></div>)}</div></ScrollArea></CardContent></Card><Card className="rounded-[28px]"><CardHeader><CardTitle>Gợi ý mua Gói Vườn Hoa</CardTitle></CardHeader><CardContent className="space-y-4"><Dialog open={gardenPackageMemberPickerOpen} onOpenChange={setGardenPackageMemberPickerOpen}><DialogTrigger asChild><Button variant="outline" className="w-full justify-start">{selectedGardenPackageMember ? selectedGardenPackageMember.name : "Chọn thành viên"}</Button></DialogTrigger><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Chọn thành viên</DialogTitle></DialogHeader><div className="space-y-3"><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={gardenPackageMemberSearch} onChange={(e) => setGardenPackageMemberSearch(e.target.value)} placeholder="Tìm thành viên..." className="pl-9" /></div><ScrollArea className="h-[320px] pr-3"><div className="space-y-2">{filteredGardenPackageMembers.map((member) => <button key={`garden-member-${member.id}`} type="button" onClick={() => { setGardenPackageSuggestionMemberId(String(member.id)); setGardenPackageMemberPickerOpen(false); }} className="w-full rounded-2xl border bg-white px-4 py-3 text-left hover:bg-slate-50">{member.name}</button>)}</div></ScrollArea></div></DialogContent></Dialog><div className="space-y-2"><Label>Mục đích mua</Label><Select value={gardenPackagePurchasePurpose} onValueChange={setGardenPackagePurchasePurpose}><SelectContent><SelectItem value="single">Tôi sẽ mua lẻ mỗi loại hoa mình cần</SelectItem><SelectItem value="page">Tôi sẽ mua cả trang</SelectItem></SelectContent></Select></div>{gardenPackageSuggestionResult.message ? <div className="rounded-2xl border bg-amber-50 p-3 text-sm text-amber-800">{gardenPackageSuggestionResult.message}</div> : null}{gardenPackagePurchasePurpose === "page" ? <div className="flex flex-wrap items-center gap-2">{gardenPackageSuggestionResult.pageModeDescription ? <div className="rounded-2xl border bg-slate-50 px-3 py-2 text-sm text-slate-700">{gardenPackageSuggestionResult.pageModeDescription}</div> : null}<Button type="button" variant="outline" size="sm" className="h-9 rounded-xl px-3 text-[12px]">Đang gợi ý {gardenPackageSuggestionResult.pageRows.length} trang</Button></div> : null}<ScrollArea className="h-[620px] pr-3"><div className="space-y-4">{!selectedGardenPackageMember ? <SectionEmpty>Hãy chọn một thành viên để xem gợi ý mua Gói Vườn Hoa.</SectionEmpty> : gardenPackagePurchasePurpose === "single" ? (gardenPackageSuggestionResult.rows.length === 0 ? <SectionEmpty>Không có hoa phù hợp để gợi ý.</SectionEmpty> : <div className="space-y-3">{gardenPackageSuggestionResult.rows.map((row, index) => <div key={`garden-suggest-${row.flower.id}-${row.pageNumber}-${row.slotKey}-${index}`} className="rounded-3xl border p-3"><div className="flex items-start gap-3"><FlowerThumbnail flower={row.flower} size="sm" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="font-semibold break-words">Bạn nên mua {row.flower.name}</p><Badge className={groupBadgeClass(row.flower.group)}>{row.flower.group}</Badge></div><p className="mt-1 text-sm text-slate-500">Thuộc Trang {row.pageNumber} • {row.slotLabel}</p><p className="mt-1 text-sm text-slate-500">Số lượng người sở hữu hiện tại: {row.ownerCount}</p><p className="mt-1 text-sm text-slate-500">Cắm bình hoa: {row.vaseNames.length > 0 ? row.vaseNames.join(", ") : "Chưa dùng trong bình hoa"}</p>{row.bonusNote ? <p className="mt-2 text-sm font-medium text-amber-700">{row.bonusNote}</p> : null}</div></div></div>)}</div>) : (gardenPackageSuggestionResult.pageRows.length === 0 ? <SectionEmpty>Không có trang phù hợp để gợi ý.</SectionEmpty> : <div className="space-y-3">{gardenPackageSuggestionResult.pageRows.map((page) => <div key={`garden-page-suggest-${page.pageNumber}`} className="rounded-3xl border p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="font-semibold break-words">Bạn nên mua Trang {page.pageNumber}</p><p className="mt-1 text-sm text-slate-500">{page.suggestionType === "purple_only" ? `Trang này chỉ có hoa phẩm Tím và còn thiếu ${page.matchedCount} hoa phù hợp` : page.suggestionType === "yellow_upgrade" ? `Trang này có ${page.matchedCount} hoa phẩm Vàng phù hợp để nâng phẩm sở hữu` : `Có ${page.matchedCount} hoa phù hợp`}</p></div><Badge variant="secondary">Trang {page.pageNumber}</Badge></div><div className="mt-3 grid gap-2">{page.allSlotFlowers.map((flower) => <div key={`garden-page-flower-${page.pageNumber}-${flower.id}`} className="flex items-center gap-3 rounded-2xl border bg-white p-2.5"><FlowerThumbnail flower={flower} size="sm" /><div className="min-w-0 flex-1"><div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-medium break-words">{flower.name}</p><Badge className={groupBadgeClass(flower.group)}>{flower.group}</Badge>{flower.isOwned ? <Badge variant="secondary">Đã có</Badge> : null}</div></div></div>)}{page.bonusFlowers.length > 0 ? <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-2.5"><p className="mb-2 text-sm font-medium text-amber-800">Bonus</p><div className="space-y-2">{page.bonusFlowers.map((flower) => <div key={`garden-page-bonus-${page.pageNumber}-${flower.id}`} className="flex items-center gap-3 rounded-2xl border bg-white p-2.5"><FlowerThumbnail flower={flower} size="sm" /><div className="min-w-0 flex-1"><div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-medium break-words">{flower.name}</p><Badge className={groupBadgeClass(flower.group)}>{flower.group}</Badge>{flower.isOwned ? <Badge variant="secondary">Đã có</Badge> : null}</div></div></div>)}</div></div> : null}</div></div>)}</div>)}</div></ScrollArea></CardContent></Card></div></div></TabsContent><TabsContent value="history"><Card className="rounded-[28px]"><CardHeader><CardTitle>Lịch sử cập nhật</CardTitle></CardHeader><CardContent>{!historyLoaded ? <p className="text-sm text-slate-600">Đang tải lịch sử...</p> : visibleHistoryEntries.length === 0 ? <SectionEmpty>Chưa có lịch sử thao tác.</SectionEmpty> : <div className="space-y-3">{visibleHistoryEntries.map((log) => <div key={log.id} className="rounded-3xl border p-4"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{log.targetName || "-"}</p>{log.memberTitle?.name ? <Badge className={titleBadgeClass(log.memberTitle.name)}>{log.memberTitle.name}</Badge> : null}{log.summaryText ? <span className="text-sm text-slate-500">• {log.summaryText}</span> : null}</div>{log.flowerItems.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{log.flowerItems.map((item, index) => <div key={`${log.id}-${item.name}-${index}`} className="inline-flex items-center gap-2 rounded-2xl border bg-slate-50 px-3 py-2"><FlowerThumbnail flower={item.flower} size="sm" /><span className="text-sm font-medium">{item.name}</span>{item.flower ? <Badge className={groupBadgeClass(item.flower.group)}>{item.flower.group}</Badge> : null}</div>)}</div> : log.targetType === "account_identity" ? <div className="mt-3 rounded-2xl border bg-slate-50 p-3 text-sm text-slate-600"><div className="font-medium text-slate-900">{log.targetName || "Tài khoản cập nhật"}</div><div className="mt-1">{log.details || "-"}</div></div> : <p className="mt-2 text-sm text-slate-600">{log.details || "-"}</p>}<div className="mt-2 text-xs text-slate-500">{log.createdAt ? new Date(log.createdAt).toLocaleString("vi-VN") : "-"} • {log.actorName || "Hệ thống"}</div></div>)}</div>}</CardContent></Card></TabsContent>

          <TabsContent value="spirithunt"><div className="space-y-4"><Card className="rounded-[28px]"><CardHeader className="space-y-3"><div className="flex items-center justify-between gap-3"><CardTitle>Ưu tiên đua hội</CardTitle></div>{priorityRaceMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{priorityRaceMessage}</div> : null}<div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-600">Danh sách này tự cập nhật theo hoa đang sở hữu. Nếu thành viên được tick ở box <span className="font-semibold text-slate-900">Thành viên đua 2 phẩm</span>, hệ thống sẽ luôn giữ <span className="font-semibold text-slate-900">2 phẩm cao nhất hiện có</span>.</div></CardHeader><CardContent className="space-y-4"><div className="rounded-3xl border p-4"><div className="mb-3 flex items-center justify-between gap-3"><Label className="text-[12px]">Danh sách ưu tiên đua hội</Label><div className="relative w-full max-w-xs"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={priorityRaceListSearch} onChange={(e) => setPriorityRaceListSearch(e.target.value)} placeholder="Tìm trong danh sách..." className="h-9 pl-9 text-[12px]" /></div></div><div className="space-y-4">{filteredPriorityRaceEntries.length === 0 ? (<SectionEmpty>Chưa có dòng ưu tiên đua hội nào được lưu.</SectionEmpty>) : (<><div className="space-y-3"><div className="flex items-center gap-2"><Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Thành viên</Badge><span className="text-sm text-slate-500">{filteredPriorityRaceMemberEntries.length} người</span></div>{filteredPriorityRaceMemberEntries.length === 0 ? <SectionEmpty>Chưa có thành viên nào trong danh sách ưu tiên đua hội.</SectionEmpty> : filteredPriorityRaceMemberEntries.map((entry) => { const memberTitle = entry.member ? titleByMemberId.get(String(entry.member.id)) : null; return (<div key={entry.id} className="space-y-3 rounded-2xl border bg-white p-4"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div className="min-w-0 space-y-2"><div className="flex flex-wrap items-center gap-2"><span className={cn("text-[13px] font-semibold", oneQuestMemberIdSet.has(String(entry.member?.id || entry.memberId)) ? "text-red-600" : "text-slate-900")}>{entry.member?.name || "Không rõ thành viên"}</span>{hasTitleName(memberTitle) ? <Badge className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div></div><div className="flex items-center gap-2 flex-wrap"><Badge variant="secondary" className="text-[10px]">{priorityRaceListSearch.trim() ? `${entry.flowersForEntry.length}/${entry.totalFlowersForEntry} hoa` : `${entry.flowersForEntry.length} hoa`}</Badge><Badge variant="secondary" className="text-[10px]">Tổng sở hữu: {entry.ownedTotalCount}</Badge></div></div><div className="flex flex-wrap gap-2">{entry.flowersForEntry.map((flower) => (<div key={`${entry.id}-${flower.id}`} className="inline-flex items-center gap-2 rounded-2xl border bg-slate-50 px-2.5 py-1.5 text-[12px]"><FlowerThumbnail flower={flower} size="sm" /><span className="text-[12px]">{flower.name}</span><Badge className={`${groupBadgeClass(flower.group)} text-[10px]`}>{flower.group}</Badge></div>))}</div></div>); })}</div><div className="space-y-3"><div className="flex items-center gap-2"><Badge className="border-slate-300 bg-slate-100 text-slate-700">Clone</Badge><span className="text-sm text-slate-500">{filteredPriorityRaceCloneEntries.length} người</span></div>{filteredPriorityRaceCloneEntries.length === 0 ? <SectionEmpty>Chưa có clone nào trong danh sách ưu tiên đua hội.</SectionEmpty> : filteredPriorityRaceCloneEntries.map((entry) => { const memberTitle = entry.member ? titleByMemberId.get(String(entry.member.id)) : null; return (<div key={entry.id} className="space-y-3 rounded-2xl border bg-slate-50/60 p-4"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div className="min-w-0 space-y-2"><div className="flex flex-wrap items-center gap-2"><span className={cn("text-[13px] font-semibold", oneQuestMemberIdSet.has(String(entry.member?.id || entry.memberId)) ? "text-red-600" : "text-slate-900")}>{entry.member?.name || "Không rõ thành viên"}</span>{hasTitleName(memberTitle) ? <Badge className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div></div><div className="flex items-center gap-2 flex-wrap"><Badge variant="secondary" className="text-[10px]">{priorityRaceListSearch.trim() ? `${entry.flowersForEntry.length}/${entry.totalFlowersForEntry} hoa` : `${entry.flowersForEntry.length} hoa`}</Badge><Badge variant="secondary" className="text-[10px]">Tổng sở hữu: {entry.ownedTotalCount}</Badge></div></div><div className="flex flex-wrap gap-2">{entry.flowersForEntry.map((flower) => (<div key={`${entry.id}-${flower.id}`} className="inline-flex items-center gap-2 rounded-2xl border bg-white px-2.5 py-1.5 text-[12px]"><FlowerThumbnail flower={flower} size="sm" /><span className="text-[12px]">{flower.name}</span><Badge className={`${groupBadgeClass(flower.group)} text-[10px]`}>{flower.group}</Badge></div>))}</div></div>); })}</div></>)}</div></div></CardContent></Card>{canManagePriorityRace ? (<div className="grid gap-4 md:grid-cols-2"><Card className="rounded-[24px]"><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="text-base">Thành viên còn 1 quest</CardTitle><Button type="button" variant="outline" size="sm" className="h-8 rounded-xl px-3 text-[11px]" onClick={clearOneQuestMembers} disabled={oneQuestMembers.length === 0}>Clear</Button></div></CardHeader><CardContent className="space-y-3"><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={oneQuestMemberSearch} onChange={(e) => setOneQuestMemberSearch(e.target.value)} placeholder="Tìm tên thành viên..." className="pl-9" /></div><ScrollArea className="h-[220px] pr-2"><div className="space-y-2.5">{filteredOneQuestMembers.map((member) => { const checked = oneQuestMemberIds.includes(String(member.id)); const memberTitle = titleByMemberId.get(String(member.id)); return (<label key={`one-quest-${member.id}`} className="flex cursor-pointer items-start gap-2.5 rounded-2xl border p-3 hover:bg-slate-50"><Checkbox checked={checked} onCheckedChange={() => toggleOneQuestMember(member.id)} /><div className="flex-1"><div className="flex items-start justify-between gap-2"><div><p className="text-[13px] font-medium leading-snug">{member.name}</p></div>{hasTitleName(memberTitle) ? <Badge className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div></div></label>); })}</div></ScrollArea><div className="rounded-2xl border bg-slate-50 p-3 text-[12px] text-slate-600"><div className="mb-2">Đã chọn: <span className="font-semibold text-slate-900">{oneQuestMembers.length}</span> thành viên</div><div className="flex flex-wrap gap-2">{oneQuestMembers.length === 0 ? <span className="text-slate-400">Chưa có thành viên nào.</span> : oneQuestMembers.map((member) => { const memberTitle = titleByMemberId.get(String(member.id)); return <div key={`one-quest-picked-${member.id}`} className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-[12px]"><span>{member.name}</span>{hasTitleName(memberTitle) ? <Badge className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div>; })}</div></div></CardContent></Card><Card className="rounded-[24px]"><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="text-base">Thành viên hoàn thành</CardTitle><Button type="button" variant="outline" size="sm" className="h-8 rounded-xl px-3 text-[11px]" onClick={clearCompletedMembers} disabled={completedMembers.length === 0}>Clear</Button></div></CardHeader><CardContent className="space-y-3"><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={completedMemberSearch} onChange={(e) => setCompletedMemberSearch(e.target.value)} placeholder="Tìm tên thành viên..." className="pl-9" /></div><ScrollArea className="h-[220px] pr-2"><div className="space-y-2.5">{filteredCompletedMembers.map((member) => { const checked = completedMemberIds.includes(String(member.id)); const memberTitle = titleByMemberId.get(String(member.id)); return (<label key={`completed-${member.id}`} className="flex cursor-pointer items-start gap-2.5 rounded-2xl border p-3 hover:bg-slate-50"><Checkbox checked={checked} onCheckedChange={() => toggleCompletedMember(member.id)} /><div className="flex-1"><div className="flex items-start justify-between gap-2"><div><p className="text-[13px] font-medium leading-snug">{member.name}</p></div>{hasTitleName(memberTitle) ? <Badge className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div></div></label>); })}</div></ScrollArea><div className="rounded-2xl border bg-slate-50 p-3 text-[12px] text-slate-600"><div className="mb-2">Đã chọn: <span className="font-semibold text-slate-900">{completedMembers.length}</span> thành viên</div><div className="flex flex-wrap gap-2">{completedMembers.length === 0 ? <span className="text-slate-400">Chưa có thành viên nào.</span> : completedMembers.map((member) => { const memberTitle = titleByMemberId.get(String(member.id)); return <div key={`completed-picked-${member.id}`} className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-[12px]"><span>{member.name}</span>{hasTitleName(memberTitle) ? <Badge className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div>; })}</div></div></CardContent></Card></div>) : null}{(isAdmin || isManager) ? (<Card className="rounded-[28px]"><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>Thành viên đua 2 phẩm</CardTitle><Button type="button" variant="outline" size="sm" className="h-8 rounded-xl px-3 text-[11px]" onClick={clearTwoGroupMembers} disabled={twoGroupMembers.length === 0}>Clear</Button></div></CardHeader><CardContent className="space-y-3"><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={twoGroupMemberSearch} onChange={(e) => setTwoGroupMemberSearch(e.target.value)} placeholder="Tìm tên thành viên..." className="pl-9" /></div><ScrollArea className="h-[220px] pr-2"><div className="space-y-2.5">{filteredTwoGroupMembers.map((member) => { const checked = twoGroupMemberIds.includes(String(member.id)); const memberTitle = titleByMemberId.get(String(member.id)); return (<label key={`two-group-${member.id}`} className="flex cursor-pointer items-start gap-2.5 rounded-2xl border p-3 hover:bg-slate-50"><Checkbox checked={checked} onCheckedChange={() => toggleTwoGroupMember(member.id)} /><div className="flex-1"><div className="flex items-start justify-between gap-2"><div><p className="text-[13px] font-medium leading-snug">{member.name}</p></div>{hasTitleName(memberTitle) ? <Badge className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div></div></label>); })}</div></ScrollArea><div className="rounded-2xl border bg-slate-50 p-3 text-[12px] text-slate-600"><div className="mb-2">Đã chọn: <span className="font-semibold text-slate-900">{twoGroupMembers.length}</span> thành viên</div><div className="flex flex-wrap gap-2">{twoGroupMembers.length === 0 ? <span className="text-slate-400">Chưa có thành viên nào.</span> : twoGroupMembers.map((member) => { const memberTitle = titleByMemberId.get(String(member.id)); return <div key={`two-group-picked-${member.id}`} className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-[12px]"><span>{member.name}</span>{hasTitleName(memberTitle) ? <Badge className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div>; })}</div></div><div className="rounded-2xl border bg-slate-50 p-3 text-[12px] text-slate-600">Khi thành viên được chọn ở đây, box Ưu tiên đua hội sẽ luôn giữ 2 phẩm: phẩm cao nhất đang có và phẩm liền dưới. Bấm Cập nhật lại vẫn giữ 2 phẩm.</div></CardContent></Card>) : null}<Card className="rounded-[28px]"><CardHeader className="space-y-3"><div className="flex items-center justify-between gap-3"><CardTitle>Săn hoa linh</CardTitle>{canManageSpiritHunt ? <Button onClick={saveSpiritHuntSlots} disabled={savingSpiritHunt}>{savingSpiritHunt ? "Đang lưu..." : "Lưu"}</Button> : null}</div>{spiritHuntMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{spiritHuntMessage}</div> : null}</CardHeader><CardContent><div className="grid gap-4 xl:grid-cols-2">{spiritHuntSlots.map((slot) => { const selectedMembers = slot.memberIds.map((id) => memberById.get(String(id))).filter(Boolean); const memberSearchValue = spiritHuntMemberSearch[slot.slotKey] || ""; const filteredSlotMembers = activeMembers.filter((member) => member.name.toLowerCase().includes(memberSearchValue.trim().toLowerCase())); return (<Card key={slot.slotKey} className="rounded-[22px] border shadow-none"><CardHeader className="space-y-2 pb-3 text-[75%]">{canManageSpiritHunt ? (<div className="grid gap-2 sm:grid-cols-2"><div className="space-y-1.5"><Label className="text-[11px]">Tên khung</Label><Input value={slot.title} onChange={(e) => updateSpiritHuntSlot(slot.slotKey, () => ({ title: e.target.value }))} className="h-9 text-[12px]" /></div><div className="space-y-1.5"><Label className="text-[11px]">Khung giờ</Label><Input value={slot.timeLabel} onChange={(e) => updateSpiritHuntSlot(slot.slotKey, () => ({ timeLabel: e.target.value }))} className="h-9 text-[12px]" /></div></div>) : (<div><CardTitle className="text-base">{slot.title}</CardTitle><p className="text-[12px] text-slate-500">{slot.timeLabel || "Chưa đặt giờ"}</p></div>)}</CardHeader><CardContent className="space-y-3 pt-0 text-[75%]">{isAdmin ? (<><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={memberSearchValue} onChange={(e) => setSpiritHuntMemberSearch((prev) => ({ ...prev, [slot.slotKey]: e.target.value }))} placeholder="Tìm thành viên..." className="h-9 pl-9 text-[12px]" /></div><ScrollArea className="h-[170px] pr-2"><div className="space-y-2.5">{filteredSlotMembers.map((member) => { const checked = slot.memberIds.includes(String(member.id)); const memberTitle = titleByMemberId.get(String(member.id)); return (<label key={`${slot.slotKey}-${member.id}`} className="flex cursor-pointer items-start gap-2.5 rounded-2xl border p-3 hover:bg-slate-50"><Checkbox checked={checked} onCheckedChange={() => toggleSpiritHuntMember(slot.slotKey, member.id)} /><div className="flex-1"><div className="flex items-start justify-between gap-2"><div><p className="text-[12px] font-medium leading-snug">{member.name}</p></div>{memberTitle?.name ? <Badge className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div></div></label>); })}</div></ScrollArea><div className="space-y-2.5 rounded-2xl border bg-slate-50 p-3 text-[12px] text-slate-600"><div>Đã chọn: <span className="font-semibold text-slate-900">{selectedMembers.length}</span> thành viên</div><div className="flex flex-wrap gap-2">{selectedMembers.length === 0 ? <span className="text-slate-400">Chưa chọn thành viên nào.</span> : selectedMembers.map((member) => { const memberTitle = titleByMemberId.get(String(member.id)); return <div key={`selected-spirit-${slot.slotKey}-${member.id}`} className="inline-flex max-w-full items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-[12px]"><span className="break-words">{member.name}</span>{memberTitle?.name ? <Badge className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div>; })}</div></div></>) : (<div className="flex flex-wrap gap-2">{selectedMembers.length === 0 ? <SectionEmpty>Chưa có thành viên nào ở khung này.</SectionEmpty> : selectedMembers.map((member) => { const memberTitle = titleByMemberId.get(String(member.id)); return <div key={`${slot.slotKey}-${member.id}`} className="inline-flex items-center gap-2 rounded-full border bg-slate-50 px-3 py-1.5 text-[12px]"><span>{member.name}</span>{memberTitle?.name ? <Badge className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div>; })}</div>)}</CardContent></Card>); })}</div></CardContent></Card></div></TabsContent>
        </TabsProvider>
      </div>
    </div>
  );
}
