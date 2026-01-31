import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  noindex?: boolean;
}

const defaultTitle = 'HEROSMS - 虚拟号码短信接收平台';
const defaultDescription = 'HEROSMS提供全球虚拟手机号码接收短信验证码服务，支持180+国家、700+平台，包括Telegram、WhatsApp、Google、Facebook等。';
const defaultKeywords = '虚拟号码,接码平台,短信验证码,临时手机号,SMS verification,virtual phone number,receive SMS';
const defaultImage = 'https://hero-sms.com/og-image.png';
const siteUrl = 'https://hero-sms.com';

export function SEO({
  title,
  description = defaultDescription,
  keywords = defaultKeywords,
  image = defaultImage,
  url = '',
  type = 'website',
  noindex = false,
}: SEOProps) {
  const fullTitle = title ? `${title} | HEROSMS` : defaultTitle;
  const fullUrl = `${siteUrl}${url}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
