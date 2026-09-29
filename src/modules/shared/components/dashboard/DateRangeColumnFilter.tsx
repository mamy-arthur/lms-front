'use client';

import { useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { fr } from 'date-fns/locale';
import { getDefaultClassNames, type DateRange as DayPickerRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/** Bornes appliquées, au format `YYYY-MM-DD`. */
export type DateRange = { from: string; to: string };

export const EMPTY_DATE_RANGE: DateRange = { from: '', to: '' };

/** Noms de classes par défaut de react-day-picker, conservés en surchargeant. */
const defaultCalendarClassNames = getDefaultClassNames();

export function isDateRangeActive(range: DateRange) {
  return range.from !== '' || range.to !== '';
}

/**
 * Teste une date ISO contre une plage, bornes incluses.
 *
 * La comparaison porte sur le jour UTC extrait de la chaîne ISO, et non sur des
 * `Date` : c'est exactement le jour que les colonnes affichent (les formateurs
 * utilisent `timeZone: 'UTC'`), et la comparaison lexicographique de deux
 * `YYYY-MM-DD` évite tout décalage de fuseau.
 */
export function matchesDateRange(iso: string | undefined, range: DateRange) {
  if (!isDateRangeActive(range)) return true;
  // Une ligne sans date ne peut pas tomber dans une plage.
  if (!iso) return false;

  const day = iso.slice(0, 10);
  if (range.from && day < range.from) return false;
  if (range.to && day > range.to) return false;

  return true;
}

/**
 * `Date` du calendrier → `YYYY-MM-DD`.
 *
 * Volontairement construit depuis les accesseurs locaux : le calendrier produit
 * des dates à minuit **local**, et `toISOString()` les repasserait en UTC, ce
 * qui reculerait d'un jour pour tout fuseau à l'est de Greenwich.
 */
function toDayString(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * `YYYY-MM-DD` → `Date` à minuit local.
 *
 * Symétrique de {@link toDayString} : `new Date('2026-09-02')` lirait la chaîne
 * en UTC et le calendrier pourrait surligner le 1er septembre.
 */
function fromDayString(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(year, month - 1, day);
}

function toDayPickerRange(range: DateRange): DayPickerRange | undefined {
  if (!isDateRangeActive(range)) return undefined;

  return {
    from: range.from ? fromDayString(range.from) : undefined,
    to: range.to ? fromDayString(range.to) : undefined,
  };
}

function fromDayPickerRange(selected: DayPickerRange | undefined): DateRange {
  return {
    from: selected?.from ? toDayString(selected.from) : '',
    to: selected?.to ? toDayString(selected.to) : '',
  };
}

/** `2026-09-02` → `02/09/2026`, sans passer par `Date` ni fuseau. */
function toFrenchDay(value: string) {
  return value.split('-').reverse().join('/');
}

/** Dit ce que fait le bouton, et ce qu'il filtre déjà le cas échéant. */
function describeRange(range: DateRange) {
  if (range.from && range.to) {
    return `Du ${toFrenchDay(range.from)} au ${toFrenchDay(range.to)}`;
  }
  if (range.from) return `À partir du ${toFrenchDay(range.from)}`;
  if (range.to) return `Jusqu’au ${toFrenchDay(range.to)}`;

  return 'Filtrer par plage de dates';
}

export function DateRangeColumnFilter({
  label,
  range,
  onApply,
}: {
  /** Nom de la colonne, repris dans les libellés accessibles. */
  label: string;
  range: DateRange;
  onApply: (range: DateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  /**
   * Verrou posé à la fermeture du popover.
   *
   * Radix réouvre l'infobulle sur `onFocus` dès que le pointeur n'est plus
   * enfoncé (`react-tooltip` : `onFocus: () => { if (!isPointerDownRef.current)
   * onOpen() }`). Or fermer le popover rend le focus au bouton déclencheur :
   * sans ce verrou, l'infobulle resurgit juste après que l'utilisateur a fermé
   * le panneau. Il se lève au premier geste délibéré — sortie du pointeur ou
   * perte du focus — pour que l'infobulle reste disponible ensuite.
   */
  const [tooltipLocked, setTooltipLocked] = useState(false);
  const [draft, setDraft] = useState<DayPickerRange | undefined>(() => toDayPickerRange(range));
  const active = isDateRangeActive(range);
  const draftRange = fromDayPickerRange(draft);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setTooltipOpen(false);
        setTooltipLocked(!next);
        // À l'ouverture, repartir des bornes réellement appliquées.
        if (next) setDraft(toDayPickerRange(range));
      }}
    >
      {/* Contrôlée pour que l'infobulle ne reste pas affichée sous le popover. */}
      <Tooltip open={tooltipOpen && !open && !tooltipLocked} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={active ? `Filtrer par ${label} — filtre actif` : `Filtrer par ${label}`}
              // Le verrou se lève dès que l'utilisateur quitte le bouton :
              // revenir dessus doit bien redonner l'infobulle.
              onPointerLeave={() => setTooltipLocked(false)}
              onBlur={() => setTooltipLocked(false)}
              className={cn(
                // Bordure et fond dès le repos : sans eux, l'icône se lit comme
                // une décoration du titre et personne ne pense à cliquer.
                // `size-6` tient la cible tactile minimale de 24 px.
                'grid size-6 shrink-0 place-items-center rounded-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'border-(--color-primary) bg-(--color-primary) text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <CalendarRange aria-hidden="true" className="size-3.5" />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{describeRange(range)}</TooltipContent>
      </Tooltip>

      <PopoverContent align="start" className="w-auto p-0">
        <div className="space-y-0.5 border-b px-3 py-2">
          <p className="text-xs font-medium">{label}</p>
          <p role="status" className="text-xs text-muted-foreground">
            {isDateRangeActive(draftRange)
              ? describeRange(draftRange)
              : 'Choisissez une date de début, puis une date de fin.'}
          </p>
        </div>

        <Calendar
          autoFocus
          mode="range"
          locale={fr}
          numberOfMonths={2}
          /*
            Le composant `ui/calendar` peint les bornes en `bg-primary` et
            l'intérieur de la plage en `bg-muted` (gris). Tout est retéinté ici,
            au point d'usage : `ui/` est régénérable, on n'y touche pas.
            `!` est nécessaire — les classes d'origine sont posées sur le bouton
            lui-même, à spécificité égale.
          */
          className={cn(
            '[&_[data-range-start=true]]:bg-(--color-primary)!',
            '[&_[data-range-end=true]]:bg-(--color-primary)!',
            '[&_[data-selected-single=true]]:bg-(--color-primary)!',
            '[&_[data-range-middle=true]]:bg-(--color-primary)/15!',
            '[&_[data-range-middle=true]]:text-foreground!',
          )}
          classNames={{
            // Rail qui relie les deux bornes, `bg-muted` par défaut. Remplacé en
            // entier : on conserve la géométrie et le nom de classe de RDP.
            range_start: cn(
              'relative isolate z-0 rounded-l-(--cell-radius) bg-(--color-primary)/15 after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-(--color-primary)/15',
              defaultCalendarClassNames.range_start,
            ),
            range_end: cn(
              'relative isolate z-0 rounded-r-(--cell-radius) bg-(--color-primary)/15 after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-(--color-primary)/15',
              defaultCalendarClassNames.range_end,
            ),
          }}
          defaultMonth={draft?.from}
          selected={draft}
          onSelect={setDraft}
        />

        <div className="flex justify-end gap-2 border-t px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => {
              setDraft(undefined);
              onApply(EMPTY_DATE_RANGE);
              setOpen(false);
            }}
          >
            Réinitialiser
          </Button>
          <Button
            type="button"
            className="h-7 px-2 text-xs bg-(--color-primary)! hover:opacity-80"
            onClick={() => {
              onApply(draftRange);
              setOpen(false);
            }}
          >
            Appliquer
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
