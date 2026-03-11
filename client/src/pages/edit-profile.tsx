import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { updateDogProfileSchema, type TagWithProfile } from "@shared/schema";
import {
  ArrowLeft,
  Loader2,
  Dog,
  Phone,
  MessageCircle,
  Mail,
  Bell,
  MapPin,
  Heart,
  Save
} from "lucide-react";
import { Link } from "wouter";
import { DogPhotoUpload } from "@/components/dog-photo-upload";

const formSchema = updateDogProfileSchema.extend({
  name: z.string().min(1, "Il nome è obbligatorio"),
});

export default function EditProfilePage() {
  const [, params] = useRoute("/edit/:tagId");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const tagId = params?.tagId;

  const { data: tags, isLoading } = useQuery<TagWithProfile[]>({
    queryKey: ["/api/tags"],
    enabled: !!user,
  });

  const tag = tags?.find((t) => t.id.toString() === tagId);
  const profile = tag?.dogProfile;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      photoUrl: "",
      breed: "",
      sex: "",
      size: "",
      birthdate: "",
      medicalNotes: "",
      instructionsText: "",
      contactPhone: "",
      contactWhatsapp: "",
      contactEmail: "",
      showPhone: true,
      showWhatsapp: true,
      showEmail: false,
      notifyOnScan: true,
      city: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        photoUrl: profile.photoUrl || "",
        breed: profile.breed || "",
        sex: profile.sex || "",
        size: profile.size || "",
        birthdate: profile.birthdate || "",
        medicalNotes: profile.medicalNotes || "",
        instructionsText: profile.instructionsText || "",
        contactPhone: profile.contactPhone || "",
        contactWhatsapp: profile.contactWhatsapp || "",
        contactEmail: profile.contactEmail || "",
        showPhone: profile.showPhone ?? true,
        showWhatsapp: profile.showWhatsapp ?? true,
        showEmail: profile.showEmail ?? false,
        notifyOnScan: profile.notifyOnScan ?? true,
        city: profile.city || "",
      });
    }
  }, [profile, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("PUT", `/api/tags/${tagId}/profile`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      toast({
        title: "Salvato!",
        description: "Le informazioni sono state aggiornate.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile salvare",
        variant: "destructive",
      });
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    try {
      await saveMutation.mutateAsync(values);
    } finally {
      setIsSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Devi accedere per vedere questa pagina.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Card>
          <CardContent className="pt-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Medaglietta non trovata.</p>
        <Link href="/dashboard">
          <Button variant="outline" className="mt-4">Torna alla dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link href="/dashboard">
        <Button variant="ghost" size="sm" className="gap-2 mb-6" data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
          Torna alla dashboard
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold" data-testid="text-edit-title">Modifica profilo</h1>
        <p className="text-muted-foreground">
          Medaglietta: <code className="bg-muted px-2 py-0.5 rounded font-mono">{tag.publicId}</code>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Dog Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dog className="h-5 w-5 text-primary" />
                Informazioni del cane
              </CardTitle>
              <CardDescription>
                I dati base del tuo amico a quattro zampe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="es. Fido" data-testid="input-dog-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foto del cane</FormLabel>
                    <FormControl>
                      <DogPhotoUpload
                        tagId={tag.id}
                        currentUrl={field.value || null}
                        onUpload={(url) => field.onChange(url)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="breed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razza</FormLabel>
                      <FormControl>
                        <Input placeholder="es. Labrador" data-testid="input-breed" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sesso</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-sex">
                            <SelectValue placeholder="Seleziona" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="maschio">Maschio</SelectItem>
                          <SelectItem value="femmina">Femmina</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taglia</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-size">
                            <SelectValue placeholder="Seleziona" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="piccola">Piccola</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="grande">Grande</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthdate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data di nascita</FormLabel>
                      <FormControl>
                        <Input type="date" data-testid="input-birthdate" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Città
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="es. Milano" data-testid="input-city" {...field} />
                    </FormControl>
                    <FormDescription>Sarà visibile sulla pagina pubblica</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contact Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Contatti per il ritrovamento
              </CardTitle>
              <CardDescription>
                Come vuoi essere contattato se qualcuno trova il tuo cane
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefono
                      </FormLabel>
                      <FormField
                        control={form.control}
                        name="showPhone"
                        render={({ field: switchField }) => (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Mostra</span>
                            <Switch
                              checked={switchField.value}
                              onCheckedChange={switchField.onChange}
                              data-testid="switch-show-phone"
                            />
                          </div>
                        )}
                      />
                    </div>
                    <FormControl>
                      <Input placeholder="+39 333 1234567" data-testid="input-phone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactWhatsapp"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </FormLabel>
                      <FormField
                        control={form.control}
                        name="showWhatsapp"
                        render={({ field: switchField }) => (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Mostra</span>
                            <Switch
                              checked={switchField.value}
                              onCheckedChange={switchField.onChange}
                              data-testid="switch-show-whatsapp"
                            />
                          </div>
                        )}
                      />
                    </div>
                    <FormControl>
                      <Input placeholder="+39 333 1234567" data-testid="input-whatsapp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </FormLabel>
                      <FormField
                        control={form.control}
                        name="showEmail"
                        render={({ field: switchField }) => (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Mostra</span>
                            <Switch
                              checked={switchField.value}
                              onCheckedChange={switchField.onChange}
                              data-testid="switch-show-email"
                            />
                          </div>
                        )}
                      />
                    </div>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" data-testid="input-email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Medical & Instructions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Note e istruzioni
              </CardTitle>
              <CardDescription>
                Informazioni utili per chi trova il tuo cane
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="medicalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note mediche essenziali</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="es. ALLERGIE, DIABETE, NON INSEGUIRE..."
                        className="resize-none"
                        rows={3}
                        data-testid="textarea-medical"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Solo informazioni critiche per la sicurezza</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instructionsText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Istruzioni per chi trova il cane</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="es. Se trovate questo cane, per favore contattatemi. È molto socievole..."
                        className="resize-none"
                        rows={4}
                        data-testid="textarea-instructions"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Notifications Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifiche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notifyOnScan"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Notifica scansioni</FormLabel>
                      <FormDescription>
                        Ricevi un'email ogni volta che qualcuno scansiona la medaglietta
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-notify"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            size="lg" 
            className="w-full gap-2"
            disabled={isSaving}
            data-testid="button-save"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salva modifiche
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
