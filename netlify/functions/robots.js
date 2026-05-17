const SITE_URL = (process.env.SITE_URL || "https://www.penseoffgrid.com.br").replace(/\/$/, "");
exports.handler = async () => ({
  statusCode:200,
  headers:{"Content-Type":"text/plain; charset=utf-8", "Cache-Control":"public, max-age=3600"},
  body:[
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /.netlify/",
    `Sitemap: ${SITE_URL}/sitemap.xml`
  ].join("\n") + "\n"
});
