import { useState, useEffect } from "react";
// REMOVIDO: import { User as SupabaseUser } from "@supabase/supabase-js";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Adicionado Trash2 para exclusão
import { Brain, FileText, PlusCircle, BookOpen, RotateCcw, ArrowLeft, Lightbulb, Zap, Sparkles, Upload, Trash2, Crown } from "lucide-react"; 
import { FeatureBlocker } from "@/components/ui/feature-blocker";

// Configurações
const API_BASE_URL = 'http://localhost:3000/api';
// EMAIL ESTÁTICO AGORA É UM FALLBACK PARA QUEM CLICAR EM "PULAR E USAR GRÁTIS"
const FALLBACK_USER_EMAIL = "gabrieldosaas@gmail.com"; 

// Interfaces baseadas no seu Schema Mongoose
interface Flashcard {
    request: string;
    response: string;
}

interface Deck {
    id: string; 
    nameDeck: string;
    matter: string;
    flashCards: Flashcard[];
}

// NOVO: Interface Mínima do Usuário para o componente (compatível com AppUser de Index/AuthPage)
interface AppUserMinimal {
    email: string;
}

interface FlashcardGeneratorProps {
    user?: AppUserMinimal | null; 
    onUpgrade?: () => void;
    isPremium?: boolean; // NOVA PROP: recebe o status premium do componente pai
}

export const FlashcardGenerator = ({ user, onUpgrade, isPremium = false }: FlashcardGeneratorProps) => {
    const [decks, setDecks] = useState<Deck[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deckUpdateKey, setDeckUpdateKey] = useState(0); 
    
    // Estado para a tela de estudo (Flashcard Estudar)
    const [studyDeck, setStudyDeck] = useState<Deck | null>(null); 
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);

    // ESTADOS PARA REVISÃO DE IA
    const [generatedFlashcards, setGeneratedFlashcards] = useState<Flashcard[]>([]);
    const [isReviewing, setIsReviewing] = useState(false);
    
    // Estados para formulário de criação manual
    const [newDeckName, setNewDeckName] = useState('');
    const [newDeckMatter, setNewDeckMatter] = useState('');
    const [selectedDeckName, setSelectedDeckName] = useState('');
    const [newFlashcardRequest, setNewFlashcardRequest] = useState('');
    const [newFlashcardResponse, setNewFlashcardResponse] = useState('');
    
    // Estados para formulário de criação com IA
    const [aiDeckName, setAiDeckName] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null); 
    const [aiNumCards, setAiNumCards] = useState<number>(5);


    // LINHA MODIFICADA: Usa o email do objeto user (dinâmico) ou o fallback estático
    const email = user?.email || FALLBACK_USER_EMAIL;

    // --- 1. BUSCAR DECKS ---
    const getDecks = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // A requisição agora usa a variável 'email' dinâmica
            const response = await axios.post(`${API_BASE_URL}/get-decks`, 
                { email }, 
                { headers: { "Content-Type": "application/json" } }
            );
            
            if (Array.isArray(response.data)) {
                const processedDecks: Deck[] = response.data.map((d: any) => ({
                    ...d,
                    id: d._id || d.nameDeck
                }));
                 setDecks(processedDecks); 
            } else {
                 setDecks([]);
            }
           
        } catch (err) {
            console.error("Erro ao buscar decks:", err);
            setError("Não foi possível carregar seus decks.");
            setDecks([]);
        } finally {
            setIsLoading(false);
        }
    };

    // --- FUNÇÕES DE EXCLUSÃO ---

    // NOVO: Excluir Deck
    const handleDeleteDeck = async (nameDeck: string) => {
        if (!confirm(`Tem certeza que deseja apagar o deck "${nameDeck}"? Esta ação é irreversível.`)) {
            return;
        }

        setIsLoading(true);
        try {
            // A requisição agora usa a variável 'email' dinâmica
            await axios.post(`${API_BASE_URL}/deleteDeck`, {
                email,
                nameDeck
            }, {
                headers: { "Content-Type": "application/json" }
            });

            alert(`Deck "${nameDeck}" apagado com sucesso!`);
            await getDecks(); // Recarrega a lista
        } catch (err) {
            console.error("Erro ao apagar deck:", err);
            // @ts-ignore
            alert(`Erro ao apagar deck: ${err.response?.data?.message || err.message || 'Verifique o console.'}`);
        } finally {
            setIsLoading(false);
        }
    }

    // NOVO: Excluir Flashcard
    const handleDeleteFlashcard = async (nameDeck: string, flashCardRequest: string) => {
        if (!confirm(`Tem certeza que deseja apagar este flashcard?`)) {
            return;
        }

        setIsLoading(true);
        try {
            // A requisição agora usa a variável 'email' dinâmica
            await axios.post(`${API_BASE_URL}/deleteFlashcard`, {
                email,
                nameDeck,
                flashCardRequest
            }, {
                headers: { "Content-Type": "application/json" }
            });

            alert(`Flashcard apagado com sucesso!`);
            
            // Recarrega o deck e tenta continuar no modo estudo se possível
            await getDecks();
            setStudyDeck(null); // Sai da tela de estudo para garantir a atualização
        } catch (err) {
            console.error("Erro ao apagar flashcard:", err);
            // @ts-ignore
            alert(`Erro ao apagar flashcard: ${err.response?.data?.message || err.message || 'Verifique o console.'}`);
        } finally {
            setIsLoading(false);
        }
    }


    // --- FUNÇÕES DE ESTUDO ---
    const handleStudyDeck = (deck: Deck) => {
        if (deck.flashCards.length === 0) {
            alert(`O deck "${deck.nameDeck}" não possui flashcards para estudar.`);
            return;
        }
        setStudyDeck(deck); 
        // Reinicia o índice caso o deck anterior tenha sido menor
        setCurrentCardIndex(0); 
        setShowAnswer(false);
    }
    
    const handleGoBackToManagement = () => {
        setStudyDeck(null);
    };

    // --- FUNÇÃO PARA LIDAR COM O UPLOAD DE ARQUIVO (APENAS PDF) ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                alert("Apenas arquivos PDF são aceitos.");
                setSelectedFile(null);
                e.target.value = ""; // Limpa o input file
                return;
            }
            setSelectedFile(file);
        } else {
            setSelectedFile(null);
        }
    };

    // --- 2. GERAÇÃO DE FLASHCARDS COM IA (COM UPLOAD DE PDF) ---
    const handleCreateFlashcardsWithAI = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // VERIFICAÇÃO DE PREMIUM - Bloqueia se não for premium
        if (!isPremium) {
            alert("A geração de flashcards com IA é exclusiva para usuários Premium. Faça upgrade para desbloquear!");
            return;
        }

        if (!aiDeckName || !selectedFile || aiNumCards <= 0) {
            alert("Por favor, selecione um deck, faça upload de um arquivo PDF e defina a quantidade de cards.");
            return;
        }

        setIsLoading(true);

        const formData = new FormData();
        formData.append('pdf', selectedFile); 
        // A requisição agora usa a variável 'email' dinâmica
        formData.append('email', email);
        formData.append('nameDeck', aiDeckName);
        formData.append('quantity', aiNumCards.toString()); 

        try {
            const response = await axios.post(`${API_BASE_URL}/flashcard-with-ia`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data', 
                },
            });
            
            const flashcards: Flashcard[] = response.data;

            if (flashcards && flashcards.length > 0) {
                setGeneratedFlashcards(flashcards);
                setIsReviewing(true); // Entra na tela de revisão
            } else {
                alert("A IA não conseguiu gerar flashcards a partir do material fornecido.");
            }
            
            setSelectedFile(null);
        } catch (err) {
            console.error("Erro ao criar flashcards com IA:", err);
            // @ts-ignore
            alert(`Erro ao gerar flashcards: ${err.response?.data?.message || err.message || 'Verifique o console para mais detalhes.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- 3. FUNÇÕES DE REVISÃO E APROVAÇÃO ---
    const checkReviewCompletion = async (updatedCards: Flashcard[]) => {
        setGeneratedFlashcards(updatedCards);
        if (updatedCards.length === 0) {
            setIsReviewing(false); 
            alert("Revisão de flashcards concluída! Decks atualizados.");
            await getDecks();
        }
    }

    const handleApproveCard = async (flashcard: Flashcard) => {
        setIsLoading(true);
        try {
            const payload = {
                // A requisição agora usa a variável 'email' dinâmica
                email,
                nameDeck: aiDeckName, 
                flashcards: [flashcard] 
            };

            await axios.post(`${API_BASE_URL}/aprove-flashcards`, payload, {
                headers: { "Content-Type": "application/json" }
            });

            const updatedCards = generatedFlashcards.filter(c => c !== flashcard);
            await checkReviewCompletion(updatedCards);
            
        } catch (err) {
            console.error("Erro ao aprovar flashcard:", err);
            alert("Erro ao aprovar e salvar o flashcard. Verifique a console.");
        } finally {
            setIsLoading(false); 
        }
    };

    const handleRejectCard = (flashcard: Flashcard) => {
        if (isLoading) {
            alert("Aguarde a conclusão da operação atual.");
            return;
        }
        const updatedCards = generatedFlashcards.filter(c => c !== flashcard);
        checkReviewCompletion(updatedCards);
    };

    // --- 4. FUNÇÕES DE CRIAÇÃO MANUAL (MANTIDAS) ---

    const handleCreateDeck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeckName || !newDeckMatter) return;
        
        try {
            setIsLoading(true);
            await axios.post(`${API_BASE_URL}/create-deck`, {
                // A requisição agora usa a variável 'email' dinâmica
                email,
                nameDeck: newDeckName,
                matter: newDeckMatter
            }, {
                headers: { "Content-Type": "application/json" }
            });

            setNewDeckName('');
            setNewDeckMatter('');
            await getDecks();
            alert('Deck criado com sucesso!');
        } catch (err) {
            console.error("Erro ao criar deck:", err);
            alert("Erro ao criar o deck.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateFlashcard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDeckName || !newFlashcardRequest || !newFlashcardResponse) return;
        
        try {
            setIsLoading(true);
            await axios.post(`${API_BASE_URL}/create-flashcard`, {
                // A requisição agora usa a variável 'email' dinâmica
                email,
                nameDeck: selectedDeckName,
                request: newFlashcardRequest,
                response: newFlashcardResponse
            }, {
                headers: { "Content-Type": "application/json" }
            });

            setNewFlashcardRequest('');
            setNewFlashcardResponse('');
            await getDecks(); 

            alert('Flashcard criado com sucesso!');
        } catch (err) {
            console.error("Erro ao criar flashcard:", err);
            alert("Erro ao criar o flashcard.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // --- USE EFFECT ---
    useEffect(() => {
        getDecks();
    }, [email]); // ADICIONADO: Dependência de 'email' para recarregar ao mudar de usuário

    // ------------------- RENDERIZAÇÃO CONDICIONAL ---------------------

    // A. Tela de Estudo
    if (studyDeck) {
        // Se o deck foi apagado na requisição, handleGoBackToManagement
        const currentDeckData = decks.find(d => d.nameDeck === studyDeck.nameDeck);
        if (!currentDeckData) {
             setStudyDeck(null); // Sai do modo estudo se o deck não existe mais
             return null;
        }
        
        // Atualiza a referência do card (necessário se o array de cards foi alterado, ex: deleção)
        const currentCard = currentDeckData.flashCards[currentCardIndex];
        
        // Se o card atual não existe (foi deletado) e ainda há cards, avança.
        if (!currentCard) {
            const nextIndex = currentCardIndex >= currentDeckData.flashCards.length ? 0 : currentCardIndex;
            setCurrentCardIndex(nextIndex);
            // Se o deck ficou vazio, sai do modo estudo
            if (currentDeckData.flashCards.length === 0) {
                 setStudyDeck(null);
                 return null;
            }
            return null; // Força a re-renderização com o novo índice
        }


        return (
            <div className="p-4 space-y-6 min-h-screen">
                <div className="flex justify-between items-center pb-4 border-b border-border">
                    <Button variant="outline" onClick={handleGoBackToManagement} className="btn-glow-outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </Button>
                    <h1 className="text-2xl font-bold text-foreground truncate">{currentDeckData.nameDeck}</h1>
                    <Badge variant="secondary">{currentDeckData.matter}</Badge>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                    Card {currentCardIndex + 1} de {currentDeckData.flashCards.length}
                </div>

                <div className="max-w-xl mx-auto">
                    <Card className="glass-card min-h-[300px] flex flex-col justify-center">
                        <CardContent className="p-8 text-center">
                            <h3 className="text-xl font-semibold text-primary mb-4 flex items-center justify-center">
                                <Lightbulb className="w-5 h-5 mr-2" /> Pergunta:
                            </h3>
                            <p className="text-3xl font-bold text-foreground mb-6">
                                {currentCard.request}
                            </p>
                            
                            {showAnswer && (
                                <div className="mt-8 pt-4 border-t border-border/50">
                                    <h4 className="text-lg font-semibold text-accent mb-2 flex items-center justify-center">
                                        <Zap className="w-5 h-5 mr-2" /> Resposta:
                                    </h4>
                                    <p className="text-xl text-foreground/80">{currentCard.response}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-center mt-6 space-x-4">
                        {/* Botão de Excluir Flashcard */}
                        <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteFlashcard(currentDeckData.nameDeck, currentCard.request)} 
                            disabled={isLoading}
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Apagar Card
                        </Button>

                        <Button variant="outline" onClick={() => setCurrentCardIndex(prev => Math.max(0, prev - 1))} disabled={currentCardIndex === 0 || isLoading}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
                        </Button>

                        <Button onClick={() => setShowAnswer(prev => !prev)} className="btn-glow" disabled={isLoading}>
                            {showAnswer ? 'Esconder' : 'Mostrar'} Resposta
                        </Button>

                        <Button onClick={() => setCurrentCardIndex(prev => (prev < currentDeckData.flashCards.length - 1 ? prev + 1 : 0))} className="btn-glow" disabled={isLoading}>
                            Próximo <ArrowLeft className="w-4 h-4 ml-2 transform rotate-180" />
                        </Button>
                    </div>
                    {isLoading && <p className="text-center text-sm text-primary mt-4">Processando...</p>}
                </div>
            </div>
        );
    }
    
    // B. Tela de Revisão de Flashcards Gerados pela IA
    if (isReviewing) {
        const currentCard = generatedFlashcards[0]; 
        
        if (!currentCard) return null; 

        return (
            <div className="p-4 space-y-6 min-h-screen">
                <div className="flex justify-between items-center pb-4 border-b border-border">
                    <h1 className="text-2xl font-bold text-foreground flex items-center">
                        <Sparkles className="w-6 h-6 mr-2 text-primary"/> Revisar Flashcards Gerados
                    </h1>
                    <Badge variant="outline">{generatedFlashcards.length} Pendentes</Badge>
                </div>

                <div className="max-w-xl mx-auto">
                    <Card className="glass-card min-h-[300px] flex flex-col justify-center">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-center text-sm text-muted-foreground">
                                Deck: {aiDeckName} | Revisando: Card 1 de {generatedFlashcards.length}
                            </CardDescription>
                            <CardTitle className="text-xl font-semibold text-primary mb-4 flex items-center justify-center">
                                <Lightbulb className="w-5 h-5 mr-2" /> Pergunta:
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 text-center">
                            <p className="text-2xl font-bold text-foreground mb-6">
                                {currentCard.request}
                            </p>
                            
                            <div className="mt-8 pt-4 border-t border-border/50">
                                <h4 className="text-lg font-semibold text-accent mb-2 flex items-center justify-center">
                                    <Zap className="w-5 h-5 mr-2" /> Resposta:
                                </h4>
                                <p className="text-lg text-foreground/80">{currentCard.response}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-center mt-6 space-x-4">
                        <Button 
                            variant="destructive" 
                            onClick={() => handleRejectCard(currentCard)} 
                            disabled={isLoading}
                            className="btn-glow-danger"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Reprovar (Remover)
                        </Button>

                        <Button 
                            variant="default" 
                            onClick={() => handleApproveCard(currentCard)} 
                            disabled={isLoading}
                            className="btn-glow bg-green-600 hover:bg-green-700"
                        >
                            Aprovar (Salvar) <ArrowLeft className="w-4 h-4 ml-2 transform rotate-180" />
                        </Button>
                    </div>
                    {isLoading && <p className="text-center text-sm text-primary mt-4">Processando card...</p>}
                </div>
            </div>
        );
    }

    // Componente para o card de IA com limitação
    const AICardSection = () => (
        <Card className="glass-card border-2 border-primary/50 shadow-lg shadow-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center text-primary">
                    <Sparkles className="w-5 h-5 mr-2"/> 
                    Criar Flashcards com IA
                    {!isPremium && (
                        <Badge variant="outline" className="ml-2 bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                            <Crown className="w-3 h-3 mr-1" /> Premium
                        </Badge>
                    )}
                </CardTitle>
                <CardDescription>
                    {isPremium 
                        ? "Gere flashcards automaticamente a partir de um arquivo **PDF**."
                        : "Geração automática de flashcards com IA é exclusiva para usuários Premium."
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleCreateFlashcardsWithAI} className="space-y-4">
                    <Select onValueChange={setAiDeckName} value={aiDeckName}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o Deck de destino" />
                        </SelectTrigger>
                        <SelectContent className="glass-card">
                            {decks.map(deck => (
                                <SelectItem key={deck.id} value={deck.nameDeck}>
                                    {deck.nameDeck}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    {/* Input de Arquivo (Apenas PDF, com espaçamento corrigido) */}
                    <div className="flex items-center space-x-4 p-3 border rounded-lg border-dashed border-primary/50 mb-4">
                        <Upload className="w-5 h-5 text-primary"/>
                        <Input 
                            id="file-upload"
                            type="file" 
                            accept=".pdf" // Apenas PDF
                            onChange={handleFileChange} 
                            required 
                            disabled={!isPremium}
                            className="flex-1 cursor-pointer file:text-primary file:font-semibold file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary/20 hover:file:bg-primary/30"
                        />
                        {selectedFile && <Badge variant="default" className="bg-green-500/80 hover:bg-green-500">{selectedFile.name}</Badge>}
                    </div>

                    <div className="flex items-center space-x-4">
                        <label htmlFor="aiNumCards" className="text-sm font-medium">Quantidade de Cards (Máx. 50):</label>
                        <Input 
                            id="aiNumCards"
                            type="number" 
                            value={aiNumCards}
                            onChange={e => setAiNumCards(parseInt(e.target.value, 10) > 50 ? 50 : parseInt(e.target.value, 10))}
                            min="1"
                            max="50"
                            required 
                            disabled={!isPremium}
                            className="w-24"
                        />
                    </div>
                    <Button 
                        type="submit" 
                        disabled={isLoading || decks.length === 0 || !selectedFile || !isPremium} 
                        className="btn-glow"
                    >
                        <Sparkles className="w-4 h-4 mr-2" /> 
                        {isPremium ? "Gerar com IA a partir do PDF" : "Recurso Premium - Faça Upgrade"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );

    // Conteúdo principal do componente - SEM FeatureBlocker no componente inteiro
    return (
        <div className="p-4 space-y-6">
            <h1 className="text-3xl font-bold text-foreground flex items-center">
                <Brain className="w-8 h-8 mr-3 text-primary" /> Gerenciamento de Flashcards
            </h1>
            <p className="text-muted-foreground">Crie e organize seus decks para estudar.</p>
            
            {/* CRIAÇÃO COM IA - Agora com FeatureBlocker apenas nesta seção */}
            {!isPremium ? (
                <FeatureBlocker 
                    title="Recurso Premium Exclusivo"
                    description="A geração automática de flashcards com IA está disponível apenas para usuários Premium. Faça upgrade para desbloquear esta funcionalidade!"
                    onUpgrade={() => onUpgrade?.()}
                >
                    <AICardSection />
                </FeatureBlocker>
            ) : (
                <AICardSection />
            )}

            {/* CRIAÇÃO MANUAL DE DECK - SEMPRE GRATUITO */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="flex items-center"><BookOpen className="w-5 h-5 mr-2"/> Criar Novo Deck</CardTitle>
                    <CardDescription>Crie decks manualmente para organizar seus flashcards.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateDeck} className="space-y-4">
                        <Input placeholder="Nome do Deck" value={newDeckName} onChange={e => setNewDeckName(e.target.value)} required />
                        <Input placeholder="Matéria" value={newDeckMatter} onChange={e => setNewDeckMatter(e.target.value)} required />
                        <Button type="submit" disabled={isLoading} className="btn-glow">
                            <PlusCircle className="w-4 h-4 mr-2" /> Criar Deck
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* CRIAÇÃO MANUAL DE FLASHCARD - SEMPRE GRATUITO */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="flex items-center"><FileText className="w-5 h-5 mr-2"/> Adicionar Flashcard Manualmente</CardTitle>
                    <CardDescription>Crie flashcards individualmente para seus decks.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateFlashcard} className="space-y-4">
                        <Select onValueChange={setSelectedDeckName} value={selectedDeckName}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione um Deck" />
                            </SelectTrigger>
                            <SelectContent className="glass-card">
                                {decks.map(deck => (
                                    <SelectItem key={deck.id} value={deck.nameDeck}>
                                        {deck.nameDeck} ({deck.flashCards.length} cards)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input placeholder="Frente do Card (Pergunta)" value={newFlashcardRequest} onChange={e => setNewFlashcardRequest(e.target.value)} required />
                        <Input placeholder="Verso do Card (Resposta)" value={newFlashcardResponse} onChange={e => setNewFlashcardResponse(e.target.value)} required />
                        <Button type="submit" disabled={isLoading || decks.length === 0} className="btn-glow">
                            Adicionar Flashcard
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* LISTA DE DECKS - SEMPRE GRATUITO */}
            <h2 className="text-2xl font-bold pt-4 text-foreground flex items-center">
                <RotateCcw className="w-5 h-5 mr-2 text-primary/80"/> Seus Decks ({decks.length})
            </h2>
            {isLoading && !isReviewing && <p className="text-primary flex items-center"><Brain className="w-5 h-5 mr-2 animate-pulse"/> Carregando decks...</p>}
            {error && <p className="text-destructive">{error}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {decks.length > 0 ? decks.map(deck => (
                    <Card key={deck.id} className="futuristic-card">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-xl">{deck.nameDeck}</CardTitle>
                                <Badge variant="secondary">{deck.matter}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-extrabold text-primary">{deck.flashCards.length}</p>
                            <p className="text-sm text-muted-foreground">Flashcards</p>
                            
                            {deck.flashCards.length > 0 && (
                                <div className="mt-3 p-2 border rounded-md text-sm">
                                    <p className="font-semibold text-foreground/80">Exemplo de Pergunta:</p>
                                    <p className="truncate text-foreground/70">{deck.flashCards[0].request}</p>
                                </div>
                            )}
                            <div className="flex space-x-2 mt-4">
                                <Button variant="outline" className="flex-1 text-sm" onClick={() => handleStudyDeck(deck)} disabled={isLoading}>
                                    Estudar Deck
                                </Button>
                                {/* Botão de Excluir Deck */}
                                <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    onClick={() => handleDeleteDeck(deck.nameDeck)}
                                    disabled={isLoading}
                                    className="hover:bg-red-700"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )) : !isLoading && !error && <p className="text-foreground/70 col-span-full p-4 border rounded-md">Nenhum deck encontrado.</p>}
            </div>
        </div>
    );
};