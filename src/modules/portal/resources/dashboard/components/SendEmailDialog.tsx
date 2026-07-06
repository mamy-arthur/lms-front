'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

interface EmailTemplate {
  id: string;
  label: string;
  subject: string;
  body: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl-welcome',
    label: 'Message de bienvenue',
    subject: 'Bienvenue dans votre formation !',
    body: "Bonjour,\n\nNous sommes ravis de vous accueillir dans votre parcours de formation. N'hésitez pas à nous contacter si vous avez la moindre question.\n\nBonne formation !",
  },
  {
    id: 'tpl-reminder',
    label: 'Rappel de progression',
    subject: 'Un petit rappel sur votre formation',
    body: "Bonjour,\n\nNous avons remarqué que vous n'avez pas consulté votre formation récemment. Votre progression est en attente.\n\nRejoignez-nous dès maintenant pour continuer votre apprentissage !",
  },
  {
    id: 'tpl-deadline',
    label: 'Alerte échéance proche',
    subject: 'Votre échéance de formation approche',
    body: "Bonjour,\n\nNous vous informons que la date d'échéance de votre formation approche. Pensez à finaliser les modules restants avant la date limite.\n\nBonne continuation !",
  },
  {
    id: 'tpl-congrats',
    label: 'Félicitations',
    subject: 'Félicitations pour avoir terminé votre formation !',
    body: 'Bonjour,\n\nToutes nos félicitations ! Vous avez terminé avec succès votre parcours de formation. Votre certificat sera disponible sous peu.\n\nMerci pour votre engagement !',
  },
  {
    id: 'tpl-custom',
    label: 'Message personnalisé',
    subject: '',
    body: '',
  },
];

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Nom du destinataire pré-rempli dans le titre */
  recipientName?: string;
  /** Appelé lors de l'envoi avec le sujet et le contenu final */
  onSend: (subject: string, body: string) => void;
}

export function SendEmailDialog({
  open,
  onOpenChange,
  recipientName,
  onSend,
}: SendEmailDialogProps) {
  const [templateId, setTemplateId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  // Réinitialiser à l'ouverture
  useEffect(() => {
    if (open) {
      setTemplateId('');
      setSubject('');
      setBody('');
    }
  }, [open]);

  function handleTemplateChange(id: string) {
    setTemplateId(id);
    const tpl = EMAIL_TEMPLATES.find((t) => t.id === id);
    if (tpl) {
      setSubject(tpl.subject);
      setBody(tpl.body);
    }
  }

  function handleSend() {
    if (!subject.trim() || !body.trim()) return;
    onSend(subject.trim(), body.trim());
    onOpenChange(false);
  }

  const canSend = subject.trim().length > 0 && body.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Envoyer un e-mail{recipientName ? ` à ${recipientName}` : ''}</DialogTitle>
          <DialogDescription>
            Sélectionnez un modèle ou rédigez votre message manuellement.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="space-y-4">
          {/* Sélection du modèle */}
          <div className="space-y-2">
            <Label htmlFor="email-template">Modèle</Label>
            <Select value={templateId} onValueChange={handleTemplateChange}>
              <SelectTrigger id="email-template" className="w-full">
                <SelectValue placeholder="Choisir un modèle (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TEMPLATES.map((tpl) => (
                  <SelectItem key={tpl.id} value={tpl.id}>
                    {tpl.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sujet */}
          <div className="space-y-2">
            <Label htmlFor="email-subject">Sujet</Label>
            <Input
              id="email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Sujet de l'e-mail"
            />
          </div>

          {/* Contenu */}
          <div className="space-y-2">
            <Label htmlFor="email-body">Message</Label>
            <Textarea
              id="email-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Rédigez votre message…"
              rows={7}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            disabled={!canSend}
            onClick={handleSend}
            className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground"
          >
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
