import { useEffect, useState, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import type { PublicDogInfo } from "@shared/schema";
import { 
  Dog, 
  Phone, 
  MessageCircle, 
  Mail, 
  MapPin, 
  AlertTriangle, 
  Heart,
  QrCode,
  ExternalLink,
  Shield,
  Navigation
} from "lucide-react";

export default function PublicScanPage() {
  const [, params] = useRoute("/t/:publicId");
  const publicId = params?.publicId;
  const [scanLogged, setScanLogged] = useState(false);
  const [locationShared, setLocationShared] = useState<boolean | null>(null);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const scanLoggedRef = useRef(false);

  const { data: dogInfo, isLoading, error } = useQuery<PublicDogInfo>({
    queryKey: ["/api/tags", publicId, "public"],
    queryFn: async () => {
      const res = await fetch(`/api/tags/${publicId}/public`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Tag non trovato");
      }
      return res.json();
    },
    enabled: !!publicId,
    retry: false,
  });

  // Log scan event with GPS coordinates
  const scanMutation = useMutation({
    mutationFn: async (coords: { latitude?: number; longitude?: number }) => {
      await apiRequest("POST", `/api/tags/${publicId}/scan`, coords);
    },
  });

  // Show location popup when dogInfo is loaded
  useEffect(() => {
    if (!publicId || !dogInfo) return;
    if (scanLoggedRef.current) return;

    // Show the location choice popup
    setShowLocationPopup(true);
  }, [publicId, dogInfo]);

  const sendScan = (coords?: { latitude: number; longitude: number }) => {
    setScanLogged(true);
    setIsRequestingLocation(false);
    setLocationShared(coords ? true : false);
    scanMutation.mutate(coords || {});
  };

  // Handle user choosing to share location
  const handleShareLocation = () => {
    scanLoggedRef.current = true;
    setShowLocationPopup(false);
    setIsRequestingLocation(true);

    // Check if geolocation is available
    if ("geolocation" in navigator) {
      let resolved = false;
      
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log("GPS timeout - proceeding without location");
          sendScan();
        }
      }, 10000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            console.log("GPS success:", position.coords.latitude, position.coords.longitude);
            sendScan({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          }
        },
        (error) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            console.log("GPS error:", error.code, error.message);
            sendScan();
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 9000,
          maximumAge: 300000,
        }
      );
    } else {
      console.log("Geolocation not available");
      sendScan();
    }
  };

  // Handle user choosing to continue without location
  const handleContinueWithout = () => {
    scanLoggedRef.current = true;
    setShowLocationPopup(false);
    sendScan();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col items-center">
              <Skeleton className="w-32 h-32 rounded-full mb-6" />
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-6" />
              <Skeleton className="h-20 w-full mb-4" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !dogInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-destructive/5 to-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <QrCode className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2" data-testid="text-not-found-title">Medaglietta non trovata</h1>
            <p className="text-muted-foreground">
              Questa medaglietta non è stata ancora registrata o non esiste.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasPhone = dogInfo.showPhone && dogInfo.contactPhone;
  const hasWhatsapp = dogInfo.showWhatsapp && dogInfo.contactWhatsapp;
  const hasEmail = dogInfo.showEmail && dogInfo.contactEmail;
  const hasAnyContact = hasPhone || hasWhatsapp || hasEmail;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Heart className="h-4 w-4" />
            <span className="text-sm font-medium">Hai trovato questo cane?</span>
          </div>
          
          {/* Location status indicator */}
          {isRequestingLocation && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4 animate-pulse">
              <div className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300">
                <Navigation className="h-4 w-4 animate-spin" />
                <span className="text-sm">Richiesta posizione in corso...</span>
              </div>
            </div>
          )}
          
          {locationShared === true && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Posizione condivisa con il proprietario</span>
              </div>
            </div>
          )}

          {locationShared === false && scanLogged && (
            <div className="bg-muted/50 border border-border rounded-lg p-3 mb-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Scansione registrata</span>
              </div>
            </div>
          )}
        </div>

        {/* Location Permission Popup */}
        <Dialog open={showLocationPopup} onOpenChange={() => {}}>
          <DialogContent 
            className="max-w-sm [&>button]:hidden" 
            onPointerDownOutside={(e) => e.preventDefault()} 
            onEscapeKeyDown={(e) => e.preventDefault()} 
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Condividi la tua posizione?
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <DialogDescription className="text-sm leading-relaxed">
                Condividendo la posizione, invieremo al proprietario la geolocalizzazione del tuo dispositivo con data e ora della scansione. È facoltativo. Dopo 30 giorni cancelliamo l'intero evento di scansione (inclusi data/ora e dati tecnici).
              </DialogDescription>

              {showPrivacyDetails && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-1">Come usiamo la tua posizione:</p>
                      <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Inviamo le coordinate GPS al proprietario del cane</li>
                        <li>Includiamo data e ora della scansione</li>
                        <li>Dopo 30 giorni cancelliamo tutto l'evento di scansione</li>
                        <li>Non condividiamo i dati con terze parti</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleShareLocation}
                  className="w-full gap-2"
                  data-testid="button-share-location"
                >
                  <Navigation className="h-4 w-4" />
                  Condividi posizione
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleContinueWithout}
                  className="w-full"
                  data-testid="button-continue-without"
                >
                  Continua senza
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
                  className="w-full text-muted-foreground"
                  data-testid="button-privacy-details"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {showPrivacyDetails ? "Nascondi dettagli" : "Dettagli privacy"}
                </Button>
              </div>

              <div className="text-center">
                <a 
                  href="/privacy" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                  data-testid="link-privacy-policy"
                >
                  Informativa completa sulla privacy
                </a>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Main Card */}
        <Card className="shadow-xl border-0 overflow-hidden">
          {/* Photo/Avatar Section */}
          <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-8 flex justify-center">
            <div className="w-32 h-32 rounded-full bg-card shadow-lg flex items-center justify-center overflow-hidden ring-4 ring-background">
              {dogInfo.photoUrl ? (
                <img 
                  src={dogInfo.photoUrl} 
                  alt={dogInfo.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Dog className="h-16 w-16 text-primary" />
              )}
            </div>
          </div>

          <CardContent className="pt-6 pb-8 px-6">
            {/* Dog Name */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2" data-testid="text-dog-name">{dogInfo.name}</h1>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {dogInfo.breed && (
                  <Badge variant="secondary">{dogInfo.breed}</Badge>
                )}
                {dogInfo.sex && (
                  <Badge variant="outline">{dogInfo.sex}</Badge>
                )}
                {dogInfo.size && (
                  <Badge variant="outline">Taglia {dogInfo.size}</Badge>
                )}
              </div>
              {dogInfo.city && (
                <div className="flex items-center justify-center gap-1 text-muted-foreground mt-2">
                  <MapPin className="h-4 w-4" />
                  <span>{dogInfo.city}</span>
                </div>
              )}
            </div>

            {/* Medical Notes Alert */}
            {dogInfo.medicalNotes && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-destructive mb-1">Note mediche importanti</p>
                    <p className="text-sm" data-testid="text-medical-notes">{dogInfo.medicalNotes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            {dogInfo.instructionsText && (
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <p className="text-sm" data-testid="text-instructions">{dogInfo.instructionsText}</p>
              </div>
            )}

            {/* Contact Buttons */}
            {hasAnyContact ? (
              <div className="space-y-3">
                <p className="text-center text-sm text-muted-foreground mb-4">
                  Contatta il proprietario:
                </p>

                {hasPhone && (
                  <a href={`tel:${dogInfo.contactPhone}`} className="block">
                    <Button 
                      variant="default" 
                      size="lg" 
                      className="w-full gap-2"
                      data-testid="button-call"
                    >
                      <Phone className="h-5 w-5" />
                      Chiama {dogInfo.contactPhone}
                    </Button>
                  </a>
                )}

                {hasWhatsapp && (
                  <a 
                    href={`https://wa.me/${dogInfo.contactWhatsapp?.replace(/\D/g, '')}?text=Ciao! Ho trovato il tuo cane ${dogInfo.name}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button 
                      variant="secondary" 
                      size="lg" 
                      className="w-full gap-2 bg-[#25D366] text-white"
                      data-testid="button-whatsapp"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Scrivi su WhatsApp
                    </Button>
                  </a>
                )}

                {hasEmail && (
                  <a 
                    href={`mailto:${dogInfo.contactEmail}?subject=Ho trovato ${dogInfo.name}&body=Ciao! Ho trovato il tuo cane ${dogInfo.name}.`}
                    className="block"
                  >
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full gap-2"
                      data-testid="button-email"
                    >
                      <Mail className="h-5 w-5" />
                      Invia email
                    </Button>
                  </a>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p>Nessun contatto disponibile al momento.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <a 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Dog className="h-4 w-4" />
            <span>Protetto da FidoLink</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
