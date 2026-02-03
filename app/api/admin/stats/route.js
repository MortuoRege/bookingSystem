import { prisma } from "../../../prisma";

function jsonSafe(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}

export async function GET() {
  try {
    const [usersCount, staffCount, appointmentsCount] = await Promise.all([
      prisma.users.count({ where: { role: "user" } }),
      prisma.users.count({ where: { role: "staff" } }),
      prisma.appointments.count(),
    ]);

    // Get appointments by status
    const [pendingCount, approvedCount, completedCount, cancelledCount] = await Promise.all([
      prisma.appointments.count({ where: { status: "pending" } }),
      prisma.appointments.count({ where: { status: "approved" } }),
      prisma.appointments.count({ where: { status: "completed" } }),
      prisma.appointments.count({ where: { status: "cancelled" } }),
    ]);

    const userList = await prisma.users.findMany({
      where: { role: "user" },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
      },
      orderBy: { id: "asc" },
    });

    // join users -> staff
    const staffList = await prisma.users.findMany({
      where: { role: "staff" },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        staff: {
          select: { specialty: true },
        },
      },
      orderBy: { id: "asc" },
    });

    // Get recent activity (last 10 events)
    const recentAppointments = await prisma.appointments.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
      include: {
        users_appointments_customer_idTousers: {
          select: { full_name: true },
        },
        users_appointments_staff_idTousers: {
          select: { full_name: true },
        },
      },
    });

    const recentUsers = await prisma.users.findMany({
      where: { role: "user" },
      take: 5,
      orderBy: { id: "desc" },
      select: {
        id: true,
        full_name: true,
        created_at: true,
      },
    });

    // Format recent activity
    const recentActivity = [];

    // Add recent user registrations
    recentUsers.forEach((user) => {
      recentActivity.push({
        type: "user_registered",
        title: "New user registered",
        meta: user.full_name,
        timestamp: user.created_at,
      });
    });

    // Add recent appointments
    recentAppointments.forEach((apt) => {
      recentActivity.push({
        type: "appointment_created",
        title: "Appointment booked",
        meta: `${apt.users_appointments_customer_idTousers.full_name} with ${apt.users_appointments_staff_idTousers.full_name}`,
        timestamp: apt.created_at,
      });
    });

    // Sort by timestamp and take the 10 most recent
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const topActivity = recentActivity.slice(0, 10);

    // Calculate system status metrics
    const totalProviders = staffCount;
    const activeProviders = staffList.filter(s => s.staff?.specialty).length;
    const providerAvailability = totalProviders > 0 
      ? Math.round((activeProviders / totalProviders) * 100)
      : 0;

    const totalAppointments = appointmentsCount;
    const completedAppointments = completedCount;
    const appointmentCompletion = totalAppointments > 0
      ? Math.round((completedAppointments / totalAppointments) * 100)
      : 0;

    const totalUsers = usersCount;
    const usersWithAppointments = await prisma.users.count({
      where: {
        role: "user",
        appointments_appointments_customer_idTousers: {
          some: {},
        },
      },
    });
    const userActivity = totalUsers > 0
      ? Math.round((usersWithAppointments / totalUsers) * 100)
      : 0;

    // Shape output
    const payload = {
      users: usersCount,
      staff: staffCount,
      appointments: appointmentsCount,
      appointmentsByStatus: {
        pending: pendingCount,
        approved: approvedCount,
        completed: completedCount,
        cancelled: cancelledCount,
      },
      recentActivity: topActivity,
      systemStatus: {
        userActivity,
        providerAvailability,
        appointmentCompletion,
      },
      userList: userList.map((u) => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        role: u.role,
      })),
      staffList: staffList.map((u) => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        role: u.role,
        specialty: u.staff?.specialty ?? null,
      })),
    };

    return Response.json(jsonSafe(payload));
  } catch (err) {
    console.error("ADMIN STATS ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
