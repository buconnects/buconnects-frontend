import { Helmet } from 'react-helmet-async';

const SITE_URL = (import.meta.env.VITE_PUBLIC_SITE_URL || 'https://buconnects-frontend-one.vercel.app')
  .replace(/\/+$/, '');

export default function SEOHead({ title, description, pathname, noIndex = false }) {
  const canonicalUrl = `${SITE_URL}${pathname}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'buCONNECTS',
    url: `${SITE_URL}/`,
    description: 'Join buCONNECTS, the Busitema University student community for campus updates, events, student accommodation, marketplace listings, and student connections.',
    applicationCategory: 'SocialNetworkingApplication',
    operatingSystem: 'Web',
  };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <meta property="og:site_name" content="buCONNECTS" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${SITE_URL}/bu-CONNECTS-logo.png`} />
      <meta property="og:image:alt" content="buCONNECTS, the Busitema University student community" />
      <meta property="og:locale" content="en_UG" />
      <meta property="og:url" content={canonicalUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content={`${SITE_URL}/bu-CONNECTS-logo.png`} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {!noIndex && <link rel="canonical" href={canonicalUrl} />}
      {!noIndex && <script type="application/ld+json">{JSON.stringify(structuredData)}</script>}
    </Helmet>
  );
}