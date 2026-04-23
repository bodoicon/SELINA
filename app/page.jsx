"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, Users, Flower2, Database, AlertCircle, Trophy, Shield } from "lucide-react";

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
  Lục: "border-green-200 bg-green-50 text-green-700",
  Lam: "border-blue-200 bg-blue-50 text-blue-700",
  Tím: "border-violet-200 bg-violet-50 text-violet-700",
  Vàng: "border-amber-200 bg-amber-50 text-amber-700",
  Đỏ: "border-red-200 bg-red-50 text-red-700",
};

const TITLE_STYLES = {
  "hội trưởng": "border-red-200 bg-red-50 text-red-700",
  "hội phó": "border-orange-200 bg-orange-50 text-orange-700",
  "quản lý": "border-violet-200 bg-violet-50 text-violet-700",
  "tinh anh": "border-blue-200 bg-blue-50 text-blue-700",
  "thành viên": "border-green-200 bg-green-50 text-green-700",
  "ngọn cỏ ven đường": "border-slate-200 bg-slate-100 text-slate-700",
};

function groupBadgeClass(group) {
  return GROUP_STYLES[group] || "border-slate-200 bg-slate-50 text-slate-700";
}

function priorityRaceGroupRank(group) {
  switch (group) {
    case "Đỏ":
      return 5;
    case "Vàng":
      return 4;
    case "Tím":
      return 3;
    case "Lam":
      return 2;
    case "Lục":
      return 1;
    default:
      return 0;
  }
}

function priorityRaceRankToGroup(rank) {
  switch (rank) {
    case 5:
      return "Đỏ";
    case 4:
      return "Vàng";
    case 3:
      return "Tím";
    case 2:
      return "Lam";
    case 1:
      return "Lục";
    default:
      return "";
  }
}

function titleBadgeClass(titleName) {
  return TITLE_STYLES[String(titleName || "").trim().toLowerCase()] || "border-slate-200 bg-slate-50 text-slate-700";
}

function normalizeFlowerLookupText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
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

function isFormerMember(member) {
  return Boolean(member?.leftGuild);
}

function shouldShowFormerMemberInLookup(member) {
  return !isFormerMember(member) || Boolean(member?.showInLookup);
}

function extractFlowerNamesFromHistoryDetails(details) {
  const text = String(details || "").trim();
  if (!text) return [];
  const idx = text.indexOf(":");
  const part = idx >= 0 ? text.slice(idx + 1) : text;
  return part.split(",").map((x) => x.trim()).filter(Boolean);
}

function normalizeOwnershipRow(row) {
  return {
    id: String(row.id),
    memberId: String(row.member_id),
    flowerId: String(row.flower_id),
  };
}

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
        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch {}
        return { user: null, message: "Phiên đăng nhập cũ đã hết hạn và đã được làm sạch.", shouldRetry: false };
      }
      if (isAuthLockError(error)) {
        return { user: null, message: "Trình duyệt đang đồng bộ phiên đăng nhập.", shouldRetry: true };
      }
      return { user: null, message: `Không đọc được phiên đăng nhập: ${error.message}`, shouldRetry: false };
    }
    return { user: data.user || null, message: "", shouldRetry: false };
  } catch (error) {
    if (isAuthLockError(error)) {
      return { user: null, message: "Trình duyệt đang đồng bộ phiên đăng nhập.", shouldRetry: true };
    }
    return { user: null, message: `Không khởi tạo được xác thực: ${error?.message || "Lỗi không xác định"}`, shouldRetry: false };
  }
}

async function fetchAllOwnershipRows() {
  const pageSize = 1000;
  let from = 0;
  let allRows = [];
  while (true) {
    const { data, error } = await supabase
      .from("member_flowers")
      .select("id, member_id, flower_id")
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
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

function shouldLoadHistoryForTab(tab) {
  return tab === "history";
}

function shouldLoadSpiritHuntForTab(tab) {
  return tab === "spirithunt";
}

function shouldLoadPriorityRaceForTab(tab) {
  return tab === "spirithunt";
}

function PlaceholderFlowerIcon({ size = "md" }) {
  const iconClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass} aria-hidden="true">
      <path d="M12 21c1.6-2.8 2.4-5.2 2.4-7.2A4.4 4.4 0 0 0 10 9.4c-2.4 0-4.4 2-4.4 4.4 0 2 1 4.3 2.8 6.5" />
      <path d="M12 21c-1.3-1.8-2.7-3-4.2-3.7" />
      <path d="M12 21c1-1.6 2.5-3.1 4.6-4.3" />
      <circle cx="12" cy="12" r="1.3" />
    </svg>
  );
}

function FlowerThumbnail({ flower, size = "md" }) {
  const sizeClass = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  if (flower?.iconUrl) {
    return (
      <div className={`overflow-hidden rounded-2xl border bg-white ${sizeClass}`}>
        <img src={flower.iconUrl} alt={flower.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
      </div>
    );
  }
  return (
    <div className={`flex items-center justify-center rounded-2xl border bg-slate-50 text-slate-500 ${sizeClass}`}>
      <PlaceholderFlowerIcon size={size} />
    </div>
  );
}

function CircleProgress({ percent = 0, strokeColor = "#0f172a", glowClass = "bg-[conic-gradient(from_180deg_at_50%_50%,rgba(99,102,241,0.12),rgba(14,165,233,0.08),rgba(168,85,247,0.12))]" }) {
  const radius = 26;
  const stroke = 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative h-14 w-14 sm:h-16 sm:w-16">
      <div className={`absolute inset-0 rounded-full blur-md ${glowClass}`} />
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
    case "Đỏ":
      return { strokeColor: "#ef4444", glowClass: "bg-[conic-gradient(from_180deg_at_50%_50%,rgba(239,68,68,0.18),rgba(248,113,113,0.10),rgba(254,202,202,0.16))]" };
    case "Vàng":
      return { strokeColor: "#f59e0b", glowClass: "bg-[conic-gradient(from_180deg_at_50%_50%,rgba(245,158,11,0.18),rgba(251,191,36,0.10),rgba(253,230,138,0.16))]" };
    case "Tím":
      return { strokeColor: "#8b5cf6", glowClass: "bg-[conic-gradient(from_180deg_at_50%_50%,rgba(139,92,246,0.18),rgba(167,139,250,0.10),rgba(221,214,254,0.16))]" };
    case "Lam":
      return { strokeColor: "#3b82f6", glowClass: "bg-[conic-gradient(from_180deg_at_50%_50%,rgba(59,130,246,0.18),rgba(96,165,250,0.10),rgba(191,219,254,0.16))]" };
    default:
      return { strokeColor: "#22c55e", glowClass: "bg-[conic-gradient(from_180deg_at_50%_50%,rgba(34,197,94,0.18),rgba(74,222,128,0.10),rgba(187,247,208,0.16))]" };
  }
}

function memberProgressCircleStyle(percent) {
  if (percent <= 0) return { strokeColor: "#d1d5db", glowClass: "bg-[conic-gradient(from_180deg_at_50%_50%,rgba(203,213,225,0.18),rgba(226,232,240,0.10),rgba(241,245,249,0.16))]" };
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
    <Card className="rounded-[22px] border border-white/70 bg-white/85 shadow-[0_16px_45px_-24px_rgba(15,23,42,0.32)]">
      <CardContent className="flex items-center gap-4 p-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-700">{icon}</div>
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
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
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Tên thành viên</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-2xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Năm sinh</Label>
          <Input value={birthYear} onChange={(e) => setBirthYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} className="rounded-2xl" />
        </div>
        <div className="space-y-2">
          <Label>Giới tính</Label>
          <Select value={gender || "unknown"} onValueChange={(value) => setGender(value === "unknown" ? "" : value)}>
            <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unknown">Chưa chọn</SelectItem>
              <SelectItem value="Nam">Nam</SelectItem>
              <SelectItem value="Nữ">Nữ</SelectItem>
              <SelectItem value="Khác">Khác</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Trạng thái hội</Label>
        <Select value={leftGuild ? "former" : "active"} onValueChange={(value) => setLeftGuild(value === "former")}>
          <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Đang trong hội</SelectItem>
            <SelectItem value="former">Đã rời hội</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {leftGuild ? (
        <div className="space-y-2">
          <Label>Danh sách hoa trong mục tra cứu</Label>
          <Select value={showInLookup ? "on" : "off"} onValueChange={(value) => setShowInLookup(value === "on")}>
            <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="on">Bật</SelectItem>
              <SelectItem value="off">Tắt</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">Bật: vẫn tìm được trong mục tra cứu nhưng không tính vào tiến độ hội. Tắt: ẩn khỏi các mục tra cứu.</p>
        </div>
      ) : null}
      <Button className="w-full rounded-2xl" disabled={saving} onClick={async () => {
        setSaving(true);
        const result = await onSave({ name, birthYear: birthYear ? Number(birthYear) : null, gender, leftGuild, showInLookup });
        setSaving(false);
        setMessage(result.message);
      }}>{saving ? "Đang lưu..." : "Lưu thông tin thành viên"}</Button>
      {message ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{message}</div> : null}
    </div>
  );
}

function EditFlowerForm({ flower, onSave }) {
  const [name, setName] = useState(flower.name || "");
  const [group, setGroup] = useState(flower.group || "Lục");
  const [iconUrl, setIconUrl] = useState(flower.iconUrl || "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <div className="space-y-4">
      <div className="space-y-2"><Label>Tên hoa</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-2xl" /></div>
      <div className="space-y-2">
        <Label>Nhóm hoa</Label>
        <Select value={group} onValueChange={setGroup}>
          <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
          <SelectContent>{FLOWER_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2"><Label>Icon URL</Label><Input value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} className="rounded-2xl" /></div>
      <Button className="w-full rounded-2xl" disabled={saving} onClick={async () => {
        setSaving(true);
        const result = await onSave({ name, group, iconUrl });
        setSaving(false);
        setMessage(result.message);
      }}>{saving ? "Đang lưu..." : "Lưu thông tin hoa"}</Button>
      {message ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{message}</div> : null}
    </div>
  );
}

function MemberFlowersCheckDialogContent({ member, flowersByGroup }) {
  const [searchText, setSearchText] = useState("");
  const normalizedSearch = normalizeFlowerLookupText(searchText);
  const filteredFlowersByGroup = useMemo(() => {
    const next = { Đỏ: [], Vàng: [], Tím: [], Lam: [], Lục: [] };
    MEMBER_FLOWER_GROUP_ORDER.forEach((group) => {
      next[group] = (flowersByGroup[group] || []).filter((flower) => {
        if (!normalizedSearch) return true;
        return normalizeFlowerLookupText(flower.name).includes(normalizedSearch);
      });
    });
    return next;
  }, [flowersByGroup, normalizedSearch]);

  const totalFiltered = useMemo(
    () => Object.values(filteredFlowersByGroup).reduce((sum, list) => sum + list.length, 0),
    [filteredFlowersByGroup]
  );

  return (
    <div className="space-y-3 font-sans" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-semibold text-slate-900">{member.name}</p>
          <p className="text-[11px] text-slate-500">Toàn bộ hoa đang sở hữu</p>
        </div>
        <Badge variant="secondary" className="text-[11px]">
          {totalFiltered}/{Object.values(flowersByGroup).reduce((sum, list) => sum + list.length, 0)} hoa
        </Badge>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Gõ để tìm nhanh 1 loại hoa..."
          className="rounded-2xl pl-9"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        {MEMBER_FLOWER_GROUP_ORDER.map((group) => (
          <div key={group} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-2.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Badge variant="outline" className={`${groupBadgeClass(group)} text-[10px]`}>{group}</Badge>
              <span className="text-[10px] font-semibold text-slate-500">{filteredFlowersByGroup[group]?.length || 0}</span>
            </div>
            <div className="max-h-[325px] space-y-1.5 overflow-y-auto pr-1">
              {(filteredFlowersByGroup[group] || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white px-2.5 py-2 text-[10px] text-slate-400">Không có kết quả</div>
              ) : (
                filteredFlowersByGroup[group].map((flower) => (
                  <div key={`${member.id}-${group}-${flower.id}`} className="flex items-center gap-2 rounded-xl border bg-white px-2.5 py-2">
                    <FlowerThumbnail flower={flower} size="sm" />
                    <span className="block break-words text-[10px] font-medium text-slate-700">{flower.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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
    return () => {
      active = false;
      if (retryTimer) window.clearTimeout(retryTimer);
      sub.data.subscription.unsubscribe();
    };
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
      supabase.from("titles").select("id, name").order("name", { ascending: true }),
      supabase.from("member_titles").select("id, member_id, title_id"),
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
    const { data, error } = await supabase.from("action_logs").select("id, action_type, actor_name, target_type, target_name, details, created_at").order("created_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message || "Không tải được lịch sử thao tác.");
    setHistoryLogs((data || []).map((log) => ({
      id: String(log.id),
      actionType: log.action_type || "",
      actorName: log.actor_name || "Hệ thống",
      targetType: log.target_type || "",
      targetName: log.target_name || "",
      details: log.details || "",
      createdAt: log.created_at || "",
    })));
    setHistoryLoaded(true);
  }

  async function loadSpiritHuntData() {
    const { data, error } = await supabase.from("spirit_hunt_slots").select("slot_key, title, time_label, member_ids").order("slot_key", { ascending: true });
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
    const { data, error } = await supabase.from("priority_race_config").select("entries").limit(1).maybeSingle();
    if (error) {
      setPriorityRaceEntries([]);
      setPriorityRaceLoaded(true);
      return;
    }
    setPriorityRaceEntries(Array.isArray(data?.entries) ? data.entries.map((entry, index) => ({
      id: String(entry?.id || `${entry?.member_id || "member"}-${index}`),
      memberId: String(entry?.member_id || "none"),
      flowerIds: Array.isArray(entry?.flower_ids) ? entry.flower_ids.map(String) : [],
    })) : []);
    setPriorityRaceLoaded(true);
  }

  async function loadAccountPermissionsData() {
    const { data, error } = await supabase
      .from("account_permissions")
      .select("id, email, role, member_id")
      .order("email", { ascending: true });
    if (error) {
      setAccountPermissions([]);
      setAccountPermissionsLoaded(true);
      return;
    }
    setAccountPermissions((data || []).map((row) => ({
      id: String(row.id),
      email: String(row.email || "").toLowerCase(),
      role: row.role || "member_editor",
      memberId: row.member_id ? String(row.member_id) : "",
    })));
    setAccountPermissionsLoaded(true);
  }

  async function getAccountPermissionForEmail(email) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) return null;
    const { data, error } = await supabase
      .from("account_permissions")
      .select("id, email, role, member_id")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: String(data.id),
      email: String(data.email || "").toLowerCase(),
      role: data.role || "member_editor",
      memberId: data.member_id ? String(data.member_id) : "",
    };
  }

  async function loadArtVasesData() {
    const { data, error } = await supabase
      .from("art_vases")
      .select("id, name, icon_url, vase_group, main_flower_ids, secondary_flower_ids, accent_flower_ids")
      .order("name", { ascending: true });
    if (error) {
      setArtVases([]);
      setArtVaseMessage("Chưa có bảng art_vases trong Supabase hoặc chưa tải được dữ liệu Hoa nghệ thuật.");
      setArtVasesLoaded(true);
      return;
    }
    setArtVases((data || []).map((row) => ({
      id: String(row.id),
      name: row.name || "",
      iconUrl: row.icon_url || "",
      vaseGroup: row.vase_group || "Lục",
      mainFlowerIds: Array.isArray(row.main_flower_ids) ? row.main_flower_ids.map(String) : [],
      secondaryFlowerIds: Array.isArray(row.secondary_flower_ids) ? row.secondary_flower_ids.map(String) : [],
      accentFlowerIds: Array.isArray(row.accent_flower_ids) ? row.accent_flower_ids.map(String) : [],
    })));
    setArtVaseMessage("");
    setArtVasesLoaded(true);
  }

  async function loadAllData(options = {}) {
    const { silent = false, includeTitles = false, includeHistory = false, includeSpiritHunt = false, includePriorityRace = false } = options;
    if (!silent) {
      setLoading(true);
      setPageMessage("");
    }
    try {
      const [membersRes, flowersRes] = await Promise.all([
        supabase.from("members").select("id, name, birth_year, gender, left_guild, show_in_lookup").order("name", { ascending: true }),
        supabase.from("flowers").select("id, name, group_name, icon_url").order("name", { ascending: true }),
      ]);
      if (membersRes.error || flowersRes.error) throw new Error(membersRes.error?.message || flowersRes.error?.message || "Không tải được dữ liệu.");
      setMembers((membersRes.data || []).map((m) => ({ id: String(m.id), name: m.name, birthYear: m.birth_year || null, gender: m.gender || "", leftGuild: Boolean(m.left_guild), showInLookup: Boolean(m.show_in_lookup) })) );
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

  useEffect(() => {
    loadAllData({ includeTitles: shouldLoadTitlesForTab(activeTabRef.current, isAdminRef.current), includeHistory: shouldLoadHistoryForTab(activeTabRef.current), includeSpiritHunt: shouldLoadSpiritHuntForTab(activeTabRef.current), includePriorityRace: shouldLoadPriorityRaceForTab(activeTabRef.current) });
  }, []);

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
  }, [activeTab, isAdmin, titlesLoaded, historyLoaded, spiritHuntLoaded, priorityRaceLoaded, accountPermissionsLoaded]);

  const memberById = useMemo(() => {
    const map = new Map();
    members.forEach((m) => map.set(String(m.id), m));
    return map;
  }, [members]);

  const flowerById = useMemo(() => {
    const map = new Map();
    flowers.forEach((f) => map.set(String(f.id), f));
    return map;
  }, [flowers]);

  const memberNameById = useMemo(() => {
    const map = new Map();
    members.forEach((m) => map.set(String(m.id), m.name));
    return map;
  }, [members]);

  const titleById = useMemo(() => {
    const map = new Map();
    titles.forEach((t) => map.set(String(t.id), t));
    return map;
  }, [titles]);

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
    const totalMembers = activeMembers.filter((member) => {
      const memberTitle = titleByMemberId.get(String(member.id));
      return String(memberTitle?.name || "").trim().toLowerCase() !== "clone";
    }).length;
    return {
      totalMembers,
      totalFlowers: flowers.length,
      ownedFlowers: ownedFlowerIds.size,
      missingFlowers: flowers.length - ownedFlowerIds.size,
      completionRate: flowers.length ? Math.round((ownedFlowerIds.size / flowers.length) * 100) : 0,
    };
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
  const rareFlowers = useMemo(() => [...flowers].filter((f) => {
    const count = activeOwnersByFlower.get(String(f.id))?.length || 0;
    return count >= 1 && count <= 3;
  }).sort((a, b) => {
    const aCount = activeOwnersByFlower.get(String(a.id))?.length || 0;
    const bCount = activeOwnersByFlower.get(String(b.id))?.length || 0;
    if (aCount !== bCount) return aCount - bCount;
    return a.name.localeCompare(b.name, "vi");
  }), [flowers, activeOwnersByFlower]);

  const filteredMissingFlowers = useMemo(() => missingFlowers.filter((f) => dashboardMissingGroupFilter === "all" || f.group === dashboardMissingGroupFilter), [missingFlowers, dashboardMissingGroupFilter]);
  const filteredRareFlowers = useMemo(() => rareFlowers.filter((f) => dashboardRareGroupFilter === "all" || f.group === dashboardRareGroupFilter), [rareFlowers, dashboardRareGroupFilter]);
  const filteredMembers = useMemo(() => {
    const genderRankMaps = {
      male_first: { Nam: 0, Nữ: 1, Khác: 2, "": 3 },
      female_first: { Nữ: 0, Nam: 1, Khác: 2, "": 3 },
    };

    const normalizedMembers = [...members]
      .map((m) => ({
        ...m,
        ownedCount: memberFlowerCounts[String(m.id)] || 0,
        normalizedGender: normalizeMemberGender(m.gender),
        ageValue: getMemberAge(m),
      }))
      .filter((m) => m.name.toLowerCase().includes(memberSearch.trim().toLowerCase()));

    normalizedMembers.sort((a, b) => {
      if (memberSortField === "name") {
        return memberSortDirection === "asc"
          ? a.name.localeCompare(b.name, "vi")
          : b.name.localeCompare(a.name, "vi");
      }

      if (memberSortField === "flowers") {
        if (a.ownedCount !== b.ownedCount) {
          return memberSortDirection === "desc" ? b.ownedCount - a.ownedCount : a.ownedCount - b.ownedCount;
        }
        return a.name.localeCompare(b.name, "vi");
      }

      if (memberSortField === "age") {
        const ageA = a.ageValue ?? -1;
        const ageB = b.ageValue ?? -1;
        if (ageA !== ageB) {
          return memberSortDirection === "desc" ? ageB - ageA : ageA - ageB;
        }
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
    if (memberSortField === "name") {
      return [
        { value: "asc", label: "A đến Z" },
        { value: "desc", label: "Z đến A" },
      ];
    }
    if (memberSortField === "flowers") {
      return [
        { value: "desc", label: "Nhiều đến ít" },
        { value: "asc", label: "Ít đến nhiều" },
      ];
    }
    if (memberSortField === "age") {
      return [
        { value: "desc", label: "Nhiều đến ít" },
        { value: "asc", label: "Ít đến nhiều" },
      ];
    }
    return [
      { value: "male_first", label: "Nam đến Nữ" },
      { value: "female_first", label: "Nữ đến Nam" },
    ];
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
    Object.values(grouped).forEach((groupMap) => {
      MEMBER_FLOWER_GROUP_ORDER.forEach((group) => {
        groupMap[group] = (groupMap[group] || []).sort((a, b) => a.name.localeCompare(b.name, "vi"));
      });
    });
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
    const groupOrder = MEMBER_FLOWER_GROUP_ORDER.reduce((acc, group, index) => {
      acc[group] = index;
      return acc;
    }, {});
    return flowers
      .filter((flower) => owned.has(String(flower.id)))
      .sort((a, b) => {
        const byGroup = (groupOrder[a.group] ?? 99) - (groupOrder[b.group] ?? 99);
        if (byGroup !== 0) return byGroup;
        return a.name.localeCompare(b.name, "vi");
      });
  }, [priorityRaceMember, ownerships, flowers]);
  const filteredPriorityRaceAvailableFlowers = useMemo(() => {
    const q = normalizeFlowerLookupText(priorityRaceFlowerSearch);
    return priorityRaceAvailableFlowers.filter((flower) => {
      const matchSearch = !q || normalizeFlowerLookupText(flower.name).includes(q);
      const matchGroup = priorityRaceGroupFilter === "all" || flower.group === priorityRaceGroupFilter;
      return matchSearch && matchGroup;
    });
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
    return priorityRaceEntries
      .map((entry) => {
        const member = memberById.get(String(entry.memberId)) || null;
        const allFlowersForEntry = entry.flowerIds.map((id) => flowerById.get(String(id))).filter(Boolean);
        const matchedFlowersForEntry = q
          ? allFlowersForEntry.filter((flower) => normalizeFlowerLookupText(flower.name).includes(q))
          : allFlowersForEntry;
        return {
          ...entry,
          member,
          flowersForEntry: matchedFlowersForEntry,
          totalFlowersForEntry: allFlowersForEntry.length,
        };
      })
      .filter((entry) => entry.flowersForEntry.length > 0);
  }, [priorityRaceEntries, priorityRaceListSearch, memberById, flowerById]);

  const filteredPriorityRaceMembers = useMemo(() => {
    const q = priorityRaceMemberSearch.trim().toLowerCase();
    return members
      .filter((member) => !q || member.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [members, priorityRaceMemberSearch]);

  const historyEntries = useMemo(() => historyLogs.map((log) => {
    const member = members.find((item) => item.name === log.targetName) || null;
    const memberTitle = member ? titleByMemberId.get(String(member.id)) : null;
    const flowerItems = extractFlowerNamesFromHistoryDetails(log.details).map((name) => ({ name, flower: flowers.find((flower) => normalizeFlowerLookupText(flower.name) === normalizeFlowerLookupText(name)) || null }));
    let summaryText = log.details || "";
    if (log.actionType === "update_ownership") summaryText = `Đã thêm ${flowerItems.length} hoa`;
    if (log.actionType === "remove_ownership") summaryText = `Đã gỡ ${flowerItems.length} hoa`;
    return { ...log, member, memberTitle, flowerItems, summaryText };
  }), [historyLogs, members, flowers, titleByMemberId]);

  const artFlowerMapByType = useMemo(() => ({
    mainFlowerIds: artVaseForm.mainFlowerIds.map((id) => flowerById.get(String(id))).filter(Boolean),
    secondaryFlowerIds: artVaseForm.secondaryFlowerIds.map((id) => flowerById.get(String(id))).filter(Boolean),
    accentFlowerIds: artVaseForm.accentFlowerIds.map((id) => flowerById.get(String(id))).filter(Boolean),
  }), [artVaseForm, flowerById]);

  const filteredArtLookupMembers = useMemo(() => lookupVisibleMembers.filter((member) => !artLookupMemberSearch.trim() || member.name.toLowerCase().includes(artLookupMemberSearch.trim().toLowerCase())).sort((a, b) => a.name.localeCompare(b.name, "vi")), [lookupVisibleMembers, artLookupMemberSearch]);
  const selectedArtLookupMember = useMemo(() => lookupVisibleMembers.find((member) => String(member.id) === String(artLookupMemberId)) || null, [lookupVisibleMembers, artLookupMemberId]);
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
    return {
      mainFlowerIds: build("mainFlowerIds"),
      secondaryFlowerIds: build("secondaryFlowerIds"),
      accentFlowerIds: build("accentFlowerIds"),
    };
  }, [flowers, artFlowerSearchByType]);

  const artUsedFlowerIds = useMemo(() => {
    const ids = new Set();
    artVases.forEach((vase) => {
      [...vase.mainFlowerIds, ...vase.secondaryFlowerIds, ...vase.accentFlowerIds].forEach((id) => ids.add(String(id)));
    });
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

      const totalCombos = mainIds.length && secondaryIds.length && accentIds.length
        ? mainIds.length * secondaryIds.length * accentIds.length
        : 0;

      const ownedComboKeys = new Set();
      ownedFlowerIdsByMember.forEach((memberOwnedIds) => {
        const ownedMainIds = mainIds.filter((id) => memberOwnedIds.has(id));
        const ownedSecondaryIds = secondaryIds.filter((id) => memberOwnedIds.has(id));
        const ownedAccentIds = accentIds.filter((id) => memberOwnedIds.has(id));
        if (!ownedMainIds.length || !ownedSecondaryIds.length || !ownedAccentIds.length) return;
        ownedMainIds.forEach((mainId) => {
          ownedSecondaryIds.forEach((secondaryId) => {
            ownedAccentIds.forEach((accentId) => {
              ownedComboKeys.add(`${mainId}__${secondaryId}__${accentId}`);
            });
          });
        });
      });

      const ownedCombos = ownedComboKeys.size;
      const uniqueFlowerIds = Array.from(new Set([...mainIds, ...secondaryIds, ...accentIds]));
      const ownedFlowerCount = uniqueFlowerIds.filter((id) => scopedOwnedFlowerIds.has(String(id))).length;
      const totalFlowerCount = uniqueFlowerIds.length;

      return { ...vase, totalCombos, ownedCombos, ownedFlowerCount, totalFlowerCount };
    });
  }, [artVases, scopedArtOwnerships]);

  const filteredArtVaseStats = useMemo(() => {
    const groupOrder = MEMBER_FLOWER_GROUP_ORDER.reduce((acc, group, index) => {
      acc[group] = index;
      return acc;
    }, {});
    return artVaseStats
      .filter((vase) => artDashboardGroupFilter === "all" || vase.vaseGroup === artDashboardGroupFilter)
      .sort((a, b) => {
        const byGroup = (groupOrder[a.vaseGroup] ?? 99) - (groupOrder[b.vaseGroup] ?? 99);
        if (byGroup !== 0) return byGroup;
        return a.name.localeCompare(b.name, "vi");
      });
  }, [artVaseStats, artDashboardGroupFilter]);

  const artSummary = useMemo(() => {
    const totalCombos = filteredArtVaseStats.reduce((sum, vase) => sum + vase.totalCombos, 0);
    const ownedCombos = filteredArtVaseStats.reduce((sum, vase) => sum + vase.ownedCombos, 0);
    return {
      totalCombos,
      ownedCombos,
      percent: totalCombos ? Math.round((ownedCombos / totalCombos) * 100) : 0,
    };
  }, [filteredArtVaseStats]);

  const artRareFlowers = useMemo(() => {
    const groupOrder = MEMBER_FLOWER_GROUP_ORDER.reduce((acc, group, index) => {
      acc[group] = index;
      return acc;
    }, {});
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
      const vaseNames = filteredRelatedVases.map((vase) => vase.name);
      rows.push({ flower, ownerCount, vaseNames });
    });
    return rows.sort((a, b) => {
      const byGroup = (groupOrder[a.flower.group] ?? 99) - (groupOrder[b.flower.group] ?? 99);
      if (byGroup !== 0) return byGroup;
      if (a.ownerCount !== b.ownerCount) return a.ownerCount - b.ownerCount;
      return a.flower.name.localeCompare(b.flower.name, "vi");
    });
  }, [artUsedFlowerIds, flowerById, activeOwnersByFlower, artVases, artDashboardGroupFilter, artRareFlowerGroupFilter]);

  const artLookupSuggestions = useMemo(() => {
    const groupOrder = MEMBER_FLOWER_GROUP_ORDER.reduce((acc, group, index) => {
      acc[group] = index;
      return acc;
    }, {});
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
    return Array.from(map.values()).sort((a, b) => {
      const byGroup = (groupOrder[a.flower.group] ?? 99) - (groupOrder[b.flower.group] ?? 99);
      if (byGroup !== 0) return byGroup;
      return a.flower.name.localeCompare(b.flower.name, "vi");
    });
  }, [scopedArtOwnerships, artVases, flowerById]);

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
        setUser(null);
        setCurrentAccountPermission(null);
        return setLoginMessage("Tài khoản này không có quyền truy cập chức năng quản trị/cập nhật.");
      }
      setCurrentAccountPermission(allowedAdmin ? null : permission);
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
    setCurrentAccountPermission(null);
    setLoginMessage("");
    setLoginPassword("");
    setLoggingOut(false);
  }

  async function logAction({ actionType, actorName = "Hệ thống", targetType, targetName, details = "" }) {
    const payload = {
      action_type: actionType,
      actor_name: actorName,
      target_type: targetType,
      target_name: targetName,
      details,
    };

    const { data, error } = await supabase
      .from("action_logs")
      .insert([payload])
      .select("id, action_type, actor_name, target_type, target_name, details, created_at")
      .single();

    if (error) return;

    const nextLog = {
      id: String(data.id),
      actionType: data.action_type || "",
      actorName: data.actor_name || "Hệ thống",
      targetType: data.target_type || "",
      targetName: data.target_name || "",
      details: data.details || "",
      createdAt: data.created_at || new Date().toISOString(),
    };

    setHistoryLogs((prev) => {
      const merged = [nextLog, ...prev.filter((item) => String(item.id) !== String(nextLog.id))];
      return merged.slice(0, 50);
    });
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
    setNewFlowerName("");
    setNewFlowerIconUrl("");
    setNewFlowerGroup("Lục");
    setFlowerCreateMessage(`Đã thêm hoa mới: ${data.name}.`);
  }

  useEffect(() => {
    if (isRestrictedEditor && restrictedMemberId) {
      setSelectedExistingMemberId(restrictedMemberId);
      setNewMemberName("");
    }
  }, [isRestrictedEditor, restrictedMemberId]);

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

  function toggleFlowerSelection(flowerId) {
    setSelectedFlowerIds((prev) => prev.includes(String(flowerId)) ? prev.filter((id) => id !== String(flowerId)) : [...prev, String(flowerId)]);
  }
  function toggleRemovalFlowerSelection(flowerId) {
    setSelectedRemovalFlowerIds((prev) => prev.includes(String(flowerId)) ? prev.filter((id) => id !== String(flowerId)) : [...prev, String(flowerId)]);
  }

  async function saveOwnershipUpdate() {
    if (!canAccessOwnershipUpdate) return;
    setUpdateMessage("");
    if (selectedFlowerIds.length === 0) return setUpdateMessage("Hãy chọn ít nhất 1 loại hoa.");
    setSavingOwnership(true);
    const memberResult = await getOrCreateMember();
    if (memberResult.error) {
      setSavingOwnership(false);
      return setUpdateMessage(memberResult.error);
    }
    const member = memberResult.member;
    const alreadyOwned = new Set(ownerships.filter((o) => String(o.memberId) === String(member.id)).map((o) => String(o.flowerId)));
    const additions = [...new Set(selectedFlowerIds)].filter((flowerId) => !alreadyOwned.has(String(flowerId))).map((flowerId) => ({ member_id: member.id, flower_id: flowerId }));
    if (additions.length === 0) {
      setSavingOwnership(false);
      return setUpdateMessage(`${member.name} đã có sẵn toàn bộ các hoa được chọn.`);
    }
    const { error } = await supabase.from("member_flowers").upsert(additions, { onConflict: "member_id,flower_id", ignoreDuplicates: true });
    setSavingOwnership(false);
    if (error) return setUpdateMessage(`Không lưu được cập nhật sở hữu: ${error.message}`);
    await logAction({ actionType: "update_ownership", actorName: user?.email || member.name, targetType: "member", targetName: member.name, details: `Thêm ${additions.length} hoa: ${additions.map((item) => flowerById.get(String(item.flower_id))?.name || item.flower_id).join(", ")}` });
    setSelectedFlowerIds([]);
    setSelectedExistingMemberId("none");
    setNewMemberName("");
    setUpdateMessage(`Đã cập nhật ${additions.length} loại hoa mới cho ${member.name}.`);
    await loadAllData();
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
    await loadAllData();
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
    await logAction({
      actionType: "restore_member",
      actorName: user?.email || "Quản trị hội",
      targetType: "member",
      targetName: member.name,
      details: "Cho thành viên vào hội lại",
    });
    await loadAllData({ includeTitles: titlesLoaded, includeHistory: historyLoaded, includeSpiritHunt: spiritHuntLoaded, includePriorityRace: priorityRaceLoaded });
  }

  async function toggleFormerMemberLookup(member) {
    if (!isAdmin || !isFormerMember(member)) return;
    const nextValue = !Boolean(member.showInLookup);
    const { error } = await supabase.from("members").update({ show_in_lookup: nextValue }).eq("id", member.id);
    if (error) return;
    await logAction({
      actionType: "toggle_former_member_lookup",
      actorName: user?.email || "Quản trị hội",
      targetType: "member",
      targetName: member.name,
      details: nextValue ? "Bật danh sách hoa cho mục tra cứu" : "Tắt danh sách hoa cho mục tra cứu",
    });
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

  function toggleTitleMember(memberId) {
    setSelectedTitleMemberIds((prev) => prev.includes(String(memberId)) ? prev.filter((id) => id !== String(memberId)) : [...prev, String(memberId)]);
  }

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
    setNewTitleName("");
    setTitleMessage(`Đã thêm chức danh: ${data.name}.`);
    await loadAllData({ includeTitles: true });
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
    setSelectedTitleId("none");
    setSelectedTitleMemberIds([]);
    setTitleMessage("Đã lưu trao chức danh.");
    await loadAllData({ includeTitles: true });
  }

  async function removeTitleFromMember(titleId, memberId) {
    if (!isAdmin || !titleFeatureAvailable) return;
    const { error } = await supabase.from("member_titles").delete().eq("title_id", titleId).eq("member_id", memberId);
    if (error) return setTitleMessage(`Không gỡ được chức danh: ${error.message}`);
    setTitleMessage("Đã gỡ chức danh khỏi thành viên.");
    await loadAllData({ includeTitles: true });
  }

  function updateSpiritHuntSlot(slotKey, updater) {
    setSpiritHuntSlots((prev) => prev.map((slot) => (slot.slotKey === slotKey ? { ...slot, ...updater(slot) } : slot)));
  }

  function toggleSpiritHuntMember(slotKey, memberId) {
    updateSpiritHuntSlot(slotKey, (slot) => ({
      memberIds: slot.memberIds.includes(String(memberId)) ? slot.memberIds.filter((id) => id !== String(memberId)) : [...slot.memberIds, String(memberId)],
    }));
  }

  async function saveSpiritHuntSlots() {
    if (!isAdmin) return;
    setSavingSpiritHunt(true);
    const payload = spiritHuntSlots.map((slot) => ({ slot_key: slot.slotKey, title: String(slot.title || "").trim() || slot.title, time_label: String(slot.timeLabel || "").trim(), member_ids: slot.memberIds.map(String) }));
    const { error } = await supabase.from("spirit_hunt_slots").upsert(payload, { onConflict: "slot_key" });
    setSavingSpiritHunt(false);
    if (error) return setSpiritHuntMessage(`Không lưu được săn hoa linh: ${error.message}`);
    setSpiritHuntMessage("Đã cập nhật danh sách săn hoa linh.");
    await loadSpiritHuntData();
  }

  function togglePriorityRaceFlower(flowerId) {
    setPriorityRaceForm((prev) => ({ ...prev, flowerIds: prev.flowerIds.includes(String(flowerId)) ? prev.flowerIds.filter((id) => id !== String(flowerId)) : [...prev.flowerIds, String(flowerId)] }));
  }

  async function rebuildPriorityRaceFromHighestQuality() {
    if (!isAdmin) return;

    const ownershipFlowerIdsByMember = new Map();
    activeOwnerships.forEach((row) => {
      const memberId = String(row.memberId);
      const list = ownershipFlowerIdsByMember.get(memberId) || [];
      list.push(String(row.flowerId));
      ownershipFlowerIdsByMember.set(memberId, list);
    });

    const rebuiltEntries = activeMembers
      .map((member) => {
        const ownedFlowerIds = ownershipFlowerIdsByMember.get(String(member.id)) || [];
        const ownedFlowers = ownedFlowerIds
          .map((flowerId) => flowerById.get(String(flowerId)))
          .filter(Boolean);
        if (ownedFlowers.length === 0) return null;

        const highestRank = ownedFlowers.reduce((max, flower) => Math.max(max, priorityRaceGroupRank(flower.group)), 0);
        if (highestRank <= 0) return null;

        const highestFlowers = ownedFlowers
          .filter((flower) => priorityRaceGroupRank(flower.group) === highestRank)
          .sort((a, b) => a.name.localeCompare(b.name, "vi"));

        if (highestFlowers.length === 0) return null;

        return {
          id: `auto-${member.id}`,
          memberId: String(member.id),
          flowerIds: highestFlowers.map((flower) => String(flower.id)),
          highestGroup: highestFlowers[0]?.group || "",
          highestGroupRank: highestRank,
          flowerCount: highestFlowers.length,
          memberName: member.name,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a.highestGroupRank !== b.highestGroupRank) return a.highestGroupRank - b.highestGroupRank;
        if (a.flowerCount !== b.flowerCount) return a.flowerCount - b.flowerCount;
        return a.memberName.localeCompare(b.memberName, "vi");
      })
      .map(({ id, memberId, flowerIds }) => ({ id, memberId, flowerIds }));

    setSavingPriorityRace(true);
    const { error } = await supabase
      .from("priority_race_config")
      .upsert(
        { config_key: "main", entries: rebuiltEntries.map((entry) => ({ id: entry.id, member_id: entry.memberId, flower_ids: entry.flowerIds })) },
        { onConflict: "config_key" }
      );
    setSavingPriorityRace(false);

    if (error) return setPriorityRaceMessage(`Không cập nhật được danh sách ưu tiên đua hội: ${error.message}`);

    await logAction({
      actionType: "rebuild_priority_race",
      actorName: user?.email || "Quản trị hội",
      targetType: "priority_race",
      targetName: "Ưu tiên đua hội",
      details: `Làm mới tự động ${rebuiltEntries.length} account theo phẩm hoa cao nhất`,
    });

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
    const nextEntry = {
      id: existingIndex >= 0 ? priorityRaceEntries[existingIndex].id : `${priorityRaceForm.memberId}-${Date.now()}`,
      memberId: String(priorityRaceForm.memberId),
      flowerIds: mergedFlowerIds,
    };
    const nextEntries = existingIndex >= 0
      ? priorityRaceEntries.map((entry, index) => (index === existingIndex ? nextEntry : entry))
      : [...priorityRaceEntries, nextEntry];

    const { error } = await supabase
      .from("priority_race_config")
      .upsert(
        { config_key: "main", entries: nextEntries.map((entry) => ({ id: entry.id, member_id: entry.memberId, flower_ids: entry.flowerIds })) },
        { onConflict: "config_key" }
      );

    setSavingPriorityRace(false);
    if (error) return setPriorityRaceMessage(`Không lưu được ưu tiên đua hội: ${error.message}`);

    const savedMember = memberById.get(String(priorityRaceForm.memberId));
    const addedFlowerNames = priorityRaceForm.flowerIds.map((id) => flowerById.get(String(id))?.name).filter(Boolean);
    await logAction({
      actionType: "update_priority_race",
      actorName: user?.email || "Quản trị hội",
      targetType: "priority_race",
      targetName: savedMember?.name || "Ưu tiên đua hội",
      details: `${savedMember?.name || "Không rõ thành viên"} thêm ưu tiên ${addedFlowerNames.join(", ")}`,
    });

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
    const { error } = await supabase.from("priority_race_config").upsert({ config_key: "main", entries: nextEntries.map((entry) => ({ id: entry.id, member_id: entry.memberId, flower_ids: entry.flowerIds })) }, { onConflict: "config_key" });
    setSavingPriorityRace(false);
    if (error) return setPriorityRaceMessage(`Không xoá được mục ưu tiên đua hội: ${error.message}`);
    setPriorityRaceEntries(nextEntries);
    setPriorityRaceMessage("Đã xoá một mục ưu tiên đua hội.");
  }

  async function removePriorityRaceFlowerFromEntry(entryId, flowerId) {
    if (!isAdmin) return;
    const currentEntry = priorityRaceEntries.find((entry) => String(entry.id) === String(entryId));
    if (!currentEntry) return;

    const nextEntries = priorityRaceEntries
      .map((entry) => {
        if (String(entry.id) !== String(entryId)) return entry;
        return {
          ...entry,
          flowerIds: entry.flowerIds.filter((id) => String(id) !== String(flowerId)),
        };
      })
      .filter((entry) => entry.flowerIds.length > 0);

    setSavingPriorityRace(true);
    const { error } = await supabase
      .from("priority_race_config")
      .upsert(
        { config_key: "main", entries: nextEntries.map((entry) => ({ id: entry.id, member_id: entry.memberId, flower_ids: entry.flowerIds })) },
        { onConflict: "config_key" }
      );
    setSavingPriorityRace(false);
    if (error) return setPriorityRaceMessage(`Không gỡ được hoa khỏi ưu tiên đua hội: ${error.message}`);

    const member = memberById.get(String(currentEntry.memberId));
    const flower = flowerById.get(String(flowerId));
    await logAction({
      actionType: "remove_priority_race_flower",
      actorName: user?.email || "Quản trị hội",
      targetType: "priority_race",
      targetName: member?.name || "Ưu tiên đua hội",
      details: `Gỡ hoa ưu tiên ${flower?.name || flowerId}`,
    });

    setPriorityRaceEntries(nextEntries);
    setPriorityRaceMessage(`Đã gỡ ${flower?.name || "1 hoa"} khỏi danh sách ưu tiên.`);
  }

  async function addNextPriorityRaceGroup(entryId) {
    if (!isAdmin) return;
    const currentEntry = priorityRaceEntries.find((entry) => String(entry.id) === String(entryId));
    if (!currentEntry) return;

    const member = memberById.get(String(currentEntry.memberId));
    if (!member) return;

    const currentFlowers = currentEntry.flowerIds
      .map((id) => flowerById.get(String(id)))
      .filter(Boolean);
    if (currentFlowers.length === 0) return;

    const currentLowestRank = currentFlowers.reduce((min, flower) => {
      const rank = priorityRaceGroupRank(flower.group);
      return min === 0 ? rank : Math.min(min, rank);
    }, 0);
    const nextRank = currentLowestRank - 1;
    const nextGroup = priorityRaceRankToGroup(nextRank);
    if (!nextGroup) return setPriorityRaceMessage(`${member.name} không còn phẩm thấp hơn để thêm.`);

    const memberOwnedFlowerIds = new Set(
      ownerships
        .filter((row) => String(row.memberId) === String(member.id))
        .map((row) => String(row.flowerId))
    );

    const nextGroupFlowerIds = flowers
      .filter((flower) => memberOwnedFlowerIds.has(String(flower.id)) && flower.group === nextGroup)
      .sort((a, b) => a.name.localeCompare(b.name, "vi"))
      .map((flower) => String(flower.id));

    if (nextGroupFlowerIds.length === 0) {
      return setPriorityRaceMessage(`${member.name} không có hoa phẩm ${nextGroup} để thêm.`);
    }

    const mergedFlowerIds = Array.from(new Set([...currentEntry.flowerIds.map(String), ...nextGroupFlowerIds]));
    const nextEntries = priorityRaceEntries.map((entry) => (
      String(entry.id) === String(entryId)
        ? { ...entry, flowerIds: mergedFlowerIds }
        : entry
    ));

    setSavingPriorityRace(true);
    const { error } = await supabase
      .from("priority_race_config")
      .upsert(
        { config_key: "main", entries: nextEntries.map((entry) => ({ id: entry.id, member_id: entry.memberId, flower_ids: entry.flowerIds })) },
        { onConflict: "config_key" }
      );
    setSavingPriorityRace(false);

    if (error) return setPriorityRaceMessage(`Không thêm được phẩm cho ưu tiên đua hội: ${error.message}`);

    await logAction({
      actionType: "add_priority_race_group",
      actorName: user?.email || "Quản trị hội",
      targetType: "priority_race",
      targetName: member.name,
      details: `Thêm phẩm ${nextGroup} cho ưu tiên đua hội`,
    });

    setPriorityRaceEntries(nextEntries);
    setPriorityRaceMessage(`Đã thêm phẩm ${nextGroup} cho ${member.name}.`);
  }

  function setArtVaseFormFromVase(vase) {
    setArtVaseForm({
      name: vase?.name || "",
      iconUrl: vase?.iconUrl || "",
      vaseGroup: vase?.vaseGroup || "Lục",
      mainFlowerIds: vase?.mainFlowerIds || [],
      secondaryFlowerIds: vase?.secondaryFlowerIds || [],
      accentFlowerIds: vase?.accentFlowerIds || [],
    });
  }

  function toggleArtVaseFlower(key, flowerId) {
    setArtVaseForm((prev) => {
      const current = prev[key].map(String);
      const id = String(flowerId);
      if (current.includes(id)) {
        return { ...prev, [key]: current.filter((item) => item !== id) };
      }
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
      const { error: uploadError } = await supabase.storage.from(FLOWER_ICON_BUCKET).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) {
        setArtVaseMessage(`Không tải được icon bình: ${uploadError.message}`);
        return;
      }
      const { data } = supabase.storage.from(FLOWER_ICON_BUCKET).getPublicUrl(filePath);
      const publicUrl = data?.publicUrl || "";
      if (!publicUrl) {
        setArtVaseMessage("Đã tải ảnh lên nhưng không lấy được URL công khai.");
        return;
      }
      setArtVaseForm((prev) => ({ ...prev, iconUrl: publicUrl }));
      setArtVaseMessage("Đã tải icon bình lên thành công.");
    } catch (error) {
      setArtVaseMessage(`Không tải được icon bình: ${error?.message || "Lỗi không xác định"}`);
    } finally {
      setUploadingArtVaseIcon(false);
    }
  }

  async function saveArtVase() {
    if (!canManageArt) return;
    const name = String(artVaseForm.name || "").trim();
    if (!name) return setArtVaseMessage("Vui lòng nhập tên bình hoa.");
    setSavingArtVase(true);
    const payload = {
      name,
      icon_url: String(artVaseForm.iconUrl || "").trim() || null,
      vase_group: artVaseForm.vaseGroup || "Lục",
      main_flower_ids: artVaseForm.mainFlowerIds.map(String),
      secondary_flower_ids: artVaseForm.secondaryFlowerIds.map(String),
      accent_flower_ids: artVaseForm.accentFlowerIds.map(String),
    };
    const query = selectedArtVaseId !== "new"
      ? supabase.from("art_vases").update(payload).eq("id", selectedArtVaseId)
      : supabase.from("art_vases").insert([payload]);
    const { error } = await query;
    setSavingArtVase(false);
    if (error) return setArtVaseMessage(`Không lưu được bình hoa: ${error.message}`);
    await logAction({
      actionType: selectedArtVaseId !== "new" ? "update_art_vase" : "create_art_vase",
      actorName: user?.email || "Quản trị hội",
      targetType: "art_vase",
      targetName: name,
      details: `Phẩm ${payload.vase_group} • Chính ${payload.main_flower_ids.length} / Phụ ${payload.secondary_flower_ids.length} / Kèm ${payload.accent_flower_ids.length}`,
    });
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
    await logAction({
      actionType: "delete_art_vase",
      actorName: user?.email || "Quản trị hội",
      targetType: "art_vase",
      targetName: currentVase?.name || "Bình hoa",
      details: "Xoá bình hoa nghệ thuật",
    });
    setSelectedArtVaseId("new");
    setArtVaseForm(DEFAULT_ART_VASE_FORM);
    setArtVaseMessage("Đã xoá bình hoa.");
    await loadArtVasesData();
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

  return (
    <div className="min-h-screen antialiased text-slate-900 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_right,_rgba(168,85,247,0.12),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-4 md:p-8" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
        <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.35)] backdrop-blur sm:p-5 md:rounded-[32px] md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Selina Flower Dashboard</div>
          <h1 className="mt-3 font-serif text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl md:text-4xl">Quản Lý Hoa Hội SELINA</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-600">Thành viên chỉ có thể tra cứu thông tin. Các chức năng quản trị chỉ hiển thị cho admin đã đăng nhập.</p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {topMembers.map((member, index) => <div key={member.id} className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs shadow-sm"><Trophy className="h-3.5 w-3.5 text-amber-500" /><span>Top {index + 1}: {member.name} ({member.ownedCount})</span></div>)}
            <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-8 rounded-xl px-3 text-xs"><Shield className="mr-1 h-3.5 w-3.5" />{adminButtonLabel}</Button>
              </DialogTrigger>
              <DialogContent className="rounded-[28px] sm:max-w-md font-sans" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                <DialogHeader>
                  <DialogTitle>{isAdmin ? "Tài khoản quản trị" : "Đăng nhập quản trị"}</DialogTitle>
                </DialogHeader>
                {isAdmin ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-600">Đã đăng nhập với tài khoản: <span className="font-semibold text-slate-900">{user?.email}</span></div>
                    <Button className="w-full rounded-2xl" variant="outline" onClick={signOutAdmin} disabled={loggingOut}>{loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2"><Label>Email quản trị</Label><Input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="admin@email.com" className="rounded-2xl" /></div>
                    <div className="space-y-2"><Label>Mật khẩu</Label><Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" className="rounded-2xl" /></div>
                    <Button className="w-full rounded-2xl" onClick={signInAsAdmin} disabled={loggingIn}>{loggingIn ? "Đang đăng nhập..." : "Đăng nhập"}</Button>
                    {loginMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{loginMessage}</div> : null}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
          {pageMessage ? <div className="mt-4 rounded-2xl border bg-red-50 p-3 text-sm text-red-700">{pageMessage}</div> : null}
          {lastSyncedAt ? <div className="mt-4 text-xs text-slate-500">Đồng bộ lần cuối: {lastSyncedAt}</div> : null}
        </div>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard icon={<Users className="h-5 w-5" />} title="Thành viên" value={summary.totalMembers} />
          <StatCard icon={<Flower2 className="h-5 w-5" />} title="Tổng loại hoa" value={summary.totalFlowers} />
          <StatCard icon={<Database className="h-5 w-5" />} title="Hội đã sở hữu" value={summary.ownedFlowers} />
          <StatCard icon={<AlertCircle className="h-5 w-5" />} title="Hội còn thiếu" value={summary.missingFlowers} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="grid grid-cols-3 auto-rows-fr gap-2 rounded-[20px] border border-white/70 bg-white/85 p-2 md:hidden">
            {visibleTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`min-h-[56px] w-full rounded-2xl px-2 py-3 text-center text-[11px] leading-tight break-words transition-all ${activeTab === tab.value ? "bg-slate-900 text-white shadow-md" : "bg-transparent text-slate-600"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div
            className="hidden md:flex md:w-full md:items-center md:gap-2 md:rounded-[28px] md:border md:border-slate-200/80 md:bg-white/90 md:p-2 md:shadow-sm"
            style={{
              fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            {visibleTabs.map((tab) => {
              const active = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex h-12 min-w-0 flex-1 items-center justify-center rounded-[18px] px-3 text-center text-[13px] font-medium leading-tight transition-all duration-200 ${
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  style={{
                    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  }}
                >
                  <span className="line-clamp-2 break-words">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr_1fr]">
              <Card className="rounded-[28px]">
                <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Tiến độ sưu tập của hội</CardTitle><span className="text-sm text-slate-500">Theo nhóm</span></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 rounded-3xl border p-4"><CircleProgress percent={summary.completionRate} /><div><p className="text-sm text-slate-500">Tổng tiến độ</p><p className="text-2xl font-bold">{summary.ownedFlowers}/{summary.totalFlowers} ({summary.completionRate}%)</p></div></div>
                  <div className="grid gap-3 sm:grid-cols-2">{groupProgressRows.map((row) => { const style = groupProgressCircleStyle(row.group); return <div key={row.group} className="rounded-3xl border p-3"><div className="mb-2 flex items-center justify-between"><Badge variant="outline" className={groupBadgeClass(row.group)}>{row.group}</Badge><span className="text-sm font-semibold">{row.owned}/{row.total}</span></div><div className="flex items-center gap-3"><CircleProgress percent={row.percent} strokeColor={style.strokeColor} glowClass={style.glowClass} /><div><p className="font-semibold">Phẩm {row.group}</p><p className="text-sm text-slate-500">{row.percent}% hoàn thành</p></div></div></div>; })}</div>
                </CardContent>
              </Card>

              <Card className="rounded-[28px]">
                <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Hoa ít người sở hữu (1-3)</CardTitle><Select value={dashboardRareGroupFilter} onValueChange={setDashboardRareGroupFilter}><SelectTrigger className="w-[150px] rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả nhóm</SelectItem>{FLOWER_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></CardHeader>
                <CardContent><ScrollArea className="h-[520px] pr-3"><div className="space-y-3">{filteredRareFlowers.map((flower) => <div key={flower.id} className="rounded-3xl border p-3"><div className="flex items-start gap-3"><FlowerThumbnail flower={flower} size="sm" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="font-semibold break-words">{flower.name}</p><Badge variant="outline" className={groupBadgeClass(flower.group)}>{flower.group}</Badge></div><p className="text-sm text-slate-500">{activeOwnersByFlower.get(String(flower.id))?.length || 0} người sở hữu</p><div className="mt-2 flex flex-wrap gap-2">{(activeOwnersByFlower.get(String(flower.id)) || []).map((owner) => <Badge key={`${flower.id}-${owner}`} variant="secondary">{owner}</Badge>)}</div></div></div></div>)}</div></ScrollArea></CardContent>
              </Card>

              <Card className="rounded-[28px]">
                <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Hoa hội còn thiếu</CardTitle><Select value={dashboardMissingGroupFilter} onValueChange={setDashboardMissingGroupFilter}><SelectTrigger className="w-[150px] rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả nhóm</SelectItem>{FLOWER_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></CardHeader>
                <CardContent><ScrollArea className="h-[520px] pr-3"><div className="space-y-3">{filteredMissingFlowers.map((flower) => <div key={flower.id} className="rounded-3xl border p-3"><div className="flex items-start gap-3"><FlowerThumbnail flower={flower} size="sm" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="font-semibold break-words">{flower.name}</p><Badge variant="outline" className={groupBadgeClass(flower.group)}>{flower.group}</Badge></div><p className="text-sm text-slate-500">Chưa có ai trong hội sở hữu</p></div></div></div>)}</div></ScrollArea></CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <Card className="rounded-[28px]"><CardHeader><CardTitle>Thành viên</CardTitle><p className="mt-1 text-sm text-slate-500">Số lượng thành viên: {summary.totalMembers} • Số lượng account: {activeMembers.length}</p></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 lg:grid-cols-[1fr_220px_220px] lg:items-end"><div className="hidden lg:block" /><div className="space-y-1"><Label>Sắp xếp theo</Label><Select value={memberSortField} onValueChange={(value) => {
                setMemberSortField(value);
                if (value === "name") setMemberSortDirection("asc");
                if (value === "flowers") setMemberSortDirection("desc");
                if (value === "age") setMemberSortDirection("desc");
                if (value === "gender") setMemberSortDirection("male_first");
              }}><SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="name">Tên</SelectItem><SelectItem value="flowers">Số lượng hoa</SelectItem><SelectItem value="age">Tuổi</SelectItem><SelectItem value="gender">Giới tính</SelectItem></SelectContent></Select></div><div className="space-y-1"><Label>Thứ tự</Label><Select value={memberSortDirection} onValueChange={setMemberSortDirection}><SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger><SelectContent>{memberSortDirectionOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div></div><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Tìm theo tên thành viên..." className="rounded-2xl pl-9" /></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredActiveMembers.map((member) => { const ownedCount = memberFlowerCounts[String(member.id)] || 0; const percent = summary.totalFlowers ? Math.round((ownedCount / summary.totalFlowers) * 100) : 0; const style = memberProgressCircleStyle(percent); const memberTitle = titleByMemberId.get(String(member.id)); return <Card key={member.id} className="relative rounded-[24px]"><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-xl">{member.name}</CardTitle>{formatMemberMeta(member) ? <p className="mt-1 text-sm text-slate-500">{formatMemberMeta(member)}</p> : null}{memberTitle?.name ? <Badge variant="outline" className={`mt-2 ${titleBadgeClass(memberTitle.name)}`}>{memberTitle.name}</Badge> : null}</div><div className="flex items-center gap-1.5">
                                  <Badge variant="secondary" className="px-2 py-1 text-[11px]">{ownedCount} hoa</Badge>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="hidden h-7 rounded-lg px-2 text-[10px] md:inline-flex">Check hoa</Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-3xl font-sans sm:max-w-7xl" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                                      <DialogHeader>
                                        <DialogTitle>Check hoa thành viên</DialogTitle>
                                      </DialogHeader>
                                      <MemberFlowersCheckDialogContent member={member} flowersByGroup={memberFlowersByMemberId[String(member.id)] || { Đỏ: [], Vàng: [], Tím: [], Lam: [], Lục: [] }} />
                                    </DialogContent>
                                  </Dialog>
                                  {isAdmin ? <Dialog><DialogTrigger asChild><Button variant="outline" size="sm" className="h-7 rounded-lg px-2 text-[10px]">Sửa tên</Button></DialogTrigger><DialogContent className="rounded-3xl font-sans" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}><DialogHeader><DialogTitle>Sửa thông tin thành viên</DialogTitle></DialogHeader><EditMemberForm member={member} onSave={(payload) => renameMember(member.id, payload)} /></DialogContent></Dialog> : null}
                                </div></div></CardHeader><CardContent><div className="flex items-center gap-4"><CircleProgress percent={percent} strokeColor={style.strokeColor} glowClass={style.glowClass} /><div><p className="text-sm text-slate-500">Tiến độ sưu tập</p><p className="text-lg font-semibold">{ownedCount}/{summary.totalFlowers}</p></div></div></CardContent></Card>; })}</div>{filteredFormerMembers.length > 0 ? <div className="space-y-3"><div className="flex items-center gap-2"><Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Đã rời hội</Badge><span className="text-sm text-slate-500">{filteredFormerMembers.length} người</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredFormerMembers.map((member) => <Card key={member.id} className="rounded-[24px] border-amber-200/60 bg-amber-50/30"><CardHeader><div className="flex items-start justify-between gap-3"><div className="space-y-2"><CardTitle className="text-xl">{member.name}</CardTitle><div className="flex flex-wrap gap-2"><Badge variant="outline" className={member.showInLookup ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-100 text-slate-600"}>{member.showInLookup ? "Danh sách hoa: Bật" : "Danh sách hoa: Tắt"}</Badge></div></div><div className="flex flex-wrap gap-2">{isAdmin ? <Button variant="outline" size="sm" className="h-8 rounded-xl px-3 text-[11px]" onClick={() => toggleFormerMemberLookup(member)}>{member.showInLookup ? "Tắt danh sách hoa" : "Bật danh sách hoa"}</Button> : null}{isAdmin ? <Button variant="outline" size="sm" className="h-8 rounded-xl px-3 text-[11px]" onClick={() => restoreFormerMember(member)}>Cho vào hội lại</Button> : null}</div></div></CardHeader><CardContent><p className="text-sm text-slate-500">{memberFlowerCounts[String(member.id)] || 0} hoa đã sở hữu</p><p className="mt-2 text-xs text-slate-500">Bật: vẫn tìm được trong mục tra cứu theo hoa nhưng không tính vào tiến độ hội. Tắt: ẩn khỏi các mục tra cứu.</p></CardContent></Card>)}</div></div> : null}</CardContent></Card>
          </TabsContent>

          <TabsContent value="flowerlookup" className="space-y-4"><Card className="rounded-[28px]"><CardHeader><CardTitle>Tra cứu theo hoa</CardTitle></CardHeader><CardContent className="space-y-4"><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={flowerSearch} onChange={(e) => setFlowerSearch(e.target.value)} placeholder="Tìm theo tên hoa..." className="rounded-2xl pl-9" /></div><div className="space-y-3">{filteredFlowers.map((flower) => <div key={flower.id} className="rounded-3xl border p-4"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><FlowerThumbnail flower={flower} size="sm" /><div><p className="font-semibold">{flower.name}</p><p className="mt-1 text-sm text-slate-500">Nhóm {flower.group}</p></div></div><div className="flex items-center gap-2"><Badge variant="secondary">{ownersByFlower.get(String(flower.id))?.length || 0} người</Badge>{isAdmin ? <Dialog><DialogTrigger asChild><Button variant="outline" size="sm" className="rounded-2xl">Sửa tên</Button></DialogTrigger><DialogContent className="rounded-3xl font-sans" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}><DialogHeader><DialogTitle>Sửa hoa</DialogTitle></DialogHeader><EditFlowerForm flower={flower} onSave={(payload) => renameFlower(flower.id, payload)} /></DialogContent></Dialog> : null}</div></div><div className="mt-3 flex flex-wrap gap-2">{(ownersByFlower.get(String(flower.id)) || []).map((owner) => <Badge key={`${flower.id}-${owner}`} variant="secondary">{owner}</Badge>)}</div></div>)}</div></CardContent></Card></TabsContent>

          <TabsContent value="memberflowerlookup" className="space-y-4"><Card className="rounded-[28px]"><CardHeader><CardTitle>Tra cứu theo thành viên</CardTitle></CardHeader><CardContent className="space-y-4"><Dialog open={memberFlowerLookupPickerOpen} onOpenChange={setMemberFlowerLookupPickerOpen}><DialogTrigger asChild><Button variant="outline" className="w-full justify-start rounded-2xl">{selectedMemberFlowerLookup ? selectedMemberFlowerLookup.name : "Chọn thành viên"}</Button></DialogTrigger><DialogContent className="rounded-[28px] sm:max-w-lg font-sans" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}><DialogHeader><DialogTitle>Chọn thành viên</DialogTitle></DialogHeader><div className="space-y-3"><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={memberFlowerLookupSearch} onChange={(e) => setMemberFlowerLookupSearch(e.target.value)} placeholder="Tìm thành viên..." className="rounded-2xl pl-9" /></div><ScrollArea className="h-[320px] pr-3"><div className="space-y-2">{filteredMemberFlowerLookupOptions.map((member) => <button key={member.id} type="button" onClick={() => { setMemberFlowerLookup(String(member.id)); setMemberFlowerLookupPickerOpen(false); }} className="w-full rounded-2xl border bg-white px-4 py-3 text-left hover:bg-slate-50">{member.name}</button>)}</div></ScrollArea></div></DialogContent></Dialog>{!selectedMemberFlowerLookup ? <SectionEmpty>Hãy chọn một thành viên để xem bộ sưu tập theo nhóm hoa.</SectionEmpty> : <div className="space-y-4"><div className="rounded-2xl border bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{selectedMemberFlowerLookup.name}</p>{formatMemberMeta(selectedMemberFlowerLookup) ? <p className="text-sm text-slate-500">{formatMemberMeta(selectedMemberFlowerLookup)}</p> : null}</div><Badge variant="secondary">{flowersBySelectedMember.length} hoa</Badge></div></div><div className="grid gap-4 md:grid-cols-5">{MEMBER_FLOWER_GROUP_ORDER.map((group) => <div key={group} className="rounded-3xl border p-3"><div className="mb-3 flex items-center justify-between"><Badge variant="outline" className={groupBadgeClass(group)}>{group}</Badge><span className="text-sm font-semibold">{memberFlowersByGroup[group]?.length || 0}</span></div><ScrollArea className="h-[500px] pr-2"><div className="space-y-2">{(memberFlowersByGroup[group] || []).length === 0 ? <SectionEmpty>Chưa có hoa</SectionEmpty> : memberFlowersByGroup[group].map((flower) => <div key={flower.id} className="flex items-center gap-3 rounded-2xl border p-2"><FlowerThumbnail flower={flower} size="sm" /><p className="text-sm font-medium break-words">{flower.name}</p></div>)}</div></ScrollArea></div>)}</div></div>}</CardContent></Card></TabsContent>

          {canAccessOwnershipUpdate ? (
            <TabsContent value="update" className="space-y-4">
              <Card className="rounded-[28px]">
                <CardHeader>
                  <CardTitle>{isRestrictedEditor ? `Cập nhật hoa cho ${members.find((m) => String(m.id) === String(restrictedMemberId))?.name || "thành viên được cấp quyền"}` : "Cập nhật hoa mới thành viên vừa sở hữu"}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-[320px_1fr_1fr]">
                  <div className="space-y-4">
                    {isRestrictedEditor ? <div className="rounded-3xl border bg-slate-50 p-4 text-sm text-slate-700">Tài khoản này chỉ được phép cập nhật hoa cho <span className="font-semibold text-slate-900">{members.find((m) => String(m.id) === String(restrictedMemberId))?.name || "thành viên được cấp quyền"}</span>.</div> : <><div className="space-y-2">
                      <Label>Chọn thành viên cũ</Label>
                      <Dialog open={memberPickerOpen} onOpenChange={setMemberPickerOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full justify-start rounded-2xl">
                            {selectedExistingMember ? selectedExistingMember.name : "-- Không chọn --"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[28px] sm:max-w-lg font-sans" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                          <DialogHeader>
                            <DialogTitle>Chọn thành viên</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <div className="relative">
                              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                              <Input value={memberPickerSearch} onChange={(e) => setMemberPickerSearch(e.target.value)} placeholder="Tìm thành viên..." className="rounded-2xl pl-9" />
                            </div>
                            <ScrollArea className="h-[320px] pr-3">
                              <div className="space-y-2">
                                {filteredExistingMembers.map((member) => (
                                  <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedExistingMemberId(String(member.id));
                                      setMemberPickerOpen(false);
                                    }}
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
                    </div>

                    <div className="space-y-2">
                      <Label>Hoặc tạo thành viên mới</Label>
                      <Input value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Nhập tên thành viên mới" className="rounded-2xl" />
                    </div></>}

                    <div className="rounded-3xl border p-4 space-y-3">
                      <Label>Lọc danh sách hoa để chọn</Label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input value={updateSearch} onChange={(e) => setUpdateSearch(e.target.value)} placeholder="Tìm tên hoa" className="rounded-2xl pl-9" />
                      </div>
                      <Select value={updateGroupFilter} onValueChange={setUpdateGroupFilter}>
                        <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả nhóm</SelectItem>
                          {FLOWER_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button className="rounded-2xl" onClick={saveOwnershipUpdate} disabled={savingOwnership}>
                        {savingOwnership ? "Đang lưu..." : "Lưu cập nhật sở hữu"}
                      </Button>
                      <Button variant="outline" className="rounded-2xl" onClick={removeOwnershipFromMember} disabled={savingOwnership || !selectedExistingMember}>
                        {savingOwnership ? "Đang gỡ..." : "Gỡ hoa khỏi thành viên"}
                      </Button>
                    </div>

                    {updateMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{updateMessage}</div> : null}
                  </div>

                  <div className="rounded-3xl border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold">Chọn hoa để thêm</h3>
                      <Badge variant="secondary">Đã chọn {selectedFlowerIds.length}</Badge>
                    </div>
                    <ScrollArea className="h-[520px] pr-3">
                      <div className="space-y-3">
                        {selectableFlowers.map((flower) => {
                          const checked = selectedFlowerIds.includes(String(flower.id));
                          return (
                            <label key={flower.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 hover:bg-slate-50">
                              <Checkbox checked={checked} onCheckedChange={() => toggleFlowerSelection(flower.id)} />
                              <FlowerThumbnail flower={flower} size="sm" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium break-words">{flower.name}</p>
                                <p className="text-sm text-slate-500">Hiện có {ownersByFlower.get(String(flower.id))?.length || 0} người sở hữu</p>
                              </div>
                              <Badge variant="outline" className={groupBadgeClass(flower.group)}>{flower.group}</Badge>
                            </label>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="rounded-3xl border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold">Chọn hoa để gỡ</h3>
                      <Badge variant="secondary">Đã chọn {selectedRemovalFlowerIds.length}</Badge>
                    </div>
                    <div className="relative mb-3">
                      <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input value={removalFlowerSearch} onChange={(e) => setRemovalFlowerSearch(e.target.value)} placeholder="Tìm tên hoa để gỡ..." className="rounded-2xl pl-9" />
                    </div>
                    <ScrollArea className="h-[470px] pr-3">
                      <div className="space-y-3">
                        {removableFlowers.length === 0 ? (
                          <SectionEmpty>Hãy chọn thành viên cũ để xem những hoa đang sở hữu và gỡ khi cần</SectionEmpty>
                        ) : (
                          removableFlowers.map((flower) => {
                            const checked = selectedRemovalFlowerIds.includes(String(flower.id));
                            return (
                              <label key={flower.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 hover:bg-slate-50">
                                <Checkbox checked={checked} onCheckedChange={() => toggleRemovalFlowerSelection(flower.id)} />
                                <FlowerThumbnail flower={flower} size="sm" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium break-words">{flower.name}</p>
                                </div>
                                <Badge variant="outline" className={groupBadgeClass(flower.group)}>{flower.group}</Badge>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[28px]">
                <CardHeader>
                  <CardTitle>Thêm hoa mới vào cơ sở dữ liệu chung</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-[320px_1fr]">
                  <div className="rounded-3xl border p-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Tên hoa</Label>
                      <Input value={newFlowerName} onChange={(e) => setNewFlowerName(e.target.value)} placeholder="Ví dụ: Huyền Tinh" className="rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Icon hoa</Label>
                      <Input value={newFlowerIconUrl} onChange={(e) => setNewFlowerIconUrl(e.target.value)} placeholder="https://..." className="rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Nhóm hoa</Label>
                      <Select value={newFlowerGroup} onValueChange={setNewFlowerGroup}>
                        <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FLOWER_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full rounded-2xl" onClick={addFlowerToDatabase} disabled={savingFlower}>
                      <Plus className="mr-2 h-4 w-4" />
                      {savingFlower ? "Đang thêm..." : "Thêm hoa mới"}
                    </Button>
                    {flowerCreateMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{flowerCreateMessage}</div> : null}
                  </div>

                  <div className="rounded-3xl border p-4">
                    <div className="mb-4 grid gap-4 sm:grid-cols-[1fr_150px]">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input value={flowerManageSearch} onChange={(e) => setFlowerManageSearch(e.target.value)} placeholder="Tìm hoa trong danh sách hiện có..." className="rounded-2xl pl-9" />
                      </div>
                      <Select value={flowerManageGroupFilter} onValueChange={setFlowerManageGroupFilter}>
                        <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả nhóm</SelectItem>
                          {FLOWER_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <ScrollArea className="h-[700px] pr-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        {filteredManageFlowers.map((flower) => (
                          <div key={flower.id} className="rounded-3xl border p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <FlowerThumbnail flower={flower} size="sm" />
                                <div>
                                  <p className="font-semibold break-words">{flower.name}</p>
                                  <p className="text-sm text-slate-500">{ownersByFlower.get(String(flower.id))?.length || 0} người đang sở hữu</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={groupBadgeClass(flower.group)}>{flower.group}</Badge>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="rounded-2xl">Sửa hoa</Button>
                                  </DialogTrigger>
                                  <DialogContent className="rounded-3xl font-sans" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                                    <DialogHeader>
                                      <DialogTitle>Sửa hoa</DialogTitle>
                                    </DialogHeader>
                                    <EditFlowerForm flower={flower} onSave={(payload) => renameFlower(flower.id, payload)} />
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ) : null}

          {(
            <TabsContent value="addflower" className="space-y-4">
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
                            <SelectTrigger className="w-[150px] rounded-2xl">
                              <SelectValue />
                            </SelectTrigger>
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
                            <p className="text-sm text-slate-500">{isGuildArtLookup ? "Số lượng tổ hợp hoa nghệ thuật hội đã sở hữu, tính việc sở hữu 1 tổ hợp hoa hoàn chỉnh của mỗi một thành viên trong hội" : `Số lượng tổ hợp hoa nghệ thuật ${selectedArtLookupMember?.name || "thành viên"} đã sở hữu`}</p>
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
                                        <Badge variant="outline" className={groupBadgeClass(vase.vaseGroup)}>{vase.vaseGroup}</Badge>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500"><span>{vase.ownedCombos}/{vase.totalCombos} tổ hợp</span><span>•</span><span>{vase.ownedFlowerCount}/{vase.totalFlowerCount} hoa</span></div>
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
                            <Button variant="outline" className="w-full justify-start rounded-2xl">
                              {isGuildArtLookup ? "Cả Hội" : selectedArtLookupMember ? selectedArtLookupMember.name : "Chọn thành viên"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-[28px] sm:max-w-lg font-sans" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                            <DialogHeader>
                              <DialogTitle>Chọn thành viên</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3">
                              <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input value={artLookupMemberSearch} onChange={(e) => setArtLookupMemberSearch(e.target.value)} placeholder="Tìm thành viên..." className="rounded-2xl pl-9" />
                              </div>
                              <ScrollArea className="h-[320px] pr-3">
                                <div className="space-y-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setArtLookupMemberId("guild");
                                      setArtLookupMemberPickerOpen(false);
                                    }}
                                    className={`w-full rounded-2xl border px-4 py-3 text-left hover:bg-slate-50 ${isGuildArtLookup ? "bg-slate-50 border-slate-300" : "bg-white"}`}
                                  >
                                    Cả Hội
                                  </button>
                                  {filteredArtLookupMembers.map((member) => (
                                    <button
                                      key={member.id}
                                      type="button"
                                      onClick={() => {
                                        setArtLookupMemberId(String(member.id));
                                        setArtLookupMemberPickerOpen(false);
                                      }}
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

                        <ScrollArea className="h-[420px] pr-3">
                          <div className="space-y-3">
                            {artLookupMemberId === "none" ? (
                              <SectionEmpty>Hãy chọn Cả Hội hoặc một thành viên để xem các hoa cắm bình chưa sở hữu.</SectionEmpty>
                            ) : artLookupSuggestions.length === 0 ? (
                              <SectionEmpty>Thành viên này hiện không thiếu hoa nào trong các bình đã tạo.</SectionEmpty>
                            ) : (
                              artLookupSuggestions.map((row) => (
                                <div key={row.flower.id} className="rounded-3xl border p-3">
                                  <div className="flex items-start gap-3">
                                    <FlowerThumbnail flower={row.flower} size="sm" />
                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold break-words">{row.flower.name}</p>
                                      <p className="mt-1 text-sm text-slate-500">Bình: {row.vaseNames.join(", ")}</p>
                                    </div>
                                    <Badge variant="outline" className={groupBadgeClass(row.flower.group)}>{row.flower.group}</Badge>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="rounded-[24px] border shadow-none">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-lg">Hoa cắm bình ít người sở hữu (1-3)</CardTitle>
                        <Select value={artRareFlowerGroupFilter} onValueChange={setArtRareFlowerGroupFilter}>
                          <SelectTrigger className="w-[150px] rounded-2xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả nhóm</SelectItem>
                            {MEMBER_FLOWER_GROUP_ORDER.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
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
                                      <Badge variant="outline" className={groupBadgeClass(row.flower.group)}>{row.flower.group}</Badge>
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

                  {canManageArt ? <Card className="rounded-[28px]">
                    <CardHeader>
                      <CardTitle>Tạo và quản lý bình hoa</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 xl:grid-cols-[340px_1fr]">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Chọn bình hoa</Label>
                          <Select
                            value={selectedArtVaseId}
                            onValueChange={(value) => {
                              setSelectedArtVaseId(value);
                              const vase = artVases.find((item) => String(item.id) === String(value));
                              if (vase) setArtVaseFormFromVase(vase);
                              else setArtVaseForm(DEFAULT_ART_VASE_FORM);
                            }}
                          >
                            <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
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
                          <Input value={artVaseForm.name} onChange={(e) => setArtVaseForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Ví dụ: Bình trăng tím" className="rounded-2xl" />
                        </div>

                        <div className="space-y-2">
                          <Label>Icon bình</Label>
                          <Input value={artVaseForm.iconUrl} onChange={(e) => setArtVaseForm((prev) => ({ ...prev, iconUrl: e.target.value }))} placeholder="https://..." className="rounded-2xl" />
                          <div className="flex flex-wrap items-center gap-2">
                            <Label htmlFor="art-vase-icon-upload" className="inline-flex cursor-pointer items-center rounded-2xl border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                              {uploadingArtVaseIcon ? "Đang tải icon..." : "Tải icon lên"}
                            </Label>
                            <input
                              id="art-vase-icon-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingArtVaseIcon}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) await uploadArtVaseIcon(file);
                                e.target.value = "";
                              }}
                            />
                            {artVaseForm.iconUrl ? <span className="text-xs text-slate-500">Đã có icon</span> : <span className="text-xs text-slate-400">Chưa có icon</span>}
                          </div>
                          {artVaseForm.iconUrl ? <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border bg-white"><img src={artVaseForm.iconUrl} alt="Icon bình" className="h-full w-full object-cover" loading="lazy" decoding="async" /></div> : null}
                        </div>

                        <div className="space-y-2">
                          <Label>Phẩm bình</Label>
                          <Select value={artVaseForm.vaseGroup} onValueChange={(value) => setArtVaseForm((prev) => ({ ...prev, vaseGroup: value }))}>
                            <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {MEMBER_FLOWER_GROUP_ORDER.map((g) => (
                                <SelectItem key={g} value={g}>{g}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Button className="rounded-2xl" onClick={saveArtVase} disabled={savingArtVase}>
                            {savingArtVase ? "Đang lưu..." : selectedArtVaseId === "new" ? "Tạo bình hoa" : "Cập nhật bình hoa"}
                          </Button>
                          {selectedArtVaseId !== "new" ? (
                            <Button variant="outline" className="rounded-2xl" onClick={deleteArtVase} disabled={savingArtVase}>
                              Xoá bình hoa
                            </Button>
                          ) : null}
                        </div>

                        <div className="rounded-3xl border p-4 space-y-3">
                          <p className="text-sm text-slate-600">Mỗi bình được chọn tối đa 3 hoa chính, 3 hoa phụ, 3 hoa kèm.</p>
                          <div className="space-y-2 text-sm text-slate-600">
                            <div>Icon bình: <span className="font-semibold text-slate-900">{artVaseForm.iconUrl ? "Đã có" : "Chưa có"}</span></div>
                            <div>Phẩm bình: <span className="font-semibold text-slate-900">{artVaseForm.vaseGroup}</span></div>
                            <div>Hoa chính: <span className="font-semibold text-slate-900">{artVaseForm.mainFlowerIds.length}</span>/3</div>
                            <div>Hoa phụ: <span className="font-semibold text-slate-900">{artVaseForm.secondaryFlowerIds.length}</span>/3</div>
                            <div>Hoa kèm: <span className="font-semibold text-slate-900">{artVaseForm.accentFlowerIds.length}</span>/3</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-3">
                        {[
                          { key: "mainFlowerIds", title: "Hoa chính" },
                          { key: "secondaryFlowerIds", title: "Hoa phụ" },
                          { key: "accentFlowerIds", title: "Hoa kèm" },
                        ].map((section) => (
                          <div key={section.key} className="rounded-3xl border p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <h3 className="font-semibold">{section.title}</h3>
                              <Badge variant="secondary">{artVaseForm[section.key].length}/3</Badge>
                            </div>
                            <div className="relative mb-3">
                              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                              <Input value={artFlowerSearchByType[section.key]} onChange={(e) => setArtFlowerSearchByType((prev) => ({ ...prev, [section.key]: e.target.value }))} placeholder={`Tìm ${section.title.toLowerCase()}...`} className="rounded-2xl pl-9" />
                            </div>
                            <div className="mb-3 flex flex-wrap gap-2">
                              {artFlowerMapByType[section.key].length === 0 ? (
                                <SectionEmpty>Chưa chọn hoa</SectionEmpty>
                              ) : (
                                artFlowerMapByType[section.key].map((flower) => (
                                  <div key={`${section.key}-${flower.id}`} className="inline-flex items-center gap-2 rounded-2xl border bg-slate-50 px-3 py-2 text-sm">
                                    <FlowerThumbnail flower={flower} size="sm" />
                                    <span>{flower.name}</span>
                                  </div>
                                ))
                              )}
                            </div>
                            <ScrollArea className="h-[360px] pr-3">
                              <div className="space-y-3">
                                {filteredArtFlowersByType[section.key].map((flower) => {
                                  const checked = artVaseForm[section.key].includes(String(flower.id));
                                  const blocked = !checked && artVaseForm[section.key].length >= 3;
                                  return (
                                    <label key={`${section.key}-${flower.id}`} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 ${blocked ? "opacity-50" : "hover:bg-slate-50"}`}>
                                      <Checkbox checked={checked} disabled={blocked} onCheckedChange={() => toggleArtVaseFlower(section.key, flower.id)} />
                                      <FlowerThumbnail flower={flower} size="sm" />
                                      <div className="min-w-0 flex-1">
                                        <p className="font-medium break-words">{flower.name}</p>
                                      </div>
                                      <Badge variant="outline" className={groupBadgeClass(flower.group)}>{flower.group}</Badge>
                                    </label>
                                  );
                                })}
                              </div>
                            </ScrollArea>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card> : null}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isAdmin ? <TabsContent value="titlemanagement" className="space-y-4">{isSuperAdmin ? <Card className="rounded-[28px]"><CardHeader><CardTitle>Quản lý tài khoản cập nhật</CardTitle></CardHeader><CardContent className="space-y-4"><div className="rounded-3xl border p-4 space-y-4"><p className="text-sm text-slate-600">Tạo quyền cập nhật theo email. Ví dụ: dinhsang199816@gmail.com chỉ được cập nhật hoa cho thành viên Đình Sang. Việc tạo user đăng nhập thật thực hiện 1 lần trong Supabase Authentication &gt; Users, còn ở đây là phần gán quyền trong app.</p><div className="grid gap-4 lg:grid-cols-[1fr_260px_auto]"><div className="space-y-2"><Label>Email tài khoản</Label><Input value={permissionEmailInput} onChange={(e) => setPermissionEmailInput(e.target.value)} placeholder="email@example.com" className="rounded-2xl" /></div><div className="space-y-2"><Label>Chỉ được cập nhật cho thành viên</Label><Select value={permissionMemberId} onValueChange={setPermissionMemberId}><SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">-- Chọn thành viên --</SelectItem>{members.map((member) => <SelectItem key={member.id} value={String(member.id)}>{member.name}</SelectItem>)}</SelectContent></Select></div><div className="flex items-end"><Button className="rounded-2xl" disabled={savingAccountPermission} onClick={async () => {
                      const email = String(permissionEmailInput || "").trim().toLowerCase();
                      if (!email) return setAccountPermissionMessage("Vui lòng nhập email tài khoản.");
                      if (!permissionMemberId || permissionMemberId === "none") return setAccountPermissionMessage("Vui lòng chọn thành viên được phép cập nhật.");
                      setSavingAccountPermission(true);
                      const { error } = await supabase.from("account_permissions").upsert([{ email, role: "member_editor", member_id: permissionMemberId }], { onConflict: "email" });
                      setSavingAccountPermission(false);
                      if (error) return setAccountPermissionMessage(`Không lưu được quyền tài khoản: ${error.message}`);
                      await logAction({ actionType: "update_account_permission", actorName: user?.email || "Quản trị hội", targetType: "account_permission", targetName: email, details: `Chỉ cập nhật cho ${memberById.get(String(permissionMemberId))?.name || permissionMemberId}` });
                      setAccountPermissionMessage("Đã lưu quyền tài khoản cập nhật.");
                      await loadAccountPermissionsData();
                    }}>{savingAccountPermission ? "Đang lưu..." : "Lưu quyền"}</Button></div></div>{accountPermissionMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{accountPermissionMessage}</div> : null}<div className="space-y-3">{accountPermissions.length === 0 ? <SectionEmpty>Chưa có tài khoản cập nhật nào được cấp quyền.</SectionEmpty> : accountPermissions.map((permission) => <div key={permission.id} className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between"><div><p className="font-semibold text-slate-900">{permission.email}</p><p className="text-sm text-slate-500">Chỉ cập nhật cho: {memberById.get(String(permission.memberId))?.name || "Không rõ thành viên"}</p></div><Button variant="outline" className="rounded-2xl" onClick={async () => {
                          const { error } = await supabase.from("account_permissions").delete().eq("id", permission.id);
                          if (error) return setAccountPermissionMessage(`Không xoá được quyền tài khoản: ${error.message}`);
                          await logAction({ actionType: "remove_account_permission", actorName: user?.email || "Quản trị hội", targetType: "account_permission", targetName: permission.email, details: "Xoá quyền cập nhật tài khoản" });
                          setAccountPermissionMessage("Đã xoá quyền tài khoản cập nhật.");
                          await loadAccountPermissionsData();
                        }}>Xoá quyền</Button></div>)}</div></div></CardContent></Card> : null}<Card className="rounded-[28px]"><CardHeader><CardTitle>Quản lý chức danh</CardTitle></CardHeader><CardContent>{!titleFeatureAvailable ? <SectionEmpty>Supabase chưa có bảng titles và member_titles.</SectionEmpty> : <div className="grid gap-4 lg:grid-cols-[300px_1fr_360px]"><div className="rounded-3xl border p-4 space-y-4"><div className="space-y-2"><Label>Thêm chức danh mới</Label><Input value={newTitleName} onChange={(e) => setNewTitleName(e.target.value)} placeholder="Ví dụ: Trưởng nhóm" className="rounded-2xl" /></div><Button className="w-full rounded-2xl" onClick={addTitleToDatabase} disabled={savingTitle}><Plus className="mr-2 h-4 w-4" />Thêm chức danh</Button><div className="space-y-2"><Label>Chọn chức danh để trao</Label><Select value={selectedTitleId} onValueChange={setSelectedTitleId}><SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">-- Chọn chức danh --</SelectItem>{titles.map((title) => <SelectItem key={title.id} value={String(title.id)}>{title.name}</SelectItem>)}</SelectContent></Select></div><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={titleMemberSearch} onChange={(e) => setTitleMemberSearch(e.target.value)} placeholder="Tìm tên thành viên..." className="rounded-2xl pl-9" /></div><Button className="w-full rounded-2xl" onClick={saveTitleAssignments} disabled={savingTitle}>Trao chức danh cho thành viên đã chọn</Button>{titleMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{titleMessage}</div> : null}</div><div className="rounded-3xl border p-4"><ScrollArea className="h-[720px] pr-3"><div className="space-y-3">{filteredTitleMembers.map((member) => { const checked = selectedTitleMemberIds.includes(String(member.id)); const memberTitle = titleByMemberId.get(String(member.id)); return <label key={member.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 hover:bg-slate-50"><Checkbox checked={checked} onCheckedChange={() => toggleTitleMember(member.id)} /><div className="flex-1"><p className="font-medium">{member.name}</p><p className="text-sm text-slate-500">{memberTitle?.name || "Chưa có chức danh"}</p></div></label>; })}</div></ScrollArea></div><div className="rounded-3xl border p-4"><div className="mb-3 relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={titleManageSearch} onChange={(e) => setTitleManageSearch(e.target.value)} placeholder="Tìm chức danh..." className="rounded-2xl pl-9" /></div><ScrollArea className="h-[720px] pr-3"><div className="space-y-4">{filteredTitles.map((title) => { const assignedMembers = membersByTitleId.get(String(title.id)) || []; return <div key={title.id} className="rounded-3xl border p-3"><div className="mb-3 flex items-center justify-between"><Badge variant="outline" className={titleBadgeClass(title.name)}>{title.name}</Badge><span className="text-sm font-semibold">{assignedMembers.length} người</span></div><div className="space-y-2">{assignedMembers.length === 0 ? <SectionEmpty>Chưa có thành viên nào</SectionEmpty> : assignedMembers.map((member) => <div key={`${title.id}-${member.id}`} className="flex items-center justify-between gap-3 rounded-2xl border p-2"><span className="text-sm font-medium break-words">{member.name}</span><Button variant="outline" size="sm" className="rounded-2xl" onClick={() => removeTitleFromMember(title.id, member.id)}>Gỡ</Button></div>)}</div></div>; })}</div></ScrollArea></div></div>}</CardContent></Card></TabsContent> : null}

          <TabsContent value="history" className="space-y-4"><Card className="rounded-[28px]"><CardHeader><CardTitle>Lịch sử cập nhật</CardTitle></CardHeader><CardContent>{!historyLoaded ? <p className="text-sm text-slate-600">Đang tải lịch sử...</p> : historyEntries.length === 0 ? <SectionEmpty>Chưa có lịch sử thao tác.</SectionEmpty> : <div className="space-y-3">{historyEntries.map((log) => <div key={log.id} className="rounded-3xl border p-4"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{log.targetName || "-"}</p>{log.memberTitle?.name ? <Badge variant="outline" className={titleBadgeClass(log.memberTitle.name)}>{log.memberTitle.name}</Badge> : null}{log.summaryText ? <span className="text-sm text-slate-500">• {log.summaryText}</span> : null}</div>{log.flowerItems.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{log.flowerItems.map((item, index) => <div key={`${log.id}-${item.name}-${index}`} className="inline-flex items-center gap-2 rounded-2xl border bg-slate-50 px-3 py-2"><FlowerThumbnail flower={item.flower} size="sm" /><span className="text-sm font-medium">{item.name}</span>{item.flower ? <Badge variant="outline" className={groupBadgeClass(item.flower.group)}>{item.flower.group}</Badge> : null}</div>)}</div> : <p className="mt-2 text-sm text-slate-600">{log.details || "-"}</p>}<div className="mt-2 text-xs text-slate-500">{log.createdAt ? new Date(log.createdAt).toLocaleString("vi-VN") : "-"} • {log.actorName || "Hệ thống"}</div></div>)}</div>}</CardContent></Card></TabsContent>

          <TabsContent value="spirithunt" className="space-y-4">
            <Card className="rounded-[28px]">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3"><CardTitle>Ưu tiên đua hội</CardTitle>{isAdmin ? <div className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" onClick={rebuildPriorityRaceFromHighestQuality} className="rounded-2xl" disabled={savingPriorityRace}>{savingPriorityRace ? "Đang cập nhật..." : "Cập nhật"}</Button><Button onClick={savePriorityRace} className="rounded-2xl" disabled={savingPriorityRace}>{savingPriorityRace ? "Đang lưu..." : "Lưu"}</Button></div> : null}</div>
                {priorityRaceMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{priorityRaceMessage}</div> : null}
              </CardHeader>
              <CardContent className="space-y-4">
                {isAdmin ? <><div className="space-y-2">
                  <Label>Chọn thành viên ưu tiên</Label>
                  <Dialog open={priorityRaceMemberPickerOpen} onOpenChange={setPriorityRaceMemberPickerOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start rounded-2xl">
                        {priorityRaceMember ? priorityRaceMember.name : "Chọn thành viên"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[28px] sm:max-w-lg font-sans" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                      <DialogHeader>
                        <DialogTitle>Chọn thành viên ưu tiên</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            value={priorityRaceMemberSearch}
                            onChange={(e) => setPriorityRaceMemberSearch(e.target.value)}
                            placeholder="Gõ tên thành viên..."
                            className="rounded-2xl pl-9"
                          />
                        </div>
                        <ScrollArea className="h-[320px] pr-3">
                          <div className="space-y-2">
                            {filteredPriorityRaceMembers.map((member) => {
                              const memberTitle = titleByMemberId.get(String(member.id));
                              return (
                                <button
                                  key={member.id}
                                  type="button"
                                  onClick={() => {
                                    setPriorityRaceForm({ memberId: String(member.id), flowerIds: [] });
                                    setPriorityRaceFlowerSearch("");
                                    setPriorityRaceSelectedFlowerSearch("");
                                    setPriorityRaceGroupFilter("all");
                                    setPriorityRaceMemberPickerOpen(false);
                                  }}
                                  className="flex w-full items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3 text-left hover:bg-slate-50"
                                >
                                  <span className="break-words font-medium">{member.name}</span>
                                  {memberTitle?.name ? (
                                    <Badge variant="outline" className={titleBadgeClass(memberTitle.name)}>
                                      {memberTitle.name}
                                    </Badge>
                                  ) : null}
                                </button>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>{priorityRaceMember ? <>
                  <div className="space-y-3">
                    <Label>Chọn hoa trong bộ sưu tập của {priorityRaceMember.name}</Label>
                    <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input value={priorityRaceFlowerSearch} onChange={(e) => setPriorityRaceFlowerSearch(e.target.value)} placeholder="Tìm hoa đang sở hữu..." className="rounded-2xl pl-9" />
                      </div>
                      <Select value={priorityRaceGroupFilter} onValueChange={setPriorityRaceGroupFilter}>
                        <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả nhóm</SelectItem>
                          {MEMBER_FLOWER_GROUP_ORDER.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <ScrollArea className="h-[220px] pr-3">
                      <div className="space-y-3">
                        {filteredPriorityRaceAvailableFlowers.map((flower) => {
                          const checked = priorityRaceForm.flowerIds.includes(String(flower.id));
                          return <label key={`priority-race-${flower.id}`} className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 hover:bg-slate-50"><Checkbox checked={checked} onCheckedChange={() => togglePriorityRaceFlower(flower.id)} /><FlowerThumbnail flower={flower} size="sm" /><div className="min-w-0 flex-1"><p className="font-medium break-words">{flower.name}</p></div><Badge variant="outline" className={groupBadgeClass(flower.group)}>{flower.group}</Badge></label>;
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                  <div className="rounded-3xl border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <Label>Đang chọn</Label>
                      <Badge variant="secondary">{priorityRaceSelectedFlowers.length} hoa</Badge>
                    </div>
                    <div className="relative mb-3">
                      <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input value={priorityRaceSelectedFlowerSearch} onChange={(e) => setPriorityRaceSelectedFlowerSearch(e.target.value)} placeholder="Tìm trong hoa đang chọn..." className="rounded-2xl pl-9" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {filteredPriorityRaceSelectedFlowers.length === 0 ? <SectionEmpty>Chưa có hoa nào đang chọn.</SectionEmpty> : filteredPriorityRaceSelectedFlowers.map((flower) => <div key={`selected-${flower.id}`} className="inline-flex items-center gap-2 rounded-2xl border bg-slate-50 px-3 py-2 text-sm"><FlowerThumbnail flower={flower} size="sm" /><span>{flower.name}</span><Badge variant="outline" className={groupBadgeClass(flower.group)}>{flower.group}</Badge></div>)}
                    </div>
                    {(() => {
                      const existingEntry = priorityRaceEntries.find((entry) => String(entry.memberId) === String(priorityRaceMember.id));
                      if (!existingEntry || existingEntry.flowerIds.length === 0) return null;
                      return (
                        <div className="mt-3 rounded-2xl border bg-white p-3 text-sm text-slate-600">
                          Người này hiện đã có <span className="font-semibold text-slate-900">{existingEntry.flowerIds.length}</span> hoa trong danh sách bên dưới. Khi bấm lưu sẽ cộng dồn thêm, không thay thế.
                        </div>
                      );
                    })()}
                  </div>
                </> : <SectionEmpty>Hãy chọn một thành viên để chọn hoa ưu tiên.</SectionEmpty>}</> : null}
                <div className="rounded-3xl border p-4"><div className="mb-3 flex items-center justify-between gap-3"><Label className="text-[12px]">Danh sách ưu tiên đua hội đã lưu</Label><div className="relative w-full max-w-xs"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={priorityRaceListSearch} onChange={(e) => setPriorityRaceListSearch(e.target.value)} placeholder="Tìm trong danh sách..." className="h-9 rounded-2xl pl-9 text-[12px]" /></div></div><div className="space-y-3">{filteredPriorityRaceEntries.length === 0 ? <SectionEmpty>Chưa có dòng ưu tiên đua hội nào được lưu.</SectionEmpty> : filteredPriorityRaceEntries.map((entry) => { const memberTitle = entry.member ? titleByMemberId.get(String(entry.member.id)) : null; return <div key={entry.id} className="rounded-2xl border bg-white p-4 space-y-3"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div className="min-w-0 space-y-2"><div className="flex flex-wrap items-center gap-2"><span className="text-[13px] font-semibold text-slate-900">{entry.member?.name || "Không rõ thành viên"}</span>{memberTitle?.name ? <Badge variant="outline" className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div></div>{isAdmin ? <div className="flex items-center gap-2"><Badge variant="secondary" className="text-[10px]">{priorityRaceListSearch.trim() ? `${entry.flowersForEntry.length}/${entry.totalFlowersForEntry} hoa` : `${entry.flowersForEntry.length} hoa`}</Badge><Button type="button" variant="outline" size="sm" className="h-7 rounded-xl px-2 text-[10px]" onClick={() => addNextPriorityRaceGroup(entry.id)} disabled={savingPriorityRace}>Thêm phẩm</Button><Button type="button" variant="outline" size="sm" className="h-7 rounded-xl px-2 text-[10px]" onClick={() => removePriorityRaceEntry(entry.id)} disabled={savingPriorityRace}>Xoá</Button></div> : null}</div><div className="flex flex-wrap gap-2">{entry.flowersForEntry.map((flower) => <div key={`${entry.id}-${flower.id}`} className="inline-flex items-center gap-2 rounded-2xl border bg-slate-50 px-2.5 py-1.5 text-[12px]"><FlowerThumbnail flower={flower} size="sm" /><span className="text-[12px]">{flower.name}</span><Badge variant="outline" className={`${groupBadgeClass(flower.group)} text-[10px]`}>{flower.group}</Badge>{isAdmin ? <Button type="button" variant="outline" size="sm" className="h-6 rounded-full px-2 text-[10px]" onClick={() => removePriorityRaceFlowerFromEntry(entry.id, flower.id)} disabled={savingPriorityRace}>Gỡ</Button> : null}</div>)}</div></div>; })}</div></div>
              </CardContent>
            </Card>

            <Card className="rounded-[28px]">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Săn hoa linh</CardTitle>
                  {isAdmin ? <Button onClick={saveSpiritHuntSlots} className="rounded-2xl" disabled={savingSpiritHunt}>{savingSpiritHunt ? "Đang lưu..." : "Lưu"}</Button> : null}
                </div>
                {spiritHuntMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{spiritHuntMessage}</div> : null}
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 xl:grid-cols-2">
                  {spiritHuntSlots.map((slot) => {
                    const selectedMembers = slot.memberIds.map((id) => memberById.get(String(id))).filter(Boolean);
                    const memberSearchValue = spiritHuntMemberSearch[slot.slotKey] || "";
                    const filteredSlotMembers = members.filter((member) => member.name.toLowerCase().includes(memberSearchValue.trim().toLowerCase()));
                    return (
                      <Card key={slot.slotKey} className="rounded-[22px] border shadow-none">
                        <CardHeader className="space-y-2 pb-3 text-[75%]">
                          {isAdmin ? (
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="space-y-1.5">
                                <Label className="text-[11px]">Tên khung</Label>
                                <Input value={slot.title} onChange={(e) => updateSpiritHuntSlot(slot.slotKey, () => ({ title: e.target.value }))} className="h-9 rounded-2xl text-[12px]" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px]">Khung giờ</Label>
                                <Input value={slot.timeLabel} onChange={(e) => updateSpiritHuntSlot(slot.slotKey, () => ({ timeLabel: e.target.value }))} className="h-9 rounded-2xl text-[12px]" />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <CardTitle className="text-base">{slot.title}</CardTitle>
                              <p className="text-[12px] text-slate-500">{slot.timeLabel || "Chưa đặt giờ"}</p>
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0 text-[75%]">
                          {isAdmin ? (
                            <>
                              <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                                <Input value={memberSearchValue} onChange={(e) => setSpiritHuntMemberSearch((prev) => ({ ...prev, [slot.slotKey]: e.target.value }))} placeholder="Tìm thành viên..." className="h-9 rounded-2xl pl-9 text-[12px]" />
                              </div>
                              <ScrollArea className="h-[170px] pr-2">
                                <div className="space-y-2.5">
                                  {filteredSlotMembers.map((member) => {
                                    const checked = slot.memberIds.includes(String(member.id));
                                    const memberTitle = titleByMemberId.get(String(member.id));
                                    return (
                                      <label key={`${slot.slotKey}-${member.id}`} className="flex cursor-pointer items-start gap-2.5 rounded-2xl border p-3 hover:bg-slate-50">
                                        <Checkbox checked={checked} onCheckedChange={() => toggleSpiritHuntMember(slot.slotKey, member.id)} />
                                        <div className="flex-1">
                                          <div className="flex items-start justify-between gap-2">
                                            <div>
                                              <p className="text-[12px] font-medium leading-snug">{member.name}</p>
                                            </div>
                                            {memberTitle?.name ? <Badge variant="outline" className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}
                                          </div>
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              </ScrollArea>
                              <div className="rounded-2xl border bg-slate-50 p-3 text-[12px] text-slate-600 space-y-2.5">
                                <div>
                                  Đã chọn: <span className="font-semibold text-slate-900">{selectedMembers.length}</span> thành viên
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {selectedMembers.length === 0 ? (
                                    <span className="text-slate-400">Chưa chọn thành viên nào.</span>
                                  ) : (
                                    selectedMembers.map((member) => {
                                      const memberTitle = titleByMemberId.get(String(member.id));
                                      return (
                                        <div key={`selected-spirit-${slot.slotKey}-${member.id}`} className="inline-flex max-w-full items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-[12px]">
                                          <span className="break-words">{member.name}</span>
                                          {memberTitle?.name ? <Badge variant="outline" className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {selectedMembers.length === 0 ? <SectionEmpty>Chưa có thành viên nào ở khung này.</SectionEmpty> : selectedMembers.map((member) => {
                                const memberTitle = titleByMemberId.get(String(member.id));
                                return <div key={`${slot.slotKey}-${member.id}`} className="inline-flex items-center gap-2 rounded-full border bg-slate-50 px-3 py-1.5 text-[12px]"><span>{member.name}</span>{memberTitle?.name ? <Badge variant="outline" className={`${titleBadgeClass(memberTitle.name)} text-[10px]`}>{memberTitle.name}</Badge> : null}</div>;
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
