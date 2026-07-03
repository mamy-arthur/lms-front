"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    BookOpen,
    CalendarIcon,
    CircleDollarSign,
    Eye,
    EyeOff,
    Image,
    X,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProgramFormValues {
    name: string;
    description: string;
    visible: boolean;
    deadline: Date | undefined;
    category: string;
    image: File | null;
    publishedAt: Date | undefined;
    author: string;
    cost: string;
    currency: string;
}

interface ProgramFormPanelProps {
    values: ProgramFormValues;
    onChange: (values: ProgramFormValues) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
    { value: "tech", label: "Technologie" },
    { value: "business", label: "Business" },
    { value: "design", label: "Design" },
    { value: "marketing", label: "Marketing" },
    { value: "management", label: "Management" },
    { value: "language", label: "Langues" },
    { value: "other", label: "Autre" },
];

const CURRENCIES = [
    { value: "EUR", label: "EUR (€)" },
    { value: "USD", label: "USD ($)" },
    { value: "GBP", label: "GBP (£)" },
    { value: "MAD", label: "MAD (د.م.)" },
    { value: "XOF", label: "XOF (Fr)" },
];

// ─── Date Picker ─────────────────────────────────────────────────────────────

function DatePickerField({
    value,
    onChange,
    placeholder,
}: {
    value: Date | undefined;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        "h-8 w-full justify-between px-3 text-xs font-normal",
                        !value && "text-muted-foreground",
                    )}
                >
                    <span>
                        {value
                            ? format(value, "dd MMM yyyy", { locale: fr })
                            : placeholder}
                    </span>
                    <CalendarIcon className="size-3.5 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={(date) => {
                        onChange(date);
                        setOpen(false);
                    }}
                    locale={fr}
                />
            </PopoverContent>
        </Popover>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProgramFormPanel({ values, onChange }: ProgramFormPanelProps) {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const set = <K extends keyof ProgramFormValues>(
        key: K,
        value: ProgramFormValues[K],
    ) => onChange({ ...values, [key]: value });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        set("image", file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) =>
                setImagePreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    };

    const clearImage = () => {
        set("image", null);
        setImagePreview(null);
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    return (
        <aside className="flex h-full w-full flex-col overflow-hidden border-l bg-background">
            {/* Header */}
            <div className="shrink-0 border-b px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
                        <BookOpen className="size-3.5 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold leading-none">
                            Formation
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Informations générales
                        </p>
                    </div>
                </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-5">
                    {/* ── Section: Général ── */}
                    <section className="space-y-3.5">
                        <SectionTitle label="Général" />

                        <div className="space-y-2">
                            <Label htmlFor="name">Nom de la formation</Label>
                            <Input
                                id="name"
                                value={values.name}
                                onChange={(e) => set("name", e.target.value)}
                                placeholder="Ex: Formation React avancé"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={values.description}
                                onChange={(e) =>
                                    set("description", e.target.value)
                                }
                                placeholder="Décrivez l'objectif de cette formation..."
                                className="min-h-20 resize-none"
                                rows={3}
                            />
                        </div>

                        {/* Image upload */}
                        <div className="space-y-2">
                            <Label>Image de couverture</Label>
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                            {imagePreview ? (
                                <div className="group relative overflow-hidden rounded-lg border">
                                    {/* biome-ignore lint/performance/noImgElement: preview of uploaded file, no URL optimization needed */}
                                    <img
                                        src={imagePreview}
                                        alt="Aperçu"
                                        className="h-28 w-full object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                        <Button
                                            type="button"
                                            size="xs"
                                            variant="secondary"
                                            onClick={() =>
                                                imageInputRef.current?.click()
                                            }
                                        >
                                            Changer
                                        </Button>
                                        <Button
                                            type="button"
                                            size="xs"
                                            variant="destructive"
                                            onClick={clearImage}
                                        >
                                            <X className="size-3" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() =>
                                        imageInputRef.current?.click()
                                    }
                                    className="flex h-20 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/25 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/20"
                                >
                                    <Image className="size-5" />
                                    <span className="text-[11px]">
                                        Cliquez pour uploader
                                    </span>
                                </button>
                            )}
                        </div>
                    </section>

                    <Separator />

                    {/* ── Section: Paramètres ── */}
                    <section className="space-y-3.5">
                        <SectionTitle label="Paramètres" />
                        <div className="space-y-2">
                            <Label htmlFor="category">Catégorie</Label>
                            <Select
                                value={values.category}
                                onValueChange={(v) => set("category", v)}
                            >
                                <SelectTrigger id="category" className="w-full">
                                    <SelectValue placeholder="Choisir une catégorie" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((cat) => (
                                        <SelectItem
                                            key={cat.value}
                                            value={cat.value}
                                        >
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="author">Auteur</Label>
                            <Input
                                id="author"
                                value={values.author}
                                onChange={(e) => set("author", e.target.value)}
                                placeholder="Nom de l'auteur"
                            />
                        </div>

                        {/* Visibility toggle */}
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="visible">Visibilité</Label>
                                <p className="text-xs text-muted-foreground">
                                    {values.visible ? (
                                        <span className="flex items-center gap-1">
                                            <Eye className="size-3" /> Visible
                                            dans le boutique
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            <EyeOff className="size-3" />{" "}
                                            Masquée pour le moment
                                        </span>
                                    )}
                                </p>
                            </div>
                            <Switch
                                id="visible"
                                checked={values.visible}
                                onCheckedChange={(v) => set("visible", v)}
                                className="data-[state=checked]:bg-(--color-primary)"
                            />
                        </div>
                    </section>

                    <Separator />

                    {/* ── Section: Planning ── */}
                    <section className="space-y-3.5">
                        <SectionTitle label="Planning" />

                        <div className="space-y-2">
                            <Label>Date de publication</Label>
                            <DatePickerField
                                value={values.publishedAt}
                                onChange={(d) => set("publishedAt", d)}
                                placeholder="Sélectionner une date"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Date limite</Label>
                            <DatePickerField
                                value={values.deadline}
                                onChange={(d) => set("deadline", d)}
                                placeholder="Aucune date limite"
                            />
                        </div>
                    </section>

                    <Separator />

                    {/* ── Section: Tarification ── */}
                    <section className="space-y-3.5">
                        <SectionTitle label="Tarification" />

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="cost">Coût</Label>
                                <div className="relative">
                                    <CircleDollarSign className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="cost"
                                        type="number"
                                        min={0}
                                        value={values.cost}
                                        onChange={(e) =>
                                            set("cost", e.target.value)
                                        }
                                        placeholder="0"
                                        className="pl-7"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="currency">Devise</Label>
                                <Select
                                    value={values.currency}
                                    onValueChange={(v) => set("currency", v)}
                                >
                                    <SelectTrigger
                                        id="currency"
                                        className="w-full"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CURRENCIES.map((c) => (
                                            <SelectItem
                                                key={c.value}
                                                value={c.value}
                                            >
                                                {c.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </aside>
    );
}

// ─── Section Title ─────────────────────────────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
    return (
        <p className="text-[11px] font-bold uppercase tracking-wider">
            {label}
        </p>
    );
}
