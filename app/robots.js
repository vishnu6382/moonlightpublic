export default function robots() {
  const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const siteEnv = (process.env.NEXT_PUBLIC_SITE_ENV || process.env.VERCEL_ENV || '').toLowerCase();
  const isStaging = siteEnv === 'staging' || siteEnv === 'preview';

  if (isStaging) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin/*', '/api', '/api/*'],
    },
    sitemap: `${siteUrl.replace(/\/$/, '')}/sitemap.xml`,
  };
}
