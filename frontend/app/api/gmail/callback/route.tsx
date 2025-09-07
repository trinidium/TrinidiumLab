import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      return new NextResponse(
        `
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'GMAIL_AUTH_ERROR', error: '${error}' }, '${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}');
              window.close();
            </script>
          </body>
        </html>
      `,
        { headers: { "Content-Type": "text/html" } },
      )
    }

    if (!code) {
      return new NextResponse(
        `
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'GMAIL_AUTH_ERROR', error: 'no_code' }, '${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}');
              window.close();
            </script>
          </body>
        </html>
      `,
        { headers: { "Content-Type": "text/html" } },
      )
    }

    // TODO: In production, retrieve client credentials from secure storage
    // For now, this is a placeholder that generates a mock token

    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GMAIL_CLIENT_ID || "your_client_id",
        client_secret: process.env.GMAIL_CLIENT_SECRET || "your_client_secret",
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/gmail/callback`,
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      // Fallback to mock token for development
      const mockToken = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      return new NextResponse(
        `
        <html>
          <body>
            <script>
              window.opener.postMessage({ 
                type: 'GMAIL_AUTH_SUCCESS', 
                token: '${mockToken}',
                mock: true 
              }, '${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}');
              window.close();
            </script>
          </body>
        </html>
      `,
        { headers: { "Content-Type": "text/html" } },
      )
    }

    const tokens = await tokenResponse.json()

    // TODO: Store tokens securely in database
    // await storeTokensInDatabase(tokens)

    return new NextResponse(
      `
      <html>
        <body>
          <script>
            window.opener.postMessage({ 
              type: 'GMAIL_AUTH_SUCCESS', 
              token: '${tokens.access_token}',
              refresh_token: '${tokens.refresh_token}',
              expires_in: ${tokens.expires_in}
            }, '${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}');
            window.close();
          </script>
        </body>
      </html>
    `,
      { headers: { "Content-Type": "text/html" } },
    )
  } catch (error) {
    console.error("Gmail OAuth callback error:", error)
    return new NextResponse(
      `
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'GMAIL_AUTH_ERROR', error: 'server_error' }, '${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}');
            window.close();
          </script>
        </body>
      </html>
    `,
      { headers: { "Content-Type": "text/html" } },
    )
  }
}
