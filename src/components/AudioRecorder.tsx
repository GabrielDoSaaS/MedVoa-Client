import { useState, useRef, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Upload, FileAudio, Loader2, Copy, FileText, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { User as SupabaseUser } from "@supabase/supabase-js";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface AudioRecorderProps {
  user?: SupabaseUser | null;
  onUpgrade?: () => void;
}

interface SummaryToCaptureProps {
  summary: string;
  fileName: string | undefined;
}

/**
 * 🖨️ Componente invisível capturado no PDF
 * Mantém a mesma paleta e design do app (tons escuros e destaque azul)
 */
const SummaryToCapture = forwardRef<HTMLDivElement, SummaryToCaptureProps>(({ summary, fileName }, ref) => (
  <div
    ref={ref}
    className="p-10 font-sans w-full"
    style={{
      width: "210mm", // Largura de uma A4
      minHeight: "297mm", // Altura mínima de uma A4 (para garantir que o canvas capture pelo menos uma página)
      margin: 0,
      padding: "20mm",
      background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
      color: "#f1f5f9",
      borderRadius: "12px",
    }}
  >
    <h1
      style={{
        fontSize: "26px",
        fontWeight: "bold",
        marginBottom: "20px",
        color: "#60a5fa",
        borderBottom: "2px solid #60a5fa",
        paddingBottom: "6px",
      }}
    >
      🎓 Resumo Estruturado da Aula
    </h1>

    <p style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "30px" }}>
      Arquivo de origem: <b>{fileName || "Áudio Desconhecido"}</b>
    </p>

    <div
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "8px",
        padding: "20px",
        color: "#e2e8f0",
        fontSize: "14px",
        lineHeight: "1.6",
        whiteSpace: "pre-wrap",
      }}
    >
      {summary}
    </div>

    <div
      style={{
        marginTop: "40px",
        fontSize: "12px",
        color: "#64748b",
        textAlign: "center",
      }}
    >
      Gerado automaticamente pelo Resumed © {new Date().getFullYear()}
    </div>
  </div>
));
SummaryToCapture.displayName = "SummaryToCapture";

export const AudioRecorder = ({ user, onUpgrade }: AudioRecorderProps = {}) => {
  const { canUseSpecialFeature, subscription } = useSubscription(user);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [summary, setSummary] = useState("");
  const [processingStep, setProcessingStep] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const summaryToCaptureRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo de áudio válido.",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setTranscription("");
    setSummary("");
    toast({ title: "Arquivo carregado", description: "Gravação pronta para transcrição e resumo." });
  };

  const generateSummary = async () => {
    if (!uploadedFile) {
      toast({
        title: "Erro",
        description: "Faça upload de uma gravação primeiro.",
        variant: "destructive",
      });
      return;
    }

    setIsTranscribing(true);
    setProcessingStep("Transcrevendo áudio...");
    try {
      const formData = new FormData();
      formData.append("audio", uploadedFile);

      const transcriptionResponse = await axios.post("http://localhost:3000/api/transcribe", formData);
      const text = transcriptionResponse.data.transcribedText;
      setTranscription(text);

      setProcessingStep("Gerando resumo estruturado...");
      const summaryResponse = await axios.post("http://localhost:3000/api/resumed", { material: text });
      setSummary(summaryResponse.data);

      toast({
        title: "Processamento concluído",
        description: "Transcrição e resumo gerados com sucesso.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Falha ao processar a gravação.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
      setProcessingStep("");
    }
  };

  const handleCopySummary = async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    toast({ title: "Copiado! 📋", description: "Resumo copiado para a área de transferência." });
  };

  /** 🧾 Gera PDF visualmente idêntico ao design do app, com suporte a múltiplas páginas */
  const handleExportPdf = async () => {
    if (!summaryToCaptureRef.current || !summary) {
      toast({
        title: "Erro",
        description: "Não há resumo para exportar.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Exportando PDF", description: "Gerando arquivo..." });

    try {
      // Usar uma escala maior para melhorar a qualidade
      const canvas = await html2canvas(summaryToCaptureRef.current, { scale: 3, useCORS: true });
      const imgData = canvas.toDataURL("image/png", 1.0);

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth(); // Largura A4 (210mm)
      const pdfPageHeight = pdf.internal.pageSize.getHeight(); // Altura A4 (297mm)

      // Calcular a altura total que a imagem ocupará no PDF (mantendo a proporção)
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const totalPdfHeight = (canvasHeight * pdfWidth) / canvasWidth;

      let heightLeft = totalPdfHeight;
      let position = 0; // Posição Y inicial da imagem

      // Adiciona a primeira página
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, totalPdfHeight);
      heightLeft -= pdfPageHeight; // Subtrai a altura da primeira página

      // Loop para adicionar páginas subsequentes, se necessário
      while (heightLeft > 0) {
        position = position - pdfPageHeight; // Move a imagem para cima (posição Y negativa)
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, totalPdfHeight);
        heightLeft -= pdfPageHeight;
      }

      const fileName = `Resumo_${uploadedFile?.name.replace(/\.[^/.]+$/, "") || "Aula"}.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF Baixado! ⬇️",
        description: "O resumo foi exportado com o mesmo design do app.",
      });
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      toast({
        title: "Erro ao Exportar",
        description: "Falha na geração do PDF.",
        variant: "destructive",
      });
    }
  };

  const isUploaded = uploadedFile !== null;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="font-bold mb-2 text-4xl text-slate-50">Resumed</h1>
          <p className="text-foreground/70 text-lg">
            Transcreve e resume a gravação da sua aula
          </p>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto rounded-full mt-6"></div>
        </div>

        {/* Upload */}
        <div className="glass-card p-8 mb-6 relative">
          <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />

          {!isUploaded ? (
            <div className="text-center space-y-6">
              <div className="glow-icon w-16 h-16 mx-auto flex items-center justify-center">
                <Upload className="w-9 h-9 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-2">Faça upload da sua gravação</h3>
              <Button onClick={() => fileInputRef.current?.click()} className="btn-glow">
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Arquivo
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="glow-icon w-16 h-16 mx-auto flex items-center justify-center">
                <FileAudio className="w-9 h-9 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">{uploadedFile?.name}</h3>
              <p className="text-foreground/70">
                {(uploadedFile?.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <Button onClick={generateSummary} disabled={isTranscribing} className="btn-glow px-8 py-3">
                {isTranscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {processingStep}
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Processar Áudio
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Resultado */}
        {transcription && (
          <div className="space-y-4">
            <div className="glass-card p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Transcrição da Aula</h2>
              <Textarea value={transcription} readOnly className="min-h-[150px] input-glass" />
            </div>

            {summary && (
              <div className="glass-card p-6">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Resumo Estruturado da Aula
                </h2>
                <div className="glass-card rounded-lg p-4 mb-4">
                  <pre className="whitespace-pre-wrap text-sm text-foreground/80 font-sans">
                    {summary}
                  </pre>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button onClick={handleCopySummary} className="btn-glass">
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Resumo
                  </Button>
                  <Button onClick={handleExportPdf} className="btn-glass">
                    <FileText className="w-4 h-4 mr-2" />
                    Exportar PDF
                  </Button>
                </div>

                {/* Invisível, mas capturado no PDF */}
                <div style={{ position: "absolute", left: "-9999px" }}>
                  <SummaryToCapture
                    ref={summaryToCaptureRef}
                    summary={summary}
                    fileName={uploadedFile?.name}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};