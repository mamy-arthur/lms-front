/**
 * @jest-environment jsdom
 * @jest-environment-options {"url":"https://learneo.test/"}
 */

import { render, screen } from '@testing-library/react';
import type { ApiPortalContentEntry } from '@/shared/types/portal.types';
import PortalContentRenderer from '../PortalContentRenderer';

function createEntry(overrides: Partial<ApiPortalContentEntry> = {}): ApiPortalContentEntry {
  return {
    id: 'entry-external-url',
    content_type_id: 'content-type-url',
    module_type: 'url',
    data: { title: 'Titre affiché dans l’en-tête', url: 'https://example.test/lesson' },
    field_types: { title: 'text', url: 'text' },
    is_published: true,
    ...overrides,
  };
}

describe('PortalContentRenderer external URLs', () => {
  it.each([
    {
      label: 'an ordinary URL module with a text field named url',
      name: 'url',
      type: 'text',
      value: 'https://example.test/lesson',
      expected: 'https://example.test/lesson',
    },
    {
      label: 'an explicit url field with an arbitrary name',
      name: 'learning_resource',
      type: 'url',
      value: 'https://example.test/lesson',
      expected: 'https://example.test/lesson',
    },
    {
      label: 'an arbitrary text field starting with HTTPS',
      name: 'resource',
      type: 'text',
      value: 'https://example.test/lesson',
      expected: 'https://example.test/lesson',
    },
    {
      label: 'an arbitrary text field starting with HTTP, upgraded on an HTTPS page',
      name: 'resource',
      type: 'text',
      value: 'http://example.test/lesson',
      expected: 'https://example.test/lesson',
    },
    {
      label: 'a trimmed, mixed-case HTTPS text value',
      name: 'resource',
      type: 'text',
      value: '  HtTpS://EXAMPLE.TEST/lesson?chapter=2#reading  ',
      expected: 'https://example.test/lesson?chapter=2#reading',
    },
    {
      label: 'a trimmed, mixed-case HTTP text value',
      name: 'resource',
      type: 'text',
      value: '  HtTp://EXAMPLE.TEST/lesson  ',
      expected: 'https://example.test/lesson',
    },
  ])('renders $label with a safe embed and fallback link', ({ name, type, value, expected }) => {
    const entry = createEntry({
      data: { title: 'Titre affiché dans l’en-tête', [name]: value },
      field_types: { title: 'text', [name]: type },
    });

    render(<PortalContentRenderer entry={entry} isLoading={false} />);

    const link = screen.getByRole('link', { name: value.trim() });
    expect(link).toHaveAttribute('href', expected);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    const iframe = screen.getByTitle('Contenu externe');
    expect(iframe.tagName).toBe('IFRAME');
    expect(iframe).toHaveAttribute('src', expected);
    expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
    expect(iframe).toHaveAttribute('referrerpolicy', 'no-referrer');
    expect(iframe).toHaveAttribute('allowfullscreen');
    // Browsers do not reliably emit iframe errors for framing refusals; keep this advice visible.
    expect(
      screen.getByText('Si le site refuse l’affichage intégré, ouvrez le lien dans un nouvel onglet.'),
    ).toBeVisible();
    expect(screen.queryByText('Aucun contenu disponible.')).not.toBeInTheDocument();
    expect(screen.queryByText('Titre affiché dans l’en-tête')).not.toBeInTheDocument();
  });

  it.each([
    {
      label: 'short',
      url: 'https://youtu.be/dQw4w9WgXc?t=1m30s',
      embed: 'https://www.youtube.com/embed/dQw4w9WgXc?start=90',
    },
    {
      label: 'watch',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXc&t=62s',
      embed: 'https://www.youtube.com/embed/dQw4w9WgXc?start=62',
    },
  ])('embeds a YouTube $label URL while keeping the original link', ({ url, embed }) => {
    render(
      <PortalContentRenderer
        entry={createEntry({ data: { url }, field_types: { url: 'text' } })}
        isLoading={false}
      />,
    );

    expect(screen.getByTitle('Contenu externe')).toHaveAttribute('src', embed);
    expect(screen.getByRole('link', { name: url })).toHaveAttribute('href', url);
  });

  it.each(['Titre affiché dans l’en-tête', 'https://example.test/title'])(
    'skips the title field even when it is the only content: %s',
    (title) => {
      const { container } = render(
        <PortalContentRenderer
          entry={createEntry({ data: { title }, field_types: { title: 'text' } })}
          isLoading={false}
        />,
      );

      expect(screen.queryByText(title)).not.toBeInTheDocument();
      expect(container.querySelector('iframe, a')).toBeNull();
      expect(screen.getByText('Aucun contenu disponible.')).toBeVisible();
    },
  );
});

describe('PortalContentRenderer ordinary pages', () => {
  it('still renders plain text, textarea, rich text and resolved media', () => {
    const entry = createEntry({
      module_type: 'page',
      data: {
        title: 'Titre affiché dans l’en-tête',
        description: 'Description réservée à l’en-tête',
        describe: 'Autre description réservée à l’en-tête',
        introduction: 'Une introduction sans lien.',
        notes: 'Première ligne\nDeuxième ligne',
        body: '<h2>Notions importantes</h2><p>Un <strong>exemple enrichi</strong>.</p>',
        illustration: { id: 'image-1', url: 'https://example.test/diagram.png', mime_type: 'image/png' },
      },
      field_types: {
        title: 'text',
        description: 'textarea',
        describe: 'textarea',
        introduction: 'text',
        notes: 'textarea',
        body: 'richtext',
        illustration: 'media',
      },
    });

    const { container } = render(<PortalContentRenderer entry={entry} isLoading={false} />);

    expect(screen.getByText('Une introduction sans lien.')).toBeVisible();
    expect(screen.getByText('Première ligne Deuxième ligne').textContent).toBe(
      'Première ligne\nDeuxième ligne',
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Notions importantes' })).toBeVisible();
    expect(screen.getByText('exemple enrichi').tagName).toBe('STRONG');
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.test/diagram.png');
    expect(screen.queryByText('Titre affiché dans l’en-tête')).not.toBeInTheDocument();
    expect(screen.queryByText('Description réservée à l’en-tête')).not.toBeInTheDocument();
    expect(screen.queryByText('Autre description réservée à l’en-tête')).not.toBeInTheDocument();
    expect(container.querySelector('iframe, a')).toBeNull();
    expect(screen.queryByText('Aucun contenu disponible.')).not.toBeInTheDocument();
  });

  it.each([
    { mime: 'video/mp4', url: 'https://example.test/lesson.mp4', selector: 'video' },
    { mime: 'audio/mpeg', url: 'https://example.test/lesson.mp3', selector: 'audio' },
    { mime: 'application/pdf', url: 'https://example.test/lesson.pdf', selector: 'iframe' },
    { mime: 'application/zip', url: 'https://example.test/lesson.zip', selector: 'a' },
  ])('preserves the $mime media renderer', ({ mime, url, selector }) => {
    const { container } = render(
      <PortalContentRenderer
        entry={createEntry({
          module_type: 'page',
          data: { attachment: { id: 'media-1', url, mime_type: mime } },
          field_types: { attachment: 'media' },
        })}
        isLoading={false}
      />,
    );

    const media = container.querySelector(selector);
    expect(media).toHaveAttribute(selector === 'a' ? 'href' : 'src', url);
    if (selector === 'a') {
      expect(screen.getByRole('link', { name: 'Télécharger le fichier' })).toHaveAttribute('download');
    } else if (selector === 'iframe') {
      expect(screen.getByTitle('PDF')).toBe(media);
    } else {
      expect(media).toHaveAttribute('controls');
    }
  });
});

describe.each([
  { name: 'url', type: 'text' },
  { name: 'learning_resource', type: 'url' },
  { name: 'resource', type: 'text' },
])('PortalContentRenderer unsafe $type field named $name', ({ name, type }) => {
  it.each([
    ['JavaScript', 'javascript:alert(1)'],
    ['mixed-case JavaScript', '  JaVaScRiPt:alert(1)  '],
    ['data', 'data:text/html,<script>alert(1)</script>'],
    ['blob', 'blob:https://example.test/12345678'],
    ['file', 'file:///tmp/lesson.html'],
    ['FTP', 'ftp://example.test/lesson'],
    ['root-relative', '/lesson'],
    ['relative', 'lesson.html'],
    ['dot-relative', './lesson'],
    ['parent-relative', '../lesson'],
    ['protocol-relative', '//example.test/lesson'],
    ['fragment', '#lesson'],
    ['username', 'https://user@example.test/lesson'],
    ['username and password', 'https://user:password@example.test/lesson'],
    ['backslash in authority', 'https://example.test\\@other.test/lesson'],
    ['backslash in path', 'https://example.test/lesson\\chapter'],
    ['missing authority', 'https:example.test/lesson'],
    ['embedded tab', 'https://exa\tmple.test/lesson'],
    ['embedded newline', 'https://example.test/les\nson'],
    ['embedded carriage return', 'https://example.test/les\rson'],
    ['leading tab', '\thttps://example.test/lesson'],
    ['trailing newline', 'https://example.test/lesson\n'],
    ['null control', 'https://example.test/les\u0000son'],
    ['DEL control', 'https://example.test/les\u007fson'],
  ])('does not create an iframe or link for %s input', (_label, value) => {
    const { container } = render(
      <PortalContentRenderer
        entry={createEntry({
          data: { [name]: value, notes: 'Le contenu sûr reste visible.' },
          field_types: { [name]: type, notes: 'textarea' },
        })}
        isLoading={false}
      />,
    );

    expect(container.querySelector('iframe')).toBeNull();
    expect(container.querySelector('a')).toBeNull();
    expect(screen.getByText('Le contenu sûr reste visible.')).toBeVisible();
  });
});