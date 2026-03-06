import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizePhone } from "@/lib/phone";

export async function POST(request: Request) {
  const { phone } = (await request.json()) as { phone: string };

  const sanitized = sanitizePhone(phone);
  if (!sanitized) {
    return NextResponse.json(
      { available: false, reason: "Invalid Nigerian phone number." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Check users table
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("phone", sanitized)
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { available: false, reason: "Unable to verify phone number." },
      { status: 500 }
    );
  }

  if (data) {
    return NextResponse.json(
      { available: false, reason: "This phone number is already registered." },
      { status: 200 }
    );
  }

  return NextResponse.json({ available: true }, { status: 200 });
}
