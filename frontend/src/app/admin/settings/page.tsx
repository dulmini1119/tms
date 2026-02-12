'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner'; // Assuming you use sonner for notifications

import { 
  Settings, 
  Save, 
  RotateCcw, 
  Database, 
  Search, 
  MoreHorizontal,
  Eye,
  Edit,
  Shield,
  Bell,
  Navigation,
  Car,
  DollarSign,
  Globe,
  Archive,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Key,
  Monitor,
  Loader2
} from 'lucide-react';
import { SystemSetting } from '@/types/system-interfaces';
import { VariantProps } from 'class-variance-authority';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// API Endpoint (using rewrite path)
const API_ENDPOINT = '/system-settings';

export default function SystemSettings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('general');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<SystemSetting | null>(null);
  const [settingValues, setSettingValues] = useState<Record<string, unknown>>({});
  const [dialogFormValue, setDialogFormValue] = useState<unknown>(null);
  
  // New State for API
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- FETCH DATA ---
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINT);
      if (!response.ok) throw new Error('Failed to fetch settings');
      
      const result = await response.json();
      
      // Map backend data to frontend interface, adding defaults for missing fields
      const mappedData = (result.data.settings || []).map((s: any) => ({
        id: s.id,
        key: s.key,
        name: s.name || s.key.replace(/_/g, ' '),
        value: s.value,
        dataType: s.dataType || 'String',
        category: s.category || 'General',
        description: s.description || '',
        encrypted: s.encrypted || false,
        editable: s.editable !== false, // Default to true
        visibility: s.visibility || 'Public', // Default since not in DB
        scope: s.scope || 'Global',           // Default since not in DB
        environment: 'Production',
        version: '1.0',
        lastModifiedBy: s.updated_by || 'System',
        lastModifiedAt: s.updated_at || new Date().toISOString(),
        createdAt: s.created_at || new Date().toISOString(),
        defaultValue: s.value // Simplification
      }));

      setSystemSettings(mappedData);

      // Initialize local state for editing
      const initialValues: Record<string, unknown> = {};
      mappedData.forEach((setting: SystemSetting) => {
        initialValues[setting.id] = setting.value;
      });
      setSettingValues(initialValues);

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

  // --- UPDATE DATA ---
  const updateSettingValue = (settingId: string, newValue: unknown) => {
    setSettingValues(prev => ({
      ...prev,
      [settingId]: newValue
    }));
  };

  // Save single setting (from Dialog)
  const handleSaveSingleSetting = async () => {
    if (!selectedSetting) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_ENDPOINT}/${selectedSetting.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setting_value: dialogFormValue })
      });

      if (!response.ok) throw new Error('Update failed');
      
      toast.success(`Setting "${selectedSetting.name}" updated`);
      
      // Update local state
      updateSettingValue(selectedSetting.id, dialogFormValue);
      setSystemSettings(prev => prev.map(s => s.id === selectedSetting.id ? {...s, value: dialogFormValue} : s));
      setIsEditDialogOpen(false);
      
    } catch (error) {
      toast.error("Failed to update setting");
    } finally {
      setSaving(false);
    }
  };

  // Bulk Save (from Header Button)
  const handleSaveAllSettings = async () => {
    setSaving(true);
    toast.info("Saving all settings...");
    
    // Create an array of promises for all changed values
    const updates = systemSettings.map(setting => {
      const currentValue = settingValues[setting.id];
      // Only update if value changed (simple comparison)
      if (JSON.stringify(currentValue) !== JSON.stringify(setting.value)) {
        return fetch(`${API_ENDPOINT}/${setting.key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ setting_value: currentValue })
        });
      }
      return null;
    }).filter(Boolean);

    try {
      await Promise.all(updates);
      toast.success("All settings saved successfully");
      fetchSettings(); // Refresh data
    } catch (error) {
      toast.error("Failed to save some settings");
    } finally {
      setSaving(false);
    }
  };

  const filteredSettings = React.useMemo(() => {
    return systemSettings.filter(setting => {
      return (
        setting.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        setting.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (setting.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      ) &&
      (categoryFilter === 'all' || setting.category.toLowerCase() === categoryFilter);
    });
  }, [systemSettings, searchTerm, categoryFilter]);

  const settingsByCategory = React.useMemo(() => {
    return systemSettings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {} as Record<string, SystemSetting[]>);
  }, [systemSettings]);

  const handleEditSetting = (setting: SystemSetting) => {
    setSelectedSetting(setting);
    setDialogFormValue(settingValues[setting.id] ?? setting.value);
    setIsEditDialogOpen(true);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'General': <Settings className="h-4 w-4" />,
      'Security': <Shield className="h-4 w-4" />,
      'Notifications': <Bell className="h-4 w-4" />,
      'GPS': <Navigation className="h-4 w-4" />,
      'Fleet': <Car className="h-4 w-4" />,
      'Billing': <DollarSign className="h-4 w-4" />,
      'Integration': <Globe className="h-4 w-4" />,
      'Backup': <Database className="h-4 w-4" />
    };
    return icons[category] || <Settings className="h-4 w-4" />;
  };

  const getVisibilityBadge = (visibility: string) => {
    const variants: Record<string, { variant: VariantProps<typeof badgeVariants>['variant']; icon: React.ReactNode }> = {
      'Public': { variant: 'default', icon: <Eye className="h-3 w-3" /> },
      'Admin': { variant: 'secondary', icon: <Shield className="h-3 w-3" /> },
      'System': { variant: 'destructive', icon: <Lock className="h-3 w-3" /> }
    };
    const config = variants[visibility] || variants['Public'];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {visibility}
      </Badge>
    );
  };

  const getScopeBadge = (scope: string) => {
    const variants: Record<string, { variant: VariantProps<typeof badgeVariants>['variant']; icon: React.ReactNode }> = {
      'Global': { variant: 'default', icon: <Globe className="h-3 w-3" /> },
      'Department': { variant: 'secondary', icon: <Shield className="h-3 w-3" /> },
      'User': { variant: 'outline', icon: <Eye className="h-3 w-3" /> }
    };
    const config = variants[scope] || variants['Global'];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {scope}
      </Badge>
    );
  };

  const getDataTypeBadge = (dataType: string) => {
    const variants: Record<string, VariantProps<typeof badgeVariants>['variant']> = {
      String: 'outline',
      Number: 'secondary',
      Boolean: 'default',
      JSON: 'destructive',
      Array: 'secondary',
      Date: 'outline',
    };
    return (
      <Badge variant={variants[dataType] ?? 'outline'}>
        {dataType}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatValue = (value: unknown, dataType: string) => {
    if (dataType === 'Boolean') {
      return value ? 'Enabled' : 'Disabled';
    }
    if (dataType === 'JSON' || dataType === 'Array') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const renderSettingValue = (setting: SystemSetting) => {
    const currentValue = settingValues[setting.id] ?? setting.value;

    if (setting.dataType === 'Boolean') {
      return (
        <div className="flex items-center space-x-2">
          <Switch 
            checked={currentValue as boolean} 
            disabled={!setting.editable}
            onCheckedChange={(checked) => updateSettingValue(setting.id, checked)}
          />
          <span className="text-sm">{currentValue ? 'Enabled' : 'Disabled'}</span>
        </div>
      );
    }
    
    if (setting.dataType === 'Number') {
      return (
        <Input
          type="number"
          value={currentValue as number}
          disabled={!setting.editable}
          className="w-32"
          onChange={(e) => updateSettingValue(setting.id, Number(e.target.value))}
        />
      );
    }

    if (setting.dataType === 'String' && setting.validationRules?.enum) {
      return (
        <Select 
          value={currentValue as string} 
          disabled={!setting.editable}
          onValueChange={(value) => updateSettingValue(setting.id, value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {setting.validationRules.enum.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        value={formatValue(currentValue, setting.dataType)}
        disabled={!setting.editable}
        className="w-48"
        onChange={(e) => updateSettingValue(setting.id, e.target.value)}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className='p-3'>
          <h1 className='text-2xl'>System Settings</h1>
          <p className="text-muted-foreground text-xs">
            Configure system parameters and global settings
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={fetchSettings}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSaveAllSettings} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
        </div>
      </div>

      {/* Settings Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="security">Security & Access</TabsTrigger>
          <TabsTrigger value="system">System Config</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Configuration</CardTitle>
              <CardDescription>
                Basic application settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {settingsByCategory['General']?.map(setting => (
                  <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium">{setting.name}</div>
                        {getDataTypeBadge(setting.dataType)}
                        {setting.encrypted && (
                          <Badge variant="destructive" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Encrypted
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{setting.description}</div>
                      <div className="text-xs text-muted-foreground">
                        Key: {setting.key} | Modified by: {setting.lastModifiedBy.split('@')[0]}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {renderSettingValue(setting)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSetting(setting)}
                        disabled={!setting.editable}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fleet & GPS Configuration</CardTitle>
              <CardDescription>
                Fleet management and GPS tracking settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[...settingsByCategory['GPS'] || [], ...settingsByCategory['Fleet'] || []].map(setting => (
                  <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(setting.category)}
                        <div className="font-medium">{setting.name}</div>
                        {getDataTypeBadge(setting.dataType)}
                      </div>
                      <div className="text-sm text-muted-foreground">{setting.description}</div>
                      <div className="text-xs text-muted-foreground">
                        Default: {formatValue(setting.defaultValue, setting.dataType)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {renderSettingValue(setting)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSetting(setting)}
                        disabled={!setting.editable}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security & Access Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
              <CardDescription>
                Authentication, authorization, and security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {settingsByCategory['Security']?.map(setting => (
                  <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-red-500" />
                        <div className="font-medium">{setting.name}</div>
                        {getDataTypeBadge(setting.dataType)}
                        {getVisibilityBadge(setting.visibility)}
                      </div>
                      <div className="text-sm text-muted-foreground">{setting.description}</div>
                      <div className="text-xs text-muted-foreground">
                        Version: {setting.version} | Environment: {setting.environment}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {renderSettingValue(setting)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSetting(setting)}
                        disabled={!setting.editable}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
              <CardDescription>
                User permissions and access level settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-medium">Public Settings</div>
                          <div className="text-sm text-muted-foreground">
                            {systemSettings.filter(s => s.visibility === 'Public').length} settings
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-yellow-500" />
                        <div>
                          <div className="font-medium">Admin Only</div>
                          <div className="text-sm text-muted-foreground">
                            {systemSettings.filter(s => s.visibility === 'Admin').length} settings
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Lock className="h-5 w-5 text-red-500" />
                        <div>
                          <div className="font-medium">System Level</div>
                          <div className="text-sm text-muted-foreground">
                            {systemSettings.filter(s => s.visibility === 'System').length} settings
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Config Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All System Settings</CardTitle>
              <CardDescription>
                Complete list of system configuration parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex items-center space-x-4 mb-6 flex-wrap gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search settings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.keys(settingsByCategory).map(cat => (
                       <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block rounded-md border border-border">
                <Table className='table-auto'>
                  <TableHeader className="top-0 bg-background">
                    <TableRow>
                      <TableHead>Setting Details</TableHead>
                      <TableHead>Current Value</TableHead>
                      <TableHead>Data Type & Scope</TableHead>
                      <TableHead>Access & Security</TableHead>
                      <TableHead>Modification Info</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSettings.map((setting) => (
                      <TableRow key={setting.id}>
                        <TableCell className='break-words whitespace-normal'>
                          <div className="space-y-1">
                            <div className="font-medium flex items-center">
                              {getCategoryIcon(setting.category)}
                              <span className="ml-2">{setting.name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {setting.description}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Key: {setting.key}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {setting.category}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-mono">
                              {formatValue(setting.value, setting.dataType)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Default: {formatValue(setting.defaultValue, setting.dataType)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getDataTypeBadge(setting.dataType)}
                            {getScopeBadge(setting.scope)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getVisibilityBadge(setting.visibility)}
                            {setting.editable ? (
                              <Badge variant="default" className="text-xs">
                                <Unlock className="h-3 w-3 mr-1" />
                                Editable
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">
                                <Lock className="h-3 w-3 mr-1" />
                                Read Only
                              </Badge>
                            )}
                            {setting.encrypted && (
                              <Badge variant="destructive" className="text-xs">
                                <Key className="h-3 w-3 mr-1" />
                                Encrypted
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              By: {setting.lastModifiedBy.split("@")[0]}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              At: {formatDate(setting.lastModifiedAt)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditSetting(setting)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Setting
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View History
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                 {filteredSettings.map((setting) => (
                   <div key={setting.id} className="border p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                         <span className="font-medium">{setting.name}</span>
                         <Button size="sm" variant="ghost" onClick={() => handleEditSetting(setting)}><Edit className="h-3 w-3"/></Button>
                      </div>
                      <div className="text-sm text-muted-foreground">{setting.description}</div>
                      <div className="font-mono text-sm bg-muted p-2 rounded">{formatValue(setting.value, setting.dataType)}</div>
                   </div>
                 ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
           {/* Keep existing maintenance content, or remove if not needed */}
        </TabsContent>
      </Tabs>

      {/* Edit Setting Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit System Setting</DialogTitle>
            <DialogDescription>
              {selectedSetting && (
                <>
                  Modify the configuration for {selectedSetting.name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedSetting && (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Setting Name: {selectedSetting.name}</div>
                  <div>Data Type: {selectedSetting.dataType}</div>
                  <div>Category: {selectedSetting.category}</div>
                  <div>Scope: {selectedSetting.scope}</div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                    {selectedSetting.description}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Current Value</Label>
                  {selectedSetting.dataType === 'Boolean' ? (
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={dialogFormValue as boolean} 
                        onCheckedChange={setDialogFormValue}
                      />
                      <span>{dialogFormValue ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  ) : selectedSetting.dataType === 'Number' ? (
                    <Input
                      type="number"
                      value={dialogFormValue as number}
                      onChange={(e) => setDialogFormValue(Number(e.target.value))}
                    />
                  ) : (
                    <Input 
                      value={dialogFormValue as string} 
                      onChange={(e) => setDialogFormValue(e.target.value)}
                    />
                  )}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSingleSetting} disabled={saving}>
               {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
               Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}