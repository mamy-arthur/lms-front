/** @jest-environment node */
import { renderToString } from 'react-dom/server';
import { useIsMobile } from '../use-mobile';

it('can render on the server without window or matchMedia', () => {
  function Viewport() {
    return <span>{useIsMobile() ? 'mobile' : 'desktop'}</span>;
  }
  expect(typeof window).toBe('undefined');
  expect(renderToString(<Viewport />)).toBe('<span>desktop</span>');
});
