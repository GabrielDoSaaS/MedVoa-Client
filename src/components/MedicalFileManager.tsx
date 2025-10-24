import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  FolderPlus, 
  FileText, 
  Folder, 
  Upload, 
  Search, 
  MoreVertical,
  Download,
  Trash2,
  Edit3,
  ArrowLeft
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { FeatureBlocker } from "@/components/ui/feature-blocker";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";

interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size?: string;
  modifiedAt: string;
  children?: FileItem[];
}

interface MedicalFileManagerProps {
  onUpgrade?: () => void;
}

export const MedicalFileManager = ({ onUpgrade }: MedicalFileManagerProps = {}) => {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [user, setUser] = useState(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [renameItem, setRenameItem] = useState<FileItem | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<FileItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { subscription, canUseSpecialFeature } = useSubscription(user);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Estrutura de arquivos vazia para contas novas
  const [fileStructure, setFileStructure] = useState<FileItem[]>([]);

  // Função para calcular o uso total de armazenamento
  const calculateTotalStorage = (items: FileItem[]): number => {
    let total = 0;
    items.forEach(item => {
      if (item.type === 'file' && item.size) {
        const sizeNumber = parseFloat(item.size.replace(' MB', ''));
        total += sizeNumber;
      } else if (item.type === 'folder' && item.children) {
        total += calculateTotalStorage(item.children);
      }
    });
    return total;
  };

  const totalStorageUsed = calculateTotalStorage(fileStructure);
  const maxStorage = 15; // 15 GB
  const storagePercentage = Math.min((totalStorageUsed / (maxStorage * 1024)) * 100, 100);

  const getCurrentItems = (): FileItem[] => {
    let current = fileStructure;
    for (const pathSegment of currentPath) {
      const folder = current.find(item => item.name === pathSegment && item.type === 'folder');
      if (folder?.children) {
        current = folder.children;
      } else {
        return [];
      }
    }
    return current;
  };

  const navigateToFolder = (folderName: string) => {
    setCurrentPath([...currentPath, folderName]);
  };

  const navigateBack = () => {
    setCurrentPath(currentPath.slice(0, -1));
  };

  const navigateToRoot = () => {
    setCurrentPath([]);
  };

  const filteredItems = getCurrentItems().filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpgradeRedirect = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Dispatch custom event to navigate to subscription plans
      window.dispatchEvent(new CustomEvent('navigate-to-subscription'));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = event.target.files;
      if (!files || files.length === 0) {
        return;
      }

      const file = files[0];
      
      // Validate file
      if (!file.name) {
        toast.error("Arquivo inválido");
        return;
      }

      const newFile: FileItem = {
        id: Date.now().toString(),
        name: file.name,
        type: 'file',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        modifiedAt: new Date().toISOString().split('T')[0]
      };

      // Simple state update - add file to current folder
      setFileStructure(prev => {
        const newStructure = [...prev];
        
        if (currentPath.length === 0) {
          // Add to root
          newStructure.push(newFile);
        } else {
          // Navigate to current folder and add file
          let current = newStructure;
          for (const pathSegment of currentPath) {
            const folder = current.find(item => item.name === pathSegment && item.type === 'folder');
            if (folder?.children) {
              current = folder.children;
            } else {
              // Folder not found, add to root instead
              newStructure.push(newFile);
              return newStructure;
            }
          }
          current.push(newFile);
        }
        
        return newStructure;
      });

      toast.success(`Arquivo "${file.name}" foi enviado com sucesso!`);
      
      // Reset input
      if (event.target) {
        event.target.value = '';
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error("Erro ao fazer upload do arquivo");
    }
  };

  const handleCreateFolder = () => {
    setIsCreateFolderOpen(true);
  };

  const handleCreateFolderConfirm = () => {
    if (newFolderName && newFolderName.trim()) {
      const newFolder: FileItem = {
        id: Date.now().toString(),
        name: newFolderName.trim(),
        type: 'folder',
        modifiedAt: new Date().toISOString().split('T')[0],
        children: []
      };

      setFileStructure(prev => {
        const newStructure = [...prev];
        let current = newStructure;
        
        // Navigate to current folder
        for (const pathSegment of currentPath) {
          const folder = current.find(item => item.name === pathSegment && item.type === 'folder');
          if (folder?.children) {
            current = folder.children;
          }
        }
        
        current.push(newFolder);
        return newStructure;
      });

      toast.success(`Pasta "${newFolderName}" foi criada com sucesso!`);
      setIsCreateFolderOpen(false);
      setNewFolderName("");
    }
  };

  const handleCreateFolderCancel = () => {
    setIsCreateFolderOpen(false);
    setNewFolderName("");
  };

  const handleDownload = (item: FileItem) => {
    if (item.type === 'file') {
      // Simular download do arquivo
      const link = document.createElement('a');
      link.href = '#'; // Em uma implementação real, seria a URL do arquivo
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Download de "${item.name}" iniciado!`);
    }
  };

  const handleRename = (item: FileItem) => {
    setRenameItem(item);
    setNewItemName(item.name);
    setIsRenameDialogOpen(true);
  };

  const handleRenameConfirm = () => {
    if (renameItem && newItemName && newItemName.trim() && newItemName !== renameItem.name) {
      setFileStructure(prev => {
        const updateItemInStructure = (items: FileItem[]): FileItem[] => {
          return items.map(currentItem => {
            if (currentItem.id === renameItem.id) {
              return { ...currentItem, name: newItemName.trim() };
            }
            if (currentItem.children) {
              return { ...currentItem, children: updateItemInStructure(currentItem.children) };
            }
            return currentItem;
          });
        };
        
        return updateItemInStructure(prev);
      });
      
      toast.success(`${renameItem.type === 'folder' ? 'Pasta' : 'Arquivo'} renomeado para "${newItemName}"`);
    }
    setIsRenameDialogOpen(false);
    setRenameItem(null);
    setNewItemName("");
  };

  const handleRenameCancel = () => {
    setIsRenameDialogOpen(false);
    setRenameItem(null);
    setNewItemName("");
  };

  const handleDelete = (item: FileItem) => {
    setDeleteItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteItem) {
      setFileStructure(prev => {
        const removeItemFromStructure = (items: FileItem[]): FileItem[] => {
          return items.filter(currentItem => {
            if (currentItem.id === deleteItem.id) {
              return false;
            }
            if (currentItem.children) {
              currentItem.children = removeItemFromStructure(currentItem.children);
            }
            return true;
          });
        };
        
        return removeItemFromStructure(prev);
      });
      
      toast.success(`${deleteItem.type === 'folder' ? 'Pasta' : 'Arquivo'} "${deleteItem.name}" foi excluído!`);
    }
    setIsDeleteDialogOpen(false);
    setDeleteItem(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setDeleteItem(null);
  };

  // Check if user can access file manager
  const canUseFileManager = canUseSpecialFeature('file_manager');

  return (
    <div className={`glass-card h-full ${!canUseFileManager ? 'overflow-hidden' : ''}`}>
      {!canUseFileManager ? (
        <FeatureBlocker
          title="Organização Premium"
          description="Organize, gerencie e armazene seus arquivos médicos com segurança. Disponível apenas no plano Premium."
          onUpgrade={handleUpgradeRedirect}
        >
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="glow-icon w-12 h-12 flex items-center justify-center relative">
                  <Folder className="w-5 h-5 text-white z-10 relative" />
                </div>
                <h2 className="text-lg font-bold gradient-text">Organização de Arquivos</h2>
              </div>
              
              <div className="flex space-x-1">
                <Button 
                  size="sm" 
                  className="btn-glow h-8 px-3"
                  disabled
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Upload
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 px-3"
                  disabled
                >
                  <FolderPlus className="w-3 h-3 mr-1" />
                  Nova Pasta
                </Button>
              </div>
            </div>

            {/* Sample content to be blurred */}
            <div className="mb-3">
              <Input
                placeholder="Buscar arquivos e pastas..."
                value=""
                disabled
                className="pl-9 h-8 text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="stats-card p-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Folder className="w-4 h-4 text-primary" />
                  <span className="text-sm">Documentos Médicos</span>
                </div>
              </div>
              <div className="stats-card p-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm">Relatório_Paciente_001.pdf</span>
                </div>
              </div>
            </div>
          </div>
        </FeatureBlocker>
      ) : (
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="glow-icon w-12 h-12 flex items-center justify-center relative">
                <Folder className="w-5 h-5 text-white z-10 relative" />
              </div>
              <h2 className="text-lg font-bold gradient-text">Organização de Arquivos</h2>
            </div>
            
            <div className="flex space-x-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                multiple={false}
              />
              <Button 
                size="sm" 
                className="btn-glow h-8 px-3"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-3 h-3 mr-1" />
                Upload
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 px-3"
                onClick={handleCreateFolder}
              >
                <FolderPlus className="w-3 h-3 mr-1" />
                Nova Pasta
              </Button>
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          <div className="flex items-center space-x-1 mb-3 text-xs">
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateToRoot}
              className="text-primary hover:text-primary/80 h-6 px-2"
            >
              Início
            </Button>
            {currentPath.map((path, index) => (
              <div key={index} className="flex items-center space-x-1">
                <span className="text-muted-foreground">/</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                  className="text-primary hover:text-primary/80 h-6 px-2"
                >
                  {path}
                </Button>
              </div>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3" />
            <Input
              placeholder="Buscar arquivos e pastas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>

          {/* File List */}
          <ScrollArea className="h-[430px]">
            <div className="space-y-1">
              {/* Back Button */}
              {currentPath.length > 0 && (
                <div className="mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={navigateBack}
                    className="justify-start h-8 px-3 bg-primary/20 hover:bg-primary/30 text-white border-primary/30"
                  >
                    <ArrowLeft className="w-3 h-3 mr-2" />
                    Voltar
                  </Button>
                </div>
              )}

              {/* Items */}
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="stats-card group cursor-pointer hover:bg-primary/5 transition-all p-2 rounded-lg"
                  onClick={item.type === 'folder' ? () => navigateToFolder(item.name) : undefined}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                        {item.type === 'folder' ? (
                          <Folder className="w-3 h-3 text-primary" />
                        ) : (
                          <FileText className="w-3 h-3 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate text-sm">{item.name}</p>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <span>{item.modifiedAt}</span>
                          {item.size && (
                            <>
                              <span>•</span>
                              <span>{item.size}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0">
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {item.type === 'file' && (
                          <DropdownMenuItem onClick={() => handleDownload(item)}>
                            <Download className="w-3 h-3 mr-2" />
                            Download
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleRename(item)}>
                          <Edit3 className="w-3 h-3 mr-2" />
                          Renomear
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item)}>
                          <Trash2 className="w-3 h-3 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}

              {filteredItems.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    {searchTerm ? "Nenhum arquivo encontrado" : "Pasta vazia"}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Storage Info */}
          <div className="stats-card mt-3 bg-primary/5 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-primary text-sm">Armazenamento Usado</p>
                <p className="text-xs text-muted-foreground">
                  {totalStorageUsed >= 1024 
                    ? `${(totalStorageUsed / 1024).toFixed(1)} GB` 
                    : `${totalStorageUsed.toFixed(1)} MB`
                  } de {maxStorage} GB
                </p>
                {/* Barra de progresso */}
                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${storagePercentage}%` }}
                  ></div>
                </div>
              </div>
              <Badge className="bg-primary/10 text-primary text-xs">Premium</Badge>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Dialog */}
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <FolderPlus className="w-4 h-4 text-primary" />
              </div>
              Nova Pasta
            </DialogTitle>
            <DialogDescription>
              Digite o nome da nova pasta que será criada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Nome da pasta</Label>
              <Input
                id="folder-name"
                placeholder="Ex: Documentos Médicos"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFolderName.trim()) {
                    handleCreateFolderConfirm();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCreateFolderCancel}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleCreateFolderConfirm}
              disabled={!newFolderName.trim()}
              className="btn-glow"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Criar Pasta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Edit3 className="w-4 h-4 text-primary" />
              </div>
              Renomear {renameItem?.type === 'folder' ? 'Pasta' : 'Arquivo'}
            </DialogTitle>
            <DialogDescription>
              Digite o novo nome para {renameItem?.type === 'folder' ? 'a pasta' : 'o arquivo'} "{renameItem?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Novo nome</Label>
              <Input
                id="item-name"
                placeholder="Digite o novo nome"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newItemName.trim()) {
                    handleRenameConfirm();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleRenameCancel}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleRenameConfirm}
              disabled={!newItemName.trim() || newItemName === renameItem?.name}
              className="btn-glow"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Renomear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-destructive" />
              </div>
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir {deleteItem?.type === 'folder' ? 'a pasta' : 'o arquivo'} "{deleteItem?.name}"?
              {deleteItem?.type === 'folder' && (
                <span className="block mt-1 text-destructive text-sm">
                  Esta ação irá excluir todos os arquivos dentro da pasta.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleDeleteCancel}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};