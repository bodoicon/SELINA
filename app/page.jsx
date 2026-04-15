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
import { Search, Plus, Users, Flower2, Database, AlertCircle, RefreshCw, Trophy } from "lucide-react";

const FLOWER_GROUPS = ["Lục", "Lam", "Tím", "Vàng", "Đỏ"];

const SUPABASE_URL = "https://tewaxvsxbktcexduvfjv.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRld2F4dnN4Ymt0Y2V4ZHV2Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTIxMjksImV4cCI6MjA5MTcyODEyOX0.0VpLpXpR_gGk7p5RiCEL0bK4_EnhAUoqhLpieTL-4zI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const FLOWER_ICON_BUCKET = "flower-icons";

const GROUP_STYLES = {
  "Lục": "border-green-200 bg-green-50 text-green-700",
  "Lam": "border-blue-200 bg-blue-50 text-blue-700",
  "Tím": "border-violet-200 bg-violet-50 text-violet-700",
  "Vàng": "border-amber-200 bg-amber-50 text-amber-700",
  "Đỏ": "border-red-200 bg-red-50 text-red-700",
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

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    setPageMessage("");

    const [membersRes, flowersRes, ownershipsRes, historyRes] = await Promise.all([
      supabase
        .from("members")
        .select("id, name, created_at, member_flowers(flower_id)")
        .order("name", { ascending: true }),
      supabase
        .from("flowers")
        .select("id, name, group_name, icon_url, created_at")
        .order("name", { ascending: true }),
      supabase.from("member_flowers").select("id, member_id, flower_id, created_at"),
      supabase.from("action_logs").select("id, action_type, actor_name, target_type, target_name, details, created_at").order("created_at", { ascending: false }).limit(50),
    ]);

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

    setMembers(
      (membersRes.data || []).map((m) => ({
        id: String(m.id),
        name: m.name,
        ownedCount: Array.isArray(m.member_flowers) ? m.member_flowers.length : 0,
      }))
    );

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
    setLoading(false);
  }

  const ownersByFlower = useMemo(() => {
    const map = new Map();
    flowers.forEach((flower) => map.set(String(flower.id), []));
    ownerships.forEach(({ memberId, flowerId }) => {
      const member = members.find((m) => String(m.id) === String(memberId));
      if (!member) return;
      const flowerKey = String(flowerId);
      if (!map.has(flowerKey)) map.set(flowerKey, []);
      map.get(flowerKey).push(member.name);
    });
    return map;
  }, [flowers, members, ownerships]);

  const missingFlowers = useMemo(() => {
    return flowers.filter((flower) => !ownersByFlower.get(String(flower.id))?.length);
  }, [flowers, ownersByFlower]);

  const filteredMissingFlowers = useMemo(() => {
    return missingFlowers.filter((flower) => dashboardGroupFilter === "all" || flower.group === dashboardGroupFilter);
  }, [missingFlowers, dashboardGroupFilter]);

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    return members.filter((member) => member.name.toLowerCase().includes(q));
  }, [members, memberSearch]);

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
      .sort((a, b) => (b.ownedCount || 0) - (a.ownedCount || 0))
      .slice(0, 3);
  }, [members]);

  function toggleFlowerSelection(flowerId) {
    setSelectedFlowerIds((prev) => {
      const key = String(flowerId);
      return prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key];
    });
  }

  async function addFlowerToDatabase() {
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

    const inserted = { id: String(data.id), name: data.name, group: data.group_name, iconUrl: data.icon_url || "" };
    await logAction({
      actionType: "add_flower",
      actorName: "Quản trị hội",
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

    const insertedMember = { id: String(data.id), name: data.name, ownedCount: 0 };
    await loadAllData();
    return { member: insertedMember };
  }

  async function saveOwnershipUpdate() {
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
      actorName: member.name,
      targetType: "member",
      targetName: member.name,
      details: `Thêm ${optimisticRows.length} hoa: ${uniqueSelectedFlowerIds
        .map((id) => flowers.find((f) => String(f.id) === String(id))?.name || id)
        .join(", ")}`,
    });

    await loadAllData();
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

  async function renameMember(memberId, newName) {
    const trimmed = newName.trim();
    if (!trimmed) {
      return { ok: false, message: "Tên thành viên không được để trống." };
    }

    const duplicated = members.some((m) => String(m.id) !== String(memberId) && m.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicated) {
      return { ok: false, message: "Tên thành viên đã tồn tại." };
    }

    const { error } = await supabase.from("members").update({ name: trimmed }).eq("id", memberId);
    if (error) {
      return { ok: false, message: `Không sửa được tên thành viên: ${error.message}` };
    }

    await logAction({
      actionType: "rename_member",
      actorName: "Quản trị hội",
      targetType: "member",
      targetName: trimmed,
      details: `Đổi tên thành viên từ ${members.find((m) => String(m.id) === String(memberId))?.name || "(không rõ)"} thành ${trimmed}`,
    });
    await loadAllData();
    return { ok: true, message: "Đã cập nhật tên thành viên." };
  }

  async function renameFlower(flowerId, payload) {
    const trimmedName = payload.name.trim();
    const nextIconUrl = payload.iconUrl.trim();
    const currentFlower = flowers.find((f) => String(f.id) === String(flowerId));

    if (!trimmedName) {
      return { ok: false, message: "Tên hoa không được để trống." };
    }

    const duplicated = flowers.some((f) => String(f.id) !== String(flowerId) && f.name.toLowerCase() === trimmedName.toLowerCase());
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
      actorName: "Quản trị hội",
      targetType: "flower",
      targetName: trimmedName,
      details: `Cập nhật thông tin hoa ${currentFlower?.name || ""}`,
    });
    await loadAllData();
    return { ok: true, message: "Đã cập nhật thông tin hoa." };
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Quản Lý Hoa Hội SELINA</h1>
              <p className="mt-2 text-sm text-slate-600">
                Bản này đã kết nối Supabase. Ai có link đều có thể xem và cập nhật dữ liệu chung.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={loadAllData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Tải lại dữ liệu
              </Button>
              {FLOWER_GROUPS.map((group) => (
                <Badge key={group} variant="secondary" className="rounded-full px-3 py-1 text-sm">
                  Nhóm {group}
                </Badge>
              ))}
            </div>
          </div>
          {pageMessage ? (
            <div className="mt-4 rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{pageMessage}</div>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<Users className="h-5 w-5" />} title="Thành viên" value={summary.totalMembers} />
          <StatCard icon={<Flower2 className="h-5 w-5" />} title="Tổng loại hoa" value={summary.totalFlowers} />
          <StatCard icon={<Database className="h-5 w-5" />} title="Hội đã sở hữu" value={summary.ownedFlowers} />
          <StatCard icon={<AlertCircle className="h-5 w-5" />} title="Hội còn thiếu" value={summary.missingFlowers} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Tỉ lệ hoàn thành bộ sưu tập</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Hội đã sưu tầm</span>
                <span>{summary.completionRate}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${summary.completionRate}%` }} />
              </div>
              <p className="text-sm text-slate-600">
                Đã có {summary.ownedFlowers}/{summary.totalFlowers} loại hoa trong cơ sở dữ liệu.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" /> Top sưu tầm
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topMembers.length === 0 ? (
                <p className="text-sm text-slate-600">Chưa có dữ liệu thành viên.</p>
              ) : (
                topMembers.map((member, index) => (
                  <div key={member.id} className="flex items-center justify-between rounded-2xl border p-3">
                    <div>
                      <p className="font-medium">#{index + 1} {member.name}</p>
                      <p className="text-sm text-slate-500">{member.ownedCount || 0} loại hoa</p>
                    </div>
                    <Badge variant="secondary">Top {index + 1}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full min-w-max grid-cols-6 gap-2 overflow-x-auto md:min-w-0">
            <TabsTrigger value="dashboard">Tổng quan</TabsTrigger>
            <TabsTrigger value="members">Thành viên</TabsTrigger>
            <TabsTrigger value="flowers">Hoa</TabsTrigger>
            <TabsTrigger value="update">Cập nhật sở hữu</TabsTrigger>
            <TabsTrigger value="addflower">Thêm hoa mới</TabsTrigger>
            <TabsTrigger value="history">Lịch sử</TabsTrigger>
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
                          <Badge variant="outline" className={groupBadgeClass(flower.group)}>{flower.group}</Badge>
                        </div>
                      </div>
                    ))}
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
                    const ownedCount = member.ownedCount || 0;

                    return (
                      <Card key={member.id} className="rounded-3xl shadow-sm">
                        <CardHeader>
                          <div className="flex items-center justify-between gap-3">
                            <CardTitle className="text-xl">{member.name}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{ownedCount} hoa</Badge>
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
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600">Thành viên này hiện đang sở hữu {ownedCount} loại hoa.</p>
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
                    <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{updateMessage}</div>
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
                                  <Badge variant="outline" className={groupBadgeClass(flower.group)}>{flower.group}</Badge>
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
                    <div className="rounded-2xl border bg-white p-3 text-sm text-slate-700">{flowerCreateMessage}</div>
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
                            <Badge variant="outline" className={groupBadgeClass(flower.group)}>{flower.group}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

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
                              <Badge variant="outline" className="rounded-full">{log.actionType || "-"}</Badge>
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
        </Tabs>
      </div>
    </div>
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
