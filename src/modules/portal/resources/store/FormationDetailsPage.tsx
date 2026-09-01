'use client';
import { BookOpen, ClipboardCheck, FileText, GraduationCap, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useCartActions } from '@/modules/portal/resources/cart/hooks/useCartActions';
// import { CartQuantityControls } from '@/modules/shared/components/store/CartQuantityControls';
import { usePermissions } from '@/shared/hooks/usePermissions';
import { ACCESS } from '@/shared/auth/permissions';
import type {
  StoreFormationDetails,
  StoreModuleStep,
  StoreEvaluationStep,
} from '@/shared/mocks/store.mock';

interface FormationDetailsPageProps {
  formation: StoreFormationDetails;
  backHref?: string;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

function ProgramModule({ step, stepIndex }: { step: StoreModuleStep; stepIndex: number }) {
  return (
    <Accordion type="single" collapsible className="rounded-sm border border-border bg-transparent">
      <AccordionItem value={step.id} className="border-b-0">
        <AccordionTrigger className="px-3 py-3 no-underline hover:no-underline">
          <div className="flex items-center gap-2 text-left">
            <BookOpen className="size-4" />
            <span className="text-sm">
              Module {stepIndex + 1} - {step.title}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 bg-transparent">
          <ul className="space-y-2">
            {step.lessons.map((lesson) => (
              <li
                key={`${step.id}-${lesson}`}
                className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-foreground truncate">{lesson}</span>
                </div>
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function ProgramEvaluation({ step }: { step: StoreEvaluationStep }) {
  return (
    <div className="rounded-sm border border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="mt-1 flex items-center gap-2 text-sm">
            <ClipboardCheck className="size-4" />
            {step.title}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FormationDetailsPage({ formation }: FormationDetailsPageProps) {
  // const { add, increase, decrease, setQuantity, findItem, isMutatingFor } = useCartActions();
  const { add, findItem, isMutatingFor } = useCartActions();
  const { can } = usePermissions();
  const canManageCart = can(ACCESS.cart);

  const cartItem = findItem(formation.id);
  const isInCart = Boolean(cartItem);
  const isCartMutating = isMutatingFor({
    learningPathId: formation.id,
    cartItemId: cartItem?.id,
  });

  const stats = [
    { label: 'Modules', value: formation.moduleCount, description: 'Module du parcours' },
    { label: 'Cours', value: formation.courseCount, description: 'Cours à suivre' },
    {
      label: 'Évaluations',
      value: formation.evaluationCount,
      description: 'Évaluations à passer',
    },
    { label: 'Durée', value: formation.duration, description: 'à compléter' },
  ];

  return (
    <div className="w-full flex flex-col space-y-6 pb-8 md:max-w-325 mx-auto">
      <div className="flex flex-col space-y-6">
        <h1 className="text-xl font-semibold  sm:text-2xl">{formation.title}</h1>
        <div>
          <div className="text-sm flex flex-col space-y-2">
            <span className="text-lg font-medium">Description courte</span>
            <p className="text-sm text-muted-foreground">{formation.shortDescription}</p>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center gap-2">
            <p className="text-foreground">
              {formation.price === 0 ? (
                <span className="font-semibold text-foreground">Gratuit</span>
              ) : (
                <span className="bg-background/90 text-2xl font-medium text-foreground">
                  {formatPrice(formation.price)}
                </span>
              )}
            </p>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              {canManageCart &&
                (isInCart && cartItem ? null : ( // /> //   disabled={isCartMutating} //   onQuantityChange={(quantity) => setQuantity(cartItem.id, quantity)} //   onIncrease={() => increase(cartItem.id)} //   onDecrease={() => decrease(cartItem.id)} //   quantity={cartItem.quantity} // <CartQuantityControls
                  <Button
                    className="h-9 bg-(--color-primary) hover:bg-primary/80"
                    onClick={() => add(formation.id)}
                    disabled={isCartMutating}
                    size={'lg'}
                  >
                    <ShoppingCart />
                    Ajouter au panier
                  </Button>
                ))}
            </div>
          </div>
        </div>
        <div className="grid gap-6">
          <div className="relative">
            {formation.coverImage ? (
              <img
                src={formation.coverImage}
                alt={formation.title}
                className="h-150 w-full object-cover rounded-sm"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <GraduationCap className="size-10" />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="w-full">
        <div className="space-y-8">
          <div className="flex flex-col space-y-4">
            <span className="font-medium text-lg">Aperçu de la formation</span>
            <Card className="rounded-sm py-0">
              <CardContent className="grid grid-cols-4 p-0">
                {stats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className="relative flex items-center gap-2 px-4 py-8 text-center justify-center"
                  >
                    <span className="text-base font-medium">
                      {stat.value} {stat.description}
                    </span>
                    {index < stats.length - 1 && (
                      <span
                        className="absolute inset-y-3 right-0 w-px bg-border/50"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-col space-y-4">
            <span className="font-medium text-lg">Détails à connaître</span>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex flex-col">
                  <span className="font-medium">Certificat</span>
                  <span className="text-xs text-gray-800">
                    {formation.certificate
                      ? 'vous recevrez un certificat'
                      : "vous ne recevrez pas de certificat mais ca n'empêche pas d'apprendre efficacement"}
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-medium">Validité de la formation</span>
                <span className="text-xs text-gray-800">{formation.validity}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium">Langue d'enseignement</span>
                <span className="text-xs text-gray-800">{formation.language}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium">Mode d'apprentissage</span>
                <span className="text-xs text-gray-800">un apprentissage en ligne et sécurisé</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col space-y-4">
            <span className="font-medium text-lg">Structure du formation</span>
            <div className="space-y-3">
              {formation.programSteps.map((step, index) => {
                if (step.type === 'module') {
                  return <ProgramModule key={step.id} step={step} stepIndex={index} />;
                }

                return <ProgramEvaluation key={step.id} step={step} />;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
