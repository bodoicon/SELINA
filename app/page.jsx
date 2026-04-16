"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import {
  Search,
  Plus,
  Users,
  Flower2,
  Database,
  AlertCircle,
  RefreshCw,
  Trophy,
  LogIn,
  LogOut,
  Shield,
} from "lucide-react";

const FLOWER_GROUPS = ["Lục", "Lam", "Tím", "Vàng", "Đỏ"];

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
  return flower.name;
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
    const keysToRemove = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(SUPABASE_STORAGE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Ignore localStorage issues in preview/canvas.
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
          message:
            "Phiên đăng nhập cũ đã hết hạn và đã được làm sạch. Bạn có thể đăng nhập lại nếu cần quyền quản trị.",
        };
      }

      return {
        user: null,
        message: `Không đọc được phiên đăng nhập: ${error.message}`,
      };
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
        message:
          "Phiên đăng nhập cũ đã hết hạn và đã được làm sạch. Bạn có thể đăng nhập lại nếu cần quyền quản trị.",
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

  const { error: uploadError } = await supabase.storage
    .from(FLOWER_ICON_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    return { error: `Không upload được ảnh: ${uploadError.message}` };
  }

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
      .select("id, member_id, flower_id, created_at")
      .range(from, from + pageSize - 1)
      .order("id", { ascending: true });

    if (error) {
      return { data: null, error };
    }

    const rows = data || [];
    allRows = [...allRows, ...rows];

    if (rows.length < pageSize) break;
    from += pageSize;
  }

  return { data: allRows, error: null };
}

function runLocalSelfChecks() {
  if (typeof window === "undefined") return;
  if (window.__hoaSelfChecksRan) return;
  window.__hoaSelfChecksRan = true;

  console.assert(groupBadgeClass("Lục").includes("green"), "Test failed: nhóm Lục phải trả về class màu xanh.");
  console.assert(groupBadgeClass("Khác").includes("slate"), "Test failed: nhóm lạ phải dùng class mặc định.");
  console.assert(
    extractStoragePathFromUrl(
      "https://demo.supabase.co/storage/v1/object/public/flower-icons/icons/sample.png"
    ) === "icons/sample.png",
    "Test failed: extractStoragePathFromUrl phải tách đúng path trong bucket."
  );
  console.assert(extractStoragePathFromUrl("") === null, "Test failed: URL rỗng phải trả về null.");
  console.assert(
    normalizeOwnershipRow({ id: 1, member_id: 2, flower_id: 3 }).memberId === "2",
    "Test failed: normalizeOwnershipRow phải chuyển member_id sang string."
  );
  console.assert(flowerLabel({ name: "Hoa Mẫu" }) === "Hoa Mẫu", "Test failed: flowerLabel phải trả về tên hoa.");
}

export default function HoaHoiGameCanvasApp() {
  const [flowers, setFlowers] = useState([]);
  const [members, setMembers] = useState([]);
  const [ownerships, setOwnerships] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageMessage, setPageMessage] = useState("");

  const [memberSearch, setMemberSearch] = useState("");
  const [flowerSearch, setFlowerSearch] = useState("");
  const [dashboardGroupFilter, setDashboardGroupFilter] = useState("all");

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
  const [savingFlower, setSavingFlower] = useState(false);
  const [newFlowerUploadMessage, setNewFlowerUploadMessage] = useState("");

  const [historyLogs, setHistoryLogs] = useState([]);
  const [memberFlowerCounts, setMemberFlowerCounts] = useState({});

  const [user, setUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);

  const [realtimeStatus, setRealtimeStatus] = useState("connecting");
  const [realtimeMessage, setRealtimeMessage] = useState("");
  const [realtimeToast, setRealtimeToast] = useState({
    visible: false,
    title: "",
    description: "",
  });

  const isAdmin = useMemo(() => {
    const email = user?.email?.toLowerCase() || "";
    return ADMIN_EMAILS.map((x) => x.toLowerCase()).includes(email);
  }, [user]);

  useEffect(() => {
    runLocalSelfChecks();
  }, []);

  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      const result = await getSafeCurrentUser();
      if (!active) return;
      setUser(result.user || null);
      if (result.message) setLoginMessage(result.message);
    }

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (session?.user) {
        setUser(session.user);
        return;
      }
      const fallback = await getSafeCurrentUser();
      if (!active) return;
      setUser(fallback.user || null);
      if (fallback.message) setLoginMessage(fallback.message);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadAllData() {
    setLoading(true);
    setPageMessage("");

    const timeoutPromise = new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error("Timeout khi tải dữ liệu")), 6000);
    });

    try {
      const result = await Promise.race([
        Promise.all([
          supabase.from("members").select("id, name, created_at").order("name", { ascending: true }),
          supabase
            .from("flowers")
            .select("id, name, group_name, icon_url, created_at")
            .order("name", { ascending: true }),
          fetchAllOwnershipRows(),
          supabase
            .from("action_logs")
            .select("id, action_type, actor_name, target_type, target_name, details, created_at")
            .order("created_at", { ascending: false })
            .limit(50),
        ]),
        timeoutPromise,
      ]);

      const [membersRes, flowersRes, ownershipsRes, historyRes] = result;

      if (membersRes.error || flowersRes.error || ownershipsRes.error || historyRes.error) {
        setPageMessage(
          membersRes.error?.message ||
            flowersRes.error?.message ||
            ownershipsRes.error?.message ||
            historyRes.error?.message ||
            "Không tải được dữ liệu từ Supabase."
        );
        setLoading(false);
        return;
      }

      const counts = {};
      (ownershipsRes.data || []).forEach((row) => {
        const key = String(row.member_id);
        counts[key] = (counts[key] || 0) + 1;
      });

      setMemberFlowerCounts(counts);
      setMembers((membersRes.data || []).map((m) => ({ id: String(m.id), name: m.name })));
      setFlowers(
        (flowersRes.data || []).map((f) => ({
          id: String(f.id),
          name: f.name,
          group: f.group_name,
          iconUrl: f.icon_url || "",
        }))
      );
      setOwnerships((ownershipsRes.data || []).map(normalizeOwnershipRow));
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
    } catch (error) {
      setPageMessage(
        error?.message === "Timeout khi tải dữ liệu"
          ? "Canvas đang treo request tới Supabase. Đây thường chỉ là giới hạn môi trường test."
          : `Không tải được dữ liệu: ${error?.message || "Lỗi không xác định"}`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllData();

    let reloadTimer;

    const showRealtimeToast = (payload) => {
      const eventType = payload?.eventType;
      const table = payload?.table;

      if (eventType === "INSERT" && table === "members") {
        const memberName = payload?.new?.name || "Thành viên mới";
        setRealtimeToast({
          visible: true,
          title: "🎉 Thành viên mới",
          description: `Chúc mừng ${memberName} đã gia nhập hội.`,
        });
      } else if (eventType === "INSERT" && table === "member_flowers") {
        const memberId = String(payload?.new?.member_id || "");
        const flowerId = String(payload?.new?.flower_id || "");
        const memberName = members.find((m) => String(m.id) === memberId)?.name || "Một thành viên";
        const flowerName = flowers.find((f) => String(f.id) === flowerId)?.name || "một loài hoa";

        setRealtimeToast({
          visible: true,
          title: "🌸 Cập nhật bộ sưu tập",
          description: `${memberName} đã thêm hoa ${flowerName} vào bộ sưu tập.`,
        });
      } else {
        return;
      }

      if (typeof window !== "undefined") {
        window.clearTimeout(window.__hoaRealtimeToastTimer);
        window.__hoaRealtimeToastTimer = window.setTimeout(() => {
          setRealtimeToast((prev) => ({ ...prev, visible: false }));
        }, 2600);
      }
    };

    const refreshFromRealtime = (payload) => {
      showRealtimeToast(payload);
      clearTimeout(reloadTimer);
      reloadTimer = window.setTimeout(() => {
        loadAllData();
      }, 300);
    };

    const channel = supabase.channel(`realtime-${Date.now()}`);

    channel
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, refreshFromRealtime)
      .on("postgres_changes", { event: "*", schema: "public", table: "flowers" }, refreshFromRealtime)
      .on("postgres_changes", { event: "*", schema: "public", table: "member_flowers" }, refreshFromRealtime)
      .on("postgres_changes", { event: "*", schema: "public", table: "action_logs" }, refreshFromRealtime)
      .subscribe((status) => {
        const normalized = String(status || "unknown").toLowerCase();
        setRealtimeStatus(normalized);

        if (normalized === "subscribed") {
          setRealtimeMessage("");
        } else if (
          normalized === "channel_error" ||
          normalized === "timed_out" ||
          normalized === "closed"
        ) {
          setRealtimeMessage("");
        }
      });

    return () => {
      clearTimeout(reloadTimer);
      supabase.removeChannel(channel);
    };
  }, [members, flowers]);

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

  const ownersByFlower = useMemo(() => {
    const map = new Map();
    flowers.forEach((flower) => map.set(String(flower.id), []));

    ownerships.forEach(({ memberId, flowerId }) => {
      const member = members.find((m) => String(m.id) === String(memberId));
      if (!member) return;
      const flowerKey = String(flowerId);
      if (!map.has(flowerKey)) map.set(flowerKey, []);
      const currentOwners = map.get(flowerKey) || [];
      if (!currentOwners.includes(member.name)) {
        currentOwners.push(member.name);
      }
      map.set(flowerKey, currentOwners);
    });

    return map;
  }, [flowers, members, ownerships]);

  const missingFlowers = useMemo(() => {
    return flowers.filter((flower) => !ownersByFlower.get(String(flower.id))?.length);
  }, [flowers, ownersByFlower]);

  const rareFlowers = useMemo(() => {
    return [...flowers]
      .filter((flower) => {
        const count = ownersByFlower.get(String(flower.id))?.length || 0;
        return count >= 1 && count <= 3;
      })
      .sort((a, b) => {
        const countA = ownersByFlower.get(String(a.id))?.length || 0;
        const countB = ownersByFlower.get(String(b.id))?.length || 0;
        if (countA !== countB) return countA - countB;
        return a.name.localeCompare(b.name, "vi");
      });
  }, [flowers, ownersByFlower]);

  const filteredMissingFlowers = useMemo(() => {
    return missingFlowers.filter(
      (flower) => dashboardGroupFilter === "all" || flower.group === dashboardGroupFilter
    );
  }, [missingFlowers, dashboardGroupFilter]);

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();

    return [...members]
      .map((member) => ({
        ...member,
        ownedCount: memberFlowerCounts[String(member.id)] || 0,
      }))
      .filter((member) => member.name.toLowerCase().includes(q))
      .sort((a, b) => (b.ownedCount || 0) - (a.ownedCount || 0));
  }, [members, memberSearch, memberFlowerCounts]);

  const filteredFlowers = useMemo(() => {
    const q = flowerSearch.trim().toLowerCase();
    return flowers.filter((flower) => flowerLabel(flower).toLowerCase().includes(q));
  }, [flowers, flowerSearch]);

  const selectableFlowers = useMemo(() => {
    const q = updateSearch.trim().toLowerCase();
    return flowers.filter((flower) => {
      const textOk = flowerLabel(flower).toLowerCase().includes(q);
      const groupOk = updateGroupFilter === "all" || flower.group === updateGroupFilter;
      return textOk && groupOk;
    });
  }, [flowers, updateSearch, updateGroupFilter]);

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

  const memberProgressMap = useMemo(() => {
    const total = flowers.length || 0;
    const result = {};
    members.forEach((member) => {
      const ownedCount = memberFlowerCounts[String(member.id)] || 0;
      result[String(member.id)] = {
        ownedCount,
        total,
        percent: total ? Math.round((ownedCount / total) * 100) : 0,
      };
    });
    return result;
  }, [members, flowers, memberFlowerCounts]);

  function toggleFlowerSelection(flowerId) {
    setSelectedFlowerIds((prev) => {
      const key = String(flowerId);
      return prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key];
    });
  }

  async function logAction({ actionType, actorName = "Hệ thống", targetType, targetName, details = "" }) {
    const { error } = await supabase.from("action_logs").insert([
      {
        action_type: actionType,
        actor_name: actorName,
        target_type: targetType,
        target_name: targetName,
        details,
      },
    ]);
    return { error };
  }

  async function addFlowerToDatabase() {
    if (!isAdmin) return;

    setFlowerCreateMessage("");
    const name = newFlowerName.trim();

    if (!name || !newFlowerGroup) {
      setFlowerCreateMessage("Vui lòng nhập đủ tên hoa và nhóm hoa.");
      return;
    }

    const exists = flowers.some((f) => f.name.toLowerCase() === name.toLowerCase());
    if (exists) {
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

    const inserted = {
      id: String(data.id),
      name: data.name,
      group: data.group_name,
      iconUrl: data.icon_url || "",
    };

    await logAction({
      actionType: "add_flower",
      actorName: user?.email || "Quản trị hội",
      targetType: "flower",
      targetName: inserted.name,
      details: `Thêm hoa mới vào nhóm ${inserted.group}`,
    });

    await loadAllData();
    setNewFlowerName("");
    setNewFlowerIconUrl("");
    setNewFlowerUploadMessage("");
    setNewFlowerGroup("Lục");
    setFlowerCreateMessage(`Đã thêm hoa mới: ${flowerLabel(inserted)}.`);
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
      if (!member) {
        return { error: "Không tìm thấy thành viên đã chọn." };
      }
      return { member };
    }

    const normalizedNewName = trimmedNewMemberName.replace(/\s+/g, " ").trim().toLowerCase();
    const existing = members.find(
      (m) => m.name.replace(/\s+/g, " ").trim().toLowerCase() === normalizedNewName
    );
    if (existing) {
      return { member: existing };
    }

    const { data, error } = await supabase
      .from("members")
      .insert([{ name: trimmedNewMemberName }])
      .select("id, name")
      .single();

    if (error) {
      return { error: `Không tạo được thành viên mới: ${error.message}` };
    }

    const insertedMember = { id: String(data.id), name: data.name };
    await logAction({
      actionType: "add_member",
      actorName: user?.email || "Quản trị hội",
      targetType: "member",
      targetName: insertedMember.name,
      details: "Thêm thành viên mới",
    });
    await loadAllData();
    return { member: insertedMember };
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
      ownerships
        .filter((o) => String(o.memberId) === String(member.id))
        .map((o) => String(o.flowerId))
    );
    const uniqueSelectedFlowerIds = [...new Set(selectedFlowerIds.map(String))];
    const additions = uniqueSelectedFlowerIds.map((flowerId) => ({
      member_id: String(member.id),
      flower_id: String(flowerId),
    }));

    const optimisticRows = uniqueSelectedFlowerIds
      .filter((flowerId) => !alreadyOwned.has(String(flowerId)))
      .map((flowerId) => ({
        id: `temp-${member.id}-${flowerId}-${Date.now()}`,
        memberId: String(member.id),
        flowerId: String(flowerId),
      }));

    if (optimisticRows.length === 0) {
      setSavingOwnership(false);
      setUpdateMessage(`${member.name} đã có sẵn toàn bộ các hoa được chọn.`);
      return;
    }

    setOwnerships((prev) => {
      const existingKeys = new Set(prev.map((row) => `${String(row.memberId)}-${String(row.flowerId)}`));
      const rowsToAdd = optimisticRows.filter(
        (row) => !existingKeys.has(`${String(row.memberId)}-${String(row.flowerId)}`)
      );
      return [...prev, ...rowsToAdd];
    });

    const { error } = await supabase
      .from("member_flowers")
      .upsert(additions, { onConflict: "member_id,flower_id", ignoreDuplicates: true });

    if (error) {
      setOwnerships((prev) => prev.filter((row) => !String(row.id).startsWith(`temp-${member.id}-`)));
      setSavingOwnership(false);
      setUpdateMessage(`Không lưu được cập nhật sở hữu: ${error.message}`);
      return;
    }

    setSavingOwnership(false);
    setSelectedFlowerIds([]);
    setSelectedExistingMemberId("none");
    setNewMemberName("");
    setUpdateMessage(`Đã cập nhật ${optimisticRows.length} loại hoa mới cho ${member.name}.`);

    await logAction({
      actionType: "update_ownership",
      actorName: user?.email || member.name,
      targetType: "member",
      targetName: member.name,
      details: `Thêm ${optimisticRows.length} hoa: ${uniqueSelectedFlowerIds
        .map((id) => flowers.find((f) => String(f.id) === String(id))?.name || id)
        .join(", ")}`,
    });

    await loadAllData();
  }

  async function renameMember(memberId, newName) {
    if (!isAdmin) {
      return { ok: false, message: "Bạn không có quyền thực hiện thao tác này." };
    }

    const trimmed = newName.trim();
    if (!trimmed) {
      return { ok: false, message: "Tên thành viên không được để trống." };
    }

    const duplicated = members.some(
      (m) => String(m.id) !== String(memberId) && m.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicated) {
      return { ok: false, message: "Tên thành viên đã tồn tại." };
    }

    const oldName = members.find((m) => String(m.id) === String(memberId))?.name || "(không rõ)";
    const { error } = await supabase.from("members").update({ name: trimmed }).eq("id", memberId);
    if (error) {
      return { ok: false, message: `Không sửa được tên thành viên: ${error.message}` };
    }

    await logAction({
      actionType: "rename_member",
      actorName: user?.email || "Quản trị hội",
      targetType: "member",
      targetName: trimmed,
      details: `Đổi tên thành viên từ ${oldName} thành ${trimmed}`,
    });

    await loadAllData();
    return { ok: true, message: "Đã cập nhật tên thành viên." };
  }

  async function renameFlower(flowerId, payload) {
    if (!isAdmin) {
      return { ok: false, message: "Bạn không có quyền thực hiện thao tác này." };
    }

    const trimmedName = payload.name.trim();
    const nextIconUrl = payload.iconUrl.trim();
    const currentFlower = flowers.find((f) => String(f.id) === String(flowerId));

    if (!trimmedName) {
      return { ok: false, message: "Tên hoa không được để trống." };
    }

    const duplicated = flowers.some(
      (f) => String(f.id) !== String(flowerId) && f.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicated) {
      return { ok: false, message: "Tên hoa đã tồn tại." };
    }

    if (currentFlower?.iconUrl && !nextIconUrl) {
      await deleteFlowerIconByUrl(currentFlower.iconUrl);
    }

    const { error } = await supabase
      .from("flowers")
      .update({ name: trimmedName, icon_url: nextIconUrl || null })
      .eq("id", flowerId);

    if (error) {
      return { ok: false, message: `Không sửa được hoa: ${error.message}` };
    }

    await logAction({
      actionType: "edit_flower",
      actorName: user?.email || "Quản trị hội",
      targetType: "flower",
      targetName: trimmedName,
      details: `Cập nhật thông tin hoa ${currentFlower?.name || ""}`,
    });

    await loadAllData();
    return { ok: true, message: "Đã cập nhật thông tin hoa." };
  }

  return (
    <>
      {realtimeToast.visible ? (
        <div className="fixed right-4 top-4 z-50 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-slate-100 p-2">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900">{realtimeToast.title}</p>
              <p className="mt-1 text-sm text-slate-600">{realtimeToast.description}</p>
            </div>
            <button
              type="button"
              className="text-sm text-slate-400 transition hover:text-slate-700"
              onClick={() => setRealtimeToast((prev) => ({ ...prev, visible: false }))}
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}

      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight">Quản Lý Hoa Hội SELINA</h1>
                <p className="mt-2 text-sm text-slate-600">
                  Thành viên chỉ có thể tra cứu thông tin. Các chức năng quản trị chỉ hiển thị cho admin đã đăng nhập.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs shadow-sm">
                    <CircleProgress percent={summary.completionRate} size="sm" />
                    <span className="font-medium text-slate-800">
                      {summary.ownedFlowers}/{summary.totalFlowers} ({summary.completionRate}%)
                    </span>
                  </div>

                  {topMembers.map((member, index) => (
                    <div
                      key={member.id}
                      className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs shadow-sm"
                    >
                      <Trophy
                        className={`h-3.5 w-3.5 ${
                          index === 0 ? "text-amber-500" : index === 1 ? "text-slate-400" : "text-orange-400"
                        }`}
                      />
                      <span className="font-medium text-slate-800">
                        Top {index + 1}: {member.name} ({member.ownedCount})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full rounded-2xl xl:w-auto">
                    <Shield className="mr-2 h-4 w-4" />
                    {isAdmin ? "Quản trị viên" : "Đăng nhập admin"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {isAdmin ? "Tài khoản quản trị" : "Đăng nhập quản trị"}
                    </DialogTitle>
                  </DialogHeader>

                  {isAdmin ? (
                    <div className="space-y-3">
                      <div className="rounded-2xl border bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin</p>
                        <p className="mt-1 break-all text-sm text-slate-700">{user?.email}</p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full rounded-2xl"
                        onClick={async () => {
                          await signOutAdmin();
                          setAdminDialogOpen(false);
                        }}
                        disabled={loggingOut}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm text-slate-600">Email admin</Label>
                        <Input
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="admin@example.com"
                          className="h-10 rounded-2xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-slate-600">Mật khẩu</Label>
                        <Input
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="h-10 rounded-2xl"
                        />
                      </div>
                      <Button onClick={signInAsAdmin} className="h-10 w-full rounded-2xl" disabled={loggingIn}>
                        <LogIn className="mr-2 h-4 w-4" />
                        {loggingIn ? "Đang đăng nhập..." : "Đăng nhập admin"}
                      </Button>
                      {loginMessage ? (
                        <div className="rounded-2xl border bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          {loginMessage}
                        </div>
                      ) : null}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            {pageMessage ? (
              <div className="mt-4 rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{pageMessage}</div>
            ) : null}
            {realtimeMessage ? (
              <div className="mt-4 rounded-2xl border bg-red-50 p-3 text-sm text-red-700">{realtimeMessage}</div>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={<Users className="h-5 w-5" />} title="Thành viên" value={summary.totalMembers} />
            <StatCard icon={<Flower2 className="h-5 w-5" />} title="Tổng loại hoa" value={summary.totalFlowers} />
            <StatCard icon={<Database className="h-5 w-5" />} title="Hội đã sở hữu" value={summary.ownedFlowers} />
            <StatCard icon={<AlertCircle className="h-5 w-5" />} title="Hội còn thiếu" value={summary.missingFlowers} />
          </div>

          <Tabs defaultValue="dashboard" className="space-y-4">
            <TabsList
              className={`grid w-full min-w-max gap-2 overflow-x-auto md:min-w-0 ${
                isAdmin ? "grid-cols-6" : "grid-cols-3"
              }`}
            >
              <TabsTrigger value="dashboard">Tổng quan</TabsTrigger>
              <TabsTrigger value="members">Thành viên</TabsTrigger>
              <TabsTrigger value="flowers">Hoa</TabsTrigger>
              {isAdmin ? <TabsTrigger value="update">Cập nhật sở hữu</TabsTrigger> : null}
              {isAdmin ? <TabsTrigger value="addflower">Thêm hoa mới</TabsTrigger> : null}
              {isAdmin ? <TabsTrigger value="history">Lịch sử</TabsTrigger> : null}
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4">
              <Card className="rounded-3xl border-0 shadow-sm">
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <CardTitle>Hoa hội còn thiếu</CardTitle>
                  <div className="w-full md:w-56">
                    <Select value={dashboardGroupFilter} onValueChange={setDashboardGroupFilter}>
                      <SelectTrigger className="rounded-2xl">
                        <SelectValue placeholder="Lọc theo nhóm" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả nhóm</SelectItem>
                        {FLOWER_GROUPS.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-sm text-slate-600">Đang tải dữ liệu...</p>
                  ) : filteredMissingFlowers.length === 0 ? (
                    <p className="text-sm text-slate-600">Hiện không có hoa thiếu trong nhóm đang lọc.</p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {filteredMissingFlowers.map((flower) => (
                        <div key={flower.id} className="rounded-2xl border bg-slate-50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-3">
                                <FlowerThumbnail flower={flower} />
                                <p className="font-semibold">{flowerLabel(flower)}</p>
                              </div>
                              <p className="mt-1 text-sm text-slate-600">Chưa có ai trong hội sở hữu</p>
                            </div>
                            <Badge variant="outline" className={groupBadgeClass(flower.group)}>
                              {flower.group}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Hoa ít người sở hữu (1 - 3 người)</CardTitle>
                </CardHeader>
                <CardContent>
                  {rareFlowers.length === 0 ? (
                    <p className="text-sm text-slate-600">Không có hoa nào thuộc nhóm này.</p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {rareFlowers.map((flower) => {
                        const owners = ownersByFlower.get(String(flower.id)) || [];
                        return (
                          <div key={flower.id} className="rounded-2xl border bg-slate-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-3">
                                  <FlowerThumbnail flower={flower} />
                                  <p className="font-semibold">{flowerLabel(flower)}</p>
                                </div>
                                <p className="mt-1 text-sm text-slate-600">{owners.length} người sở hữu</p>
                                {owners.length > 0 ? (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {owners.map((owner) => (
                                      <Badge key={`${flower.id}-${owner}`} variant="outline" className="rounded-full text-xs">
                                        {owner}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                              <Badge variant="outline" className={groupBadgeClass(flower.group)}>
                                {flower.group}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members" className="space-y-4">
              <Card className="rounded-3xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Tra cứu theo thành viên</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Tìm theo tên thành viên..."
                      className="rounded-2xl pl-9"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredMembers.map((member) => {
                      const ownedCount = memberFlowerCounts[String(member.id)] || 0;
                      const memberProgress = memberProgressMap[String(member.id)] || {
                        ownedCount: 0,
                        total: flowers.length || 0,
                        percent: 0,
                      };

                      return (
                        <Card key={member.id} className="rounded-3xl shadow-sm">
                          <CardHeader>
                            <div className="flex items-center justify-between gap-3">
                              <CardTitle className="text-xl">{member.name}</CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{ownedCount} hoa</Badge>
                                {isAdmin ? (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="rounded-2xl">
                                        Sửa tên
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-3xl">
                                      <DialogHeader>
                                        <DialogTitle>Sửa tên thành viên</DialogTitle>
                                      </DialogHeader>
                                      <EditMemberForm member={member} onSave={(newName) => renameMember(member.id, newName)} />
                                    </DialogContent>
                                  </Dialog>
                                ) : null}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm text-slate-600">
                              Thành viên này hiện đang sở hữu {ownedCount} loại hoa.
                            </p>
                            <div className="flex items-center gap-4">
                              <CircleProgress percent={memberProgress.percent} />
                              <div className="text-sm text-slate-600">
                                <p>Tiến độ sưu tập</p>
                                <p className="font-medium">
                                  {memberProgress.ownedCount}/{memberProgress.total} ({memberProgress.percent}%)
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="flowers" className="space-y-4">
              <Card className="rounded-3xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Tra cứu theo hoa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      value={flowerSearch}
                      onChange={(e) => setFlowerSearch(e.target.value)}
                      placeholder="Tìm theo tên hoa..."
                      className="rounded-2xl pl-9"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredFlowers.map((flower) => {
                      const owners = ownersByFlower.get(String(flower.id)) || [];
                      return (
                        <Card key={flower.id} className="rounded-3xl shadow-sm">
                          <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-3">
                                  <FlowerThumbnail flower={flower} />
                                  <CardTitle className="text-lg">{flowerLabel(flower)}</CardTitle>
                                </div>
                                <p className="mt-1 text-sm text-slate-600">Nhóm {flower.group}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{owners.length} người</Badge>
                                {isAdmin ? (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="rounded-2xl">
                                        Sửa tên
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-3xl">
                                      <DialogHeader>
                                        <DialogTitle>Sửa tên hoa</DialogTitle>
                                      </DialogHeader>
                                      <EditFlowerForm flower={flower} onSave={(payload) => renameFlower(flower.id, payload)} />
                                    </DialogContent>
                                  </Dialog>
                                ) : null}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {owners.length === 0 ? (
                              <p className="text-sm text-slate-600">Hiện chưa có ai sở hữu.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {owners.map((owner) => (
                                  <Badge key={`${flower.id}-${owner}`} variant="outline" className="rounded-full">
                                    {owner}
                                  </Badge>
                                ))}
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

            {isAdmin ? (
              <TabsContent value="update" className="space-y-4">
                <Card className="rounded-3xl border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Cập nhật hoa mới thành viên vừa sở hữu</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-6 xl:grid-cols-[360px_1fr]">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Chọn thành viên cũ</Label>
                        <Select
                          value={selectedExistingMemberId}
                          onValueChange={(value) => {
                            setSelectedExistingMemberId(value);
                            if (value !== "none") {
                              setNewMemberName("");
                            }
                          }}
                        >
                          <SelectTrigger className="rounded-2xl">
                            <SelectValue placeholder="Chọn tên thành viên" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-- Không chọn --</SelectItem>
                            {members.map((member) => (
                              <SelectItem key={member.id} value={String(member.id)}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Hoặc tạo thành viên mới</Label>
                        <Input
                          value={newMemberName}
                          onChange={(e) => {
                            setNewMemberName(e.target.value);
                            if (e.target.value.trim()) {
                              setSelectedExistingMemberId("none");
                            }
                          }}
                          placeholder="Nhập tên thành viên mới"
                          className="rounded-2xl"
                        />
                      </div>

                      <div className="space-y-3 rounded-2xl border bg-slate-50 p-4">
                        <Label>Lọc danh sách hoa để chọn</Label>
                        <Input
                          value={updateSearch}
                          onChange={(e) => setUpdateSearch(e.target.value)}
                          placeholder="Tìm tên hoa"
                          className="rounded-2xl"
                        />
                        <Select value={updateGroupFilter} onValueChange={setUpdateGroupFilter}>
                          <SelectTrigger className="rounded-2xl">
                            <SelectValue placeholder="Lọc theo nhóm" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả nhóm</SelectItem>
                            {FLOWER_GROUPS.map((group) => (
                              <SelectItem key={group} value={group}>
                                {group}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">Có thể chọn nhiều loại hoa cùng lúc.</p>
                      </div>

                      <Button onClick={saveOwnershipUpdate} className="w-full rounded-2xl" disabled={savingOwnership}>
                        {savingOwnership ? "Đang lưu..." : "Lưu cập nhật sở hữu"}
                      </Button>

                      {updateMessage ? (
                        <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">
                          {updateMessage}
                        </div>
                      ) : null}
                    </div>

                    <Card className="rounded-3xl shadow-sm">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-3">
                          <CardTitle>Chọn nhiều hoa</CardTitle>
                          <Badge variant="secondary">Đã chọn {selectedFlowerIds.length}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[420px] pr-4">
                          <div className="space-y-3">
                            {selectableFlowers.map((flower) => {
                              const checked = selectedFlowerIds.includes(String(flower.id));
                              return (
                                <label
                                  key={flower.id}
                                  className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition hover:bg-slate-50"
                                >
                                  <Checkbox checked={checked} onCheckedChange={() => toggleFlowerSelection(flower.id)} />
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <div className="flex items-center gap-3">
                                          <FlowerThumbnail flower={flower} size="sm" />
                                          <p className="font-medium">{flowerLabel(flower)}</p>
                                        </div>
                                        <p className="mt-1 text-sm text-slate-600">
                                          Hiện có {ownersByFlower.get(String(flower.id))?.length || 0} người sở hữu
                                        </p>
                                      </div>
                                      <Badge variant="outline" className={groupBadgeClass(flower.group)}>
                                        {flower.group}
                                      </Badge>
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </TabsContent>
            ) : null}

            {isAdmin ? (
              <TabsContent value="addflower" className="space-y-4">
                <Card className="rounded-3xl border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Thêm hoa mới vào cơ sở dữ liệu chung</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-6 xl:grid-cols-[420px_1fr]">
                    <div className="space-y-4 rounded-3xl border bg-slate-50 p-5">
                      <div className="space-y-2">
                        <Label>Tên hoa</Label>
                        <Input
                          value={newFlowerName}
                          onChange={(e) => setNewFlowerName(e.target.value)}
                          placeholder="Ví dụ: Huyền Tinh"
                          className="rounded-2xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Icon hoa (URL ảnh, không bắt buộc)</Label>
                        <Input
                          value={newFlowerIconUrl}
                          onChange={(e) => setNewFlowerIconUrl(e.target.value)}
                          placeholder="Ví dụ: https://.../icon.png"
                          className="rounded-2xl"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            className="rounded-2xl"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setNewFlowerUploadMessage("Đang upload ảnh...");
                              const result = await uploadFlowerIcon(file);
                              if (result.error) {
                                setNewFlowerUploadMessage(result.error);
                              } else {
                                setNewFlowerIconUrl(result.url);
                                setNewFlowerUploadMessage("Đã upload ảnh và gắn vào icon hoa.");
                              }
                              e.target.value = "";
                            }}
                          />
                          {newFlowerIconUrl ? (
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-2xl"
                              onClick={async () => {
                                await deleteFlowerIconByUrl(newFlowerIconUrl);
                                setNewFlowerIconUrl("");
                                setNewFlowerUploadMessage("Đã xoá icon hiện tại khỏi form.");
                              }}
                            >
                              Xoá icon
                            </Button>
                          ) : null}
                        </div>
                        {newFlowerUploadMessage ? (
                          <p className="text-xs text-slate-500">{newFlowerUploadMessage}</p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Label>Nhóm hoa</Label>
                        <Select value={newFlowerGroup} onValueChange={setNewFlowerGroup}>
                          <SelectTrigger className="rounded-2xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FLOWER_GROUPS.map((group) => (
                              <SelectItem key={group} value={group}>
                                {group}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={addFlowerToDatabase} className="w-full rounded-2xl" disabled={savingFlower}>
                        <Plus className="mr-2 h-4 w-4" />
                        {savingFlower ? "Đang thêm..." : "Thêm hoa mới"}
                      </Button>
                      {flowerCreateMessage ? (
                        <div className="rounded-2xl border bg-white p-3 text-sm text-slate-700">
                          {flowerCreateMessage}
                        </div>
                      ) : null}
                    </div>

                    <Card className="rounded-3xl shadow-sm">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-3">
                          <CardTitle>Danh sách hoa hiện có</CardTitle>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="rounded-2xl">
                                Xem nhanh theo nhóm
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl rounded-3xl">
                              <DialogHeader>
                                <DialogTitle>Phân loại hoa theo nhóm</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 md:grid-cols-2">
                                {FLOWER_GROUPS.map((group) => (
                                  <div key={group} className="rounded-2xl border p-4">
                                    <p className="font-semibold">{group}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {flowers
                                        .filter((f) => f.group === group)
                                        .map((f) => (
                                          <Badge key={f.id} variant="secondary">
                                            {flowerLabel(f)}
                                          </Badge>
                                        ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3 md:grid-cols-2">
                          {flowers.map((flower) => (
                            <div key={flower.id} className="rounded-2xl border p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-3">
                                    <FlowerThumbnail flower={flower} />
                                    <p className="font-medium">{flowerLabel(flower)}</p>
                                  </div>
                                  <p className="mt-1 text-sm text-slate-600">
                                    {ownersByFlower.get(String(flower.id))?.length || 0} người đang sở hữu
                                  </p>
                                </div>
                                <Badge variant="outline" className={groupBadgeClass(flower.group)}>
                                  {flower.group}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </TabsContent>
            ) : null}

            {isAdmin ? (
              <TabsContent value="history" className="space-y-4">
                <Card className="rounded-3xl border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Bảng lịch sử thao tác</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <p className="text-sm text-slate-600">Đang tải lịch sử...</p>
                    ) : historyLogs.length === 0 ? (
                      <p className="text-sm text-slate-600">Chưa có lịch sử thao tác.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border">
                        <table className="min-w-full text-sm">
                          <thead className="bg-slate-50 text-left text-slate-600">
                            <tr>
                              <th className="px-4 py-3 font-medium">Thời gian</th>
                              <th className="px-4 py-3 font-medium">Người thao tác</th>
                              <th className="px-4 py-3 font-medium">Hành động</th>
                              <th className="px-4 py-3 font-medium">Đối tượng</th>
                              <th className="px-4 py-3 font-medium">Chi tiết</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historyLogs.map((log) => (
                              <tr key={log.id} className="border-t align-top">
                                <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                                  {log.createdAt ? new Date(log.createdAt).toLocaleString("vi-VN") : "-"}
                                </td>
                                <td className="px-4 py-3 font-medium">{log.actorName || "-"}</td>
                                <td className="px-4 py-3">
                                  <Badge variant="outline" className="rounded-full">
                                    {log.actionType || "-"}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-medium">{log.targetName || "-"}</div>
                                  <div className="text-xs text-slate-500">{log.targetType || "-"}</div>
                                </td>
                                <td className="px-4 py-3 text-slate-600">{log.details || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ) : null}
          </Tabs>
        </div>
      </div>
    </>
  );
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

  if (flower.iconUrl) {
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
  const wrapperClass = size === "sm" ? "h-12 w-12" : "h-16 w-16";
  const textClass = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <div className={`relative ${wrapperClass}`}>
      <svg viewBox={`0 0 ${radius * 2} ${radius * 2}`} className="h-full w-full">
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
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
    <Card className="rounded-3xl border-0 shadow-sm">
      <CardContent className="flex items-center gap-4 p-6">
        <div className="rounded-2xl bg-slate-100 p-3">{icon}</div>
        <div>
          <p className="text-sm text-slate-600">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
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
        <Input
          value={iconUrl}
          onChange={(e) => setIconUrl(e.target.value)}
          className="rounded-2xl"
          placeholder="https://.../icon.png"
        />
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
            if (result.error) {
              setMessage(result.error);
            } else {
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
            if (iconUrl) {
              await deleteFlowerIconByUrl(iconUrl);
            }
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
