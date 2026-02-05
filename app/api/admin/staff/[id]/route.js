import { prisma } from "../../../../prisma";
import { requireRoleAPI } from "../../../../lib/auth-api";

export async function PUT(req, ctx) {
  // Require admin role
  const authResult = await requireRoleAPI(["admin"]);
  if (authResult.error) {
    return authResult.response;
  }

  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const { fullName, specialty, title, bio } = body;

    const idNum = Number(id);
    if (!Number.isInteger(idNum)) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }

    // Find the user to verify they're staff
    const user = await prisma.users.findUnique({
      where: { id: BigInt(idNum) },
      include: {
        staff: true,
      },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
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

    // Update user's full_name if provided
    if (fullName) {
      await prisma.users.update({
        where: { id: BigInt(idNum) },
        data: { full_name: fullName },
      });
    }

    // Update staff profile
    await prisma.staff.update({
      where: { user_id: BigInt(idNum) },
      data: {
        specialty: specialty || user.staff.specialty,
        title: title !== undefined ? title : user.staff.title,
        bio: bio !== undefined ? bio : user.staff.bio,
      },
    });

    return Response.json({
      ok: true,
      message: "Staff profile updated successfully",
    });
  } catch (err) {
    console.error("UPDATE STAFF ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
