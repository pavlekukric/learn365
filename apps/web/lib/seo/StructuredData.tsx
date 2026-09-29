import { serializeJsonLd } from './jsonLd';

/** Inline structured data, rendered on the server into the page HTML. */
export function StructuredData({ data }: { data: Parameters<typeof serializeJsonLd>[0] }) {
  return (
    <script
      type="application/ld+json"
      // Escaped by `serializeJsonLd` — no `<` survives into the markup.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
