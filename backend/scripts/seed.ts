import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting database seed...\n');

  // 1. ROLES + LEVEL
  const roles = [
    { name: 'Super Admin',       code: 'superadmin',     level: 99 },
    { name: 'Vehicle Admin',     code: 'vehicleadmin',   level: 80 },
    { name: 'Manager',           code: 'manager',        level: 70 },
    { name: 'Head of Department',code: 'hod',            level: 65 },
    { name: 'Employee',          code: 'employee',       level: 30 },
    { name: 'Driver',            code: 'driver',         level: 20 },
  ];

  for (const r of roles) {
    await prisma.roles.upsert({
      where: { code: r.code },
      update: { name: r.name, level: r.level },
      create: {
        name: r.name,
        code: r.code,
        level: r.level,
        status: 'Active',
        description: r.name === 'Super Admin' ? 'Full system access' : null,
      },
    });
    console.log(`Role created: ${r.name} (level: ${r.level})`);
  }

  // 2. ALL 16 PERMISSIONS
  const permissions = [
    { name: 'Create Users', code: 'user_create', module: 'Users', action: 'create', resource: 'users' },
    { name: 'Edit Users',   code: 'user_edit',   module: 'Users', action: 'update', resource: 'users' },
    { name: 'Delete Users', code: 'user_delete', module: 'Users', action: 'delete', resource: 'users' },
    { name: 'View Users',   code: 'user_view',   module: 'Users', action: 'read',   resource: 'users' },

    { name: 'Create Vehicles', code: 'vehicle_create', module: 'Vehicles', action: 'create', resource: 'vehicles' },
    { name: 'Edit Vehicles',   code: 'vehicle_edit',   module: 'Vehicles', action: 'update', resource: 'vehicles' },
    { name: 'Delete Vehicles', code: 'vehicle_delete', module: 'Vehicles', action: 'delete', resource: 'vehicles' },
    { name: 'View Vehicles',   code: 'vehicle_view',   module: 'Vehicles', action: 'read',   resource: 'vehicles' },

    { name: 'Request Trip',  code: 'trip_request',  module: 'Trips', action: 'create', resource: 'trips' },
    { name: 'Approve Trip',  code: 'trip_approve',  module: 'Trips', action: 'approve', resource: 'trips' },
    { name: 'Assign Trip',   code: 'trip_assign',   module: 'Trips', action: 'assign', resource: 'trips' },
    { name: 'Execute Trip',  code: 'trip_execute',  module: 'Trips', action: 'execute', resource: 'trips' },

    { name: 'View Reports',  code: 'reports_view',    module: 'Reports', action: 'read',   resource: 'reports' },
    { name: 'Export Reports',code: 'reports_export',  module: 'Reports', action: 'export', resource: 'reports' },

    { name: 'Manage Settings', code: 'settings_manage', module: 'Settings', action: 'manage', resource: 'settings' },
    { name: 'View Audit Logs', code: 'audit_view',      module: 'Audit',    action: 'read',   resource: 'audit_logs' },
  ];

  for (const p of permissions) {
    await prisma.permissions.upsert({
      where: { code: p.code },
      update: { name: p.name },
      create: p,
    });
    console.log(`Permission: ${p.name} → ${p.code}`);
  }

  // 3. USERS + ASSIGN ROLES
  const users = [
    { email: 'superadmin@lkcompany.com',     password: 'admin123',      first: 'Super',     last: 'Admin',     role: 'superadmin' },
    { email: 'vehicleadmin@lkcompany.com',   password: 'Vehicle@123',   first: 'Vehicle',   last: 'Admin',     role: 'vehicleadmin' },
    { email: 'manager@lkcompany.com',        password: 'Manager@123',   first: 'Manager',   last: 'User',      role: 'manager' },
    { email: 'hod@lkcompany.com',            password: 'Hod@123',       first: 'Head',      last: 'Department',role: 'hod' },
    { email: 'employee@lkcompany.com',       password: 'Employee@123',  first: 'Regular',   last: 'Employee',  role: 'employee' },
    { email: 'driver@lkcompany.com',         password: 'Driver@123',    first: 'Sri',       last: 'Driver',    role: 'driver' },
  ];

  const superAdminUser = await prisma.users.findUnique({ where: { email: 'superadmin@lkcompany.com' } });

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 12);
    const user = await prisma.users.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email.toLowerCase(),
        password_hash: hashed,
        first_name: u.first,
        last_name: u.last,
        employee_id: `EMP${String(users.indexOf(u) + 1).padStart(3, '0')}`,
        status: 'Active',
        position: u.role.toUpperCase(),
      },
    });

    const role = await prisma.roles.findUnique({ where: { code: u.role } });
    if (role) {
      await prisma.user_roles.upsert({
        where: { user_id_role_id: { user_id: user.id, role_id: role.id } },
        update: {},
        create: { user_id: user.id, role_id: role.id, status: 'Active' },
      });
    }
    console.log(`User: ${u.email} → ${u.role}`);
  }

  // 4. ASSIGN PERMISSIONS TO ROLES (UUID → UUID)
  const rolePermMap: Record<string, string[]> = {
    superadmin:   permissions.map(p => p.code),
    vehicleadmin: ['vehicle_create','vehicle_edit','vehicle_delete','vehicle_view','trip_assign','trip_execute','user_view'],
    manager:      ['user_view','trip_approve','trip_assign','reports_view','reports_export'],
    hod:          ['user_view','trip_approve','reports_view','reports_export'],
    employee:     ['trip_request','user_view'],
    driver:       ['trip_execute','user_view'],
  };

  for (const [code, codes] of Object.entries(rolePermMap)) {
    const role = await prisma.roles.findUnique({ where: { code } });
    if (!role) continue;

    await prisma.role_permissions.deleteMany({ where: { role_id: role.id } });

    const perms = await prisma.permissions.findMany({
      where: { code: { in: codes } },
      select: { id: true },
    });

    if (perms.length > 0) {
      await prisma.role_permissions.createMany({
        data: perms.map(p => ({
          role_id: role.id,
          permission_id: p.id,
          assigned_by: superAdminUser?.id ,
        })),
        skipDuplicates: true,
      });
    }
    console.log(`${role.name}: ${codes.length} permissions assigned`);
  }

  console.log('\n🎉 SEED COMPLETED SUCCESSFULLY!');
  console.log('Login → superadmin@lkcompany.com / admin123');
}

main()
  .catch(e => {
    console.error('SEED FAILED:', e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());