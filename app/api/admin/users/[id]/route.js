import { prisma } from "../../../../prisma";

export async function DELETE(_req, { params }) {
  try {
    const idNum = Number(params.id);
    if (!Number.isInteger(idNum)) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }

    // If your ID column is BigInt, Prisma expects BigInt here:
    const id = BigInt(idNum);

    await prisma.users.delete({ where: { id } });

    return Response.json({ ok: true, deletedId: idNum });
  } catch (err) {
    // Prisma "record not found"
    if (err?.code === "P2025") {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    console.error("DELETE USER ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
