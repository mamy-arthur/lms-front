"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AccessRules = {
    prevModuleCompleted: boolean;
    allModulesCompleted: boolean;
    prevModuleMinScore: boolean;
    prevModuleMinScoreValue: number;
};

const DEFAULT_RULES: AccessRules = {
    prevModuleCompleted: false,
    allModulesCompleted: false,
    prevModuleMinScore: false,
    prevModuleMinScoreValue: 50,
};

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialRules?: AccessRules;
    onSave: (rules: AccessRules) => void;
};

export function AccessRulesDialog({
    open,
    onOpenChange,
    initialRules,
    onSave,
}: Props) {
    const [rules, setRules] = useState<AccessRules>(
        initialRules ?? DEFAULT_RULES,
    );

    useEffect(() => {
        if (open) setRules(initialRules ?? DEFAULT_RULES);
    }, [open, initialRules]);

    const set = <K extends keyof AccessRules>(key: K, val: AccessRules[K]) =>
        setRules((r) => ({ ...r, [key]: val }));

    // Only one rule can be active at a time
    const selectRule = (
        rule:
            | "prevModuleCompleted"
            | "allModulesCompleted"
            | "prevModuleMinScore",
    ) =>
        setRules((r) => ({
            ...r,
            prevModuleCompleted: rule === "prevModuleCompleted",
            allModulesCompleted: rule === "allModulesCompleted",
            prevModuleMinScore: rule === "prevModuleMinScore",
        }));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Règles d'accès</DialogTitle>
                    <DialogDescription>
                        {" "}
                        Définissez les conditions requises pour accéder à
                        l'étape suivante.
                    </DialogDescription>
                </DialogHeader>

                <Separator />

                <div className="space-y-3 py-1">
                    {/* Rule 1 */}
                    <div className="flex items-start gap-2">
                        <Checkbox
                            id="r-prev"
                            checked={rules.prevModuleCompleted}
                            onCheckedChange={() =>
                                selectRule("prevModuleCompleted")
                            }
                            className="mt-0.5 data-[state=checked]:bg-(--color-primary) data-[state=checked]:border-(--color-primary)"
                        />
                        <span>Le module précédent est terminé</span>
                    </div>

                    {/* Rule 2 */}
                    <div className="flex items-start gap-2">
                        <Checkbox
                            id="r-all"
                            checked={rules.allModulesCompleted}
                            onCheckedChange={() =>
                                selectRule("allModulesCompleted")
                            }
                            className="mt-0.5 data-[state=checked]:bg-(--color-primary) data-[state=checked]:border-(--color-primary)"
                        />
                        <span>Tous les autres modules ont été terminés</span>
                    </div>

                    {/* Rule 3 */}
                    <div className="space-y-2">
                        <div className="flex items-start gap-2">
                            <Checkbox
                                id="r-score"
                                checked={rules.prevModuleMinScore}
                                onCheckedChange={() =>
                                    selectRule("prevModuleMinScore")
                                }
                                className="mt-0.5 data-[state=checked]:bg-(--color-primary) data-[state=checked]:border-(--color-primary)"
                            />
                            <span>
                                Le module précédent a obtenu au moins un certain
                                nombre de points
                            </span>
                        </div>
                        {rules.prevModuleMinScore && (
                            <div className="ml-6 flex items-center gap-2">
                                <Label
                                    htmlFor="r-score-val"
                                    className="text-muted-foreground"
                                >
                                    Minimum
                                </Label>
                                <Input
                                    id="r-score-val"
                                    type="number"
                                    min={0}
                                    value={rules.prevModuleMinScoreValue}
                                    onChange={(e) =>
                                        set(
                                            "prevModuleMinScoreValue",
                                            Number(e.target.value),
                                        )
                                    }
                                    className="w-24"
                                />
                                <span className="text-xs text-muted-foreground">
                                    points
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Annuler
                    </Button>
                    <Button
                        onClick={() => {
                            onSave(rules);
                            onOpenChange(false);
                        }}
                        className="bg-(--color-primary) hover:bg-(--color-primary)/50"
                    >
                        <Check />
                        Appliquer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
