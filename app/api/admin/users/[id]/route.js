import { prisma } from "../../../../prisma";

export async function DELETE(_req, ctx) {
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
