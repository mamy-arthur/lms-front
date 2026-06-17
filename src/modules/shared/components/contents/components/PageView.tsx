import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { Separator } from "@/components/ui/separator";
import { CONTENT_TYPE_META } from "@/modules/admin/resources/courses/types";
import { Badge } from "@/components/ui/badge";

interface PageContentViewProps {
    title: string;
    description?: string;
    contenu?: string;
}

export function PageContentView({
    title,
    description,
    contenu,
}: PageContentViewProps) {
    const type = CONTENT_TYPE_META["page"];
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center gap-3">
                    <div className="space-y-1">
                        <CardTitle className="text-xs">
                            {title || "Titre du document"}
                        </CardTitle>
                    </div>
                    <Badge className={type.bgColor}>{type.label}</Badge>
                </div>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-6">
                {description && (
                    <div className="rounded-lg border bg-muted/20 p-2">
                        <p className="mb-3 text-xs font-medium">Description</p>

                        <div className="react-markdown prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{description}</ReactMarkdown>
                        </div>
                    </div>
                )}

                {contenu && (
                    <div className="rounded-lg border p-2">
                        <p className="mb-3 text-xs font-medium">
                            Contenu pédagogique
                        </p>

                        <div className="react-markdown prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{contenu}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
