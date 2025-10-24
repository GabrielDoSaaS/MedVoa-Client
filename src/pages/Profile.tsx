import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Camera } from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";
interface ProfilePageProps {
  user: SupabaseUser | null;
  onBack: () => void;
}
export const ProfilePage = ({
  user,
  onBack
}: ProfilePageProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [username, setUsername] = useState(user?.user_metadata?.username || "");
  const [profileImage, setProfileImage] = useState<string | null>(user?.user_metadata?.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleSave = () => {
    // Here you would implement the save logic
    setIsEditing(false);
  };
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  return <div className="main-background min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="mb-4 hover:bg-secondary/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Perfil do Usuário</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie suas informações pessoais
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <Card className="glass-card border-primary/20 w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <User className="w-5 h-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Atualize suas informações básicas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center mb-6">
                <div className="relative group">
                  {profileImage ? <img src={profileImage} alt="Profile" className="w-20 h-20 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity" onClick={() => fileInputRef.current?.click()} /> : <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      {(user?.user_metadata?.full_name || "D").charAt(0).toUpperCase()}
                    </div>}
                  <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground hover:bg-primary/80 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Nome Completo / Apelido</Label>
                  <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} disabled={!isEditing} className="bg-background/50" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={true} className="bg-background/50" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="username">@ do Instagram / Usuário</Label>
                  <Input id="username" value={username} onChange={e => setUsername(e.target.value)} disabled={!isEditing} className="bg-background/50" placeholder="Seu nome de usuário" />
                </div>
              </div>

              <div className="flex gap-2 pt-4 justify-center">
                {isEditing ? <>
                    <Button onClick={handleSave} className="btn-glow">
                      Salvar Alterações
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} className="btn-glass">
                      Cancelar
                    </Button>
                  </> : <Button onClick={() => setIsEditing(true)} className="btn-glow">
                    Editar Perfil
                  </Button>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};