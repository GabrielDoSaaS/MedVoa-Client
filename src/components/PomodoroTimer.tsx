import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Play, Pause, RotateCcw, Settings, Coffee, Brain, TrendingUp, Calendar, Target, Award, Circle } from "lucide-react";

// Interfaces mantidas para tipagem
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

// NOVO: Props para o PomodoroTimer
interface PomodoroTimerProps {
    settings: PomodoroSettings;
    setSettings: (newSettings: PomodoroSettings) => void;
    currentSession: PomodoroSession['type'];
    setCurrentSession: (session: PomodoroSession['type']) => void;
    timeLeft: number;
    isRunning: boolean;
    completedSessions: PomodoroSession[];
    currentSubject: string;
    setCurrentSubject: (subject: string) => void;
    userSections: string[];

    // Handlers
    handleStart: () => Promise<void>;
    handlePause: () => void;
    handleReset: () => void;
    handleQuickSwitch: (session: PomodoroSession['type']) => void;

    // Helpers
    getCurrentDuration: () => number;
    formatTime: (seconds: number) => string;
}

export const PomodoroTimer = ({
    settings,
    setSettings,
    currentSession,
    timeLeft,
    isRunning,
    completedSessions,
    currentSubject,
    setCurrentSubject,
    userSections,
    handleStart,
    handlePause,
    handleReset,
    handleQuickSwitch,
    getCurrentDuration,
    formatTime,
}: PomodoroTimerProps) => {

  // REMOVIDO: audioRef e useEffect de inicialização foram movidos para Index.tsx, que gerencia o timer.

  const getProgress = (): number => {
    const totalTime = getCurrentDuration() * 60;
    if (totalTime === 0) return 0; 
    return (totalTime - timeLeft) / totalTime * 100;
  };
  
  // Mapeamento dos handlers do pai
  const switchToWork = useCallback(() => handleQuickSwitch('work'), [handleQuickSwitch]);
  const switchToShortBreak = useCallback(() => handleQuickSwitch('shortBreak'), [handleQuickSwitch]);
  const switchToLongBreak = useCallback(() => handleQuickSwitch('longBreak'), [handleQuickSwitch]);


  // Statistics
  const todaysSessions = completedSessions.filter(session => {
    const today = new Date();
    const sessionDate = new Date(session.completedAt);
    return sessionDate.toDateString() === today.toDateString();
  });
  const totalStudyTime = completedSessions.filter(session => session.type === 'work').reduce((total, session) => total + session.duration, 0);

  const getSessionIcon = () => {
    switch (currentSession) {
      case 'work':
        return <Brain className="w-6 h-6" />;
      case 'shortBreak':
        return <Coffee className="w-6 h-6" />;
      case 'longBreak':
        return <Coffee className="w-6 h-6" />;
    }
  };
  const getSessionLabel = () => {
    switch (currentSession) {
      case 'work':
        return 'Sessão de Estudo';
      case 'shortBreak':
        return 'Pausa Curta';
      case 'longBreak':
        return 'Pausa Longa';
    }
  };

  return <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Título principal e Cards de navegação */}
        <div className="text-center mb-6">
          <h1 className="font-bold text-white mb-2 text-4xl">Modo Foco</h1>
          <p className="text-foreground/70 text-lg">Técnica Pomodoro para estudos</p>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto rounded-full mt-6"></div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="futuristic-card">
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="glow-icon w-12 h-12 flex items-center justify-center">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Timer Ativo</h3>
                  <p className="text-foreground/70 text-sm leading-relaxed">
                    Inicie suas sessões de estudo
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="futuristic-card">
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="glow-icon w-12 h-12 flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Estatísticas</h3>
                  <p className="text-foreground/70 text-sm leading-relaxed">
                    Acompanhe seu progresso
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="futuristic-card">
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="glow-icon w-12 h-12 flex items-center justify-center">
                  <Settings className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Configurações</h3>
                  <p className="text-foreground/70 text-sm leading-relaxed">
                    Personalize seus timers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Session Card */}
        <div className="glass-card relative mb-6" style={{
        background: `var(--gradient-primary)`,
        border: '1px solid var(--border-glow)'
      }}>
            {/* Mode Buttons */}
            <div className="absolute top-4 left-4 flex space-x-2 z-10">
              <Button onClick={switchToWork} size="sm" variant={currentSession === 'work' ? 'default' : 'outline'} className={`w-8 h-8 rounded-full p-0 ${currentSession === 'work' ? 'bg-white/30 border-white/50 text-white' : 'bg-white/10 border-white/30 text-white/70 hover:bg-white/20'}`} title="Estudo">
                <Circle className={`w-3 h-3 ${currentSession === 'work' ? 'fill-current' : ''}`} />
              </Button>
              <Button onClick={switchToShortBreak} size="sm" variant={currentSession === 'shortBreak' ? 'default' : 'outline'} className={`w-8 h-8 rounded-full p-0 ${currentSession === 'shortBreak' ? 'bg-white/30 border-white/50 text-white' : 'bg-white/10 border-white/30 text-white/70 hover:bg-white/20'}`} title="Pausa Curta">
                <Circle className={`w-3 h-3 ${currentSession === 'shortBreak' ? 'fill-current' : ''}`} />
              </Button>
              <Button onClick={switchToLongBreak} size="sm" variant={currentSession === 'longBreak' ? 'default' : 'outline'} className={`w-8 h-8 rounded-full p-0 ${currentSession === 'longBreak' ? 'bg-white/30 border-white/50 text-white' : 'bg-white/10 border-white/30 text-white/70 hover:bg-white/20'}`} title="Pausa Longa">
                <Circle className={`w-3 h-3 ${currentSession === 'longBreak' ? 'fill-current' : ''}`} />
              </Button>
            </div>

          <div className="p-8 text-center">
            <div className="flex items-center justify-center mb-4 mt-4">
              {getSessionIcon()}
              <h2 className="text-2xl font-bold ml-3">{getSessionLabel()}</h2>
            </div>
            
            <div className="text-6xl font-mono font-bold mb-6">
              {formatTime(timeLeft)}
            </div>

            <Progress value={getProgress()} className="mb-6 h-3" />

            <div className="flex justify-center space-x-4">
              {!isRunning ? <Button onClick={handleStart} size="lg" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm">
                  <Play className="w-5 h-5 mr-2" />
                  Iniciar
                </Button> : <Button onClick={handlePause} size="lg" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm">
                  <Pause className="w-5 h-5 mr-2" />
                  Pausar
                </Button>}
              
              <Button onClick={handleReset} size="lg" variant="outline" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30">
                <RotateCcw className="w-5 h-5 mr-2" />
                Resetar
              </Button>
            </div>
          </div>
        </div>

        {/* Subject Input */}
        {currentSession === 'work' && <div className="glass-card p-6 mb-6">
            <Label htmlFor="subject" className="text-foreground">Matéria de Estudo (Opcional - Adiciona automaticamente ao iniciar)</Label>
            <Input
                id="subject"
                value={currentSubject}
                onChange={e => setCurrentSubject(e.target.value)}
                placeholder="Digite a matéria de estudo (ex: Cardiologia)"
                list="user-sections-list"
                className="input-glass mt-2 block w-full p-2.5 rounded-lg border bg-background/50 text-foreground border-foreground/30 focus:border-primary focus:ring-primary"
            />
            <datalist id="user-sections-list">
                {userSections.map((section, index) => (
                    <option key={index} value={section} />
                ))}
            </datalist>
          </div>}

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/70">Total de Horas</p>
                <p className="text-2xl font-bold text-primary">
                  {Math.round(totalStudyTime / 60 * 10) / 10}h
                </p>
              </div>
              <div className="glow-icon w-12 h-12 flex items-center justify-center">
                <Clock className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/70">Sessões Hoje</p>
                <p className="text-2xl font-bold text-primary">
                  {todaysSessions.filter(s => s.type === 'work').length}
                </p>
              </div>
              <div className="glow-icon w-12 h-12 flex items-center justify-center">
                <Calendar className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/70">Total de Sessões</p>
                <p className="text-2xl font-bold text-primary">
                  {completedSessions.filter(s => s.type === 'work').length}
                </p>
              </div>
              <div className="glow-icon w-12 h-12 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/70">Sequência</p>
                <p className="text-2xl font-bold text-primary">
                  {todaysSessions.filter(s => s.type === 'work').length > 0 ? '1 dia' : '0 dias'}
                </p>
              </div>
              <div className="glow-icon w-12 h-12 flex items-center justify-center">
                <Award className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center space-x-2">
            <div className="glow-icon w-8 h-8 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <span>Sessões Recentes</span>
          </h2>
          <div className="space-y-3">
            {completedSessions.slice(-10).reverse().map(session => <div key={session.id} className="flex items-center justify-between p-4 glass-card">
                <div className="flex items-center space-x-3">
                  {session.type === 'work' ? <Brain className="w-4 h-4 text-primary" /> : <Coffee className="w-4 h-4 text-primary" />}
                  <div>
                    <p className="font-medium text-foreground">
                      {session.type === 'work' ? 'Estudo' : session.type === 'shortBreak' ? 'Pausa Curta' : 'Pausa Longa'}
                    </p>
                    {session.subject && <p className="text-sm text-foreground/70">{session.subject}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{session.duration} min</p>
                  <p className="text-xs text-foreground/60">
                    {new Date(session.completedAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                  </p>
                </div>
              </div>)}
            {completedSessions.length === 0 && <p className="text-center text-foreground/60 py-8">
                Nenhuma sessão completada ainda. Comece seu primeiro pomodoro!
              </p>}
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-2xl font-semibold text-foreground mb-2 flex items-center space-x-2">
            <div className="glow-icon w-8 h-8 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <span>Configurações do Timer</span>
          </h2>
          <p className="text-foreground/70 mb-6">Personalize a duração das suas sessões de estudo</p>
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="workDuration" className="text-foreground">Duração do Estudo (minutos)</Label>
                  <Input id="workDuration" type="number" value={settings.workDuration} onChange={e => setSettings({
                ...settings,
                workDuration: parseInt(e.target.value) || 25
              })} min="1" max="60" className="input-glass mt-2" />
                </div>

                <div>
                  <Label htmlFor="shortBreak" className="text-foreground">Pausa Curta (minutos)</Label>
                  <Input id="shortBreak" type="number" value={settings.shortBreakDuration} onChange={e => setSettings({
                ...settings,
                shortBreakDuration: parseInt(e.target.value) || 5
              })} min="1" max="30" className="input-glass mt-2" />
                </div>

                <div>
                  <Label htmlFor="longBreak" className="text-foreground">Pausa Longa (minutos)</Label>
                  <Input id="longBreak" type="number" value={settings.longBreakDuration} onChange={e => setSettings({
                ...settings,
                longBreakDuration: parseInt(e.target.value) || 15
              })} min="5" max="60" className="input-glass mt-2" />
                </div>
              </div>

            <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Técnica Pomodoro</h4>
              <p className="text-sm text-foreground/70">
                  A técnica Pomodoro é um método de gerenciamento de tempo que usa intervalos de trabalho 
                  focado alternados com pausas curtas. Isso ajuda a manter a concentração e evitar o esgotamento mental.
                </p>
              </div>

              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Controles Rápidos</h4>
                <p className="text-sm text-foreground/70">
                  Use os botões circulares no canto superior esquerdo do timer para alternar rapidamente entre os modos de estudo e pausa.
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>;
};