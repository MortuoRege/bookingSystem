import { prisma } from "../../../prisma";

function jsonSafe(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return Response.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    // Fetch user data with staff information
    const user = await prisma.users.findUnique({
      where: { id: BigInt(userId) },
      include: {
        staff: true,
      },
    });

    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    if (user.role !== "staff") {
      return Response.json(
        { error: "User is not a staff member" },
        { status: 403 },
      );
    }

    if (!user.staff) {
      return Response.json(
        { error: "Staff profile not found" },
        { status: 404 },
      );
    }

    const profile = {
      name: user.full_name,
      email: user.email,
      specialty: user.staff.specialty,
      title: user.staff.title,
      bio: user.staff.bio,
    };

    return Response.json(jsonSafe({ profile }));
  } catch (err) {
    console.error("FETCH STAFF PROFILE ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
