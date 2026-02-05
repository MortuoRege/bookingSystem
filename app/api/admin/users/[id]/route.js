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
    const { fullName } = body;

    const idNum = Number(id);
    if (!Number.isInteger(idNum)) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }

    if (!fullName || !fullName.trim()) {
      return Response.json({ error: "Full name is required" }, { status: 400 });
    }

    // Update user's full_name
    await prisma.users.update({
      where: { id: BigInt(idNum) },
      data: { full_name: fullName },
    });

    return Response.json({
      ok: true,
      message: "User updated successfully",
    });
  } catch (err) {
    if (err?.code === "P2025") {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    console.error("UPDATE USER ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req, ctx) {
  // Require admin role
  const authResult = await requireRoleAPI(["admin"]);
  if (authResult.error) {
    return authResult.response;
  }

  try {
    const { id } = await ctx.params; // params is a Promise in Next 16

    const idNum = Number(id);
    if (!Number.isInteger(idNum)) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }

    await prisma.users.delete({
      where: { id: BigInt(idNum) }, // if your prisma id is BigInt
      // where: { id: idNum },      // <-- use this instead if your prisma id is Int
    });

    return Response.json({ ok: true, deletedId: idNum });
  } catch (err) {
    if (err?.code === "P2025") {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    console.error("DELETE USER ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
