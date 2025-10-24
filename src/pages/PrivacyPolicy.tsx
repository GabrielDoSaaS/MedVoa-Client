import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
interface PrivacyPolicyProps {
  onBack: () => void;
}
export const PrivacyPolicy = ({
  onBack
}: PrivacyPolicyProps) => {
  return <div className="main-background min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="mb-4 hover:bg-secondary/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-white text-center">Privacidade da Conta</h1>
          <p className="text-white/80 mt-2 text-center">
            Política de privacidade e proteção de dados
          </p>
        </div>

        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle>Política de Privacidade - MedVoa</CardTitle>
            <CardDescription>
              Última atualização: Janeiro de 2025
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-foreground">
            <section>
              <h3 className="text-lg font-semibold mb-3">1. Coleta de Informações</h3>
              <p className="text-muted-foreground">
                Coletamos informações que você nos fornece diretamente, como nome, email, dados de perfil e informações de progresso nos estudos. Também coletamos dados de uso da plataforma para melhorar nossos serviços.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">2. Uso das Informações</h3>
              <p className="text-muted-foreground">
                Usamos suas informações para fornecer e melhorar nossos serviços, personalizar sua experiência de aprendizado, enviar notificações relevantes e manter a segurança da plataforma.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">3. Compartilhamento de Dados</h3>
              <p className="text-muted-foreground">
                Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto quando necessário para operar a plataforma, cumprir obrigações legais ou proteger nossos direitos.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">4. Segurança dos Dados</h3>
              <p className="text-muted-foreground">
                Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">5. Retenção de Dados</h3>
              <p className="text-muted-foreground">
                Mantemos suas informações pessoais pelo tempo necessário para fornecer nossos serviços ou conforme exigido por lei. Você pode solicitar a exclusão de sua conta a qualquer momento.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">6. Seus Direitos</h3>
              <p className="text-muted-foreground">
                Você tem o direito de acessar, atualizar, corrigir ou excluir suas informações pessoais. Também pode optar por não receber comunicações promocionais a qualquer momento.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">7. Cookies e Tecnologias Similares</h3>
              <p className="text-muted-foreground">
                Usamos cookies e tecnologias similares para melhorar sua experiência na plataforma, analisar o uso do site e personalizar conteúdo. Você pode gerenciar suas preferências de cookies nas configurações do seu navegador.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">8. Alterações na Política</h3>
              <p className="text-muted-foreground">
                Podemos atualizar esta política de privacidade periodicamente. Notificaremos você sobre mudanças significativas através da plataforma ou por email.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">9. Contato</h3>
              <p className="text-muted-foreground">Para questões sobre privacidade ou para exercer seus direitos, entre em contato conosco através do email: contatomedvoa@gmail.com</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>;
};