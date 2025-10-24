import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Settings, Brain, User, Lightbulb, Clock } from "lucide-react";

export const ChatInterface = () => {
  const [messages, setMessages] = useState([{
    id: 1,
    type: "ai",
    content: "Olá! Sou seu assistente de estudos médicos especializado. Faça sua pergunta sobre medicina e terei prazer em ajudá-lo!",
    subject: null,
    timestamp: new Date()
  }]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const subjects = ["Anatomia", "Fisiologia", "Patologia", "Farmacologia", "Clínica Médica", "Cardiologia", "Pneumologia", "Neurologia", "Infectologia", "Endocrinologia", "Cirurgia", "Pediatria"];
  
  // Perguntas sugeridas baseadas na matéria selecionada
  const subjectQuestions = {
    "Cardiologia": [
      "Explique o ciclo cardíaco detalhadamente",
      "Quais são os critérios para diagnóstico de IAM?",
      "Como interpretar um ECG normal?",
      "Diferenças entre insuficiência cardíaca sistólica e diastólica"
    ],
    "Neurologia": [
      "Como avaliar um paciente com cefaleia?",
      "Sinais neurológicos de hipertensão intracraniana",
      "Diferenças entre AVC isquêmico e hemorrágico",
      "Como fazer o exame neurológico básico?"
    ],
    "Pneumologia": [
      "Como interpretar uma gasometria arterial?",
      "Sinais radiológicos de pneumonia",
      "Diferenças entre asma e DPOC",
      "Manejo inicial do derrame pleural"
    ],
    "default": [
      "Explique o ciclo cardíaco detalhadamente", 
      "Quais são os sintomas e tratamento da diabetes tipo 2?", 
      "Como funciona a filtração glomerular?", 
      "Diferenças entre artérias e veias"
    ]
  };

  const getSampleQuestions = () => {
    return subjectQuestions[selectedSubject as keyof typeof subjectQuestions] || subjectQuestions.default;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateDetailedResponse = (question: string, subject: string) => {
    // Respostas médicas mais detalhadas e precisas baseadas na pergunta
    const medicalResponses = {
      "ciclo cardíaco": `**Ciclo Cardíaco - Explicação Completa:**

O ciclo cardíaco compreende todos os eventos que ocorrem durante um batimento cardíaco, dividido em duas fases principais:

**1. DIÁSTOLE (Relaxamento - 0,5s):**
- **Diástole Ventricular Inicial:** Válvulas AV fechadas, ventrículos relaxam
- **Enchimento Ventricular:** Válvulas AV se abrem, sangue flui dos átrios para ventrículos
- **Sístole Atrial:** Contração atrial completa o enchimento ventricular (contribui 20-30% do volume)

**2. SÍSTOLE (Contração - 0,3s):**
- **Contração Isovolumétrica:** Válvulas AV e semilunares fechadas, pressão aumenta
- **Ejeção Ventricular:** Válvulas semilunares se abrem, sangue é ejetado

**Eventos Sonoros:**
- **B1 (TUM):** Fechamento das válvulas AV (tricúspide e mitral)
- **B2 (TÁ):** Fechamento das válvulas semilunares (pulmonar e aórtica)

**Volumes Importantes:**
- Volume Diastólico Final: ~120-130ml
- Volume Sistólico Final: ~50ml  
- Volume Sistólico (Ejeção): ~70ml
- Fração de Ejeção: ~55-70%

**Regulação:**
- Sistema nervoso autônomo
- Mecanismo de Frank-Starling
- Contratilidade miocárdica`,

      "diabetes": `**Diabetes Mellitus Tipo 2 - Abordagem Clínica:**

**FISIOPATOLOGIA:**
Resistência insulínica + disfunção das células β pancreáticas = hiperglicemia crônica

**SINTOMAS CLÁSSICOS (Polidipsia, Poliúria, Polifagia):**
- **Polidipsia:** Sede excessiva (>3L/dia)
- **Poliúria:** Diurese >3L/dia (glicosúria osmótica)
- **Polifagia:** Fome aumentada (catabolismo)
- **Perda de peso:** Apesar da polifagia
- **Fadiga:** Deficiência energética celular

**CRITÉRIOS DIAGNÓSTICOS:**
- Glicemia jejum ≥126 mg/dL (2 ocasiões)
- Glicemia casual ≥200 mg/dL + sintomas
- HbA1c ≥6,5%
- TOTG 2h ≥200 mg/dL

**TRATAMENTO:**
1. **Modificações do estilo de vida** (primeira linha)
2. **Metformina** (primeira escolha farmacológica)
3. **Terapia combinada** conforme HbA1c e comorbidades
4. **Monitorização** de complicações micro/macrovasculares

**METAS TERAPÊUTICAS:**
- HbA1c <7% (individualizar)
- PA <140/90 mmHg (<130/80 se alto risco)
- LDL <100 mg/dL (<70 se muito alto risco)`,

      "default": `**Resposta sobre ${subject || "Medicina Geral"}:**

Baseado na sua pergunta: "${question}"

**Análise do Tema:**
Esta é uma questão importante na prática médica que envolve conhecimentos fundamentais da medicina. 

**Pontos Relevantes:**
1. **Definição e conceitos:** O tema abordado é essencial para o entendimento clínico
2. **Aplicação prática:** Na prática médica, este conhecimento é aplicado em situações específicas
3. **Correlações clínicas:** Relaciona-se com outros sistemas e patologias

**Considerações Clínicas:**
- Manifestações típicas e atípicas
- Métodos diagnósticos apropriados  
- Abordagem terapêutica baseada em evidências
- Prognóstico e seguimento

**Referências Recomendadas:**
- Harrison's Internal Medicine, 21ª ed.
- Goldman-Cecil Medicine, 26ª ed.
- Diretrizes da Sociedade Brasileira de [Especialidade Relevante]

${!subject ? "💡 **Dica:** Selecione uma matéria específica para obter respostas mais detalhadas e precisas!" : ""}`
    };

    // Buscar resposta baseada em palavras-chave
    const question_lower = question.toLowerCase();
    let response = "";
    
    if (question_lower.includes("ciclo cardíaco") || question_lower.includes("coração")) {
      response = medicalResponses["ciclo cardíaco"];
    } else if (question_lower.includes("diabetes")) {
      response = medicalResponses["diabetes"];
    } else {
      response = medicalResponses["default"];
    }

    return response;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage = {
      id: messages.length + 1,
      type: "user",
      content: inputMessage,
      subject: selectedSubject || "Geral",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simular delay de resposta da IA
    setTimeout(() => {
      const aiResponseContent = generateDetailedResponse(inputMessage, selectedSubject);

      const aiResponse = {
        id: messages.length + 2,
        type: "ai",
        content: aiResponseContent,
        subject: selectedSubject || "Geral",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSampleQuestion = (question: string) => {
    setInputMessage(question);
  };

  const quickReplies = selectedSubject ? getSampleQuestions().slice(0, 3) : ["Como posso ajudar?", "Tire suas dúvidas", "Pergunte sobre medicina"];

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Doutor IA</h1>
            <p className="text-sm text-gray-500">Assistente Médico Especializado</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {selectedSubject && (
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 animate-fade-in">
              {selectedSubject}
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Subject Selection */}
      {!selectedSubject && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 animate-fade-in">
          <p className="text-sm text-gray-600 mb-2">Escolha uma matéria para começar:</p>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-full bg-white border-gray-200">
              <SelectValue placeholder="Selecione uma matéria para respostas mais precisas" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map(subject => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
            <div className={`max-w-[80%] md:max-w-[70%] ${
              message.type === "user" 
                ? "bg-[#E0F0FF] text-gray-800 rounded-2xl rounded-br-md" 
                : "bg-[#F5F5F5] text-gray-800 rounded-2xl rounded-bl-md"
            } px-4 py-3 shadow-sm`}>
              <div className="flex items-start space-x-2">
                {message.type === "ai" && (
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Brain className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {message.type === "ai" && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {/* Simplify function */}}
                        className="h-6 px-2 text-xs hover:bg-white/50"
                      >
                        <Lightbulb className="w-3 h-3 mr-1" />
                        Simplificar
                      </Button>
                    )}
                  </div>
                </div>
                {message.type === "user" && (
                  <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-[#F5F5F5] rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Brain className="w-3 h-3 text-white" />
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {quickReplies.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
          <div className="flex space-x-2 overflow-x-auto">
            {quickReplies.map((reply, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSampleQuestion(reply)}
                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200 rounded-full whitespace-nowrap text-xs px-3 py-1 transition-all duration-200 hover:scale-105"
              >
                {reply}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area - Fixed at bottom */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3">
        <div className="flex items-center space-x-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Escreva sua mensagem..."
              className="w-full bg-gray-50 border-gray-200 rounded-full pl-4 pr-12 py-3 focus:bg-white focus:border-blue-300 transition-all duration-200"
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110"
              size="sm"
            >
              <Send className="w-4 h-4 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};