import { NextResponse } from "next/server";

// This endpoint handles the OAuth callback from Shopify
// It exchanges the authorization code for a permanent access token
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const shop = url.searchParams.get("shop");
  const hmac = url.searchParams.get("hmac");

  if (!code || !shop) {
    return new NextResponse(
      renderHTML("Error", "Missing code or shop parameter in callback URL."),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new NextResponse(
      renderHTML(
        "Missing Environment Variables",
        "Please set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET in your Vercel Vars."
      ),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  try {
    // Exchange authorization code for permanent access token
    const tokenRes = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      }
    );

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return new NextResponse(
        renderHTML(
          "Token Exchange Failed",
          `Shopify returned HTTP ${tokenRes.status}: ${errText}`
        ),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const scope = tokenData.scope;

    return new NextResponse(
      renderHTML(
        "Shopify Admin API Token Obtained!",
        `
        <div style="background:#f0fdf4;border:2px solid #4A7C59;border-radius:12px;padding:24px;margin:16px 0">
          <p style="color:#4A7C59;font-weight:600;margin:0 0 8px">Your Admin API Access Token:</p>
          <code style="display:block;background:#1a1a1a;color:#4ADE80;padding:16px;border-radius:8px;font-size:14px;word-break:break-all;user-select:all">${accessToken}</code>
          <p style="color:#6B5B4F;font-size:13px;margin:12px 0 0">Click the token above to select it, then copy it.</p>
        </div>
        <div style="background:#FFF8F0;border:1px solid #C4963C;border-radius:12px;padding:16px;margin:16px 0">
          <p style="color:#C4963C;font-weight:600;margin:0 0 4px">Next Steps:</p>
          <ol style="color:#6B5B4F;font-size:13px;margin:8px 0;padding-left:20px">
            <li>Copy the token above</li>
            <li>Go to v0 sidebar > <strong>Vars</strong></li>
            <li>Update <strong>SHOPIFY_ADMIN_TOKEN</strong> with this token</li>
            <li>The price adjustment feature will now work with write access</li>
          </ol>
        </div>
        <div style="background:#f5f3ef;border-radius:8px;padding:12px;margin:16px 0">
          <p style="color:#9B9B9B;font-size:12px;margin:0"><strong>Granted scopes:</strong> ${scope}</p>
          <p style="color:#9B9B9B;font-size:12px;margin:4px 0 0"><strong>Shop:</strong> ${shop}</p>
        </div>
        <p style="color:#B76E79;font-size:12px;margin-top:16px"><strong>Security note:</strong> This token is shown once. Do not share it publicly. You can bookmark this page but the token will not be shown again on refresh.</p>
        `
      ),
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (e) {
    return new NextResponse(
      renderHTML(
        "Error",
        `Failed to exchange token: ${e instanceof Error ? e.message : String(e)}`
      ),
      { headers: { "Content-Type": "text/html" } }
    );
  }
}

function renderHTML(title: string, body: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} - Crazy Gels Intelligence</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #FAF9F6; color: #1A1A1A; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { max-width: 600px; width: 100%; background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); padding: 40px; }
    h1 { font-size: 22px; color: #1A1A1A; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <div>${body}</div>
  </div>
</body>
</html>`;
}
