
"use client";

import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Check,
  ClipboardCheck,
  Cog,
  Download,
  Gauge,
  Loader2,
  Lock,
  Mail,
  Plus,
  RefreshCw,
  Rocket,
  Save,
  Search,
  Settings2,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type SettingType = "String" | "Number" | "Boolean" | "JSON";

type Setting = {
  id: string;
  key: string;
  name: string;
  value: unknown;
  dataType: SettingType;
  category: string;
  description?: string | null;
  encrypted?: boolean | null;
};

type SettingsApiResponse = {
  data?: {
    settings?: Setting[];
  };
};

type CreatePayload = {
  setting_key: string;
  setting_value: string;
  setting_type: SettingType;
  category: string;
  description?: string;
  is_encrypted?: boolean;
};

type ManagedSetting = {
  key: string;
  label: string;
  type: SettingType;
  category: string;
  description: string;
  defaultValue: unknown;
};

type SetupPack = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  updates: Array<{ def: ManagedSetting; value: unknown }>;
};

const API = "/system-settings";

const stableString = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const parseDraftByType = (raw: string, type: SettingType): unknown => {
  if (type === "Boolean") return raw === "true";
  if (type === "Number") {
    if (raw.trim() === "") return 0;
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) throw new Error("Invalid number value");
    return parsed;
  }
  if (type === "JSON") {
    if (!raw.trim()) return {};
    return JSON.parse(raw);
  }
  return raw;
};

const toApiStringValue = (value: unknown): string => {
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value);
};

const defaultCategory = "General";

const managedSettings: ManagedSetting[] = [
  {
    key: "trip_auto_approve_enabled",
    label: "Auto approve trip requests",
    type: "Boolean",
    category: "Approval",
    description: "If enabled, requests skip HOD/Manager review.",
    defaultValue: false,
  },
  {
    key: "approval_requires_hod",
    label: "Require HOD approval",
    type: "Boolean",
    category: "Approval",
    description: "Trip requests must be reviewed by department head.",
    defaultValue: true,
  },
  {
    key: "approval_requires_manager_when_available",
    label: "Require Manager (BU Head) approval when available",
    type: "Boolean",
    category: "Approval",
    description: "If BU has manager, route request to manager stage too.",
    defaultValue: true,
  },
  {
    key: "allow_request_edit_before_review",
    label: "Allow employee edit before review",
    type: "Boolean",
    category: "Approval",
    description: "Requester can edit or cancel before HOD/Manager action.",
    defaultValue: true,
  },
  {
    key: "trip_auto_assignment_enabled",
    label: "Auto assign vehicle",
    type: "Boolean",
    category: "Fleet",
    description: "Automatically assign available vehicle after approval.",
    defaultValue: false,
  },
  {
    key: "driver_reject_reassign_required",
    label: "Reassign when driver rejects",
    type: "Boolean",
    category: "Fleet",
    description: "Force new assignment if current driver rejects.",
    defaultValue: true,
  },
  {
    key: "manual_driver_trip_entry_enabled",
    label: "Allow manual trip start/end by admin",
    type: "Boolean",
    category: "Fleet",
    description: "When driver has no mobile access, admin can log start/end.",
    defaultValue: true,
  },
  {
    key: "notify_employee_on_approval",
    label: "Notify employee on approval/rejection",
    type: "Boolean",
    category: "Notifications",
    description: "Send status update to requester.",
    defaultValue: true,
  },
  {
    key: "notify_driver_on_assignment",
    label: "Notify driver on assignment",
    type: "Boolean",
    category: "Notifications",
    description: "Notify assigned driver with trip details.",
    defaultValue: true,
  },
  {
    key: "notify_superadmin_on_critical_events",
    label: "CC Super Admin on critical events",
    type: "Boolean",
    category: "Notifications",
    description: "Get copied on approvals, rejections, and failures.",
    defaultValue: true,
  },
  {
    key: "budget_control_enabled",
    label: "Enable budget controls",
    type: "Boolean",
    category: "Budget",
    description: "Track monthly budget usage and alerts.",
    defaultValue: true,
  },
  {
    key: "budget_alert_threshold_percent",
    label: "Budget alert threshold (%)",
    type: "Number",
    category: "Budget",
    description: "Send warning when usage reaches this threshold.",
    defaultValue: 80,
  },
  {
    key: "monthly_trip_budget_default",
    label: "Default monthly trip budget",
    type: "Number",
    category: "Budget",
    description: "Fallback limit used when BU/Department budget is missing.",
    defaultValue: 200000,
  },
  {
    key: "dashboard_cache_seconds",
    label: "Dashboard cache seconds",
    type: "Number",
    category: "Performance",
    description: "Cache duration for dashboard stats and summary calls.",
    defaultValue: 60,
  },
  {
    key: "audit_log_read_verbosity",
    label: "Audit log verbosity",
    type: "String",
    category: "Audit",
    description: "compact or detailed",
    defaultValue: "compact",
  },
];

const getManagedSetting = (key: string): ManagedSetting | undefined =>
  managedSettings.find((setting) => setting.key === key);

const setupPacks: SetupPack[] = [
  {
    id: "governance-strict",
    title: "Strict Governance",
    description: "Two-stage approvals with strong restrictions and alerts.",
    icon: <Lock className="h-4 w-4" />,
    updates: [
      { def: getManagedSetting("trip_auto_approve_enabled")!, value: false },
      { def: getManagedSetting("approval_requires_hod")!, value: true },
      { def: getManagedSetting("approval_requires_manager_when_available")!, value: true },
      { def: getManagedSetting("allow_request_edit_before_review")!, value: true },
      { def: getManagedSetting("notify_superadmin_on_critical_events")!, value: true },
    ],
  },
  {
    id: "fleet-control",
    title: "Fleet Control",
    description: "Manual control with reassignment workflow and notification coverage.",
    icon: <Rocket className="h-4 w-4" />,
    updates: [
      { def: getManagedSetting("trip_auto_assignment_enabled")!, value: false },
      { def: getManagedSetting("driver_reject_reassign_required")!, value: true },
      { def: getManagedSetting("manual_driver_trip_entry_enabled")!, value: true },
      { def: getManagedSetting("notify_driver_on_assignment")!, value: true },
    ],
  },
  {
    id: "budget-guard",
    title: "Budget Guard",
    description: "Enable spending controls and early budget warnings.",
    icon: <Gauge className="h-4 w-4" />,
    updates: [
      { def: getManagedSetting("budget_control_enabled")!, value: true },
      { def: getManagedSetting("budget_alert_threshold_percent")!, value: 80 },
      { def: getManagedSetting("monthly_trip_budget_default")!, value: 200000 },
    ],
  },
];

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreatePayload>({
    setting_key: "",
    setting_value: "",
    setting_type: "String",
    category: defaultCategory,
    description: "",
    is_encrypted: false,
  });

  const [deleteTarget, setDeleteTarget] = useState<Setting | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error("Failed to fetch settings");
      const json = (await response.json()) as SettingsApiResponse;
      const list = Array.isArray(json?.data?.settings) ? json.data.settings : [];
      setSettings(list);

      const nextDrafts: Record<string, string> = {};
      list.forEach((setting) => {
        nextDrafts[setting.key] = stableString(setting.value);
      });
      setDrafts(nextDrafts);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load system settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const categories = useMemo(() => {
    const found = Array.from(new Set(settings.map((setting) => setting.category || defaultCategory)));
    return found.sort((a, b) => a.localeCompare(b));
  }, [settings]);

  const filteredSettings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return settings.filter((setting) => {
      const matchesCategory = category === "all" || (setting.category || defaultCategory) === category;
      const matchesSearch =
        !q ||
        setting.key.toLowerCase().includes(q) ||
        (setting.name || "").toLowerCase().includes(q) ||
        (setting.description || "").toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [settings, search, category]);

  const isChanged = useCallback(
    (setting: Setting) => drafts[setting.key] !== stableString(setting.value),
    [drafts]
  );

  const changedCount = useMemo(() => settings.filter((setting) => isChanged(setting)).length, [settings, isChanged]);

  const updateDraft = (key: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [key]: value }));
  };

  const createOrUpdateSetting = async (
    def: ManagedSetting,
    value: unknown,
    encrypted = false,
    descriptionOverride?: string
  ) => {
    const existing = settings.find((s) => s.key === def.key);
    if (!existing) {
      const createBody: CreatePayload = {
        setting_key: def.key,
        setting_value: toApiStringValue(value),
        setting_type: def.type,
        category: def.category,
        description: descriptionOverride || def.description,
        is_encrypted: encrypted,
      };
      const createRes = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createBody),
      });
      if (!createRes.ok) throw new Error(`Failed to create ${def.key}`);
      return;
    }

    const updateRes = await fetch(`${API}/${def.key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        setting_value: toApiStringValue(value),
        description: descriptionOverride || existing.description || def.description,
        is_encrypted: Boolean(existing.encrypted),
      }),
    });
    if (!updateRes.ok) throw new Error(`Failed to update ${def.key}`);
  };

  const persistSetting = async (setting: Setting) => {
    const raw = drafts[setting.key] ?? "";
    let parsed: unknown;

    try {
      parsed = parseDraftByType(raw, setting.dataType);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Invalid value";
      toast.error(`${setting.key}: ${msg}`);
      throw error;
    }

    const body = {
      setting_value: toApiStringValue(parsed),
      description: setting.description || "",
      is_encrypted: Boolean(setting.encrypted),
    };

    const response = await fetch(`${API}/${setting.key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Failed to save ${setting.key}`);
    }

    return parsed;
  };

  const saveOne = async (setting: Setting) => {
    try {
      const parsed = await persistSetting(setting);
      setSettings((prev) => prev.map((s) => (s.key === setting.key ? { ...s, value: parsed } : s)));
      toast.success(`Saved ${setting.key}`);
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Failed to save setting";
      toast.error(msg);
    }
  };

  const saveAll = async () => {
    const changed = settings.filter((setting) => isChanged(setting));
    if (!changed.length) {
      toast.info("No changes to save");
      return;
    }

    setSaving(true);
    try {
      for (const setting of changed) {
        const parsed = await persistSetting(setting);
        setSettings((prev) => prev.map((s) => (s.key === setting.key ? { ...s, value: parsed } : s)));
      }
      toast.success("All setting changes saved");
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Failed to save all changes";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const resetOne = (setting: Setting) => {
    updateDraft(setting.key, stableString(setting.value));
  };

  const handleCreate = async () => {
    if (!createForm.setting_key.trim()) {
      toast.error("Setting key is required");
      return;
    }

    setSaving(true);
    try {
      let normalizedValue: unknown = createForm.setting_value;
      if (createForm.setting_type === "Number") {
        normalizedValue = Number(createForm.setting_value || "0");
        if (Number.isNaN(normalizedValue)) throw new Error("Invalid number value");
      }
      if (createForm.setting_type === "Boolean") {
        normalizedValue = createForm.setting_value.toLowerCase() === "true";
      }
      if (createForm.setting_type === "JSON") {
        normalizedValue = createForm.setting_value ? JSON.parse(createForm.setting_value) : {};
      }

      const body: CreatePayload = {
        ...createForm,
        setting_key: createForm.setting_key.trim(),
        category: createForm.category.trim() || defaultCategory,
        setting_value: toApiStringValue(normalizedValue),
      };

      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Failed to create setting");

      toast.success(`Created ${body.setting_key}`);
      setIsCreateOpen(false);
      setCreateForm({
        setting_key: "",
        setting_value: "",
        setting_type: "String",
        category: defaultCategory,
        description: "",
        is_encrypted: false,
      });
      await fetchSettings();
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Failed to create setting";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setSaving(true);
    try {
      const response = await fetch(`${API}/${deleteTarget.key}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete setting");
      toast.success(`Deleted ${deleteTarget.key}`);
      setDeleteTarget(null);
      await fetchSettings();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete setting");
    } finally {
      setSaving(false);
    }
  };

  const exportSettings = () => {
    const payload = settings.map((setting) => ({
      key: setting.key,
      type: setting.dataType,
      category: setting.category,
      value: setting.value,
      description: setting.description || "",
      encrypted: Boolean(setting.encrypted),
    }));

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSaving(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Array<{
        key: string;
        type?: SettingType;
        category?: string;
        value: unknown;
        description?: string;
        encrypted?: boolean;
      }>;

      if (!Array.isArray(parsed)) throw new Error("Invalid import file format");

      for (const item of parsed) {
        if (!item.key) continue;

        const exists = settings.find((s) => s.key === item.key);
        if (!exists) {
          await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              setting_key: item.key,
              setting_value: toApiStringValue(item.value),
              setting_type: item.type || "String",
              category: item.category || defaultCategory,
              description: item.description || "",
              is_encrypted: Boolean(item.encrypted),
            }),
          });
          continue;
        }

        await fetch(`${API}/${item.key}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            setting_value: toApiStringValue(item.value),
            description: item.description || exists.description || "",
            is_encrypted: Boolean(item.encrypted ?? exists.encrypted),
          }),
        });
      }

      toast.success("Settings imported");
      await fetchSettings();
    } catch (error) {
      console.error(error);
      toast.error("Failed to import settings");
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
      setSaving(false);
    }
  };

  const applyPreset = async (presetId: string) => {
    const preset = setupPacks.find((p) => p.id === presetId);
    if (!preset) return;

    setSaving(true);
    try {
      for (const update of preset.updates) {
        await createOrUpdateSetting(update.def, update.value);
      }

      toast.success(`${preset.title} applied`);
      await fetchSettings();
    } catch (error) {
      console.error(error);
      toast.error(`Failed to apply ${preset.title}`);
    } finally {
      setSaving(false);
    }
  };

  const getSetting = useCallback(
    (key: string) => settings.find((s) => s.key === key),
    [settings]
  );

  const getManagedCurrentValue = (def: ManagedSetting): string => {
    const dbValue = getSetting(def.key)?.value;
    const draftValue = drafts[def.key];
    if (draftValue !== undefined) return draftValue;
    if (dbValue !== undefined) return stableString(dbValue);
    return stableString(def.defaultValue);
  };

  const renderManagedInput = (def: ManagedSetting) => {
    const current = getManagedCurrentValue(def);
    if (def.type === "Boolean") {
      return (
        <Switch
          checked={current === "true"}
          onCheckedChange={(checked) => updateDraft(def.key, String(checked))}
        />
      );
    }
    if (def.type === "Number") {
      return (
        <Input
          type="number"
          value={current}
          onChange={(event) => updateDraft(def.key, event.target.value)}
          className="w-44"
        />
      );
    }
    if (def.type === "JSON") {
      return (
        <Textarea
          value={current}
          rows={2}
          onChange={(event) => updateDraft(def.key, event.target.value)}
          className="font-mono text-xs"
        />
      );
    }
    return (
      <Input
        value={current}
        onChange={(event) => updateDraft(def.key, event.target.value)}
        className="w-64"
      />
    );
  };

  const saveManagedSetting = async (def: ManagedSetting) => {
    const raw = drafts[def.key] ?? stableString(getSetting(def.key)?.value ?? def.defaultValue);
    let parsed: unknown;
    try {
      parsed = parseDraftByType(raw, def.type);
      await createOrUpdateSetting(def, parsed);
      toast.success(`Saved ${def.label}`);
      await fetchSettings();
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Failed to save setting";
      toast.error(msg);
    }
  };

  const renderEditor = (setting: Setting) => {
    const value = drafts[setting.key] ?? "";

    if (setting.dataType === "Boolean") {
      return (
        <Switch
          checked={value === "true"}
          onCheckedChange={(checked) => updateDraft(setting.key, String(checked))}
        />
      );
    }

    if (setting.dataType === "Number") {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => updateDraft(setting.key, e.target.value)}
          className="w-36"
        />
      );
    }

    if (setting.dataType === "JSON") {
      return (
        <Textarea
          value={value}
          onChange={(e) => updateDraft(setting.key, e.target.value)}
          rows={3}
          className="min-w-[320px] font-mono text-xs"
        />
      );
    }

    return (
      <Input
        value={value}
        onChange={(e) => updateDraft(setting.key, e.target.value)}
        className="w-72"
      />
    );
  };

  const approvalControls = managedSettings.filter((setting) => setting.category === "Approval");
  const fleetControls = managedSettings.filter((setting) => setting.category === "Fleet");
  const notificationControls = managedSettings.filter((setting) => setting.category === "Notifications");
  const budgetControls = managedSettings.filter((setting) => setting.category === "Budget");
  const platformControls = managedSettings.filter(
    (setting) => setting.category === "Performance" || setting.category === "Audit"
  );

  if (loading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl">SYSTEM SETTING</h1>
          <p className="text-muted-foreground text-xs">
            Configure approvals, fleet flow, budget rules, notifications, and platform behavior.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => importInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={importSettings}
          />
          <Button variant="outline" onClick={exportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={saveAll} disabled={saving || changedCount === 0}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save All ({changedCount})
          </Button>
        </div>
      </div>

      <Tabs defaultValue="controls" className="space-y-4">
        <TabsList>
          <TabsTrigger value="controls">
            <Settings2 className="h-4 w-4 mr-1" />
            Controls
          </TabsTrigger>
          <TabsTrigger value="registry">
            <Cog className="h-4 w-4 mr-1" />
            Registry
          </TabsTrigger>
          <TabsTrigger value="create">
            <Plus className="h-4 w-4 mr-1" />
            Add Setting
          </TabsTrigger>
        </TabsList>

        <TabsContent value="controls" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {setupPacks.map((pack) => (
              <Card key={pack.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {pack.icon}
                    {pack.title}
                  </CardTitle>
                  <CardDescription>{pack.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => applyPreset(pack.id)} disabled={saving}>
                    Apply Pack
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Approval Workflow Controls
              </CardTitle>
              <CardDescription>Configure HOD and Manager approval routing behavior.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {approvalControls.map((def) => (
                <div key={def.key} className="flex items-center justify-between border rounded-md p-3">
                  <div className="max-w-[70%]">
                    <p className="text-sm font-medium">{def.label}</p>
                    <p className="text-xs text-muted-foreground">{def.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderManagedInput(def)}
                    <Button size="sm" variant="outline" onClick={() => saveManagedSetting(def)}>
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Rocket className="h-4 w-4" />
                  Fleet Operations
                </CardTitle>
                <CardDescription>Set assignment, driver handling, and manual entry policies.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {fleetControls.map((def) => (
                  <div key={def.key} className="flex items-center justify-between border rounded-md p-3">
                    <div className="max-w-[64%]">
                      <p className="text-sm font-medium">{def.label}</p>
                      <p className="text-xs text-muted-foreground">{def.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderManagedInput(def)}
                      <Button size="sm" variant="outline" onClick={() => saveManagedSetting(def)}>
                        Save
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Notifications
                </CardTitle>
                <CardDescription>Choose who gets notified for major workflow events.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {notificationControls.map((def) => (
                  <div key={def.key} className="flex items-center justify-between border rounded-md p-3">
                    <div className="max-w-[64%]">
                      <p className="text-sm font-medium">{def.label}</p>
                      <p className="text-xs text-muted-foreground">{def.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderManagedInput(def)}
                      <Button size="sm" variant="outline" onClick={() => saveManagedSetting(def)}>
                        Save
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Budget Rules
                </CardTitle>
                <CardDescription>Set default budget limits and alert thresholds.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {budgetControls.map((def) => (
                  <div key={def.key} className="flex items-center justify-between border rounded-md p-3">
                    <div className="max-w-[64%]">
                      <p className="text-sm font-medium">{def.label}</p>
                      <p className="text-xs text-muted-foreground">{def.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderManagedInput(def)}
                      <Button size="sm" variant="outline" onClick={() => saveManagedSetting(def)}>
                        Save
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Platform Behavior
                </CardTitle>
                <CardDescription>Performance and audit handling options.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {platformControls.map((def) => (
                  <div key={def.key} className="flex items-center justify-between border rounded-md p-3">
                    <div className="max-w-[64%]">
                      <p className="text-sm font-medium">{def.label}</p>
                      <p className="text-xs text-muted-foreground">{def.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderManagedInput(def)}
                      <Button size="sm" variant="outline" onClick={() => saveManagedSetting(def)}>
                        Save
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="registry">
          <Card>
            <CardHeader>
              <CardTitle>Settings Registry</CardTitle>
              <CardDescription>Raw key-value management for all settings in the database.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <div className="relative min-w-60 flex-1">
                  <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search key/name/description"
                    className="pl-8"
                  />
                </div>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Setting
                </Button>
              </div>

              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSettings.map((setting) => (
                      <TableRow key={setting.id}>
                        <TableCell>
                          <div className="font-medium">{setting.name}</div>
                          <div className="text-xs text-muted-foreground">{setting.key}</div>
                          {setting.description ? (
                            <div className="text-xs text-muted-foreground">{setting.description}</div>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{setting.category || defaultCategory}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{setting.dataType}</Badge>
                        </TableCell>
                        <TableCell>{renderEditor(setting)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => resetOne(setting)} disabled={!isChanged(setting)}>
                            Reset
                          </Button>
                          <Button size="sm" onClick={() => saveOne(setting)} disabled={!isChanged(setting)}>
                            Save
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(setting)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredSettings.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                          No settings found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Add New System Setting</CardTitle>
              <CardDescription>Create custom keys for new modules and feature flags.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Open Create Dialog
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Setting</DialogTitle>
            <DialogDescription>Add a new system setting key/value.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Setting Key</Label>
              <Input
                value={createForm.setting_key}
                onChange={(e) => setCreateForm((p) => ({ ...p, setting_key: e.target.value }))}
                placeholder="e.g. auth_session_timeout_minutes"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select
                  value={createForm.setting_type}
                  onValueChange={(value: SettingType) => setCreateForm((p) => ({ ...p, setting_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="String">String</SelectItem>
                    <SelectItem value="Number">Number</SelectItem>
                    <SelectItem value="Boolean">Boolean</SelectItem>
                    <SelectItem value="JSON">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Input
                  value={createForm.category}
                  onChange={(e) => setCreateForm((p) => ({ ...p, category: e.target.value }))}
                  placeholder="General"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Value</Label>
              <Textarea
                value={createForm.setting_value}
                onChange={(e) => setCreateForm((p) => ({ ...p, setting_value: e.target.value }))}
                rows={3}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={createForm.description || ""}
                onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between border rounded-md p-3">
              <div>
                <p className="text-sm font-medium">Encrypted</p>
                <p className="text-xs text-muted-foreground">Store this value encrypted in DB</p>
              </div>
              <Switch
                checked={Boolean(createForm.is_encrypted)}
                onCheckedChange={(checked) => setCreateForm((p) => ({ ...p, is_encrypted: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Setting
            </DialogTitle>
            <DialogDescription>
              This will permanently remove <code>{deleteTarget?.key}</code> from system settings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
