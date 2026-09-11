import { useRef, useState, type ChangeEvent, type DragEvent, type MouseEvent } from 'react';
import { Upload, FileArchive, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/modules/shared/components/courses/contents/forms/fields/media-utils';

/**
 * 300 Mo. Le plafond n'est pas seulement une règle produit : au-delà, l'upload
 * échoue en pratique côté infra (`max_input_time` de PHP, `max_size` de Caddy),
 * et l'utilisateur n'obtient qu'une erreur réseau opaque après plusieurs
 * minutes d'attente. Refuser tout de suite vaut mieux que faire patienter.
 */
const DEFAULT_MAX_SIZE_BYTES = 300 * 1024 * 1024;

interface FileUploadFieldProps {
  label?: string;
  fileName: string | undefined;
  accept?: string;
  hint?: string;
  /** Taille maximale acceptée, en octets. Défaut : 300 Mo. */
  maxSizeBytes?: number;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}

export function FileUploadField({
  fileName,
  accept = 'application/xml,application/zip,.xml,.zip',
  hint = 'XML ou ZIP',
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  onFileSelect,
  onRemove,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const maxSizeLabel = `${Math.round(maxSizeBytes / (1024 * 1024))} Mo`;

  const handleFile = (file: File | undefined | null) => {
    if (!file) return;

    if (file.size > maxSizeBytes) {
      setError(
        `Fichier trop volumineux : ${formatFileSize(file.size)}. Maximum : ${maxSizeLabel}.`,
      );
      // Sans ce reset, resélectionner le MÊME fichier n'émet aucun `change` :
      // l'erreur resterait affichée sans que rien ne se passe.
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setError(null);
    onFileSelect(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleRemove = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setError(null);
    onRemove();
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2 w-full">
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
        {fileName ? (
          <div className="flex items-center gap-3 w-full max-w-sm rounded-md border bg-background px-3 py-2">
            <FileArchive className="h-5 w-5 text-muted-foreground shrink-0" />
            <span className="truncate text-xs flex-1 text-left">{fileName}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <Upload className="h-5 w-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Glisse-dépose un fichier ici, ou{' '}
              <span className="text-primary font-medium">clique pour parcourir</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {hint} · {maxSizeLabel} max
            </p>
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="size-3 shrink-0" />
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
