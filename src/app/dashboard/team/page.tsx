"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Users, Plus, Edit, Trash2 } from "lucide-react";

export default function TeamPage() {
  const { user: clerkUser } = useUser();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [user, setUser] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "sales",
    supervisor_id: "",
    base_salary: "",
    monthly_target: "",
    phone: "",
  });

  useEffect(() => {
    if (clerkUser) {
      fetchProfile();
    }
  }, [clerkUser]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("clerk_id", clerkUser!.id)
      .single();

    if (data) {
      setUser(data);
      fetchTeam();
    }
  };

  const fetchTeam = async () => {
    try {
      const response = await fetch("/api/team");
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data);
        setSupervisors(data.filter((m: any) => m.role === "supervisor"));
      }
    } catch (error) {
      console.error("Error fetching team:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      base_salary: parseFloat(formData.base_salary),
      monthly_target: parseFloat(formData.monthly_target),
      supervisor_id: formData.supervisor_id || null,
    };

    try {
      const url = editingMember ? `/api/team/${editingMember.id}` : "/api/team";
      const method = editingMember ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setDialogOpen(false);
        setEditingMember(null);
        setFormData({
          full_name: "",
          email: "",
          role: "sales",
          supervisor_id: "",
          base_salary: "",
          monthly_target: "",
          phone: "",
        });
        fetchTeam();
      }
    } catch (error) {
      console.error("Error saving team member:", error);
    }
  };

  const handleEdit = (member: any) => {
    setEditingMember(member);
    setFormData({
      full_name: member.full_name,
      email: member.email,
      role: member.role,
      supervisor_id: member.supervisor_id || "",
      base_salary: member.base_salary.toString(),
      monthly_target: member.monthly_target.toString(),
      phone: member.phone || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus anggota tim ini?")) return;

    try {
      const response = await fetch(`/api/team/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchTeam();
      }
    } catch (error) {
      console.error("Error deleting team member:", error);
    }
  };

  const openCreateDialog = () => {
    setEditingMember(null);
    setFormData({
      full_name: "",
      email: "",
      role: "sales",
      supervisor_id: "",
      base_salary: "2200000",
      monthly_target: "10000000",
      phone: "",
    });
    setDialogOpen(true);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-600">Admin</Badge>;
      case "supervisor":
        return <Badge className="bg-blue-600">Supervisor</Badge>;
      default:
        return <Badge variant="secondary">Sales</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return `Rp ${Number(value).toLocaleString("id-ID")}`;
  };

  if (!user || loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manajemen Tim</h1>
            <p className="text-gray-600 mt-1">Kelola pengguna dan hierarki tim</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pengguna
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamMembers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teamMembers.filter((m) => m.role === "admin").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Supervisor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teamMembers.filter((m) => m.role === "supervisor").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teamMembers.filter((m) => m.role === "sales").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Daftar Anggota Tim
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Belum ada anggota tim. Klik "Tambah Pengguna" untuk memulai.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Supervisor</TableHead>
                    <TableHead>Gaji Pokok</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.full_name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{getRoleBadge(member.role)}</TableCell>
                      <TableCell>
                        {member.supervisor
                          ? member.supervisor.full_name
                          : member.role === "sales"
                          ? "-"
                          : "N/A"}
                      </TableCell>
                      <TableCell>{formatCurrency(member.base_salary)}</TableCell>
                      <TableCell>{formatCurrency(member.monthly_target)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(member)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(member.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingMember ? "Edit Pengguna" : "Tambah Pengguna"}</DialogTitle>
              <DialogDescription>
                {editingMember
                  ? "Update informasi anggota tim"
                  : "Tambah pengguna baru ke sistem"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Nama Lengkap *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phone">Telepon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="08123456789"
                    />
                  </div>
                </div>

                {formData.role === "sales" && (
                  <div>
                    <Label htmlFor="supervisor_id">Supervisor</Label>
                    <Select
                      value={formData.supervisor_id}
                      onValueChange={(value) => setFormData({ ...formData, supervisor_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih supervisor" />
                      </SelectTrigger>
                      <SelectContent>
                        {supervisors.map((sup) => (
                          <SelectItem key={sup.id} value={sup.id}>
                            {sup.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(formData.role === "sales" || formData.role === "supervisor") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="base_salary">Gaji Pokok *</Label>
                      <Input
                        id="base_salary"
                        type="number"
                        value={formData.base_salary}
                        onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                        required
                        placeholder="2200000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="monthly_target">Target Bulanan *</Label>
                      <Input
                        id="monthly_target"
                        type="number"
                        value={formData.monthly_target}
                        onChange={(e) =>
                          setFormData({ ...formData, monthly_target: e.target.value })
                        }
                        required
                        placeholder="10000000"
                      />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">{editingMember ? "Update" : "Simpan"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
