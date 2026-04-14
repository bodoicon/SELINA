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
import { Search, Plus, Users, Flower2, Database, AlertCircle, RefreshCw } from "lucide-react";

const FLOWER_GROUPS = ["Lục", "Lam", "Tím", "Vàng", "Đỏ"];

const SUPABASE_URL = "https://tewaxvsxbktcexduvfjv.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRld2F4dnN4Ymt0Y2V4ZHV2Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTIxMjksImV4cCI6MjA5MTcyODEyOX0.0VpLpXpR_gGk7p5RiCEL0bK4_EnhAUoqhLpieTL-4zI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function flowerLabel(flower) {
  return flower.name;
}

function normalizeOwnershipRow(row) {
  return {
    id: row.id,
    memberId: row.member_id,
    flowerId: row.flower_id,
  };
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
  const [newFlowerGroup, setNewFlowerGroup] = useState("Lục");
  const [flowerCreateMessage, setFlowerCreateMessage] = useState("");
  const [savingFlower, setSavingFlower] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    setPageMessage("");

    const [membersRes, flowersRes, ownershipsRes] = await Promise.all([
      supabase.from("members").select("id, name, created_at").order("name", { ascending: true }),
      supabase.from("flowers").select("id, name, group_name, created_at").order("name", { ascending: true }),
      supabase.from("member_flowers").select("id, member_id, flower_id, created_at"),
    ]);

    if (membersRes.error || flowersRes.error || ownershipsRes.error) {
      setPageMessage(
        membersRes.error?.message || flowersRes.error?.message || ownershipsRes.error?.message || "Không tải được dữ liệu từ Supabase."
      );
      setLoading(false);
      return;
    }

    setMembers((membersRes.data || []).map((m) => ({ id: m.id, name: m.name })));
    setFlowers((flowersRes.data || []).map((f) => ({ id: f.id, name: f.name, group: f.group_name })));
    setOwnerships((ownershipsRes.data || []).map(normalizeOwnershipRow));
    setLoading(false);
  }

  const ownershipMap = useMemo(() => {
    const map = new Map();
    members.forEach((member) => map.set(member.id, new Set()));
    ownerships.forEach(({ memberId, flowerId }) => {
      if (!map.has(memberId)) map.set(memberId, new Set());
      map.get(memberId).add(flowerId);
    });
    return map;
  }, [members, ownerships]);

  const ownersByFlower = useMemo(() => {
    const map = new Map();
    flowers.forEach((flower) => map.set(flower.id, []));
    ownerships.forEach(({ memberId, flowerId }) => {
      const member = members.find((m) => m.id === memberId);
      if (!member) return;
      if (!map.has(flowerId)) map.set(flowerId, []);
      map.get(flowerId).push(member.name);
    });
    return map;
  }, [flowers, members, ownerships]);

  const missingFlowers = useMemo(() => {
    return flowers.filter((flower) => !ownersByFlower.get(flower.id)?.length);
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
    const ownedFlowerIds = new Set(ownerships.map((x) => x.flowerId));
    return {
      totalMembers: members.length,
      totalFlowers: flowers.length,
      ownedFlowers: ownedFlowerIds.size,
      missingFlowers: flowers.length - ownedFlowerIds.size,
    };
  }, [members, flowers, ownerships]);

  function toggleFlowerSelection(flowerId) {
    setSelectedFlowerIds((prev) =>
      prev.includes(flowerId) ? prev.filter((id) => id !== flowerId) : [...prev, flowerId]
    );
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
      .insert([{ name, group_name: newFlowerGroup }])
      .select("id, name, group_name")
      .single();
    setSavingFlower(false);

    if (error) {
      setFlowerCreateMessage(`Không thêm được hoa mới: ${error.message}`);
      return;
    }

    const inserted = { id: data.id, name: data.name, group: data.group_name };
    setFlowers((prev) => [...prev, inserted].sort((a, b) => a.name.localeCompare(b.name, "vi")));
    setNewFlowerName("");
    setNewFlowerGroup("Lục");
    setFlowerCreateMessage(`Đã thêm hoa mới: ${flowerLabel(inserted)}.`);
  }

  async function getOrCreateMember() {
    const trimmedNewMemberName = newMemberName.trim();
    const useNewMember = trimmedNewMemberName.length > 0;
    const useExistingMember = selectedExistingMemberId !== "none";

    if (!useNewMember && !useExistingMember) {
      return { error: "Hãy chọn thành viên cũ hoặc nhập tên thành viên mới." };
    }

    if (useNewMember) {
      const existing = members.find((m) => m.name.toLowerCase() === trimmedNewMemberName.toLowerCase());
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

      const insertedMember = { id: data.id, name: data.name };
      setMembers((prev) => [...prev, insertedMember].sort((a, b) => a.name.localeCompare(b.name, "vi")));
      return { member: insertedMember };
    }

    const member = members.find((m) => String(m.id) === selectedExistingMemberId);
    if (!member) {
      return { error: "Không tìm thấy thành viên đã chọn." };
    }

    return { member };
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
      ownerships.filter((o) => o.memberId === member.id).map((o) => o.flowerId)
    );

    const additions = selectedFlowerIds
      .filter((flowerId) => !alreadyOwned.has(flowerId))
      .map((flowerId) => ({ member_id: member.id, flower_id: flowerId }));

    if (additions.length === 0) {
      setSavingOwnership(false);
      setUpdateMessage(`${member.name} đã có sẵn toàn bộ các hoa được chọn.`);
      return;
    }

    const { data, error } = await supabase
      .from("member_flowers")
      .insert(additions)
      .select("id, member_id, flower_id");

    setSavingOwnership(false);

    if (error) {
      setUpdateMessage(`Không lưu được cập nhật sở hữu: ${error.message}`);
      return;
    }

    setOwnerships((prev) => [...prev, ...(data || []).map(normalizeOwnershipRow)]);
    setSelectedFlowerIds([]);
    setSelectedExistingMemberId("none");
    setNewMemberName("");
    setUpdateMessage(`Đã cập nhật ${additions.length} loại hoa mới cho ${member.name}.`);
  }

  async function renameMember(memberId, newName) {
    const trimmed = newName.trim();
    if (!trimmed) {
      return { ok: false, message: "Tên thành viên không được để trống." };
    }

    const duplicated = members.some((m) => m.id !== memberId && m.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicated) {
      return { ok: false, message: "Tên thành viên đã tồn tại." };
    }

    const { error } = await supabase.from("members").update({ name: trimmed }).eq("id", memberId);
    if (error) {
      return { ok: false, message: `Không sửa được tên thành viên: ${error.message}` };
    }

    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, name: trimmed } : m)));
    return { ok: true, message: "Đã cập nhật tên thành viên." };
  }

  async function renameFlower(flowerId, newName) {
    const trimmed = newName.trim();
    if (!trimmed) {
      return { ok: false, message: "Tên hoa không được để trống." };
    }

    const duplicated = flowers.some((f) => f.id !== flowerId && f.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicated) {
      return { ok: false, message: "Tên hoa đã tồn tại." };
    }

    const { error } = await supabase.from("flowers").update({ name: trimmed }).eq("id", flowerId);
    if (error) {
      return { ok: false, message: `Không sửa được tên hoa: ${error.message}` };
    }

    setFlowers((prev) => prev.map((f) => (f.id === flowerId ? { ...f, name: trimmed } : f)));
    return { ok: true, message: "Đã cập nhật tên hoa." };
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Quản lý hoa hội game</h1>
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
          {pageMessage ? <div className="mt-4 rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{pageMessage}</div> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<Users className="h-5 w-5" />} title="Thành viên" value={summary.totalMembers} />
          <StatCard icon={<Flower2 className="h-5 w-5" />} title="Tổng loại hoa" value={summary.totalFlowers} />
          <StatCard icon={<Database className="h-5 w-5" />} title="Hội đã sở hữu" value={summary.ownedFlowers} />
          <StatCard icon={<AlertCircle className="h-5 w-5" />} title="Hội còn thiếu" value={summary.missingFlowers} />
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 gap-2 md:grid-cols-5">
            <TabsTrigger value="dashboard">Tổng quan</TabsTrigger>
            <TabsTrigger value="members">Thành viên</TabsTrigger>
            <TabsTrigger value="flowers">Hoa</TabsTrigger>
            <TabsTrigger value="update">Cập nhật sở hữu</TabsTrigger>
            <TabsTrigger value="addflower">Thêm hoa mới</TabsTrigger>
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
                            <p className="font-semibold">{flowerLabel(flower)}</p>
                            <p className="mt-1 text-sm text-slate-600">Chưa có ai trong hội sở hữu</p>
                          </div>
                          <Badge variant="outline">{flower.group}</Badge>
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
                    const ownedIds = ownershipMap.get(member.id) || new Set();
                    const ownedFlowers = flowers.filter((flower) => ownedIds.has(flower.id));

                    return (
                      <Card key={member.id} className="rounded-3xl shadow-sm">
                        <CardHeader>
                          <div className="flex items-center justify-between gap-3">
                            <CardTitle className="text-xl">{member.name}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{ownedFlowers.length} hoa</Badge>
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
                          <p className="text-sm text-slate-600">
                            Thành viên này hiện đang sở hữu {ownedFlowers.length} loại hoa.
                          </p>
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
                    const owners = ownersByFlower.get(flower.id) || [];

                    return (
                      <Card key={flower.id} className="rounded-3xl shadow-sm">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <CardTitle className="text-lg">{flowerLabel(flower)}</CardTitle>
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
                                  <EditFlowerForm flower={flower} onSave={(newName) => renameFlower(flower.id, newName)} />
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
                                <Badge key={owner} variant="outline" className="rounded-full">
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
                    <Select value={selectedExistingMemberId} onValueChange={setSelectedExistingMemberId}>
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
                      onChange={(e) => setNewMemberName(e.target.value)}
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
                          const checked = selectedFlowerIds.includes(flower.id);
                          return (
                            <label
                              key={flower.id}
                              className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition hover:bg-slate-50"
                            >
                              <Checkbox checked={checked} onCheckedChange={() => toggleFlowerSelection(flower.id)} />
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-medium">{flowerLabel(flower)}</p>
                                    <p className="mt-1 text-sm text-slate-600">
                                      Hiện có {ownersByFlower.get(flower.id)?.length || 0} người sở hữu
                                    </p>
                                  </div>
                                  <Badge variant="outline">{flower.group}</Badge>
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
                              <p className="font-medium">{flowerLabel(flower)}</p>
                              <p className="mt-1 text-sm text-slate-600">
                                {ownersByFlower.get(flower.id)?.length || 0} người đang sở hữu
                              </p>
                            </div>
                            <Badge variant="outline">{flower.group}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
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
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Tên hoa</Label>
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
        {saving ? "Đang lưu..." : "Lưu tên hoa"}
      </Button>
      {message ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{message}</div> : null}
    </div>
  );
}
