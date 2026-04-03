/**
 * 구글·네이버 검색·SNS 공유용 메타 태그 및 schema.org JSON-LD 주입
 * SITE_CONFIG.seo (config.js)를 단일 기준으로 사용합니다.
 */
(function () {
  var C = window.SITE_CONFIG;
  if (!C || !C.seo) return;

  var s = C.seo;
  var base = (s.siteUrl || '').replace(/\/$/, '');
  if (!base) return;

  var path = (s.ogImagePath || 'assets/images/brand-dangoeul-logo.png').replace(/^\//, '');
  var absImage = base + '/' + path;

  function upsertMeta(attrName, key, content) {
    if (content === undefined || content === null || content === '') return;
    var sel = 'meta[' + attrName + '="' + key + '"]';
    var el = document.head.querySelector(sel);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function upsertProperty(prop, content) {
    upsertMeta('property', prop, content);
  }

  function upsertLink(rel, href, extra) {
    if (!href) return;
    var el = document.head.querySelector('link[rel="' + rel + '"]');
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
    if (extra) {
      Object.keys(extra).forEach(function (k) {
        el.setAttribute(k, extra[k]);
      });
    }
  }

  document.title = s.title || document.title;

  upsertMeta('name', 'description', s.description);
  upsertMeta('name', 'keywords', s.keywords);
  upsertMeta('name', 'robots', 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
  upsertMeta('name', 'author', C.name);
  upsertMeta('name', 'format-detection', 'telephone=yes');

  upsertProperty('og:type', 'website');
  upsertProperty('og:site_name', C.name + ' ' + C.nameEn);
  upsertProperty('og:title', s.title);
  upsertProperty('og:description', s.description);
  upsertProperty('og:url', base + '/');
  upsertProperty('og:image', absImage);
  upsertProperty('og:image:alt', C.name + ' 로고');
  upsertProperty('og:locale', s.locale || 'ko_KR');

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', s.title);
  upsertMeta('name', 'twitter:description', s.description);
  upsertMeta('name', 'twitter:image', absImage);

  upsertLink('canonical', base + '/');
  upsertLink('alternate', base + '/', { hreflang: 'ko' });

  if (s.naverSiteVerification) {
    upsertMeta('name', 'naver-site-verification', s.naverSiteVerification);
  }
  if (s.googleSiteVerification) {
    upsertMeta('name', 'google-site-verification', s.googleSiteVerification);
  }

  var graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': base + '/#website',
        name: C.name,
        alternateName: C.nameEn,
        url: base + '/',
        description: s.description,
        inLanguage: 'ko-KR',
        publisher: { '@id': base + '/#business' },
      },
      {
        '@type': 'LocalBusiness',
        '@id': base + '/#business',
        name: C.name,
        image: absImage,
        url: base + '/',
        telephone: C.tel,
        email: C.email,
        address: {
          '@type': 'PostalAddress',
          streetAddress: C.address,
          addressCountry: 'KR',
        },
        priceRange: '₩₩',
      },
    ],
  };

  var existing = document.getElementById('dangoeul-schema-jsonld');
  if (existing) existing.remove();
  var script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'dangoeul-schema-jsonld';
  script.textContent = JSON.stringify(graph);
  document.head.appendChild(script);
})();
