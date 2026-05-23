import { getSiteUrl } from "@/lib/siteUrl";

export function SiteJsonLd() {
  const siteUrl = getSiteUrl();
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Crochet Masterpiece",
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    description:
      "Handmade crochet products, custom orders, and gifts — crafted with love in Pakistan.",
    sameAs: [] as string[],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Crochet Masterpiece",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/user/shop?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const store = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "Crochet Masterpiece",
    url: `${siteUrl}/user/shop`,
    image: `${siteUrl}/images/logo.png`,
    priceRange: "PKR",
    address: {
      "@type": "PostalAddress",
      addressCountry: "PK",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(store) }}
      />
    </>
  );
}
