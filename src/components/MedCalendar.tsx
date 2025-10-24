import { useState, useCallback, memo, useMemo, useEffect, FormEvent } from "react";
import { Plus, List, ChevronLeft, ChevronRight, BookOpen, Clock, Edit, CheckSquare, Briefcase, Calendar as CalendarIcon, Plane, Loader2, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription
} from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO, startOfWeek, endOfWeek, startOfDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import axios from "axios";
import { Input } from "@/components/ui/input"; 
import { Textarea } from "@/components/ui/textarea"; 

// Interface AppUser para compatibilidade com Index.tsx
interface AppUser {
  id: string;
  email: string;
  app_metadata: any;
  aud: string;
  created_at: string;
  role: string | null;
  last_sign_in_at: string;
  phone: string | null;
  user_metadata: any;
  email_confirmed_at: string | null;
}

// 10 CORES CONFORME SOLICITADO
const TASK_CLASSES: { [key: string]: string } = {
  Red: 'bg-red-500',
  Blue: 'bg-blue-500',
  Green: 'bg-green-500',
  Yellow: 'bg-yellow-500',
  Purple: 'bg-purple-500',
  Pink: 'bg-pink-500',
  Orange: 'bg-orange-500',
  Cyan: 'bg-cyan-500',
  Gray: 'bg-gray-500',
  Brown: 'bg-amber-800',
};

const COLOR_MAP: { [key: string]: string } = {
  Red: '#ef4444',
  Blue: '#3b82f6',
  Green: '#22c55e',
  Yellow: '#facc15',
  Purple: '#a855f7',
  Pink: '#ec4899',
  Orange: '#f97316',
  Cyan: '#06b6d4',
  Gray: '#6b7280',
  Brown: '#92400e',
};

const COLOR_KEYS = Object.keys(COLOR_MAP) as (keyof typeof TASK_CLASSES)[];

// Tipo retornado pela API para Tarefas
interface ApiTask {
  type: 'Prova' | 'Trabalho' | 'Folga' | 'Congresso' | 'Outro' | string;
  date: string | null; 
  color: keyof typeof TASK_CLASSES | string;
}

// Tipo de Tarefa para a UI
interface Task {
  id: number;
  type: 'Prova' | 'Trabalho' | 'Folga' | 'Congresso' | 'Outro';
  title: string;
  date: string; // ISO string for the date (e.g., '2025-10-09')
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  color: keyof typeof TASK_CLASSES;
}

// Tipo de Anotação para a UI (campo 'content')
interface Annotation {
  id: number;
  date: string; // ISO string for the date
  content: string; // Conteúdo da anotação
}

interface MedCalendarProps {
  user: AppUser | null;
}

/**
 * Função de Mapeamento: Traduz a resposta da API para o formato da UI.
 */
const mapApiTaskToUiTask = (apiTask: ApiTask, index: number): Task | null => {
    // Se a data for nula ou não for uma string válida, retorne null para que seja filtrado
    if (!apiTask.date || typeof apiTask.date !== 'string') {
        console.warn("Tarefa ignorada devido à data inválida ou ausente:", apiTask);
        return null;
    }
    
    const taskType = apiTask.type as Task['type'];
    const title = `Tarefa: ${apiTask.type}`;

    return {
        id: index + 1 + Date.now() + Math.random(), 
        type: taskType,
        title: title,
        date: apiTask.date,
        startTime: '09:00', // Mock de Horário (Idealmente viria do backend)
        endTime: '11:00', // Mock de Horário (Idealmente viria do backend)
        color: apiTask.color as keyof typeof TASK_CLASSES,
    };
};

const MedCalendarComponent = ({ user }: MedCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // ESTADOS DO FORMULÁRIO DE TAREFAS
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [formType, setFormType] = useState<Task['type']>('Prova');
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(format(selectedDay, 'yyyy-MM-dd'));
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:00');
  const [formColor, setFormColor] = useState<keyof typeof TASK_CLASSES>('Red');
  
  // ESTADOS DE ANOTAÇÕES
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  
  // Reseta os estados do formulário de tarefas
  const resetFormState = useCallback(() => {
    setFormTitle('');
    setFormDate(format(selectedDay, 'yyyy-MM-dd'));
    setFormStartTime('09:00');
    setFormEndTime('10:00');
    setFormColor('Red');
    setIsAddTaskModalOpen(false);
  }, [selectedDay]);

  // Função para Buscar Tarefas da API
  const fetchTasks = useCallback(async () => {
    const emailToUse = user?.email || "gabrieldosaas@gmail.com"; 
    
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/api/return-tasks', {
        email: emailToUse,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      let apiTasks = response.data?.calendar; 

      if (!Array.isArray(apiTasks)) {
          console.error("A API não retornou um array de tarefas (Formato Inesperado). Resposta recebida:", response.data);
          setTasks([]);
          return; 
      }
      
      const uiTasks = (apiTasks as ApiTask[])
        .map(mapApiTaskToUiTask)
        .filter((task): task is Task => task !== null);
      
      setTasks(uiTasks);
      
      if (uiTasks.length === 0) {
          console.log("Backend retornou 0 tarefas ou todas tinham data inválida.");
      }
      
    } catch (error) {
      console.error('Erro ao buscar tarefas (Falha de Conexão ou Rede):', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Função para Adicionar Nova Tarefa à API E ATUALIZAR O ESTADO LOCAL
  const handleAddTask = useCallback(async (data: { type: Task['type'], title: string, date: string, startTime: string, endTime: string, color: keyof typeof TASK_CLASSES }) => {
    const emailToUse = user?.email || "gabrieldosaas@gmail.com";

    // 1. ATUALIZA O ESTADO LOCAL IMEDIATAMENTE (Feedback para o usuário)
    const newTask: Task = {
        ...data,
        id: Date.now(), // ID local temporário
    };
    setTasks(prev => [...prev, newTask]);
    
    try {
      // 2. CHAMA A API
      await axios.post('http://localhost:3000/api/task', {
        email: emailToUse,
        type: data.type,
        date: data.date,
        color: data.color,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      // 3. RECARRGA OS DADOS APÓS A ADIÇÃO para sincronizar (e substituir o item temporário)
      setTimeout(() => fetchTasks(), 500); 

    } catch (error) {
      console.error('Erro ao adicionar tarefa na API:', error);
      // Remove a tarefa recém-adicionada do estado local se a API falhar (rollback)
      setTasks(prev => prev.filter(task => task.id !== newTask.id));
      alert('Erro ao salvar no servidor. Tente novamente.');
    }
  }, [user, fetchTasks]);
  
  // Abre o modal para coletar o restante dos dados da tarefa
  const handleOpenAddTaskModal = useCallback((type: Task['type'], defaultColor: keyof typeof TASK_CLASSES) => {
    setFormType(type);
    setFormTitle(`Novo(a) ${type}`);
    setFormColor(defaultColor);
    setFormDate(format(selectedDay, 'yyyy-MM-dd'));
    setIsAddTaskModalModalOpen(true);
  }, [selectedDay]);
  
  // FUNÇÃO PARA SUBMIT DO FORMULÁRIO COMPLETO DA TAREFA
  const handleSubmitTask = (e: FormEvent) => {
    e.preventDefault();
    
    if (!formTitle.trim()) {
        alert('O título da tarefa é obrigatório.');
        return;
    }
    
    handleAddTask({
        type: formType,
        title: formTitle.trim(),
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        color: formColor,
    });
    
    resetFormState();
  };

  // ====================================================================
  // IMPLEMENTAÇÃO DE ANOTAÇÕES
  // ====================================================================

  // Função para Buscar Anotações da API
  const fetchNotes = useCallback(async () => {
    const emailToUse = user?.email || "gabrieldosaas@gmail.com";
    try {
      const response = await axios.post('http://localhost:3000/api/return-notes', {
        email: emailToUse
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      // ✅ CORREÇÃO APLICADA AQUI: Mapeamento dos campos da API para a interface da UI
      if (Array.isArray(response.data?.notes)) {
        const mappedNotes: Annotation[] = response.data.notes.map((apiNote: any, index: number) => ({
            // Gerando um ID local para o React, pois o backend não o retorna
            id: index + Date.now() + Math.random(), 
            date: apiNote.date,
            // Mapeia o campo 'note' do backend para 'content' do frontend
            content: apiNote.note, 
        }));
        setAnnotations(mappedNotes);
      } else {
        setAnnotations([]);
        console.warn("API de notas retornou formato inesperado ou 0 notas.", response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar notas:', error);
    }
  }, [user]);

  // Função para Adicionar Anotação à API
  const handleAddNote = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    const emailToUse = user?.email || "gabrieldosaas@gmail.com";
    
    if (!noteContent.trim()) {
      alert('A anotação não pode estar vazia.');
      return;
    }

    const noteDate = format(selectedDay, 'yyyy-MM-dd');

    // 1. Otimisticamente adiciona a nota
    const tempId = Date.now();
    const newNote: Annotation = { 
      id: tempId, 
      date: noteDate, 
      content: noteContent.trim() 
    };
    setAnnotations(prev => [...prev, newNote]);
    setIsAddNoteModalOpen(false);
    setNoteContent("");
    
    try {
      // 2. Chama a API
      await axios.post('http://localhost:3000/api/add-note', {
        email: emailToUse,
        note: newNote.content, // Envia o conteúdo da UI como 'note' para o backend
        date: newNote.date 
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      // 3. Recarrega os dados para obter o ID real e garantir a sincronia
      setTimeout(() => fetchNotes(), 500);

    } catch (err) {
      console.error('Erro ao adicionar nota:', err);
      // Rollback em caso de falha da API
      setAnnotations(prev => prev.filter(note => note.id !== tempId));
      alert('Erro ao salvar anotação no servidor.');
    }
  }, [user, noteContent, selectedDay, fetchNotes]);

  // ====================================================================

  // Carrega as tarefas e anotações no primeiro carregamento
  useEffect(() => {
    fetchTasks();
    fetchNotes(); 
  }, [fetchTasks, fetchNotes]);

  // --- Lógica de Visualização e Filtros ---

  const goToPrevious = () => {
    let newDate;
    if (view === 'month') newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    else if (view === 'week') newDate = addDays(currentDate, -7);
    else newDate = addDays(currentDate, -1);
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    let newDate;
    if (view === 'month') newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    else if (view === 'week') newDate = addDays(currentDate, 7);
    else newDate = addDays(currentDate, 1);
    setCurrentDate(newDate);
  };

  const calendarDays = useMemo(() => {
    if (view === 'month') {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    } else if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    } else { // 'day'
      return [startOfDay(selectedDay)];
    }
  }, [currentDate, view, selectedDay]);

  const tasksForSelectedDay = useMemo(() => {
    return tasks
      .filter(task => task.date && isSameDay(parseISO(task.date), selectedDay))
      .sort((a, b) => {
          if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
          return 0;
      });
  }, [tasks, selectedDay]);

  const annotationsForSelectedDay = useMemo(() => {
    // Garante que a anotação tenha um campo 'date' válido para evitar quebras
    return annotations.filter(note => note.date && isSameDay(parseISO(note.date), selectedDay));
  }, [annotations, selectedDay]);

  const handleDayClick = useCallback((day: Date) => {
    setSelectedDay(day);
    if (view !== 'day') {
      setView('day');
      setCurrentDate(day);
    }
  }, [view]);

  const getDayIndicators = useCallback((day: Date) => {
    const dayTasks = tasks.filter(task => task.date && isSameDay(parseISO(task.date), day));
    const dayNotes = annotations.filter(note => note.date && isSameDay(parseISO(note.date), day));
    
    const colorClasses = dayTasks.map(task => TASK_CLASSES[task.color]);
    const hasNote = dayNotes.length > 0;

    return { colorClasses, hasNote };
  }, [tasks, annotations]);
  
  const navTitle = useMemo(() => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy', { locale: ptBR });
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      // Reduz o formato para telas pequenas
      return `${format(start, 'dd/MM', { locale: ptBR })} - ${format(end, 'dd/MM', { locale: ptBR })}`;
    }
    return format(selectedDay, 'EEEE, dd MMMM yyyy', { locale: ptBR });
  }, [currentDate, view, selectedDay]);

  // Renderização
  return (
    <div className="min-h-screen">
      {/* O px-6 do container é adequado. Usar 'max-w-7xl' para limitar em telas muito grandes. */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl relative z-10">
        
        {/* Título principal */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-foreground font-bold mb-4 tracking-tight text-3xl sm:text-4xl">MedCalendar</h1>
          <p className="text-foreground/70 leading-relaxed max-w-2xl mx-auto text-base sm:text-lg">
            Organize sua vida acadêmica com provas, trabalhos, folgas e congressos.
          </p>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto rounded-full mt-6"></div>
        </div>

        {/* CONTROLES E VISUALIZAÇÃO - Stacks vertically on small screens, side-by-side on large screens */}
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          
          {/* Coluna Principal: Calendário / Visualização Diária */}
          <div className="lg:w-3/4">
            
            {/* Menu de Opções e Navegação - Uses flex-wrap to ensure stacking on small screens */}
            <div className="glass-card p-4 mb-6 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
              
              {/* Botão Adicionar Tarefa - Abre o Modal */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="btn-glow px-4 sm:px-6 flex items-center gap-2 text-sm sm:text-base">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Adicionar Tarefa
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-2 glass-card">
                  <div className="flex flex-col space-y-1">
                    <Button 
                        variant="ghost" 
                        className="justify-start flex items-center space-x-2 text-sm" 
                        onClick={() => handleOpenAddTaskModal('Prova', 'Red')}
                    >
                        <CheckSquare className="w-4 h-4 text-red-500"/> <span>Adicionar Prova</span>
                    </Button>
                    <Button 
                        variant="ghost" 
                        className="justify-start flex items-center space-x-2 text-sm" 
                        onClick={() => handleOpenAddTaskModal('Trabalho', 'Blue')}
                    >
                        <Briefcase className="w-4 h-4 text-blue-500"/> <span>Adicionar Trabalho</span>
                    </Button>
                    <Button 
                        variant="ghost" 
                        className="justify-start flex items-center space-x-2 text-sm" 
                        onClick={() => handleOpenAddTaskModal('Folga', 'Green')}
                    >
                        <Plane className="w-4 h-4 text-green-500"/> <span>Adicionar Folga</span>
                    </Button>
                    <Button 
                        variant="ghost" 
                        className="justify-start flex items-center space-x-2 text-sm" 
                        onClick={() => handleOpenAddTaskModal('Congresso', 'Yellow')}
                    >
                        <CalendarIcon className="w-4 h-4 text-yellow-500"/> <span>Adicionar Congresso</span>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Navegação */}
              <div className="flex items-center space-x-2 sm:space-x-3 order-first w-full justify-between sm:w-auto sm:order-none">
                <Button variant="ghost" onClick={goToPrevious} className="btn-glass p-1 sm:p-2">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                {/* REMOVIDO: min-w-[200px] para maior fluidez em mobile */}
                <h2 className="text-base sm:text-lg font-semibold text-foreground text-center">
                  {navTitle}
                </h2>
                <Button variant="ghost" onClick={goToNext} className="btn-glass p-1 sm:p-2">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Opções de Visualização (Mês/Semana/Dia) */}
              <div className="flex space-x-1 sm:space-x-2 p-1 bg-background/50 rounded-lg border border-primary/20">
                <Button 
                  size="sm" 
                  onClick={() => setView('month')} 
                  className={view === 'month' ? 'bg-primary/80 hover:bg-primary text-white text-xs sm:text-sm' : 'bg-transparent hover:bg-primary/10 text-foreground text-xs sm:text-sm'}
                >
                  Mês
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setView('week')} 
                  className={view === 'week' ? 'bg-primary/80 hover:bg-primary text-white text-xs sm:text-sm' : 'bg-transparent hover:bg-primary/10 text-foreground text-xs sm:text-sm'}
                >
                  Semana
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => { setView('day'); setCurrentDate(selectedDay); }} 
                  className={view === 'day' ? 'bg-primary/80 hover:bg-primary text-white text-xs sm:text-sm' : 'bg-transparent hover:bg-primary/10 text-foreground text-xs sm:text-sm'}
                >
                  Dia
                </Button>
              </div>
            </div>

            {/* Renderização do Calendário (Mensal/Semanal) */}
            {(view === 'month' || view === 'week') && (
              <div className="glass-card p-4 lg:p-6 min-h-[400px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full min-h-[300px] flex-col">
                        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                        <p className="text-foreground/70">Carregando tarefas...</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-7 text-center font-bold text-xs sm:text-sm mb-4 text-primary">
                          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day} className="p-1 sm:p-2">{day}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {calendarDays.map((day, index) => {
                            const isCurrentMonth = view === 'month' && day.getMonth() === currentDate.getMonth();
                            const isDayInView = view === 'week' || isCurrentMonth;
                            const isSelected = isSameDay(day, selectedDay);
                            const isTodayMarker = isToday(day);
                            const { colorClasses, hasNote } = getDayIndicators(day);

                            return (
                              <div 
                                key={index}
                                onClick={() => handleDayClick(day)}
                                className={`p-1 sm:p-3 aspect-square cursor-pointer rounded-lg relative transition-all duration-200
                                  ${isDayInView ? 'hover:bg-primary/10' : 'text-foreground/30 pointer-events-none'}
                                  ${isSelected ? 'bg-primary/30 border border-primary' : ''}
                                  ${isTodayMarker && !isSelected ? 'border-2 border-accent' : ''}
                                  ${isDayInView ? 'opacity-100' : 'opacity-40'}
                                `}
                              >
                                {/* Garante que o número do dia seja pequeno em mobile */}
                                <span className={`text-xs sm:text-sm font-medium ${isTodayMarker ? 'text-accent' : isDayInView ? 'text-foreground' : 'text-foreground/30'}`}>
                                  {format(day, 'd')}
                                </span>
                                
                                {/* Indicadores de Tarefa (Cores) e Anotação */}
                                <div className="absolute bottom-1 left-0 right-0 flex justify-center items-center space-x-0.5">
                                  {colorClasses.map((colorClass, idx) => (
                                    <div key={idx} className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${colorClass}`} />
                                  ))}
                                  {hasNote && <Edit className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-yellow-400" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                    </>
                )}
              </div>
            )}
            
            {/* Renderização da Visualização Diária */}
            {view === 'day' && (
              <div className="glass-card p-4 sm:p-6">
                <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-foreground border-b border-primary/20 pb-3">
                    Visualização Diária: {format(selectedDay, 'EEEE, dd MMMM', { locale: ptBR })}
                </h3>
                
                {/* --- Tarefas do Dia --- */}
                <h4 className="text-lg sm:text-xl font-semibold text-foreground border-b border-primary/10 pb-2 mb-4 flex items-center space-x-2">
                    <List className="w-5 h-5 text-primary" /> 
                    <span>Tarefas Agendadas ({tasksForSelectedDay.length})</span>
                </h4>
                <div className="space-y-4 mb-8">
                  {tasksForSelectedDay.length > 0 ? (
                    tasksForSelectedDay.map(task => {
                      const hexColor = COLOR_MAP[task.color] || '#6b7280';
                      const Icon = task.type === 'Prova' ? CheckSquare : task.type === 'Trabalho' ? Briefcase : task.type === 'Folga' ? Plane : CalendarIcon;
                      
                      return (
                      <div key={task.id} className="p-3 sm:p-4 rounded-lg border border-primary/20 shadow-xl" style={{ borderLeft: `6px solid ${hexColor}`}}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-base sm:text-lg font-bold text-foreground">{task.title}</span>
                          <div className={`text-xs sm:text-sm px-3 py-1 rounded-full text-white flex items-center space-x-1 ${TASK_CLASSES[task.color]}`}>
                              <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>{task.type}</span>
                          </div>
                        </div>
                        <div className="text-sm sm:text-base text-foreground/70 mt-1">
                          {task.startTime && task.endTime && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4 mr-1 text-primary" />
                              <span className="font-semibold">Horário: {task.startTime} - {task.endTime}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )})
                  ) : (
                    <p className="text-foreground/50 text-sm sm:text-base text-center py-4 rounded-lg border border-primary/20 bg-background/50">Nenhuma tarefa agendada para este dia.</p>
                  )}
                </div>

                {/* --- Anotações do Dia --- */}
                <h4 className="text-lg sm:text-xl font-semibold text-foreground border-b border-primary/10 pb-2 mb-4 flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-yellow-400" />
                    <span>Anotações Realizadas ({annotationsForSelectedDay.length})</span>
                </h4>
                <div className="space-y-4">
                    {annotationsForSelectedDay.length > 0 ? (
                        annotationsForSelectedDay.map(note => (
                            <div key={note.id} className="p-3 sm:p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 shadow-xl border-l-4 border-l-yellow-500">
                                <div className="flex items-center space-x-2 text-yellow-300 mb-2">
                                    <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="text-sm font-medium text-yellow-300">Anotação Registrada</span>
                                </div>
                                {/* Classes para quebra de texto garantem responsividade */}
                                <p className="text-sm sm:text-base text-foreground break-words whitespace-normal">{note.content}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-foreground/50 text-sm sm:text-base text-center py-4 rounded-lg border border-primary/20 bg-background/50">Nenhuma anotação registrada para este dia.</p>
                    )}
                </div>
              </div>
            )}

          </div>

          {/* Coluna Lateral: Painel Lateral do Dia - Stacks below on mobile */}
          <div className="lg:w-1/4">
            <Card className="glass-card lg:sticky lg:top-8">
              <CardHeader className="p-4 border-b border-primary/20">
                <CardTitle className="text-lg flex items-center space-x-2 text-primary">
                  <List className="w-5 h-5" />
                  <span>Detalhes de:</span>
                </CardTitle>
                <CardDescription className="text-sm text-foreground/70">
                  {format(selectedDay, 'EEEE, dd MMMM yyyy', { locale: ptBR })}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-4 space-y-4">
                
                {/* Tarefas do Dia (com Nome + Horário) */}
                <h4 className="text-base font-semibold text-foreground border-b border-primary/10 pb-2">Tarefas ({tasksForSelectedDay.length})</h4>
                {tasksForSelectedDay.length > 0 ? (
                  tasksForSelectedDay.map(task => {
                    const hexColor = COLOR_MAP[task.color] || '#6b7280';
                    const Icon = task.type === 'Prova' ? CheckSquare : task.type === 'Trabalho' ? Briefcase : task.type === 'Folga' ? Plane : CalendarIcon;
                    
                    return (
                    <div key={task.id} className="p-3 rounded-lg border border-primary/20 shadow-lg transition-shadow duration-300 hover:shadow-primary/50" style={{ borderLeft: `4px solid ${hexColor}`}}>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-foreground">{task.title}</span>
                        <div className={`text-xs px-2 py-0.5 rounded-full text-white flex items-center space-x-1 ${TASK_CLASSES[task.color]}`}>
                            <Icon className="w-3 h-3" />
                            <span>{task.type}</span>
                        </div>
                      </div>
                      <div className="text-xs text-foreground/60 mt-1">
                        {task.startTime && task.endTime && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span className="font-semibold">{task.startTime} - {task.endTime}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )})
                ) : (
                  <p className="text-foreground/50 text-sm text-center py-2">Nenhuma tarefa agendada.</p>
                )}
                
                {/* Anotações do Dia */}
                <h4 className="text-base font-semibold text-foreground border-b border-primary/10 pb-2 pt-4">Anotações ({annotationsForSelectedDay.length})</h4>
                {annotationsForSelectedDay.length > 0 ? (
                    annotationsForSelectedDay.map(note => (
                        <div key={note.id} className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 shadow-lg border-l-4 border-l-yellow-500">
                            <div className="flex items-center space-x-2 text-yellow-300 mb-1">
                                <BookOpen className="w-4 h-4" />
                                <span className="text-sm font-medium text-yellow-300">Anotação</span>
                            </div>
                            {/* Garante que o texto quebre dentro da caixa */}
                            <p className="text-xs text-foreground/80 italic break-words whitespace-normal">{note.content}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-foreground/50 text-sm text-center py-2">Nenhuma anotação para este dia.</p>
                )}
                
                {/* Botão Adicionar Anotação */}
                <div className="pt-4 border-t border-primary/10">
                  <Button 
                    variant="outline" 
                    className="w-full btn-glass flex items-center space-x-2"
                    onClick={() => {
                        setNoteContent(""); // Limpa o conteúdo para o novo dia
                        setIsAddNoteModalOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    <span>Adicionar Anotação</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/*
          =============== MODAL DE ADIÇÃO DE TAREFA (FORMULÁRIO REAL) ===============
        */}
        {isAddTaskModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
                <Card className="w-full max-w-sm sm:max-w-lg glass-card p-4 sm:p-6 border border-primary/30">
                    <form onSubmit={handleSubmitTask}>
                        <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg sm:text-xl">Adicionar {formType}</CardTitle>
                            <Button type="button" variant="ghost" size="icon" onClick={resetFormState}>
                                <X className="w-5 h-5" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0 space-y-4">
                            
                            {/* 1. Título da Tarefa */}
                            <div className="space-y-2">
                                <label htmlFor="title" className="text-sm font-medium text-foreground">Título *</label>
                                <Input 
                                    id="title"
                                    type="text" 
                                    required
                                    value={formTitle} 
                                    onChange={(e) => setFormTitle(e.target.value)} 
                                    placeholder={`Ex: Prova de ${formType}`}
                                    className="bg-background/40 border-primary/30 focus-visible:ring-primary"
                                />
                            </div>
                            
                            {/* Grid 3 colunas que colapsa em 1 coluna em telas extra-small (xs) */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* 2. Data da Tarefa */}
                                <div className="space-y-2">
                                    <label htmlFor="date" className="text-sm font-medium text-foreground">Data *</label>
                                    <Input 
                                        id="date"
                                        type="date" 
                                        required
                                        value={formDate} 
                                        onChange={(e) => setFormDate(e.target.value)}
                                        className="bg-background/40 border-primary/30 focus-visible:ring-primary"
                                    />
                                </div>

                                {/* 3. Horário de Início */}
                                <div className="space-y-2">
                                    <label htmlFor="startTime" className="text-sm font-medium text-foreground">Início</label>
                                    <Input 
                                        id="startTime"
                                        type="time" 
                                        value={formStartTime} 
                                        onChange={(e) => setFormStartTime(e.target.value)}
                                        className="bg-background/40 border-primary/30 focus-visible:ring-primary"
                                    />
                                </div>

                                {/* 4. Horário de Fim */}
                                <div className="space-y-2">
                                    <label htmlFor="endTime" className="text-sm font-medium text-foreground">Fim</label>
                                    <Input 
                                        id="endTime"
                                        type="time" 
                                        value={formEndTime} 
                                        onChange={(e) => setFormEndTime(e.target.value)}
                                        className="bg-background/40 border-primary/30 focus-visible:ring-primary"
                                    />
                                </div>
                            </div>
                            
                            {/* 5. Cores Personalizadas (10 Cores) */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Cor da Tarefa (Aparece no Calendário)</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLOR_KEYS.map((colorKey) => (
                                        <button
                                            key={colorKey}
                                            type="button"
                                            onClick={() => setFormColor(colorKey)}
                                            title={colorKey as string} 
                                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-150 relative 
                                            ${formColor === colorKey ? 'ring-4 ring-offset-2 ring-offset-background ring-primary/60' : 'hover:ring-2 hover:ring-primary/40'}`}
                                            style={{ backgroundColor: COLOR_MAP[colorKey] }}
                                        >
                                            {formColor === colorKey && <CheckSquare className="w-4 h-4 text-white absolute inset-0 m-auto" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </CardContent>
                        
                        <div className="mt-6 flex justify-end space-x-3">
                            <Button 
                                type="button"
                                variant="outline" 
                                className="btn-glass text-sm sm:text-base"
                                onClick={resetFormState}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" className="text-sm sm:text-base">
                                Salvar Tarefa
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        )}
        {/* =============== FIM DO MODAL DE ADIÇÃO DE TAREFA =============== */}

        {/*
          =============== MODAL DE ADIÇÃO DE ANOTAÇÃO (NOVO) ===============
        */}
        {isAddNoteModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
                <Card className="w-full max-w-sm sm:max-w-lg glass-card p-4 sm:p-6 border border-yellow-500/30">
                    <form onSubmit={handleAddNote}>
                        <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
                                <Edit className="w-5 h-5 text-yellow-400" />
                                <span>Adicionar Anotação</span>
                            </CardTitle>
                            <Button type="button" variant="ghost" size="icon" onClick={() => setIsAddNoteModalOpen(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0 space-y-4">
                            
                            <p className="text-sm text-foreground/70">
                                Anotação para o dia: <span className="font-semibold text-primary">{format(selectedDay, 'dd/MM/yyyy')}</span>
                            </p>

                            {/* Conteúdo da Anotação */}
                            <div className="space-y-2">
                                <label htmlFor="noteContent" className="text-sm font-medium text-foreground">Conteúdo da Anotação *</label>
                                <Textarea 
                                    id="noteContent"
                                    required
                                    value={noteContent} 
                                    onChange={(e) => setNoteContent(e.target.value)} 
                                    placeholder="Ex: Revisar slides da aula de Cardiologia."
                                    className="min-h-[100px] bg-background/40 border-yellow-500/30 focus-visible:ring-yellow-500"
                                />
                            </div>

                        </CardContent>
                        
                        <div className="mt-6 flex justify-end space-x-3">
                            <Button 
                                type="button"
                                variant="outline" 
                                className="btn-glass text-sm sm:text-base"
                                onClick={() => setIsAddNoteModalOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm sm:text-base">
                                Salvar Anotação
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        )}
        {/* =============== FIM DO MODAL DE ADIÇÃO DE ANOTAÇÃO =============== */}
      </div>
    </div>
  );
};

export const MedCalendar = memo(MedCalendarComponent);