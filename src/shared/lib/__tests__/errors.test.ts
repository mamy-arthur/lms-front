import { getApiErrorMessage, getFormValidationMessage } from '@/shared/lib/errors';

describe('getApiErrorMessage', () => {
  it('returns fallback for unknown errors', () => {
    expect(getApiErrorMessage(null, 'fallback')).toBe('fallback');
    expect(getApiErrorMessage('x', 'fallback')).toBe('fallback');
  });

  it('reads Laravel message', () => {
    expect(
      getApiErrorMessage({ json: { message: 'Compétence déjà liée' } }, 'fallback'),
    ).toBe('Compétence déjà liée');
  });

  it('flattens validation errors', () => {
    expect(
      getApiErrorMessage(
        {
          json: {
            message: 'The given data was invalid.',
            errors: { duration: ['La durée doit être positive.'], name: ['Le nom est requis.'] },
          },
        },
        'fallback',
      ),
    ).toBe('La durée doit être positive. Le nom est requis.');
  });

  it('ignores generic HTTP status text', () => {
    expect(getApiErrorMessage({ message: 'Unprocessable Content' }, 'fallback')).toBe('fallback');
  });
});

describe('getFormValidationMessage', () => {
  it('joins field messages', () => {
    expect(
      getFormValidationMessage({
        name: { message: 'Le nom est requis' },
        currency: { message: 'La devise est requise' },
      }),
    ).toBe('Le nom est requis · La devise est requise');
  });

  it('returns fallback when empty', () => {
    expect(getFormValidationMessage({})).toBe(
      'Veuillez corriger les erreurs du formulaire avant d’enregistrer.',
    );
  });
});
