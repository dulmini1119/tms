"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, Search, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api";

interface Permission {
  id: string;
  name: string;
  code: string;
  description: string | null;
  module: string;
}

interface Role {
  id: string;
  name: string;
  code: string;
  level: number;
}

export default function PermissionMatrixPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [originalPermissions, setOriginalPermissions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  /* Load Data */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [permsRes, rolesRes, matrixRes] = await Promise.all([
        api.get("/permissions/all"),
        api.get("/roles"),
        api.get("/permissions"),
      ]);

      const perms: Permission[] = permsRes.data.data || [];
      const fetchedRoles: Role[] = rolesRes.data.data || [];
      const { roleMap } = matrixRes.data.data || {};

      setPermissions(perms);
      setRoles(fetchedRoles.sort((a, b) => b.level - a.level));

      const initialized: Record<string, string[]> = {};
      fetchedRoles.forEach((role) => {
        initialized[role.id] = roleMap?.[role.id] || [];
      });

      const superAdmin = fetchedRoles.find((r) => r.code === "superadmin");
      if (superAdmin && (!roleMap || !roleMap[superAdmin.id]?.length)) {
        initialized[superAdmin.id] = perms.map((p) => p.id);
      }

      setRolePermissions(initialized);
      setOriginalPermissions(structuredClone(initialized));
    } catch (err) {
      toast.error("Failed to load permission matrix");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* Toggle A Permission */
  const togglePermission = useCallback((roleId: string, permissionId: string, checked: boolean) => {
    setRolePermissions((prev) => ({
      ...prev,
      [roleId]: checked
        ? [...new Set([...(prev[roleId] || []), permissionId])]
        : (prev[roleId] || []).filter((id) => id !== permissionId),
    }));
  }, []);

  const toggleAllInModule = useCallback(
    (modulePerms: Permission[], checked: boolean) => {
      const permIds = modulePerms.map((p) => p.id);

      setRolePermissions((prev) => {
        const next = { ...prev };
        roles.forEach((role) => {
          next[role.id] = checked
            ? [...new Set([...(next[role.id] || []), ...permIds])]
            : (next[role.id] || []).filter((id) => !permIds.includes(id));
        });
        return next;
      });
    },
    [roles]
  );



  const handleSave = async () => {
    setSaving(true);

    try {
      const payloads = roles.map((role) => ({
        roleId: role.id,
        permissionIds: rolePermissions[role.id] || [],
      }));

      const results = await Promise.allSettled(
        payloads.map((p) => api.post("/permissions/save", p))
      );

      const failed = results
        .map((r, i) => ({ result: r, role: roles[i] }))
        .filter(({ result }) => result.status === "rejected");

      if (failed.length > 0) {
        toast.error(`Failed: ${failed.map((f) => f.role.name).join(", ")}`);
      } else {
        toast.success("All permissions saved successfully!");
        setOriginalPermissions(structuredClone(rolePermissions));
      }
    } catch (err) {
      toast.error("Save failed");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  /* Filters */
  const filteredPermissions = useMemo(() => {
    if (!searchQuery) return permissions;

    const q = searchQuery.toLowerCase();
    return permissions.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [permissions, searchQuery]);

  const grouped = useMemo(() => {
    const map: Record<string, Permission[]> = {};
    filteredPermissions.forEach((p) => {
      const cat = p.module || "Other";
      (map[cat] ||= []).push(p);
    });
    return map;
  }, [filteredPermissions]);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(rolePermissions) !== JSON.stringify(originalPermissions),
    [rolePermissions, originalPermissions]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-16 w-16 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="p-3">
          <h1 className="text-2xl">PERMISSIONS MANAGEMENT</h1>
          <p className="text-muted-foreground text-xs">
            Manage role-based access • {roles.length} roles • {permissions.length} permissions
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-80"
            />
          </div>

          <Button
            size="lg"
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className={
              hasUnsavedChanges
                ? "bg-orange-600 hover:bg-orange-700 ring-2 ring-orange-400/50"
                : "bg-cyan-600 hover:bg-cyan-700"
            }
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" /> {hasUnsavedChanges ? "Save Changes" : "Saved"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* MATRIX */}
      {Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([module, perms]) => (
          <Card key={module} className="border shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold">{module.replace(/_/g, " ").toUpperCase()}</span>
                  <Badge variant="secondary">{perms.length} permissions</Badge>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">Grant all →</span>
                  {roles.map((role) => (
                    <Checkbox
                      key={role.id}
                      checked={perms.every((p) => rolePermissions[role.id]?.includes(p.id))}
                      onCheckedChange={(c) => toggleAllInModule(perms, c as boolean)}
                      className="h-5 w-5"
                    />
                  ))}
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-max">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-80 font-bold">Permission</TableHead>

                      {roles.map((role) => (
                        <TableHead key={role.id} className="text-center font-semibold">
                          {role.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {perms.map((perm) => (
                      <TableRow key={perm.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="py-4">
                          <div>
                            <div className="font-semibold">{perm.name}</div>
                            <div className="text-sm text-muted-foreground font-mono">{perm.code}</div>
                            {perm.description && (
                              <div className="text-xs text-muted-foreground mt-2">
                                {perm.description}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {roles.map((role) => (
                          <TableCell key={role.id} className="text-center">
                            <Checkbox
                              checked={rolePermissions[role.id]?.includes(perm.id)}
                              onCheckedChange={(c) =>
                                togglePermission(role.id, perm.id, c as boolean)
                              }
                              className="h-5 w-5"
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}

      {Object.keys(grouped).length === 0 && (
        <Card>
          <CardContent className="text-center py-16">
            <p className="text-lg text-muted-foreground">
              {searchQuery ? "No matching permissions found." : "No permissions available."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
