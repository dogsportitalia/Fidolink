import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  QrCode, 
  Shield, 
  Bell, 
  Smartphone, 
  MapPin, 
  Heart,
  ArrowRight,
  Check
} from "lucide-react";
import { Logo } from "@/components/logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <Logo className="w-32 h-32 md:w-40 md:h-40" />
            </div>
            
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Sicurezza per il tuo cane</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6" data-testid="text-hero-title">
              Proteggi il tuo amico con una{" "}
              <span className="text-primary">medaglietta QR</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="text-hero-description">
              Se il tuo cane si perde, chi lo trova può scansionare il QR code e contattarti immediatamente. 
              Ricevi notifiche istantanee e mantieni i tuoi dati al sicuro.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="gap-2" data-testid="button-get-started">
                  Inizia ora
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" data-testid="button-login-hero">
                  Ho già un account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-features-title">
              Come funziona
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Un sistema semplice e sicuro per proteggere il tuo cane
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-6 px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <QrCode className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">1. Registra la medaglietta</h3>
                <p className="text-muted-foreground">
                  Inserisci il codice segreto della tua medaglietta e collega le informazioni del tuo cane.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-6 px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Smartphone className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">2. Qualcuno scansiona</h3>
                <p className="text-muted-foreground">
                  Chi trova il tuo cane scansiona il QR e vede le informazioni per contattarti.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-8 pb-6 px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Bell className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">3. Ricevi notifica</h3>
                <p className="text-muted-foreground">
                  Vieni avvisato immediatamente via email quando qualcuno scansiona la medaglietta (se chi scansiona condivide la posizione GPS, riceverai anche un link per vedere dove si trova il tuo cane su mappa).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Privacy e sicurezza al primo posto
              </h2>
              <p className="text-muted-foreground mb-8">
                I tuoi dati personali sono protetti. Decidi tu cosa mostrare a chi trova il tuo cane.
              </p>

              <ul className="space-y-4">
                {[
                  "Servizio attivo per 2 anni dalla registrazione",
                  "Mostra solo le informazioni che vuoi",
                  "Telefono, WhatsApp o email a tua scelta",
                  "Note mediche essenziali per emergenze",
                  "Niente indirizzo completo, solo la città",
                  "Codice di registrazione sicuro e hashato",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="aspect-square max-w-md mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl flex items-center justify-center">
                <div className="w-48 h-48 rounded-2xl bg-card shadow-2xl flex items-center justify-center">
                  <QrCode className="h-24 w-24 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Heart className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Dai al tuo cane la migliore protezione
            </h2>
            <p className="text-muted-foreground mb-8">
              Registrati gratuitamente e collega la tua medaglietta in pochi minuti.
            </p>
            <Link href="/signup">
              <Button size="lg" className="gap-2" data-testid="button-cta-signup">
                Crea il tuo account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="mb-2">&copy; {new Date().getFullYear()} FidoLink. Tutti i diritti riservati.</p>
          <Link href="/legal">
            <span className="text-sm hover:text-primary transition-colors cursor-pointer" data-testid="link-legal">
              Informative Legali
            </span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
