import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { claimTagSchema, type TagWithProfile } from "@shared/schema";
import { 
  Plus, 
  QrCode, 
  Loader2, 
  Dog, 
  Edit, 
  ExternalLink, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Mail,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [isClaimLoading, setIsClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const { data: tags, isLoading } = useQuery<TagWithProfile[]>({
    queryKey: ["/api/tags"],
  });

  const claimForm = useForm<z.infer<typeof claimTagSchema>>({
    resolver: zodResolver(claimTagSchema),
    defaultValues: {
      claimCode: "",
    },
  });

  async function handleClaimTag(data: { claimCode: string }) {
    setIsClaimLoading(true);
    setClaimError(null);
    
    try {
      const res = await fetch("/api/tags/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        setClaimError("Il codice inserito non è valido o è già stato utilizzato. Verifica di aver inserito il codice correttamente.");
        setIsClaimLoading(false);
        return;
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      toast({
        title: "Medaglietta registrata!",
        description: "Ora puoi aggiungere le informazioni del tuo cane.",
      });
      setIsClaimDialogOpen(false);
      claimForm.reset();
      setClaimError(null);
    } catch {
      setClaimError("Errore di connessione. Riprova più tardi.");
    } finally {
      setIsClaimLoading(false);
    }
  }

  async function onClaimSubmit(values: z.infer<typeof claimTagSchema>) {
    await handleClaimTag(values);
  }

  function handleClaimDialogChange(open: boolean) {
    setIsClaimDialogOpen(open);
    if (!open) {
      setClaimError(null);
      claimForm.reset();
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Devi accedere per vedere questa pagina.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">Le tue medagliette</h1>
          <p className="text-muted-foreground">Gestisci i profili dei tuoi cani</p>
        </div>

        <Dialog open={isClaimDialogOpen} onOpenChange={handleClaimDialogChange}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-claim-tag">
              <Plus className="h-4 w-4" />
              Registra medaglietta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registra una nuova medaglietta</DialogTitle>
              <DialogDescription>
                Inserisci il codice segreto che trovi sulla confezione della medaglietta.
              </DialogDescription>
            </DialogHeader>
            <Form {...claimForm}>
              <form onSubmit={claimForm.handleSubmit(onClaimSubmit)} className="space-y-4">
                <FormField
                  control={claimForm.control}
                  name="claimCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Codice di registrazione</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="DS-XXXX-XXXX"
                          className="font-mono text-center text-lg tracking-widest"
                          data-testid="input-claim-code"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {claimError && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20" data-testid="text-claim-error">
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive text-sm">Codice non valido</p>
                      <p className="text-sm text-muted-foreground mt-1">{claimError}</p>
                    </div>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isClaimLoading}
                  data-testid="button-claim-submit"
                >
                  {isClaimLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifica in corso...
                    </>
                  ) : (
                    "Registra"
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tags && tags.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tags.map((tag) => (
            <TagCard key={tag.id} tag={tag} />
          ))}
        </div>
      ) : (
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <QrCode className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nessuna medaglietta</h3>
            <p className="text-muted-foreground mb-6">
              Non hai ancora registrato nessuna medaglietta. Inizia aggiungendo il codice della tua prima medaglietta.
            </p>
            <Button onClick={() => setIsClaimDialogOpen(true)} className="gap-2" data-testid="button-claim-empty">
              <Plus className="h-4 w-4" />
              Registra la tua prima medaglietta
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const RENEWAL_LINK = "https://dogsport.it/prodotto/aggiornamento-fidolink/";

function getTagStatus(expiresAt: Date | string | null): { 
  status: 'active' | 'expiring' | 'expired'; 
  label: string; 
  variant: 'default' | 'secondary' | 'destructive';
  daysLeft?: number;
} {
  if (!expiresAt) {
    return { status: 'active', label: 'Attiva', variant: 'default' };
  }
  const now = new Date();
  const expDate = new Date(expiresAt);
  const diffTime = expDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  if (expDate < now) {
    return { status: 'expired', label: 'Scaduta', variant: 'destructive', daysLeft: 0 };
  } else if (diffTime < thirtyDays) {
    return { status: 'expiring', label: `Scade tra ${daysLeft} giorni`, variant: 'secondary', daysLeft };
  }
  return { status: 'active', label: 'Attiva', variant: 'default', daysLeft };
}

function TagCard({ tag }: { tag: TagWithProfile }) {
  const profile = tag.dogProfile;
  const hasProfile = profile && profile.name;
  const tagStatus = getTagStatus(tag.expiresAt);

  return (
    <Card className="hover-elevate transition-all" data-testid={`card-tag-${tag.id}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {profile?.photoUrl ? (
              <img 
                src={profile.photoUrl} 
                alt={profile.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <Dog className="h-8 w-8 text-primary" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            {hasProfile ? (
              <>
                <h3 className="font-semibold text-lg truncate" data-testid={`text-dog-name-${tag.id}`}>
                  {profile.name}
                </h3>
                {profile.breed && (
                  <p className="text-sm text-muted-foreground truncate">{profile.breed}</p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {profile.city && (
                    <Badge variant="secondary" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {profile.city}
                    </Badge>
                  )}
                  {profile.showPhone && profile.contactPhone && (
                    <Badge variant="outline" className="gap-1">
                      <Phone className="h-3 w-3" />
                    </Badge>
                  )}
                  {profile.showWhatsapp && profile.contactWhatsapp && (
                    <Badge variant="outline" className="gap-1">
                      <MessageCircle className="h-3 w-3" />
                    </Badge>
                  )}
                  {profile.showEmail && profile.contactEmail && (
                    <Badge variant="outline" className="gap-1">
                      <Mail className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="font-medium text-destructive">Profilo incompleto</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Aggiungi le informazioni del tuo cane
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Badge variant={tagStatus.variant} className="gap-1">
            {tagStatus.status === 'active' && <CheckCircle className="h-3 w-3" />}
            {tagStatus.status === 'expiring' && <Clock className="h-3 w-3" />}
            {tagStatus.status === 'expired' && <XCircle className="h-3 w-3" />}
            {tagStatus.label}
          </Badge>
          {tag.expiresAt && (
            <span className="text-xs text-muted-foreground">
              Scade il {format(new Date(tag.expiresAt), "dd MMM yyyy", { locale: it })}
            </span>
          )}
        </div>

        {(tagStatus.status === 'expiring' || tagStatus.status === 'expired') && (
          <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">
                  {tagStatus.status === 'expired' 
                    ? "Medaglietta scaduta" 
                    : "La tua medaglietta sta per scadere"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {tagStatus.status === 'expired' 
                    ? "Il servizio non è più attivo. Rinnova per continuare a proteggere il tuo cane." 
                    : "Rinnova ora per mantenere attivo il servizio."}
                </p>
                <a href={RENEWAL_LINK} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="gap-1 mt-2" data-testid={`button-renew-${tag.id}`}>
                    <RefreshCw className="h-3 w-3" />
                    Rinnova ora
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t gap-2">
          <code className="text-xs bg-muted px-2 py-1 rounded font-mono" data-testid={`text-public-id-${tag.id}`}>
            {tag.publicId}
          </code>
          <div className="flex gap-2">
            <Link href={`/t/${tag.publicId}`}>
              <Button variant="ghost" size="sm" className="gap-1" data-testid={`button-view-public-${tag.id}`}>
                <ExternalLink className="h-4 w-4" />
                Anteprima
              </Button>
            </Link>
            <Link href={`/edit/${tag.id}`}>
              <Button variant="outline" size="sm" className="gap-1" data-testid={`button-edit-${tag.id}`}>
                <Edit className="h-4 w-4" />
                Modifica
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
