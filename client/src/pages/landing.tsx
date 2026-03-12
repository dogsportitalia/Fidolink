import { Link } from "wouter";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  QrCode,
  Shield,
  Smartphone,
  Bell,
  Heart,
  ArrowRight,
  Check,
  Phone,
  MessageCircle,
  Zap,
  Eye,
  Lock,
  Battery,
  Scan,
  ExternalLink,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { AnimateOnScroll } from "@/components/animate-on-scroll";

// Product images (optimized JPEG)
import heroCollar1 from "@assets/hero-collar.jpg";
import heroCollar2 from "@assets/hero-collar-2.jpg";
import heroCollar3 from "@assets/hero-collar-3.jpg";
import heroCollar4 from "@assets/hero-collar-4.jpg";
import dogWithCollar1 from "@assets/dog-with-collar.jpg";
import dogWithCollar2 from "@assets/dog-with-collar-2.jpg";
import dogWithCollar3 from "@assets/dog-with-collar-3.jpg";
import dogWithCollar4 from "@assets/dog-with-collar-4.jpg";
import collarHand from "@assets/collar-hand.jpg";
import appScreenshot from "@assets/app-screenshot.jpg";
import dogsportLogo from "@assets/Logo-dogsport.png";

const imagePairs = [
  { hero: heroCollar1, dog: dogWithCollar1 },
  { hero: heroCollar2, dog: dogWithCollar2 },
  { hero: heroCollar3, dog: dogWithCollar3 },
  { hero: heroCollar4, dog: dogWithCollar4 },
];

export default function LandingPage() {
  const { hero: heroCollar, dog: dogWithCollar } = useMemo(() => {
    const lastIndex = parseInt(localStorage.getItem("fidolink-img-index") ?? "-1", 10);
    let index;
    do {
      index = Math.floor(Math.random() * imagePairs.length);
    } while (index === lastIndex && imagePairs.length > 1);
    localStorage.setItem("fidolink-img-index", String(index));
    return imagePairs[index];
  }, []);
  return (
    <div className="min-h-screen bg-background">

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        {/* Soft gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-accent/10 pointer-events-none" />

        <div className="container mx-auto px-4 pt-12 pb-16 md:pt-20 md:pb-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — copy */}
            <div className="max-w-xl">
              {/* DogSport branding */}
              <div className="flex items-center gap-4 mb-6">
                <a href="https://www.dogsport.it" target="_blank" rel="noopener noreferrer">
                  <img src={dogsportLogo} alt="DogSport" width={150} height={150} className="w-[150px] h-[150px] object-contain" />
                </a>
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-wide">Un servizio esclusivo di DogSport</span>
                  <span className="text-xs text-muted-foreground">Prodotti artigianali per cani</span>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-8">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-semibold tracking-wide">Sicurezza per il tuo cane</span>
              </div>

              <h1
                className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight mb-6"
                data-testid="text-hero-title"
              >
                Il collare con{" "}
                <span className="text-primary">QR code</span>{" "}
                che protegge il tuo cane
              </h1>

              <p
                className="text-lg text-muted-foreground leading-relaxed mb-8"
                data-testid="text-hero-description"
              >
                Se il tuo cane si perde, chi lo trova scansiona il QR e ti contatta
                immediatamente. Nessuna app da installare, funziona con qualsiasi
                telefono.
              </p>

              {/* Badges */}
              <div className="flex flex-wrap gap-3 mb-10">
                <span className="inline-flex items-center gap-2 bg-card border border-border px-4 py-2.5 rounded-full text-sm font-medium shadow-sm">
                  <Lock className="h-4 w-4 text-primary" />
                  Nessuna app necessaria
                </span>
                <span className="inline-flex items-center gap-2 bg-card border border-border px-4 py-2.5 rounded-full text-sm font-medium shadow-sm">
                  <Zap className="h-4 w-4 text-primary" />
                  Attivo per sempre
                </span>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="https://dogsport.it/categoria-prodotto/collari-e-pettorine/" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="gap-2 text-base px-8 h-12 bg-black hover:bg-neutral-800 text-white" data-testid="button-buy-dogsport">
                    Acquistalo su Dog Sport
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
                <Link href="/signup">
                  <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-12" data-testid="button-get-started">
                    Inizia ora
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="mt-3">
                <Link href="/login">
                  <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer underline underline-offset-4">
                    Ho già un account
                  </span>
                </Link>
              </div>
            </div>

            {/* Right — hero image */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md lg:max-w-lg">
                {/* Image container with beautiful framing */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/5]">
                  <img src={heroCollar} alt="Golden retriever con collare FidoLink" className="w-full h-full object-cover" />
                </div>
                {/* Decorative floating badge */}
                <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-2xl shadow-lg px-5 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">QR Attivo</p>
                    <p className="text-xs text-muted-foreground">Pronto all'uso</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COME FUNZIONA ─── */}
      <section className="py-20 md:py-28 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-features-title">
              Come <span className="text-primary">funziona</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Tre semplici passi per proteggere il tuo amico a quattro zampe
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <AnimateOnScroll delay={0}>
              <div className="relative bg-card rounded-2xl p-8 shadow-md border border-border/50 text-center group hover:shadow-lg transition-shadow">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
                  1
                </div>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 mt-2">
                  <Scan className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Scansiona il QR</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Chi trova il tuo cane usa la fotocamera del telefono per scansionare il QR code sulla targhetta.
                </p>
              </div>
            </AnimateOnScroll>

            {/* Step 2 */}
            <AnimateOnScroll delay={150}>
              <div className="relative bg-card rounded-2xl p-8 shadow-md border border-border/50 text-center group hover:shadow-lg transition-shadow">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
                  2
                </div>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 mt-2">
                  <Smartphone className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Si apre la scheda</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Nome, foto, informazioni importanti e i contatti del proprietario appaiono immediatamente.
                </p>
              </div>
            </AnimateOnScroll>

            {/* Step 3 */}
            <AnimateOnScroll delay={300}>
              <div className="relative bg-card rounded-2xl p-8 shadow-md border border-border/50 text-center group hover:shadow-lg transition-shadow">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
                  3
                </div>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 mt-2">
                  <Bell className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Ricevi la notifica</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Vieni avvisato via email con la posizione GPS (se condivisa) e un link per vedere dove si trova il tuo cane.
                </p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ─── TARGHETTA INTELLIGENTE ─── */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">

            {/* Left — product image */}
            <AnimateOnScroll className="relative order-2 lg:order-1">
              <div className="rounded-3xl overflow-hidden shadow-xl aspect-square">
                <img src={collarHand} alt="Collare DogSport con targhetta FidoLink" className="w-full h-full object-cover" />
              </div>
            </AnimateOnScroll>

            {/* Right — copy */}
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                Una targhetta{" "}
                <span className="text-primary">intelligente</span>,
                <br />
                sempre con il tuo cane
              </h2>

              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                La targhetta FidoLink è integrata nel collare DogSport.
                Il QR code è inciso direttamente sulla targhetta,
                resistente e sempre leggibile.
              </p>

              <div className="space-y-5">
                {[
                  { icon: QrCode, text: "QR inciso sulla targhetta" },
                  { icon: Battery, text: "Nessuna batteria necessaria" },
                  { icon: Smartphone, text: "Funziona con qualsiasi telefono" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-lg font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SCHEDA DEL CANE (app preview) ─── */}
      <section className="py-20 md:py-28 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">

            {/* Left — copy */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                Tutte le informazioni{" "}
                <span className="text-primary">a portata di scan</span>
              </h2>

              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                La scheda del cane mostra tutto ciò che serve a chi lo trova:
                foto, nome, note mediche importanti e i contatti per raggiungerti subito.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Phone, label: "Chiamata diretta", desc: "Un tap per chiamare il proprietario" },
                  { icon: MessageCircle, label: "WhatsApp", desc: "Scrivi un messaggio veloce" },
                  { icon: Heart, label: "Note mediche", desc: "Allergie e info essenziali in evidenza" },
                  { icon: Eye, label: "Privacy controllata", desc: "Mostra solo ciò che vuoi tu" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 bg-card rounded-xl p-4 border border-border/50">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — phone mockup */}
            <AnimateOnScroll className="flex justify-center" delay={200}>
              <div className="relative">
                {/* Phone frame */}
                <div className="relative w-[280px] sm:w-[320px] rounded-[2.5rem] border-[8px] border-foreground/90 bg-background shadow-2xl overflow-hidden">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-foreground/90 rounded-b-2xl z-10" />
                  {/* Screen content */}
                  <div className="aspect-[9/19] overflow-hidden">
                    <img src={appScreenshot} alt="Scheda cane FidoLink" className="w-full h-full object-cover object-top" />
                  </div>
                </div>
                {/* Decorative glow */}
                <div className="absolute -inset-4 bg-primary/5 rounded-[3rem] -z-10 blur-xl" />
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ─── PRIVACY & SICUREZZA ─── */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Privacy e sicurezza{" "}
                <span className="text-primary">al primo posto</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                I tuoi dati personali sono protetti. Decidi tu cosa mostrare a chi trova il tuo cane.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {[
                {
                  icon: Shield,
                  title: "Servizio attivo 2 anni",
                  desc: "Dalla registrazione, la tua medaglietta resta attiva per due anni completi.",
                },
                {
                  icon: Eye,
                  title: "Info selettive",
                  desc: "Mostra solo le informazioni che vuoi: telefono, WhatsApp, email a tua scelta.",
                },
                {
                  icon: Heart,
                  title: "Note mediche",
                  desc: "Allergie o condizioni importanti sempre visibili per la sicurezza del tuo cane.",
                },
                {
                  icon: Lock,
                  title: "Dati al sicuro",
                  desc: "Niente indirizzo completo, solo la città. Codice di registrazione sicuro e hashato.",
                },
              ].map((item, i) => (
                <div key={i} className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── GALLERY / SECOND PRODUCT IMAGE ─── */}
      <section className="py-20 md:py-28 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
            {/* Left — copy */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                Pensato per la{" "}
                <span className="text-primary">vita di tutti i giorni</span>
              </h2>

              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Il collare DogSport con targhetta FidoLink è progettato per
                resistere a pioggia, fango e avventure. Il QR code inciso
                non sbiadisce e resta leggibile nel tempo.
              </p>

              <ul className="space-y-3">
                {[
                  "Materiale resistente e impermeabile",
                  "QR inciso, non stampato",
                  "Design elegante e discreto",
                  "Perfetto per cani di ogni taglia",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Check className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — image */}
            <AnimateOnScroll>
              <div className="rounded-3xl overflow-hidden shadow-xl aspect-[4/3]">
                <img src={dogWithCollar} alt="Cane con collare FidoLink" className="w-full h-full object-cover" />
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ─── CTA FINALE ─── */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <Logo className="w-20 h-20" />
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Dai al tuo cane la migliore protezione
            </h2>

            <p className="text-lg text-muted-foreground mb-10">
              Registrati gratuitamente e collega la tua medaglietta in pochi minuti.
            </p>

            <Link href="/signup">
              <Button size="lg" className="gap-2 text-base px-10 h-13 shadow-lg shadow-primary/25" data-testid="button-cta-signup">
                Crea il tuo account gratuito
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-10 border-t bg-card/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo className="w-8 h-8" />
              <span className="font-semibold">FidoLink</span>
            </div>

            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} FidoLink. Tutti i diritti riservati.
            </p>

            <Link href="/legal">
              <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer" data-testid="link-legal">
                Informative Legali
              </span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
