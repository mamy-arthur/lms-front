import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCourseStore } from "../../hooks/useCouseContentStore";
import { CONTENT_TYPE_META, ContentType } from "../../types";
import { PageForm } from "./forms/PageForm";
import { FileForm } from "./forms/FileForm";
import { FolderForm } from "./forms/FolderForm";
import { ScormForm } from "./forms/ScormForm";
import { UrlForm } from "./forms/UrlForm";
import { TextMediaForm } from "./forms/TextMediaForm";
import { SurveyForm } from "./forms/SurveyForm";

const VALID: ContentType[] = [
  "page",
  "file",
  "folder",
  "scorm",
  "url",
  "survey",
  "text-media",
];

function SectionContent() {
  const section = useCourseStore((s) => s.getSection(sectionId));
  const addContent = useCourseStore((s) => s.addContent);
  const ctype = type as ContentType;
  const meta = CONTENT_TYPE_META[ctype];

  const goBack = () => {};

  const handleSave = (title: string, data: Record<string, unknown>) => {
    addContent(sectionId, ctype, title, data);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-6 py-5">
          <Link
            href="/course"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Retour au cours
          </Link>
          <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {section?.title}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Nouveau contenu · {meta.label}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {ctype === "page" && (
          <PageForm
            onCancel={goBack}
            onSubmit={(v) => handleSave(v.title, v)}
          />
        )}
        {ctype === "file" && (
          <FileForm onCancel={goBack} onSubmit={(v) => handleSave(v.title, v)} />
        )}
        {ctype === "folder" && (
          <FolderForm onCancel={goBack} onSubmit={(v) => handleSave(v.title, v)} />
        )}
        {ctype === "scorm" && (
          <ScormForm onCancel={goBack} onSubmit={(v) => handleSave(v.title, v)} />
        )}
        {ctype === "url" && (
          <UrlForm onCancel={goBack} onSubmit={(v) => handleSave(v.title, v)} />
        )}
        {ctype === "text-media" && (
          <TextMediaForm onCancel={goBack} onSubmit={(v) => handleSave(v.title, v)} />
        )}
        {ctype === "survey" && (
          <SurveyForm onCancel={goBack} onSubmit={(v) => handleSave(v.title, v)} />
        )}
      </main>
    </div>
  );
}