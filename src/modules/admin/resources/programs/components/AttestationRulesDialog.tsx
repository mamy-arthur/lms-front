"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AttestationRules = {
    avgScore: boolean;
    avgScoreMin: number;
    finalScore: boolean;
    finalScoreMin: number;
    noRule: boolean;
    retake: boolean;
    retakeTargetNodeId: string | null;
};

export type NodeOption = {
    id: string;
    label: string;
};

const DEFAULT_RULES: AttestationRules = {
    avgScore: false,
    avgScoreMin: 10,
    finalScore: false,
    finalScoreMin: 10,
    noRule: false,
    retake: false,
    retakeTargetNodeId: null,
};

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialRules?: AttestationRules;
    nodeOptions: NodeOption[];
    onSave: (rules: AttestationRules) => void;
};

export function AttestationRulesDialog({
    open,
    onOpenChange,
    initialRules,
    nodeOptions,
    onSave,
}: Props) {
    const [rules, setRules] = useState<AttestationRules>(
        initialRules ?? DEFAULT_RULES,
    );

    useEffect(() => {
        if (open) setRules(initialRules ?? DEFAULT_RULES);
    }, [open, initialRules]);

    const set = <K extends keyof AttestationRules>(
        key: K,
        val: AttestationRules[K],
    ) => setRules((r) => ({ ...r, [key]: val }));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        Règles d'obtention de l'attestation
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5">
                    {/* ── Obtention rules ── */}
                    <section className="space-y-3">
                        <p className="text-xs font-semibold text-foreground">
                            Règles d'obtention
                        </p>

                        {/* Average score */}
                        <div className="space-y-2">
                            <div className="flex items-start gap-2">
                                <Checkbox
                                    id="att-avg"
                                    checked={rules.avgScore}
                                    onCheckedChange={(v) =>
                                        set("avgScore", !!v)
                                    }
                                    className="mt-0.5"
                                />
                                <Label htmlFor="att-avg">
                                    Moyenne des évaluations supérieure ou égale
                                    à une valeur définie
                                </Label>
                            </div>
                            {rules.avgScore && (
                                <div className="ml-6 flex items-center gap-2">
                                    <Label
                                        htmlFor="att-avg-val"
                                        className="text-muted-foreground"
                                    >
                                        Valeur minimale
                                    </Label>
                                    <Input
                                        id="att-avg-val"
                                        type="number"
                                        min={0}
                                        value={rules.avgScoreMin}
                                        onChange={(e) =>
                                            set(
                                                "avgScoreMin",
                                                Number(e.target.value),
                                            )
                                        }
                                        className="w-24"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Final score */}
                        <div className="space-y-2">
                            <div className="flex items-start gap-2">
                                <Checkbox
                                    id="att-final"
                                    checked={rules.finalScore}
                                    onCheckedChange={(v) =>
                                        set("finalScore", !!v)
                                    }
                                    className="mt-0.5"
                                />
                                <Label htmlFor="att-final">
                                    Note de l'évaluation finale supérieure ou
                                    égale à une valeur définie
                                </Label>
                            </div>
                            {rules.finalScore && (
                                <div className="ml-6 flex items-center gap-2">
                                    <Label
                                        htmlFor="att-final-val"
                                        className="text-muted-foreground"
                                    >
                                        Valeur minimale
                                    </Label>
                                    <Input
                                        id="att-final-val"
                                        type="number"
                                        min={0}
                                        value={rules.finalScoreMin}
                                        onChange={(e) =>
                                            set(
                                                "finalScoreMin",
                                                Number(e.target.value),
                                            )
                                        }
                                        className="w-24"
                                    />
                                </div>
                            )}
                        </div>

                        {/* No rule */}
                        <div className="flex items-start gap-2">
                            <Checkbox
                                id="att-norule"
                                checked={rules.noRule}
                                onCheckedChange={(v) => set("noRule", !!v)}
                                className="mt-0.5"
                            />
                            <Label htmlFor="att-norule">
                                Aucune règle (attestation toujours obtenue)
                            </Label>
                        </div>
                    </section>

                    {/* ── Failure section ── */}
                    <section className="space-y-3 border-t pt-4">
                        <p className="text-xs font-semibold text-foreground">
                            En cas d'échec
                        </p>

                        <div className="flex items-start gap-2">
                            <Checkbox
                                id="att-retake"
                                checked={rules.retake}
                                onCheckedChange={(v) => {
                                    set("retake", !!v);
                                    if (!v) set("retakeTargetNodeId", null);
                                }}
                                className="mt-0.5"
                            />
                            <Label htmlFor="att-retake">Faire repasser</Label>
                        </div>

                        {rules.retake && (
                            <div className="ml-6 space-y-1.5">
                                <Label className="text-muted-foreground">
                                    Rediriger vers
                                </Label>
                                <Select
                                    value={rules.retakeTargetNodeId ?? ""}
                                    onValueChange={(v) =>
                                        set("retakeTargetNodeId", v || null)
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choisir un module ou une évaluation…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {nodeOptions.map((opt) => (
                                            <SelectItem
                                                key={opt.id}
                                                value={opt.id}
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </section>
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
                    >
                        Appliquer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
