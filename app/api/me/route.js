// app/api/me/route.js
import { cookies } from "next/headers";
import { prisma } from "../../prisma";

function jsonSafe(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.users.findUnique({
    where: { id: BigInt(userId) },
    select: {
      id: true,
      full_name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    // cookie is stale / invalid
    return Response.json({ error: "User not found" }, { status: 401 });
  }

  return Response.json(jsonSafe({ user }));
}
