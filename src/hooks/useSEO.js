import { useEffect } from 'react';

const BASE_URL = 'https://skillmesa.com';
const DEFAULT_DESCRIPTION =
  'Skillmesa is the peer-to-peer skills marketplace for teens and young adults. Discover tutoring, babysitting, lawn care, coding help, music lessons, and more in your community.';
const DEFAULT_IMAGE = `${BASE_URL}/assets/logos/skillmesa-large.png`;

function setMeta(selector, value) {
  if (!value) return;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    // Parse selector like meta[property="og:title"] or meta[name="description"]
    const propMatch = selector.match(/\[property="([^"]+)"\]/);
    const nameMatch = selector.match(/\[name="([^"]+)"\]/);
    if (propMatch) el.setAttribute('property', propMatch[1]);
    else if (nameMatch) el.setAttribute('name', nameMatch[1]);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(data) {
  let el = document.getElementById('page-json-ld');
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'page-json-ld';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd() {
  document.getElementById('page-json-ld')?.remove();
}

/**
 * Dynamically updates page-level SEO metadata.
 *
 * @param {object} options
 * @param {string}  [options.title]       - Page-specific title (appended with "| Skillmesa")
 * @param {string}  [options.description] - Meta description
 * @param {string}  [options.image]       - Absolute URL for og:image / twitter:image
 * @param {string}  [options.path]        - Path portion of the canonical URL (e.g. "/listing/abc")
 * @param {object}  [options.jsonLd]      - JSON-LD structured data object (Schema.org)
 */
export default function useSEO({ title, description, image, path, jsonLd } = {}) {
  useEffect(() => {
    const fullTitle  = title       ? `${title} | Skillmesa`       : 'Skillmesa — Find Skills in Your Community';
    const desc       = description ?? DEFAULT_DESCRIPTION;
    const img        = image       ?? DEFAULT_IMAGE;
    const canonical  = path        ? `${BASE_URL}${path}`         : BASE_URL;

    document.title = fullTitle;

    setMeta('meta[name="description"]',        desc);
    setMeta('meta[property="og:title"]',       fullTitle);
    setMeta('meta[property="og:description"]', desc);
    setMeta('meta[property="og:image"]',       img);
    setMeta('meta[property="og:url"]',         canonical);
    setMeta('meta[name="twitter:title"]',      fullTitle);
    setMeta('meta[name="twitter:description"]',desc);
    setMeta('meta[name="twitter:image"]',      img);
    setLink('canonical', canonical);

    if (jsonLd) upsertJsonLd(jsonLd);
    else removeJsonLd();
  }, [title, description, image, path, jsonLd]);
}
