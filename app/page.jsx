"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@supabase/supabase-js";

const FLOWER_GROUPS = ["Lục", "Lam", "Tím", "Vàng", "Đỏ"];
const MEMBER_FLOWER_GROUP_ORDER = ["Đỏ", "Vàng", "Tím", "Lam", "Lục"];
const SUPABASE_URL = "https://tewaxvsxbktcexduvfjv.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRld2F4dnN4Ymt0Y2V4ZHV2Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTIxMjksImV4cCI6MjA5MTcyODEyOX0.0VpLpXpR_gGk7p5RiCEL0bK4_EnhAUoqhLpieTL-4zI";
const ADMIN_EMAILS = ["lehuuhung133132@gmail.com", "tranduytunghp160992@gmail.com"];
const SUPER_ADMIN_EMAILS = ["lehuuhung133132@gmail.com"];
const MANAGER_EMAILS = ["tranduytunghp160992@gmail.com"];
const FLOWER_ICON_BUCKET = "flower-icons";
const SUPABASE_STORAGE_KEY_PREFIX = "sb-";
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

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const GROUP_STYLES = {
  Lục: "!border-green-400 !bg-green-500 !text-white",
  Lam: "!border-blue-400 !bg-blue-500 !text-white",
  Tím: "!border-violet-400 !bg-violet-500 !text-white",
  Vàng: "!border-amber-400 !bg-amber-500 !text-white",
  Đỏ: "!border-red-400 !bg-red-500 !text-white",
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
function Input({ className = "", ...props }) {
  return <input className={cn("w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400", className)} {...props} />;
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

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div className={cn("relative max-h-[90vh] w-full max-w-xl overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-[0_32px_100px_-36px_rgba(15,23,42,0.55)]", className)}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),transparent_60%),radial-gradient(circle_at_right,_rgba(168,85,247,0.10),transparent_55%)]" />
        <button
          type="button"
          onClick={() => onOpenChange?.(false)}
          className="absolute right-5 top-5 z-10 inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          Đóng
        </button>
        <div className="max-h-[90vh] overflow-auto px-5 pb-5 pt-14 sm:px-6 sm:pb-6 sm:pt-16">
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
function Tabs({ value, onValueChange, className = "", children }) {
  return <div className={className} data-value={value} data-onchange={onValueChange}>{children}</div>;
}
function TabsContent({ value, children }) {
  const parent = React.useContext(TabsContext);
  if (!parent || parent.value !== value) return null;
  return <div>{children}</div>;
}
function TabsList() { return null; }
function TabsTrigger() { return null; }
const TabsContext = React.createContext(null);
function TabsProvider({ value, onValueChange, children, className = "" }) {
  return <TabsContext.Provider value={{ value, onValueChange }}><div className={className}>{children}</div></TabsContext.Provider>;
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
async function getSafeCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (isInvalidRefreshTokenError(error)) {
        clearSupabaseAuthStorage();
        try { await supabase.auth.signOut({ scope: "local" }); } catch {}
        return { user: null, message: "Phiên đăng nhập cũ đã hết hạn và đã được làm sạch.", shouldRetry: false };
      }
      if (isAuthLockError(error)) return { user: null, message: "Trình duyệt đang đồng bộ phiên đăng nhập.", shouldRetry: true };
      return { user: null, message: `Không đọc được phiên đăng nhập: ${error.message}`, shouldRetry: false };
    }
    return { user: data.user || null, message: "", shouldRetry: false };
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
    const { data, error } = await supabase.from("member_flowers").select("id, member_id, flower_id").order("id", { ascending: true }).range(from, from + pageSize - 1);
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
  if (flower?.iconUrl) {
    return <div className={cn("overflow-hidden rounded-2xl border bg-white", sizeClass)}><img src={flower.iconUrl} alt={flower.name} className="h-full w-full object-cover" loading="lazy" decoding="async" /></div>;
  }
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
      <CardContent className="flex min-h-[96px] items-center gap-4 p-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
          <div className="flex h-6 w-6 items-center justify-center">
            {icon}
          </div>
        </div>

        <div className="flex min-h-[52px] flex-1 flex-col justify-center">
          <p className="text-sm leading-tight text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold leading-none text-slate-950">{value}</p>
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

function EditFlowerForm({ flower, onSave }) {
  const [name, setName] = useState(flower.name || "");
  const [group, setGroup] = useState(flower.group || "Lục");
  const [iconUrl, setIconUrl] = useState(flower.iconUrl || "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  return <div className="space-y-4"><div className="space-y-2"><Label>Tên hoa</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div><div className="space-y-2"><Label>Nhóm hoa</Label><Select value={group} onValueChange={setGroup}><SelectContent>{FLOWER_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Icon URL</Label><Input value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} /></div><Button className="w-full" disabled={saving} onClick={async () => { setSaving(true); const result = await onSave({ name, group, iconUrl }); setSaving(false); setMessage(result.message); }}>{saving ? "Đang lưu..." : "Lưu thông tin hoa"}</Button>{message ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{message}</div> : null}</div>;
}

function MemberFlowersCheckDialogContent({ member, flowersByGroup }) {
  const [searchText, setSearchText] = useState("");
  const normalizedSearch = normalizeFlowerLookupText(searchText);
  const filteredFlowersByGroup = useMemo(() => {
    const next = { Đỏ: [], Vàng: [], Tím: [], Lam: [], Lục: [] };
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
  const [loginEmail, setLoginEmail] = useState("");
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
  const [oneQuestMemberSearch, setOneQuestMemberSearch] = useState("");
  const [completedMemberSearch, setCompletedMemberSearch] = useState("");
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
  const [accountPermissions, setAccountPermissions] = useState([]);
  const [accountPermissionsLoaded, setAccountPermissionsLoaded] = useState(false);
  const [accountPermissionMessage, setAccountPermissionMessage] = useState("");
  const [permissionEmailInput, setPermissionEmailInput] = useState("dinhsang199816@gmail.com");
  const [permissionMemberId, setPermissionMemberId] = useState("none");
  const [savingAccountPermission, setSavingAccountPermission] = useState(false);
  const [currentAccountPermission, setCurrentAccountPermission] = useState(null);
  const [memberCheckDialogOpenId, setMemberCheckDialogOpenId] = useState(null);
  const [memberEditDialogOpenId, setMemberEditDialogOpenId] = useState(null);

  const activeTabRef = useRef("dashboard");
  const isAdminRef = useRef(false);

  const userEmail = useMemo(() => user?.email?.toLowerCase() || "", [user]);
  const isAdmin = useMemo(() => ADMIN_EMAILS.map((x) => x.toLowerCase()).includes(userEmail), [userEmail]);
  const isSuperAdmin = useMemo(() => SUPER_ADMIN_EMAILS.map((x) => x.toLowerCase()).includes(userEmail), [userEmail]);
  const isManager = useMemo(() => MANAGER_EMAILS.map((x) => x.toLowerCase()).includes(userEmail), [userEmail]);
  const adminButtonLabel = useMemo(() => (isManager ? "Manager" : isAdmin ? "Admin" : "Đăng nhập"), [isAdmin, isManager]);
  const canManageArt = useMemo(() => isAdmin || isManager, [isAdmin, isManager]);
  const isRestrictedEditor = useMemo(() => !isAdmin && currentAccountPermission?.role === "member_editor", [isAdmin, currentAccountPermission]);
  const canAccessOwnershipUpdate = useMemo(() => isAdmin || isRestrictedEditor, [isAdmin, isRestrictedEditor]);
  const restrictedMemberId = useMemo(() => currentAccountPermission?.memberId ? String(currentAccountPermission.memberId) : "", [currentAccountPermission]);

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
          const permission = await getAccountPermissionForEmail(normalizedEmail);
          if (active) setCurrentAccountPermission(permission);
        } else {
          setCurrentAccountPermission(null);
        }
      } else {
        setCurrentAccountPermission(null);
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
          const permission = await getAccountPermissionForEmail(normalizedEmail);
          if (active) setCurrentAccountPermission(permission);
        } else {
          setCurrentAccountPermission(null);
        }
      } else {
        setCurrentAccountPermission(null);
      }
      if (session?.user) setLoginMessage("");
    });
    return () => { active = false; if (retryTimer) window.clearTimeout(retryTimer); sub.data.subscription.unsubscribe(); };
  }, []);

  async function loadOwnershipData() {
    const result = await fetchAllOwnershipRows();
    if (result.error) throw new Error(result.error.message);
    const map = new Map();
    (result.data || []).forEach((row) => { const key = `${row.member_id}-${row.flower_id}`; if (!map.has(key)) map.set(key, row); });
    setOwnerships(Array.from(map.values()).map(normalizeOwnershipRow));
  }
  async function loadTitlesData() {
    const [titlesRes, memberTitlesRes] = await Promise.all([supabase.from("titles").select("id, name").order("name", { ascending: true }), supabase.from("member_titles").select("id, member_id, title_id")]);
    if (titlesRes.error || memberTitlesRes.error) { setTitleFeatureAvailable(false); setTitles([]); setMemberTitles([]); setTitlesLoaded(true); return; }
    setTitleFeatureAvailable(true);
    setTitles((titlesRes.data || []).map((t) => ({ id: String(t.id), name: t.name })));
    setMemberTitles((memberTitlesRes.data || []).map((row) => ({ id: String(row.id), memberId: String(row.member_id), titleId: String(row.title_id) })));
    setTitlesLoaded(true);
  }
  async function loadHistoryData() {
    const { data, error } = await supabase.from("action_logs").select("id, action_type, actor_name, target_type, target_name, details, created_at").order("created_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message || "Không tải được lịch sử thao tác.");
    setHistoryLogs((data || []).map((log) => ({ id: String(log.id), actionType: log.action_type || "", actorName: log.actor_name || "Hệ thống", targetType: log.target_type || "", targetName: log.target_name || "", details: log.details || "", createdAt: log.created_at || "" })));
    setHistoryLoaded(true);
  }
  async function loadSpiritHuntData() {
    const { data, error } = await supabase.from("spirit_hunt_slots").select("slot_key, title, time_label, member_ids").order("slot_key", { ascending: true });
    if (error) { setSpiritHuntSlots(DEFAULT_SPIRIT_HUNT_SLOTS); setSpiritHuntLoaded(true); return; }
    const slotMap = new Map(DEFAULT_SPIRIT_HUNT_SLOTS.map((slot) => [slot.slotKey, slot]));
    (data || []).forEach((row) => { slotMap.set(String(row.slot_key), { slotKey: String(row.slot_key), title: row.title || "", timeLabel: row.time_label || "", memberIds: Array.isArray(row.member_ids) ? row.member_ids.map(String) : [] }); });
    setSpiritHuntSlots(DEFAULT_SPIRIT_HUNT_SLOTS.map((slot) => slotMap.get(slot.slotKey) || slot));
    setSpiritHuntLoaded(true);
  }
  async function loadPriorityRaceData() {
    const { data, error } = await supabase.from("priority_race_config").select("entries").eq("config_key", "main").maybeSingle();
    if (error) {
      setPriorityRaceEntries([]);
      setOneQuestMemberIds([]);
      setCompletedMemberIds([]);
      setPriorityRaceLoaded(true);
      return;
    }

    const rawEntries = Array.isArray(data?.entries) ? data.entries : [];
    const metaEntry = rawEntries.find((entry) => entry?.__metaType === "priority_race_meta") || null;
    const normalEntries = rawEntries.filter((entry) => entry?.__metaType !== "priority_race_meta");

    setPriorityRaceEntries(
      normalEntries.map((entry, index) => ({
        id: String(entry?.id || `${entry?.member_id || "member"}-${index}`),
        memberId: String(entry?.member_id || "none"),
        flowerIds: Array.isArray(entry?.flower_ids) ? entry.flower_ids.map(String) : [],
      }))
    );
    setOneQuestMemberIds(Array.isArray(metaEntry?.one_quest_member_ids) ? metaEntry.one_quest_member_ids.map(String) : []);
    setCompletedMemberIds(Array.isArray(metaEntry?.completed_member_ids) ? metaEntry.completed_member_ids.map(String) : []);
    setPriorityRaceLoaded(true);
  }

  async function persistPriorityRaceConfig(nextEntries, nextOneQuestMemberIds = oneQuestMemberIds, nextCompletedMemberIds = completedMemberIds) {
    const payloadEntries = [
      ...nextEntries.map((entry) => ({
        id: entry.id,
        member_id: entry.memberId,
        flower_ids: entry.flowerIds,
      })),
      {
        __metaType: "priority_race_meta",
        one_quest_member_ids: nextOneQuestMemberIds.map(String),
        completed_member_ids: nextCompletedMemberIds.map(String),
      },
    ];

    return supabase.from("priority_race_config").upsert(
      {
        config_key: "main",
        entries: payloadEntries,
      },
      { onConflict: "config_key" }
    );
  }
  async function loadAccountPermissionsData() {
    const { data, error } = await supabase.from("account_permissions").select("id, email, role, member_id").order("email", { ascending: true });
    if (error) { setAccountPermissions([]); setAccountPermissionsLoaded(true); return; }
    setAccountPermissions((data || []).map((row) => ({ id: String(row.id), email: String(row.email || "").toLowerCase(), role: row.role || "member_editor", memberId: row.member_id ? String(row.member_id) : "" })));
    setAccountPermissionsLoaded(true);
  }
  async function getAccountPermissionForEmail(email) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) return null;
    const { data, error } = await supabase.from("account_permissions").select("id, email, role, member_id").eq("email", normalizedEmail).maybeSingle();
    if (error || !data) return null;
    return { id: String(data.id), email: String(data.email || "").toLowerCase(), role: data.role || "member_editor", memberId: data.member_id ? String(data.member_id) : "" };
  }
  async function loadArtVasesData() {
    const { data, error } = await supabase.from("art_vases").select("id, name, icon_url, vase_group, main_flower_ids, secondary_flower_ids, accent_flower_ids").order("name", { ascending: true });
    if (error) { setArtVases([]); setArtVaseMessage("Chưa có bảng art_vases trong Supabase hoặc chưa tải được dữ liệu Hoa nghệ thuật."); setArtVasesLoaded(true); return; }
    setArtVases((data || []).map((row) => ({ id: String(row.id), name: row.name || "", iconUrl: row.icon_url || "", vaseGroup: row.vase_group || "Lục", mainFlowerIds: Array.isArray(row.main_flower_ids) ? row.main_flower_ids.map(String) : [], secondaryFlowerIds: Array.isArray(row.secondary_flower_ids) ? row.secondary_flower_ids.map(String) : [], accentFlowerIds: Array.isArray(row.accent_flower_ids) ? row.accent_flower_ids.map(String) : [] })));
    setArtVaseMessage(""); setArtVasesLoaded(true);
  }
  async function loadAllData(options = {}) {
    const { silent = false, includeTitles = false, includeHistory = false, includeSpiritHunt = false, includePriorityRace = false } = options;
    if (!silent) { setLoading(true); setPageMessage(""); }
    try {
      const [membersRes, flowersRes] = await Promise.all([
        supabase.from("members").select("id, name, birth_year, gender, left_guild, show_in_lookup").order("name", { ascending: true }),
        supabase.from("flowers").select("id, name, group_name, icon_url").order("name", { ascending: true }),
      ]);
      if (membersRes.error || flowersRes.error) throw new Error(membersRes.error?.message || flowersRes.error?.message || "Không tải được dữ liệu.");
      setMembers((membersRes.data || []).map((m) => ({ id: String(m.id), name: m.name, birthYear: m.birth_year || null, gender: m.gender || "", leftGuild: Boolean(m.left_guild), showInLookup: Boolean(m.show_in_lookup) })));
      setFlowers((flowersRes.data || []).map((f) => ({ id: String(f.id), name: f.name, group: f.group_name, iconUrl: f.icon_url || "" })));
      setLastSyncedAt(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      const extra = [loadOwnershipData()];
      if (includeTitles) extra.push(loadTitlesData());
      if (includeHistory) extra.push(loadHistoryData());
      if (includeSpiritHunt) extra.push(loadSpiritHuntData());
      if (includePriorityRace) extra.push(loadPriorityRaceData());
      await Promise.all(extra);
    } catch (error) {
      setPageMessage(`Không tải được dữ liệu: ${error?.message || "Lỗi không xác định"}`);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => { loadAllData({ includeTitles: shouldLoadTitlesForTab(activeTabRef.current, isAdminRef.current), includeHistory: shouldLoadHistoryForTab(activeTabRef.current), includeSpiritHunt: shouldLoadSpiritHuntForTab(activeTabRef.current), includePriorityRace: shouldLoadPriorityRaceForTab(activeTabRef.current) }); }, []);
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
    if (activeTab === "titlemanagement" && isSuperAdmin && !accountPermissionsLoaded) loadAccountPermissionsData().catch((e) => setPageMessage(e.message));
  }, [activeTab, isAdmin, titlesLoaded, historyLoaded, spiritHuntLoaded, priorityRaceLoaded, accountPermissionsLoaded, artVasesLoaded, isSuperAdmin]);

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
    const counts = { Đỏ: 0, Vàng: 0, Tím: 0, Lam: 0, Lục: 0 };
    flowers.forEach((f) => { if (ownedIds.has(String(f.id))) counts[f.group] = (counts[f.group] || 0) + 1; });
    return counts;
  }, [flowers, activeOwnerships]);
  const groupProgressRows = useMemo(() => MEMBER_FLOWER_GROUP_ORDER.map((group) => {
    const total = flowers.filter((f) => f.group === group).length;
    const owned = groupOwnedCounts[group] || 0;
    return { group, total, owned, percent: total ? Math.round((owned / total) * 100) : 0 };
  }), [flowers, groupOwnedCounts]);
  const missingFlowers = useMemo(() => flowers.filter((f) => !activeOwnersByFlower.get(String(f.id))?.length), [flowers, activeOwnersByFlower]);
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
        const ageA = a.ageValue ?? -1; const ageB = b.ageValue ?? -1;
        if (ageA !== ageB) return memberSortDirection === "desc" ? ageB - ageA : ageA - ageB;
        return a.name.localeCompare(b.name, "vi");
      }
      const rankMap = memberSortDirection === "male_first" ? genderRankMaps.male_first : genderRankMaps.female_first;
      const rankA = rankMap[a.normalizedGender] ?? 99; const rankB = rankMap[b.normalizedGender] ?? 99;
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
  const filteredActiveMembers = useMemo(() => filteredMembers.filter((m) => !isFormerMember(m)), [filteredMembers]);
  const filteredFormerMembers = useMemo(() => filteredMembers.filter((m) => isFormerMember(m)), [filteredMembers]);
  const memberFlowersByMemberId = useMemo(() => {
    const grouped = {};
    ownerships.forEach((row) => {
      const flower = flowerById.get(String(row.flowerId));
      if (!flower) return;
      const memberId = String(row.memberId);
      if (!grouped[memberId]) grouped[memberId] = { Đỏ: [], Vàng: [], Tím: [], Lam: [], Lục: [] };
      grouped[memberId][flower.group].push(flower);
    });
    Object.values(grouped).forEach((groupMap) => MEMBER_FLOWER_GROUP_ORDER.forEach((group) => { groupMap[group] = (groupMap[group] || []).sort((a, b) => a.name.localeCompare(b.name, "vi")); }));
    return grouped;
  }, [ownerships, flowerById]);
  const filteredExistingMembers = useMemo(() => members.filter((m) => m.name.toLowerCase().includes(memberPickerSearch.trim().toLowerCase())).sort((a, b) => a.name.localeCompare(b.name, "vi")), [members, memberPickerSearch]);
  const filteredFlowers = useMemo(() => flowers.filter((flower) => normalizeFlowerLookupText(flower.name).includes(normalizeFlowerLookupText(flowerSearch))), [flowers, flowerSearch]);
  const filteredMemberFlowerLookupOptions = useMemo(() => lookupVisibleMembers.filter((m) => !memberFlowerLookupSearch.trim() || m.name.toLowerCase().includes(memberFlowerLookupSearch.trim().toLowerCase())).sort((a, b) => a.name.localeCompare(b.name, "vi")), [lookupVisibleMembers, memberFlowerLookupSearch]);
  const selectedMemberFlowerLookup = useMemo(() => lookupVisibleMembers.find((m) => String(m.id) === String(memberFlowerLookup)) || null, [lookupVisibleMembers, memberFlowerLookup]);
  const selectedExistingMember = useMemo(() => members.find((m) => String(m.id) === String(selectedExistingMemberId)) || null, [members, selectedExistingMemberId]);
  const flowersBySelectedMember = useMemo(() => {
    if (!selectedMemberFlowerLookup) return [];
    const ids = new Set(ownerships.filter((row) => String(row.memberId) === String(selectedMemberFlowerLookup.id)).map((row) => String(row.flowerId)));
    return flowers.filter((flower) => ids.has(String(flower.id)));
  }, [selectedMemberFlowerLookup, ownerships, flowers]);
  const memberFlowersByGroup = useMemo(() => {
    const grouped = { Đỏ: [], Vàng: [], Tím: [], Lam: [], Lục: [] };
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
  const filteredTitleMembers = useMemo(() => members.filter((member) => member.name.toLowerCase().includes(titleMemberSearch.trim().toLowerCase())).sort((a, b) => a.name.localeCompare(b.name, "vi")), [members, titleMemberSearch]);
  const filteredTitles = useMemo(() => titles.filter((title) => title.name.toLowerCase().includes(titleManageSearch.trim().toLowerCase())).sort((a, b) => a.name.localeCompare(b.name, "vi")), [titles, titleManageSearch]);
  const priorityRaceMember = useMemo(() => members.find((member) => String(member.id) === String(priorityRaceForm.memberId)) || null, [members, priorityRaceForm.memberId]);
  const priorityRaceAvailableFlowers = useMemo(() => {
    if (!priorityRaceMember) return [];
    const owned = new Set(ownerships.filter((row) => String(row.memberId) === String(priorityRaceMember.id)).map((row) => String(row.flowerId)));
    const groupOrder = MEMBER_FLOWER_GROUP_ORDER.reduce((acc, group, index) => { acc[group] = index; return acc; }, {});
    return flowers.filter((flower) => owned.has(String(flower.id))).sort((a, b) => { const byGroup = (groupOrder[a.group] ?? 99) - (groupOrder[b.group] ?? 99); if (byGroup !== 0) return byGroup; return a.name.localeCompare(b.name, "vi"); });
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
  const filteredPriorityRaceEntries = useMemo(() => {
    const q = normalizeFlowerLookupText(priorityRaceListSearch);
    return priorityRaceEntries.map((entry) => {
      const member = memberById.get(String(entry.memberId)) || null;
      const allFlowersForEntry = entry.flowerIds.map((id) => flowerById.get(String(id))).filter(Boolean);
      const matchedFlowersForEntry = q ? allFlowersForEntry.filter((flower) => normalizeFlowerLookupText(flower.name).includes(q)) : allFlowersForEntry;
      return { ...entry, member, flowersForEntry: matchedFlowersForEntry, totalFlowersForEntry: allFlowersForEntry.length };
    }).filter((entry) => entry.flowersForEntry.length > 0);
  }, [priorityRaceEntries, priorityRaceListSearch, memberById, flowerById]);
  const filteredPriorityRaceMembers = useMemo(() => {
    const q = priorityRaceMemberSearch.trim().toLowerCase();
    return members.filter((member) => !q || member.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [members, priorityRaceMemberSearch]);
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
  const oneQuestMemberIdSet = useMemo(() => new Set(oneQuestMemberIds.map(String)), [oneQuestMemberIds]);
  const historyEntries = useMemo(() => historyLogs.map((log) => {
    const member = members.find((item) => item.name === log.targetName) || null;
    const memberTitle = member ? titleByMemberId.get(String(member.id)) : null;
    const flowerItems = extractFlowerNamesFromHistoryDetails(log.details).map((name) => ({ name, flower: flowers.find((flower) => normalizeFlowerLookupText(flower.name) === normalizeFlowerLookupText(name)) || null }));
    let summaryText = log.details || "";
    if (log.actionType === "update_ownership") summaryText = `Đã thêm ${flowerItems.length} hoa`;
    if (log.actionType === "remove_ownership") summaryText = `Đã gỡ ${flowerItems.length} hoa`;
    return { ...log, member, memberTitle, flowerItems, summaryText };
  }), [historyLogs, members, flowers, titleByMemberId]);
  const artFlowerMapByType = useMemo(() => ({ mainFlowerIds: artVaseForm.mainFlowerIds.map((id) => flowerById.get(String(id))).filter(Boolean), secondaryFlowerIds: artVaseForm.secondaryFlowerIds.map((id) => flowerById.get(String(id))).filter(Boolean), accentFlowerIds: artVaseForm.accentFlowerIds.map((id) => flowerById.get(String(id))).filter(Boolean) }), [artVaseForm, flowerById]);
  const filteredArtLookupMembers = useMemo(() => lookupVisibleMembers.filter((member) => !artLookupMemberSearch.trim() || member.name.toLowerCase().includes(artLookupMemberSearch.trim().toLowerCase())).sort((a, b) => a.name.localeCompare(b.name, "vi")), [lookupVisibleMembers, artLookupMemberSearch]);
  const selectedArtLookupMember = useMemo(() => lookupVisibleMembers.find((member) => String(member.id) === String(artLookupMemberId)) || null, [lookupVisibleMembers, artLookupMemberId]);
  const isGuildArtLookup = artLookupMemberId === "guild";
  const scopedArtOwnerships = useMemo(() => {
    if (isGuildArtLookup) return activeOwnerships;
    if (!selectedArtLookupMember) return [];
    return ownerships.filter((row) => String(row.memberId) === String(selectedArtLookupMember.id));
  }, [isGuildArtLookup, activeOwnerships, ownerships, selectedArtLookupMember]);
  const filteredArtFlowersByType = useMemo(() => {
    const build = (key) => { const q = normalizeFlowerLookupText(artFlowerSearchByType[key] || ""); return flowers.filter((flower) => !q || normalizeFlowerLookupText(flower.name).includes(q)).sort((a, b) => a.name.localeCompare(b.name, "vi")); };
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
      const mainIds = vase.mainFlowerIds.map(String); const secondaryIds = vase.secondaryFlowerIds.map(String); const accentIds = vase.accentFlowerIds.map(String);
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

  async function signInAsAdmin() {
    setLoginMessage("");
    if (!loginEmail.trim() || !loginPassword.trim()) return setLoginMessage("Vui lòng nhập email và mật khẩu.");
    setLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail.trim(), password: loginPassword });
      if (error) return setLoginMessage(`Đăng nhập thất bại: ${error.message}`);
      const email = data.user?.email?.toLowerCase() || "";
      const permission = await getAccountPermissionForEmail(email);
      const allowedAdmin = ADMIN_EMAILS.map((item) => item.toLowerCase()).includes(email);
      const allowedEditor = permission?.role === "member_editor" && permission?.memberId;
      if (!allowedAdmin && !allowedEditor) {
        await supabase.auth.signOut({ scope: "local" });
        setUser(null); setCurrentAccountPermission(null);
        return setLoginMessage("Tài khoản này không có quyền truy cập chức năng quản trị/cập nhật.");
      }
      setCurrentAccountPermission(allowedAdmin ? null : permission);
      setUser(data.user || null);
      setLoginPassword(""); setAdminDialogOpen(false);
    } catch (error) {
      setLoginMessage(`Đăng nhập thất bại: ${error?.message || "Lỗi không xác định"}`);
    } finally { setLoggingIn(false); }
  }
  async function signOutAdmin() {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await supabase.auth.signOut({ scope: "local" }); } catch {}
    setUser(null); setCurrentAccountPermission(null); setLoginMessage(""); setLoginPassword(""); setLoggingOut(false);
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
    if (!isAdmin) return;
    setFlowerCreateMessage("");
    const name = newFlowerName.trim();
    if (!name || !newFlowerGroup) return setFlowerCreateMessage("Vui lòng nhập đủ tên hoa và nhóm hoa.");
    if (flowers.some((f) => normalizeFlowerLookupText(f.name) === normalizeFlowerLookupText(name))) return setFlowerCreateMessage("Loại hoa này đã tồn tại.");
    setSavingFlower(true);
    const { data, error } = await supabase.from("flowers").insert([{ name, group_name: newFlowerGroup, icon_url: newFlowerIconUrl.trim() || null }]).select("id, name").single();
    setSavingFlower(false);
    if (error) return setFlowerCreateMessage(`Không thêm được hoa mới: ${error.message}`);
    await logAction({ actionType: "add_flower", actorName: user?.email || "Quản trị hội", targetType: "flower", targetName: data.name, details: `Thêm hoa mới vào nhóm ${newFlowerGroup}` });
    await loadAllData();
    setNewFlowerName(""); setNewFlowerIconUrl(""); setNewFlowerGroup("Lục"); setFlowerCreateMessage(`Đã thêm hoa mới: ${data.name}.`);
  }
  useEffect(() => { if (isRestrictedEditor && restrictedMemberId) { setSelectedExistingMemberId(restrictedMemberId); setNewMemberName(""); } }, [isRestrictedEditor, restrictedMemberId]);
  async function getOrCreateMember() {
    if (isRestrictedEditor) {
      const restrictedMember = members.find((m) => String(m.id) === String(restrictedMemberId));
      if (!restrictedMember) return { error: "Không tìm thấy thành viên được cấp quyền cập nhật." };
      return { member: restrictedMember };
    }
    const trimmedNewMemberName = newMemberName.trim();
    if (selectedExistingMemberId !== "none") {
      const member = members.find((m) => String(m.id) === selectedExistingMemberId);
      if (!member) return { error: "Không tìm thấy thành viên đã chọn." };
      return { member };
    }
    if (!trimmedNewMemberName) return { error: "Hãy chọn thành viên cũ hoặc nhập tên thành viên mới." };
    const normalizedName = trimmedNewMemberName.replace(/\s+/g, " ").trim().toLowerCase();
    const existing = members.find((m) => m.name.replace(/\s+/g, " ").trim().toLowerCase() === normalizedName);
    if (existing) return { member: existing };
    const { data, error } = await supabase.from("members").insert([{ name: trimmedNewMemberName }]).select("id, name").single();
    if (error) return { error: `Không tạo được thành viên mới: ${error.message}` };
    await loadAllData();
    return { member: { id: String(data.id), name: data.name, birthYear: null, gender: "", leftGuild: false } };
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
    setSelectedFlowerIds([]); setSelectedExistingMemberId("none"); setNewMemberName(""); setUpdateMessage(`Đã cập nhật ${additions.length} loại hoa mới cho ${member.name}.`); await loadAllData();
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
    setSelectedRemovalFlowerIds([]); setUpdateMessage(`Đã gỡ ${removedFlowerIds.length} loại hoa khỏi ${selectedExistingMember.name}.`); await loadAllData();
  }
  async function renameMember(memberId, payload) {
    const trimmed = String(payload?.name || "").trim();
    if (!trimmed) return { ok: false, message: "Tên thành viên không được để trống." };
    const { error } = await supabase.from("members").update({ name: trimmed, birth_year: payload?.birthYear ?? null, gender: payload?.gender || null, left_guild: Boolean(payload?.leftGuild), show_in_lookup: Boolean(payload?.showInLookup) }).eq("id", memberId);
    if (error) return { ok: false, message: `Không sửa được thông tin thành viên: ${error.message}` };
    await loadAllData({ includeTitles: titlesLoaded, includeHistory: historyLoaded, includeSpiritHunt: spiritHuntLoaded, includePriorityRace: priorityRaceLoaded });
    return { ok: true, message: "Đã cập nhật thông tin thành viên." };
  }
  async function restoreFormerMember(member) {
    if (!isAdmin) return;
    const { error } = await supabase.from("members").update({ left_guild: false, show_in_lookup: false }).eq("id", member.id);
    if (error) return;
    await logAction({ actionType: "restore_member", actorName: user?.email || "Quản trị hội", targetType: "member", targetName: member.name, details: "Cho thành viên vào hội lại" });
    await loadAllData({ includeTitles: titlesLoaded, includeHistory: historyLoaded, includeSpiritHunt: spiritHuntLoaded, includePriorityRace: priorityRaceLoaded });
  }
  async function toggleFormerMemberLookup(member) {
    if (!isAdmin || !isFormerMember(member)) return;
    const nextValue = !Boolean(member.showInLookup);
    const { error } = await supabase.from("members").update({ show_in_lookup: nextValue }).eq("id", member.id);
    if (error) return;
    await logAction({ actionType: "toggle_former_member_lookup", actorName: user?.email || "Quản trị hội", targetType: "member", targetName: member.name, details: nextValue ? "Bật danh sách hoa cho mục tra cứu" : "Tắt danh sách hoa cho mục tra cứu" });
    await loadAllData({ includeTitles: titlesLoaded, includeHistory: historyLoaded, includeSpiritHunt: spiritHuntLoaded, includePriorityRace: priorityRaceLoaded });
  }
  async function renameFlower(flowerId, payload) {
    const trimmedName = String(payload?.name || "").trim();
    if (!trimmedName || !payload?.group) return { ok: false, message: "Tên hoa và nhóm hoa không được để trống." };
    const { error } = await supabase.from("flowers").update({ name: trimmedName, group_name: payload.group, icon_url: payload.iconUrl?.trim() || null }).eq("id", flowerId);
    if (error) return { ok: false, message: `Không sửa được hoa: ${error.message}` };
    await loadAllData();
    return { ok: true, message: "Đã cập nhật thông tin hoa." };
  }
  function toggleTitleMember(memberId) { setSelectedTitleMemberIds((prev) => prev.includes(String(memberId)) ? prev.filter((id) => id !== String(memberId)) : [...prev, String(memberId)]); }
  async function addTitleToDatabase() {
    if (!isAdmin || !titleFeatureAvailable) return;
    const name = newTitleName.trim();
    if (!name) return setTitleMessage("Vui lòng nhập tên chức danh.");
    if (titles.some((title) => title.name.toLowerCase() === name.toLowerCase())) return setTitleMessage("Chức danh này đã tồn tại.");
    setSavingTitle(true);
    const { data, error } = await supabase.from("titles").insert([{ name }]).select("id, name").single();
    setSavingTitle(false);
    if (error) return setTitleMessage(`Không thêm được chức danh: ${error.message}`);
    await logAction({ actionType: "add_title", actorName: user?.email || "Quản trị hội", targetType: "title", targetName: data.name, details: "Thêm chức danh mới" });
    setNewTitleName(""); setTitleMessage(`Đã thêm chức danh: ${data.name}.`); await loadAllData({ includeTitles: true });
  }
  async function saveTitleAssignments() {
    if (!isAdmin || !titleFeatureAvailable) return;
    if (selectedTitleId === "none") return setTitleMessage("Vui lòng chọn chức danh cần trao.");
    if (selectedTitleMemberIds.length === 0) return setTitleMessage("Vui lòng chọn ít nhất 1 thành viên.");
    setSavingTitle(true);
    const rows = selectedTitleMemberIds.map((memberId) => ({ member_id: String(memberId), title_id: String(selectedTitleId) }));
    const { error } = await supabase.from("member_titles").upsert(rows, { onConflict: "member_id" });
    setSavingTitle(false);
    if (error) return setTitleMessage(`Không lưu được chức danh: ${error.message}`);
    setSelectedTitleId("none"); setSelectedTitleMemberIds([]); setTitleMessage("Đã lưu trao chức danh."); await loadAllData({ includeTitles: true });
  }
  async function removeTitleFromMember(titleId, memberId) {
    if (!isAdmin || !titleFeatureAvailable) return;
    const { error } = await supabase.from("member_titles").delete().eq("title_id", titleId).eq("member_id", memberId);
    if (error) return setTitleMessage(`Không gỡ được chức danh: ${error.message}`);
    setTitleMessage("Đã gỡ chức danh khỏi thành viên."); await loadAllData({ includeTitles: true });
  }
  function updateSpiritHuntSlot(slotKey, updater) { setSpiritHuntSlots((prev) => prev.map((slot) => (slot.slotKey === slotKey ? { ...slot, ...updater(slot) } : slot))); }
  function toggleSpiritHuntMember(slotKey, memberId) { updateSpiritHuntSlot(slotKey, (slot) => ({ memberIds: slot.memberIds.includes(String(memberId)) ? slot.memberIds.filter((id) => id !== String(memberId)) : [...slot.memberIds, String(memberId)] })); }
  async function saveSpiritHuntSlots() {
    if (!isAdmin) return;
    setSavingSpiritHunt(true);
    const payload = spiritHuntSlots.map((slot) => ({ slot_key: slot.slotKey, title: String(slot.title || "").trim() || slot.title, time_label: String(slot.timeLabel || "").trim(), member_ids: slot.memberIds.map(String) }));
    const { error } = await supabase.from("spirit_hunt_slots").upsert(payload, { onConflict: "slot_key" });
    setSavingSpiritHunt(false);
    if (error) return setSpiritHuntMessage(`Không lưu được săn hoa linh: ${error.message}`);
    setSpiritHuntMessage("Đã cập nhật danh sách săn hoa linh."); await loadSpiritHuntData();
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
      const highestFlowers = ownedFlowers.filter((flower) => priorityRaceGroupRank(flower.group) === highestRank).sort((a, b) => a.name.localeCompare(b.name, "vi"));
      if (highestFlowers.length === 0) return null;
      return { id: `auto-${member.id}`, memberId: String(member.id), flowerIds: highestFlowers.map((flower) => String(flower.id)), highestGroupRank: highestRank, flowerCount: highestFlowers.length, memberName: member.name };
    }).filter(Boolean).sort((a, b) => { if (a.highestGroupRank !== b.highestGroupRank) return a.highestGroupRank - b.highestGroupRank; if (a.flowerCount !== b.flowerCount) return a.flowerCount - b.flowerCount; return a.memberName.localeCompare(b.memberName, "vi"); }).map(({ id, memberId, flowerIds }) => ({ id, memberId, flowerIds }));
    setSavingPriorityRace(true);
    const { error } = await persistPriorityRaceConfig(rebuiltEntries, oneQuestMemberIds, completedMemberIds);
    setSavingPriorityRace(false);
    if (error) return setPriorityRaceMessage(`Không cập nhật được danh sách ưu tiên đua hội: ${error.message}`);
    await logAction({ actionType: "rebuild_priority_race", actorName: user?.email || "Quản trị hội", targetType: "priority_race", targetName: "Ưu tiên đua hội", details: `Làm mới tự động ${rebuiltEntries.length} account theo phẩm hoa cao nhất` });
    setPriorityRaceEntries(rebuiltEntries); setPriorityRaceMessage(`Đã cập nhật lại danh sách ưu tiên đua hội cho ${rebuiltEntries.length} account.`);
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
    setPriorityRaceEntries(nextEntries); setPriorityRaceForm(DEFAULT_PRIORITY_RACE_FORM); setPriorityRaceFlowerSearch(""); setPriorityRaceSelectedFlowerSearch(""); setPriorityRaceGroupFilter("all"); setPriorityRaceMemberSearch(""); setPriorityRaceMessage(`Đã cộng thêm hoa ưu tiên cho ${savedMember?.name || "Không rõ thành viên"}.`);
  }
  async function removePriorityRaceEntry(entryId) {
    if (!isAdmin) return;
    const nextEntries = priorityRaceEntries.filter((entry) => String(entry.id) !== String(entryId));
    setSavingPriorityRace(true);
    const { error } = await persistPriorityRaceConfig(nextEntries);
    setSavingPriorityRace(false);
    if (error) return setPriorityRaceMessage(`Không xoá được mục ưu tiên đua hội: ${error.message}`);
    setPriorityRaceEntries(nextEntries); setPriorityRaceMessage("Đã xoá một mục ưu tiên đua hội.");
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
    const member = memberById.get(String(currentEntry.memberId)); const flower = flowerById.get(String(flowerId));
    await logAction({ actionType: "remove_priority_race_flower", actorName: user?.email || "Quản trị hội", targetType: "priority_race", targetName: member?.name || "Ưu tiên đua hội", details: `Gỡ hoa ưu tiên ${flower?.name || flowerId}` });
    setPriorityRaceEntries(nextEntries); setPriorityRaceMessage(`Đã gỡ ${flower?.name || "1 hoa"} khỏi danh sách ưu tiên.`);
  }
  async function addNextPriorityRaceGroup(entryId) {
    if (!isAdmin) return;
    const currentEntry = priorityRaceEntries.find((entry) => String(entry.id) === String(entryId));
    if (!currentEntry) return;
    const member = memberById.get(String(currentEntry.memberId));
    if (!member) return;
    const currentFlowers = currentEntry.flowerIds.map((id) => flowerById.get(String(id))).filter(Boolean);
    if (currentFlowers.length === 0) return;
    const currentLowestRank = currentFlowers.reduce((min, flower) => { const rank = priorityRaceGroupRank(flower.group); return min === 0 ? rank : Math.min(min, rank); }, 0);
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
    setPriorityRaceEntries(nextEntries); setPriorityRaceMessage(`Đã thêm phẩm ${nextGroup} cho ${member.name}.`);
  }
  function setArtVaseFormFromVase(vase) { setArtVaseForm({ name: vase?.name || "", iconUrl: vase?.iconUrl || "", vaseGroup: vase?.vaseGroup || "Lục", mainFlowerIds: vase?.mainFlowerIds || [], secondaryFlowerIds: vase?.secondaryFlowerIds || [], accentFlowerIds: vase?.accentFlowerIds || [] }); }
  function toggleArtVaseFlower(key, flowerId) {
    setArtVaseForm((prev) => {
      const current = prev[key].map(String); const id = String(flowerId);
      if (current.includes(id)) return { ...prev, [key]: current.filter((item) => item !== id) };
      if (current.length >= 3) return prev;
      return { ...prev, [key]: [...current, id] };
    });
  }
  async function uploadArtVaseIcon(file) {
    if (!canManageArt || !file) return;
    setUploadingArtVaseIcon(true); setArtVaseMessage("");
    try {
      const extension = String(file.name || "png").split(".").pop()?.toLowerCase() || "png";
      const safeExt = extension.replace(/[^a-z0-9]/g, "") || "png";
      const filePath = `vase-icons/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;
      const { error: uploadError } = await supabase.storage.from(FLOWER_ICON_BUCKET).upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (uploadError) { setArtVaseMessage(`Không tải được icon bình: ${uploadError.message}`); return; }
      const { data } = supabase.storage.from(FLOWER_ICON_BUCKET).getPublicUrl(filePath);
      const publicUrl = data?.publicUrl || "";
      if (!publicUrl) { setArtVaseMessage("Đã tải ảnh lên nhưng không lấy được URL công khai."); return; }
      setArtVaseForm((prev) => ({ ...prev, iconUrl: publicUrl })); setArtVaseMessage("Đã tải icon bình lên thành công.");
    } catch (error) { setArtVaseMessage(`Không tải được icon bình: ${error?.message || "Lỗi không xác định"}`); } finally { setUploadingArtVaseIcon(false); }
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
    setArtVaseMessage(selectedArtVaseId !== "new" ? "Đã cập nhật bình hoa." : "Đã tạo bình hoa mới."); setSelectedArtVaseId("new"); setArtVaseForm(DEFAULT_ART_VASE_FORM); await loadArtVasesData();
  }
  async function deleteArtVase() {
    if (!canManageArt || selectedArtVaseId === "new") return;
    setSavingArtVase(true);
    const currentVase = artVases.find((item) => String(item.id) === String(selectedArtVaseId));
    const { error } = await supabase.from("art_vases").delete().eq("id", selectedArtVaseId);
    setSavingArtVase(false);
    if (error) return setArtVaseMessage(`Không xoá được bình hoa: ${error.message}`);
    await logAction({ actionType: "delete_art_vase", actorName: user?.email || "Quản trị hội", targetType: "art_vase", targetName: currentVase?.name || "Bình hoa", details: "Xoá bình hoa nghệ thuật" });
    setSelectedArtVaseId("new"); setArtVaseForm(DEFAULT_ART_VASE_FORM); setArtVaseMessage("Đã xoá bình hoa."); await loadArtVasesData();
  }
  function toggleArtSuggestionFlower(flowerId) { setArtSelectedSuggestionFlowerIds((prev) => prev.includes(String(flowerId)) ? prev.filter((id) => id !== String(flowerId)) : [...prev, String(flowerId)]); }
  function runArtSuggestionSearch() {
    const selectedIds = new Set(artSelectedSuggestionFlowerIds.map(String));
    const results = filteredArtLookupSuggestions.filter((row) => selectedIds.has(String(row.flower.id))).map((row) => ({ ...row, owners: (ownersByFlower.get(String(row.flower.id)) || []).slice().sort((a, b) => a.localeCompare(b, "vi")) }));
    setArtLookupSearchResults(results); setArtVarSuggestions([]);
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
    if (!isAdmin) return;
    const id = String(memberId);
    const nextOneQuest = oneQuestMemberIds.includes(id) ? oneQuestMemberIds.filter((item) => String(item) !== id) : [...oneQuestMemberIds, id];
    const nextCompleted = completedMemberIds.filter((item) => String(item) !== id);
    const { error } = await persistPriorityRaceConfig(priorityRaceEntries, nextOneQuest, nextCompleted);
    if (error) return setPriorityRaceMessage(`Không lưu được danh sách còn 1 quest: ${error.message}`);
    setOneQuestMemberIds(nextOneQuest);
    setCompletedMemberIds(nextCompleted);
  }
  async function toggleCompletedMember(memberId) {
    if (!isAdmin) return;
    const id = String(memberId);
    const isRemoving = completedMemberIds.includes(id);
    const nextCompleted = isRemoving ? completedMemberIds.filter((item) => String(item) !== id) : [...completedMemberIds, id];
    const nextOneQuest = oneQuestMemberIds.filter((item) => String(item) !== id);
    const nextEntries = isRemoving ? priorityRaceEntries : priorityRaceEntries.filter((entry) => String(entry.memberId) !== id);
    const { error } = await persistPriorityRaceConfig(nextEntries, nextOneQuest, nextCompleted);
    if (error) return setPriorityRaceMessage(`Không lưu được danh sách hoàn thành: ${error.message}`);
    setCompletedMemberIds(nextCompleted);
    setOneQuestMemberIds(nextOneQuest);
    setPriorityRaceEntries(nextEntries);
    if (!isRemoving && String(priorityRaceForm.memberId) === id) setPriorityRaceForm(DEFAULT_PRIORITY_RACE_FORM);
  }

  const visibleTabs = [
    { value: "dashboard", label: "Tổng quan" },
    { value: "members", label: "Thành viên" },
    { value: "flowerlookup", label: "Tra cứu theo hoa" },
    { value: "memberflowerlookup", label: "Tra cứu theo thành viên" },
    ...(canAccessOwnershipUpdate ? [{ value: "update", label: "Cập nhật sở hữu" }] : []),
    ...(isAdmin ? [{ value: "titlemanagement", label: "Quản lý chức danh" }] : []),
    { value: "addflower", label: "Hoa nghệ thuật" },
    { value: "history", label: "Lịch sử" },
    { value: "spirithunt", label: "Hoa linh/Đấu hội" },
  ];

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-8"><div className="mx-auto max-w-7xl rounded-3xl border bg-white p-8 text-slate-600">Đang tải dữ liệu...</div></div>;
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden antialiased text-slate-900 p-4 md:p-8"
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
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
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Selina Flower Dashboard</div>
          <h1 className="mt-3 font-serif text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl" style={{ color: "#ec4899" }}>Quản Lý Hoa Hội SELINA</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-600">Thành viên chỉ có thể tra cứu thông tin. Các chức năng quản trị chỉ hiển thị cho admin đã đăng nhập.</p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {topMembers.map((member, index) => <div key={member.id} className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs shadow-sm"><TrophyIcon className="h-3.5 w-3.5" /><span>Top {index + 1}: {member.name} ({member.ownedCount})</span></div>)}
            <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
              <DialogTrigger asChild><Button variant="outline" className="h-8 rounded-xl px-3 text-xs"><ShieldIcon className="mr-1 h-3.5 w-3.5" />{adminButtonLabel}</Button></DialogTrigger>
              <DialogContent className="sm:max-w-[560px]">
                <DialogHeader className="mb-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Selina Admin</div>
                  <DialogTitle className="mt-4 text-[28px] font-bold tracking-tight text-slate-950">{isAdmin ? "Tài khoản quản trị" : "Đăng nhập quản trị"}</DialogTitle>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Đăng nhập để mở quyền quản trị và cập nhật dữ liệu của hội.</p>
                </DialogHeader>
                {isAdmin ? (
                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                      Đã đăng nhập với tài khoản: <span className="font-semibold text-slate-900">{user?.email}</span>
                    </div>
                    <Button className="h-11 w-full rounded-2xl" variant="outline" onClick={signOutAdmin} disabled={loggingOut}>
                      {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="space-y-2.5">
                      <Label className="text-[15px] font-semibold text-slate-700">Email quản trị</Label>
                      <Input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="admin@email.com" className="h-12 rounded-[18px] border-slate-200 px-4 text-[15px]" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-[15px] font-semibold text-slate-700">Mật khẩu</Label>
                      <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" className="h-12 rounded-[18px] border-slate-200 px-4 text-[15px]" />
                    </div>
                    <Button className="h-12 w-full rounded-[18px] text-[15px] font-semibold shadow-[0_16px_40px_-22px_rgba(15,23,42,0.55)]" onClick={signInAsAdmin} disabled={loggingIn}>
                      {loggingIn ? "Đang đăng nhập..." : "Đăng nhập"}
                    </Button>
                    {loginMessage ? <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-700">{loginMessage}</div> : null}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
          {pageMessage ? <div className="mt-4 rounded-2xl border bg-red-50 p-3 text-sm text-red-700">{pageMessage}</div> : null}
          {lastSyncedAt ? <div className="mt-4 text-xs text-slate-500">Đồng bộ lần cuối: {lastSyncedAt}</div> : null}
        </div>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard icon={<UsersIcon className="h-5 w-5" />} title="Thành viên" value={summary.totalMembers} />
          <StatCard icon={<Flower2Icon className="h-5 w-5" />} title="Tổng loại hoa" value={summary.totalFlowers} />
          <StatCard icon={<DatabaseIcon className="h-5 w-5" />} title="Hội đã sở hữu" value={summary.ownedFlowers} />
          <StatCard icon={<AlertCircleIcon className="h-5 w-5" />} title="Hội còn thiếu" value={summary.missingFlowers} />
        </div>

        <TabsProvider value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="grid grid-cols-3 auto-rows-fr gap-2 rounded-[20px] border border-white/70 bg-white/85 p-2 md:hidden">
            {visibleTabs.map((tab) => <button key={tab.value} type="button" onClick={() => setActiveTab(tab.value)} className={cn("min-h-[56px] w-full rounded-2xl px-2 py-3 text-center text-[11px] leading-tight break-words transition-all", activeTab === tab.value ? "bg-slate-900 text-white shadow-md" : "bg-transparent text-slate-600")}>{tab.label}</button>)}
          </div>
          <div className="hidden md:flex md:w-full md:items-center md:gap-2 md:rounded-[28px] md:border md:border-slate-200/80 md:bg-white/90 md:p-2 md:shadow-sm">{visibleTabs.map((tab) => <button key={tab.value} type="button" onClick={() => setActiveTab(tab.value)} className={cn("flex h-12 min-w-0 flex-1 items-center justify-center rounded-[18px] px-3 text-center text-[13px] font-medium leading-tight transition-all duration-200", activeTab === tab.value ? "bg-slate-900 text-white shadow-sm" : "bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900")}><span className="line-clamp-2 break-words">{tab.label}</span></button>)}</div>

          <TabsContent value="dashboard"><div className="grid gap-4 xl:grid-cols-[1.1fr_1fr_1fr]"><Card className="rounded-[28px]"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Tiến độ sưu tập của hội</CardTitle><span className="text-sm text-slate-500">Theo nhóm</span></CardHeader><CardContent className="space-y-4"><div className="flex items-center gap-4 rounded-3xl border p-4"><CircleProgress percent={summary.completionRate} /><div><p className="text-sm text-slate-500">Tổng tiến độ</p><p className="text-2xl font-bold">{summary.ownedFlowers}/{summary.totalFlowers} ({summary.completionRate}%)</p></div></div><div className="grid gap-3 sm:grid-cols-2">{groupProgressRows.map((row) => { const style = groupProgressCircleStyle(row.group); return <div key={row.group} className="rounded-3xl border p-3"><div className="mb-2 flex items-center justify-between"><Badge className={groupBadgeClass(row.group)}>{row.group}</Badge><span className="text-sm font-semibold">{row.owned}/{row.total}</span></div><div className="flex items-center gap-3"><CircleProgress percent={row.percent} strokeColor={style.strokeColor} glowClass={style.glowClass} /><div><p className="font-semibold">Phẩm {row.group}</p><p className="text-sm text-slate-500">{row.percent}% hoàn thành</p></div></div></div>; })}</div></CardContent></Card><Card className="rounded-[28px]"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Hoa ít người sở hữu (1-3)</CardTitle><Select value={dashboardRareGroupFilter} onValueChange={setDashboardRareGroupFilter}><SelectContent><SelectItem value="all">Tất cả nhóm</SelectItem>{FLOWER_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></CardHeader><CardContent><ScrollArea className="h-[520px] pr-3"><div className="space-y-3">{filteredRareFlowers.map((flower) => <div key={flower.id} className="rounded-3xl border p-3"><div className="flex items-start gap-3"><FlowerThumbnail flower={flower} size="sm" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="font-semibold break-words">{flower.name}</p><Badge className={groupBadgeClass(flower.group)}>{flower.group}</Badge></div><p className="text-sm text-slate-500">{activeOwnersByFlower.get(String(flower.id))?.length || 0} người sở hữu</p><div className="mt-2 flex flex-wrap gap-2">{(activeOwnersByFlower.get(String(flower.id)) || []).map((owner) => <Badge key={`${flower.id}-${owner}`} variant="secondary">{owner}</Badge>)}</div></div></div></div>)}</div></ScrollArea></CardContent></Card><Card className="rounded-[28px]"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Hoa hội còn thiếu</CardTitle><Select value={dashboardMissingGroupFilter} onValueChange={setDashboardMissingGroupFilter}><SelectContent><SelectItem value="all">Tất cả nhóm</SelectItem>{FLOWER_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></CardHeader><CardContent><ScrollArea className="h-[520px] pr-3"><div className="space-y-3">{filteredMissingFlowers.map((flower) => <div key={flower.id} className="rounded-3xl border p-3"><div className="flex items-start gap-3"><FlowerThumbnail flower={flower} size="sm" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="font-semibold break-words">{flower.name}</p><Badge className={groupBadgeClass(flower.group)}>{flower.group}</Badge></div><p className="text-sm text-slate-500">Chưa có ai trong hội sở hữu</p></div></div></div>)}</div></ScrollArea></CardContent></Card></div></TabsContent>

          <TabsContent value="members"><Card className="rounded-[28px]"><CardHeader><CardTitle>Thành viên</CardTitle><p className="mt-1 text-sm text-slate-500">Số lượng thành viên: {summary.totalMembers} • Số lượng account: {activeMembers.length}</p></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 lg:grid-cols-[1fr_220px_220px] lg:items-end"><div className="hidden lg:block" /><div className="space-y-1"><Label>Sắp xếp theo</Label><Select value={memberSortField} onValueChange={(value) => { setMemberSortField(value); if (value === "name") setMemberSortDirection("asc"); if (value === "flowers") setMemberSortDirection("desc"); if (value === "age") setMemberSortDirection("desc"); if (value === "gender") setMemberSortDirection("male_first"); }}><SelectContent><SelectItem value="name">Tên</SelectItem><SelectItem value="flowers">Số lượng hoa</SelectItem><SelectItem value="age">Tuổi</SelectItem><SelectItem value="gender">Giới tính</SelectItem></SelectContent></Select></div><div className="space-y-1"><Label>Thứ tự</Label><Select value={memberSortDirection} onValueChange={setMemberSortDirection}><SelectContent>{memberSortDirectionOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div></div><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Tìm theo tên thành viên..." className="pl-9" /></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredActiveMembers.map((member) => { const ownedCount = memberFlowerCounts[String(member.id)] || 0; const percent = summary.totalFlowers ? Math.round((ownedCount / summary.totalFlowers) * 100) : 0; const style = memberProgressCircleStyle(percent); const memberTitle = titleByMemberId.get(String(member.id)); return <Card key={member.id} className="relative rounded-[24px]"><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-xl">{member.name}</CardTitle>{formatMemberMeta(member) ? <p className="mt-1 text-sm text-slate-500">{formatMemberMeta(member)}</p> : null}{hasTitleName(memberTitle) ? <Badge className={`mt-2 ${titleBadgeClass(memberTitle.name)}`}>{memberTitle.name}</Badge> : null}</div><div className="flex items-center gap-1.5"><Badge variant="secondary" className="px-2 py-1 text-[11px]">{ownedCount} hoa</Badge><Dialog open={memberCheckDialogOpenId === String(member.id)} onOpenChange={(open) => setMemberCheckDialogOpenId(open ? String(member.id) : null)}><DialogTrigger asChild><Button variant="outline" size="sm" className="hidden h-7 rounded-lg px-2 text-[10px] md:inline-flex">Check hoa</Button></DialogTrigger><DialogContent className="sm:max-w-7xl"><DialogHeader><DialogTitle>Check hoa thành viên</DialogTitle></DialogHeader><MemberFlowersCheckDialogContent member={member} flowersByGroup={memberFlowersByMemberId[String(member.id)] || { Đỏ: [], Vàng: [], Tím: [], Lam: [], Lục: [] }} /></DialogContent></Dialog>{isAdmin ? <Dialog open={memberEditDialogOpenId === String(member.id)} onOpenChange={(open) => setMemberEditDialogOpenId(open ? String(member.id) : null)}><DialogTrigger asChild><Button variant="outline" size="sm" className="h-7 rounded-lg px-2 text-[10px]">Sửa tên</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Sửa thông tin thành viên</DialogTitle></DialogHeader><EditMemberForm member={member} onSave={async (payload) => { const result = await renameMember(member.id, payload); if (result?.ok) setMemberEditDialogOpenId(null); return result; }} /></DialogContent></Dialog> : null}</div></div></CardHeader><CardContent><div className="flex items-center gap-4"><CircleProgress percent={percent} strokeColor={style.strokeColor} glowClass={style.glowClass} /><div><p className="text-sm text-slate-500">Tiến độ sưu tập</p><p className="text-lg font-semibold">{ownedCount}/{summary.totalFlowers}</p></div></div></CardContent></Card>; })}</div>{filteredFormerMembers.length > 0 ? <div className="space-y-3"><div className="flex items-center gap-2"><Badge className="border-amber-200 bg-amber-50 text-amber-700">Đã rời hội</Badge><span className="text-sm text-slate-500">{filteredFormerMembers.length} người</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredFormerMembers.map((member) => <Card key={member.id} className="rounded-[24px] border-amber-200/60 bg-amber-50/30"><CardHeader><div className="flex items-start justify-between gap-3"><div className="space-y-2"><CardTitle className="text-xl">{member.name}</CardTitle><div className="flex flex-wrap gap-2"><Badge className={member.showInLookup ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-100 text-slate-600"}>{member.showInLookup ? "Danh sách hoa: Bật" : "Danh sách hoa: Tắt"}</Badge></div></div><div className="flex flex-wrap gap-2">{isAdmin ? <Button variant="outline" size="sm" className="h-8 rounded-xl px-3 text-[11px]" onClick={() => toggleFormerMemberLookup(member)}>{member.showInLookup ? "Tắt danh sách hoa" : "Bật danh sách hoa"}</Button> : null}{isAdmin ? <Button variant="outline" size="sm" className="h-8 rounded-xl px-3 text-[11px]" onClick={() => restoreFormerMember(member)}>Cho vào hội lại</Button> : null}</div></div></CardHeader><CardContent><p className="text-sm text-slate-500">{memberFlowerCounts[String(member.id)] || 0} hoa đã sở hữu</p><p className="mt-2 text-xs text-slate-500">Bật: vẫn tìm được trong mục tra cứu theo hoa nhưng không tính vào tiến độ hội. Tắt: ẩn khỏi các mục tra cứu.</p></CardContent></Card>)}</div></div> : null}</CardContent></Card></TabsContent>

          <TabsContent value="flowerlookup"><Card className="rounded-[28px]"><CardHeader><CardTitle>Tra cứu theo hoa</CardTitle></CardHeader><CardContent className="space-y-4"><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={flowerSearch} onChange={(e) => setFlowerSearch(e.target.value)} placeholder="Tìm theo tên hoa..." className="pl-9" /></div><div className="space-y-3">{filteredFlowers.map((flower) => <div key={flower.id} className="rounded-3xl border p-4"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><FlowerThumbnail flower={flower} size="sm" /><div><p className="font-semibold">{flower.name}</p><p className="mt-1 text-sm text-slate-500">Nhóm {flower.group}</p></div></div><div className="flex items-center gap-2"><Badge variant="secondary">{ownersByFlower.get(String(flower.id))?.length || 0} người</Badge>{isAdmin ? <Dialog open={false} onOpenChange={() => {}}><DialogTrigger asChild><Button variant="outline" size="sm">Sửa hoa</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Sửa hoa</DialogTitle></DialogHeader><EditFlowerForm flower={flower} onSave={(payload) => renameFlower(flower.id, payload)} /></DialogContent></Dialog> : null}</div></div><div className="mt-3 flex flex-wrap gap-2">{(ownersByFlower.get(String(flower.id)) || []).map((owner) => <Badge key={`${flower.id}-${owner}`} variant="secondary">{owner}</Badge>)}</div></div>)}</div></CardContent></Card></TabsContent>

          <TabsContent value="memberflowerlookup"><Card className="rounded-[28px]"><CardHeader><CardTitle>Tra cứu theo thành viên</CardTitle></CardHeader><CardContent className="space-y-4"><Dialog open={memberFlowerLookupPickerOpen} onOpenChange={setMemberFlowerLookupPickerOpen}><DialogTrigger asChild><Button variant="outline" className="w-full justify-start">{selectedMemberFlowerLookup ? selectedMemberFlowerLookup.name : "Chọn thành viên"}</Button></DialogTrigger><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Chọn thành viên</DialogTitle></DialogHeader><div className="space-y-3"><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={memberFlowerLookupSearch} onChange={(e) => setMemberFlowerLookupSearch(e.target.value)} placeholder="Tìm thành viên..." className="pl-9" /></div><ScrollArea className="h-[320px] pr-3"><div className="space-y-2">{filteredMemberFlowerLookupOptions.map((member) => <button key={member.id} type="button" onClick={() => { setMemberFlowerLookup(String(member.id)); setMemberFlowerLookupPickerOpen(false); }} className="w-full rounded-2xl border bg-white px-4 py-3 text-left hover:bg-slate-50">{member.name}</button>)}</div></ScrollArea></div></DialogContent></Dialog>{!selectedMemberFlowerLookup ? <SectionEmpty>Hãy chọn một thành viên để xem bộ sưu tập theo nhóm hoa.</SectionEmpty> : <div className="space-y-4"><div className="rounded-2xl border bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{selectedMemberFlowerLookup.name}</p>{formatMemberMeta(selectedMemberFlowerLookup) ? <p className="text-sm text-slate-500">{formatMemberMeta(selectedMemberFlowerLookup)}</p> : null}</div><Badge variant="secondary">{flowersBySelectedMember.length} hoa</Badge></div></div><div className="grid gap-4 md:grid-cols-5">{MEMBER_FLOWER_GROUP_ORDER.map((group) => <div key={group} className="rounded-3xl border p-3"><div className="mb-3 flex items-center justify-between"><Badge className={groupBadgeClass(group)}>{group}</Badge><span className="text-sm font-semibold">{memberFlowersByGroup[group]?.length || 0}</span></div><ScrollArea className="h-[500px] pr-2"><div className="space-y-2">{(memberFlowersByGroup[group] || []).length === 0 ? <SectionEmpty>Chưa có hoa</SectionEmpty> : memberFlowersByGroup[group].map((flower) => <div key={flower.id} className="flex items-center gap-3 rounded-2xl border p-2"><FlowerThumbnail flower={flower} size="sm" /><p className="text-sm font-medium break-words">{flower.name}</p></div>)}</div></ScrollArea></div>)}</div></div>}</CardContent></Card></TabsContent>

          {canAccessOwnershipUpdate ? <TabsContent value="update"><div className="space-y-4"><Card className="rounded-[28px]"><CardHeader><CardTitle>{isRestrictedEditor ? `Cập nhật hoa cho ${members.find((m) => String(m.id) === String(restrictedMemberId))?.name || "thành viên được cấp quyền"}` : "Cập nhật hoa mới thành viên vừa sở hữu"}</CardTitle></CardHeader><CardContent className="grid gap-4 lg:grid-cols-[320px_1fr_1fr]"><div className="space-y-4">{isRestrictedEditor ? <div className="rounded-3xl border bg-slate-50 p-4 text-sm text-slate-700">Tài khoản này chỉ được phép cập nhật hoa cho <span className="font-semibold text-slate-900">{members.find((m) => String(m.id) === String(restrictedMemberId))?.name || "thành viên được cấp quyền"}</span>.</div> : <><div className="space-y-2"><Label>Chọn thành viên cũ</Label><Dialog open={memberPickerOpen} onOpenChange={setMemberPickerOpen}><DialogTrigger asChild><Button variant="outline" className="w-full justify-start">{selectedExistingMember ? selectedExistingMember.name : "-- Không chọn --"}</Button></DialogTrigger><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Chọn thành viên</DialogTitle></DialogHeader><div className="space-y-3"><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={memberPickerSearch} onChange={(e) => setMemberPickerSearch(e.target.value)} placeholder="Tìm thành viên..." className="pl-9" /></div><ScrollArea className="h-[320px] pr-3"><div className="space-y-2">{filteredExistingMembers.map((member) => <button key={member.id} type="button" onClick={() => { setSelectedExistingMemberId(String(member.id)); setMemberPickerOpen(false); }} className="w-full rounded-2xl border bg-white px-4 py-3 text-left hover:bg-slate-50">{member.name}</button>)}</div></ScrollArea></div></DialogContent></Dialog></div><div className="space-y-2"><Label>Hoặc tạo thành viên mới</Label><Input value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Nhập tên thành viên mới" /></div></>}<div className="rounded-3xl border p-4 space-y-3"><Label>Lọc danh sách hoa để chọn</Label><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={updateSearch} onChange={(e) => setUpdateSearch(e.target.value)} placeholder="Tìm tên hoa" className="pl-9" /></div><Select value={updateGroupFilter} onValueChange={setUpdateGroupFilter}><SelectContent><SelectItem value="all">Tất cả nhóm</SelectItem>{FLOWER_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div><div className="flex gap-2"><Button onClick={saveOwnershipUpdate} disabled={savingOwnership}>{savingOwnership ? "Đang lưu..." : "Lưu cập nhật sở hữu"}</Button><Button variant="outline" onClick={removeOwnershipFromMember} disabled={savingOwnership || !selectedExistingMember}>{savingOwnership ? "Đang gỡ..." : "Gỡ hoa khỏi thành viên"}</Button></div>{updateMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{updateMessage}</div> : null}</div><div className="rounded-3xl border p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Chọn hoa để thêm</h3><Badge variant="secondary">Đã chọn {selectedFlowerIds.length}</Badge></div><ScrollArea className="h-[520px] pr-3"><div className="space-y-3">{selectableFlowers.map((flower) => { const checked = selectedFlowerIds.includes(String(flower.id)); return <label key={flower.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 hover:bg-slate-50"><Checkbox checked={checked} onCheckedChange={() => toggleFlowerSelection(flower.id)} /><FlowerThumbnail flower={flower} size="sm" /><div className="min-w-0 flex-1"><p className="font-medium break-words">{flower.name}</p><p className="text-sm text-slate-500">Hiện có {ownersByFlower.get(String(flower.id))?.length || 0} người sở hữu</p></div><Badge className={groupBadgeClass(flower.group)}>{flower.group}</Badge></label>; })}</div></ScrollArea></div><div className="rounded-3xl border p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Chọn hoa để gỡ</h3><Badge variant="secondary">Đã chọn {selectedRemovalFlowerIds.length}</Badge></div><div className="relative mb-3"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={removalFlowerSearch} onChange={(e) => setRemovalFlowerSearch(e.target.value)} placeholder="Tìm tên hoa để gỡ..." className="pl-9" /></div><ScrollArea className="h-[470px] pr-3"><div className="space-y-3">{removableFlowers.length === 0 ? <SectionEmpty>Hãy chọn thành viên cũ để xem những hoa đang sở hữu và gỡ khi cần</SectionEmpty> : removableFlowers.map((flower) => { const checked = selectedRemovalFlowerIds.includes(String(flower.id)); return <label key={flower.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 hover:bg-slate-50"><Checkbox checked={checked} onCheckedChange={() => toggleRemovalFlowerSelection(flower.id)} /><FlowerThumbnail flower={flower} size="sm" /><div className="min-w-0 flex-1"><p className="font-medium break-words">{flower.name}</p></div><Badge className={groupBadgeClass(flower.group)}>{flower.group}</Badge></label>; })}</div></ScrollArea></div></CardContent></Card><Card className="rounded-[28px]"><CardHeader><CardTitle>Thêm hoa mới vào cơ sở dữ liệu chung</CardTitle></CardHeader><CardContent className="grid gap-4 lg:grid-cols-[320px_1fr]"><div className="rounded-3xl border p-4 space-y-4"><div className="space-y-2"><Label>Tên hoa</Label><Input value={newFlowerName} onChange={(e) => setNewFlowerName(e.target.value)} placeholder="Ví dụ: Huyền Tinh" /></div><div className="space-y-2"><Label>Icon hoa</Label><Input value={newFlowerIconUrl} onChange={(e) => setNewFlowerIconUrl(e.target.value)} placeholder="https://..." /></div><div className="space-y-2"><Label>Nhóm hoa</Label><Select value={newFlowerGroup} onValueChange={setNewFlowerGroup}><SelectContent>{FLOWER_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div><Button className="w-full" onClick={addFlowerToDatabase} disabled={savingFlower}><PlusIcon className="mr-2 h-4 w-4" />{savingFlower ? "Đang thêm..." : "Thêm hoa mới"}</Button>{flowerCreateMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{flowerCreateMessage}</div> : null}</div><div className="rounded-3xl border p-4"><div className="mb-4 grid gap-4 sm:grid-cols-[1fr_150px]"><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={flowerManageSearch} onChange={(e) => setFlowerManageSearch(e.target.value)} placeholder="Tìm hoa trong danh sách hiện có..." className="pl-9" /></div><Select value={flowerManageGroupFilter} onValueChange={setFlowerManageGroupFilter}><SelectContent><SelectItem value="all">Tất cả nhóm</SelectItem>{FLOWER_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div><ScrollArea className="h-[700px] pr-3"><div className="grid gap-3 md:grid-cols-2">{filteredManageFlowers.map((flower) => <div key={flower.id} className="rounded-3xl border p-3"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><FlowerThumbnail flower={flower} size="sm" /><div><p className="font-semibold break-words">{flower.name}</p><p className="text-sm text-slate-500">{ownersByFlower.get(String(flower.id))?.length || 0} người đang sở hữu</p></div></div><div className="flex items-center gap-2"><Badge className={groupBadgeClass(flower.group)}>{flower.group}</Badge><Dialog open={false} onOpenChange={() => {}}><DialogTrigger asChild><Button variant="outline" size="sm">Sửa hoa</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Sửa hoa</DialogTitle></DialogHeader><EditFlowerForm flower={flower} onSave={(payload) => renameFlower(flower.id, payload)} /></DialogContent></Dialog></div></div></div>)}</div></ScrollArea></div></CardContent></Card></div></TabsContent> : null}

          <TabsContent value="addflower">
  <div className="space-y-4">
    <Card className="rounded-[28px]">
      <CardHeader>
        <CardTitle>Hoa nghệ thuật</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {artVaseMessage ? (
          <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{artVaseMessage}</div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
          <Card className="rounded-[24px] border shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-lg">Dashboard hoa nghệ thuật</CardTitle>
                <Select value={artDashboardGroupFilter} onValueChange={setArtDashboardGroupFilter}>
                  <SelectContent>
                    <SelectItem value="all">Tất cả phẩm</SelectItem>
                    {MEMBER_FLOWER_GROUP_ORDER.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 rounded-3xl border p-4">
                <CircleProgress percent={artSummary.percent} />
                <div>
                  <p className="text-sm text-slate-500">
                    {isGuildArtLookup
                      ? "Số lượng tổ hợp hoa nghệ thuật hội đã sở hữu, tính việc sở hữu 1 tổ hợp hoa hoàn chỉnh của mỗi một thành viên trong hội"
                      : `Số lượng tổ hợp hoa nghệ thuật ${selectedArtLookupMember?.name || "thành viên"} đã sở hữu`}
                  </p>
                  <p className="text-2xl font-bold">{artSummary.ownedCombos}/{artSummary.totalCombos}</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {filteredArtVaseStats.map((vase) => {
                  const vasePercent = vase.totalCombos ? Math.round((vase.ownedCombos / vase.totalCombos) * 100) : 0;
                  const vaseStyle = memberProgressCircleStyle(vasePercent);
                  return (
                    <div key={vase.id} className="rounded-3xl border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          {vase.iconUrl ? (
                            <div className="h-11 w-11 overflow-hidden rounded-2xl border bg-white">
                              <img src={vase.iconUrl} alt={vase.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                            </div>
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border bg-slate-50 text-slate-500">
                              <PlaceholderFlowerIcon size="sm" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <p className="font-semibold break-words">{vase.name}</p>
                              <Badge className={groupBadgeClass(vase.vaseGroup)}>{vase.vaseGroup}</Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                              <span>{vase.ownedCombos}/{vase.totalCombos} tổ hợp</span>
                              <span>•</span>
                              <span>{vase.ownedFlowerCount}/{vase.totalFlowerCount} hoa</span>
                            </div>
                          </div>
                        </div>
                        <CircleProgress percent={vasePercent} strokeColor={vaseStyle.strokeColor} glowClass={vaseStyle.glowClass} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">Gợi ý hoa cắm bình chưa sở hữu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={artLookupMemberPickerOpen} onOpenChange={setArtLookupMemberPickerOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {isGuildArtLookup ? "Cả Hội" : selectedArtLookupMember ? selectedArtLookupMember.name : "Chọn thành viên"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Chọn thành viên</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div>
                      <Input value={artLookupMemberSearch} onChange={(e) => setArtLookupMemberSearch(e.target.value)} placeholder="Tìm thành viên..." className="pl-9" />
                    </div>
                    <ScrollArea className="h-[320px] pr-3">
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => { setArtLookupMemberId("guild"); setArtLookupMemberPickerOpen(false); }}
                          className={cn("w-full rounded-2xl border px-4 py-3 text-left hover:bg-slate-50", isGuildArtLookup ? "bg-slate-50 border-slate-300" : "bg-white")}
                        >
                          Cả Hội
                        </button>
                        {filteredArtLookupMembers.map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => { setArtLookupMemberId(String(member.id)); setArtLookupMemberPickerOpen(false); }}
                            className="w-full rounded-2xl border bg-white px-4 py-3 text-left hover:bg-slate-50"
                          >
                            {member.name}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div>
                <Input value={artLookupSuggestionSearch} onChange={(e) => setArtLookupSuggestionSearch(e.target.value)} placeholder="Tìm trong danh sách gợi ý..." className="pl-9" />
              </div>

              <ScrollArea className="h-[420px] pr-3">
                <div className="space-y-3">
                  {artLookupMemberId === "none" ? (
                    <SectionEmpty>Hãy chọn Cả Hội hoặc một thành viên để xem các hoa cắm bình chưa sở hữu.</SectionEmpty>
                  ) : filteredArtLookupSuggestions.length === 0 ? (
                    <SectionEmpty>Thành viên này hiện không thiếu hoa nào trong các bình đã tạo.</SectionEmpty>
                  ) : (
                    filteredArtLookupSuggestions.map((row) => {
                      const checked = artSelectedSuggestionFlowerIds.includes(String(row.flower.id));
                      return (
                        <label key={row.flower.id} className="flex cursor-pointer items-start gap-3 rounded-3xl border p-3 hover:bg-slate-50">
                          <Checkbox checked={checked} onCheckedChange={() => toggleArtSuggestionFlower(row.flower.id)} />
                          <FlowerThumbnail flower={row.flower} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold break-words">{row.flower.name}</p>
                            <p className="mt-1 text-sm text-slate-500">Bình: {row.vaseNames.join(", ")}</p>
                          </div>
                          <Badge className={groupBadgeClass(row.flower.group)}>{row.flower.group}</Badge>
                        </label>
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={runArtSuggestionSearch}>Tìm kiếm</Button>
              </div>

              <div className="rounded-3xl border p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Label>Kết quả tìm kiếm người sở hữu</Label>
                  <Badge variant="secondary">{artLookupSearchResults.length} hoa</Badge>
                </div>
                <div className="space-y-3">
                  {artLookupSearchResults.length === 0 ? (
                    <SectionEmpty>Hãy tick chọn các hoa trong danh sách gợi ý rồi bấm Tìm kiếm.</SectionEmpty>
                  ) : (
                    artLookupSearchResults.map((row) => (
                      <div key={`owner-search-${row.flower.id}`} className="rounded-3xl border p-3">
                        <div className="flex items-start gap-3">
                          <FlowerThumbnail flower={row.flower} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold break-words">{row.flower.name}</p>
                              <Badge className={groupBadgeClass(row.flower.group)}>{row.flower.group}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">Bình: {row.vaseNames.join(", ")}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {row.owners.length === 0 ? (
                                <Badge variant="secondary">Chưa ai sở hữu</Badge>
                              ) : (
                                row.owners.map((owner) => (
                                  <Badge key={`${row.flower.id}-${owner}`} variant="secondary">{owner}</Badge>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl border p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Label>Chọn người ưu tiên var</Label>
                  <Badge variant="secondary">{artPriorityVarOwners.length} người</Badge>
                </div>
                <div className="relative mb-3">
                  <div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div>
                  <Input value={artPriorityVarSearch} onChange={(e) => setArtPriorityVarSearch(e.target.value)} placeholder="Tìm tên thành viên ưu tiên..." className="pl-9" />
                </div>
                <ScrollArea className="h-[180px] pr-3">
                  <div className="space-y-2">
                    {artPriorityVarOwnerOptions.length === 0 ? (
                      <SectionEmpty>Hãy bấm Tìm kiếm trước để có danh sách người sở hữu.</SectionEmpty>
                    ) : (
                      artPriorityVarOwnerOptions.map((owner) => {
                        const checked = artPriorityVarOwners.includes(String(owner));
                        return (
                          <label key={`priority-var-${owner}`} className="flex cursor-pointer items-center gap-3 rounded-2xl border p-3 hover:bg-slate-50">
                            <Checkbox checked={checked} onCheckedChange={() => toggleArtPriorityVarOwner(owner)} />
                            <span className="text-sm font-medium text-slate-700">{owner}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
                <div className="mt-3 flex justify-end">
                  <Button type="button" variant="outline" onClick={runArtVarSuggestion}>Gợi ý</Button>
                </div>
              </div>

              <div className="rounded-3xl border p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Label>Gợi ý var nhau</Label>
                  <Badge variant="secondary">{artVarSuggestions.length} người</Badge>
                </div>
                <div className="space-y-3">
                  {artVarSuggestions.length === 0 ? (
                    <SectionEmpty>Hãy bấm Gợi ý để gom danh sách theo người sở hữu.</SectionEmpty>
                  ) : (
                    artVarSuggestions.map((item) => (
                      <div key={`var-${item.owner}`} className="rounded-3xl border p-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm leading-7 text-slate-700">
                          <span>Hãy var</span>
                          <span className={VAR_OWNER_BADGE_CLASS}>{item.owner}</span>
                          <span>để húp:</span>
                          <div className="inline-flex flex-wrap items-center gap-2">
                            {item.flowers.map((flower) => (
                              <span key={`${item.owner}-${flower.id}`} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${groupBadgeClass(flower.group)}`}>
                                <FlowerThumbnail flower={flower} size="sm" />
                                <span>{flower.name}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[24px] border shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg">Hoa cắm bình ít người sở hữu (1-3)</CardTitle>
              <Select value={artRareFlowerGroupFilter} onValueChange={setArtRareFlowerGroupFilter}>
                <SelectContent>
                  <SelectItem value="all">Tất cả nhóm</SelectItem>
                  {MEMBER_FLOWER_GROUP_ORDER.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[260px] pr-3">
              <div className="space-y-3">
                {artRareFlowers.length === 0 ? (
                  <SectionEmpty>Chưa có hoa cắm bình nào rơi vào nhóm 1-3 người sở hữu.</SectionEmpty>
                ) : (
                  artRareFlowers.map((row) => (
                    <div key={row.flower.id} className="rounded-3xl border p-3">
                      <div className="flex items-start gap-3">
                        <FlowerThumbnail flower={row.flower} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold break-words">{row.flower.name}</p>
                            <Badge className={groupBadgeClass(row.flower.group)}>{row.flower.group}</Badge>
                          </div>
                          <p className="text-sm text-slate-500">{row.ownerCount} người sở hữu</p>
                          <p className="mt-1 text-sm text-slate-500">Bình: {row.vaseNames.join(", ")}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {canManageArt ? (
          <Card className="rounded-[28px]">
            <CardHeader>
              <CardTitle>Tạo và quản lý bình hoa</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 xl:grid-cols-[340px_1fr]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Chọn bình hoa</Label>
                  <Select value={selectedArtVaseId} onValueChange={(value) => {
                    setSelectedArtVaseId(value);
                    const vase = artVases.find((item) => String(item.id) === String(value));
                    if (vase) setArtVaseFormFromVase(vase);
                    else setArtVaseForm(DEFAULT_ART_VASE_FORM);
                  }}>
                    <SelectContent>
                      <SelectItem value="new">+ Tạo bình hoa mới</SelectItem>
                      {artVases.map((vase) => (
                        <SelectItem key={vase.id} value={String(vase.id)}>{vase.name} • {vase.vaseGroup || "Lục"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tên bình hoa</Label>
                  <Input value={artVaseForm.name} onChange={(e) => setArtVaseForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Ví dụ: Bình trăng tím" />
                </div>
                <div className="space-y-2">
                  <Label>Icon bình</Label>
                  <Input value={artVaseForm.iconUrl} onChange={(e) => setArtVaseForm((prev) => ({ ...prev, iconUrl: e.target.value }))} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Phẩm bình</Label>
                  <Select value={artVaseForm.vaseGroup} onValueChange={(value) => setArtVaseForm((prev) => ({ ...prev, vaseGroup: value }))}>
                    <SelectContent>
                      {MEMBER_FLOWER_GROUP_ORDER.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Button onClick={saveArtVase} disabled={savingArtVase}>{savingArtVase ? "Đang lưu..." : selectedArtVaseId === "new" ? "Tạo bình hoa" : "Cập nhật bình hoa"}</Button>
                  {selectedArtVaseId !== "new" ? <Button variant="outline" onClick={deleteArtVase} disabled={savingArtVase}>Xoá bình hoa</Button> : null}
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                {[{ key: "mainFlowerIds", title: "Hoa chính" }, { key: "secondaryFlowerIds", title: "Hoa phụ" }, { key: "accentFlowerIds", title: "Hoa kèm" }].map((section) => (
                  <div key={section.key} className="rounded-3xl border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold">{section.title}</h3>
                      <Badge variant="secondary">{artVaseForm[section.key].length}/3</Badge>
                    </div>
                    <div className="relative mb-3">
                      <div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div>
                      <Input value={artFlowerSearchByType[section.key]} onChange={(e) => setArtFlowerSearchByType((prev) => ({ ...prev, [section.key]: e.target.value }))} placeholder={`Tìm ${section.title.toLowerCase()}...`} className="pl-9" />
                    </div>
                    <ScrollArea className="h-[360px] pr-3">
                      <div className="space-y-3">
                        {filteredArtFlowersByType[section.key].map((flower) => {
                          const checked = artVaseForm[section.key].includes(String(flower.id));
                          const blocked = !checked && artVaseForm[section.key].length >= 3;
                          return (
                            <label key={`${section.key}-${flower.id}`} className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border p-3", blocked ? "opacity-50" : "hover:bg-slate-50")}>
                              <Checkbox checked={checked} disabled={blocked} onCheckedChange={() => toggleArtVaseFlower(section.key, flower.id)} />
                              <FlowerThumbnail flower={flower} size="sm" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium break-words">{flower.name}</p>
                              </div>
                              <Badge className={groupBadgeClass(flower.group)}>{flower.group}</Badge>
                            </label>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </CardContent>
    </Card>
  </div>
</TabsContent>

          {isAdmin ? <TabsContent value="titlemanagement"><div className="space-y-4">{isSuperAdmin ? <Card className="rounded-[28px]"><CardHeader><CardTitle>Quản lý tài khoản cập nhật</CardTitle></CardHeader><CardContent className="space-y-4"><div className="rounded-3xl border p-4 space-y-4"><p className="text-sm text-slate-600">Tạo quyền cập nhật theo email. Ví dụ: dinhsang199816@gmail.com chỉ được cập nhật hoa cho thành viên Đình Sang. Việc tạo user đăng nhập thật thực hiện 1 lần trong Supabase Authentication &gt; Users, còn ở đây là phần gán quyền trong app.</p><div className="grid gap-4 lg:grid-cols-[1fr_260px_auto]"><div className="space-y-2"><Label>Email tài khoản</Label><Input value={permissionEmailInput} onChange={(e) => setPermissionEmailInput(e.target.value)} placeholder="email@example.com" /></div><div className="space-y-2"><Label>Chỉ được cập nhật cho thành viên</Label><Select value={permissionMemberId} onValueChange={setPermissionMemberId}><SelectContent><SelectItem value="none">-- Chọn thành viên --</SelectItem>{members.map((member) => <SelectItem key={member.id} value={String(member.id)}>{member.name}</SelectItem>)}</SelectContent></Select></div><div className="flex items-end"><Button disabled={savingAccountPermission} onClick={async () => { const email = String(permissionEmailInput || "").trim().toLowerCase(); if (!email) return setAccountPermissionMessage("Vui lòng nhập email tài khoản."); if (!permissionMemberId || permissionMemberId === "none") return setAccountPermissionMessage("Vui lòng chọn thành viên được phép cập nhật."); setSavingAccountPermission(true); const { error } = await supabase.from("account_permissions").upsert([{ email, role: "member_editor", member_id: permissionMemberId }], { onConflict: "email" }); setSavingAccountPermission(false); if (error) return setAccountPermissionMessage(`Không lưu được quyền tài khoản: ${error.message}`); await logAction({ actionType: "update_account_permission", actorName: user?.email || "Quản trị hội", targetType: "account_permission", targetName: email, details: `Chỉ cập nhật cho ${memberById.get(String(permissionMemberId))?.name || permissionMemberId}` }); setAccountPermissionMessage("Đã lưu quyền tài khoản cập nhật."); await loadAccountPermissionsData(); }}>{savingAccountPermission ? "Đang lưu..." : "Lưu quyền"}</Button></div></div>{accountPermissionMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{accountPermissionMessage}</div> : null}<div className="space-y-3">{accountPermissions.length === 0 ? <SectionEmpty>Chưa có tài khoản cập nhật nào được cấp quyền.</SectionEmpty> : accountPermissions.map((permission) => <div key={permission.id} className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between"><div><p className="font-semibold text-slate-900">{permission.email}</p><p className="text-sm text-slate-500">Chỉ cập nhật cho: {memberById.get(String(permission.memberId))?.name || "Không rõ thành viên"}</p></div><Button variant="outline" onClick={async () => { const { error } = await supabase.from("account_permissions").delete().eq("id", permission.id); if (error) return setAccountPermissionMessage(`Không xoá được quyền tài khoản: ${error.message}`); await logAction({ actionType: "remove_account_permission", actorName: user?.email || "Quản trị hội", targetType: "account_permission", targetName: permission.email, details: "Xoá quyền cập nhật tài khoản" }); setAccountPermissionMessage("Đã xoá quyền tài khoản cập nhật."); await loadAccountPermissionsData(); }}>Xoá quyền</Button></div>)}</div></div></CardContent></Card> : null}<Card className="rounded-[28px]"><CardHeader><CardTitle>Quản lý chức danh</CardTitle></CardHeader><CardContent>{!titleFeatureAvailable ? <SectionEmpty>Supabase chưa có bảng titles và member_titles.</SectionEmpty> : <div className="grid gap-4 lg:grid-cols-[300px_1fr_360px]"><div className="rounded-3xl border p-4 space-y-4"><div className="space-y-2"><Label>Thêm chức danh mới</Label><Input value={newTitleName} onChange={(e) => setNewTitleName(e.target.value)} placeholder="Ví dụ: Trưởng nhóm" /></div><Button className="w-full" onClick={addTitleToDatabase} disabled={savingTitle}><PlusIcon className="mr-2 h-4 w-4" />Thêm chức danh</Button><div className="space-y-2"><Label>Chọn chức danh để trao</Label><Select value={selectedTitleId} onValueChange={setSelectedTitleId}><SelectContent><SelectItem value="none">-- Chọn chức danh --</SelectItem>{titles.map((title) => <SelectItem key={title.id} value={String(title.id)}>{title.name}</SelectItem>)}</SelectContent></Select></div><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={titleMemberSearch} onChange={(e) => setTitleMemberSearch(e.target.value)} placeholder="Tìm tên thành viên..." className="pl-9" /></div><Button className="w-full" onClick={saveTitleAssignments} disabled={savingTitle}>Trao chức danh cho thành viên đã chọn</Button>{titleMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{titleMessage}</div> : null}</div><div className="rounded-3xl border p-4"><ScrollArea className="h-[720px] pr-3"><div className="space-y-3">{filteredTitleMembers.map((member) => { const checked = selectedTitleMemberIds.includes(String(member.id)); const memberTitle = titleByMemberId.get(String(member.id)); return <label key={member.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 hover:bg-slate-50"><Checkbox checked={checked} onCheckedChange={() => toggleTitleMember(member.id)} /><div className="flex-1"><p className="font-medium">{member.name}</p><p className="text-sm text-slate-500">{memberTitle?.name || "Chưa có chức danh"}</p></div></label>; })}</div></ScrollArea></div><div className="rounded-3xl border p-4"><div className="mb-3 relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={titleManageSearch} onChange={(e) => setTitleManageSearch(e.target.value)} placeholder="Tìm chức danh..." className="pl-9" /></div><ScrollArea className="h-[720px] pr-3"><div className="space-y-4">{filteredTitles.map((title) => { const assignedMembers = membersByTitleId.get(String(title.id)) || []; return <div key={title.id} className="rounded-3xl border p-3"><div className="mb-3 flex items-center justify-between"><Badge className={titleBadgeClass(title.name)}>{title.name}</Badge><span className="text-sm font-semibold">{assignedMembers.length} người</span></div><div className="space-y-2">{assignedMembers.length === 0 ? <SectionEmpty>Chưa có thành viên nào</SectionEmpty> : assignedMembers.map((member) => <div key={`${title.id}-${member.id}`} className="flex items-center justify-between gap-3 rounded-2xl border p-2"><span className="text-sm font-medium break-words">{member.name}</span><Button variant="outline" size="sm" onClick={() => removeTitleFromMember(title.id, member.id)}>Gỡ</Button></div>)}</div></div>; })}</div></ScrollArea></div></div>}</CardContent></Card></div></TabsContent> : null}

          <TabsContent value="history"><Card className="rounded-[28px]"><CardHeader><CardTitle>Lịch sử cập nhật</CardTitle></CardHeader><CardContent>{!historyLoaded ? <p className="text-sm text-slate-600">Đang tải lịch sử...</p> : historyEntries.length === 0 ? <SectionEmpty>Chưa có lịch sử thao tác.</SectionEmpty> : <div className="space-y-3">{historyEntries.map((log) => <div key={log.id} className="rounded-3xl border p-4"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{log.targetName || "-"}</p>{log.memberTitle?.name ? <Badge className={titleBadgeClass(log.memberTitle.name)}>{log.memberTitle.name}</Badge> : null}{log.summaryText ? <span className="text-sm text-slate-500">• {log.summaryText}</span> : null}</div>{log.flowerItems.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{log.flowerItems.map((item, index) => <div key={`${log.id}-${item.name}-${index}`} className="inline-flex items-center gap-2 rounded-2xl border bg-slate-50 px-3 py-2"><FlowerThumbnail flower={item.flower} size="sm" /><span className="text-sm font-medium">{item.name}</span>{item.flower ? <Badge className={groupBadgeClass(item.flower.group)}>{item.flower.group}</Badge> : null}</div>)}</div> : <p className="mt-2 text-sm text-slate-600">{log.details || "-"}</p>}<div className="mt-2 text-xs text-slate-500">{log.createdAt ? new Date(log.createdAt).toLocaleString("vi-VN") : "-"} • {log.actorName || "Hệ thống"}</div></div>)}</div>}</CardContent></Card></TabsContent>

          <TabsContent value="spirithunt"><div className="space-y-4">{isAdmin ? <div className="grid gap-4 md:grid-cols-2"><Card className="rounded-[24px]"><CardHeader><CardTitle className="text-base">Thành viên còn 1 quest</CardTitle></CardHeader><CardContent className="space-y-3"><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={oneQuestMemberSearch} onChange={(e) => setOneQuestMemberSearch(e.target.value)} placeholder="Tìm tên thành viên..." className="pl-9" /></div><ScrollArea className="h-[220px] pr-2"><div className="space-y-2.5">{filteredOneQuestMembers.map((member) => { const checked = oneQuestMemberIds.includes(String(member.id)); const memberTitle = titleByMemberId.get(String(member.id)); return <label key={`one-quest-${member.id}`} className="flex cursor-pointer items-start gap-2.5 rounded-2xl border p-3 hover:bg-slate-50"><Checkbox checked={checked} onCheckedChange={() => toggleOneQuestMember(member.id)} /><div className="flex-1"><div className="flex items-start justify-between gap-2"><div><p className="text-[13px] font-medium leading-snug">{member.name}</p></div>{hasTitleName(memberTitle) ? <Badge className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div></div></label>; })}</div></ScrollArea><div className="rounded-2xl border bg-slate-50 p-3 text-[12px] text-slate-600"><div className="mb-2">Đã chọn: <span className="font-semibold text-slate-900">{oneQuestMembers.length}</span> thành viên</div><div className="flex flex-wrap gap-2">{oneQuestMembers.length === 0 ? <span className="text-slate-400">Chưa có thành viên nào.</span> : oneQuestMembers.map((member) => { const memberTitle = titleByMemberId.get(String(member.id)); return <div key={`one-quest-picked-${member.id}`} className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-[12px]"><span>{member.name}</span>{hasTitleName(memberTitle) ? <Badge className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div>; })}</div></div></CardContent></Card><Card className="rounded-[24px]"><CardHeader><CardTitle className="text-base">Thành viên hoàn thành</CardTitle></CardHeader><CardContent className="space-y-3"><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={completedMemberSearch} onChange={(e) => setCompletedMemberSearch(e.target.value)} placeholder="Tìm tên thành viên..." className="pl-9" /></div><ScrollArea className="h-[220px] pr-2"><div className="space-y-2.5">{filteredCompletedMembers.map((member) => { const checked = completedMemberIds.includes(String(member.id)); const memberTitle = titleByMemberId.get(String(member.id)); return <label key={`completed-${member.id}`} className="flex cursor-pointer items-start gap-2.5 rounded-2xl border p-3 hover:bg-slate-50"><Checkbox checked={checked} onCheckedChange={() => toggleCompletedMember(member.id)} /><div className="flex-1"><div className="flex items-start justify-between gap-2"><div><p className="text-[13px] font-medium leading-snug">{member.name}</p></div>{hasTitleName(memberTitle) ? <Badge className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div></div></label>; })}</div></ScrollArea><div className="rounded-2xl border bg-slate-50 p-3 text-[12px] text-slate-600"><div className="mb-2">Đã chọn: <span className="font-semibold text-slate-900">{completedMembers.length}</span> thành viên</div><div className="flex flex-wrap gap-2">{completedMembers.length === 0 ? <span className="text-slate-400">Chưa có thành viên nào.</span> : completedMembers.map((member) => { const memberTitle = titleByMemberId.get(String(member.id)); return <div key={`completed-picked-${member.id}`} className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-[12px]"><span>{member.name}</span>{hasTitleName(memberTitle) ? <Badge className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div>; })}</div></div></CardContent></Card></div> : null}<Card className="rounded-[28px]"><CardHeader className="space-y-3"><div className="flex items-center justify-between gap-3"><CardTitle>Ưu tiên đua hội</CardTitle>{isAdmin ? <div className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" onClick={rebuildPriorityRaceFromHighestQuality} disabled={savingPriorityRace}>{savingPriorityRace ? "Đang cập nhật..." : "Cập nhật"}</Button><Button onClick={savePriorityRace} disabled={savingPriorityRace}>{savingPriorityRace ? "Đang lưu..." : "Lưu"}</Button></div> : null}</div>{priorityRaceMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{priorityRaceMessage}</div> : null}</CardHeader><CardContent className="space-y-4">{isAdmin ? <><div className="space-y-2"><Label>Chọn thành viên ưu tiên</Label><Dialog open={priorityRaceMemberPickerOpen} onOpenChange={setPriorityRaceMemberPickerOpen}><DialogTrigger asChild><Button variant="outline" className="w-full justify-start">{priorityRaceMember ? priorityRaceMember.name : "Chọn thành viên"}</Button></DialogTrigger><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Chọn thành viên ưu tiên</DialogTitle></DialogHeader><div className="space-y-3"><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={priorityRaceMemberSearch} onChange={(e) => setPriorityRaceMemberSearch(e.target.value)} placeholder="Gõ tên thành viên..." className="pl-9" /></div><ScrollArea className="h-[320px] pr-3"><div className="space-y-2">{filteredPriorityRaceMembers.map((member) => { const memberTitle = titleByMemberId.get(String(member.id)); return <button key={member.id} type="button" onClick={() => { setPriorityRaceForm({ memberId: String(member.id), flowerIds: [] }); setPriorityRaceFlowerSearch(""); setPriorityRaceSelectedFlowerSearch(""); setPriorityRaceGroupFilter("all"); setPriorityRaceMemberPickerOpen(false); }} className="flex w-full items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3 text-left hover:bg-slate-50"><span className="break-words font-medium">{member.name}</span>{hasTitleName(memberTitle) ? <Badge className={titleBadgeClass(memberTitle.name)}>{memberTitle.name}</Badge> : null}</button>; })}</div></ScrollArea></div></DialogContent></Dialog></div>{priorityRaceMember ? <><div className="space-y-3"><Label>Chọn hoa trong bộ sưu tập của {priorityRaceMember.name}</Label><div className="grid gap-3 md:grid-cols-[1fr_180px]"><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={priorityRaceFlowerSearch} onChange={(e) => setPriorityRaceFlowerSearch(e.target.value)} placeholder="Tìm hoa đang sở hữu..." className="pl-9" /></div><Select value={priorityRaceGroupFilter} onValueChange={setPriorityRaceGroupFilter}><SelectContent><SelectItem value="all">Tất cả nhóm</SelectItem>{MEMBER_FLOWER_GROUP_ORDER.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}</SelectContent></Select></div><ScrollArea className="h-[220px] pr-3"><div className="space-y-3">{filteredPriorityRaceAvailableFlowers.map((flower) => { const checked = priorityRaceForm.flowerIds.includes(String(flower.id)); return <label key={`priority-race-${flower.id}`} className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 hover:bg-slate-50"><Checkbox checked={checked} onCheckedChange={() => togglePriorityRaceFlower(flower.id)} /><FlowerThumbnail flower={flower} size="sm" /><div className="min-w-0 flex-1"><p className="font-medium break-words">{flower.name}</p></div><Badge className={groupBadgeClass(flower.group)}>{flower.group}</Badge></label>; })}</div></ScrollArea></div><div className="rounded-3xl border p-4"><div className="mb-3 flex items-center justify-between"><Label>Đang chọn</Label><Badge variant="secondary">{priorityRaceSelectedFlowers.length} hoa</Badge></div><div className="relative mb-3"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={priorityRaceSelectedFlowerSearch} onChange={(e) => setPriorityRaceSelectedFlowerSearch(e.target.value)} placeholder="Tìm trong hoa đang chọn..." className="pl-9" /></div><div className="flex flex-wrap gap-2">{filteredPriorityRaceSelectedFlowers.length === 0 ? <SectionEmpty>Chưa có hoa nào đang chọn.</SectionEmpty> : filteredPriorityRaceSelectedFlowers.map((flower) => <div key={`selected-${flower.id}`} className="inline-flex items-center gap-2 rounded-2xl border bg-slate-50 px-3 py-2 text-sm"><FlowerThumbnail flower={flower} size="sm" /><span>{flower.name}</span><Badge className={groupBadgeClass(flower.group)}>{flower.group}</Badge></div>)}</div>{(() => { const existingEntry = priorityRaceEntries.find((entry) => String(entry.memberId) === String(priorityRaceMember.id)); if (!existingEntry || existingEntry.flowerIds.length === 0) return null; return <div className="mt-3 rounded-2xl border bg-white p-3 text-sm text-slate-600">Người này hiện đã có <span className="font-semibold text-slate-900">{existingEntry.flowerIds.length}</span> hoa trong danh sách bên dưới. Khi bấm lưu sẽ cộng dồn thêm, không thay thế.</div>; })()}</div></> : <SectionEmpty>Hãy chọn một thành viên để chọn hoa ưu tiên.</SectionEmpty>}</> : null}<div className="rounded-3xl border p-4"><div className="mb-3 flex items-center justify-between gap-3"><Label className="text-[12px]">Danh sách ưu tiên đua hội đã lưu</Label><div className="relative w-full max-w-xs"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={priorityRaceListSearch} onChange={(e) => setPriorityRaceListSearch(e.target.value)} placeholder="Tìm trong danh sách..." className="h-9 pl-9 text-[12px]" /></div></div><div className="space-y-3">{filteredPriorityRaceEntries.length === 0 ? <SectionEmpty>Chưa có dòng ưu tiên đua hội nào được lưu.</SectionEmpty> : filteredPriorityRaceEntries.map((entry) => { const memberTitle = entry.member ? titleByMemberId.get(String(entry.member.id)) : null; return <div key={entry.id} className="rounded-2xl border bg-white p-4 space-y-3"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div className="min-w-0 space-y-2"><div className="flex flex-wrap items-center gap-2"><span className={cn("text-[13px] font-semibold", oneQuestMemberIdSet.has(String(entry.member?.id || entry.memberId)) ? "text-red-600" : "text-slate-900")}>{entry.member?.name || "Không rõ thành viên"}</span>{hasTitleName(memberTitle) ? <Badge className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div></div>{isAdmin ? <div className="flex items-center gap-2"><Badge variant="secondary" className="text-[10px]">{priorityRaceListSearch.trim() ? `${entry.flowersForEntry.length}/${entry.totalFlowersForEntry} hoa` : `${entry.flowersForEntry.length} hoa`}</Badge><Button type="button" variant="outline" size="sm" className="h-7 rounded-xl px-2 text-[10px]" onClick={() => addNextPriorityRaceGroup(entry.id)} disabled={savingPriorityRace}>Thêm phẩm</Button><Button type="button" variant="outline" size="sm" className="h-7 rounded-xl px-2 text-[10px]" onClick={() => removePriorityRaceEntry(entry.id)} disabled={savingPriorityRace}>Xoá</Button></div> : null}</div><div className="flex flex-wrap gap-2">{entry.flowersForEntry.map((flower) => <div key={`${entry.id}-${flower.id}`} className="inline-flex items-center gap-2 rounded-2xl border bg-slate-50 px-2.5 py-1.5 text-[12px]"><FlowerThumbnail flower={flower} size="sm" /><span className="text-[12px]">{flower.name}</span><Badge className={`${groupBadgeClass(flower.group)} text-[10px]`}>{flower.group}</Badge>{isAdmin ? <Button type="button" variant="outline" size="sm" className="h-6 rounded-full px-2 text-[10px]" onClick={() => removePriorityRaceFlowerFromEntry(entry.id, flower.id)} disabled={savingPriorityRace}>Gỡ</Button> : null}</div>)}</div></div>; })}</div></div></CardContent></Card><Card className="rounded-[28px]"><CardHeader className="space-y-3"><div className="flex items-center justify-between gap-3"><CardTitle>Săn hoa linh</CardTitle>{isAdmin ? <Button onClick={saveSpiritHuntSlots} disabled={savingSpiritHunt}>{savingSpiritHunt ? "Đang lưu..." : "Lưu"}</Button> : null}</div>{spiritHuntMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{spiritHuntMessage}</div> : null}</CardHeader><CardContent><div className="grid gap-4 xl:grid-cols-2">{spiritHuntSlots.map((slot) => { const selectedMembers = slot.memberIds.map((id) => memberById.get(String(id))).filter(Boolean); const memberSearchValue = spiritHuntMemberSearch[slot.slotKey] || ""; const filteredSlotMembers = members.filter((member) => member.name.toLowerCase().includes(memberSearchValue.trim().toLowerCase())); return <Card key={slot.slotKey} className="rounded-[22px] border shadow-none"><CardHeader className="space-y-2 pb-3 text-[75%]">{isAdmin ? <div className="grid gap-2 sm:grid-cols-2"><div className="space-y-1.5"><Label className="text-[11px]">Tên khung</Label><Input value={slot.title} onChange={(e) => updateSpiritHuntSlot(slot.slotKey, () => ({ title: e.target.value }))} className="h-9 text-[12px]" /></div><div className="space-y-1.5"><Label className="text-[11px]">Khung giờ</Label><Input value={slot.timeLabel} onChange={(e) => updateSpiritHuntSlot(slot.slotKey, () => ({ timeLabel: e.target.value }))} className="h-9 text-[12px]" /></div></div> : <div><CardTitle className="text-base">{slot.title}</CardTitle><p className="text-[12px] text-slate-500">{slot.timeLabel || "Chưa đặt giờ"}</p></div>}</CardHeader><CardContent className="space-y-3 pt-0 text-[75%]">{isAdmin ? <><div className="relative"><div className="pointer-events-none absolute left-3 top-3 text-slate-400"><SearchIcon /></div><Input value={memberSearchValue} onChange={(e) => setSpiritHuntMemberSearch((prev) => ({ ...prev, [slot.slotKey]: e.target.value }))} placeholder="Tìm thành viên..." className="h-9 pl-9 text-[12px]" /></div><ScrollArea className="h-[170px] pr-2"><div className="space-y-2.5">{filteredSlotMembers.map((member) => { const checked = slot.memberIds.includes(String(member.id)); const memberTitle = titleByMemberId.get(String(member.id)); return <label key={`${slot.slotKey}-${member.id}`} className="flex cursor-pointer items-start gap-2.5 rounded-2xl border p-3 hover:bg-slate-50"><Checkbox checked={checked} onCheckedChange={() => toggleSpiritHuntMember(slot.slotKey, member.id)} /><div className="flex-1"><div className="flex items-start justify-between gap-2"><div><p className="text-[12px] font-medium leading-snug">{member.name}</p></div>{memberTitle?.name ? <Badge className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div></div></label>; })}</div></ScrollArea><div className="rounded-2xl border bg-slate-50 p-3 text-[12px] text-slate-600 space-y-2.5"><div>Đã chọn: <span className="font-semibold text-slate-900">{selectedMembers.length}</span> thành viên</div><div className="flex flex-wrap gap-2">{selectedMembers.length === 0 ? <span className="text-slate-400">Chưa chọn thành viên nào.</span> : selectedMembers.map((member) => { const memberTitle = titleByMemberId.get(String(member.id)); return <div key={`selected-spirit-${slot.slotKey}-${member.id}`} className="inline-flex max-w-full items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-[12px]"><span className="break-words">{member.name}</span>{memberTitle?.name ? <Badge className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div>; })}</div></div></> : <div className="flex flex-wrap gap-2">{selectedMembers.length === 0 ? <SectionEmpty>Chưa có thành viên nào ở khung này.</SectionEmpty> : selectedMembers.map((member) => { const memberTitle = titleByMemberId.get(String(member.id)); return <div key={`${slot.slotKey}-${member.id}`} className="inline-flex items-center gap-2 rounded-full border bg-slate-50 px-3 py-1.5 text-[12px]"><span>{member.name}</span>{memberTitle?.name ? <Badge className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div>; })}</div>}</CardContent></Card>; })}</div></CardContent></Card></div></TabsContent>
        </TabsProvider>
      </div>
    </div>
  );
}
