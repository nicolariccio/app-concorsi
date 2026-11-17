import { NextResponse, type NextRequest } from "next/server";

// Passa alle pagine admin il percorso richiesto: dopo il login si torna lì (es. alla carta appena inquadrata).
export function middleware(req: NextRequest) {
  const h = new Headers(req.headers);
  h.set("x-admin-path", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: h } });
}

export const config = { matcher: ["/admin/:path*"] };
