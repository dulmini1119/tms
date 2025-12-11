'use client'
import React, { useState } from 'react';


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
  Monitor
} from 'lucide-react';
import { SystemSetting } from '@/types/system-interfaces';
import { mockSystemData } from '@/data/mock-system-data';
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


export default function SystemSettings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('general');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<SystemSetting | null>(null);
  const [settingValues, setSettingValues] = useState<Record<string, unknown>>({});
  const [dialogFormValue, setDialogFormValue] = useState<unknown>(null);

  // Get system settings data
  const systemSettings = mockSystemData.systemSettings;

  // Initialize setting values - memoized for performance
  React.useEffect(() => {
    const initialValues: Record<string, unknown> = {};
    systemSettings.forEach(setting => {
      initialValues[setting.id] = setting.value;
    });
    setSettingValues(initialValues);
  }, [systemSettings]);

  const updateSettingValue = (settingId: string, newValue: unknown) => {
    setSettingValues(prev => ({
      ...prev,
      [settingId]: newValue
    }));
  };

  const filteredSettings = React.useMemo(() => {
    return systemSettings.filter(setting => {
      return (
        setting.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        setting.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        setting.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) &&
      (categoryFilter === 'all' || setting.category.toLowerCase() === categoryFilter);
    });
  }, [systemSettings, searchTerm, categoryFilter]);

  // Group settings by category - memoized for performance
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
    const icons = {
      'General': <Settings className="h-4 w-4" />,
      'Security': <Shield className="h-4 w-4" />,
      'Notifications': <Bell className="h-4 w-4" />,
      'GPS': <Navigation className="h-4 w-4" />,
      'Fleet': <Car className="h-4 w-4" />,
      'Billing': <DollarSign className="h-4 w-4" />,
      'Integration': <Globe className="h-4 w-4" />,
      'Backup': <Database className="h-4 w-4" />
    };
    return icons[category as keyof typeof icons] || <Settings className="h-4 w-4" />;
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
          <Button variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
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
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="security">Security</SelectItem>
            <SelectItem value="notifications">Notifications</SelectItem>
            <SelectItem value="gps">GPS</SelectItem>
            <SelectItem value="fleet">Fleet</SelectItem>
            <SelectItem value="billing">Billing</SelectItem>
            <SelectItem value="integration">Integration</SelectItem>
            <SelectItem value="backup">Backup</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ✅ Desktop Table */}
      <div className="hidden md:block rounded-md border border-border">
        <Table className='table-auto'>
          <TableHeader className=" top-0 bg-background">
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
                {/* Setting Details */}
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

                {/* Current Value */}
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm font-mono">
                      {formatValue(setting.value, setting.dataType)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Default:{" "}
                      {formatValue(setting.defaultValue, setting.dataType)}
                    </div>
                    {setting.validationRules && (
                      <div className="text-xs text-muted-foreground">
                        {setting.validationRules.required && "Required "}
                        {setting.validationRules.minValue &&
                          `Min: ${setting.validationRules.minValue} `}
                        {setting.validationRules.maxValue &&
                          `Max: ${setting.validationRules.maxValue}`}
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Data Type & Scope */}
                <TableCell>
                  <div className="space-y-1">
                    {getDataTypeBadge(setting.dataType)}
                    {getScopeBadge(setting.scope)}
                    <div className="text-xs text-muted-foreground">
                      Version: {setting.version}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Env: {setting.environment}
                    </div>
                  </div>
                </TableCell>

                {/* Access & Security */}
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

                {/* Modification Info */}
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      By: {setting.lastModifiedBy.split("@")[0]}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      At: {formatDate(setting.lastModifiedAt)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created: {formatDate(setting.createdAt)}
                    </div>
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleEditSetting(setting)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Setting
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View History
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset to Default
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Export Setting
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 📱 Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredSettings.map((setting) => (
          <div
            key={setting.id}
            className="border border-border rounded-lg p-4 shadow-sm bg-background space-y-2"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium flex items-center">
                  {getCategoryIcon(setting.category)}
                  <span className="ml-2">{setting.name}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {setting.description}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditSetting(setting)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    History
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="text-sm font-mono">
              {formatValue(setting.value, setting.dataType)}
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {getDataTypeBadge(setting.dataType)}
              {getScopeBadge(setting.scope)}
              {getVisibilityBadge(setting.visibility)}
            </div>

            <div className="text-xs text-muted-foreground">
              Modified by: {setting.lastModifiedBy.split("@")[0]}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
</TabsContent>


        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Maintenance</CardTitle>
              <CardDescription>
                Backup, restore, and system maintenance operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Database className="h-5 w-5 mr-2" />
                      Data Backup
                    </CardTitle>
                    <CardDescription>
                      Create and manage system backups
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto Backup</span>
                      <Switch 
                        checked={true} 
                        onCheckedChange={(checked) => console.log('Auto backup:', checked)}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last backup: 2 hours ago
                    </div>
                    <div className="space-x-2">
                      <Button>
                        <Archive className="h-4 w-4 mr-2" />
                        Create Backup
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Upload className="h-5 w-5 mr-2" />
                      Data Restore
                    </CardTitle>
                    <CardDescription>
                      Restore system from backup
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Drop backup file here or click to browse
                      </p>
                    </div>
                    <Button variant="outline" className="w-full">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore from Backup
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Monitor className="h-5 w-5 mr-2" />
                      System Health
                    </CardTitle>
                    <CardDescription>
                      Monitor system performance and status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Database</span>
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Healthy
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">GPS Service</span>
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Healthy
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">File Storage</span>
                        <Badge variant="secondary">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Warning
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Monitor className="h-4 w-4 mr-2" />
                      View Full Report
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      System Actions
                    </CardTitle>
                    <CardDescription>
                      Perform system-wide operations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Clear Cache
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Database className="h-4 w-4 mr-2" />
                      Optimize Database
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Export Logs
                    </Button>
                    <Button variant="destructive" className="w-full">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      System Restart
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
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
                      min={selectedSetting.validationRules?.minValue}
                      max={selectedSetting.validationRules?.maxValue}
                    />
                  ) : selectedSetting.validationRules?.enum ? (
                    <Select value={dialogFormValue as string} onValueChange={setDialogFormValue}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedSetting.validationRules.enum.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input 
                      value={dialogFormValue as string} 
                      onChange={(e) => setDialogFormValue(e.target.value)}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Default Value</Label>
                  <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                    {formatValue(selectedSetting.defaultValue, selectedSetting.dataType)}
                  </div>
                </div>
                {selectedSetting.validationRules && (
                  <div className="space-y-2">
                    <Label>Validation Rules</Label>
                    <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                      {JSON.stringify(selectedSetting.validationRules, null, 2)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (selectedSetting) {
                updateSettingValue(selectedSetting.id, dialogFormValue);
              }
              setIsEditDialogOpen(false);
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

