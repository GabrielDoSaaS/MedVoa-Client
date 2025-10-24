import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
interface TermsOfServiceProps {
  onBack: () => void;
}
export const TermsOfService = ({
  onBack
}: TermsOfServiceProps) => {
  return <div className="main-background min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="mb-4 hover:bg-secondary/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-white text-center">Termos de Uso</h1>
          <p className="text-white/80 mt-2 text-center">
            Termos e condições de uso da plataforma
          </p>
        </div>

        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle>Termos de Uso - MedVoa</CardTitle>
            <CardDescription>
              Última atualização: Janeiro de 2025
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-foreground">
            <section>
              <h3 className="text-lg font-semibold mb-3">1. Aceitação dos Termos</h3>
              <p className="text-muted-foreground">
                Ao acessar e usar a plataforma MedVoa, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não poderá acessar o serviço.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">2. Descrição do Serviço</h3>
              <p className="text-muted-foreground">O MedVoa é uma plataforma educacional voltada para estudantes e profissionais da área médica, oferecendo ferramentas de estudo, casos clínicos, flashcards, timers de estudo e outras funcionalidades educacionais.</p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">3. Cadastro e Conta de Usuário</h3>
              <p className="text-muted-foreground">
                Para usar determinadas funcionalidades da plataforma, você deve criar uma conta fornecendo informações precisas e atualizadas. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrem em sua conta.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">4. Uso Aceitável</h3>
              <p className="text-muted-foreground">
                Você concorda em usar a plataforma apenas para fins educacionais e profissionais legítimos. É proibido usar o serviço para qualquer atividade ilegal, prejudicial ou que viole os direitos de terceiros.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">5. Propriedade Intelectual</h3>
              <p className="text-muted-foreground">Todo o conteúdo da plataforma, incluindo textos, gráficos, logos, ícones e software, é propriedade do MedVoa ou de seus licenciadores e está protegido por leis de direitos autorais.</p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">6. Limitação de Responsabilidade</h3>
              <p className="text-muted-foreground">O MedVoa não se responsabiliza por danos diretos, indiretos, incidentais ou consequenciais resultantes do uso ou incapacidade de usar a plataforma.</p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">7. Modificações</h3>
              <p className="text-muted-foreground">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação na plataforma.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">8. Contato</h3>
              <p className="text-muted-foreground">Para questões sobre estes Termos de Uso, entre em contato conosco através do email: contatomedvoa@gmail.com</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>;
};