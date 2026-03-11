import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Loader2, X } from "lucide-react";

interface DogPhotoUploadProps {
  tagId: number;
  currentUrl?: string | null;
  onUpload: (url: string) => void;
}

const MAX_SIDE = 800;
const JPEG_QUALITY = 0.80;
const MAX_BASE64_BYTES = 600 * 1024;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > MAX_SIDE || height > MAX_SIDE) {
        if (width > height) {
          height = Math.round((height * MAX_SIDE) / width);
          width = MAX_SIDE;
        } else {
          width = Math.round((width * MAX_SIDE) / height);
          height = MAX_SIDE;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas non supportato"));
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      const approxBytes = dataUrl.length * 0.75;
      if (approxBytes > MAX_BASE64_BYTES) {
        // Retry with lower quality
        const dataUrlLow = canvas.toDataURL("image/jpeg", 0.60);
        resolve(dataUrlLow);
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Impossibile leggere l'immagine"));
    };
    img.src = objectUrl;
  });
}

export function DogPhotoUpload({ tagId, currentUrl, onUpload }: DogPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Errore", description: "Seleziona un file immagine", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const compressed = await compressImage(file);
      setPreview(compressed);

      const res = await apiRequest("POST", "/api/upload/photo", {
        imageData: compressed,
        tagId,
      });
      const { url } = await res.json();
      onUpload(url);
      toast({ title: "Foto caricata!", description: "La foto del tuo cane è stata salvata." });
    } catch (err: any) {
      toast({ title: "Errore upload", description: err.message || "Riprova", variant: "destructive" });
      setPreview(currentUrl || null);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleRemove() {
    setPreview(null);
    onUpload("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {preview ? (
        <div className="relative w-32 h-32">
          <img
            src={preview}
            alt="Foto cane"
            className="w-32 h-32 rounded-full object-cover border-2 border-border"
          />
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
          {!isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:opacity-80"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div
          className="w-32 h-32 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <Camera className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="gap-2"
      >
        {isUploading ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Caricamento...</>
        ) : (
          <><Camera className="h-4 w-4" />{preview ? "Cambia foto" : "Carica foto"}</>
        )}
      </Button>
      <p className="text-xs text-muted-foreground">
        Max 800×800px · JPEG · Auto-compressa
      </p>
    </div>
  );
}
