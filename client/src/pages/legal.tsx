import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, Send, Mail, Loader2, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function LegalPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      email: "",
      message: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await apiRequest("POST", "/api/contact", data);
      return response.json();
    },
    onSuccess: () => {
      setSuccess(true);
      form.reset();
      setTimeout(() => {
        setDialogOpen(false);
        setSuccess(false);
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile inviare il messaggio",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    contactMutation.mutate(data);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="gap-2 mb-6" data-testid="button-back-home">
            <ArrowLeft className="h-4 w-4" />
            Torna alla Home
          </Button>
        </Link>

        <Card>
          <CardHeader className="text-center border-b">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl md:text-3xl" data-testid="text-legal-title">
              Informative Legali
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Informativa sulla privacy e condizioni del servizio FidoLink
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none pt-6">
            
            {/* Sezione 1 */}
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-3 text-foreground">1. Titolare del trattamento e gestore del servizio</h2>
              <p className="text-muted-foreground leading-relaxed">
                Il servizio FidoLink è gestito da:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg mt-3">
                <p className="font-semibold text-foreground">Teodoro S.r.l. Semplificata</p>
                <p className="text-muted-foreground">Sede legale: Acqui Terme (AL), Italia</p>
                <p className="text-muted-foreground">Codice Fiscale / Partita IVA: IT02698950066</p>
              </div>
              <p className="text-muted-foreground mt-3 leading-relaxed">
                Teodoro S.r.l. Semplificata è il Titolare del trattamento dei dati personali ai sensi del Regolamento (UE) 2016/679 (GDPR).
              </p>
              <p className="text-muted-foreground mt-3 leading-relaxed">
                <strong className="text-foreground">Contatti privacy:</strong> è possibile inviare richieste relative ai dati personali anche via email all'indirizzo indicato nella sezione "Contatti" (in alternativa al modulo).
              </p>
            </section>

            {/* Sezione 2 */}
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-3 text-foreground">2. Ambito di applicazione del servizio</h2>
              <p className="text-muted-foreground leading-relaxed">
                Il servizio è destinato principalmente a utenti residenti nell'Unione Europea. La scansione del QR code può avvenire anche da altri Paesi; in tal caso i dati vengono trattati secondo quanto descritto nella presente informativa.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Il presente servizio è regolato dalla legge italiana. Per ogni controversia è competente il foro italiano, salvo diverse disposizioni inderogabili di legge.
              </p>
            </section>

            {/* Sezione 3 */}
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-3 text-foreground">3. Descrizione del servizio</h2>
              <p className="text-muted-foreground leading-relaxed">
                FidoLink è un servizio digitale che consente al proprietario di un cane di associare una medaglietta identificativa con QR code a un profilo online, inserire informazioni relative al cane e ai contatti del proprietario, rendere tali informazioni pubblicamente accessibili tramite scansione del QR code e ricevere notifiche in caso di scansione della medaglietta.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                <strong className="text-foreground">Il servizio non garantisce in alcun modo il ritrovamento del cane.</strong>
              </p>
            </section>

            {/* Sezione 4 */}
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-3 text-foreground">4. Dati personali trattati</h2>
              <p className="text-muted-foreground leading-relaxed">
                Il servizio tratta:
              </p>
              <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Dati dell'utente registrato</strong> (email, password memorizzata in forma hashata, preferenze notifiche)</li>
                <li><strong className="text-foreground">Dati relativi al cane</strong> inseriti volontariamente (nome, foto, caratteristiche, istruzioni e note inserite dall'utente, inclusa l'eventuale presenza di informazioni di natura sanitaria/non certificata)</li>
                <li><strong className="text-foreground">Dati tecnici</strong> (data/ora scansione, user agent, IP anonimizzato)</li>
                <li><strong className="text-foreground">Dati di geolocalizzazione</strong> (solo se condivisi volontariamente da chi scansiona il QR code): posizione/coordinate associate alla scansione, con data e ora</li>
              </ul>
            </section>

            {/* Sezione 5 */}
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-3 text-foreground">5. Dati NON trattati</h2>
              <p className="text-muted-foreground leading-relaxed">
                Il servizio non raccoglie:
              </p>
              <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-1">
                <li>Documenti di identità</li>
                <li>Dati di pagamento (eventuali acquisti/rinnovi avvengono sul sito web indicato dal gestore)</li>
                <li>Dati biometrici</li>
                <li>Dati di marketing</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                <strong className="text-foreground">Il servizio non raccoglie la posizione in automatico:</strong> la geolocalizzazione viene trattata solo se l'utente che scansiona sceglie esplicitamente di condividerla.
              </p>
            </section>

            {/* Sezione 6 */}
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-3 text-foreground">6. Pagina pubblica del cane</h2>
              <p className="text-muted-foreground leading-relaxed">
                La scansione del QR code rende accessibile una pagina pubblica visibile da chiunque.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                L'utente accetta che i dati inseriti possano essere pubblicamente visibili in base alle impostazioni di visibilità scelte. In particolare: telefono e WhatsApp possono essere resi visibili, mentre l'email può essere oscurata.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                L'utente è consapevole che la pubblicazione di dati di contatto può comportare contatti indesiderati da parte di terzi e può in qualunque momento modificare le impostazioni di visibilità o disattivare i dati mostrati nella pagina pubblica dalla propria area personale.
              </p>
            </section>

            {/* Sezione 7 */}
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-3 text-foreground">7. Accettazione delle condizioni e consenso dove necessario</h2>
              <p className="text-muted-foreground leading-relaxed">
                Durante la registrazione l'utente deve accettare la presente informativa e le condizioni del servizio. L'accettazione viene registrata.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                La condivisione della posizione da parte di chi scansiona è facoltativa e avviene solo su scelta esplicita dell'utente che scansiona (azione equivalente a consenso per tale specifica finalità). Chi scansiona può continuare a visualizzare la pagina anche senza condividere la posizione.
              </p>
            </section>

            {/* Sezione 8 */}
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-3 text-foreground">8. Finalità del trattamento e base giuridica</h2>
              <p className="text-muted-foreground leading-relaxed">
                I dati sono trattati per:
              </p>
              <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Fornire il servizio e gestire l'account</strong> (base giuridica: esecuzione del servizio/contratto)</li>
                <li><strong className="text-foreground">Consentire la visualizzazione della pagina pubblica</strong> tramite scansione del QR code (base giuridica: esecuzione del servizio/contratto e legittimo interesse alla funzionalità del servizio)</li>
                <li><strong className="text-foreground">Inviare notifiche di servizio</strong> e notifiche di scansione all'utente registrato (base giuridica: esecuzione del servizio/contratto)</li>
                <li><strong className="text-foreground">Trasmettere al proprietario del cane la posizione condivisa</strong> da chi scansiona, insieme a data e ora della scansione (base giuridica: scelta esplicita/consenso dell'utente che scansiona)</li>
                <li><strong className="text-foreground">Garantire la sicurezza del sistema</strong>, prevenire abusi e attività fraudolente (base giuridica: legittimo interesse del titolare)</li>
              </ul>
            </section>

            {/* Sezione 9 */}
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-3 text-foreground">9. Comunicazioni email</h2>
              <p className="text-muted-foreground leading-relaxed">
                Il sistema invia esclusivamente email di benvenuto, notifiche di scansione e comunicazioni di servizio. Non viene svolta attività di marketing.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Se chi scansiona decide di condividere la posizione, tale informazione viene inoltrata al proprietario del cane tramite email/notifica insieme a data e ora della scansione.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                <strong className="text-foreground">La posizione non viene inserita nel testo dell'email:</strong> il proprietario riceve un link temporaneo valido fino a 30 giorni dalla scansione.
              </p>
            </section>

            {/* Sezione 10 */}
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-3 text-foreground">10. Conservazione dei dati</h2>
              <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Dati dell'account e del profilo:</strong> conservati per la durata dell'account o fino a richiesta di cancellazione.</li>
                <li><strong className="text-foreground">Eventi di scansione</strong> (inclusi data/ora, IP anonimizzato, user agent) <strong className="text-foreground">e dati di geolocalizzazione</strong> eventualmente condivisi: conservati per 30 giorni dalla scansione e successivamente cancellati automaticamente.</li>
                <li>In casi eccezionali legati alla sicurezza, prevenzione abusi o richieste dell'autorità, alcuni dati potrebbero essere conservati più a lungo nei limiti consentiti dalla normativa.</li>
              </ul>
            </section>

            {/* Sezione 11 */}
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-3 text-foreground">11. Diritti dell'utente</h2>
              <p className="text-muted-foreground leading-relaxed">
                L'utente può accedere, modificare o richiedere la cancellazione dei dati utilizzando il modulo di contatto presente in questa pagina o tramite i contatti indicati dal gestore.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Il titolare risponde alle richieste entro i termini previsti dalla normativa applicabile (di norma entro 30 giorni).
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                L'utente ha inoltre diritto di proporre reclamo al <strong className="text-foreground">Garante per la Protezione dei Dati Personali</strong>.
              </p>
            </section>

            {/* Sezione 12 */}
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-3 text-foreground">12. Destinatari dei dati e trasferimenti extra-UE</h2>
              <p className="text-muted-foreground leading-relaxed">
                I dati possono essere trattati da fornitori tecnici che supportano l'erogazione del servizio (es. hosting, infrastrutture IT, database, invio email), nominati se necessario Responsabili del trattamento.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                La posizione condivisa da chi scansiona viene comunicata al proprietario del cane (utente registrato) attraverso le notifiche del servizio.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                <strong className="text-foreground">Localizzazione e trasferimenti extra-UE:</strong> I dati sono conservati su infrastrutture cloud che possono essere localizzate al di fuori dello Spazio Economico Europeo (SEE), in particolare negli Stati Uniti. In tali casi, il trasferimento avviene nel rispetto del GDPR, sulla base di clausole contrattuali standard approvate dalla Commissione Europea (art. 46 GDPR) o di altre garanzie adeguate previste dalla normativa vigente. L'utente può richiedere maggiori informazioni sui trasferimenti e sulle garanzie adottate contattando il titolare.
              </p>
            </section>

            {/* Sezione 13 */}
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-3 text-foreground">13. Limitazione di responsabilità</h2>
              <p className="text-muted-foreground leading-relaxed">
                Il gestore non garantisce il ritrovamento del cane e non è responsabile per l'uso improprio dei dati da parte di terzi.
              </p>
            </section>

            {/* Sezione 14 */}
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-3 text-foreground">14. Uso improprio e sospensione</h2>
              <p className="text-muted-foreground leading-relaxed">
                Il gestore può sospendere account o disattivare medagliette in caso di abuso o uso improprio.
              </p>
            </section>

            {/* Sezione 15 */}
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-3 text-foreground">15. Durata del servizio</h2>
              <p className="text-muted-foreground leading-relaxed">
                Il servizio FidoLink ha una durata di <strong className="text-foreground">2 (due) anni</strong> dalla data di registrazione della medaglietta. Al termine di tale periodo, il servizio sarà disattivato automaticamente.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                L'utente potrà rinnovare il servizio per ulteriori 2 anni acquistando l'aggiornamento sul nostro sito web prima o dopo la scadenza. In caso di rinnovo effettuato prima della scadenza, i 2 anni aggiuntivi si sommeranno alla data di scadenza esistente.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                L'utente verrà informato dell'imminente scadenza tramite notifica nella propria area personale (dashboard) 30 giorni prima della data di disattivazione.
              </p>
            </section>

            {/* Sezione 16 */}
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-3 text-foreground">16. Modifiche</h2>
              <p className="text-muted-foreground leading-relaxed">
                Il gestore si riserva il diritto di modificare la presente informativa, pubblicando gli aggiornamenti su questa pagina.
              </p>
            </section>

            {/* Sezione 17 - Cookie Policy */}
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-3 text-foreground">17. Cookie Policy</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Il sito FidoLink utilizza esclusivamente cookie tecnici necessari al funzionamento del servizio. Non vengono utilizzati cookie di profilazione per finalità di marketing.
              </p>
              
              <h3 className="text-lg font-semibold mb-2 text-foreground">Cookie tecnici utilizzati:</h3>
              <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-2 mb-4">
                <li><strong className="text-foreground">Cookie di sessione:</strong> necessario per mantenere l'utente autenticato durante la navigazione. Scade alla chiusura del browser o dopo 7 giorni di inattività.</li>
                <li><strong className="text-foreground">Cookie di stato interfaccia:</strong> memorizza lo stato della barra laterale di navigazione (aperta/chiusa). Persistente.</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 text-foreground">Archiviazione locale (localStorage):</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Il sito utilizza la funzionalità localStorage del browser per memorizzare la preferenza del tema (chiaro/scuro). Questa informazione rimane memorizzata localmente nel browser dell'utente e non viene trasmessa al server. L'utente può eliminarla in qualsiasi momento attraverso le impostazioni del browser.
              </p>

              <h3 className="text-lg font-semibold mb-2 text-foreground">Base giuridica:</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                I cookie tecnici non richiedono consenso preventivo ai sensi dell'art. 122 del Codice Privacy (D.Lgs. 196/2003) e del Provvedimento del Garante dell'8 maggio 2014, in quanto strettamente necessari all'erogazione del servizio richiesto dall'utente.
              </p>

              <h3 className="text-lg font-semibold mb-2 text-foreground">Gestione dei cookie:</h3>
              <p className="text-muted-foreground leading-relaxed">
                L'utente può gestire o disabilitare i cookie attraverso le impostazioni del proprio browser. La disabilitazione dei cookie tecnici potrebbe compromettere il corretto funzionamento del servizio, in particolare l'accesso all'area riservata.
              </p>
            </section>

            {/* Contact Section */}
            <section className="mb-8 not-prose">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 md:p-8 text-center">
                <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-xl md:text-2xl font-bold mb-2 text-foreground">Hai bisogno di contattarci?</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Per assistenza, richieste relative ai tuoi dati personali o qualsiasi altra domanda, utilizza il nostro modulo di contatto.
                </p>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="gap-2" data-testid="button-contact-open">
                      <Send className="h-5 w-5" />
                      Contattaci
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Contattaci</DialogTitle>
                      <DialogDescription>
                        Compila il modulo e ti risponderemo il prima possibile.
                      </DialogDescription>
                    </DialogHeader>
                    {success ? (
                      <div className="py-8 text-center">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <p className="text-lg font-medium">Messaggio inviato!</p>
                        <p className="text-muted-foreground">Ti risponderemo presto.</p>
                      </div>
                    ) : (
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="contact-email">La tua email</Label>
                          <Input
                            id="contact-email"
                            type="email"
                            placeholder="tua@email.com"
                            {...form.register("email")}
                            data-testid="input-contact-email"
                          />
                          {form.formState.errors.email && (
                            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact-message">Messaggio</Label>
                          <Textarea
                            id="contact-message"
                            placeholder="Scrivi il tuo messaggio..."
                            rows={5}
                            {...form.register("message")}
                            data-testid="input-contact-message"
                          />
                          {form.formState.errors.message && (
                            <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>
                          )}
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full gap-2" 
                          disabled={contactMutation.isPending}
                          data-testid="button-contact-submit"
                        >
                          {contactMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Invio in corso...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Invia messaggio
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </section>

            <div className="border-t pt-6 mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Ultimo aggiornamento: Febbraio 2026
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
