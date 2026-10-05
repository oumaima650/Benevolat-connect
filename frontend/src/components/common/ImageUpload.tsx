import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  id?: string;
}

/**
 * Composant épuré de sélection et téléversement d'image depuis l'ordinateur ou le téléphone portable.
 * Téléverse automatiquement vers Cloudinary si configuré, ou convertit en Base64 en mode local.
 */
export function ImageUpload({ label, value, onChange, id = "image-upload" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cloudName = import.meta.env["VITE_CLOUDINARY_CLOUD_NAME"] as string | undefined;
  const uploadPreset = import.meta.env["VITE_CLOUDINARY_UPLOAD_PRESET"] as string | undefined;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Veuillez sélectionner un fichier image valide (JPG, PNG, WebP...).");
      return;
    }

    // Limite de taille 5 Mo
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5 Mo.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      if (cloudName && uploadPreset) {
        // Envoi direct vers l'API REST Cloudinary (Unsigned Upload)
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          onChange(data.secure_url || data.url);
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || "Échec de l'envoi vers Cloudinary.");
        }
      } else {
        // Mode secours : Conversion locale en Base64 data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          onChange(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors du téléversement de l'image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="font-bold block">
        {label}
      </Label>

      <div className="flex items-center gap-4">
        {/* Aperçu de la photo si définie */}
        {value ? (
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 border-ink shadow-sm bg-muted group">
            <img src={value} alt="Aperçu" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1 right-1 p-1 bg-pink text-paper rounded-full border border-ink hover:opacity-90 transition-opacity"
              title="Supprimer la photo"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="h-20 w-20 flex-shrink-0 rounded-xl border-2 border-dashed border-ink/40 bg-paper/50 flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="h-6 w-6 text-muted-foreground/60" />
            <span className="text-[10px] mt-1">Aucune photo</span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-ink font-bold hover:bg-mustard text-xs flex items-center gap-1.5 py-2 px-3 rounded-lg"
          >
            {uploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Téléversement en cours…
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" /> Choisir une photo (Fichier)
              </>
            )}
          </Button>
          <span className="text-[11px] text-muted-foreground">
            Formats acceptés : JPG, PNG, WebP (Max 5 Mo)
          </span>
        </div>
      </div>

      {error && <p className="text-xs text-pink font-semibold mt-1">{error}</p>}
    </div>
  );
}
