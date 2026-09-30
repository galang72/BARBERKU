import { NextRequest, NextResponse } from "next/server";
import { getProducts, getProductCategories, createProduct, updateProduct } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const includeCategories = searchParams.get("includeCategories") === "true";

    const products = await getProducts(categoryId);
    const categories = includeCategories ? await getProductCategories() : undefined;

    return NextResponse.json({ products, categories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.sku || body.sellingPrice === undefined) {
      return NextResponse.json({ error: "Nama, SKU, dan harga jual wajib diisi" }, { status: 400 });
    }
    const created = await createProduct({
      categoryId: body.categoryId || null,
      sku: body.sku.trim(),
      name: body.name.trim(),
      costPrice: Number(body.costPrice || 0),
      sellingPrice: Number(body.sellingPrice),
      stock: Number(body.stock || 0),
      minStock: Number(body.minStock || 5),
      supplier: body.supplier || null,
      unit: body.unit || "pcs",
      isActive: true,
    });
    return NextResponse.json(created);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    const updated = await updateProduct(body.id, {
      ...body,
      costPrice: body.costPrice !== undefined ? Number(body.costPrice) : undefined,
      sellingPrice: body.sellingPrice !== undefined ? Number(body.sellingPrice) : undefined,
      stock: body.stock !== undefined ? Number(body.stock) : undefined,
      minStock: body.minStock !== undefined ? Number(body.minStock) : undefined,
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
