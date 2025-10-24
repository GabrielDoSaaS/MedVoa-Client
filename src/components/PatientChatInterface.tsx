import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea"; 
import { User, Bot, Send, ArrowLeft, Award } from "lucide-react";
 import axios from 'axios'; 

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'patient' | 'professor';
  timestamp: Date;
}

// Interface para o retorno da API doneCasoteca
interface AssessmentResponse {
  isDiagnosisCorrect: 'Sim' | 'Não' | string;
  description: string;
}

interface PatientChatProps {
  caseData: any;
  selectedLevel: string;
  selectedSpecialty: string;
  codeChat: string; 
  onBack: () => void;
}

export const PatientChatInterface = ({
  caseData,
  selectedLevel,
  selectedSpecialty,
  codeChat, 
  onBack
}: PatientChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [chatPhase, setChatPhase] = useState<'intro' | 'conversation' | 'solved' | 'assessment'>('intro');
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [waitingForDiagnosis, setWaitingForDiagnosis] = useState(false);
  const [isPatientTyping, setIsPatientTyping] = useState(false); 
  const [isProfessorAssessing, setIsProfessorAssessing] = useState(false); 
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize chat with patient introduction
  useEffect(() => {
    const introMessage: Message = {
      id: '1',
      text: `Olá doutor(a), eu sou ${caseData.patient.name || 'o paciente'}. ${caseData.patient.complaint} Estou aqui porque preciso de ajuda. O que gostaria de saber sobre meu caso?`,
      sender: 'patient',
      timestamp: new Date()
    };
    setMessages([introMessage]);
    setChatPhase('conversation');
  }, [caseData]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isPatientTyping, isProfessorAssessing]); 

  const sendMessage = async (message: string): Promise<string> => {
    try {
      setIsPatientTyping(true); 
      const response = await axios.post('http://localhost:3000/api/send-message-casoteca', JSON.stringify({
        codeChat, 
        message
      }), 
      {
        headers: {"Content-Type": "application/json"}
      });
      setIsPatientTyping(false); 
      return response.data.reply; 
    } catch (error) {
      console.error("Erro ao enviar mensagem para casoteca:", error);
      setIsPatientTyping(false);
      return "Desculpe, não consegui processar sua pergunta agora. Tente novamente.";
    }
  }

  // FUNÇÃO ATUALIZADA: Retorna o objeto JSON da avaliação
  const doneCasoteca = async (diagnosis: string): Promise<AssessmentResponse> => {
     try {
      setIsProfessorAssessing(true); 
      const response = await axios.post('http://localhost:3000/api/doneCasoteca', JSON.stringify({
        diagnosis, 
        codeChat
      }), 
      {
        headers: {"Content-Type": "application/json"}
      });
      setIsProfessorAssessing(false);
      
      // O retorno agora é um objeto { isDiagnosisCorrect: 'Sim'/'Não', description: 'texto longo' }
      return response.data as AssessmentResponse;
      
    } catch (error) {
      console.error("Erro ao finalizar o caso e receber avaliação:", error);
      setIsProfessorAssessing(false);
      // Retorna um objeto de erro para ser tratado em handleSendMessage
      return { isDiagnosisCorrect: 'Erro', description: "Não foi possível conectar com o servidor de avaliação." };
    }
  }


  const handleSendMessage = async () => { 
    if (!inputMessage.trim() || isPatientTyping || isProfessorAssessing) return;
    if (chatPhase === 'assessment') return;

    const userMessageText = inputMessage;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userMessageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage(""); 

    if (chatPhase === 'solved' && waitingForDiagnosis) {
      // **LÓGICA PARA ENVIAR O DIAGNÓSTICO FINAL E RECEBER A AVALIAÇÃO**
      setWaitingForDiagnosis(false); 
      
      // 1. Chamar a nova função doneCasoteca e obter o objeto de avaliação
      const assessment = await doneCasoteca(userMessageText);

      let professorAssessmentText = "";
      
      // 2. Processar o resultado e construir a mensagem do professor
      if (assessment.isDiagnosisCorrect === 'Sim' || assessment.isDiagnosisCorrect === 'Sim.') {
        professorAssessmentText = `🎉 **Parabéns, Médico(a)! Você acertou o diagnóstico!**\n\n${assessment.description}`;
      } else if (assessment.isDiagnosisCorrect === 'Não' || assessment.isDiagnosisCorrect === 'Não.') {
        // Usamos o diagnosis da prop do componente anterior como fallback para exibir o correto
        const correctDiagnosis = caseData.diagnosis || 'O diagnóstico correto não foi revelado pela simulação.';
        professorAssessmentText = `❌ **Você errou o diagnóstico.** O diagnóstico correto era: ${correctDiagnosis}.\n\n${assessment.description}`;
      } else {
        // Caso de erro na API
        professorAssessmentText = `🚨 **Erro na Avaliação:** ${assessment.description}`;
      }


      const professorResponse: Message = {
        id: (Date.now() + 1).toString(),
        // O Markdown será exibido como texto simples, mas ajuda a destacar visualmente a resposta
        text: professorAssessmentText, 
        sender: 'professor',
        timestamp: new Date()
      };
      
      // 3. Adicionar a resposta de avaliação do professor ao chat
      setMessages(prev => [...prev, professorResponse]);
      
      // 4. Mudar a fase para 'assessment'
      setChatPhase('assessment');

    } else if (chatPhase === 'conversation') {
      // Conversa com o paciente (chamada à API)
      setQuestionsAsked(prev => prev + 1);
      
      // Chamada à API para obter a resposta do paciente
      const patientReply = await sendMessage(userMessageText);
      
      const patientResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: patientReply,
        sender: 'patient',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, patientResponse]);
    }
    
  };

  const handleCaseSolved = () => {
    setChatPhase('solved');
    setWaitingForDiagnosis(true);
    
    const professorMessage: Message = {
      id: Date.now().toString(),
      text: `Olá! Sou o professor responsável por este caso clínico. 

Vejo que você finalizou a investigação com o paciente. Agora preciso que você me informe:

**Qual é o seu diagnóstico para este caso?**

Por favor, escreva sua resposta de forma clara e objetiva e aperte Enviar. Vou analisar sua resposta e fornecer o feedback completo com a explicação do caso e sua avaliação.`,
      sender: 'professor',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, professorMessage]);
  };

  const finishAssessment = () => {
    const assessmentMessage: Message = {
      id: (Date.now() + 2).toString(),
      text: `Obrigado pela consulta, doutor(a)! Espero que a avaliação do professor tenha sido útil. Clique em Voltar para gerar um novo caso.`,
      sender: 'patient',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assessmentMessage]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
                <Bot className="w-5 h-5 text-primary" />
                <span className="truncate">Simulação de Paciente - {caseData.title}</span>
              </CardTitle>
              <CardDescription>
                <span className="text-sm md:text-base">{selectedSpecialty} - Nível: {selectedLevel}</span>
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onBack} className="flex-shrink-0">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Interface */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg">Consulta Virtual</CardTitle>
            <div className="flex items-center space-x-4 flex-wrap gap-2">
              <Badge variant="secondary">
                Perguntas: {questionsAsked}
              </Badge>
              {(isPatientTyping || isProfessorAssessing) && ( 
                <Badge className="bg-yellow-100 text-yellow-800 animate-pulse">
                  {(isPatientTyping && 'Paciente digitando...') || (isProfessorAssessing && 'Professor avaliando...')}
                </Badge>
              )}
              {chatPhase === 'assessment' && (
                <Badge className="bg-green-100 text-green-800">
                  <Award className="w-4 h-4 mr-1" />
                  Avaliação Concluída
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Messages */}
          <ScrollArea ref={scrollAreaRef} className="h-96 w-full rounded-md border p-4 mb-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex items-start space-x-2 max-w-[90%] sm:max-w-[80%] ${
                      message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                     <div
                       className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                         message.sender === 'user'
                           ? 'bg-primary text-primary-foreground'
                           : message.sender === 'professor'
                           ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                           : 'bg-secondary text-secondary-foreground'
                       }`}
                     >
                       {message.sender === 'user' ? (
                         <User className="w-4 h-4" />
                       ) : message.sender === 'professor' ? (
                         <Award className="w-4 h-4" />
                       ) : (
                         <Bot className="w-4 h-4" />
                       )}
                     </div>
                    <div
                      className={`p-3 rounded-lg whitespace-pre-line break-words ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : message.sender === 'professor'
                          ? 'bg-blue-100 text-blue-900 border border-blue-300' 
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {/* Indicador de digitação */}
              {(isPatientTyping || isProfessorAssessing) && (
                <div className={`flex justify-start`}>
                  <div className={`flex items-start space-x-2 max-w-[80%]`}>
                    <div
                       className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isProfessorAssessing ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'bg-secondary text-secondary-foreground'}`}
                     >
                       {isProfessorAssessing ? <Award className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                     </div>
                    <div className={`p-3 rounded-lg bg-muted`}>
                      <span className="text-sm italic text-gray-500">...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <Separator className="my-4" />

          {/* Input Area */}
          {chatPhase !== 'assessment' ? (
            // Flex container principal:
            // - Em telas pequenas (padrão): coluna, com espaço vertical (space-y-2)
            // - Em telas médias (sm:): linha, com espaço horizontal (sm:space-x-2) e sem espaço vertical (sm:space-y-0)
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 items-end"> 
              
              {/* Container para o Textarea e o botão Enviar:
              // - Em telas pequenas: linha, ocupando 100% da largura (w-full)
              // - Em telas médias: linha, ocupando o espaço restante (sm:flex-1)
              */}
              <div className="flex w-full sm:flex-1 space-x-2 items-end">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    chatPhase === 'solved' 
                      ? "Informe seu diagnóstico para o professor..." 
                      : "Faça uma pergunta ao paciente..."
                  }
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
                  // flex-1 aqui garante que o Textarea ocupe o espaço dentro do seu container
                  className="flex-1 resize-none min-h-[40px] max-h-40 p-3 text-sm overflow-y-auto" 
                  disabled={isPatientTyping || isProfessorAssessing} 
                />
                <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isPatientTyping || isProfessorAssessing} className="h-10 flex-shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Botão Caso Solucionado: 
              // - w-full garante 100% da largura em telas pequenas
              // - sm:w-auto faz com que ele se ajuste em telas médias/grandes
              */}
              {chatPhase === 'conversation' && (
                <Button 
                  onClick={handleCaseSolved}
                  variant="glow"
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 h-10 w-full sm:w-auto flex-shrink-0"
                  disabled={isPatientTyping || isProfessorAssessing}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Caso Solucionado
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">Avaliação Concluída!</h3>
              <p className="text-muted-foreground">
                Role para cima para ler o feedback completo do professor.
              </p>
              <Button onClick={onBack} variant="outline" className="text-white">
                 <ArrowLeft className="w-4 h-4 mr-2" />
                Gerar Novo Caso
              </Button>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
            <h4 className="font-bold text-base mb-3 text-primary">Como proceder:</h4>
            {/* Responsividade aprimorada para dispositivos móveis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="bg-card/50 p-3 rounded-lg border-l-4 border-primary">
                <span className="font-bold text-lg text-primary mb-1 block">1.</span>
                <p className="font-medium text-sm mb-1">Investigação:</p>
                <ul className="text-xs space-y-1">
                  <li>• Faça perguntas ao paciente</li>
                  <li>• Investigue sintomas e história</li>
                </ul>
              </div>
              
              <div className="bg-card/50 p-3 rounded-lg border-l-4 border-primary">
                <span className="font-bold text-lg text-primary mb-1 block">2.</span>
                <p className="font-medium text-sm mb-1">Diagnóstico:</p>
                <ul className="text-xs space-y-1">
                  <li>• Chegue ao diagnóstico correto</li>
                  <li>• Clique em "Caso Solucionado"</li>
                </ul>
              </div>
              
              <div className="bg-card/50 p-3 rounded-lg border-l-4 border-primary">
                <span className="font-bold text-lg text-primary mb-1 block">3.</span>
                <p className="font-medium text-sm mb-1">Avaliação:</p>
                <ul className="text-xs space-y-1">
                  <li>• Receba feedback completo</li>
                  <li>• Sua nota é baseada na sua performance</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};