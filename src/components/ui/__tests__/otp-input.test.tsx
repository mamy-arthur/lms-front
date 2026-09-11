import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';

import { OtpInput } from '../otp-input';

/** Wrapper contrôlé : le composant est piloté par son parent en usage réel. */
function ControlledOtp({
  length = 6,
  initial = '',
  disabled = false,
  hasError = false,
}: {
  length?: number;
  initial?: string;
  disabled?: boolean;
  hasError?: boolean;
}) {
  const [value, setValue] = React.useState(initial);

  return (
    <>
      <OtpInput
        length={length}
        value={value}
        onChange={setValue}
        disabled={disabled}
        hasError={hasError}
      />
      <output data-testid="value">{value}</output>
    </>
  );
}

const boxes = () => screen.getAllByRole('textbox');
const currentValue = () => screen.getByTestId('value').textContent;

describe('OtpInput — rendu', () => {
  it('affiche autant de cases que la longueur demandée', () => {
    render(<ControlledOtp length={6} />);

    expect(boxes()).toHaveLength(6);
  });

  it('suit une longueur configurée à 10', () => {
    render(<ControlledOtp length={10} />);

    expect(boxes()).toHaveLength(10);
  });

  it('expose un libellé accessible par case', () => {
    render(<ControlledOtp length={6} />);

    expect(screen.getByLabelText('Chiffre 1 sur 6')).toBeInTheDocument();
    expect(screen.getByLabelText('Chiffre 6 sur 6')).toBeInTheDocument();
  });

  it('porte autocomplete one-time-code sur la première case uniquement', () => {
    render(<ControlledOtp length={6} />);

    expect(boxes()[0]).toHaveAttribute('autocomplete', 'one-time-code');
    expect(boxes()[1]).toHaveAttribute('autocomplete', 'off');
  });

  it('marque les cases en erreur', () => {
    render(<ControlledOtp length={6} hasError />);

    expect(boxes()[0]).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('OtpInput — saisie', () => {
  it('enregistre les chiffres et avance le focus', async () => {
    const user = userEvent.setup();
    render(<ControlledOtp length={6} />);

    await user.click(boxes()[0]);
    await user.keyboard('123');

    expect(currentValue()).toBe('123');
    expect(boxes()[3]).toHaveFocus();
  });

  it('ignore les caractères non numériques', async () => {
    const user = userEvent.setup();
    render(<ControlledOtp length={6} />);

    await user.click(boxes()[0]);
    await user.keyboard('1a2');

    expect(currentValue()).toBe('12');
  });

  it('ne dépasse pas la longueur autorisée', async () => {
    const user = userEvent.setup();
    render(<ControlledOtp length={6} />);

    await user.click(boxes()[0]);
    await user.keyboard('1234567890');

    expect(currentValue()).toBe('123456');
  });

  it('remplace le chiffre d’une case déjà remplie', async () => {
    const user = userEvent.setup();
    render(<ControlledOtp length={6} initial="123456" />);

    await user.click(boxes()[2]);
    await user.keyboard('9');

    expect(currentValue()).toBe('129456');
  });

  it('corrige le dernier chiffre via Retour arrière puis saisie', async () => {
    const user = userEvent.setup();
    render(<ControlledOtp length={6} initial="123456" />);

    await user.click(boxes()[5]);
    await user.keyboard('{Backspace}9');

    expect(currentValue()).toBe('123459');
  });
});

describe('OtpInput — effacement et navigation', () => {
  it('efface le chiffre de la case courante', async () => {
    const user = userEvent.setup();
    render(<ControlledOtp length={6} initial="123" />);

    await user.click(boxes()[2]);
    await user.keyboard('{Backspace}');

    expect(currentValue()).toBe('12');
  });

  it('recule et efface quand la case courante est vide', async () => {
    const user = userEvent.setup();
    render(<ControlledOtp length={6} initial="12" />);

    await user.click(boxes()[2]);
    await user.keyboard('{Backspace}');

    expect(currentValue()).toBe('1');
    expect(boxes()[1]).toHaveFocus();
  });

  it('navigue avec les flèches', async () => {
    const user = userEvent.setup();
    render(<ControlledOtp length={6} initial="123456" />);

    await user.click(boxes()[3]);
    await user.keyboard('{ArrowLeft}');
    expect(boxes()[2]).toHaveFocus();

    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(boxes()[4]).toHaveFocus();
  });
});

describe('OtpInput — collage', () => {
  it('répartit un code complet sur les cases', async () => {
    const user = userEvent.setup();
    render(<ControlledOtp length={6} />);

    await user.click(boxes()[0]);
    await user.paste('482913');

    expect(currentValue()).toBe('482913');
  });

  it('nettoie les séparateurs du contenu collé', async () => {
    const user = userEvent.setup();
    render(<ControlledOtp length={6} />);

    await user.click(boxes()[0]);
    await user.paste('48 29-13');

    expect(currentValue()).toBe('482913');
  });

  it('tronque un contenu plus long que la longueur autorisée', async () => {
    const user = userEvent.setup();
    render(<ControlledOtp length={6} />);

    await user.click(boxes()[0]);
    await user.paste('4829134567');

    expect(currentValue()).toBe('482913');
  });
});

describe('OtpInput — état désactivé', () => {
  it('désactive toutes les cases et refuse la saisie', async () => {
    const user = userEvent.setup();
    render(<ControlledOtp length={6} disabled />);

    boxes().forEach((box) => expect(box).toBeDisabled());

    await user.click(boxes()[0]);
    await user.keyboard('1');

    expect(currentValue()).toBe('');
  });
});
