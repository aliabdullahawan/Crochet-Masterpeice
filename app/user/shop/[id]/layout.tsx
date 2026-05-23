import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase";
import { getSiteUrl } from "@/lib/siteUrl";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const siteUrl = getSiteUrl();

  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("products")
      .select("name, description, image_url, price")
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle();

    const product = data as {
      name?: string;
      description?: string;
      image_url?: string | null;
      price?: number;
    } | null;

    if (!product?.name) {
      return { title: "Product" };
    }

    const title = product.name;
    const description =
      (product.description ?? "").slice(0, 160) ||
      `Handmade ${product.name} — PKR ${Number(product.price ?? 0).toLocaleString()}. Order from Crochet Masterpiece.`;
    const image = product.image_url?.startsWith("http")
      ? product.image_url
      : product.image_url
        ? `${siteUrl}${product.image_url.startsWith("/") ? "" : "/"}${product.image_url}`
        : `${siteUrl}/images/logo.png`;

    return {
      title,
      description,
      alternates: { canonical: `/user/shop/${id}` },
      openGraph: {
        title,
        description,
        type: "website",
        url: `${siteUrl}/user/shop/${id}`,
        images: [{ url: image, alt: title }],
      },
    };
  } catch {
    return { title: "Product" };
  }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
