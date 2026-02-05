const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if database already has data
  const existingUsers = await prisma.users.count();
  if (existingUsers > 0) {
    console.log('✅ Database already contains data. Skipping seed.');
    return;
  }

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  // Create Admin User
  console.log('👤 Creating admin user...');
  const admin = await prisma.users.create({
    data: {
      email: 'admin@booking.com',
      full_name: 'System Administrator',
      role: 'admin',
      password_hash: adminPassword,
    },
  });
  console.log('✅ Admin created:', admin.email);

  // Create Staff Users with profiles
  console.log('👨‍⚕️ Creating staff users...');
  
  const drJohnson = await prisma.users.create({
    data: {
      email: 'sarah.johnson@booking.com',
      full_name: 'Dr. Sarah Johnson',
      role: 'staff',
      password_hash: staffPassword,
      staff: {
        create: {
          specialty: 'Cardiology',
          title: 'MD, FACC',
          bio: 'Board-certified cardiologist with over 15 years of experience in treating heart conditions.',
          mon_start: new Date('1970-01-01T09:00:00Z'),
          mon_end: new Date('1970-01-01T17:00:00Z'),
          tue_start: new Date('1970-01-01T09:00:00Z'),
          tue_end: new Date('1970-01-01T17:00:00Z'),
          wed_start: new Date('1970-01-01T09:00:00Z'),
          wed_end: new Date('1970-01-01T17:00:00Z'),
          thu_start: new Date('1970-01-01T09:00:00Z'),
          thu_end: new Date('1970-01-01T17:00:00Z'),
          fri_start: new Date('1970-01-01T09:00:00Z'),
          fri_end: new Date('1970-01-01T17:00:00Z'),
        },
      },
    },
  });
  console.log('✅ Staff created:', drJohnson.email);

  const drSmith = await prisma.users.create({
    data: {
      email: 'michael.smith@booking.com',
      full_name: 'Dr. Michael Smith',
      role: 'staff',
      password_hash: staffPassword,
      staff: {
        create: {
          specialty: 'Pediatrics',
          title: 'MD, FAAP',
          bio: 'Dedicated pediatrician specializing in child healthcare and development.',
          mon_start: new Date('1970-01-01T10:00:00Z'),
          mon_end: new Date('1970-01-01T18:00:00Z'),
          tue_start: new Date('1970-01-01T10:00:00Z'),
          tue_end: new Date('1970-01-01T18:00:00Z'),
          wed_start: new Date('1970-01-01T10:00:00Z'),
          wed_end: new Date('1970-01-01T18:00:00Z'),
          thu_start: new Date('1970-01-01T10:00:00Z'),
          thu_end: new Date('1970-01-01T18:00:00Z'),
          fri_start: new Date('1970-01-01T10:00:00Z'),
          fri_end: new Date('1970-01-01T18:00:00Z'),
        },
      },
    },
  });
  console.log('✅ Staff created:', drSmith.email);

  const drWilliams = await prisma.users.create({
    data: {
      email: 'emily.williams@booking.com',
      full_name: 'Dr. Emily Williams',
      role: 'staff',
      password_hash: staffPassword,
      staff: {
        create: {
          specialty: 'Dermatology',
          title: 'MD, PhD',
          bio: 'Expert dermatologist focused on skin health and cosmetic procedures.',
          mon_start: new Date('1970-01-01T08:00:00Z'),
          mon_end: new Date('1970-01-01T16:00:00Z'),
          tue_start: new Date('1970-01-01T08:00:00Z'),
          tue_end: new Date('1970-01-01T16:00:00Z'),
          wed_start: new Date('1970-01-01T08:00:00Z'),
          wed_end: new Date('1970-01-01T16:00:00Z'),
          thu_start: new Date('1970-01-01T08:00:00Z'),
          thu_end: new Date('1970-01-01T16:00:00Z'),
          fri_start: new Date('1970-01-01T08:00:00Z'),
          fri_end: new Date('1970-01-01T16:00:00Z'),
        },
      },
    },
  });
  console.log('✅ Staff created:', drWilliams.email);

  // Create Regular Users (customers)
  console.log('👥 Creating customer users...');
  
  const customer1 = await prisma.users.create({
    data: {
      email: 'john.doe@example.com',
      full_name: 'John Doe',
      role: 'user',
      password_hash: userPassword,
    },
  });
  console.log('✅ Customer created:', customer1.email);

  const customer2 = await prisma.users.create({
    data: {
      email: 'jane.smith@example.com',
      full_name: 'Jane Smith',
      role: 'user',
      password_hash: userPassword,
    },
  });
  console.log('✅ Customer created:', customer2.email);

  // Create Sample Appointments
  console.log('📅 Creating sample appointments...');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(11, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 0, 0, 0);
  
  const nextWeekEnd = new Date(nextWeek);
  nextWeekEnd.setHours(15, 0, 0, 0);

  await prisma.appointments.create({
    data: {
      customer_id: customer1.id,
      staff_id: drJohnson.id,
      starts_at: tomorrow,
      ends_at: tomorrowEnd,
      status: 'approved',
    },
  });

  await prisma.appointments.create({
    data: {
      customer_id: customer2.id,
      staff_id: drSmith.id,
      starts_at: nextWeek,
      ends_at: nextWeekEnd,
      status: 'pending',
    },
  });

  console.log('✅ Sample appointments created');

  console.log('\n🎉 Database seeding completed successfully!\n');
  console.log('📋 Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:');
  console.log('  Email: admin@booking.com');
  console.log('  Password: admin123');
  console.log('');
  console.log('Staff (Dr. Sarah Johnson):');
  console.log('  Email: sarah.johnson@booking.com');
  console.log('  Password: staff123');
  console.log('');
  console.log('Staff (Dr. Michael Smith):');
  console.log('  Email: michael.smith@booking.com');
  console.log('  Password: staff123');
  console.log('');
  console.log('Staff (Dr. Emily Williams):');
  console.log('  Email: emily.williams@booking.com');
  console.log('  Password: staff123');
  console.log('');
  console.log('Customer (John Doe):');
  console.log('  Email: john.doe@example.com');
  console.log('  Password: user123');
  console.log('');
  console.log('Customer (Jane Smith):');
  console.log('  Email: jane.smith@example.com');
  console.log('  Password: user123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
