import { studentMailto } from '../studentMailto';

it.each([
  ['alice@example.com', 'mailto:alice@example.com'],
  [' alice+formation@example.com ', 'mailto:alice%2Bformation@example.com'],
  ['nom?subject=test@example.com', 'mailto:nom%3Fsubject%3Dtest@example.com'],
  ['nom#fragment@example.com', 'mailto:nom%23fragment@example.com'],
  ['nom%0A@example.com', 'mailto:nom%250A@example.com'],
])('encode %s sans interpréter l’adresse comme des paramètres de message', (email, href) => {
  expect(studentMailto(email)).toBe(href);
});

it.each([null, undefined, '', '  ', 'invalid', 'a@b@c', 'a@b\r\nBcc:other@b', 'a@b,other@b'])(
  'ne construit pas de lien pour une adresse absente ou ambiguë : %s',
  (email) => {
    expect(studentMailto(email)).toBeNull();
  },
);
