"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, GraduationCap, Users, Wallet } from "lucide-react";
import { getInitials } from "@/shared/lib/string/getInitials";

type Course = {
    id: string;
    name: string;
};

type Client = {
    id: string;
    name: string;
    email: string;
    wallet: number;
    courses: Course[];
};

const topClients: Client[] = [
    {
        id: "1",
        name: "Client First",
        email: "excellence-academy-client1@yopmail.com",
        wallet: 325,
        courses: [
            { id: "1", name: "React Avancé" },
            { id: "2", name: "Docker Fundamentals" },
            { id: "3", name: "Kubernetes Basics" },
        ],
    },
    {
        id: "2",
        name: "Noémie Lauret",
        email: "noemie.lauret@excellence-academy.fr",
        wallet: 120,
        courses: [
            { id: "4", name: "TypeScript Mastery" },
            { id: "5", name: "Next.js Expert" },
        ],
    },
    {
        id: "3",
        name: "Excellence Client 2",
        email: "excellence-academy.client2@yopmail.com",
        wallet: 80,
        courses: [{ id: "6", name: "Laravel Advanced" }],
    },
    {
        id: "4",
        name: "Client 4",
        email: "client4@yopmail.com",
        wallet: 50,
        courses: [{ id: "7", name: "Git & GitHub" }],
    },
    {
        id: "5",
        name: "Client 5",
        email: "client5@yopmail.com",
        wallet: 30,
        courses: [],
    },
];

const rankColors = [
    {
        bg: "bg-amber-100 dark:bg-amber-950",
        text: "text-amber-700 dark:text-amber-300",
    },
    {
        bg: "bg-slate-100 dark:bg-slate-800",
        text: "text-slate-600 dark:text-slate-300",
    },
    {
        bg: "bg-orange-100 dark:bg-orange-950",
        text: "text-orange-700 dark:text-orange-300",
    },
    {
        bg: "bg-blue-100 dark:bg-blue-950",
        text: "text-blue-600 dark:text-blue-300",
    },
    {
        bg: "bg-violet-100 dark:bg-violet-950",
        text: "text-violet-600 dark:text-violet-300",
    },
];

const badgeColors = [
    "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300",
    "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300",
    "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-950 dark:text-orange-300",
    "bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300",
    "bg-violet-100 text-violet-600 hover:bg-violet-200 dark:bg-violet-950 dark:text-violet-300",
];

export default function TopClientsCard() {
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const selectedIndex = selectedClient
        ? topClients.findIndex((c) => c.id === selectedClient.id)
        : 0;

    return (
        <>
            <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                        <CardTitle className="text-base font-semibold">
                            Top 5 Clients
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Par chiffre d'affaires
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground gap-1 h-7"
                    >
                        Voir tous
                        <ArrowRight className="h-3 w-3" />
                    </Button>
                </CardHeader>

                <CardContent className="space-y-1 pt-2">
                    {topClients.map((client, index) => {
                        const color = rankColors[index];
                        return (
                            <div
                                key={client.id}
                                className="flex items-center justify-between rounded-xl px-3 py-4 transition-colors bg-gray-100 group cursor-pointer"
                                onClick={() => setSelectedClient(client)}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarFallback
                                            className={`text-xs font-semibold ${color.bg} ${color.text}`}
                                        >
                                            {getInitials(client.name)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-medium leading-tight">
                                            {client.name}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {client.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="hidden text-right sm:block">
                                        <p className="text-sm font-semibold tabular-nums">
                                            {client.wallet.toFixed(2)} €
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            solde
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            <Sheet
                open={!!selectedClient}
                onOpenChange={(open) => !open && setSelectedClient(null)}
            >
                <SheetContent className="sm:max-w-md">
                    <SheetHeader className="border-b">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback
                                    className={`font-semibold ${rankColors[selectedIndex].bg} ${rankColors[selectedIndex].text}`}
                                >
                                    {selectedClient
                                        ? getInitials(selectedClient.name)
                                        : ""}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <SheetTitle className="text-base">
                                    {selectedClient?.name}
                                </SheetTitle>
                                <p className="text-xs text-muted-foreground">
                                    {selectedClient?.email}
                                </p>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="mt-5 space-y-5 px-4">
                        <div
                            className={`rounded-xl p-4 flex items-center justify-between ${rankColors[selectedIndex].bg}`}
                        >
                            <div
                                className={`flex items-center gap-2 text-sm ${rankColors[selectedIndex].text}`}
                            >
                                <Wallet className="h-4 w-4" />
                                Solde portefeuille
                            </div>
                            <p
                                className={`text-lg font-semibold tabular-nums ${rankColors[selectedIndex].text}`}
                            >
                                {selectedClient?.wallet.toFixed(2)} €
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-medium">
                                    Formations achetées
                                </p>
                                <Badge
                                    className={`rounded-full text-xs border-0 ${badgeColors[selectedIndex]}`}
                                >
                                    {selectedClient?.courses.length ?? 0}
                                </Badge>
                            </div>

                            <div className="space-y-2">
                                {selectedClient?.courses.length ? (
                                    selectedClient.courses.map((course) => (
                                        <div
                                            key={course.id}
                                            className="flex items-center justify-between rounded-xl border p-3 hover:bg-muted/40 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${rankColors[selectedIndex].bg}`}
                                                >
                                                    <GraduationCap
                                                        className={`h-3.5 w-3.5 ${rankColors[selectedIndex].text}`}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium truncate">
                                                    {course.name}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                {/* Nombre d'inscrits */}
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Users className="h-3 w-3" />
                                                    <span>10 stagiaire(s) inscrit(s)</span>
                                                </div>
                                                <div className="w-px h-3 bg-border" />
                                                <Badge
                                                    className={`rounded-full text-xs border-0 px-2 py-0 h-5 ${badgeColors[selectedIndex]}`}
                                                >
                                                    5{" "}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-xl border border-dashed p-8 text-center">
                                        <GraduationCap className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground">
                                            Aucune formation achetée
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
