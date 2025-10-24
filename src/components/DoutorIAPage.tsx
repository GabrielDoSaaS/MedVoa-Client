import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, FileText, User, ArrowRight, Send, Brain, Plus, 
  Upload, Camera, Maximize2, Minimize2, X, MessageCircle 
} from "lucide-react"; 
import { UsageBanner } from "@/components/ui/usage-banner";
import { FeatureBlocker } from "@/components/ui/feature-blocker";
import { useSubscription } from "@/hooks/useSubscription";
import { User as SupabaseUser } from "@supabase/supabase-js";

import axios from 'axios'; 

interface DoutorIAPageProps {
  user?: SupabaseUser | null;
  onUpgrade?: () => void;
  isPremium?: boolean;
}

// Tipo para o formato de mensagens esperado pela API da Groq/OpenAI
interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

// Interface para os dados salvos no localStorage
interface MessageUsageData {
  count: number;
  date: string; // Data no formato YYYY-MM-DD
}

// --- UTILITY FUNCTIONS ---

const isImageFile = (file: File | null) => file && file.type.startsWith('image/');
const isPDFFile = (file: File | null) => file && file.type === 'application/pdf';

/**
 * Converte um objeto File para uma string Base64 (APENAS o payload).
 * @param file O objeto File a ser convertido.
 * @returns Uma Promise que resolve para a string Base64 PURA (sem o prefixo Data URI).
 */
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file); 
        reader.onload = () => {
            const dataUrl = reader.result as string;
            // Remove o prefixo Data URI (ex: "data:image/png;base64,")
            const base64Payload = dataUrl.split(',')[1]; 
            resolve(base64Payload); 
        };
        reader.onerror = error => reject(error);
    });
};

/**
 * Obtém a data atual no formato YYYY-MM-DD
 */
const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Obtém o uso de mensagens do localStorage
 */
const getMessageUsageFromStorage = (): MessageUsageData => {
  const stored = localStorage.getItem('doutor_ia_message_usage');
  if (stored) {
    const data: MessageUsageData = JSON.parse(stored);
    // Verifica se os dados são do dia atual
    if (data.date === getCurrentDate()) {
      return data;
    }
  }
  // Retorna dados padrão se não houver dados ou se for de outro dia
  return { count: 0, date: getCurrentDate() };
};

/**
 * Salva o uso de mensagens no localStorage
 */
const saveMessageUsageToStorage = (count: number): void => {
  const data: MessageUsageData = {
    count,
    date: getCurrentDate()
  };
  localStorage.setItem('doutor_ia_message_usage', JSON.stringify(data));
};

/**
 * Incrementa o contador de mensagens no localStorage
 */
const incrementMessageUsage = (): number => {
  const currentUsage = getMessageUsageFromStorage();
  const newCount = currentUsage.count + 1;
  saveMessageUsageToStorage(newCount);
  return newCount;
};

/**
 * Verifica se o usuário pode usar o recurso baseado no limite diário
 */
const canUseDoutorIA = (): boolean => {
  const currentUsage = getMessageUsageFromStorage();
  return currentUsage.count < 3;
};

/**
 * Obtém o número de mensagens restantes
 */
const getRemainingMessages = (): number => {
  const currentUsage = getMessageUsageFromStorage();
  return Math.max(0, 3 - currentUsage.count);
};

// --- COMPONENT START ---

export const DoutorIAPage = ({
  user,
  onUpgrade,
  isPremium = false
}: DoutorIAPageProps = {}) => {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [isArticleMode, setIsArticleMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); 
  const [messages, setMessages] = useState([{
    id: 1,
    type: "ai",
    content: "Olá! Sou seu assistente de estudos médicos especializado. Escolha uma matéria (opcional) e faça sua pergunta!",
    timestamp: new Date()
  }]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messageUsage, setMessageUsage] = useState<MessageUsageData>({ count: 0, date: getCurrentDate() });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const {
    canUseFeature,
    getRemainingUsage,
    incrementUsage,
    subscription
  } = useSubscription(user);
  
  const subjects = ["Anatomia", "Fisiologia", "Patologia", "Farmacologia", "Clínica Médica", "Cardiologia", "Pneumologia", "Neurologia", "Infectologia", "Endocrinologia", "Cirurgia", "Pediatria"];
  const sampleQuestions = ["Me explique sobre este assunto de forma simples", "Quais são os principais tópicos que devo estudar?", "Como responder questões de prova sobre este tema?"];
  
  // Carrega o uso de mensagens do localStorage na inicialização
  useEffect(() => {
    const usage = getMessageUsageFromStorage();
    setMessageUsage(usage);
  }, []);

  const scrollToBottom = () => {
    const scrollArea = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (scrollArea) {
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  };

  useEffect(() => {
    // Garante que o body não tenha scroll quando em Fullscreen
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isFullscreen]);
  
  const handleSendMessage = async () => {
    // 1. DEFINE CENÁRIOS E VALIDAÇÕES INICIAIS
    // Cenário Doutor IA com Imagem: Requer Imagem + Texto. Matéria opcional.
    const isDoutorWithImage = !isArticleMode && isImageFile(selectedFile) && inputMessage.trim(); 
    // Cenário Análise de Artigo com PDF: Requer PDF. Texto opcional (para o backend).
    const isArticleWithPDF = isArticleMode && isPDFFile(selectedFile);
    // Cenário Chat Doutor IA com PDF: Requer PDF + Texto. Matéria opcional.
    const isDoutorWithPDF = !isArticleMode && isPDFFile(selectedFile) && inputMessage.trim();
    
    // Indica se algum upload de arquivo está envolvido
    const isFileUploadScenario = isArticleWithPDF || isDoutorWithImage || isDoutorWithPDF;
    
    // Validação principal de texto: Requer texto, EXCETO no cenário de Análise de PDF, onde o PDF é o foco.
    if (!isFileUploadScenario && !inputMessage.trim()) {
        toast.error("Por favor, digite sua pergunta.");
        return;
    }

    // Validação de texto para cenários de imagem/chat com PDF
    if ((isDoutorWithImage || isDoutorWithPDF) && !inputMessage.trim()) {
        if (isDoutorWithImage) toast.error("É obrigatório digitar o texto da pergunta ao enviar uma imagem.");
        if (isDoutorWithPDF) toast.error("É obrigatório digitar o texto da pergunta ao enviar um PDF no modo chat.");
        return;
    }
    
    // Bloqueia se a imagem estiver selecionada, mas o texto não foi digitado
    if (isImageFile(selectedFile) && !isDoutorWithImage) {
        toast.error("É obrigatório digitar sua pergunta para analisar a imagem.");
        return;
    }
    
    // Bloqueia se o PDF estiver selecionado no modo chat, mas o texto não foi digitado
    if (isPDFFile(selectedFile) && !isArticleMode && !isDoutorWithPDF) {
        toast.error("É obrigatório digitar sua pergunta para usar o PDF como material de estudo no modo chat.");
        return;
    }

    // VERIFICAÇÃO DE USO - usa a prop isPremium recebida do pai
    if (!isPremium && !canUseDoutorIA()) {
      toast.error("Você atingiu o limite de 3 mensagens por dia. Faça upgrade para Premium para mensagens ilimitadas.");
      return;
    }

    // 2. PREPARA MENSAGEM DO USUÁRIO
    const userMessageContent = inputMessage.trim() || (isArticleWithPDF ? `Analisar artigo: ${selectedFile!.name}` : `Pergunta sobre arquivo: ${selectedFile!.name}`);

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      content: userMessageContent,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);
    setTimeout(() => scrollToBottom(), 100);

    let apiUrl = '';
    let requestBody: any = {}; 
    let cleanupFile = false;
    let successfulUploadName = '';
    let isArticleCompletion = isArticleMode; 

    // Garante que o valor da matéria seja a string vazia se não for selecionado.
    const materyToSend = selectedSubject || '';

    try {
      // 3. CONFIGURA REQUISIÇÃO
      if (isDoutorWithImage) {
        // Cenário 1: Chat Doutor IA com Imagem (JSON com Base64)
        apiUrl = 'http://localhost:3000/api/doutor-with-image';
        
        const imageBase64Pure = await fileToBase64(selectedFile!); // Base64 PURO
        
        requestBody = {
            matery: materyToSend, // Agora envia "" se não selecionado
            imageBase64: imageBase64Pure, // Base64 PURO
            imageMimeType: selectedFile!.type, // Adiciona o MIME type para o backend reconstruir
            text: userMessageContent
        };
        cleanupFile = true;
        successfulUploadName = selectedFile!.name;
        
      } else if (isArticleWithPDF) {
        // Cenário 2: Análise de Artigo com PDF (FormData)
        apiUrl = 'http://localhost:3000/api/article-with-pdf';
        
        const formData = new FormData();
        formData.append('pdfFile', selectedFile!); 

        requestBody = formData;
        cleanupFile = true;
        successfulUploadName = selectedFile!.name;
        
      } else if (isDoutorWithPDF) { 
        // Cenário 3: Chat Doutor IA com PDF (FormData)
        apiUrl = 'http://localhost:3000/api/doutor-with-pdf';
        
        // LÓGICA DE HISTÓRICO PARA CHAT COM PDF
        const historyMessages: ChatMessage[] = messages
            .filter(msg => msg.id > 1) 
            .map(msg => ({
                role: msg.type === "ai" ? "assistant" : "user",
                content: msg.content
            }))
            .slice(-10); 
            
        const formData = new FormData();
        formData.append('matery', materyToSend);
        formData.append('text', userMessageContent);
        formData.append('file', selectedFile!); 
        formData.append('history', JSON.stringify(historyMessages));

        requestBody = formData;
        cleanupFile = true;
        successfulUploadName = selectedFile!.name;
        
      } else if (isArticleMode && !selectedFile) {
        // Cenário 4: Análise de Artigo por Texto (JSON)
        apiUrl = 'http://localhost:3000/api/article-with-text';
        requestBody = {
            text: userMessageContent
        };

      } else { // isChatStandard
        // Cenário 5: Chat Doutor IA padrão (JSON)
        apiUrl = 'http://localhost:3000/api/doutor-with-text';
        
        // LÓGICA DE HISTÓRICO DE MENSAGENS
        const historyMessages: ChatMessage[] = messages
            .filter(msg => msg.id > 1) 
            .map(msg => ({
                role: msg.type === "ai" ? "assistant" : "user",
                content: msg.content
            }))
            .slice(-10); 
            
        requestBody = {
            matery: materyToSend, 
            text: userMessageContent,
            history: historyMessages,
        };
      }
      
      // 4. CHAMADA À API
      const response = await axios.post(apiUrl, requestBody, {
        headers: isFileUploadScenario ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' }
      });

      const aiResponseContent = response.data.answer || response.data;

      const aiResponse = {
        id: messages.length + 2,
        type: "ai",
        content: aiResponseContent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      // Só incrementa o uso se não for premium
      if (!isPremium) {
        const newCount = incrementMessageUsage();
        setMessageUsage({ count: newCount, date: getCurrentDate() });
      }
      
      // 5. LIMPEZA E FEEDBACK
      if (cleanupFile) {
          toast.success(`${isImageFile(selectedFile) ? 'Imagem' : (isPDFFile(selectedFile) ? 'PDF' : 'Arquivo')} "${successfulUploadName}" enviado com sucesso!`);
          setSelectedFile(null); 
          setInputMessage("");
      }
      
      // Sai do modo Artigo se aplicável
      if (isArticleCompletion) {
        setIsArticleMode(false);
        setTimeout(() => {
             setMessages(prev => [...prev, {
                id: prev.length + 1,
                type: "ai",
                content: "Análise concluída. Você está de volta ao modo de Chat. Você pode selecionar uma matéria (opcional) ou clicar em 'Artigo Científico' novamente.",
                timestamp: new Date()
            }]);
            scrollToBottom();
        }, 500);
      }
      
    } catch (error) {
      console.error("Erro ao comunicar com a IA:", error);
      toast.error("Falha ao obter resposta da IA. Tente novamente.");

      // Remove a mensagem do usuário se a requisição falhou
      if (isFileUploadScenario || inputMessage.trim()) {
          setMessages(prev => prev.slice(0, -1)); 
      }
      
      const errorMessage = {
        id: messages.length + 2,
        type: "ai",
        content: "**[ERRO]** Não foi possível conectar ao assistente IA. Por favor, tente novamente mais tarde.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);

    } finally {
      setIsTyping(false);
      setTimeout(() => scrollToBottom(), 100);
    }
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (isPDFFile(file)) {
            setSelectedFile(file);
            
            if (isArticleMode) {
                toast.success(`PDF "${file.name}" selecionado para análise de artigo.`);
            } else {
                toast.success(`PDF "${file.name}" selecionado. Complete a pergunta e envie.`); 
            }

        } else if (isImageFile(file)) {
             if (isArticleMode) {
                 setSelectedFile(null);
                 toast.error("Apenas PDFs são aceitos para análise de artigo.");
             } else {
                 setSelectedFile(file);
                 toast.success(`Imagem "${file.name}" selecionada. Digite sua pergunta sobre ela e envie.`);
             }
        } else {
            setSelectedFile(null);
            toast.error(isArticleMode 
                ? "Apenas PDFs são permitidos no modo Análise de Artigo."
                : "Tipo de arquivo não permitido. Apenas PDFs ou Imagens são aceitos."
            );
        }
        
        e.target.value = ''; 
    }
  };
  
  const handleFileUpload = (type: 'file' | 'image') => {
    if (fileInputRef.current) {
      if (type === 'file') {
        fileInputRef.current.accept = 'application/pdf';
        fileInputRef.current.click();
      } else if (type === 'image') {
        if (isArticleMode) {
          toast.error("Imagens não são permitidas no modo Análise de Artigo. Apenas PDFs.");
          return;
        }
        fileInputRef.current.accept = 'image/*';
        fileInputRef.current.click();
      }
    }
  };
  
  const handleSampleQuestion = (question: string) => {
    setInputMessage(question);
  };
  
  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setIsArticleMode(false);
    setSelectedFile(null); 
  };
  
  const handleArticleClick = () => {
    const articleMessage = {
      id: messages.length + 1,
      type: "user",
      content: "Quero analisar um artigo científico",
      timestamp: new Date()
    };
    const aiResponse = {
      id: messages.length + 2,
      type: "ai",
      content: "Por favor, envie o artigo científico que você gostaria que eu analise. Você pode fazer upload do arquivo (PDF) ou colar o texto/link do artigo. Estou pronto para analisar:\n\n• Metodologia\n• Resultados\n• Conclusões\n• Relevância clínica\n• Pontos importantes para seus estudos",
      timestamp: new Date()
    };
    
    setSelectedSubject(""); 
    setIsArticleMode(true); 
    setSelectedFile(null); 
    
    setMessages(prev => [...prev, articleMessage, aiResponse]);
    setTimeout(() => scrollToBottom(), 100);
  };
  
  const handleClinicalCaseClick = () => {
    const event = new CustomEvent('navigate-to-casoteca');
    window.dispatchEvent(event);
  };
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  const remainingMessages = getRemainingMessages();
  const canUse = canUseDoutorIA();
  
  const isArticleWithPDFSelected = isArticleMode && isPDFFile(selectedFile);
  const isImageSelected = isImageFile(selectedFile) && !isArticleMode;
  const isPDFSelectedInChat = isPDFFile(selectedFile) && !isArticleMode;

  const inputPlaceholder = isArticleMode 
    ? (isArticleWithPDFSelected ? `Aperte Enviar para analisar o PDF "${selectedFile!.name}"` : "Cole o texto do artigo científico aqui (ou envie o arquivo por upload)...")
    : (isImageSelected 
      ? `Faça sua pergunta sobre a imagem em ${selectedSubject || 'qualquer matéria'} (obrigatório o texto)...` 
      : (isPDFSelectedInChat
        ? `Pergunte sobre o PDF em ${selectedSubject || 'qualquer matéria'}...` 
        : (selectedSubject ? `Pergunte sobre ${selectedSubject}...` : "Digite sua mensagem (seleção de matéria opcional)..."))); 

  const isSendButtonDisabled = isTyping 
    || (!inputMessage.trim() && !isArticleWithPDFSelected) 
    || (isImageSelected && !inputMessage.trim())
    || (isPDFSelectedInChat && !inputMessage.trim());

  const content = <div className={`relative ${isFullscreen ? 'h-screen w-screen' : 'min-h-screen'}`}>
      {/* Usage Banner - Só exibe se não for premium */}
      {!isPremium && (
        <UsageBanner 
          featureType="mensagens" 
          remaining={remainingMessages} 
          total={3} 
          resetPeriod="diariamente" 
          onUpgrade={() => onUpgrade?.()} 
          isPremium={isPremium} 
        />
      )}
      
      <div className="dashboard-container py-6 h-full">
        <div className={`mx-auto px-4 sm:px-6 ${isFullscreen ? 'max-w-full h-full flex flex-col' : 'max-w-4xl'}`}>

          {/* Título principal - Ocultar em tela cheia para economizar espaço */}
          {!isFullscreen && (
            <div className="text-center mb-6 mt-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-3xl"></div>
                <div className="relative">
                  <h1 className="font-bold glow-text mb-4 text-4xl">Novo Chat com IA</h1>
                  <p className="text-muted-foreground text-lg mb-8">Escolha uma matéria (opcional) para iniciar seu chat</p>
                </div>
              </div>
              <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto rounded-full mt-6"></div>
            </div>
          )}

          {/* Campo de seleção de matéria - Exibe somente no modo Doutor IA, Ocultar em tela cheia para maximizar o chat */}
          {!isArticleMode && !isFullscreen && (
            <div className="mb-8">
              <div className="relative futuristic-card p-2 rounded-2xl border-[1.5px]">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-primary w-6 h-6 z-10" />
                <Select value={selectedSubject} onValueChange={handleSubjectSelect}>
                  <SelectTrigger className="w-full h-16 pl-16 pr-6 bg-transparent border-0 text-lg text-foreground hover:bg-primary/5 focus:bg-primary/10 transition-colors rounded-3xl">
                    <SelectValue placeholder="Selecione uma matéria (opcional)" className="text-muted-foreground" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-primary/20 bg-card/95 backdrop-blur-sm">
                    {subjects.map(subject => <SelectItem key={subject} value={subject} className="hover:bg-primary/10 focus:bg-primary/15 rounded-xl">
                        {subject}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          {/* Chat Interface - Central e responsiva */}
          <div className={`futuristic-card rounded-2xl border-[1.5px] overflow-hidden transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-background border-0 flex flex-col' : 'flex flex-col h-[65vh] md:h-[70vh] lg:h-[75vh]'}`}>
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 sm:p-6 border-b border-primary/20 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                   <div className="glow-icon w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                     <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                   </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">{isArticleMode ? 'Análise de Artigo' : 'Comece sua consulta'}</h2>
                    {/* Exibe 'Geral' ou o nome da matéria */}
                    {!isArticleMode && <p className="text-muted-foreground text-xs sm:text-sm">Matéria Selecionada: **{selectedSubject || 'Geral'}**</p>} 
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={toggleFullscreen} className={`h-8 w-8 sm:h-10 sm:w-10 rounded-xl transition-colors ${isFullscreen ? '' : 'hover:bg-primary/20'}`}>
                  {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />}
                </Button>
              </div>
            </div>

            {/* Content Area - Messages/Samples */}
            <div className={`border-t border-primary/20 flex-1 flex flex-col min-h-0`}>
              {messages.length === 1 && !isArticleMode ? (
                /* Sample Questions */
                <div className={`flex-1 overflow-auto p-4 sm:p-6`}>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Sugestões de perguntas:</h3>
                  <div className="grid gap-3">
                    {sampleQuestions.map((question, index) => (
                      <Button 
                        key={index} 
                        variant="outline" 
                        onClick={() => handleSampleQuestion(question)} 
                        className="justify-start text-left h-auto p-4 rounded-xl border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-sm"
                      >
                        <span>{question}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Messages */
                <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 sm:p-6">
                  <div className="space-y-4">
                    {messages.map(message => (
                      <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] ${message.type === "user" ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md" : "bg-muted text-foreground rounded-2xl rounded-bl-md"} px-4 py-3 shadow-sm`}>
                          <div className="flex items-start space-x-2">
                            {message.type === "ai" && (
                              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <Brain className="w-3 h-3 text-primary-foreground" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                              <span className="text-xs opacity-70 mt-2 block">
                                {message.timestamp.toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            {message.type === "user" && (
                              <div className="w-6 h-6 bg-muted-foreground rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <User className="w-3 h-3 text-background" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <Brain className="w-3 h-3 text-primary-foreground" />
                            </div>
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{
                                animationDelay: '0.1s'
                              }}></div>
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{
                                animationDelay: '0.2s'
                              }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Input Area */}
            <div className={`p-4 sm:p-6 border-t border-primary/20 bg-gradient-to-r from-background/50 to-primary/5 flex-shrink-0`}>
              
              {/* Indicador de arquivo selecionado */}
              {selectedFile && (
                <div className="mb-3 flex items-center justify-between p-3 border border-primary/20 rounded-xl bg-primary/5 text-sm">
                  <span className="flex items-center space-x-2 truncate">
                    {(isPDFFile(selectedFile) || isArticleMode) ? <FileText className="w-4 h-4 text-primary flex-shrink-0" /> : <Camera className="w-4 h-4 text-primary flex-shrink-0" />}
                    <span className="font-medium text-foreground truncate">{selectedFile.name}</span>
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Input principal e botões */}
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <Textarea 
                    value={inputMessage} 
                    onChange={e => setInputMessage(e.target.value)} 
                    placeholder={inputPlaceholder} 
                    className="h-full resize-none border-primary/20 focus:border-primary/40 rounded-2xl p-3 sm:p-4 text-sm sm:text-base" 
                    rows={1}
                    onInput={(e) => {
                      const target = e.currentTarget;
                      target.style.height = 'auto';
                      target.style.height = `${target.scrollHeight}px`;
                    }}
                    onKeyPress={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }} 
                    disabled={isTyping || isArticleWithPDFSelected}
                  />
                </div>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isSendButtonDisabled} 
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex-shrink-0" 
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
                
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl border-[1.5px] flex-shrink-0">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="end" className="rounded-xl border-primary/20 bg-background border z-50">
                    <DropdownMenuItem onClick={() => handleFileUpload('file')} className={`rounded-lg ${isFullscreen ? '' : 'hover:bg-primary/10 focus:bg-primary/15'}`}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload PDF
                    </DropdownMenuItem>
                    {/* Opção Imagem visível apenas fora do modo Artigo Científico */}
                    {!isArticleMode && (
                        <DropdownMenuItem onClick={() => handleFileUpload('image')} className={`rounded-lg ${isFullscreen ? '' : 'hover:bg-primary/10 focus:bg-primary/15'}`}>
                          <Camera className="w-4 h-4 mr-2" />
                          Imagem
                        </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Hidden file input */}
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInputChange} />
            </div>
          </div>

          {/* Botões de ação principais - Visíveis apenas fora de tela cheia */}
          {!isFullscreen && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div onClick={handleArticleClick} className="futuristic-card p-6 rounded-2xl border-[1.5px] hover:border-primary/40 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Search className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">Artigo Científico</h3>
                    <p className="text-muted-foreground text-sm">Analise artigos científicos com IA</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              
              <div onClick={handleClinicalCaseClick} className="futuristic-card p-6 rounded-2xl border-[1.5px] hover:border-primary/40 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">Caso Clínico</h3>
                    <p className="text-muted-foreground text-sm">Gere casos clínicos para estudo</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          )}

          {/* Footer informativo - Visível apenas fora de tela cheia */}
          {!isFullscreen && (
            <div className="mt-12 md:mt-20 text-center">
              <div className="futuristic-card p-4 sm:p-6 inline-block rounded-2xl border-[1.5px]">
                <p className="text-muted-foreground flex items-center space-x-2 text-sm sm:text-base justify-center">
                  <span className="text-primary text-xl">💡</span>
                  <span>Dica: A seleção de matéria é opcional, mas ajuda a focar a resposta da IA.</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>;

  // VERIFICAÇÃO DE USO - usa a prop isPremium recebida do pai
  if (!isPremium && !canUse) {
    return (
      <div className="dashboard-container py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6 mt-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-3xl"></div>
              <div className="relative">
                <h1 className="font-bold glow-text mb-4 text-4xl">Novo Chat com IA</h1>
                <p className="text-muted-foreground text-lg mb-8">Escolha uma matéria (opcional) para iniciar seu chat</p>
              </div>
            </div>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto rounded-full mt-6"></div>
          </div>

          <FeatureBlocker 
            title="Limite Diário Atingido"
            description="Você atingiu o limite de 3 mensagens por dia no plano grátis. Assine o Premium para mensagens ilimitadas!"
            onUpgrade={() => onUpgrade?.()}
          >
            {content}
          </FeatureBlocker>
        </div>
      </div>
    );
  }

  return content;
};