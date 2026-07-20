import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Upload, FileArchive, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface MultiFileUploadFieldProps {
  label?: string;
  files: File[];
  accept?: string;
  hint?: string;
  maxFiles?: number;
  onFilesChange: (files: File[]) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function MultiFileUploadField({
  // label = 'Fichiers',
  files,
  accept,
  hint,
  maxFiles,
  onFilesChange,
}: MultiFileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const addFiles = (newFiles: FileList | File[] | undefined | null) => {
    if (!newFiles) return;
    const incoming = Array.from(newFiles);
    const existingKeys = new Set(files.map((f) => `${f.name}-${f.size}`));
    const deduped = incoming.filter((f) => !existingKeys.has(`${f.name}-${f.size}`));

    let merged = [...files, ...deduped];
    if (maxFiles) merged = merged.slice(0, maxFiles);

    onFilesChange(merged);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const isFull = maxFiles ? files.length >= maxFiles : false;

  return (
    <div className="space-y-2 w-full">
      <Label>{maxFiles ? ` (${files.length}/${maxFiles})` : ''}</Label>

      {!isFull && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`
                        flex flex-col items-center justify-center gap-2
                        w-full rounded-lg border border-dashed
                        px-6 py-8 text-center cursor-pointer transition-colors
                        ${
                          isDragging
                            ? 'border-primary bg-primary/5'
                            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                        }
                    `}
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Glisse-dépose des fichiers ici, ou{' '}
            <span className="text-primary font-medium">clique pour parcourir</span>
          </p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}-${index}`}
              className="flex items-center gap-3 w-full rounded-md border bg-background px-3 py-2"
            >
              <FileArchive className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="truncate text-xs flex-1 text-left">{file.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatSize(file.size)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          addFiles(e.target.files);
          e.target.value = ''; // permet de re-sélectionner le même fichier après suppression
        }}
      />
    </div>
  );
}
