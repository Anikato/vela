import { getBaseUrl } from '@/lib/seo';

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd({
  name,
  url,
  logo,
  email,
  phone,
  address,
  socials,
}: {
  name: string;
  url?: string;
  logo?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  socials?: string[];
}) {
  const baseUrl = url ?? getBaseUrl();
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url: baseUrl,
  };
  if (logo) data.logo = logo.startsWith('http') ? logo : `${baseUrl}${logo}`;
  if (email) data.email = email;
  if (phone) data.telephone = phone;
  if (address) data.address = { '@type': 'PostalAddress', streetAddress: address };
  if (socials?.length) data.sameAs = socials;

  return <JsonLd data={data} />;
}

export function WebSiteJsonLd({
  name,
  url,
  searchPath,
}: {
  name: string;
  url?: string;
  searchPath?: string;
}) {
  const baseUrl = url ?? getBaseUrl();
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url: baseUrl,
  };
  if (searchPath) {
    data.potentialAction = {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${baseUrl}${searchPath}?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    };
  }
  return <JsonLd data={data} />;
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; href?: string }>;
}) {
  const baseUrl = getBaseUrl();
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      ...(item.href ? { item: item.href.startsWith('http') ? item.href : `${baseUrl}${item.href}` } : {}),
    })),
  };
  return <JsonLd data={data} />;
}

export function ProductJsonLd({
  name,
  description,
  sku,
  image,
  url,
  brand,
}: {
  name: string;
  description?: string | null;
  sku: string;
  image?: string | null;
  url: string;
  brand?: string | null;
}) {
  const baseUrl = getBaseUrl();
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    sku,
    url: url.startsWith('http') ? url : `${baseUrl}${url}`,
  };
  if (description) data.description = description;
  if (image) data.image = image.startsWith('http') ? image : `${baseUrl}${image}`;
  if (brand) data.brand = { '@type': 'Brand', name: brand };

  return <JsonLd data={data} />;
}

export function ArticleJsonLd({
  title,
  description,
  url,
  image,
  publishedTime,
  author,
}: {
  title: string;
  description?: string | null;
  url: string;
  image?: string | null;
  publishedTime?: string | null;
  author?: string | null;
}) {
  const baseUrl = getBaseUrl();
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    url: url.startsWith('http') ? url : `${baseUrl}${url}`,
  };
  if (description) data.description = description;
  if (image) data.image = image.startsWith('http') ? image : `${baseUrl}${image}`;
  if (publishedTime) data.datePublished = publishedTime;
  if (author) data.author = { '@type': 'Person', name: author };

  return <JsonLd data={data} />;
}
