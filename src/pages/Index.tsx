import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, BookOpen, FileText, Users, Zap, MessageCircle, Trophy, Clock, LogOut, Stethoscope, Play, Pause, RotateCcw } from "lucide-react"; 

// Importações dos componentes de página
import { DoutorIAPage } from "@/components/DoutorIAPage";
import { FlashcardGenerator } from "@/components/FlashcardGenerator";
import { QuizInterface } from "@/components/QuizInterface";
import { StudyDashboard } from "@/components/StudyDashboard";
import { AudioRecorder } from "@/components/AudioRecorder";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { ClinicalCases } from "@/components/ClinicalCases";
import { AuthPage } from "@/components/AuthPage"; 
import { SettingsPage } from "@/components/SettingsPage";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";
import { SubscriptionManagement } from "@/components/SubscriptionManagement";
import { UserMenu } from "@/components/UserMenu";
import { ProfilePage } from "@/pages/Profile";
import { SettingsPage as NewSettingsPage } from "@/pages/Settings";
import { MedCalendar } from "@/components/MedCalendar"; 

import { useSubscription } from "@/hooks/useSubscription";
import axios from "axios"; 

// ... (Tipos e interfaces como PomodoroSession, PomodoroSettings, BackendUser, AppUser)
// Configurações e Tipos do Pomodoro (LIFTED from PomodoroTimer.tsx)
interface PomodoroSession {
  id: string;
  type: 'work' | 'shortBreak' | 'longBreak';
  duration: number;
  completedAt: Date;
  subject?: string;
}
interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
}
// END Pomodoro Types

// Configurações para o Timer Persistente
const STATIC_USER_EMAIL = "gabrieldosaas@gmail.com"; 
const API_BASE_URL = 'http://localhost:3000/api'; 
const TEN_MINUTES_MS = 600000;

/**
 * Interface para usuários do backend (rota /get-users)
 */
interface BackendUser {
  email: string;
  isPremium: boolean;
  // Outras propriedades do User.find()
}

/**
 * Função para adicionar tempo de estudo no backend a cada 10 minutos.
 */
const addStudyTime = async (userEmail: string) => {
  const email = userEmail || STATIC_USER_EMAIL;
  try {
    await axios.post(
      `${API_BASE_URL}/addtime`,
      { email },
      {
        headers: { "Content-Type": "application/json" }
      }
    );
    console.log("Study time added successfully (+0.16h) to backend for:", email);
  } catch (error) {
    console.error("Error adding study time to backend:", error); 
  }
};


// Interface AppUser COMPLETA e sincronizada com AuthPage.tsx
export interface AppUser {
  id: string;
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
    sequence: number; 
    [key: string]: any; 
  };
}


// NOVO: Componente do Mini-Relógio Flutuante (Mantido)
const FloatingPomodoroStatus = ({ timeLeft, isRunning, currentSession, handlePause, formatTime, setActiveTab }: { 
    timeLeft: number, 
    isRunning: boolean, 
    currentSession: PomodoroSession['type'], 
    handlePause: () => void, 
    formatTime: (seconds: number) => string,
    setActiveTab: (tab: string) => void
}) => {
    if (!isRunning || currentSession !== 'work') return null; 

    return (
        <div 
            className="fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-2xl backdrop-blur-md cursor-pointer 
                       bg-gradient-to-br from-primary/80 to-purple-600/80 border border-primary/50 text-white 
                       transition-all hover:scale-105"
            onClick={() => setActiveTab('focus')}
        >
            <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 flex-shrink-0" />
                <span className="font-mono text-lg font-bold">
                    {formatTime(timeLeft)}
                </span>
                <Button 
                    onClick={(e) => {
                        e.stopPropagation(); 
                        handlePause();
                    }} 
                    size="sm" 
                    className="w-8 h-8 rounded-full p-0 bg-white/20 hover:bg-white/30 text-white"
                    title="Pausar Foco"
                >
                    <Pause className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};
// END FloatingPomodoroStatus

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState<AppUser | null>(null); 
  const [loading, setLoading] = useState(true);
  const [showPlans, setShowPlans] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNewSettings, setShowNewSettings] = useState(false);
  const [showSubscriptionManagement, setShowSubscriptionManagement] = useState(false);
  const [skipAuth, setSkipAuth] = useState(false);
  const [isForcedPremium, setIsForcedPremium] = useState(false); 
  const [isCheckingPremium, setIsCheckingPremium] = useState(false);
  
  // =======================================================
  // ADIÇÃO: Lógica do Timer de Estudo (Visível) Elevada
  // =======================================================
  // studyTime em segundos (para granularidade)
  const [studyTimeSeconds, setStudyTimeSeconds] = useState(0); 
  const studyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const formatStudyTime = (totalSeconds: number): string => {
    if (totalSeconds < 60) return `${totalSeconds}s`;
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds}s`;
  };

  // Efeito para o Timer VISÍVEL (roda a cada 1 segundo)
  useEffect(() => {
      // O timer só deve rodar se o usuário estiver logado ou se for o usuário estático
      if (!user && !skipAuth) {
        if (studyTimerRef.current) clearInterval(studyTimerRef.current);
        return;
      }
      
      // Se não estiver rodando, inicia.
      if (!studyTimerRef.current) {
        studyTimerRef.current = setInterval(() => {
          setStudyTimeSeconds(prev => prev + 1);
        }, 1000);
      }

      // Limpa o intervalo na desmontagem do Index (o que não acontece) ou antes de re-executar.
      return () => {
        if (studyTimerRef.current) {
          clearInterval(studyTimerRef.current);
          studyTimerRef.current = null;
        }
      };
  }, [user, skipAuth]);
  
  // Valor formatado para ser passado
  const formattedStudyTime = useMemo(() => formatStudyTime(studyTimeSeconds), [studyTimeSeconds]);

  // =======================================================
  // FIM DA ADIÇÃO
  // =======================================================


  // Pomodoro State LIFTED (Mantido)
  const [settings, setSettings] = useState<PomodoroSettings>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15
  });
  const [currentSession, setCurrentSession] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<PomodoroSession[]>([]);
  const [currentSubject, setCurrentSubject] = useState('');
  const [userSections, setUserSections] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null); // Referência para o áudio

  const {
    subscription,
    isReady,
    loading: subscriptionLoading
  } = useSubscription(user);

  const checkAuthStatus = async () => {
      setUser(null); 
      setLoading(false);
  };
  
  // ... (Outros handlers e useMemos mantidos, como isUserPremium, getCurrentDuration, formatTime, getApiEmail, etc.)
  const isUserPremium = useMemo(() => {
    if (user) {
        return user.user_metadata.isPremium;
    }
    if (isReady) {
        return subscription.subscription_tier === 'premium' || isForcedPremium;
    }
    return isForcedPremium; 
  }, [user, isReady, subscription.subscription_tier, isForcedPremium]);
  
  const getCurrentDuration = useCallback((): number => {
    switch (currentSession) {
      case 'work':
        return settings.workDuration;
      case 'shortBreak':
        return settings.shortBreakDuration;
      case 'longBreak':
        return settings.longBreakDuration;
      default:
        return settings.workDuration;
    }
  }, [currentSession, settings]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getApiEmail = useCallback(() => user?.email || STATIC_USER_EMAIL, [user]); // CHAVE: Esta função retorna o email.
  
  // ... (persistFocusSettings, handleSettingsUpdate, handlePause, handleSessionComplete, handleStart, handleReset, handleQuickSwitch mantidos)

  const persistFocusSettings = useCallback(async (newSettings: PomodoroSettings) => {
    const email = getApiEmail();
    try {
        await axios.post(`${API_BASE_URL}/addFocus`, {
            email: email,
            duracao: newSettings.workDuration,
            pausaCurta: newSettings.shortBreakDuration,
            pausaLonga: newSettings.longBreakDuration
        });
        console.log("Focus settings saved successfully to backend.");
    } catch (error) {
        console.error("Error saving focus settings:", error);
    }
  }, [getApiEmail]);

  const handleSettingsUpdate = useCallback((newSettings: PomodoroSettings) => {
    setSettings(newSettings);
    persistFocusSettings(newSettings);
    if (!isRunning) {
      setTimeLeft(newSettings.workDuration * 60);
    }
  }, [isRunning, persistFocusSettings]);

  const handlePause = useCallback(() => {
    setIsRunning(false);
  }, []);
  
  const handleSessionComplete = useCallback(() => {
    setIsRunning(false);

    const newSession: PomodoroSession = {
      id: Date.now().toString(),
      type: currentSession,
      duration: getCurrentDuration(),
      completedAt: new Date(),
      subject: currentSubject || undefined
    };
    setCompletedSessions(prev => [...prev, newSession]);
  }, [currentSession, getCurrentDuration, currentSubject]);

  const handleStart = useCallback(async () => {
    if (isRunning) return;

    if (currentSession === 'work' && currentSubject.trim()) {
        const subjectToAdd = currentSubject.trim();
        const email = getApiEmail();
        
        if (!userSections.includes(subjectToAdd)) {
            try {
                await axios.post(`${API_BASE_URL}/add-section`, {
                    email: email,
                    sectionName: subjectToAdd
                });
                setUserSections(prev => [...prev, subjectToAdd]);
            } catch (error) {
                console.error("Error adding section on timer start:", error);
            }
        }
    }
    
    setIsRunning(true);
  }, [isRunning, currentSession, currentSubject, userSections, getApiEmail]);
  
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(getCurrentDuration() * 60);
  }, [getCurrentDuration]);

  const handleQuickSwitch = useCallback((session: PomodoroSession['type']) => {
    setCurrentSession(session);
    setIsRunning(false);
    
    let duration;
    switch (session) {
      case 'work':
        duration = settings.workDuration;
        break;
      case 'shortBreak':
        duration = settings.shortBreakDuration;
        break;
      case 'longBreak':
        duration = settings.longBreakDuration;
        break;
      default:
        duration = settings.workDuration;
    }
    setTimeLeft(duration * 60);
  }, [settings]);


  // EFEITO 5 (Premium Status) (Mantido)
  useEffect(() => {
    const checkStaticUserPremiumStatus = async () => {
        setIsCheckingPremium(true); 
        try {
            const response = await axios.get<BackendUser[]>(`${API_BASE_URL}/get-users`);
            const allUsers = response.data;
            const targetEmail = getApiEmail(); 
            const targetUser = allUsers.find(
                (u) => u.email === targetEmail
            );

            if (targetUser && (targetUser as any).isPremium) {
                if (!user) { 
                    setIsForcedPremium(true);
                }
            } else {
                if (!user) {
                    setIsForcedPremium(false);
                }
            }
        } catch (error) {
            console.error("Error fetching users list for premium check:", error);
            setIsForcedPremium(false); 
        } finally {
            setIsCheckingPremium(false); 
        }
    };

    if (skipAuth || !user) {
        checkStaticUserPremiumStatus();
    }
  }, [user, skipAuth, getApiEmail]);


  // EFEITO 3: Carregamento Inicial de Configurações, Seções e Áudio (Modificado para incluir o áudio)
  useEffect(() => {
    const fetchSettingsAndSections = async () => {
        const email = getApiEmail();
        try {
            const focusRes = await axios.post(`${API_BASE_URL}/get-focus`, { email: email });
            const focusData = focusRes.data.focus;

            if (focusData && focusData.duracao) {
                const newSettings: PomodoroSettings = {
                    workDuration: focusData.duracao,
                    shortBreakDuration: focusData.pausaCurta,
                    longBreakDuration: focusData.pausaLonga
                };
                setSettings(newSettings);
                setTimeLeft(newSettings.workDuration * 60);
            }

            const sectionsRes = await axios.post(`${API_BASE_URL}/get-sections`, { email: email });
            if (sectionsRes.data.sections) {
                setUserSections(sectionsRes.data.sections);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    if (!user && !skipAuth) return;
    fetchSettingsAndSections();
    
    // INÍCIO DA MUDANÇA: Inicializa o AudioElement
    // Use o caminho correto para o seu arquivo .m4a
    audioRef.current = new Audio('/bell.m4a'); 
    audioRef.current.volume = 0.5;
    audioRef.current.load(); // Pré-carrega o áudio
    // FIM DA MUDANÇA
    
  }, [user, skipAuth, getApiEmail]);

  // EFEITO 4: Lógica do Timer Pomodoro (Intervalo) (Modificado para tocar o som)
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
            if (prevTime <= 1) { // No último segundo do timer (prevTime = 1)
                
                // INÍCIO DA MUDANÇA: 1. Tocar o som
                if (audioRef.current) {
                    // O método play() toca o áudio uma única vez por padrão
                    audioRef.current.play().catch(error => {
                        console.error("Erro ao tocar o áudio:", error);
                        // Se o áudio não tocar, é provavelmente devido à política de autoplay do navegador
                    });
                }
                
                // 2. Limpar o Intervalo imediatamente
                if (intervalRef.current) clearInterval(intervalRef.current);
                intervalRef.current = null;
                
                return 0; // Define o tempo como 0
            }
            return prevTime - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      // Se isRunning ainda for true e timeLeft for 0, é o momento de finalizar a sessão
      handleSessionComplete();
      
      // Limpar o intervalo por segurança, caso a limpeza dentro do setInterval não tenha funcionado.
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, handleSessionComplete]); // FIM DA MUDANÇA: Lógica do timer com som

  // EFEITO 1: Lógica de Autenticação (Mantida)
  useEffect(() => {
    checkAuthStatus();
    
    const handleNavigateToCasoteca = () => {
      setActiveTab('cases');
    };
    const handleNavigateToSubscription = () => {
      setShowPlans(true);
    };
    window.addEventListener('navigate-to-casoteca', handleNavigateToCasoteca);
    window.addEventListener('navigate-to-subscription', handleNavigateToSubscription);
    
    return () => {
      window.removeEventListener('navigate-to-casoteca', handleNavigateToCasoteca);
      window.removeEventListener('navigate-to-subscription', handleNavigateToSubscription);
    };
  }, []);
  
  // EFEITO 2: Timer Persistente e Requisição a cada 10 minutos (Mantido)
  useEffect(() => {
    if (!user && !skipAuth) return;

    const interval = setInterval(() => {
      const email = getApiEmail();
      addStudyTime(email);
    }, TEN_MINUTES_MS); 
    
    return () => clearInterval(interval);

  }, [user, skipAuth, getApiEmail]);
  
  // ... (Outros handlers de navegação e autenticação)
  const handleLoginSuccess = (userData: AppUser) => {
    setUser(userData);
  };
  
  const handleSignOut = async () => {
    setUser(null);
  };
  
  const handleProfileClick = () => setShowProfile(true);
  const handleSettingsClick = () => setShowNewSettings(true);
  const handleSkipAuth = () => setSkipAuth(true);
  
  
  if (loading || isCheckingPremium || (user && subscriptionLoading && !isReady)) {
    return <div className="main-background flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
            <Brain className="w-12 h-12 text-purple-500 animate-spin" />
          </div>
          <p className="gradient-text text-lg font-medium">Carregando...</p>
        </div>
      </div>;
  }
  
  if (!user && !skipAuth) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} onSkipAuth={handleSkipAuth} />;
  }
  
  if (showProfile) {
    return <ProfilePage user={user} onBack={() => setShowProfile(false)} />;
  }
  if (showNewSettings) {
    return <NewSettingsPage user={user} onBack={() => setShowNewSettings(false)} />;
  }
  if (showPlans) {
    return <SubscriptionPlans user={user} onBack={() => setShowPlans(true)} />;
  }
  
  if (showSubscriptionManagement) {
    const userEmailForSubscription = getApiEmail(); // CHAVE: Obter o email
    return <SubscriptionManagement 
      user={user} 
      userEmail={userEmailForSubscription} // NOVO: Passando o email
      onBack={() => setShowSubscriptionManagement(false)} 
    />;
  }

  // Restante da aplicação...
  return <div className="main-background">
      <header className="glass-header border-primary/20">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center">
                <Brain className="w-8 sm:w-10 h-8 sm:h-10 text-purple-500" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-bold gradient-text">MedVoa</h1>
                <p className="text-xs sm:text-sm text-foreground/70">Plataforma de Estudo Queridinha dos Mediciners</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {isReady && !isUserPremium && <Button onClick={() => setShowPlans(true)} className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white font-semibold text-xs sm:text-sm px-3 sm:px-6 py-2 rounded-full transition-all duration-300 border border-primary/50" style={{
              boxShadow: '0 0 20px hsl(var(--primary) / 0.6), 0 0 40px hsl(var(--primary) / 0.4), 0 0 60px hsl(var(--primary) / 0.2)'
            }}>
                  <span className="relative z-10 flex items-center space-x-1">
                    <span>🚀 Upgrade Premium</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </Button>}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  if (isUserPremium) {
                    setShowSubscriptionManagement(true);
                  } else {
                    setShowPlans(true);
                  }
                }} 
                className={`btn-glass ${isUserPremium ? 'border-yellow-400/50 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300' : 'text-foreground/80'} text-xs font-medium`}
              >
                {isUserPremium ? '👑 Estudante Premium' : '📋 Grátis'}
              </Button>
              
              <UserMenu user={user} onProfileClick={handleProfileClick} onSettingsClick={handleSettingsClick} onSignOut={handleSignOut} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="floating-nav grid w-full grid-cols-4 lg:grid-cols-8 mb-6 sm:mb-8 h-auto p-2 mx-auto max-w-6xl">
            <TabsTrigger value="dashboard" className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 p-3 sm:p-4 text-xs sm:text-sm rounded-xl transition-all duration-300 data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">
              <Trophy className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden text-[10px]">Painel</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 p-3 sm:p-4 text-xs sm:text-sm rounded-xl transition-all duration-300 data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">
              <MessageCircle className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="hidden sm:inline">Doutor IA</span>
              <span className="sm:hidden text-[10px]">IA</span>
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 p-3 sm:p-4 text-xs sm:text-sm rounded-xl transition-all duration-300 data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">
              <FileText className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="hidden sm:inline">Memobox</span>
              <span className="sm:hidden text-[10px]">Memo</span>
            </TabsTrigger>
            <TabsTrigger value="quiz" className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 p-3 sm:p-4 text-xs sm:text-sm rounded-xl transition-all duration-300 data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">
              <Zap className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="hidden sm:inline">Provas</span>
              <span className="sm:hidden text-[10px]">Prova</span>
            </TabsTrigger>
            <TabsTrigger value="recorder" className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 p-3 sm:p-4 text-xs sm:text-sm rounded-xl transition-all duration-300 data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">
              <BookOpen className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="hidden sm:inline">Resumed</span>
              <span className="sm:hidden text-[10px]">Audio</span>
            </TabsTrigger>
            <TabsTrigger value="cases" className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 p-3 sm:p-4 text-xs sm:text-sm rounded-xl transition-all duration-300 data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">
              <Stethoscope className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="hidden sm:inline">Casoteca</span>
              <span className="sm:hidden text-[10px]">Casos</span>
            </TabsTrigger>
            <TabsTrigger value="focus" className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 p-3 sm:p-4 text-xs sm:text-sm rounded-xl transition-all duration-300 data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">
              <Clock className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="hidden sm:inline">Modo Foco</span>
              <span className="sm:hidden text-[10px]">Foco</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 p-3 sm:p-4 text-xs sm:text-sm rounded-xl transition-all duration-300 data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">
              <Users className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="hidden sm:inline">MedCalendar</span>
              <span className="sm:hidden text-[10px]">Agenda</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          {isReady && (
            <>
              <TabsContent value="dashboard">
                {/* MODIFICADO: studyTime e formattedTime passados via props */}
                <StudyDashboard 
                    user={user} 
                    onUpgrade={() => setShowPlans(true)} 
                    studyTime={studyTimeSeconds / 60} // Passa em minutos, como estava antes
                    formattedTime={formattedStudyTime} // Passa o valor formatado
                />
              </TabsContent>

              <TabsContent value="chat">
                <DoutorIAPage user={user} onUpgrade={() => setShowPlans(true)} isPremium={isUserPremium} />
              </TabsContent>

              <TabsContent value="flashcards">
                <FlashcardGenerator user={user} onUpgrade={() => setShowPlans(true)} isPremium={isUserPremium}/>
              </TabsContent>

              <TabsContent value="quiz">
                <QuizInterface user={user} onUpgrade={() => setShowPlans(true)} isPremium={isUserPremium}/>
              </TabsContent>

              <TabsContent value="recorder">
                <AudioRecorder user={user} onUpgrade={() => setShowPlans(true)} isPremium={isUserPremium}/>
              </TabsContent>

              <TabsContent value="cases">
                <ClinicalCases user={user} onUpgrade={() => setShowPlans(true)} isPremium={isUserPremium}/>
              </TabsContent>

              <TabsContent value="focus">
                <PomodoroTimer 
                    settings={settings}
                    setSettings={handleSettingsUpdate}
                    currentSession={currentSession}
                    setCurrentSession={handleQuickSwitch}
                    timeLeft={timeLeft}
                    isRunning={isRunning}
                    completedSessions={completedSessions}
                    currentSubject={currentSubject}
                    setCurrentSubject={setCurrentSubject}
                    userSections={userSections}
                    handleStart={handleStart}
                    handlePause={handlePause}
                    handleReset={handleReset}
                    handleQuickSwitch={handleQuickSwitch}
                    getCurrentDuration={getCurrentDuration}
                    formatTime={formatTime}
                />
              </TabsContent>
              
              <TabsContent value="calendar">
                <MedCalendar user={user} />
              </TabsContent>
            </>
          )}
          
          {!isReady && (
            <div className="flex items-center justify-center py-12">
              <div className="glass-card p-6 text-center">
                <Brain className="w-8 h-8 mx-auto mb-4 text-purple-500 animate-pulse" />
                <p className="text-sm text-foreground/70">Preparando interface...</p>
              </div>
            </div>
          )}
        </Tabs>
      </main>
      
      <FloatingPomodoroStatus
        timeLeft={timeLeft}
        isRunning={isRunning}
        currentSession={currentSession}
        handlePause={handlePause}
        formatTime={formatTime}
        setActiveTab={setActiveTab}
      />
    </div>;
};

export default Index;