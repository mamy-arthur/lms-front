import ReactMarkdown from "react-markdown";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CONTENT_TYPE_META } from "@/modules/shared/components/courses/types";

interface TextContentViewProps {
    title: string;
    text?: string;
}

export function TextContentView({ title, text }: TextContentViewProps) {
    const type = CONTENT_TYPE_META["text-media"];
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-xs">
                        {title || "Zone de texte"}
                    </CardTitle>
                    <Badge className={type.bgColor}>{type.label}</Badge>
                </div>
            </CardHeader>
            <Separator />
            <CardContent>
                {text ? (
                    <div
                        className="
                        react-markdown
                            prose
                            prose-sm
                            dark:prose-invert
                            max-w-none
                        "
                    >
                        <ReactMarkdown>{text}</ReactMarkdown>
                    </div>
                ) : (
                    <p className="text-muted-foreground text-sm italic">
                        Aucun contenu renseigné.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
