import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ExternalLink, Clock, AlertTriangle, Dog } from "lucide-react";

interface LocationData {
  latitude: number;
  longitude: number;
  dogName: string | null;
  expiresAt: string;
}

export default function LocationPage() {
  const [, params] = useRoute("/location/:token");
  const token = params?.token;

  const { data: location, isLoading, error } = useQuery<LocationData>({
    queryKey: ["/api/location", token],
    queryFn: async () => {
      const res = await fetch(`/api/location/${token}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Posizione non trovata");
      }
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const openInGoogleMaps = () => {
    if (location) {
      const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      window.open(url, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Skeleton className="h-8 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-64 w-full mb-4" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    const isExpired = error.message.includes("scaduto");
    
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold mb-2">
              {isExpired ? "Link scaduto" : "Posizione non trovata"}
            </h1>
            <p className="text-muted-foreground">
              {isExpired
                ? "Questo link per la posizione è scaduto. I link sono validi per 30 giorni dalla scansione."
                : "Il link non è valido o la posizione non è più disponibile."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!location) {
    return null;
  }

  const mapsEmbedUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}&z=15&output=embed`;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              
              <h1 className="text-2xl font-bold mb-2">
                Posizione della scansione
              </h1>
              
              {location.dogName && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                  <Dog className="w-4 h-4" />
                  <span>Medaglietta di <strong>{location.dogName}</strong></span>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Valido fino al {formatDate(location.expiresAt)}</span>
              </div>
            </div>

            <div className="rounded-lg overflow-hidden border mb-4">
              <iframe
                src={mapsEmbedUrl}
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Posizione GPS"
                data-testid="map-iframe"
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-center">
                <strong>Coordinate:</strong> {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
            </div>

            <Button 
              className="w-full" 
              size="lg" 
              onClick={openInGoogleMaps}
              data-testid="button-open-maps"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Apri in Google Maps
            </Button>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground px-4">
          Questa è la posizione condivisa al momento della scansione della medaglietta. 
          Per motivi di privacy, il link scadrà automaticamente dopo 30 giorni.
        </p>
      </div>
    </div>
  );
}
