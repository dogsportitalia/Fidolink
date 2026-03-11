import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, CheckCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { loginSchema, requestResetSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const resetForm = useForm<z.infer<typeof requestResetSchema>>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onRequestReset(values: z.infer<typeof requestResetSchema>) {
    setIsResetting(true);
    try {
      await apiRequest("POST", "/api/auth/request-reset", values);
      setResetSent(true);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Impossibile inviare la richiesta",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  }

  function closeForgotPassword() {
    setShowForgotPassword(false);
    setResetSent(false);
    resetForm.reset();
  }

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      await login(values.email, values.password);
      toast({
        title: "Accesso effettuato",
        description: "Benvenuto!",
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Credenziali non valide",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mx-auto mb-4">
            <Logo className="w-20 h-20" />
          </div>
          <CardTitle className="text-2xl" data-testid="text-login-title">Accedi al tuo account</CardTitle>
          <CardDescription>
            Inserisci le tue credenziali per continuare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="la-tua@email.com"
                        data-testid="input-email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-primary hover:underline"
                        data-testid="link-forgot-password"
                      >
                        Password dimenticata?
                      </button>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="La tua password"
                        data-testid="input-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-login-submit"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accesso in corso...
                  </>
                ) : (
                  "Accedi"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Non hai un account?{" "}
            <Link href="/signup" className="text-primary hover:underline" data-testid="link-to-signup">
              Registrati
            </Link>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showForgotPassword} onOpenChange={closeForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle data-testid="text-forgot-password-title">
              {resetSent ? "Email inviata" : "Recupera password"}
            </DialogTitle>
            <DialogDescription>
              {resetSent 
                ? "Controlla la tua casella email per le istruzioni" 
                : "Inserisci la tua email per ricevere le istruzioni di reset"}
            </DialogDescription>
          </DialogHeader>

          {resetSent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground mb-4">
                Se l'email è registrata nel nostro sistema, riceverai un link per reimpostare la password.
              </p>
              <Button onClick={closeForgotPassword} data-testid="button-close-reset-dialog">
                Chiudi
              </Button>
            </div>
          ) : (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(onRequestReset)} className="space-y-4">
                <FormField
                  control={resetForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="la-tua@email.com"
                          data-testid="input-reset-email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={closeForgotPassword}
                    data-testid="button-cancel-reset"
                  >
                    Annulla
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 gap-2"
                    disabled={isResetting}
                    data-testid="button-send-reset"
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Invio...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Invia
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
