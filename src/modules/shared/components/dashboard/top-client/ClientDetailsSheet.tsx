import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, Wallet } from "lucide-react";
import { getInitials } from "@/shared/lib/string/getInitials";
import { badgeColors, rankColors } from "./constants";
import { Client } from "./types";

type Props = {
    client: Client | null;
    rank: number;
    onClose: () => void;
};

export function ClientDetailsSheet({ client, rank, onClose }: Props) {
    if (!client) return null;

    const color = rankColors[rank];

    return (
        <Sheet open={!!client} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="sm:max-w-md">
                <SheetHeader className="border">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback
                                className={`${color.bg} ${color.text}`}
                            >
                                {getInitials(client.name)}
                            </AvatarFallback>
                        </Avatar>

                        <div>
                            <SheetTitle>{client.name}</SheetTitle>
                            <p className="text-xs text-muted-foreground">
                                {client.email}
                            </p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="mt-5 space-y-5 px-4">
                    <div
                        className={`rounded-xl p-4 flex items-center justify-between ${color.bg}`}
                    >
                        <div
                            className={`flex items-center gap-2 ${color.text}`}
                        >
                            <Wallet className="h-4 w-4" />
                            Solde portefeuille
                        </div>

                        <p className={`font-semibold ${color.text}`}>
                            {client.wallet.toFixed(2)} €
                        </p>
                    </div>

                    <div>
                        <div className="flex justify-between mb-3">
                            <p className="text-xs font-medium">
                                Formations achetées
                            </p>

                            <Badge className={badgeColors[rank]}>
                                {client.courses.length}
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            {client.courses.map((course) => (
                                <div
                                    key={course.id}
                                    className="border rounded-xl p-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <GraduationCap className="h-4 w-4" />
                                            {course.name}
                                        </div>

                                        <div className="flex items-center gap-2 text-xs">
                                            <Users className="h-3 w-3" />
                                            10 stagiaires
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
