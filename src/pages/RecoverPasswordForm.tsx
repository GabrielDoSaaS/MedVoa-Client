import { useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Input reutilizável
const SimpleInput = ({ placeholder, value, onChange, type = "text", className }: any) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`p-2 border border-border/50 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-background/50 backdrop-blur-sm ${className}`}
  />
);

// Modal de sucesso
interface SuccessModalProps {
  open: boolean;
  onConfirm: () => void;
}

const SuccessModal = ({ open, onConfirm }: SuccessModalProps) => (
  <div
    className={`fixed inset-0 z-50 bg-black/80 flex items-center justify-center transition-opacity duration-300 ${
      open ? "opacity-100" : "opacity-0 pointer-events-none"
    }`}
  >
    <div className="bg-card p-8 rounded-lg shadow-2xl max-w-sm w-full transform transition-transform duration-300 scale-100">
      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <h3 className="text-xl font-bold mt-3 text-white">Sucesso!</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Sua nova senha foi alterada com sucesso. Você já pode fazer login.
        </p>
      </div>
      <div className="flex justify-center mt-6">
        <Button onClick={onConfirm}>Fechar e Voltar</Button>
      </div>
    </div>
  </div>
);

export const RecoverPasswordForm = () => {
  const navigate = useNavigate(); // 🚀 Hook de navegação
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRecovery = useCallback(async () => {
    setError("");

    if (!email || !newPassword || !confirmPassword) {
      setError("Todos os campos são obrigatórios.");
      return;
    }

    if (newPassword.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("A nova senha e a confirmação não coincidem.");
      return;
    }

    setIsLoading(true);

    try {
      // Se seu backend está em localhost:5000, ajuste o endpoint:
      const response = await axios.post("http://localhost:3000/api/update-account", {
        email,
        newPassword,
      });

      if (response.status === 200) {
        setIsModalOpen(true);
        setEmail("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (apiError: any) {
      if (apiError.response) {
        setError(apiError.response.data?.message || "Falha ao alterar a senha.");
      } else {
        setError("Erro ao conectar ao servidor. Verifique sua conexão.");
      }
      console.error("Erro de API:", apiError);
    } finally {
      setIsLoading(false);
    }
  }, [email, newPassword, confirmPassword]);

  // Ao confirmar no modal → redireciona
  const handleConfirmAndRedirect = () => {
    setIsModalOpen(false);
    navigate("/"); // 🔁 Redireciona para a página inicial
  };

  return (
    <>
      <div className="flex items-center justify-center p-6 min-h-screen bg-background-dark">
        <Card className="w-full max-w-md border border-border/40 shadow-xl backdrop-blur-lg bg-card/70">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">
              Recuperar Conta
            </CardTitle>
            <CardDescription className="text-foreground/70">
              Preencha os campos para definir uma nova senha.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <SimpleInput
                placeholder="E-mail da Conta"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                type="email"
              />
              <SimpleInput
                placeholder="Nova Senha (Mín. 6 caracteres)"
                value={newPassword}
                onChange={(e: any) => setNewPassword(e.target.value)}
                type="password"
              />
              <SimpleInput
                placeholder="Confirme Nova Senha"
                value={confirmPassword}
                onChange={(e: any) => setConfirmPassword(e.target.value)}
                type="password"
              />
            </div>

            {error && (
              <p className="text-destructive text-sm text-center bg-destructive/10 p-2 rounded-md border border-destructive/50">
                {error}
              </p>
            )}

            <Button
              onClick={handleRecovery}
              disabled={isLoading}
              className="w-full text-lg py-6 bg-primary hover:bg-primary/90 transition-colors"
            >
              {isLoading ? "Alterando..." : "Alterar Senha"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <SuccessModal open={isModalOpen} onConfirm={handleConfirmAndRedirect} />
    </>
  );
};
