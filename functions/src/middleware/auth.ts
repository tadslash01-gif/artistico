import { auth } from "../index";

export async function verifyAuth(
  req: { headers: Record<string, any> }
): Promise<{ uid: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decoded = await auth.verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}
