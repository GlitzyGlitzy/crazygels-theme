import { NextResponse } from 'next/server';

export async function GET() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN || '';
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || '';
  
  const config = {
    domain,
    tokenLength: token.length,
    tokenPrefix: token.slice(0, 10),
    hasValidDomain: domain.includes('myshopify.com'),
    hasValidToken: token.length > 20,
  };

  if (!config.hasValidDomain || !config.hasValidToken) {
    return NextResponse.json({ 
      success: false, 
      error: 'Missing or invalid configuration',
      config 
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
      success: !data.errors,
      config,
      endpoint,
      status: response.status,
      data: data.data || null,
      errors: data.errors || null,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      config,
      endpoint,
      error: error.message,
    });
  }
}
