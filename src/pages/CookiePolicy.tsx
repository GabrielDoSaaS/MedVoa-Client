import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
interface CookiePolicyProps {
  onBack: () => void;
}
export const CookiePolicy = ({
  onBack
}: CookiePolicyProps) => {
  return <div className="main-background min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="mb-4 hover:bg-secondary/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-white text-center">Política de Cookies</h1>
          <p className="text-white/80 mt-2 text-center">
            Como utilizamos cookies em nossa plataforma
          </p>
        </div>

        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle>Política de Cookies - MedVoa</CardTitle>
            <CardDescription>
              Última atualização: Janeiro de 2025
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-foreground">
            <section>
              <h3 className="text-lg font-semibold mb-3">1. O que são Cookies</h3>
              <p className="text-muted-foreground">
                Cookies são pequenos arquivos de texto que são armazenados no seu dispositivo quando você visita nossa plataforma. Eles nos ajudam a melhorar sua experiência e fornecer funcionalidades personalizadas.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">2. Tipos de Cookies que Utilizamos</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Cookies Essenciais</h4>
                  <p className="text-muted-foreground text-sm">
                    Necessários para o funcionamento básico da plataforma, incluindo autenticação e segurança.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Cookies de Funcionalidade</h4>
                  <p className="text-muted-foreground text-sm">
                    Permitem que a plataforma lembre suas preferências e configurações pessoais.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Cookies de Analytics</h4>
                  <p className="text-muted-foreground text-sm">
                    Ajudam-nos a entender como você usa a plataforma para melhorar nossos serviços.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">3. Finalidade dos Cookies</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Manter você logado na plataforma</li>
                <li>Lembrar suas preferências de estudo</li>
                <li>Personalizar conteúdo e recomendações</li>
                <li>Analisar o desempenho da plataforma</li>
                <li>Garantir a segurança da sua conta</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">4. Gerenciamento de Cookies</h3>
              <p className="text-muted-foreground">
                Você pode gerenciar ou desabilitar cookies através das configurações do seu navegador. No entanto, desabilitar certos cookies pode afetar a funcionalidade da plataforma.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">5. Cookies de Terceiros</h3>
              <p className="text-muted-foreground">
                Ocasionalmente, usamos serviços de terceiros confiáveis que também podem definir cookies. Isso inclui ferramentas de analytics e serviços de autenticação.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">6. Tempo de Armazenamento</h3>
              <p className="text-muted-foreground">
                Diferentes cookies têm diferentes períodos de validade. Alguns são temporários (cookies de sessão) e são removidos quando você fecha o navegador, enquanto outros permanecem no seu dispositivo por períodos mais longos.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">7. Atualizações desta Política</h3>
              <p className="text-muted-foreground">
                Podemos atualizar esta política de cookies ocasionalmente. Recomendamos que você a revise periodicamente para se manter informado sobre como usamos cookies.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">8. Contato</h3>
              <p className="text-muted-foreground">Se você tiver dúvidas sobre nossa política de cookies, entre em contato conosco através do email: contatomedvoa@gmail.com</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>;
};