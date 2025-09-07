import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { credentials } = body

    if (!credentials?.client_id || !credentials?.client_secret) {
      return NextResponse.json({ success: false, error: "Gmail credentials are required" }, { status: 400 })
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/gmail/callback`
    const scopes = [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.readonly",
    ].join(" ")

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      new URLSearchParams({
        client_id: credentials.client_id,
        redirect_uri: redirectUri,
        scope: scopes,
        response_type: "code",
        access_type: "offline",
        prompt: "consent",
      }).toString()

    return NextResponse.json({
      success: true,
      authUrl,
      message: "Authentication URL generated successfully",
    })
  } catch (error) {
    console.error("Gmail auth error:", error)
    return NextResponse.json({ success: false, error: "Failed to generate auth URL" }, { status: 500 })
  }
}
