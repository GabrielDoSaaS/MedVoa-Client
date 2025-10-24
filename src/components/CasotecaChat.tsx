import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Send, User, Bot, CheckCircle, XCircle } from "lucide-react";
import axios from "axios";

interface CasotecaChatProps {
  caseData: any;
  onBack: () => void;
}

const email = 'gabrieldosaas@gmail.com';


const initChat = async ( ) => {
  await axios.post('http://localhost:3000/api/create-chat', JSON.stringify({email, levelKnowledge, medicalSpecialty, codeChat}), 
  {
    headers: {"Content-Type": "application/json"}
  })
}

const sendMessage = async ( ) => {
  await axios.post('http://localhost:3000/api/send-message-casoteca', JSON.stringify({
    codeChat, message
  }), 
  {
    headers: {"Content-Type": "application/json"}
  });
}

const doneCasoteca = async ( ) => {
  await axios.post('http://localhost:3000/api/doneCasoteca', JSON.stringify({diagnosis, codeChat}), 
  {
    headers: {"Content-Type": "application/json"}
  })
}

export const CasotecaChat = ({ caseData, onBack }: CasotecaChatProps) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content: `**Apresentação do Caso Clínico**\n\n**Dados do Paciente:**\n• Idade: ${caseData.patient.age} anos\n• Sexo: ${caseData.patient.gender}\n• Queixa Principal: ${caseData.patient.complaint}\n\nEste é um caso de ${caseData.title}. Vamos começar?`,
      step: "presentation"
    }
  ]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentStep, setCurrentStep] = useState("presentation");
  const [userAnswers, setUserAnswers] = useState<any>({});
  const [score, setScore] = useState(0);

  const steps = {
    presentation: "Apresentação",
    anamnese: "Anamnese", 
    exame: "Exame Físico",
    questoes: "Questões",
    resultado: "Resultado"
  };

  const handleSendMessage = () => {
    if (!currentInput.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      content: currentInput,
      step: currentStep
    };

    let botResponse: any = {
      id: messages.length + 2,
      type: "bot",
      content: "",
      step: currentStep
    };

    // Lógica de progressão baseada no step atual
    switch (currentStep) {
      case "presentation":
        botResponse.content = `**História Clínica (Anamnese)**\n\n${caseData.history}\n\nAgora que você conhece a história, o que gostaria de perguntar sobre o exame físico?`;
        setCurrentStep("anamnese");
        break;

      case "anamnese":
        botResponse.content = `**Exame Físico**\n\n**Sinais Vitais:** ${caseData.physicalExam.vital_signs}\n\n**Exame Cardiovascular:** ${caseData.physicalExam.cardiovascular || "Normal"}\n\n**Exame Pulmonar:** ${caseData.physicalExam.pulmonary || "Normal"}\n\n${caseData.ecg ? `**ECG:** ${caseData.ecg}` : ""}\n\nCom base nos dados apresentados, qual seria sua principal hipótese diagnóstica?`;
        setCurrentStep("exame");
        break;

      case "exame":
        // Verificar resposta do usuário
        const isCorrectDiagnosis = currentInput.toLowerCase().includes(caseData.questions[0].options[caseData.questions[0].correct].toLowerCase().slice(0, 5));
        
        if (isCorrectDiagnosis) {
          setScore(score + 2);
          botResponse.content = `✅ **Excelente!** Sua hipótese diagnóstica está correta!\n\n**Resposta:** ${caseData.questions[0].options[caseData.questions[0].correct]}\n\n**Explicação:** ${caseData.questions[0].explanation}\n\n**Pontuação:** +2 pontos\n\nVamos para a próxima questão: ${caseData.questions[1].question}`;
        } else {
          botResponse.content = `❌ **Não foi dessa vez.** A resposta correta seria:\n\n**Resposta:** ${caseData.questions[0].options[caseData.questions[0].correct]}\n\n**Explicação:** ${caseData.questions[0].explanation}\n\nVamos para a próxima questão: ${caseData.questions[1].question}`;
        }
        setCurrentStep("questoes");
        break;

      case "questoes":
        // Avaliar resposta da segunda questão
        const isCorrect = currentInput.toLowerCase().includes(caseData.questions[1].options[caseData.questions[1].correct].toLowerCase().slice(0, 5));
        
        if (isCorrect) {
          setScore(score + 2);
          botResponse.content = `✅ **Correto!** \n\n**Explicação:** ${caseData.questions[1].explanation}\n\n**Pontuação Final:** ${score + 2}/4 pontos\n\n${score + 2 >= 3 ? "🎉 **Parabéns!** Excelente desempenho neste caso clínico!" : "📚 **Continue estudando!** Este caso ajudou a identificar pontos de melhoria."}`;
        } else {
          botResponse.content = `❌ **Resposta:** ${caseData.questions[1].options[caseData.questions[1].correct]}\n\n**Explicação:** ${caseData.questions[1].explanation}\n\n**Pontuação Final:** ${score}/4 pontos\n\n${score >= 2 ? "👍 **Bom trabalho!** Continue praticando para melhorar ainda mais." : "📚 **Continue estudando!** Este caso ajudou a identificar pontos de melhoria."}`;
        }
        setCurrentStep("resultado");
        break;

      default:
        botResponse.content = "Caso finalizado! Clique em 'Novo Caso' para continuar praticando.";
    }

    setMessages([...messages, userMessage, botResponse]);
    setCurrentInput("");
  };

  const getStepProgress = () => {
    const stepKeys = Object.keys(steps);
    const currentIndex = stepKeys.indexOf(currentStep);
    return ((currentIndex + 1) / stepKeys.length) * 100;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/60 backdrop-blur-sm border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Stethoscope className="w-5 h-5 text-purple-600" />
                <span>{caseData.title}</span>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Simulação Interativa de Caso Clínico</p>
            </div>
            <Button variant="outline" onClick={onBack} className="hidden sm:block">
              Novo Caso
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Progress Bar */}
      <Card className="bg-white/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Progresso do Caso</span>
            <span>{Math.round(getStepProgress())}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${getStepProgress()}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="bg-white/60 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {messages.map(message => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-4 rounded-lg ${
                  message.type === "user" 
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" 
                    : "bg-white border border-gray-200 shadow-sm"
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {message.type === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4 text-purple-600" />
                    )}
                    <span className="text-sm font-medium">
                      {message.type === "user" ? "Você" : "Doutor IA"}
                    </span>
                  </div>
                  <div className="whitespace-pre-line text-sm leading-relaxed">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Current Step Badge */}
          <div className="flex items-center justify-center mb-4">
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              {steps[currentStep as keyof typeof steps]}
            </Badge>
          </div>

          {/* Input Area */}
          {currentStep !== "resultado" && (
            <div className="flex space-x-2">
              <Input
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder={
                  currentStep === "presentation" ? "Digite qualquer coisa para continuar..." :
                  currentStep === "anamnese" ? "Faça uma pergunta sobre o caso..." :
                  currentStep === "exame" ? "Qual sua hipótese diagnóstica?" :
                  "Digite sua resposta..."
                }
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!currentInput.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}

          {currentStep === "resultado" && (
            <div className="text-center">
              <Button onClick={onBack} className="bg-gradient-to-r from-purple-500 to-blue-500">
                Novo Caso Clínico
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
