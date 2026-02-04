import { NextResponse } from 'next/server';

export async function GET() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  
  if (!domain || !token) {
    return NextResponse.json({ 
      error: 'Missing env vars',
      domain: domain ? 'SET' : 'NOT SET',
      token: token ? `SET (${token.length} chars, starts with ${token.slice(0,6)})` : 'NOT SET',
    });
  }

  const endpoint = `https://${domain}/api/2024-01/graphql.json`;
  
  const query = `
    query {
      shop {
        name
        primaryDomain {
          url
        }
      }
      products(first: 3) {
        edges {
          node {
            id
            title
            handle
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    
    return NextResponse.json({
      status: response.status,
      endpoint,
      tokenUsed: `${token.slice(0, 10)}...`,
      response: data,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      endpoint,
    });
  }
}
