import { FileText, Download } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { Separator } from "@/components/ui/separator";
import { CONTENT_TYPE_META } from "@/modules/shared/components/courses/types";
import { Badge } from "@/components/ui/badge";

interface FileContentViewProps {
    title: string;
    description?: string;
    fileName?: string;
}

export function FileContentView({
    title,
    description,
    fileName,
}: FileContentViewProps) {
    const type = CONTENT_TYPE_META["file"];
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
                    <>
                        <div className="react-markdown prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{description}</ReactMarkdown>
                        </div>
                    </>
                )}
                {fileName && (
                    <div className="bg-muted/40 flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                            <FileText className="text-muted-foreground size-4" />

                            <div>
                                <p className="font-medium">
                                    {fileName || "document.pdf"}
                                </p>

                                <p className="text-muted-foreground text-xs">
                                    Fichier à télécharger
                                </p>
                            </div>
                        </div>

                        <Button className="bg-(--color-primary) hover:bg-(--color-primary)/80">
                            <Download className="mr-2 size-4" />
                            Télécharger
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
