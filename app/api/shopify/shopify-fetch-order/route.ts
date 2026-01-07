import { NextResponse } from "next/server";

export async function GET() {
  const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
  const SHOPIFY_TOKEN = process.env.SHOPIFY_TOKEN;

  if (!SHOPIFY_STORE || !SHOPIFY_TOKEN) {
    return NextResponse.json(
      {
        success: false,
        error: "SHOPIFY_STORE or SHOPIFY_TOKEN is missing",
      },
      { status: 500 }
    );
  }

  try {
    const url = `https://${SHOPIFY_STORE}/admin/api/2024-04/orders.json?status=any&limit=250`;

    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_TOKEN,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          success: false,
          error: errorText,
          status: response.status,
        },
        { status: response.status }
      );
    }

    const json = await response.json();

    return NextResponse.json({
      success: true,
      data: json.orders ?? [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
