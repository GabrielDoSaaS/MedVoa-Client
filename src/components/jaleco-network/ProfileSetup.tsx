
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, CheckCircle, AlertCircle } from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfileSetupProps {
  user: SupabaseUser;
  onProfileCreated: () => void;
}

export const ProfileSetup = ({ user, onProfileCreated }: ProfileSetupProps) => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();

  const validateUsername = (value: string) => {
    const regex = /^[a-z0-9._-]+$/;
    
    if (!value) {
      setErrorMessage("");
      setIsValid(false);
      return;
    }
    
    if (value.length < 3) {
      setErrorMessage("O nome de usuário deve ter pelo menos 3 caracteres");
      setIsValid(false);
      return;
    }
    
    if (value.length > 30) {
      setErrorMessage("O nome de usuário deve ter no máximo 30 caracteres");
      setIsValid(false);
      return;
    }
    
    if (!regex.test(value)) {
      setErrorMessage("Use apenas letras minúsculas, números, pontos, hífens e sublinhados");
      setIsValid(false);
      return;
    }
    
    setErrorMessage("");
    setIsValid(true);
  };

  const handleUsernameChange = (value: string) => {
    const cleanValue = value.toLowerCase();
    setUsername(cleanValue);
    validateUsername(cleanValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid || !username) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username })
        .eq("id", user.id);

      if (error) {
        if (error.code === "23505") {
          setErrorMessage("Este nome de usuário já está em uso");
          setIsValid(false);
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Perfil criado!",
        description: "Bem-vindo ao MedVoa Network!",
      });
      
      onProfileCreated();
    } catch (error) {
      console.error("Erro ao criar perfil:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o perfil. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-indigo-200">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Bem-vindo ao MedVoa Network!</CardTitle>
          <p className="text-gray-600">Primeiro, vamos criar seu nome de usuário</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de usuário</Label>
              <div className="relative">
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="ex: joao.silva123"
                  className="pr-10"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {username && (
                    isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )
                  )}
                </div>
              </div>
              {errorMessage && (
                <p className="text-sm text-red-600">{errorMessage}</p>
              )}
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Apenas letras minúsculas, números e os símbolos . _ -</p>
                <p>• Entre 3 e 30 caracteres</p>
                <p>• Não pode ser alterado depois</p>
              </div>
            </div>
            
            <Button 
              type="submit"
              disabled={!isValid || loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              {loading ? "Criando..." : "Criar Perfil"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
