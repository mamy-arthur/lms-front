'use client';
import {
  Award,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Globe,
  GraduationCap,
  Layers,
  Lock,
  ShoppingCart,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useCartActions } from '@/modules/portal/resources/cart/hooks/useCartActions';
import { CartQuantityControls } from '@/modules/shared/components/store/CartQuantityControls';
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

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

function ProgramModule({ step, stepIndex }: { step: StoreModuleStep; stepIndex: number }) {
  return (
    <Accordion type="single" collapsible className="rounded-lg border border-border bg-background">
      <AccordionItem value={step.id} className="border-b-0">
        <AccordionTrigger className="px-3 py-3 no-underline hover:no-underline">
          <div className="flex items-center gap-2 text-left">
            <BookOpen className="size-4 text-(--color-primary)" />
            <span className="font-semibold text-xs">
              Module {stepIndex + 1} - {step.title}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3">
          <ul className="space-y-2">
            {step.lessons.map((lesson) => (
              <li
                key={`${step.id}-${lesson}`}
                className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-foreground truncate">{lesson}</span>
                </div>
                <Lock className="size-3.5 text-muted-foreground shrink-0" />
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function ProgramEvaluation({ step, stepIndex }: { step: StoreEvaluationStep; stepIndex: number }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Étape {stepIndex + 1}
          </p>
          <p className="mt-1 flex items-center gap-2 text-xs font-semibold">
            <ClipboardCheck className="size-4 text-(--color-primary)" />
            {step.title}
          </p>
        </div>
        <Lock className="size-4 text-muted-foreground" />
      </div>
    </div>
  );
}

export function FormationDetailsPage({ formation }: FormationDetailsPageProps) {
  const { add, increase, decrease, setQuantity, findItem, isMutatingFor } = useCartActions();

  const cartItem = findItem(formation.id);
  const isInCart = Boolean(cartItem);
  const isCartMutating = isMutatingFor({
    learningPathId: formation.id,
    cartItemId: cartItem?.id,
  });

  return (
    <div className="w-full space-y-6 pb-8">
      <div className="overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="relative min-h-64 bg-muted">
            {formation.coverImage ? (
              <img
                src={formation.coverImage}
                alt={formation.title}
                className="h-112.5 w-full object-cover rounded-sm"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <GraduationCap className="size-10" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-semibold leading-tight sm:text-2xl">{formation.title}</h1>
              <p className="mt-2 text-xs text-black">{formation.shortDescription}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              <div className="rounded-md border border-border/70 p-2">
                <p className="text-muted-foreground">Modules</p>
                <p className="mt-1 font-semibold">{formation.moduleCount}</p>
              </div>
              <div className="rounded-md border border-border/70 p-2">
                <p className="text-muted-foreground">Cours</p>
                <p className="mt-1 font-semibold">{formation.courseCount}</p>
              </div>
              <div className="rounded-md border border-border/70 p-2">
                <p className="text-muted-foreground">Évaluations</p>
                <p className="mt-1 font-semibold">{formation.evaluationCount}</p>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-3xl text-foreground">{formatPrice(formation.price)}</p>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                {isInCart && cartItem ? (
                  <CartQuantityControls
                    quantity={cartItem.quantity}
                    onDecrease={() => decrease(cartItem.id)}
                    onIncrease={() => increase(cartItem.id)}
                    onQuantityChange={(quantity) => setQuantity(cartItem.id, quantity)}
                    disabled={isCartMutating}
                  />
                ) : (
                  <Button
                    className="bg-(--color-primary) hover:bg-(--color-primary)/80"
                    onClick={() => add(formation.id)}
                    disabled={isCartMutating}
                  >
                    <ShoppingCart />
                    Ajouter au panier
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          {/* <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
              <CardDescription>
                Présentation complète de la formation avant achat de licences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-black">{formation.fullDescription}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ce que vous apprendrez</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2">
                {formation.learningObjectives.map((objective) => (
                  <li
                    key={objective}
                    className="flex items-start gap-2 rounded-md border border-border/60 p-3"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-(--color-primary)" />
                    <span className="text-xs text-foreground">{objective}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card> */}

          <Card>
            <CardHeader>
              <CardTitle>Programme</CardTitle>
              <CardDescription>
                Structure du parcours consultable. Le contenu pédagogique reste verrouillé avant
                achat.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {formation.programSteps.map((step, index) => {
                  if (step.type === 'module') {
                    return <ProgramModule key={step.id} step={step} stepIndex={index} />;
                  }

                  return <ProgramEvaluation key={step.id} step={step} stepIndex={index} />;
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Layers className="size-3.5" /> Niveau
                </span>
                <span className="font-medium">{formation.level}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Timer className="size-3.5" /> Durée
                </span>
                <span className="font-medium">{formation.duration}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="size-3.5" /> Langue
                </span>
                <span className="font-medium">{formation.language}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Award className="size-3.5" /> Certificat
                </span>
                <span className="font-medium">{formation.certificate ? 'Oui' : 'Non'}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="size-3.5" /> Dernière mise à jour
                </span>
                <span className="font-medium">{formatDate(formation.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="text-sm">Accès restreint avant achat</CardTitle>
              <CardDescription>
                Le client visualise uniquement la structure. Les cours, vidéos, ressources et
                évaluations restent verrouillés.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-background px-3 py-2 text-xs text-muted-foreground">
                <Lock className="size-3.5" />
                Contenu pédagogique non accessible avant achat.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
