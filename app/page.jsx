"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tewaxvsxbktcexduvfjv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRld2F4dnN4Ymt0Y2V4ZHV2Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTIxMjksImV4cCI6MjA5MTcyODEyOX0.0VpLpXpR_gGk7p5RiCEL0bK4_EnhAUoqhLpieTL-4zI"; // thay bằng anon key hiện tại của bạn
const ADMIN_EMAILS = ["lehuuhung133132@gmail.com"];
const FLOWER_GROUPS = ["Lục", "Lam", "Tím", "Vàng", "Đỏ"];
const FLOWER_ICON_BUCKET = "flower-icons";

// màu theo nhóm hoa
const GROUP_STYLES = {
  "Lục": { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
  "Lam": { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  "Tím": { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
  "Vàng": { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  "Đỏ": { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
};

function getGroupStyle(group) {
  return GROUP_STYLES[group] || { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" };
}
const SUPABASE_STORAGE_KEY_PREFIX = "sb-";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

function normalizeText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
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
          message:
            "Phiên đăng nhập cũ đã hết hạn và đã được làm sạch. Bạn có thể đăng nhập lại nếu cần quyền quản trị.",
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

async function uploadFlowerIcon(file) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `icons/${fileName}`;

  const { error: uploadError } = await supabase.storage.from(FLOWER_ICON_BUCKET).upload(filePath, file, {
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

function Stat({ label, value }) {
  return (
    <div
      style={{
        border: "1px solid #d7dce6",
        borderRadius: 28,
        padding: 24,
        background: "rgba(255,255,255,0.72)",
        minHeight: 138,
        boxShadow: "0 20px 40px -28px rgba(15,23,42,0.28)",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 42,
                      height: 42,
          borderRadius: 18,
          border: "1px solid #d9dee8",
          background: "linear-gradient(180deg,#f9fafb,#eef2f7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          color: "#334155",
          flexShrink: 0,
        }}
      >
        ◉
      </div>
      <div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 10 }}>{label}</div>
        <div style={{ fontSize: 40, lineHeight: 1, fontWeight: 700, color: "#0f172a" }}>{value}</div>
      </div>
    </div>
  );
}

function Section({ title, children, right }) {
  return (
    <section
      style={{
        border: "1px solid #d7dce6",
        borderRadius: 28,
        padding: 16,
        background: "rgba(255,255,255,0.74)",
        boxShadow: "0 20px 40px -30px rgba(15,23,42,0.24)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, color: "#0f172a", fontWeight: 700 }}>{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "12px 14px",
        border: "1px solid #d5dae3",
        borderRadius: 16,
        background: "rgba(255,255,255,0.92)",
        color: "#0f172a",
        outline: "none",
        boxSizing: "border-box",
        ...props.style,
      }}
    />
  );
}

function SelectInput({ children, ...props }) {
  return (
    <select
      {...props}
      style={{
        width: "100%",
        padding: "12px 14px",
        border: "1px solid #d5dae3",
        borderRadius: 16,
        background: "rgba(255,255,255,0.92)",
        color: "#0f172a",
        outline: "none",
        boxSizing: "border-box",
        ...props.style,
      }}
    >
      {children}
    </select>
  );
}

function Button({ children, ...props }) {
  return (
    <button
      {...props}
      style={{
        padding: "11px 16px",
        border: "1px solid #0f172a",
        borderRadius: 16,
        background: props.disabled ? "#cbd5e1" : "#0f172a",
        color: props.disabled ? "#64748b" : "#fff",
        cursor: props.disabled ? "not-allowed" : "pointer",
        fontWeight: 600,
        boxShadow: props.disabled ? "none" : "0 14px 24px -18px rgba(15,23,42,0.7)",
        ...props.style,
      }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      style={{
        padding: "11px 16px",
        border: "1px solid #d5dae3",
        borderRadius: 16,
        background: "rgba(255,255,255,0.94)",
        color: "#0f172a",
        cursor: props.disabled ? "not-allowed" : "pointer",
        fontWeight: 500,
        ...props.style,
      }}
    >
      {children}
    </button>
  );
}

function FlowerImage({ flower }) {
  if (!flower?.iconUrl) {
    return (
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 16,
          background: "linear-gradient(180deg,#f8fafc,#eef2f7)",
          border: "1px solid #d9dee8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          color: "#64748b",
          flexShrink: 0,
        }}
      >
        🦋
      </div>
    );
  }

  return (
    <img
      src={flower.iconUrl}
      alt={flower.name}
      style={{ width: 46, height: 46, objectFit: "cover", borderRadius: 16, border: "1px solid #d9dee8", flexShrink: 0 }}
    />
  );
}

export default function Page() {
  const [members, setMembers] = useState([]);
  const [flowers, setFlowers] = useState([]);
  const [ownerships, setOwnerships] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [ownershipsLoading, setOwnershipsLoading] = useState(true);
  const [ownershipsLoaded, setOwnershipsLoaded] = useState(false);
  const [pageMessage, setPageMessage] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  const [user, setUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const [memberSearch, setMemberSearch] = useState("");
  const [flowerSearch, setFlowerSearch] = useState("");
  const [selectedMemberIdForLookup, setSelectedMemberIdForLookup] = useState("all");
  const [missingGroupFilter, setMissingGroupFilter] = useState("all");
  const [rareGroupFilter, setRareGroupFilter] = useState("all");

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
  const [uploadingFlowerIcon, setUploadingFlowerIcon] = useState(false);

  const [renameMemberId, setRenameMemberId] = useState("");
  const [renameMemberValue, setRenameMemberValue] = useState("");
  const [renameFlowerId, setRenameFlowerId] = useState("");
  const [renameFlowerName, setRenameFlowerName] = useState("");
  const [renameFlowerIconUrl, setRenameFlowerIconUrl] = useState("");

  const [realtimeStatus, setRealtimeStatus] = useState("connecting");
  const [realtimeToast, setRealtimeToast] = useState("");

  const membersRef = useRef([]);
  const flowersRef = useRef([]);
  const toastTimerRef = useRef(null);

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

  const showToast = useCallback((_message) => {
    // disabled realtime toast
  }, []);

  const loadOwnershipData = useCallback(async () => {
    setOwnershipsLoading(true);
    try {
      const ownershipsRes = await fetchAllOwnershipRows();
      if (ownershipsRes.error) throw new Error(ownershipsRes.error.message);

      const dedupedMap = new Map();
      (ownershipsRes.data || []).forEach((row) => {
        const key = `${String(row.member_id)}-${String(row.flower_id)}`;
        if (!dedupedMap.has(key)) dedupedMap.set(key, row);
      });

      setOwnerships(Array.from(dedupedMap.values()).map(normalizeOwnershipRow));
      setOwnershipsLoaded(true);
    } catch (error) {
      setOwnershipsLoaded(false);
      setPageMessage((prev) => prev || `Không tải được dữ liệu sở hữu: ${error?.message || "Lỗi không xác định"}`);
    } finally {
      setOwnershipsLoading(false);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setPageMessage("");

    try {
      const [membersRes, flowersRes, historyRes] = await Promise.all([
        supabase.from("members").select("id, name, created_at").order("name", { ascending: true }),
        supabase
          .from("flowers")
          .select("id, name, group_name, icon_url, created_at")
          .order("name", { ascending: true }),
        supabase
          .from("action_logs")
          .select("id, action_type, actor_name, target_type, target_name, details, created_at")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (membersRes.error || flowersRes.error || historyRes.error) {
        throw new Error(
          membersRes.error?.message || flowersRes.error?.message || historyRes.error?.message || "Không tải được dữ liệu"
        );
      }

      setMembers((membersRes.data || []).map((m) => ({ id: String(m.id), name: m.name })));
      setFlowers(
        (flowersRes.data || []).map((f) => ({
          id: String(f.id),
          name: f.name,
          group: f.group_name,
          iconUrl: f.icon_url || "",
        }))
      );
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
      setPageMessage(`Không tải được dữ liệu: ${error?.message || "Lỗi không xác định"}`);
    } finally {
      setLoading(false);
    }

    await loadOwnershipData();
  }, [loadOwnershipData]);

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

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    let reloadTimer;

    const channel = supabase.channel(`realtime-${Date.now()}`);

    const refreshFromRealtime = (payload) => {
      const eventType = payload?.eventType;
      const table = payload?.table;

      if (eventType === "INSERT" && table === "members") {
        showToast(`Thành viên mới: ${payload?.new?.name || "(không rõ)"}`);
      }
      if (eventType === "INSERT" && table === "member_flowers") {
        const memberId = String(payload?.new?.member_id || "");
        const flowerId = String(payload?.new?.flower_id || "");
        const memberName = membersRef.current.find((m) => String(m.id) === memberId)?.name || "Một thành viên";
        const flowerName = flowersRef.current.find((f) => String(f.id) === flowerId)?.name || "một loài hoa";
        showToast(`${memberName} đã thêm hoa ${flowerName}`);
      }

      window.clearTimeout(reloadTimer);
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
        const normalized = String(status || "unknown").toLowerCase();
        setRealtimeStatus(normalized);
      });

    return () => {
      window.clearTimeout(reloadTimer);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [loadAllData, showToast]);

  const logAction = useCallback(async ({ actionType, actorName = "Hệ thống", targetType, targetName, details = "" }) => {
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
  }, []);

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
      setShowLoginPopup(false);
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

  async function getOrCreateMember() {
    const trimmedNewMemberName = normalizeText(newMemberName);
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

    const normalizedNewName = trimmedNewMemberName.toLowerCase();
    const existing = members.find((m) => normalizeText(m.name).toLowerCase() === normalizedNewName);
    if (existing) return { member: existing };

    const { data, error } = await supabase.from("members").insert([{ name: trimmedNewMemberName }]).select("id, name").single();

    if (error) return { error: `Không tạo được thành viên mới: ${error.message}` };

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
      ownerships.filter((o) => String(o.memberId) === String(member.id)).map((o) => String(o.flowerId))
    );
    const uniqueSelectedFlowerIds = [...new Set(selectedFlowerIds.map(String))];
    const additions = uniqueSelectedFlowerIds.map((flowerId) => ({ member_id: String(member.id), flower_id: String(flowerId) }));

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
      const rowsToAdd = optimisticRows.filter((row) => !existingKeys.has(`${String(row.memberId)}-${String(row.flowerId)}`));
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

  async function addFlowerToDatabase() {
    if (!isAdmin) return;
    setFlowerCreateMessage("");

    const name = normalizeText(newFlowerName);
    if (!name || !newFlowerGroup) {
      setFlowerCreateMessage("Vui lòng nhập đủ tên hoa và nhóm hoa.");
      return;
    }

    const exists = flowers.some((f) => normalizeText(f.name).toLowerCase() === name.toLowerCase());
    if (exists) {
      setFlowerCreateMessage("Loại hoa này đã tồn tại trong cơ sở dữ liệu.");
      return;
    }

    setSavingFlower(true);
    const { data, error } = await supabase
      .from("flowers")
      .insert([{ name, group_name: newFlowerGroup, icon_url: normalizeText(newFlowerIconUrl) || null }])
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
    setNewFlowerGroup("Lục");
    setFlowerCreateMessage(`Đã thêm hoa mới: ${data.name}.`);
  }

  async function handleFlowerIconUpload(file) {
    if (!file) return;
    setUploadingFlowerIcon(true);
    const result = await uploadFlowerIcon(file);
    setUploadingFlowerIcon(false);

    if (result.error) {
      setFlowerCreateMessage(result.error);
      return;
    }

    setNewFlowerIconUrl(result.url || "");
    setFlowerCreateMessage("Upload ảnh thành công.");
  }

  async function renameMember() {
    if (!isAdmin || !renameMemberId) return;
    const trimmed = normalizeText(renameMemberValue);
    if (!trimmed) {
      setPageMessage("Tên thành viên không được để trống.");
      return;
    }

    const duplicated = members.some(
      (m) => String(m.id) !== String(renameMemberId) && normalizeText(m.name).toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicated) {
      setPageMessage("Tên thành viên đã tồn tại.");
      return;
    }

    const oldName = members.find((m) => String(m.id) === String(renameMemberId))?.name || "(không rõ)";
    const { error } = await supabase.from("members").update({ name: trimmed }).eq("id", renameMemberId);
    if (error) {
      setPageMessage(`Không sửa được tên thành viên: ${error.message}`);
      return;
    }

    await logAction({
      actionType: "rename_member",
      actorName: user?.email || "Quản trị hội",
      targetType: "member",
      targetName: trimmed,
      details: `Đổi tên thành viên từ ${oldName} thành ${trimmed}`,
    });

    setRenameMemberId("");
    setRenameMemberValue("");
    await loadAllData();
  }

  async function renameFlower() {
    if (!isAdmin || !renameFlowerId) return;
    const trimmedName = normalizeText(renameFlowerName);
    const nextIconUrl = normalizeText(renameFlowerIconUrl);
    const currentFlower = flowers.find((f) => String(f.id) === String(renameFlowerId));

    if (!trimmedName) {
      setPageMessage("Tên hoa không được để trống.");
      return;
    }

    const duplicated = flowers.some(
      (f) => String(f.id) !== String(renameFlowerId) && normalizeText(f.name).toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicated) {
      setPageMessage("Tên hoa đã tồn tại.");
      return;
    }

    if (currentFlower?.iconUrl && !nextIconUrl) {
      await deleteFlowerIconByUrl(currentFlower.iconUrl);
    }

    const { error } = await supabase
      .from("flowers")
      .update({ name: trimmedName, icon_url: nextIconUrl || null })
      .eq("id", renameFlowerId);

    if (error) {
      setPageMessage(`Không sửa được hoa: ${error.message}`);
      return;
    }

    await logAction({
      actionType: "edit_flower",
      actorName: user?.email || "Quản trị hội",
      targetType: "flower",
      targetName: trimmedName,
      details: `Cập nhật thông tin hoa ${currentFlower?.name || ""}`,
    });

    setRenameFlowerId("");
    setRenameFlowerName("");
    setRenameFlowerIconUrl("");
    await loadAllData();
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
      if (!currentOwners.includes(member.name)) currentOwners.push(member.name);
      map.set(flowerKey, currentOwners);
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

  const ownedGroupStats = useMemo(() => {
    const ownedFlowerIds = new Set(ownerships.map((x) => String(x.flowerId)));
    const order = ["Đỏ", "Vàng", "Tím", "Lam", "Lục"];

    return order.map((group) => {
      const total = flowers.filter((flower) => flower.group === group).length;
      const owned = flowers.filter(
        (flower) => flower.group === group && ownedFlowerIds.has(String(flower.id))
      ).length;

      return { group, total, owned };
    });
  }, [flowers, ownerships]);

  const topMembers = useMemo(() => {
    return [...members]
      .map((member) => ({ ...member, ownedCount: memberFlowerCounts[String(member.id)] || 0 }))
      .sort((a, b) => (b.ownedCount || 0) - (a.ownedCount || 0))
      .slice(0, 5);
  }, [members, memberFlowerCounts]);

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
    return missingFlowers.filter((flower) => missingGroupFilter === "all" || flower.group === missingGroupFilter);
  }, [missingFlowers, missingGroupFilter]);

  const filteredRareFlowers = useMemo(() => {
    return rareFlowers.filter((flower) => rareGroupFilter === "all" || flower.group === rareGroupFilter);
  }, [rareFlowers, rareGroupFilter]);

  const filteredMembers = useMemo(() => {
    const q = normalizeText(memberSearch).toLowerCase();
    return [...members]
      .map((member) => ({ ...member, ownedCount: memberFlowerCounts[String(member.id)] || 0 }))
      .filter((member) => member.name.toLowerCase().includes(q))
      .sort((a, b) => (b.ownedCount || 0) - (a.ownedCount || 0));
  }, [members, memberSearch, memberFlowerCounts]);

  const filteredFlowers = useMemo(() => {
    const q = normalizeText(flowerSearch).toLowerCase();
    return flowers.filter((flower) => flower.name.toLowerCase().includes(q));
  }, [flowers, flowerSearch]);

  const selectedLookupMember = useMemo(() => {
    return members.find((member) => String(member.id) === String(selectedMemberIdForLookup)) || null;
  }, [members, selectedMemberIdForLookup]);

  const flowersBySelectedMember = useMemo(() => {
    if (!selectedLookupMember) return [];
    const ownedFlowerIds = new Set(
      ownerships
        .filter((row) => String(row.memberId) === String(selectedLookupMember.id))
        .map((row) => String(row.flowerId))
    );
    return flowers.filter((flower) => ownedFlowerIds.has(String(flower.id)));
  }, [flowers, ownerships, selectedLookupMember]);

  const memberFlowersByGroup = useMemo(() => {
    const grouped = { Đỏ: [], Vàng: [], Tím: [], Lam: [], Lục: [] };
    flowersBySelectedMember.forEach((flower) => {
      if (!grouped[flower.group]) grouped[flower.group] = [];
      grouped[flower.group].push(flower);
    });
    Object.keys(grouped).forEach((group) => {
      grouped[group] = grouped[group].sort((a, b) => a.name.localeCompare(b.name, "vi"));
    });
    return grouped;
  }, [flowersBySelectedMember]);

  const selectableFlowers = useMemo(() => {
    const q = normalizeText(updateSearch).toLowerCase();
    return flowers.filter((flower) => {
      const textOk = flower.name.toLowerCase().includes(q);
      const groupOk = updateGroupFilter === "all" || flower.group === updateGroupFilter;
      return textOk && groupOk;
    });
  }, [flowers, updateSearch, updateGroupFilter]);

  function toggleFlowerSelection(flowerId) {
    setSelectedFlowerIds((prev) => {
      const key = String(flowerId);
      return prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key];
    });
  }

  const tabs = [
    ["dashboard", "Tổng quan"],
    ["members", "Thành viên"],
    ["flowers", "Tra cứu theo hoa"],
    ["memberFlowers", "Tra cứu theo thành viên"],
    ...(isAdmin ? [["update", "Cập nhật sở hữu"], ["addFlower", "Thêm hoa"], ["rename", "Sửa tên"], ["history", "Lịch sử"]] : []),
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(148,163,184,0.16), transparent 28%), linear-gradient(180deg, #f4f6fb 0%, #eef2f7 100%)",
        padding: 20,
        color: "#111",
        position: "relative",
      }}
    >
      <div style={{ position: "fixed", top: 28, right: 28, zIndex: 30, display: "flex", gap: 8, alignItems: "center" }}>
        {isAdmin ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#fff", border: "1px solid #ddd", borderRadius: 999, padding: "8px 10px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
            <span style={{ fontSize: 12, color: "#444", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email}
            </span>
            <SecondaryButton onClick={signOutAdmin} disabled={loggingOut} style={{ padding: "6px 10px", borderRadius: 999 }}>
              {loggingOut ? "Đang thoát..." : "Đăng xuất"}
            </SecondaryButton>
          </div>
        ) : (
          <SecondaryButton onClick={() => setShowLoginPopup(true)} style={{ borderRadius: 999, boxShadow: "0 10px 24px -18px rgba(15,23,42,0.4)", padding: "10px 16px" }}>
            🛡️&nbsp; Đăng nhập admin
          </SecondaryButton>
        )}
      </div>

      {showLoginPopup && !isAdmin ? (
        <div
          onClick={() => setShowLoginPopup(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 40,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 420,
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #ddd",
              boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
              padding: 18,
              display: "grid",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Đăng nhập quản trị</h3>
              <button
                type="button"
                onClick={() => setShowLoginPopup(false)}
                style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer", lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <TextInput value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="Email admin" />
            <TextInput type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Mật khẩu" />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <SecondaryButton onClick={() => setShowLoginPopup(false)}>Đóng</SecondaryButton>
              <Button onClick={signInAsAdmin} disabled={loggingIn}>{loggingIn ? "Đang đăng nhập..." : "Đăng nhập"}</Button>
            </div>
            {loginMessage ? <div style={{ fontSize: 14, color: "#555" }}>{loginMessage}</div> : null}
          </div>
        </div>
      ) : null}
      <div style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gap: 22 }}>
        <section
          style={{
            border: "1px solid #d7dce6",
            borderRadius: 32,
            padding: 24,
            background: "rgba(255,255,255,0.66)",
            boxShadow: "0 30px 70px -40px rgba(15,23,42,0.28)",
            backdropFilter: "blur(14px)",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  border: "1px solid #d7dce6",
                  borderRadius: 999,
                  padding: "8px 14px",
                  color: "#64748b",
                  background: "rgba(255,255,255,0.78)",
                  boxShadow: "0 10px 22px -18px rgba(15,23,42,0.45)",
                  fontSize: 12,
                  letterSpacing: "0.22em",
                  fontWeight: 700,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 999, background: "#10b981", display: "inline-block" }} />
                SELINA FLOWER DASHBOARD
              </div>
              <h1 style={{ margin: "18px 0 10px", fontSize: 56, lineHeight: 1.05, color: "#0f172a" }}>
                Quản Lý Hoa Hội SELINA
              </h1>
              <div style={{ color: "#475569", fontSize: 18, lineHeight: 1.6, maxWidth: 840 }}>
                Thành viên chỉ có thể tra cứu thông tin. Các chức năng quản trị chỉ hiển thị cho admin đã đăng nhập.
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "nowrap", marginTop: 20, alignItems: "center", overflow: "hidden" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    border: "1px solid #d7dce6",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.8)",
                    padding: "6px 10px",
                    boxShadow: "0 12px 24px -20px rgba(15,23,42,0.35)",
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 999,
                      border: "6px solid #0f172a",
                      borderTopColor: "#cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#0f172a",
                      flexShrink: 0,
                    }}
                  >
                    {summary.completionRate}%
                  </div>
                  <div style={{ fontSize: 14, color: "#334155" }}>
                    {ownershipsLoading || !ownershipsLoaded
                      ? "Đang đồng bộ..."
                      : `${summary.ownedFlowers}/${summary.totalFlowers} (${summary.completionRate}%)`}
                  </div>
                </div>

                {topMembers.slice(0, 3).map((member, index) => (
                  <div
                    key={member.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      border: "1px solid #d7dce6",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.8)",
                      padding: "4px 10px",
                      boxShadow: "0 10px 20px -18px rgba(15,23,42,0.35)",
                      fontSize: 12,
                      color: "#334155",
                    }}
                  >
                    <span style={{ color: "#f59e0b", fontSize: 15 }}>🏆</span>
                    <span>
                      Top {index + 1}: <strong>{member.name}</strong> ({member.ownedCount})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "flex-end", minWidth: 220 }}>
              <div
                style={{
                  width: 170,
                  border: "1px solid #d7dce6",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.78)",
                  boxShadow: "0 10px 22px -18px rgba(15,23,42,0.28)",
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10, fontWeight: 700, letterSpacing: "0.08em" }}>
                  HỘI ĐÃ SỞ HỮU THEO NHÓM
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {ownedGroupStats.map((item) => {
                    const s = getGroupStyle(item.group);
                    return (
                      <div
                        key={item.group}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          border: `1px solid ${s.border}`,
                          background: s.bg,
                          borderRadius: 14,
                          padding: "8px 10px",
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{item.group}</span>
                        <span style={{ fontSize: 13, color: "#334155", fontWeight: 600 }}>{item.owned}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 10 }}>
                  Realtime: {realtimeStatus}
                </div>
              </div>
            </div>
          </div>

          

          {pageMessage ? (
            <div style={{ marginTop: 16, padding: 12, borderRadius: 16, border: "1px solid #f5c2c7", background: "#fff1f2", color: "#9f1239" }}>
              {pageMessage}
            </div>
          ) : null}
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
          <Stat label="Thành viên" value={summary.totalMembers} />
          <Stat label="Tổng loại hoa" value={summary.totalFlowers} />
          <Stat label="Hội đã sở hữu" value={ownershipsLoading || !ownershipsLoaded ? "..." : summary.ownedFlowers} />
          <Stat label="Hội còn thiếu" value={ownershipsLoading || !ownershipsLoaded ? "..." : summary.missingFlowers} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
            gap: 8,
            alignItems: "stretch",
            overflowX: "hidden",
            border: "1px solid #d7dce6",
            borderRadius: 999,
            padding: 8,
            background: "rgba(255,255,255,0.68)",
            boxShadow: "0 16px 30px -24px rgba(15,23,42,0.28)",
          }}
        >
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                minWidth: 0,
                width: "100%",
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid transparent",
                background: activeTab === key ? "#0f172a" : "transparent",
                color: activeTab === key ? "#fff" : "#475569",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                transition: "all 0.2s ease",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <Section title="Đang tải dữ liệu">
            <div>Đang tải...</div>
          </Section>
        ) : null}

        {!loading && activeTab === "dashboard" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 16, alignItems: "start" }}>
            <Section
              title="Xếp hạng theo phân loại"
              right={<div style={{ fontSize: 12, color: "#666" }}>Theo nhóm</div>}
            >
              {(() => {
                // thứ tự hiển thị nhóm
                const ORDER = ["Đỏ", "Vàng", "Tím", "Lam", "Lục"];

                // đếm số hoa theo nhóm cho từng member
                const countsByMemberGroup = {}; // {memberId: {group: count}}
                ownerships.forEach((o) => {
                  const f = flowers.find((x) => String(x.id) === String(o.flowerId));
                  if (!f) return;
                  const mId = String(o.memberId);
                  if (!countsByMemberGroup[mId]) countsByMemberGroup[mId] = {};
                  countsByMemberGroup[mId][f.group] = (countsByMemberGroup[mId][f.group] || 0) + 1;
                });

                return (
                  <div style={{ display: "grid", gap: 12 }}>
                    {ORDER.map((group) => {
                      const s = getGroupStyle(group);

                      // tạo danh sách member + count theo group
                      const ranked = members
                        .map((m) => ({
                          member: m,
                          count: countsByMemberGroup[String(m.id)]?.[group] || 0,
                        }))
                        .filter((x) => x.count > 0)
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 3);

                      return (
                        <div key={group} style={{ padding: 14, border: `1px solid ${s.border}`, borderRadius: 16, background: s.bg }}>
                          <div style={{ fontWeight: 700, color: s.color, marginBottom: 8 }}>{group}</div>

                          {ranked.length === 0 ? (
                            <div style={{ fontSize: 13, color: "#64748b" }}>Chưa có dữ liệu</div>
                          ) : (
                            <div style={{ display: "grid", gap: 6 }}>
                              {ranked.map((item, idx) => (
                                <div key={item.member.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                                  <div>
                                    {idx + 1}. <strong>{item.member.name}</strong>
                                  </div>
                                  <div style={{ color: "#475569" }}>{item.count}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </Section>

            <Section
              title="Hoa ít người sở hữu (1-3)"
              right={
                <SelectInput value={rareGroupFilter} onChange={(e) => setRareGroupFilter(e.target.value)} style={{ width: 140 }}>
                  <option value="all">Tất cả nhóm</option>
                  {FLOWER_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
                </SelectInput>
              }
            >
              <div style={{ display: "grid", gap: 10, alignContent: "start", height: 760, overflowY: "auto", paddingRight: 6 }}>
                {filteredRareFlowers.length === 0 ? <div>Không có dữ liệu.</div> : filteredRareFlowers.map((flower) => (
                  <div key={flower.id} style={{ padding: 16, border: "1px solid #dde3ec", borderRadius: 24, background: "rgba(255,255,255,0.74)", boxShadow: "0 16px 28px -24px rgba(15,23,42,0.35)" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <FlowerImage flower={flower} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>{flower.name}</div>
                          <div style={{ fontSize: 14, color: "#64748b", marginTop: 8 }}>{(ownersByFlower.get(String(flower.id)) || []).length} người sở hữu</div>
                          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {(ownersByFlower.get(String(flower.id)) || []).map((ownerName) => (
                              <span
                                key={`${flower.id}-${ownerName}`}
                                style={{
                                  border: "1px solid #e2e8f0",
                                  borderRadius: 999,
                                  padding: "2px 8px",
                                  fontSize: 12,
                                  background: "#f8fafc",
                                  color: "#334155",
                                }}
                              >
                                {ownerName}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {(() => { const s = getGroupStyle(flower.group); return (
                      <div style={{ border: `1px solid ${s.border}`, color: s.color, background: s.bg, borderRadius: 999, padding: "2px 8px", fontSize: 12 }}>
                        {flower.group}
                      </div>
                    ); })()}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              title="Hoa hội còn thiếu"
              right={
                <SelectInput value={missingGroupFilter} onChange={(e) => setMissingGroupFilter(e.target.value)} style={{ width: 140 }}>
                  <option value="all">Tất cả nhóm</option>
                  {FLOWER_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
                </SelectInput>
              }
            >
              <div style={{ display: "grid", gap: 10, alignContent: "start", height: 760, overflowY: "auto", paddingRight: 6 }}>
                {filteredMissingFlowers.length === 0 ? <div>Không có hoa thiếu trong nhóm này.</div> : filteredMissingFlowers.map((flower) => (
                  <div key={flower.id} style={{ padding: 16, border: "1px solid #dde3ec", borderRadius: 24, background: "rgba(255,255,255,0.74)", boxShadow: "0 16px 28px -24px rgba(15,23,42,0.35)" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
                      <FlowerImage flower={flower} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{flower.name}</div>
                        <div style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>{flower.group}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        ) : null}

        {!loading && activeTab === "members" ? (
          <Section title="Tra cứu thành viên">
            <div style={{ display: "grid", gap: 12 }}>
              <TextInput value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Tìm tên thành viên" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                {filteredMembers.map((member) => (
                  <div key={member.id} style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
                    <div style={{ fontWeight: 700 }}>{member.name}</div>
                    <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>{member.ownedCount} hoa</div>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        ) : null}

        {!loading && activeTab === "flowers" ? (
          <Section title="Tra cứu thành viên theo hoa">
            <div style={{ display: "grid", gap: 12 }}>
              <TextInput value={flowerSearch} onChange={(e) => setFlowerSearch(e.target.value)} placeholder="Tìm tên hoa" />
              <div style={{ display: "grid", gap: 10, maxHeight: 720, overflow: "auto" }}>
                {filteredFlowers.map((flower) => {
                  const owners = ownersByFlower.get(String(flower.id)) || [];
                  return (
                    <div key={flower.id} style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                        <FlowerImage flower={flower} />
                        <div>
                          <div style={{ fontWeight: 700 }}>{flower.name}</div>
                          <div style={{ fontSize: 13, color: "#666" }}>{flower.group} · {owners.length} người</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {owners.length === 0 ? <span style={{ color: "#666" }}>Chưa có ai sở hữu</span> : owners.map((owner) => (
                          <span key={`${flower.id}-${owner}`} style={{ border: "1px solid #ddd", borderRadius: 999, padding: "2px 8px", fontSize: 12 }}>{owner}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Section>
        ) : null}

        {!loading && activeTab === "memberFlowers" ? (
          <Section title="Tra cứu hoa theo thành viên">
            <div style={{ display: "grid", gap: 12 }}>
              <SelectInput value={selectedMemberIdForLookup} onChange={(e) => setSelectedMemberIdForLookup(e.target.value)}>
                <option value="all">-- Chọn thành viên --</option>
                {members.map((member) => <option key={member.id} value={String(member.id)}>{member.name}</option>)}
              </SelectInput>

              {!selectedLookupMember ? (
                <div>Hãy chọn một thành viên.</div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 10 }}>
                    <div style={{ fontWeight: 700 }}>{selectedLookupMember.name}</div>
                    <div style={{ color: "#666", fontSize: 14 }}>{flowersBySelectedMember.length} hoa</div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                    {FLOWER_GROUPS.slice().reverse().map((group) => (
                      <div key={group} style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>{group} ({(memberFlowersByGroup[group] || []).length})</div>
                        <div style={{ display: "grid", gap: 8, maxHeight: 320, overflow: "auto" }}>
                          {(memberFlowersByGroup[group] || []).length === 0 ? (
                            <div style={{ color: "#666", fontSize: 14 }}>Chưa có hoa</div>
                          ) : (
                            (memberFlowersByGroup[group] || []).map((flower) => (
                              <div key={flower.id} style={{ display: "flex", gap: 8, alignItems: "center", border: "1px solid #f0f0f0", borderRadius: 10, padding: 8 }}>
                                <FlowerImage flower={flower} />
                                <div style={{ fontSize: 14 }}>{flower.name}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        ) : null}

        {!loading && isAdmin && activeTab === "update" ? (
          <Section title="Cập nhật sở hữu cho thành viên">
            <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 360px) 1fr", gap: 16 }}>
              <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
                <SelectInput
                  value={selectedExistingMemberId}
                  onChange={(e) => {
                    setSelectedExistingMemberId(e.target.value);
                    if (e.target.value !== "none") setNewMemberName("");
                  }}
                >
                  <option value="none">-- Chọn thành viên cũ --</option>
                  {members.map((member) => <option key={member.id} value={String(member.id)}>{member.name}</option>)}
                </SelectInput>
                <TextInput
                  value={newMemberName}
                  onChange={(e) => {
                    setNewMemberName(e.target.value);
                    if (normalizeText(e.target.value)) setSelectedExistingMemberId("none");
                  }}
                  placeholder="Hoặc nhập thành viên mới"
                />
                <TextInput value={updateSearch} onChange={(e) => setUpdateSearch(e.target.value)} placeholder="Tìm hoa" />
                <SelectInput value={updateGroupFilter} onChange={(e) => setUpdateGroupFilter(e.target.value)}>
                  <option value="all">Tất cả nhóm</option>
                  {FLOWER_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
                </SelectInput>
                <Button onClick={saveOwnershipUpdate} disabled={savingOwnership}>{savingOwnership ? "Đang lưu..." : "Lưu cập nhật"}</Button>
                {updateMessage ? <div style={{ color: "#555", fontSize: 14 }}>{updateMessage}</div> : null}
              </div>

              <div style={{ display: "grid", gap: 10, maxHeight: 720, overflow: "auto" }}>
                {selectableFlowers.map((flower) => {
                  const checked = selectedFlowerIds.includes(String(flower.id));
                  return (
                    <label key={flower.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 12, border: "1px solid #eee", borderRadius: 12, cursor: "pointer" }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleFlowerSelection(flower.id)} />
                      <FlowerImage flower={flower} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{flower.name}</div>
                        <div style={{ fontSize: 13, color: "#666" }}>{flower.group} · {(ownersByFlower.get(String(flower.id)) || []).length} người sở hữu</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </Section>
        ) : null}

        {!loading && isAdmin && activeTab === "addFlower" ? (
          <Section title="Thêm hoa mới">
            <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 420px) 1fr", gap: 16 }}>
              <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
                <TextInput value={newFlowerName} onChange={(e) => setNewFlowerName(e.target.value)} placeholder="Tên hoa" />
                <SelectInput value={newFlowerGroup} onChange={(e) => setNewFlowerGroup(e.target.value)}>
                  {FLOWER_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
                </SelectInput>
                <TextInput value={newFlowerIconUrl} onChange={(e) => setNewFlowerIconUrl(e.target.value)} placeholder="Icon URL (không bắt buộc)" />
                <input type="file" accept="image/*" onChange={(e) => handleFlowerIconUpload(e.target.files?.[0])} />
                <div style={{ fontSize: 13, color: "#666" }}>{uploadingFlowerIcon ? "Đang upload ảnh..." : "Có thể nhập URL hoặc upload ảnh."}</div>
                <Button onClick={addFlowerToDatabase} disabled={savingFlower}>{savingFlower ? "Đang thêm..." : "Thêm hoa mới"}</Button>
                {flowerCreateMessage ? <div style={{ color: "#555", fontSize: 14 }}>{flowerCreateMessage}</div> : null}
              </div>

              <div>
                {newFlowerIconUrl ? (
                  <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, display: "inline-block" }}>
                    <img src={newFlowerIconUrl} alt="preview" style={{ width: 160, height: 160, objectFit: "cover", borderRadius: 12 }} />
                  </div>
                ) : (
                  <div style={{ color: "#666" }}>Chưa có ảnh preview.</div>
                )}
              </div>
            </div>
          </Section>
        ) : null}

        {!loading && isAdmin && activeTab === "rename" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <Section title="Sửa tên thành viên">
              <div style={{ display: "grid", gap: 10 }}>
                <SelectInput
                  value={renameMemberId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setRenameMemberId(id);
                    const current = members.find((m) => String(m.id) === String(id));
                    setRenameMemberValue(current?.name || "");
                  }}
                >
                  <option value="">-- Chọn thành viên --</option>
                  {members.map((member) => <option key={member.id} value={String(member.id)}>{member.name}</option>)}
                </SelectInput>
                <TextInput value={renameMemberValue} onChange={(e) => setRenameMemberValue(e.target.value)} placeholder="Tên mới" />
                <Button onClick={renameMember} disabled={!renameMemberId}>Lưu tên thành viên</Button>
              </div>
            </Section>

            <Section title="Sửa tên hoa / icon hoa">
              <div style={{ display: "grid", gap: 10 }}>
                <SelectInput
                  value={renameFlowerId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setRenameFlowerId(id);
                    const current = flowers.find((f) => String(f.id) === String(id));
                    setRenameFlowerName(current?.name || "");
                    setRenameFlowerIconUrl(current?.iconUrl || "");
                  }}
                >
                  <option value="">-- Chọn hoa --</option>
                  {flowers.map((flower) => <option key={flower.id} value={String(flower.id)}>{flower.name}</option>)}
                </SelectInput>
                <TextInput value={renameFlowerName} onChange={(e) => setRenameFlowerName(e.target.value)} placeholder="Tên hoa mới" />
                <TextInput value={renameFlowerIconUrl} onChange={(e) => setRenameFlowerIconUrl(e.target.value)} placeholder="Icon URL mới (để trống để xoá)" />
                <Button onClick={renameFlower} disabled={!renameFlowerId}>Lưu thông tin hoa</Button>
              </div>
            </Section>
          </div>
        ) : null}

        {!loading && isAdmin && activeTab === "history" ? (
          <Section title="Lịch sử thao tác gần đây">
            <div style={{ display: "grid", gap: 10, maxHeight: 720, overflow: "auto" }}>
              {historyLogs.length === 0 ? <div>Chưa có lịch sử.</div> : historyLogs.map((log) => (
                <div key={log.id} style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
                  <div style={{ fontWeight: 700 }}>{log.actionType || "action"}</div>
                  <div style={{ fontSize: 14, color: "#444", marginTop: 4 }}>
                    {log.actorName} · {log.targetType} · {log.targetName}
                  </div>
                  {log.details ? <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{log.details}</div> : null}
                  {log.createdAt ? <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>{new Date(log.createdAt).toLocaleString("vi-VN")}</div> : null}
                </div>
              ))}
            </div>
          </Section>
        ) : null}
      </div>
    </div>
  );
}
