import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Returns the backend session JWT for mobile deep-link handoff.
 * Cookie stays httpOnly on web; this endpoint is only used by the
 * same-origin mobile-bridge page after NextAuth completes.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { token },
    });
  } catch (error) {
    console.error("mobile-session error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
