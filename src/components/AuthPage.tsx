import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, Mail, Lock, User, UserCheck, Eye, EyeOff, Users, ChevronDown } from "lucide-react";
// O Supabase foi removido pois a função de recuperação de senha foi migrada para o backend.
// import { supabase } from "@/integrations/supabase/client"; 
import axios from 'axios';

// Interface AppUser COMPLETA e sincronizada com Index.tsx e StudyDashboard
export interface AppUser {
  id: string; // _id do Mongoose
  email: string;
  app_metadata: { provider?: string; providers?: string[]; [key: string]: any; };
  aud: string;
  created_at: string;
  role: string | null;
  last_sign_in_at: string;
  phone: string | null;
  email_confirmed_at: string | null;
  // Campos do seu UserSchema adaptados para user_metadata
  user_metadata: { 
    full_name: string; 
    username: string;
    gender: string;
    isPremium: boolean;
    hours: number;
    sections: string[];
    focus: object;
    [key: string]: any; 
  };
}

interface AuthPageProps {
  onLoginSuccess: (user: AppUser) => void;
  onSkipAuth: () => void;
}

export const AuthPage = ({ onLoginSuccess, onSkipAuth }: AuthPageProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("login");

  // Estados
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("");

  const [resetEmail, setResetEmail] = useState("");

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const validateUsername = (username: string) => {
    const usernameRegex = /^[a-z0-9._-]+$/;
    return username.length >= 3 && username.length <= 30 && usernameRegex.test(username);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      // 1. Chamada Axios para o seu backend
      const response = await axios.post('http://localhost:3000/api/login', JSON.stringify({ email: loginEmail, password: loginPassword }),
        {
          headers: { "Content-Type": "application/json" }
        });
        
      // CAPTURA o objeto de usuário real do corpo da resposta
      const backendUser = response.data.user;

      // 2. ADAPTAÇÃO do objeto Mongoose (backendUser) para a interface AppUser
      const adaptedUser: AppUser = {
        id: backendUser._id, // Usando o ID real do Mongoose
        email: backendUser.email,
        
        // Campos de metadados padrão (mantidos como mock para satisfazer o TypeScript/estrutura de autenticação)
        app_metadata: { provider: 'custom' }, 
        aud: 'authenticated', 
        created_at: backendUser.createdAt || new Date().toISOString(),
        role: 'authenticated',
        last_sign_in_at: new Date().toISOString(),
        phone: null,
        email_confirmed_at: backendUser.email_confirmed_at || new Date().toISOString(), 
        
        // Dados do seu UserSchema, mapeados para user_metadata
        user_metadata: {
          full_name: backendUser.name, 
          username: backendUser.insta,
          gender: backendUser.gender,
          isPremium: backendUser.isPremium,
          hours: backendUser.hours,
          sections: backendUser.sections,
          focus: backendUser.focus,
          sequence: backendUser.sequence || 0,
          // Adicione outros campos do schema que você queira
        }
      };
      
      onLoginSuccess(adaptedUser); // Notifica o componente pai com o objeto REAL
      
    } catch (error: any) {
      setError(error.response?.data?.error || "Credenciais inválidas ou erro no servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    if (!validateUsername(username)) {
      setError("Username deve ter 3-30 caracteres e conter apenas letras minúsculas, números, '.', '-' ou '_'");
      setIsLoading(false);
      return;
    }
    
    try {
      const signupData = {
        name: fullName,      
        gender: gender,
        insta: username,     
        email: signupEmail,  
        password: signupPassword, 
      };

      // 1. Chamada Axios para o seu backend de registro
      await axios.post('http://localhost:3000/api/register', signupData,
        {
          headers: { "Content-Type": "application/json" }
        });

      setMessage("Conta criada com sucesso! Faça login para começar.");
      setActiveTab('login');
    } catch (error: any) {
      setError(error.response?.data?.error || "Erro ao criar conta. Tente um email ou usuário diferente.");
    } finally {
      setIsLoading(false);
    }
  };


  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      // Usando Axios para chamar a nova rota de recuperação de senha no seu backend
      const response = await axios.post('http://localhost:3000/api/forgot', { 
        email: resetEmail 
      });

      // Se o backend retornar sucesso (status 200), exibe a mensagem de sucesso
      setMessage(response.data.message || "Email de recuperação enviado! Verifique sua caixa de entrada.");
      
      // Opcional: Voltar para a aba de login após o sucesso, mas mantendo a mensagem
      // setActiveTab('login'); 

    } catch (error: any) {
      // Captura a mensagem de erro do backend (ex: email não encontrado)
      setError(error.response?.data?.message || "Erro ao enviar email de recuperação. Verifique o email digitado.");
    } finally {
      setIsLoading(false);
    }
  };


  return <div className="main-background flex items-center justify-center p-6 relative">
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Brain className="w-12 h-12 text-purple-500" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">MedVoa</h1>
          <p className="text-muted-foreground text-lg">Plataforma de Estudo Queridinha dos Mediciners</p>
        </div>

        <Card className="glass-card">
          <CardContent className="p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 glass-card border border-primary/20">
                <TabsTrigger value="login" className="text-foreground data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-medium">
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-foreground data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-medium">
                  Criar conta
                </TabsTrigger>
              </TabsList>

              {message && <Alert className="mb-6 border-green-500/50 bg-green-500/10 backdrop-blur-sm rounded-xl">
                  <AlertDescription className="text-green-400 font-medium">
                    {message}
                  </AlertDescription>
                </Alert>}

              {error && <Alert className="mb-6 border-destructive/50 bg-destructive/10 backdrop-blur-sm rounded-xl">
                  <AlertDescription className="text-destructive font-medium">
                    {error}
                  </AlertDescription>
                </Alert>}

              <TabsContent value="login" className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Faça login para continuar seus estudos</h3>
                  <p className="text-muted-foreground">Entre na sua conta e continue aprendendo</p>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="login-email" className="flex items-center space-x-2 text-foreground font-medium">
                      <Mail className="w-4 h-4 text-primary" />
                      <span>Email</span>
                    </Label>
                    <Input id="login-email" type="email" placeholder="seu@email.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="h-12 text-base" />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="login-password" className="flex items-center space-x-2 text-foreground font-medium">
                      <Lock className="w-4 h-4 text-primary" />
                      <span>Senha</span>
                    </Label>
                    <div className="relative">
                      <Input id="login-password" type={showLoginPassword ? "text" : "password"} placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="h-12 text-base pr-12" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isLoading}>
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>

                  <div className="text-center">
                    <button type="button" onClick={() => { setActiveTab("reset"); setError(""); setMessage(""); }} className="text-sm text-primary hover:text-primary/80 underline font-medium">
                      Esqueceu sua senha?
                    </button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Criando os doutores do futuro, hoje.</h3>
                  <p className="text-muted-foreground">Transforme seus estudos médicos com IA</p>
                </div>
                
                <form onSubmit={handleSignup} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="full-name" className="flex items-center space-x-2 text-foreground font-medium">
                        <User className="w-4 h-4 text-primary" />
                        <span>Nome Completo</span>
                      </Label>
                      <Input id="full-name" type="text" placeholder="Seu nome completo" value={fullName} onChange={e => setFullName(e.target.value)} required className="h-12 text-base" />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="gender" className="flex items-center space-x-2 text-foreground font-medium">
                        <Users className="w-4 h-4 text-primary" />
                        <span>Gênero</span>
                      </Label>
                      <div className="relative">
                        <select 
                          id="gender" 
                          value={gender} 
                          onChange={e => setGender(e.target.value)} 
                          required 
                          className="glass-select w-full h-12 px-4 py-3 pr-12 text-base text-foreground rounded-xl backdrop-blur-xl border-[1.5px] border-border-glass transition-all duration-300 focus:border-primary/50 focus:outline-none hover:border-primary/30 appearance-none cursor-pointer"
                          style={{
                            background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.1) 0%, hsl(0 0% 100% / 0.05) 100%)',
                          }}
                        >
                          <option value="" className="bg-card text-foreground">Selecione</option>
                          <option value="masculino" className="bg-card text-foreground">Masculino</option>
                          <option value="feminino" className="bg-card text-foreground">Feminino</option>
                          <option value="outro" className="bg-card text-foreground">Outro</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="username" className="flex items-center space-x-2 text-foreground font-medium">
                      <UserCheck className="w-4 h-4 text-primary" />
                      <span>Seu @ do Instagram / Usuário</span>
                    </Label>
                    <Input id="username" type="text" placeholder="@seuinstagram" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} required className="h-12 text-base" />
                    <p className="text-xs text-muted-foreground">3-30 caracteres, apenas letras minúsculas, números, '.', '-' ou '_'</p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="signup-email" className="flex items-center space-x-2 text-foreground font-medium">
                      <Mail className="w-4 h-4 text-primary" />
                      <span>Email</span>
                    </Label>
                    <Input id="signup-email" type="email" placeholder="seu@email.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required className="h-12 text-base" />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="signup-password" className="flex items-center space-x-2 text-foreground font-medium">
                      <Lock className="w-4 h-4 text-primary" />
                      <span>Senha</span>
                    </Label>
                    <div className="relative">
                      <Input id="signup-password" type={showSignupPassword ? "text" : "password"} placeholder="••••••••" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required className="h-12 text-base pr-12" minLength={6} />
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowSignupPassword(!showSignupPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                        {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
                  </div>

                  <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isLoading}>
                    {isLoading ? "Criando conta..." : "Criar Conta"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="reset" className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Recuperar Senha</h3>
                  <p className="text-muted-foreground">
                    Digite seu email para receber um link de recuperação
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="reset-email" className="flex items-center space-x-2 text-foreground font-medium">
                      <Mail className="w-4 h-4 text-primary" />
                      <span>Email</span>
                    </Label>
                    <Input id="reset-email" type="email" placeholder="seu@email.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required className="h-12 text-base" />
                  </div>

                  <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isLoading}>
                    {isLoading ? "Enviando..." : "Enviar Link de Recuperação"}
                  </Button>

                  <div className="text-center">
                    <button type="button" onClick={() => { setActiveTab("login"); setError(""); setMessage(""); }} className="text-sm text-primary hover:text-primary/80 underline font-medium">
                      Voltar ao login
                    </button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>;
};