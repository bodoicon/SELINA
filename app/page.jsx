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
import { Search, Plus, Users, Flower2, Database, AlertCircle, Trophy, LogIn, LogOut, Shield } from "lucide-react";

const FLOWER_GROUPS = ["Lục", "Lam", "Tím", "Vàng", "Đỏ"];
const MEMBER_FLOWER_GROUP_ORDER = ["Đỏ", "Vàng", "Tím", "Lam", "Lục"];
const SUPABASE_URL = "https://tewaxvsxbktcexduvfjv.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRld2F4dnN4Ymt0Y2V4ZHV2Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTIxMjksImV4cCI6MjA5MTcyODEyOX0.0VpLpXpR_gGk7p5RiCEL0bK4_EnhAUoqhLpieTL-4zI";
const ADMIN_EMAILS = ["lehuuhung133132@gmail.com"];
const FLOWER_ICON_BUCKET = "flower-icons";
const SUPABASE_STORAGE_KEY_PREFIX = "sb-";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

const GROUP_STYLES = {
  Lục: "border-green-200 bg-green-50 text-green-700",
  Lam: "border-blue-200 bg-blue-50 text-blue-700",
  Tím: "border-violet-200 bg-violet-50 text-violet-700",
  Vàng: "border-amber-200 bg-amber-50 text-amber-700",
  Đỏ: "border-red-200 bg-red-50 text-red-700",
};

function groupBadgeClass(group) {
  return GROUP_STYLES[group] || "border-slate-200 bg-slate-50 text-slate-700";
}

function flowerLabel(flower) {
  return flower?.name || "";
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

function clearSupabaseAuthStorage() {
  if (typeof window === "undefined") return;
  try {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(SUPABASE_STORAGE_KEY_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // ignore
  }
}

async function getSafeCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (isInvalidRefreshTokenError(error)) {
        clearSupabaseAuthStorage();
        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch {
          // ignore
        }
        return {
          user: null,
          message: "Phiên đăng nhập cũ đã hết hạn và đã được làm sạch. Bạn có thể đăng nhập lại nếu cần quyền quản trị.",
        };
      }
      return { user: null, message: `Không đọc được phiên đăng nhập: ${error.message}` };
    }
    return { user: data.user || null, message: "" };
  } catch (error) {
    if (isInvalidRefreshTokenError(error)) {
      clearSupabaseAuthStorage();
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // ignore
      }
      return {
        user: null,
        message: "Phiên đăng nhập cũ đã hết hạn và đã được làm sạch. Bạn có thể đăng nhập lại nếu cần quyền quản trị.",
      };
    }
    return {
      user: null,
      message: `Không khởi tạo được xác thực: ${error?.message || "Lỗi không xác định"}`,
    };
  }
}

async function uploadFlowerIcon(file) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `icons/${fileName}`;

  const { error: uploadError } = await supabase.storage.from(FLOWER_ICON_BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (uploadError) return { error: `Không upload được ảnh: ${uploadError.message}` };
  const { data } = supabase.storage.from(FLOWER_ICON_BUCKET).getPublicUrl(filePath);
  return { url: data.publicUrl, path: filePath };
}

function extractStoragePathFromUrl(url) {
  if (!url || !url.includes("/storage/v1/object/public/")) return null;
  const marker = `/storage/v1/object/public/${FLOWER_ICON_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

async function deleteFlowerIconByUrl(url) {
  const path = extractStoragePathFromUrl(url);
  if (!path) return;
  await supabase.storage.from(FLOWER_ICON_BUCKET).remove([path]);
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

function runLocalSelfChecks() {
  if (typeof window === "undefined") return;
  if (window.__selinaChecksRan) return;
  window.__selinaChecksRan = true;

  console.assert(groupBadgeClass("Lục").includes("green"), "Test failed: class nhóm Lục");
  console.assert(groupBadgeClass("Khác").includes("slate"), "Test failed: class fallback");
  console.assert(flowerLabel({ name: "Hoa Mẫu" }) === "Hoa Mẫu", "Test failed: flowerLabel");
  console.assert(extractStoragePathFromUrl("") === null, "Test failed: extractStoragePathFromUrl empty");
  console.assert(
    normalizeOwnershipRow({ id: 1, member_id: 2, flower_id: 3 }).memberId === "2",
    "Test failed: normalizeOwnershipRow"
  );
  console.assert(isInvalidRefreshTokenError({ message: "Invalid Refresh Token" }) === true, "Test failed: refresh token detection");
}

function PlaceholderFlowerIcon({ size = "md" }) {
  const iconClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass} aria-hidden="true">
      <path d="M12 21c1.6-2.8 2.4-5.2 2.4-7.2A4.4 4.4 0 0 0 10 9.4c-2.4 0-4.4 2-4.4 4.4 0 2 1 4.3 2.8 6.5" />
      <path d="M12 21c-1.3-1.8-2.7-3-4.2-3.7" />
      <path d="M12 21c1-1.6 2.5-3.1 4.6-4.3" />
      <path d="M12 10.5c1.2-2.2 3.1-3.8 5.6-4.8-.1 2.8-1 5-2.7 6.5" />
      <path d="M10.1 10.3C8.6 8 6.5 6.5 3.8 5.8c.1 2.7.9 4.8 2.5 6.2" />
      <circle cx="12" cy="12" r="1.3" />
    </svg>
  );
}

function FlowerThumbnail({ flower, size = "md" }) {
  const sizeClass = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  if (flower?.iconUrl) {
    return (
      <div className={`overflow-hidden rounded-2xl border bg-white ${sizeClass}`}>
        <img
          src={flower.iconUrl}
          alt={flower.name}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const fallback = e.currentTarget.nextElementSibling;
            if (fallback) fallback.classList.remove("hidden");
          }}
        />
        <div className="hidden h-full w-full items-center justify-center bg-slate-50 text-slate-500">
          <PlaceholderFlowerIcon size={size} />
        </div>
      </div>
    );
  }
  return (
    <div className={`flex items-center justify-center rounded-2xl border bg-slate-50 text-slate-500 ${sizeClass}`}>
      <PlaceholderFlowerIcon size={size} />
    </div>
  );
}

function CircleProgress({ percent = 0, size = "md" }) {
  const radius = size === "sm" ? 20 : 26;
  const stroke = size === "sm" ? 5 : 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  const wrapperClass = size === "sm" ? "h-10 w-10 sm:h-12 sm:w-12" : "h-14 w-14 sm:h-16 sm:w-16";
  const textClass = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <div className={`relative ${wrapperClass}`}>
      <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,rgba(99,102,241,0.12),rgba(14,165,233,0.08),rgba(168,85,247,0.12))] blur-md" />
      <svg viewBox={`0 0 ${radius * 2} ${radius * 2}`} className="relative h-full w-full">
        <circle stroke="#e5e7eb" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
        <circle
          stroke="#0f172a"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center font-semibold ${textClass}`}>{percent}%</div>
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <Card className="group rounded-[22px] border border-white/70 bg-white/85 shadow-[0_16px_45px_-24px_rgba(15,23,42,0.32)] backdrop-blur sm:rounded-[28px]">
      <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-2.5 text-slate-700 sm:p-3">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 sm:text-sm">{title}</p>
          <p className="mt-1 truncate text-lg font-bold tracking-tight text-slate-950 sm:text-2xl">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionEmpty({ children }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">{children}</div>;
}

function EditMemberForm({ member, onSave }) {
  const [name, setName] = useState(member.name);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Tên thành viên</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-2xl" />
      </div>
      <Button
        className="w-full rounded-2xl"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          const result = await onSave(name);
          setSaving(false);
          setMessage(result.message);
        }}
      >
        {saving ? "Đang lưu..." : "Lưu tên thành viên"}
      </Button>
      {message ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{message}</div> : null}
    </div>
  );
}

function EditFlowerForm({ flower, onSave }) {
  const [name, setName] = useState(flower.name);
  const [iconUrl, setIconUrl] = useState(flower.iconUrl || "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Tên hoa</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-2xl" />
      </div>
      <div className="space-y-2">
        <Label>Icon hoa (URL)</Label>
        <Input value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} className="rounded-2xl" placeholder="https://.../icon.png" />
      </div>
      <div className="space-y-2">
        <Label>Upload ảnh icon</Label>
        <Input
          type="file"
          accept="image/*"
          className="rounded-2xl"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(true);
            setMessage("Đang upload ảnh...");
            const result = await uploadFlowerIcon(file);
            setUploading(false);
            if (result.error) setMessage(result.error);
            else {
              setIconUrl(result.url);
              setMessage("Đã upload icon hoa.");
            }
            e.target.value = "";
          }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-2xl"
          disabled={!iconUrl || uploading || saving}
          onClick={async () => {
            if (iconUrl) await deleteFlowerIconByUrl(iconUrl);
            setIconUrl("");
            setMessage("Đã xoá icon hiện tại.");
          }}
        >
          Xoá icon
        </Button>
        <Button
          className="rounded-2xl"
          disabled={saving || uploading}
          onClick={async () => {
            setSaving(true);
            const result = await onSave({ name, iconUrl });
            setSaving(false);
            setMessage(result.message);
          }}
        >
          {saving ? "Đang lưu..." : "Lưu thông tin hoa"}
        </Button>
      </div>
      {message ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{message}</div> : null}
    </div>
  );
}

export default function HoaHoiGameCanvasApp() {
  const [flowers, setFlowers] = useState([]);
  const [members, setMembers] = useState([]);
  const [ownerships, setOwnerships] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ownershipsLoading, setOwnershipsLoading] = useState(true);
  const [ownershipsLoaded, setOwnershipsLoaded] = useState(false);
  const [pageMessage, setPageMessage] = useState("");
  const [realtimeMessage, setRealtimeMessage] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [flowerSearch, setFlowerSearch] = useState("");
  const [memberFlowerLookup, setMemberFlowerLookup] = useState("all");
  const [dashboardMissingGroupFilter, setDashboardMissingGroupFilter] = useState("all");
  const [dashboardRareGroupFilter, setDashboardRareGroupFilter] = useState("all");
  const [selectedExistingMemberId, setSelectedExistingMemberId] = useState("none");
  const [newMemberName, setNewMemberName] = useState("");
  const [selectedFlowerIds, setSelectedFlowerIds] = useState([]);
  const [updateSearch, setUpdateSearch] = useState("");
  const [updateGroupFilter, setUpdateGroupFilter] = useState("all");
  const [updateMessage, setUpdateMessage] = useState("");
  const [savingOwnership, setSavingOwnership] = useState(false);
  const [newFlowerName, setNewFlowerName] = useState("");
  const [newFlowerIconUrl, setNewFlowerIconUrl] = useState("");
  const [newFlowerGroup, setNewFlowerGroup] = useState("Lục");
  const [flowerCreateMessage, setFlowerCreateMessage] = useState("");
  const [newFlowerUploadMessage, setNewFlowerUploadMessage] = useState("");
  const [savingFlower, setSavingFlower] = useState(false);
  const [user, setUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);

  const membersRef = useRef([]);
  const flowersRef = useRef([]);

  useEffect(() => {
    runLocalSelfChecks();
  }, []);

  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  useEffect(() => {
    flowersRef.current = flowers;
  }, [flowers]);

  const isAdmin = useMemo(() => {
    const email = user?.email?.toLowerCase() || "";
    return ADMIN_EMAILS.map((x) => x.toLowerCase()).includes(email);
  }, [user]);

  useEffect(() => {
    let active = true;
    async function initAuth() {
      const result = await getSafeCurrentUser();
      if (!active) return;
      setUser(result.user || null);
      if (result.message) setLoginMessage(result.message);
    }
    initAuth();
    const sub = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (session?.user) {
        setUser(session.user);
        return;
      }
      const result = await getSafeCurrentUser();
      if (!active) return;
      setUser(result.user || null);
      if (result.message) setLoginMessage(result.message);
    });
    return () => {
      active = false;
      sub.data.subscription.unsubscribe();
    };
  }, []);

  async function loadOwnershipData() {
    setOwnershipsLoading(true);
    try {
      const result = await fetchAllOwnershipRows();
      if (result.error) throw new Error(result.error.message);
      const rows = result.data || [];
      const map = new Map();
      rows.forEach((row) => {
        const key = String(row.member_id) + "-" + String(row.flower_id);
        if (!map.has(key)) map.set(key, row);
      });
      setOwnerships(Array.from(map.values()).map(normalizeOwnershipRow));
      setOwnershipsLoaded(true);
    } catch (error) {
      setOwnershipsLoaded(false);
      setPageMessage(`Không tải được dữ liệu sở hữu: ${error?.message || "Lỗi không xác định"}`);
    } finally {
      setOwnershipsLoading(false);
    }
  }

  async function loadAllData() {
    setLoading(true);
    setPageMessage("");
    try {
      const results = await Promise.all([
        supabase.from("members").select("id, name").order("name", { ascending: true }),
        supabase.from("flowers").select("id, name, group_name, icon_url").order("name", { ascending: true }),
        supabase
          .from("action_logs")
          .select("id, action_type, actor_name, target_type, target_name, details, created_at")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      const [membersRes, flowersRes, historyRes] = results;
      if (membersRes.error || flowersRes.error || historyRes.error) {
        setPageMessage(membersRes.error?.message || flowersRes.error?.message || historyRes.error?.message || "Không tải được dữ liệu từ Supabase.");
      } else {
        setMembers((membersRes.data || []).map((m) => ({ id: String(m.id), name: m.name })));
        setFlowers((flowersRes.data || []).map((f) => ({ id: String(f.id), name: f.name, group: f.group_name, iconUrl: f.icon_url || "" })));
        setHistoryLogs(
          (historyRes.data || []).map((log) => ({
            id: String(log.id),
            actionType: log.action_type || "",
            actorName: log.actor_name || "Hệ thống",
            targetType: log.target_type || "",
            targetName: log.target_name || "",
            details: log.details || "",
            createdAt: log.created_at || "",
          }))
        );
      }
    } catch (error) {
      setPageMessage(`Không tải được dữ liệu: ${error?.message || "Lỗi không xác định"}`);
    } finally {
      setLoading(false);
    }
    await loadOwnershipData();
  }

  useEffect(() => {
    loadAllData();
    let reloadTimer;
    const channel = supabase.channel("realtime-selina");
    const refreshFromRealtime = () => {
      clearTimeout(reloadTimer);
      reloadTimer = window.setTimeout(() => {
        loadAllData();
      }, 300);
    };
    channel
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, refreshFromRealtime)
      .on("postgres_changes", { event: "*", schema: "public", table: "flowers" }, refreshFromRealtime)
      .on("postgres_changes", { event: "*", schema: "public", table: "member_flowers" }, refreshFromRealtime)
      .on("postgres_changes", { event: "*", schema: "public", table: "action_logs" }, refreshFromRealtime)
      .subscribe((status) => {
        const text = String(status || "").toLowerCase();
        if (text === "subscribed") setRealtimeMessage("");
      });
    return () => {
      clearTimeout(reloadTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  const ownersByFlower = useMemo(() => {
    const map = new Map();
    flowers.forEach((flower) => map.set(String(flower.id), []));
    ownerships.forEach((row) => {
      const member = members.find((m) => String(m.id) === String(row.memberId));
      if (!member) return;
      const list = map.get(String(row.flowerId)) || [];
      if (!list.includes(member.name)) list.push(member.name);
      map.set(String(row.flowerId), list);
    });
    return map;
  }, [flowers, members, ownerships]);

  const memberFlowerCounts = useMemo(() => {
    const counts = {};
    ownerships.forEach((row) => {
      const key = String(row.memberId);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [ownerships]);

  const summary = useMemo(() => {
    const ownedFlowerIds = new Set(ownerships.map((x) => String(x.flowerId)));
    return {
      totalMembers: members.length,
      totalFlowers: flowers.length,
      ownedFlowers: ownedFlowerIds.size,
      missingFlowers: flowers.length - ownedFlowerIds.size,
      completionRate: flowers.length ? Math.round((ownedFlowerIds.size / flowers.length) * 100) : 0,
    };
  }, [members, flowers, ownerships]);

  const topMembers = useMemo(() => {
    return [...members]
      .map((member) => ({ ...member, ownedCount: memberFlowerCounts[String(member.id)] || 0 }))
      .sort((a, b) => (b.ownedCount || 0) - (a.ownedCount || 0))
      .slice(0, 3);
  }, [members, memberFlowerCounts]);

  const groupOwnedCounts = useMemo(() => {
    const ownedFlowerIds = new Set(ownerships.map((row) => String(row.flowerId)));
    const counts = { Đỏ: 0, Vàng: 0, Tím: 0, Lam: 0, Lục: 0 };
    flowers.forEach((flower) => {
      if (ownedFlowerIds.has(String(flower.id))) {
        counts[flower.group] = (counts[flower.group] || 0) + 1;
      }
    });
    return counts;
  }, [flowers, ownerships]);

  const rankingsByGroup = useMemo(() => {
    const grouped = { Đỏ: [], Vàng: [], Tím: [], Lam: [], Lục: [] };
    members.forEach((member) => {
      const ownedIds = new Set(
        ownerships
          .filter((row) => String(row.memberId) === String(member.id))
          .map((row) => String(row.flowerId))
      );

      FLOWER_GROUPS.forEach((group) => {
        const count = flowers.filter((flower) => flower.group === group && ownedIds.has(String(flower.id))).length;
        if (count > 0) {
          grouped[group].push({ memberId: member.id, memberName: member.name, count });
        }
      });
    });

    FLOWER_GROUPS.forEach((group) => {
      grouped[group] = grouped[group]
        .sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;
          return a.memberName.localeCompare(b.memberName, "vi");
        })
        .slice(0, 3);
    });

    return grouped;
  }, [members, flowers, ownerships]);

  const missingFlowers = useMemo(() => flowers.filter((flower) => !ownersByFlower.get(String(flower.id))?.length), [flowers, ownersByFlower]);
  const rareFlowers = useMemo(
    () =>
      [...flowers]
        .filter((flower) => {
          const count = ownersByFlower.get(String(flower.id))?.length || 0;
          return count >= 1 && count <= 3;
        })
        .sort((a, b) => {
          const countA = ownersByFlower.get(String(a.id))?.length || 0;
          const countB = ownersByFlower.get(String(b.id))?.length || 0;
          if (countA !== countB) return countA - countB;
          return a.name.localeCompare(b.name, "vi");
        }),
    [flowers, ownersByFlower]
  );

  const filteredMissingFlowers = useMemo(
    () => missingFlowers.filter((flower) => dashboardMissingGroupFilter === "all" || flower.group === dashboardMissingGroupFilter),
    [missingFlowers, dashboardMissingGroupFilter]
  );
  const filteredRareFlowers = useMemo(
    () => rareFlowers.filter((flower) => dashboardRareGroupFilter === "all" || flower.group === dashboardRareGroupFilter),
    [rareFlowers, dashboardRareGroupFilter]
  );
  const filteredMembers = useMemo(
    () =>
      [...members]
        .map((member) => ({ ...member, ownedCount: memberFlowerCounts[String(member.id)] || 0 }))
        .filter((member) => member.name.toLowerCase().includes(memberSearch.trim().toLowerCase()))
        .sort((a, b) => (b.ownedCount || 0) - (a.ownedCount || 0)),
    [members, memberFlowerCounts, memberSearch]
  );
  const filteredFlowers = useMemo(
    () => flowers.filter((flower) => flowerLabel(flower).toLowerCase().includes(flowerSearch.trim().toLowerCase())),
    [flowers, flowerSearch]
  );
  const selectedMemberFlowerLookup = useMemo(
    () => members.find((member) => String(member.id) === String(memberFlowerLookup)) || null,
    [members, memberFlowerLookup]
  );
  const flowersBySelectedMember = useMemo(() => {
    if (!selectedMemberFlowerLookup) return [];
    const ids = new Set(
      ownerships.filter((row) => String(row.memberId) === String(selectedMemberFlowerLookup.id)).map((row) => String(row.flowerId))
    );
    return flowers.filter((flower) => ids.has(String(flower.id)));
  }, [flowers, ownerships, selectedMemberFlowerLookup]);
  const memberFlowersByGroup = useMemo(() => {
    const grouped = { Đỏ: [], Vàng: [], Tím: [], Lam: [], Lục: [] };
    flowersBySelectedMember.forEach((flower) => {
      if (!grouped[flower.group]) grouped[flower.group] = [];
      grouped[flower.group].push(flower);
    });
    return grouped;
  }, [flowersBySelectedMember]);
  const selectableFlowers = useMemo(() => {
    const q = updateSearch.trim().toLowerCase();
    return flowers.filter((flower) => {
      const okText = flowerLabel(flower).toLowerCase().includes(q);
      const okGroup = updateGroupFilter === "all" || flower.group === updateGroupFilter;
      return okText && okGroup;
    });
  }, [flowers, updateSearch, updateGroupFilter]);

  async function signInAsAdmin() {
    setLoginMessage("");
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginMessage("Vui lòng nhập email và mật khẩu.");
      return;
    }

    setLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      if (error) {
        setLoginMessage(`Đăng nhập thất bại: ${error.message}`);
        return;
      }
      const email = data.user?.email?.toLowerCase() || "";
      const allowed = ADMIN_EMAILS.map((item) => item.toLowerCase()).includes(email);
      if (!allowed) {
        await supabase.auth.signOut({ scope: "local" });
        setUser(null);
        setLoginMessage("Tài khoản này không có quyền quản trị.");
        return;
      }
      setUser(data.user || null);
      setLoginPassword("");
      setLoginMessage("Đăng nhập quản trị thành công.");
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
    setUser(null);
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      clearSupabaseAuthStorage();
    } finally {
      setLoginMessage("");
      setLoginPassword("");
      setLoggingOut(false);
    }
  }

  async function logAction({ actionType, actorName = "Hệ thống", targetType, targetName, details = "" }) {
    await supabase.from("action_logs").insert([
      {
        action_type: actionType,
        actor_name: actorName,
        target_type: targetType,
        target_name: targetName,
        details,
      },
    ]);
  }

  async function addFlowerToDatabase() {
    if (!isAdmin) return;
    setFlowerCreateMessage("");
    const name = newFlowerName.trim();
    if (!name || !newFlowerGroup) {
      setFlowerCreateMessage("Vui lòng nhập đủ tên hoa và nhóm hoa.");
      return;
    }
    if (flowers.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
      setFlowerCreateMessage("Loại hoa này đã tồn tại trong cơ sở dữ liệu.");
      return;
    }

    setSavingFlower(true);
    const { data, error } = await supabase
      .from("flowers")
      .insert([{ name, group_name: newFlowerGroup, icon_url: newFlowerIconUrl.trim() || null }])
      .select("id, name, group_name, icon_url")
      .single();
    setSavingFlower(false);

    if (error) {
      setFlowerCreateMessage(`Không thêm được hoa mới: ${error.message}`);
      return;
    }

    await logAction({
      actionType: "add_flower",
      actorName: user?.email || "Quản trị hội",
      targetType: "flower",
      targetName: data.name,
      details: `Thêm hoa mới vào nhóm ${data.group_name}`,
    });

    await loadAllData();
    setNewFlowerName("");
    setNewFlowerIconUrl("");
    setNewFlowerUploadMessage("");
    setNewFlowerGroup("Lục");
    setFlowerCreateMessage(`Đã thêm hoa mới: ${data.name}.`);
  }

  async function getOrCreateMember() {
    const trimmedNewMemberName = newMemberName.trim();
    const useExistingMember = selectedExistingMemberId !== "none";
    const useNewMember = !useExistingMember && trimmedNewMemberName.length > 0;

    if (!useExistingMember && !useNewMember) {
      return { error: "Hãy chọn thành viên cũ hoặc nhập tên thành viên mới." };
    }

    if (useExistingMember) {
      const member = members.find((m) => String(m.id) === selectedExistingMemberId);
      if (!member) return { error: "Không tìm thấy thành viên đã chọn." };
      return { member };
    }

    const normalizedNewName = trimmedNewMemberName.replace(/\s+/g, " ").trim().toLowerCase();
    const existing = members.find((m) => m.name.replace(/\s+/g, " ").trim().toLowerCase() === normalizedNewName);
    if (existing) return { member: existing };

    const { data, error } = await supabase.from("members").insert([{ name: trimmedNewMemberName }]).select("id, name").single();
    if (error) return { error: `Không tạo được thành viên mới: ${error.message}` };

    await logAction({
      actionType: "add_member",
      actorName: user?.email || "Quản trị hội",
      targetType: "member",
      targetName: data.name,
      details: "Thêm thành viên mới",
    });

    await loadAllData();
    return { member: { id: String(data.id), name: data.name } };
  }

  function toggleFlowerSelection(flowerId) {
    setSelectedFlowerIds((prev) => {
      const key = String(flowerId);
      return prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key];
    });
  }

  async function saveOwnershipUpdate() {
    if (!isAdmin) return;
    setUpdateMessage("");
    if (selectedFlowerIds.length === 0) {
      setUpdateMessage("Hãy chọn ít nhất 1 loại hoa để cập nhật.");
      return;
    }

    setSavingOwnership(true);
    const memberResult = await getOrCreateMember();
    if (memberResult.error) {
      setSavingOwnership(false);
      setUpdateMessage(memberResult.error);
      return;
    }

    const member = memberResult.member;
    const alreadyOwned = new Set(
      ownerships.filter((o) => String(o.memberId) === String(member.id)).map((o) => String(o.flowerId))
    );
    const uniqueSelectedFlowerIds = [...new Set(selectedFlowerIds.map(String))];
    const additions = uniqueSelectedFlowerIds
      .filter((flowerId) => !alreadyOwned.has(String(flowerId)))
      .map((flowerId) => ({ member_id: String(member.id), flower_id: String(flowerId) }));

    if (additions.length === 0) {
      setSavingOwnership(false);
      setUpdateMessage(`${member.name} đã có sẵn toàn bộ các hoa được chọn.`);
      return;
    }

    const { error } = await supabase.from("member_flowers").upsert(additions, {
      onConflict: "member_id,flower_id",
      ignoreDuplicates: true,
    });

    setSavingOwnership(false);
    if (error) {
      setUpdateMessage(`Không lưu được cập nhật sở hữu: ${error.message}`);
      return;
    }

    setSelectedFlowerIds([]);
    setSelectedExistingMemberId("none");
    setNewMemberName("");
    setUpdateMessage(`Đã cập nhật ${additions.length} loại hoa mới cho ${member.name}.`);

    await logAction({
      actionType: "update_ownership",
      actorName: user?.email || member.name,
      targetType: "member",
      targetName: member.name,
      details: `Thêm ${additions.length} hoa`,
    });
    await loadAllData();
  }

  async function renameMember(memberId, newName) {
    const trimmed = newName.trim();
    if (!trimmed) return { ok: false, message: "Tên thành viên không được để trống." };
    const { error } = await supabase.from("members").update({ name: trimmed }).eq("id", memberId);
    if (error) return { ok: false, message: `Không sửa được tên thành viên: ${error.message}` };
    await loadAllData();
    return { ok: true, message: "Đã cập nhật tên thành viên." };
  }

  async function renameFlower(flowerId, payload) {
    const trimmedName = payload.name.trim();
    const nextIconUrl = payload.iconUrl.trim();
    if (!trimmedName) return { ok: false, message: "Tên hoa không được để trống." };
    const { error } = await supabase.from("flowers").update({ name: trimmedName, icon_url: nextIconUrl || null }).eq("id", flowerId);
    if (error) return { ok: false, message: `Không sửa được hoa: ${error.message}` };
    await loadAllData();
    return { ok: true, message: "Đã cập nhật thông tin hoa." };
  }

  const tabsClass = "rounded-xl px-2 py-2 text-xs transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md sm:rounded-2xl sm:px-3 sm:text-sm";

  return (
    <div className="min-h-screen font-sans antialiased text-slate-900 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_right,_rgba(168,85,247,0.12),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
        <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.35)] backdrop-blur sm:p-5 md:rounded-[32px] md:p-8">
          <div className="relative grid gap-5 xl:grid-cols-[1fr_360px] xl:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Selina Flower Dashboard</div>
              <h1 className="mt-3 font-serif text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl md:mt-4 md:text-4xl">Quản Lý Hoa Hội SELINA</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-600">Thành viên chỉ có thể tra cứu thông tin. Các chức năng quản trị chỉ hiển thị cho admin đã đăng nhập.</p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs shadow-sm">
                  <CircleProgress percent={summary.completionRate} size="sm" />
                  <span className="font-medium text-slate-800">{ownershipsLoading || !ownershipsLoaded ? "Đang đồng bộ..." : `${summary.ownedFlowers}/${summary.totalFlowers} (${summary.completionRate}%)`}</span>
                </div>
                {ownershipsLoaded && topMembers.map((member, index) => (
                  <div key={member.id} className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs shadow-sm">
                    <Trophy className="h-3.5 w-3.5 text-amber-500" />
                    <span>Top {index + 1}: {member.name} ({member.ownedCount})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white/90 p-3 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Hội đã sở hữu theo nhóm</p>
                <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-8 rounded-xl px-3 text-xs"><Shield className="mr-1 h-3.5 w-3.5" />{isAdmin ? "Admin" : "Đăng nhập"}</Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-[28px] sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>{isAdmin ? "Tài khoản quản trị" : "Đăng nhập quản trị"}</DialogTitle>
                    </DialogHeader>
                    {isAdmin ? (
                      <div className="space-y-3">
                        <div className="rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-700">{user?.email}</div>
                        <Button variant="outline" className="w-full rounded-2xl" onClick={signOutAdmin} disabled={loggingOut}>{loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="Email admin" className="rounded-2xl" />
                        <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Mật khẩu" className="rounded-2xl" />
                        <Button onClick={signInAsAdmin} className="w-full rounded-2xl" disabled={loggingIn}>{loggingIn ? "Đang đăng nhập..." : "Đăng nhập admin"}</Button>
                        {loginMessage ? <div className="rounded-2xl border bg-slate-50 px-3 py-2 text-sm text-slate-700">{loginMessage}</div> : null}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex flex-wrap gap-2">
                {MEMBER_FLOWER_GROUP_ORDER.map((group) => (
                  <div key={group} className={`inline-flex min-w-[96px] flex-1 items-center justify-between rounded-2xl border px-3 py-2 text-sm ${groupBadgeClass(group)}`}>
                    <span className="font-medium">{group}</span>
                    <span className="font-semibold">{groupOwnedCounts[group] || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {pageMessage ? <div className="mt-4 rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{pageMessage}</div> : null}
          {realtimeMessage ? <div className="mt-4 rounded-2xl border bg-red-50 p-3 text-sm text-red-700">{realtimeMessage}</div> : null}
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
          <StatCard icon={<Users className="h-5 w-5" />} title="Thành viên" value={summary.totalMembers} />
          <StatCard icon={<Flower2 className="h-5 w-5" />} title="Tổng loại hoa" value={summary.totalFlowers} />
          <StatCard icon={<Database className="h-5 w-5" />} title="Hội đã sở hữu" value={ownershipsLoading || !ownershipsLoaded ? "..." : summary.ownedFlowers} />
          <StatCard icon={<AlertCircle className="h-5 w-5" />} title="Hội còn thiếu" value={ownershipsLoading || !ownershipsLoaded ? "..." : summary.missingFlowers} />
        </div>

        <Tabs defaultValue="dashboard" className="space-y-3 md:space-y-4">
          <TabsList className={`grid h-auto w-full gap-2 overflow-x-auto rounded-[20px] border border-white/70 bg-white/85 p-1.5 ${isAdmin ? "grid-cols-7" : "grid-cols-4"}`}>
            <TabsTrigger value="dashboard" className={tabsClass}>Tổng quan</TabsTrigger>
            <TabsTrigger value="members" className={tabsClass}>Thành viên</TabsTrigger>
            <TabsTrigger value="flowerlookup" className={tabsClass}>Tra cứu theo hoa</TabsTrigger>
            <TabsTrigger value="memberflowerlookup" className={tabsClass}>Tra cứu theo thành viên</TabsTrigger>
            {isAdmin ? <TabsTrigger value="update" className={tabsClass}>Cập nhật sở hữu</TabsTrigger> : null}
            {isAdmin ? <TabsTrigger value="addflower" className={tabsClass}>Thêm hoa mới</TabsTrigger> : null}
            {isAdmin ? <TabsTrigger value="history" className={tabsClass}>Lịch sử</TabsTrigger> : null}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1fr_1fr]">
              <Card className="rounded-[28px] border border-white/70 bg-white/85 shadow-[0_16px_45px_-24px_rgba(15,23,42,0.18)]">
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <CardTitle className="font-sans">Xếp hạng theo phân loại</CardTitle>
                  <span className="text-sm text-slate-500">Theo nhóm</span>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[320px] pr-3 md:h-[520px]">
                    <div className="space-y-3">
                      {MEMBER_FLOWER_GROUP_ORDER.map((group) => {
                        const items = rankingsByGroup[group] || [];
                        return (
                          <div key={group} className={`rounded-3xl border p-4 ${groupBadgeClass(group)}`}>
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <p className="text-lg font-semibold">{group}</p>
                            </div>
                            {items.length === 0 ? (
                              <p className="text-sm opacity-80">Chưa có dữ liệu</p>
                            ) : (
                              <div className="space-y-2 text-sm text-slate-800">
                                {items.map((item, index) => (
                                  <div key={`${group}-${item.memberId}`} className="flex items-start justify-between gap-3 rounded-2xl bg-white/70 px-3 py-2">
                                    <div className="min-w-0">
                                      <span className="mr-2 font-semibold">{index + 1}.</span>
                                      <span className="break-words">{item.memberName}</span>
                                    </div>
                                    <span className="font-semibold">{item.count}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border border-white/70 bg-white/85 shadow-[0_16px_45px_-24px_rgba(15,23,42,0.18)]">
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <CardTitle className="font-sans">Hoa ít người sở hữu (1-3)</CardTitle>
                  <div className="w-full md:w-44">
                    <Select value={dashboardRareGroupFilter} onValueChange={setDashboardRareGroupFilter}>
                      <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả nhóm</SelectItem>
                        {FLOWER_GROUPS.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredRareFlowers.length === 0 ? (
                    <SectionEmpty>Không có hoa nào thuộc nhóm này.</SectionEmpty>
                  ) : (
                    <ScrollArea className="h-[320px] pr-3 md:h-[520px]">
                      <div className="space-y-3">
                        {filteredRareFlowers.map((flower) => {
                          const owners = ownersByFlower.get(String(flower.id)) || [];
                          return (
                            <div key={flower.id} className="rounded-3xl border p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-3">
                                    <FlowerThumbnail flower={flower} />
                                    <div className="min-w-0">
                                      <p className="font-semibold break-words">{flowerLabel(flower)}</p>
                                      <p className="mt-1 text-sm text-slate-600">{owners.length} người sở hữu</p>
                                    </div>
                                  </div>
                                  {owners.length > 0 ? (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {owners.map((owner) => <Badge key={`${flower.id}-${owner}`} variant="outline" className="rounded-full">{owner}</Badge>)}
                                    </div>
                                  ) : null}
                                </div>
                                <Badge variant="outline" className={groupBadgeClass(flower.group)}>{flower.group}</Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border border-white/70 bg-white/85 shadow-[0_16px_45px_-24px_rgba(15,23,42,0.18)]">
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <CardTitle className="font-sans">Hoa hội còn thiếu</CardTitle>
                  <div className="w-full md:w-44">
                    <Select value={dashboardMissingGroupFilter} onValueChange={setDashboardMissingGroupFilter}>
                      <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả nhóm</SelectItem>
                        {FLOWER_GROUPS.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredMissingFlowers.length === 0 ? (
                    <SectionEmpty>Hiện không có hoa thiếu trong nhóm đang lọc.</SectionEmpty>
                  ) : (
                    <ScrollArea className="h-[320px] pr-3 md:h-[520px]">
                      <div className="space-y-3">
                        {filteredMissingFlowers.map((flower) => (
                          <div key={flower.id} className="rounded-3xl border p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-3">
                                  <FlowerThumbnail flower={flower} />
                                  <div className="min-w-0">
                                    <p className="font-semibold break-words">{flowerLabel(flower)}</p>
                                    <p className="mt-1 text-sm text-slate-600">Chưa có ai trong hội sở hữu</p>
                                  </div>
                                </div>
                              </div>
                              <Badge variant="outline" className={groupBadgeClass(flower.group)}>{flower.group}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-4"><Card className="rounded-[28px]"><CardHeader><CardTitle className="font-sans">Tra cứu theo thành viên</CardTitle></CardHeader><CardContent className="space-y-4"><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Tìm theo tên thành viên..." className="rounded-2xl pl-9" /></div><div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredMembers.map((member) => { const ownedCount = memberFlowerCounts[String(member.id)] || 0; return <Card key={member.id} className="rounded-[24px]"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle className="text-lg leading-snug sm:text-xl">{member.name}</CardTitle><div className="flex items-center gap-2"><Badge variant="secondary">{ownedCount} hoa</Badge><Dialog><DialogTrigger asChild><Button variant="outline" size="sm" className="rounded-2xl">Sửa tên</Button></DialogTrigger><DialogContent className="rounded-3xl"><DialogHeader><DialogTitle>Sửa tên thành viên</DialogTitle></DialogHeader><EditMemberForm member={member} onSave={(newName) => renameMember(member.id, newName)} /></DialogContent></Dialog></div></div></CardHeader><CardContent className="space-y-3"><div className="flex items-center gap-3 sm:gap-4"><CircleProgress percent={summary.totalFlowers ? Math.round((ownedCount / summary.totalFlowers) * 100) : 0} /><div className="text-sm text-slate-600"><p>Tiến độ sưu tập</p><p className="font-medium">{ownedCount}/{summary.totalFlowers}</p></div></div></CardContent></Card>; })}</div></CardContent></Card></TabsContent>

          <TabsContent value="flowerlookup" className="space-y-4"><Card className="rounded-[28px]"><CardHeader><CardTitle className="font-sans">Tra cứu theo hoa</CardTitle></CardHeader><CardContent className="space-y-4"><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={flowerSearch} onChange={(e) => setFlowerSearch(e.target.value)} placeholder="Tìm theo tên hoa..." className="rounded-2xl pl-9" /></div><ScrollArea className="h-[360px] pr-3 md:h-[520px] xl:h-[760px]"><div className="space-y-4">{filteredFlowers.map((flower) => { const owners = ownersByFlower.get(String(flower.id)) || []; return <Card key={flower.id} className="rounded-[28px]"><CardHeader><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-3"><FlowerThumbnail flower={flower} /><CardTitle className="text-lg">{flowerLabel(flower)}</CardTitle></div><p className="mt-1 text-sm text-slate-600">Nhóm {flower.group}</p></div><div className="flex items-center gap-2"><Badge variant="secondary">{owners.length} người</Badge><Dialog><DialogTrigger asChild><Button variant="outline" size="sm" className="rounded-2xl">Sửa tên</Button></DialogTrigger><DialogContent className="rounded-3xl"><DialogHeader><DialogTitle>Sửa tên hoa</DialogTitle></DialogHeader><EditFlowerForm flower={flower} onSave={(payload) => renameFlower(flower.id, payload)} /></DialogContent></Dialog></div></div></CardHeader><CardContent>{owners.length === 0 ? <SectionEmpty>Hiện chưa có ai sở hữu.</SectionEmpty> : <div className="flex flex-wrap gap-2">{owners.map((owner) => <Badge key={String(flower.id) + owner} variant="outline" className="rounded-full">{owner}</Badge>)}</div>}</CardContent></Card>; })}</div></ScrollArea></CardContent></Card></TabsContent>

          <TabsContent value="memberflowerlookup" className="space-y-4"><Card className="rounded-[28px]"><CardHeader className="space-y-4"><div><CardTitle className="font-sans">Tra cứu theo thành viên</CardTitle><p className="mt-1 text-sm text-slate-600">Chọn một thành viên để xem bộ sưu tập theo nhóm hoa.</p></div><div className="w-full"><Select value={memberFlowerLookup} onValueChange={setMemberFlowerLookup}><SelectTrigger className="rounded-2xl"><SelectValue placeholder="Chọn thành viên" /></SelectTrigger><SelectContent><SelectItem value="all">-- Chọn thành viên --</SelectItem>{members.map((member) => <SelectItem key={member.id} value={String(member.id)}>{member.name}</SelectItem>)}</SelectContent></Select></div></CardHeader><CardContent>{!selectedMemberFlowerLookup ? <SectionEmpty>Hãy chọn một thành viên để xem người đó đang có những loại hoa gì.</SectionEmpty> : <div className="space-y-4"><div className="rounded-2xl border bg-slate-50 px-4 py-3"><div className="mt-1 flex items-center justify-between gap-3"><p className="font-semibold text-slate-900">{selectedMemberFlowerLookup.name}</p><Badge variant="secondary">{flowersBySelectedMember.length} hoa</Badge></div></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">{MEMBER_FLOWER_GROUP_ORDER.map((group) => { const groupFlowers = memberFlowersByGroup[group] || []; return <div key={group} className="rounded-3xl border p-3"><div className="mb-3 flex items-center justify-between gap-2"><Badge variant="outline" className={groupBadgeClass(group)}>{group}</Badge><span className="text-xs text-slate-500">{groupFlowers.length}</span></div><ScrollArea className="h-[220px] pr-2 sm:h-[300px] xl:h-[620px]"><div className="space-y-2">{groupFlowers.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400">Chưa có hoa</div> : groupFlowers.map((flower) => <div key={String(group) + String(flower.id)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"><div className="flex items-center gap-2"><FlowerThumbnail flower={flower} size="sm" /><p className="text-sm font-medium text-slate-700 leading-snug break-words line-clamp-2">{flowerLabel(flower)}</p></div></div>)}</div></ScrollArea></div>; })}</div></div>}</CardContent></Card></TabsContent>

          {isAdmin ? (
            <TabsContent value="update" className="space-y-4">
              <Card className="rounded-[28px]">
                <CardHeader><CardTitle className="font-sans">Cập nhật hoa mới thành viên vừa sở hữu</CardTitle></CardHeader>
                <CardContent className="grid gap-4 xl:grid-cols-[360px_1fr] xl:gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Chọn thành viên cũ</Label>
                      <Select value={selectedExistingMemberId} onValueChange={(value) => { setSelectedExistingMemberId(value); if (value !== "none") setNewMemberName(""); }}>
                        <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Chọn tên thành viên" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- Không chọn --</SelectItem>
                          {members.map((member) => <SelectItem key={member.id} value={String(member.id)}>{member.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Hoặc tạo thành viên mới</Label>
                      <Input value={newMemberName} onChange={(e) => { setNewMemberName(e.target.value); if (e.target.value.trim()) setSelectedExistingMemberId("none"); }} placeholder="Nhập tên thành viên mới" className="rounded-2xl" />
                    </div>
                    <div className="space-y-3 rounded-2xl border bg-slate-50 p-4">
                      <Label>Lọc danh sách hoa để chọn</Label>
                      <Input value={updateSearch} onChange={(e) => setUpdateSearch(e.target.value)} placeholder="Tìm tên hoa" className="rounded-2xl" />
                      <Select value={updateGroupFilter} onValueChange={setUpdateGroupFilter}><SelectTrigger className="rounded-2xl"><SelectValue placeholder="Lọc theo nhóm" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả nhóm</SelectItem>{FLOWER_GROUPS.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <Button onClick={saveOwnershipUpdate} className="w-full rounded-2xl" disabled={savingOwnership}>{savingOwnership ? "Đang lưu..." : "Lưu cập nhật sở hữu"}</Button>
                    {updateMessage ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{updateMessage}</div> : null}
                  </div>
                  <Card className="rounded-[28px]">
                    <CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>Chọn nhiều hoa</CardTitle><Badge variant="secondary">Đã chọn {selectedFlowerIds.length}</Badge></div></CardHeader>
                    <CardContent><ScrollArea className="h-[420px] pr-4"><div className="space-y-3">{selectableFlowers.map((flower) => { const checked = selectedFlowerIds.includes(String(flower.id)); return <label key={flower.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition hover:bg-slate-50"><Checkbox checked={checked} onCheckedChange={() => toggleFlowerSelection(flower.id)} /><div className="flex-1"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-3"><FlowerThumbnail flower={flower} size="sm" /><p className="font-medium">{flowerLabel(flower)}</p></div><p className="mt-1 text-sm text-slate-600">Hiện có {ownersByFlower.get(String(flower.id))?.length || 0} người sở hữu</p></div><Badge variant="outline" className={groupBadgeClass(flower.group)}>{flower.group}</Badge></div></div></label>; })}</div></ScrollArea></CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>
          ) : null}

          {isAdmin ? (
            <TabsContent value="addflower" className="space-y-4">
              <Card className="rounded-[28px]">
                <CardHeader><CardTitle className="font-sans">Thêm hoa mới vào cơ sở dữ liệu chung</CardTitle></CardHeader>
                <CardContent className="grid gap-4 xl:grid-cols-[420px_1fr] xl:gap-6">
                  <div className="space-y-4 rounded-3xl border bg-slate-50 p-5">
                    <div className="space-y-2"><Label>Tên hoa</Label><Input value={newFlowerName} onChange={(e) => setNewFlowerName(e.target.value)} placeholder="Ví dụ: Huyền Tinh" className="rounded-2xl" /></div>
                    <div className="space-y-2"><Label>Icon hoa (URL ảnh, không bắt buộc)</Label><Input value={newFlowerIconUrl} onChange={(e) => setNewFlowerIconUrl(e.target.value)} placeholder="Ví dụ: https://.../icon.png" className="rounded-2xl" />{newFlowerUploadMessage ? <p className="text-xs text-slate-500">{newFlowerUploadMessage}</p> : null}</div>
                    <div className="space-y-2"><Label>Nhóm hoa</Label><Select value={newFlowerGroup} onValueChange={setNewFlowerGroup}><SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger><SelectContent>{FLOWER_GROUPS.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}</SelectContent></Select></div>
                    <Button onClick={addFlowerToDatabase} className="w-full rounded-2xl" disabled={savingFlower}><Plus className="mr-2 h-4 w-4" />{savingFlower ? "Đang thêm..." : "Thêm hoa mới"}</Button>
                    {flowerCreateMessage ? <div className="rounded-2xl border bg-white p-3 text-sm text-slate-700">{flowerCreateMessage}</div> : null}
                  </div>
                  <Card className="rounded-[28px]"><CardHeader><CardTitle>Danh sách hoa hiện có</CardTitle></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-2">{flowers.map((flower) => <div key={flower.id} className="rounded-3xl border p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-3"><FlowerThumbnail flower={flower} /><p className="font-medium">{flowerLabel(flower)}</p></div><p className="mt-1 text-sm text-slate-600">{ownershipsLoading || !ownershipsLoaded ? "Đang đồng bộ dữ liệu sở hữu" : `${ownersByFlower.get(String(flower.id))?.length || 0} người đang sở hữu`}</p></div><Badge variant="outline" className={groupBadgeClass(flower.group)}>{flower.group}</Badge></div></div>)}</div></CardContent></Card>
                </CardContent>
              </Card>
            </TabsContent>
          ) : null}

          {isAdmin ? (
            <TabsContent value="history" className="space-y-4">
              <Card className="rounded-[28px]">
                <CardHeader><CardTitle className="font-sans">Bảng lịch sử thao tác</CardTitle></CardHeader>
                <CardContent>
                  {loading ? <p className="text-sm text-slate-600">Đang tải lịch sử...</p> : historyLogs.length === 0 ? <SectionEmpty>Chưa có lịch sử thao tác.</SectionEmpty> : <div className="overflow-x-auto rounded-2xl border"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-slate-600"><tr><th className="px-4 py-3 font-medium">Thời gian</th><th className="px-4 py-3 font-medium">Người thao tác</th><th className="px-4 py-3 font-medium">Hành động</th><th className="px-4 py-3 font-medium">Đối tượng</th><th className="px-4 py-3 font-medium">Chi tiết</th></tr></thead><tbody>{historyLogs.map((log) => <tr key={log.id} className="border-t align-top"><td className="px-4 py-3 whitespace-nowrap text-slate-500">{log.createdAt ? new Date(log.createdAt).toLocaleString("vi-VN") : "-"}</td><td className="px-4 py-3 font-medium">{log.actorName || "-"}</td><td className="px-4 py-3"><Badge variant="outline" className="rounded-full">{log.actionType || "-"}</Badge></td><td className="px-4 py-3"><div className="font-medium">{log.targetName || "-"}</div><div className="text-xs text-slate-500">{log.targetType || "-"}</div></td><td className="px-4 py-3 text-slate-600">{log.details || "-"}</td></tr>)}</tbody></table></div>}
                </CardContent>
              </Card>
            </TabsContent>
          ) : null}
        </Tabs>
      </div>
    </div>
  );
}
