import DOMPurify from 'dompurify';

/**
 * Propriétés CSS qui peuvent charger des ressources externes ou rediriger l'utilisateur.
 * On les retire du `style` avant de renvoyer le HTML sanitisé.
 */
const FORBIDDEN_CSS_PROPERTIES = [
  'background-image',
  'background',
  'border-image',
  'border-image-source',
  'content',
  'cursor',
  'filter',
  'list-style-image',
  'mask',
  'mask-image',
  'src', // utilisé dans @font-face injecté via style inline
];

/**
 * Sanitise du HTML riche (emails, certificats) en autorisant `style` tout en
 * retirant les propriétés CSS susceptibles de charger des ressources externes
 * (background-image, filter, cursor…) ou de provoquer du clickjacking.
 *
 * @param dirty - HTML brut à assainir
 */
export function sanitizeHtml(dirty: string): string {
  const purify = DOMPurify;

  const cleanup = (node: Element) => {
    const styleAttr = node.getAttribute('style');
    if (!styleAttr) return;

    // Parcourt chaque déclaration CSS et retire les propriétés interdites
    const cleaned = styleAttr
      .split(';')
      .filter((decl) => {
        const prop = decl.split(':')[0]?.trim().toLowerCase();
        return prop !== undefined && prop !== '' && !FORBIDDEN_CSS_PROPERTIES.includes(prop);
      })
      .join(';');

    if (cleaned.trim() === '') {
      node.removeAttribute('style');
    } else {
      node.setAttribute('style', cleaned);
    }
  };

  purify.addHook('afterSanitizeAttributes', cleanup);

  const result = purify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['style', 'width', 'height', 'data-media-id'],
  });

  purify.removeHook('afterSanitizeAttributes');

  return result;
}
