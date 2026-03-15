import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ScanEventWithTag } from "@shared/schema";
import { 
  Shield, 
  Download, 
  Plus, 
  Loader2, 
  QrCode, 
  Eye, 
  Clock,
  Globe,
  Smartphone,
  Dog,
  FileText,
  Users,
  Mail,
  Tag,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  BarChart3,
  TrendingUp,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import JSZip from "jszip";
import QRCode from "qrcode";

const batchSchema = z.object({
  count: z.coerce.number().min(1, "Minimo 1").max(100, "Massimo 100"),
  adminPassword: z.string().min(1, "Password richiesta"),
});

type GeneratedTag = { publicId: string; claimCode: string };

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPdfs, setIsGeneratingPdfs] = useState(false);
  const [generatedTags, setGeneratedTags] = useState<GeneratedTag[]>([]);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [blockedMinutes, setBlockedMinutes] = useState<number | null>(null);
  const [selectedPublicId, setSelectedPublicId] = useState<string>("");
  const [qrSize, setQrSize] = useState(256);
  const qrRef = useRef<HTMLDivElement>(null);
  const printQrRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScan, setSelectedScan] = useState<ScanEventWithTag | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{
    tag: { id: number; publicId: string; claimedAt: string | null; expiresAt: string | null };
    dogProfile: { name: string } | null;
    ownerEmail: string | null;
  }> | null>(null);

  type AdminProfileData = {
    tag: { id: number; publicId: string; claimedAt: string | null; expiresAt: string | null };
    profile: {
      name: string;
      photoUrl: string | null;
      breed: string | null;
      sex: string | null;
      size: string | null;
      birthdate: string | null;
      medicalNotes: string | null;
      instructionsText: string | null;
      contactPhone: string | null;
      contactWhatsapp: string | null;
      contactEmail: string | null;
      showPhone: boolean;
      showWhatsapp: boolean;
      showEmail: boolean;
      notifyOnScan: boolean;
      city: string | null;
      updatedAt: string;
    } | null;
    ownerEmail: string | null;
  };
  const [selectedProfile, setSelectedProfile] = useState<AdminProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // Database management states
  const [dbOtpSent, setDbOtpSent] = useState(false);
  const [dbOtpCode, setDbOtpCode] = useState("");
  const [dbOtpLoading, setDbOtpLoading] = useState(false);
  const [dbDownloading, setDbDownloading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const uploadFileRef = useRef<HTMLInputElement>(null);

  const loadProfileDetails = async (publicId: string) => {
    setSelectedProfile(null);
    setIsLoadingProfile(true);
    setProfileDialogOpen(true);
    try {
      const res = await fetch(`/api/admin/profile/${publicId}?password=${encodeURIComponent(adminPassword)}`);
      if (!res.ok) throw new Error("Errore nel caricamento");
      const data = await res.json();
      setSelectedProfile(data);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare i dettagli del profilo",
        variant: "destructive",
      });
      setProfileDialogOpen(false);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const { data: scans, isLoading: scansLoading } = useQuery<ScanEventWithTag[]>({
    queryKey: ["/api/admin/scans", adminPassword],
    queryFn: async () => {
      const res = await fetch(`/api/admin/scans?password=${encodeURIComponent(adminPassword)}`);
      if (!res.ok) throw new Error("Non autorizzato");
      return res.json();
    },
    enabled: isAuthed && adminPassword.length > 0,
    retry: false,
  });

  const { data: allTags, isLoading: tagsLoading } = useQuery<{publicId: string, dogName: string | null}[]>({
    queryKey: ["/api/admin/tags", adminPassword],
    queryFn: async () => {
      const res = await fetch(`/api/admin/tags?password=${encodeURIComponent(adminPassword)}`);
      if (!res.ok) throw new Error("Non autorizzato");
      return res.json();
    },
    enabled: isAuthed && adminPassword.length > 0,
    retry: false,
  });

  type UserWithTags = {
    id: number;
    email: string;
    createdAt: string;
    tags: Array<{ publicId: string; dogName: string | null; claimedAt: string | null }>;
  };

  const { data: allUsers, isLoading: usersLoading } = useQuery<UserWithTags[]>({
    queryKey: ["/api/admin/users", adminPassword],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users?password=${encodeURIComponent(adminPassword)}`);
      if (!res.ok) throw new Error("Non autorizzato");
      return res.json();
    },
    enabled: isAuthed && adminPassword.length > 0,
    retry: false,
  });

  const { data: visitStats, isLoading: visitsLoading } = useQuery<{
    stats: Array<{ date: string; count: number }>;
    total: number;
    todayCount: number;
    avgDaily: number;
  }>({
    queryKey: ["/api/admin/visits", adminPassword],
    queryFn: async () => {
      const res = await fetch(`/api/admin/visits?password=${encodeURIComponent(adminPassword)}&days=30`);
      if (!res.ok) throw new Error("Non autorizzato");
      return res.json();
    },
    enabled: isAuthed && adminPassword.length > 0,
    retry: false,
  });

  const batchForm = useForm<z.infer<typeof batchSchema>>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      count: 10,
      adminPassword: "",
    },
  });

  const batchMutation = useMutation({
    mutationFn: async (data: z.infer<typeof batchSchema>) => {
      const res = await apiRequest("POST", "/api/admin/batch", data);
      const text = await res.text();
      return text;
    },
    onSuccess: (csv) => {
      // Parse CSV to extract tags
      const lines = csv.trim().split("\n");
      const tags: GeneratedTag[] = [];
      for (let i = 1; i < lines.length; i++) {
        const [publicId, claimCode] = lines[i].split(",");
        if (publicId && claimCode) {
          tags.push({ publicId, claimCode });
        }
      }
      setGeneratedTags(tags);
      toast({
        title: "Batch generato!",
        description: `${tags.length} medagliette create. Scarica i PDF per archiviarli.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile generare il batch",
        variant: "destructive",
      });
    },
  });

  async function onBatchSubmit(values: z.infer<typeof batchSchema>) {
    setIsGenerating(true);
    try {
      await batchMutation.mutateAsync(values);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      toast({
        title: "Ricerca troppo corta",
        description: "Inserisci almeno 2 caratteri",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/admin/tags/search?password=${encodeURIComponent(adminPassword)}&q=${encodeURIComponent(searchQuery.trim())}`);
      if (!res.ok) throw new Error("Errore nella ricerca");
      const data = await res.json();
      setSearchResults(data);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile cercare le medagliette",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }

  async function handleExtendTag(tagId: number) {
    try {
      const res = await apiRequest("POST", `/api/admin/tags/${tagId}/extend`, {
        adminPassword,
        years: 2,
      });
      if (!res.ok) throw new Error("Errore nella riattivazione");
      const data = await res.json();
      toast({
        title: "Medaglietta riattivata",
        description: `Nuova scadenza: ${format(new Date(data.newExpiresAt), "dd MMM yyyy", { locale: it })}`,
      });
      if (searchQuery.trim()) {
        const searchRes = await fetch(`/api/admin/tags/search?password=${encodeURIComponent(adminPassword)}&q=${encodeURIComponent(searchQuery.trim())}`);
        if (searchRes.ok) {
          setSearchResults(await searchRes.json());
        }
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile riattivare la medaglietta",
        variant: "destructive",
      });
    }
  }

  function getTagStatus(expiresAt: string | null): { status: 'active' | 'expiring' | 'expired'; label: string; variant: 'default' | 'secondary' | 'destructive' } {
    if (!expiresAt) {
      return { status: 'expired', label: 'Mai attivata', variant: 'secondary' };
    }
    const now = new Date();
    const expDate = new Date(expiresAt);
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    if (expDate < now) {
      return { status: 'expired', label: 'Scaduta', variant: 'destructive' };
    } else if (expDate.getTime() - now.getTime() < thirtyDays) {
      return { status: 'expiring', label: 'In scadenza', variant: 'secondary' };
    }
    return { status: 'active', label: 'Attiva', variant: 'default' };
  }

  async function generatePdf(tag: GeneratedTag, logoDataUrl: string): Promise<Blob> {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a5"
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const primaryColor: [number, number, number] = [249, 115, 22];
    const darkGray: [number, number, number] = [55, 65, 81];
    const mediumGray: [number, number, number] = [107, 114, 128];
    
    let y = 10;
    
    // Logo Header
    const logoSize = 20;
    doc.addImage(logoDataUrl, "PNG", (pageWidth - logoSize) / 2, y, logoSize, logoSize);
    y += logoSize + 4;
    
    doc.setFontSize(10);
    doc.setTextColor(...mediumGray);
    doc.text("Medaglietta QR Intelligente per il tuo cane", pageWidth / 2, y, { align: "center" });
    y += 5;
    
    // Divider
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(15, y, pageWidth - 15, y);
    y += 8;
    
    // Tag ID Box
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(15, y, pageWidth - 30, 16, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(...mediumGray);
    doc.text("CODICE TARGHETTA:", pageWidth / 2, y + 5, { align: "center" });
    doc.setFontSize(14);
    doc.setTextColor(...darkGray);
    doc.text(tag.publicId, pageWidth / 2, y + 12, { align: "center" });
    y += 20;
    
    // Secret Code Section
    doc.setFontSize(11);
    doc.setTextColor(...darkGray);
    doc.text("Il tuo codice segreto", 15, y);
    y += 5;
    
    doc.setFillColor(255, 247, 237);
    doc.setDrawColor(...primaryColor);
    doc.setLineDashPattern([2, 2], 0);
    doc.roundedRect(15, y, pageWidth - 30, 18, 2, 2, "FD");
    doc.setLineDashPattern([], 0);
    
    doc.setFontSize(8);
    doc.setTextColor(...mediumGray);
    doc.text("Inserisci questo codice per registrare la tua medaglietta:", pageWidth / 2, y + 6, { align: "center" });
    doc.setFontSize(16);
    doc.setTextColor(194, 65, 12);
    doc.text(tag.claimCode, pageWidth / 2, y + 14, { align: "center" });
    y += 24;
    
    // Instructions Section
    doc.setFontSize(11);
    doc.setTextColor(...darkGray);
    doc.text("Come registrare la medaglietta", 15, y);
    y += 6;
    
    const steps = [
      "Scansiona il QR qui sotto o vai su fidolink.it",
      "Crea un account con la tua email",
      "Clicca su \"Registra medaglietta\"",
      "Inserisci il codice segreto mostrato sopra",
      "Completa il profilo del tuo cane"
    ];
    
    doc.setFontSize(9);
    steps.forEach((step, index) => {
      doc.setFillColor(...primaryColor);
      doc.circle(19, y - 1, 2.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text(String(index + 1), 19, y, { align: "center" });
      
      doc.setTextColor(...darkGray);
      doc.setFontSize(9);
      doc.text(step, 25, y);
      y += 7;
    });
    
    y += 2;
    
    // QR Code Section
    const registrationUrl = "https://fidolink.it/signup";
    const qrDataUrl = await QRCode.toDataURL(registrationUrl, { 
      width: 200, 
      margin: 1,
      color: { dark: "#374151", light: "#ffffff" }
    });
    
    const qrSize = 28;
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(15, y, pageWidth - 30, qrSize + 12, 2, 2, "F");
    doc.addImage(qrDataUrl, "PNG", (pageWidth - qrSize) / 2, y + 2, qrSize, qrSize);
    doc.setFontSize(8);
    doc.setTextColor(...mediumGray);
    doc.text("Scansiona per registrare", pageWidth / 2, y + qrSize + 8, { align: "center" });
    y += qrSize + 18;
    
    // Warning box
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(15, y, pageWidth - 30, 14, 2, 2, "F");
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(1);
    doc.line(15, y, 15, y + 14);
    
    doc.setFontSize(7);
    doc.setTextColor(146, 64, 14);
    doc.text("Importante: Conserva questo foglio in un luogo sicuro.", 19, y + 5);
    doc.text("Il codice segreto può essere usato una sola volta.", 19, y + 10);
    y += 18;
    
    // Footer
    doc.setFontSize(7);
    doc.setTextColor(...mediumGray);
    doc.text("Grazie per aver scelto FidoLink! Per assistenza: fidolink.it/legal", pageWidth / 2, y, { align: "center" });
    
    return doc.output("blob");
  }

  async function loadLogoAsDataUrl(): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = "/favicon.png";
    });
  }

  async function downloadAllPdfs() {
    if (generatedTags.length === 0) return;
    
    setIsGeneratingPdfs(true);
    try {
      const logoDataUrl = await loadLogoAsDataUrl();
      const zip = new JSZip();
      
      for (const tag of generatedTags) {
        const pdfBlob = await generatePdf(tag, logoDataUrl);
        zip.file(`FidoLink-${tag.publicId}.pdf`, pdfBlob);
      }
      
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FidoLink-Locandine-${format(new Date(), "yyyy-MM-dd-HHmm")}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download completato!",
        description: `${generatedTags.length} PDF scaricati in un file ZIP.`,
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile generare i PDF",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdfs(false);
    }
  }

  function downloadQrCode() {
    if (!qrRef.current || !selectedPublicId) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;
    
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    canvas.width = qrSize;
    canvas.height = qrSize;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `qr-${selectedPublicId}.png`;
      a.click();
    };
    img.src = url;
  }

  function downloadQrCodeSvg() {
    if (!qrRef.current || !selectedPublicId) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;
    
    const svgClone = svg.cloneNode(true) as SVGElement;
    svgClone.setAttribute("width", String(qrSize));
    svgClone.setAttribute("height", String(qrSize));
    svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${selectedPublicId}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function getQrUrl(publicId: string) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/t/${publicId}`;
  }

  async function handleAdminAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setIsVerifying(true);
    
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 429) {
          setBlockedMinutes(data.blockedMinutes || 30);
          setLoginError(data.message);
        } else {
          setLoginError(data.message + (data.remainingAttempts ? ` (${data.remainingAttempts} tentativi rimasti)` : ""));
        }
        return;
      }
      
      setIsAuthed(true);
    } catch (error) {
      setLoginError("Errore di connessione");
    } finally {
      setIsVerifying(false);
    }
  }

  if (!isAuthed) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl" data-testid="text-admin-login-title">Pannello Admin</CardTitle>
            <CardDescription>
              Inserisci la password admin per accedere
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminAuth} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Password admin"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  disabled={blockedMinutes !== null || isVerifying}
                  data-testid="input-admin-password"
                />
              </div>
              {loginError && (
                <div className="text-sm text-destructive text-center bg-destructive/10 p-3 rounded-md" data-testid="text-login-error">
                  {loginError}
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={blockedMinutes !== null || isVerifying || !adminPassword}
                data-testid="button-admin-login"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifica...
                  </>
                ) : blockedMinutes !== null ? (
                  `Bloccato per ${blockedMinutes} min`
                ) : (
                  "Accedi"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="text-admin-title">
          <Shield className="h-8 w-8 text-primary" />
          Pannello Admin
        </h1>
        <p className="text-muted-foreground">Gestisci le medagliette e monitora le scansioni</p>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="generate" className="gap-2" data-testid="tab-generate">
            <Plus className="h-4 w-4" />
            Genera Batch
          </TabsTrigger>
          <TabsTrigger value="qrcode" className="gap-2" data-testid="tab-qrcode">
            <QrCode className="h-4 w-4" />
            QR Code
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-2" data-testid="tab-tags">
            <Tag className="h-4 w-4" />
            Medagliette
          </TabsTrigger>
          <TabsTrigger value="scans" className="gap-2" data-testid="tab-scans">
            <Eye className="h-4 w-4" />
            Scansioni
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2" data-testid="tab-users">
            <Users className="h-4 w-4" />
            Utenti
          </TabsTrigger>
          <TabsTrigger value="traffic" className="gap-2" data-testid="tab-traffic">
            <BarChart3 className="h-4 w-4" />
            Traffico
          </TabsTrigger>
          <TabsTrigger value="database" className="gap-2" data-testid="tab-database">
            <FileText className="h-4 w-4" />
            Database
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  Genera nuove medagliette
                </CardTitle>
                <CardDescription>
                  Crea un batch di medagliette con publicId e claimCode unici
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...batchForm}>
                  <form onSubmit={batchForm.handleSubmit(onBatchSubmit)} className="space-y-4">
                    <FormField
                      control={batchForm.control}
                      name="count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numero di medagliette</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              max={100} 
                              data-testid="input-batch-count"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>Massimo 100 alla volta</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={batchForm.control}
                      name="adminPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password admin</FormLabel>
                          <FormControl>
                            <Input 
                              type="password"
                              data-testid="input-batch-password"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full gap-2"
                      disabled={isGenerating}
                      data-testid="button-generate-batch"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generazione...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Genera batch
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {generatedTags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Medagliette generate ({generatedTags.length})
                  </CardTitle>
                  <CardDescription>
                    Scarica tutte le locandine in PDF pronte per la stampa e l'archiviazione
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={downloadAllPdfs} 
                    className="w-full gap-2" 
                    disabled={isGeneratingPdfs}
                    data-testid="button-download-pdfs"
                  >
                    {isGeneratingPdfs ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generazione PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Scarica tutti i PDF ({generatedTags.length} locandine)
                      </>
                    )}
                  </Button>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Codice Targhetta</TableHead>
                          <TableHead>Codice Segreto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {generatedTags.map((tag) => (
                          <TableRow key={tag.publicId} data-testid={`row-tag-${tag.publicId}`}>
                            <TableCell>
                              <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                                {tag.publicId}
                              </code>
                            </TableCell>
                            <TableCell>
                              <code className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-mono font-bold">
                                {tag.claimCode}
                              </code>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="qrcode">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  Genera QR Code
                </CardTitle>
                <CardDescription>
                  Seleziona una medaglietta per generare il QR code da stampare
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Seleziona medaglietta</label>
                  {tagsLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select value={selectedPublicId} onValueChange={setSelectedPublicId}>
                      <SelectTrigger data-testid="select-tag-qr">
                        <SelectValue placeholder="Scegli una medaglietta..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allTags?.map((tag) => (
                          <SelectItem key={tag.publicId} value={tag.publicId}>
                            {tag.publicId} {tag.dogName ? `- ${tag.dogName}` : "(non registrata)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Dimensione (px)</label>
                  <Select value={qrSize.toString()} onValueChange={(v) => setQrSize(parseInt(v))}>
                    <SelectTrigger data-testid="select-qr-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="128">128 x 128</SelectItem>
                      <SelectItem value="256">256 x 256</SelectItem>
                      <SelectItem value="512">512 x 512</SelectItem>
                      <SelectItem value="1024">1024 x 1024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {selectedPublicId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" />
                    Anteprima QR Code
                  </CardTitle>
                  <CardDescription>
                    Codice: {selectedPublicId}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div 
                    ref={qrRef}
                    className="flex items-center justify-center p-6 bg-white rounded-lg"
                    data-testid="qr-preview"
                  >
                    <QRCodeSVG 
                      value={getQrUrl(selectedPublicId)} 
                      size={Math.min(qrSize, 300)}
                      level="H"
                      includeMargin
                    />
                  </div>
                  
                  <div className="text-center text-sm text-muted-foreground">
                    <p>URL: <code className="bg-muted px-2 py-1 rounded">{getQrUrl(selectedPublicId)}</code></p>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={downloadQrCode} 
                      className="flex-1 gap-2"
                      data-testid="button-download-qr-png"
                    >
                      <Download className="h-4 w-4" />
                      PNG ({qrSize}x{qrSize})
                    </Button>
                    <Button 
                      onClick={downloadQrCodeSvg} 
                      variant="outline"
                      className="flex-1 gap-2"
                      data-testid="button-download-qr-svg"
                    >
                      <Download className="h-4 w-4" />
                      SVG (vettoriale)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tags">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Gestione Medagliette
              </CardTitle>
              <CardDescription>
                Cerca medagliette per codice o email e gestisci lo stato di attivazione
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Cerca per codice medaglietta o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  data-testid="input-search-tags"
                />
                <Button type="submit" disabled={isSearching} className="gap-2" data-testid="button-search-tags">
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Cerca
                </Button>
              </form>

              {searchResults === null ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Inserisci un codice medaglietta o email per cercare</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nessuna medaglietta trovata</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Codice</TableHead>
                        <TableHead>Cane</TableHead>
                        <TableHead>Email proprietario</TableHead>
                        <TableHead>Registrata il</TableHead>
                        <TableHead>Scadenza</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.map((result) => {
                        const tagStatus = getTagStatus(result.tag.expiresAt);
                        return (
                          <TableRow key={result.tag.id} data-testid={`row-tag-${result.tag.id}`}>
                            <TableCell>
                              <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                                {result.tag.publicId}
                              </code>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Dog className="h-4 w-4 text-primary" />
                                <span>{result.dogProfile?.name || "-"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {result.ownerEmail ? (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{result.ownerEmail}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Non registrata</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {result.tag.claimedAt ? (
                                <span className="text-sm">
                                  {format(new Date(result.tag.claimedAt), "dd MMM yyyy", { locale: it })}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {result.tag.expiresAt ? (
                                <span className="text-sm">
                                  {format(new Date(result.tag.expiresAt), "dd MMM yyyy", { locale: it })}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={tagStatus.variant}>
                                {tagStatus.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {tagStatus.status === 'expiring' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                {tagStatus.status === 'expired' && <XCircle className="h-3 w-3 mr-1" />}
                                {tagStatus.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {result.tag.claimedAt && (
                                <Button 
                                  size="sm" 
                                  variant={tagStatus.status === 'active' ? "ghost" : "outline"}
                                  className="gap-1"
                                  onClick={() => handleExtendTag(result.tag.id)}
                                  data-testid={`button-extend-${result.tag.id}`}
                                >
                                  <RefreshCw className="h-3 w-3" />
                                  {tagStatus.status === 'expired' ? "Riattiva" : "Estendi"} (+2 anni)
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scans">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Ultime scansioni
              </CardTitle>
              <CardDescription>
                Monitora le scansioni delle medagliette in tempo reale
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scansLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : scans && scans.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Ora</TableHead>
                        <TableHead>Medaglietta</TableHead>
                        <TableHead>Cane</TableHead>
                        <TableHead>IP Hash</TableHead>
                        <TableHead>User Agent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scans.map((scan) => (
                        <TableRow 
                          key={scan.id} 
                          data-testid={`row-scan-${scan.id}`}
                          className="cursor-pointer hover-elevate"
                          onClick={() => setSelectedScan(scan)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {format(new Date(scan.createdAt), "dd MMM yyyy HH:mm", { locale: it })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                              {scan.tag.publicId}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dog className="h-4 w-4 text-primary" />
                              <span>{scan.tag.dogProfile?.name || "-"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono text-xs truncate max-w-[100px]" title={scan.ipHash || ""}>
                                {scan.ipHash?.substring(0, 12) || "-"}...
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs truncate max-w-[150px]" title={scan.userAgent || ""}>
                                {scan.userAgent?.substring(0, 30) || "-"}...
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nessuna scansione registrata</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog dettagli scansione */}
          <Dialog open={!!selectedScan} onOpenChange={(open) => !open && setSelectedScan(null)}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Dettagli Scansione
                </DialogTitle>
                <DialogDescription>
                  Informazioni complete sulla scansione della medaglietta
                </DialogDescription>
              </DialogHeader>
              {selectedScan && (
                <div className="space-y-4">
                  {/* Data e ora */}
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Data e Ora</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedScan.createdAt), "EEEE dd MMMM yyyy 'alle' HH:mm:ss", { locale: it })}
                      </p>
                    </div>
                  </div>

                  {/* Medaglietta */}
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Tag className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Medaglietta</p>
                      <code className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-mono">
                        {selectedScan.tag.publicId}
                      </code>
                    </div>
                  </div>

                  {/* Cane */}
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Dog className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Cane</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedScan.tag.dogProfile?.name || "Profilo non configurato"}
                      </p>
                    </div>
                  </div>

                  {/* IP Hash */}
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Globe className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">IP Hash (anonimizzato)</p>
                      <code className="text-xs font-mono text-muted-foreground break-all">
                        {selectedScan.ipHash || "Non disponibile"}
                      </code>
                    </div>
                  </div>

                  {/* User Agent */}
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Smartphone className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Dispositivo (User Agent)</p>
                      <p className="text-xs text-muted-foreground break-all">
                        {selectedScan.userAgent || "Non disponibile"}
                      </p>
                    </div>
                  </div>

                  {/* Posizione GPS */}
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Posizione GPS</p>
                      {selectedScan.latitude && selectedScan.longitude ? (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Lat: {selectedScan.latitude}, Long: {selectedScan.longitude}
                          </p>
                          <a 
                            href={`https://www.google.com/maps?q=${selectedScan.latitude},${selectedScan.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <MapPin className="h-3 w-3" />
                            Apri su Google Maps
                          </a>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Non condivisa</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Utenti registrati
              </CardTitle>
              <CardDescription>
                Elenco degli utenti e le medagliette associate
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : allUsers && allUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data registrazione</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Medagliette</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers.map((user) => (
                        <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {format(new Date(user.createdAt), "dd MMM yyyy HH:mm", { locale: it })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-primary" />
                              <span className="font-medium">{user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {user.tags.map((tag) => (
                                  <Button
                                    key={tag.publicId}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => loadProfileDetails(tag.publicId)}
                                    className="h-auto py-1 px-2 gap-1"
                                    data-testid={`button-view-profile-${tag.publicId}`}
                                  >
                                    <Eye className="h-3 w-3 text-primary" />
                                    <code className="text-xs font-mono">{tag.publicId}</code>
                                    {tag.dogName && (
                                      <span className="text-xs text-muted-foreground">
                                        ({tag.dogName})
                                      </span>
                                    )}
                                  </Button>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Nessuna medaglietta</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nessun utente registrato</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Statistiche Traffico
              </CardTitle>
              <CardDescription>
                Contatore visite del sito (senza dati personali)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {visitsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : visitStats ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="h-8 w-8 text-primary" />
                          <div>
                            <p className="text-2xl font-bold" data-testid="text-total-visits">{visitStats.total.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Visite totali</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-8 w-8 text-primary" />
                          <div>
                            <p className="text-2xl font-bold" data-testid="text-today-visits">
                              {visitStats.todayCount}
                            </p>
                            <p className="text-sm text-muted-foreground">Visite oggi</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <BarChart3 className="h-8 w-8 text-primary" />
                          <div>
                            <p className="text-2xl font-bold" data-testid="text-avg-visits">
                              {visitStats.avgDaily}
                            </p>
                            <p className="text-sm text-muted-foreground">Media giornaliera</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Ultimi 30 giorni</h3>
                    {visitStats.stats.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead className="text-right">Visite</TableHead>
                              <TableHead className="w-[60%]">Grafico</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {visitStats.stats.map((stat) => {
                              const maxCount = Math.max(...visitStats.stats.map(s => s.count), 1);
                              const percentage = (stat.count / maxCount) * 100;
                              return (
                                <TableRow key={stat.date}>
                                  <TableCell>
                                    {format(new Date(stat.date), "dd MMM yyyy", { locale: it })}
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    {stat.count}
                                  </TableCell>
                                  <TableCell>
                                    <div className="w-full bg-muted rounded-full h-2">
                                      <div 
                                        className="bg-primary h-2 rounded-full transition-all" 
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Nessuna visita registrata</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nessun dato disponibile</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Download Backup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  Download Backup
                </CardTitle>
                <CardDescription>
                  Scarica una copia del database. Un codice di verifica viene inviato alla tua email.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!dbOtpSent ? (
                  <Button
                    onClick={async () => {
                      setDbOtpLoading(true);
                      try {
                        const res = await fetch("/api/admin/download-db/request-code", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ adminPassword }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.message);
                        setDbOtpSent(true);
                        toast({ title: "Codice inviato", description: "Controlla la tua email" });
                      } catch (error: any) {
                        toast({ title: "Errore", description: error.message, variant: "destructive" });
                      } finally {
                        setDbOtpLoading(false);
                      }
                    }}
                    disabled={dbOtpLoading}
                    className="w-full"
                  >
                    {dbOtpLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                    Richiedi codice via email
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Input
                      placeholder="Inserisci il codice a 6 cifre"
                      value={dbOtpCode}
                      onChange={(e) => setDbOtpCode(e.target.value)}
                      maxLength={6}
                      className="text-center text-2xl tracking-widest"
                    />
                    <Button
                      onClick={async () => {
                        setDbDownloading(true);
                        try {
                          const res = await fetch(
                            `/api/admin/download-db?password=${encodeURIComponent(adminPassword)}&code=${encodeURIComponent(dbOtpCode)}`
                          );
                          if (!res.ok) {
                            const data = await res.json();
                            throw new Error(data.message);
                          }
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = res.headers.get("content-disposition")?.split("filename=")[1]?.replace(/"/g, "") || "fidolink-backup.db";
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          toast({ title: "Download completato" });
                          setDbOtpSent(false);
                          setDbOtpCode("");
                        } catch (error: any) {
                          toast({ title: "Errore", description: error.message, variant: "destructive" });
                        } finally {
                          setDbDownloading(false);
                        }
                      }}
                      disabled={dbDownloading || dbOtpCode.length !== 6}
                      className="w-full"
                    >
                      {dbDownloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                      Scarica Database
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setDbOtpSent(false); setDbOtpCode(""); }}
                      className="w-full"
                    >
                      Annulla
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upload/Ripristina Database */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-primary" />
                  Carica Database
                </CardTitle>
                <CardDescription>
                  Carica un file .db di backup per ripristinare il database. Il database corrente viene sostituito.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={uploadFileRef}
                  type="file"
                  accept=".db"
                  className="hidden"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
                <Button
                  variant="outline"
                  onClick={() => uploadFileRef.current?.click()}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {uploadFile ? uploadFile.name : "Seleziona file .db"}
                </Button>
                {uploadFile && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      File selezionato: <strong>{uploadFile.name}</strong> ({(uploadFile.size / 1024).toFixed(1)} KB)
                    </p>
                    <div className="p-3 bg-destructive/10 rounded-lg">
                      <p className="text-sm text-destructive font-semibold">Attenzione: il database corrente viene sostituito!</p>
                    </div>
                    <Button
                      onClick={async () => {
                        setUploadLoading(true);
                        try {
                          const formData = new FormData();
                          formData.append("database", uploadFile);
                          formData.append("adminPassword", adminPassword);
                          const res = await fetch("/api/admin/upload-db", {
                            method: "POST",
                            body: formData,
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.message);
                          toast({ title: "Database ripristinato", description: data.message });
                          setUploadFile(null);
                          if (uploadFileRef.current) uploadFileRef.current.value = "";
                        } catch (error: any) {
                          toast({ title: "Errore", description: error.message, variant: "destructive" });
                        } finally {
                          setUploadLoading(false);
                        }
                      }}
                      disabled={uploadLoading}
                      className="w-full"
                    >
                      {uploadLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                      Ripristina Database
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setUploadFile(null); if (uploadFileRef.current) uploadFileRef.current.value = ""; }}
                      className="w-full"
                    >
                      Annulla
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-admin-profile">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dog className="h-5 w-5 text-primary" />
              Dettagli Profilo Medaglietta
            </DialogTitle>
            <DialogDescription>
              Visualizzazione admin - Nessuna notifica inviata al proprietario
            </DialogDescription>
          </DialogHeader>

          {isLoadingProfile ? (
            <div className="space-y-4" data-testid="loading-profile">
              <Skeleton className="h-32 w-32 rounded-full mx-auto" />
              <Skeleton className="h-6 w-48 mx-auto" />
              <Skeleton className="h-4 w-64 mx-auto" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            </div>
          ) : selectedProfile ? (
            <div className="space-y-6" data-testid="profile-content">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="h-4 w-4" />
                <code className="bg-muted px-2 py-1 rounded" data-testid="text-tag-id">{selectedProfile.tag.publicId}</code>
                {selectedProfile.ownerEmail && (
                  <>
                    <span>•</span>
                    <Mail className="h-4 w-4" />
                    <span data-testid="text-owner-email">{selectedProfile.ownerEmail}</span>
                  </>
                )}
              </div>

              {selectedProfile.profile ? (
                <>
                  <div className="text-center">
                    {selectedProfile.profile.photoUrl ? (
                      <img
                        src={selectedProfile.profile.photoUrl}
                        alt={selectedProfile.profile.name}
                        className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-primary/20"
                        data-testid="img-dog-photo"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mx-auto" data-testid="placeholder-dog-photo">
                        <Dog className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <h3 className="text-xl font-bold mt-3" data-testid="text-dog-name">{selectedProfile.profile.name}</h3>
                    {selectedProfile.profile.city && (
                      <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1" data-testid="text-dog-city">
                        <MapPin className="h-3 w-3" />
                        {selectedProfile.profile.city}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground mb-1">Razza</p>
                        <p className="font-medium" data-testid="text-breed">{selectedProfile.profile.breed || "Non specificata"}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground mb-1">Sesso</p>
                        <p className="font-medium" data-testid="text-sex">{selectedProfile.profile.sex || "Non specificato"}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground mb-1">Taglia</p>
                        <p className="font-medium" data-testid="text-size">{selectedProfile.profile.size || "Non specificata"}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground mb-1">Data di nascita</p>
                        <p className="font-medium" data-testid="text-birthdate">{selectedProfile.profile.birthdate || "Non specificata"}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-primary" />
                      Contatti configurati
                    </h4>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between bg-muted/50 p-3 rounded" data-testid="row-contact-phone">
                        <span>Telefono</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm" data-testid="text-phone">{selectedProfile.profile.contactPhone || "Non impostato"}</span>
                          <Badge variant={selectedProfile.profile.showPhone ? "default" : "secondary"} data-testid="badge-phone-visibility">
                            {selectedProfile.profile.showPhone ? "Visibile" : "Nascosto"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-muted/50 p-3 rounded" data-testid="row-contact-whatsapp">
                        <span>WhatsApp</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm" data-testid="text-whatsapp">{selectedProfile.profile.contactWhatsapp || "Non impostato"}</span>
                          <Badge variant={selectedProfile.profile.showWhatsapp ? "default" : "secondary"} data-testid="badge-whatsapp-visibility">
                            {selectedProfile.profile.showWhatsapp ? "Visibile" : "Nascosto"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-muted/50 p-3 rounded" data-testid="row-contact-email">
                        <span>Email</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm" data-testid="text-contact-email">{selectedProfile.profile.contactEmail || "Non impostata"}</span>
                          <Badge variant={selectedProfile.profile.showEmail ? "default" : "secondary"} data-testid="badge-email-visibility">
                            {selectedProfile.profile.showEmail ? "Visibile" : "Nascosta"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {(selectedProfile.profile.medicalNotes || selectedProfile.profile.instructionsText) && (
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Note e istruzioni
                      </h4>
                      {selectedProfile.profile.medicalNotes && (
                        <Card>
                          <CardContent className="pt-4">
                            <p className="text-xs text-muted-foreground mb-1">Note mediche</p>
                            <p className="text-sm whitespace-pre-wrap" data-testid="text-medical-notes">{selectedProfile.profile.medicalNotes}</p>
                          </CardContent>
                        </Card>
                      )}
                      {selectedProfile.profile.instructionsText && (
                        <Card>
                          <CardContent className="pt-4">
                            <p className="text-xs text-muted-foreground mb-1">Istruzioni per chi trova il cane</p>
                            <p className="text-sm whitespace-pre-wrap" data-testid="text-instructions">{selectedProfile.profile.instructionsText}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-muted/50 p-3 rounded" data-testid="row-notify-scan">
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Notifiche scansione
                    </span>
                    <Badge variant={selectedProfile.profile.notifyOnScan ? "default" : "secondary"} data-testid="badge-notify-scan">
                      {selectedProfile.profile.notifyOnScan ? "Attive" : "Disattivate"}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground text-center" data-testid="text-updated-at">
                    Ultimo aggiornamento: {format(new Date(selectedProfile.profile.updatedAt), "dd MMM yyyy HH:mm", { locale: it })}
                  </p>
                </>
              ) : (
                <div className="text-center py-8" data-testid="no-profile-message">
                  <Dog className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nessun profilo configurato per questa medaglietta</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    La medaglietta è stata registrata ma il proprietario non ha ancora completato il profilo del cane.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
