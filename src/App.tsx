import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Menu, 
  User, 
  Paperclip,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  LogOut,
  Lock
} from 'lucide-react';

// --- CONFIGURAÇÃO DO FIREBASE ---
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc,
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAa5xou6StKEAweWFk6T4WXF4xRFYp98tU",
  authDomain: "ouvidapp-f3b21.firebaseapp.com",
  projectId: "ouvidapp-f3b21",
  storageBucket: "ouvidapp-f3b21.firebasestorage.app",
  messagingSenderId: "751555492516",
  appId: "1:751555492516:web:2f21f0deb51495cfae0431",
  measurementId: "G-ZCLXFV3X1Z"
};

// Inicialização segura
let db: any;
let auth: any;

try {
  if (firebaseConfig.apiKey) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  }
} catch (error) {
  console.error("Erro ao inicializar Firebase:", error);
}

// --- Interfaces ---
interface Manifestation {
  id: string;
  nup: string;
  title: string;
  description: string;
  origin: string;
  responsible: string;
  status: string;
  date: string;
  createdAt?: any;
}

interface BadgeProps {
  status?: string;
  origin?: string;
}

// --- Componentes Visuais ---

const StatusBadge = ({ status }: BadgeProps) => {
  const styles: any = {
    'Aberto': 'bg-red-100 text-red-700 border border-red-200',
    'Em Andamento': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    'Fechado': 'bg-green-100 text-green-700 border border-green-200',
    'Aguardando Resposta': 'bg-blue-100 text-blue-700 border border-blue-200',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status || ''] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};

const OriginBadge = ({ origin }: BadgeProps) => {
  const styles: any = {
    'SEI': 'bg-blue-50 text-blue-600 border border-blue-200',
    'Fala.Br': 'bg-green-50 text-green-600 border border-green-200',
    'SAT': 'bg-purple-50 text-purple-600 border border-purple-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${styles[origin || ''] || 'bg-gray-100'}`}>
      {origin}
    </span>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center space-x-4 transition-transform hover:scale-105">
    <div className={`p-3 rounded-lg ${color} shadow-sm`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
  </div>
);

// --- TELA DE LOGIN ---
const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!auth) {
      setError('Erro de configuração do Firebase.');
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      setError('Email ou senha incorretos. Verifique no Firebase Authentication.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200 mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Acesso OuvidApp</h1>
          <p className="text-gray-500 text-center mt-2">Entre com as credenciais da equipe para acessar o sistema.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="ex: equipe@ouvidapp.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Sua senha"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-70"
          >
            {loading ? 'Entrando...' : 'Acessar Sistema'}
          </button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-6">
          Se não tiver acesso, contate o administrador do sistema.
        </p>
      </div>
    </div>
  );
};

// --- App Principal ---

export default function OuvidApp() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [manifestations, setManifestations] = useState<Manifestation[]>([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  const [formData, setFormData] = useState({
    nup: '',
    title: '',
    description: '',
    origin: 'SEI',
    responsible: '',
    status: 'Aberto'
  });

  // --- Auth Listener ---
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Lógica do Firebase Data ---

  useEffect(() => {
    if (!db || !user) { // Só carrega dados se tiver usuário logado
      setLoading(false);
      return;
    }

    const q = query(collection(db, "manifestacoes"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot: any) => {
      const docs: Manifestation[] = [];
      querySnapshot.forEach((doc: any) => {
        docs.push({ ...doc.data(), id: doc.id });
      });
      setManifestations(docs);
      setLoading(false);
      setIsConnected(true);
    }, (error: any) => {
      console.error("Erro de conexão:", error);
      setIsConnected(false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]); // Recarrega se o usuário mudar

  // --- FUNÇÃO EXPORTAR EXCEL (CSV) ---
  const exportToExcel = () => {
    if (manifestations.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    // Cabeçalho do CSV
    const headers = ["NUP,Título,Origem,Status,Responsável,Data,Descrição"];
    
    // Linhas de dados
    const rows = manifestations.map(m => {
      // Tratamento para evitar que vírgulas no texto quebrem o CSV
      const cleanDescription = (m.description || '').replace(/(\r\n|\n|\r)/gm, " ").replace(/"/g, '""');
      const cleanTitle = (m.title || '').replace(/,/g, " ");
      
      return `${m.nup},"${cleanTitle}",${m.origin},${m.status},${m.responsible},${m.date},"${cleanDescription}"`;
    });

    const csvContent = [headers, ...rows].join("\n");
    
    // Criação do arquivo para download
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `manifestacoes_ouvidapp_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    if (auth) signOut(auth);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    try {
      await addDoc(collection(db, "manifestacoes"), {
        ...formData,
        date: new Date().toLocaleDateString('pt-BR'),
        createdAt: serverTimestamp()
      });
      
      setFormData({ nup: '', title: '', description: '', origin: 'SEI', responsible: '', status: 'Aberto' });
      navigateTo('list');
      alert("✅ Salvo no Banco de Dados!"); 
    } catch (e) {
      console.error("Erro ao adicionar: ", e);
      alert("Erro ao salvar.");
    }
  };

  const handleDelete = async (id: string, e: any) => {
    e.stopPropagation();
    if (!db) return;
    if (window.confirm("Tem certeza que deseja excluir este registro?")) {
      try {
        await deleteDoc(doc(db, "manifestacoes", id));
      } catch (error) {
        console.error("Erro ao deletar:", error);
      }
    }
  };

  const navigateTo = (view: string) => setCurrentView(view);

  const stats = useMemo(() => {
    return {
      total: manifestations.length,
      abertas: manifestations.filter(m => m.status === 'Aberto').length,
      andamento: manifestations.filter(m => m.status === 'Em Andamento').length,
      concluidas: manifestations.filter(m => m.status === 'Fechado').length,
    };
  }, [manifestations]);

  const filteredList = manifestations.filter(item => 
    (item.nup?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item.responsible?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Se estiver carregando autenticação, mostra tela branca
  if (authLoading) return <div className="h-screen flex items-center justify-center">Carregando sistema...</div>;

  // Se não tiver usuário, mostra tela de Login
  if (!user) return <LoginScreen />;

  // Se logado, mostra o App
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* Menu Lateral */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10 hidden md:flex shadow-[2px_0_20px_rgba(0,0,0,0.03)]">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-200">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-gray-800 tracking-tight">OuvidApp</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => navigateTo('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all font-medium ${currentView === 'dashboard' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>

          <button 
            onClick={() => navigateTo('list')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all font-medium ${currentView === 'list' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <FileText className="w-5 h-5" />
            <span>Manifestações</span>
          </button>
          
          <div className="pt-4 px-2">
            <button 
              onClick={() => navigateTo('form')}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all transform active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Nova Manifestação</span>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="mb-4 flex items-center gap-2 px-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span className="truncate w-32">{user.email}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 ml-0 md:ml-64">
        
        {/* Cabeçalho Mobile */}
        <div className="md:hidden mb-6 flex items-center justify-between">
           <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">OuvidApp</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={handleLogout} className="p-2 text-red-600"><LogOut className="w-6 h-6" /></button>
            <button className="p-2 text-gray-600"><Menu className="w-6 h-6" /></button>
          </div>
        </div>

        {/* --- DASHBOARD --- */}
        {currentView === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Visão Geral</h2>
              <p className="text-gray-500 mt-1">Acompanhamento em tempo real</p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-gray-500">Carregando dados...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total" value={stats.total} icon={FileText} color="bg-indigo-500" />
                  <StatCard title="Abertas" value={stats.abertas} icon={AlertCircle} color="bg-red-500" />
                  <StatCard title="Em Andamento" value={stats.andamento} icon={Clock} color="bg-yellow-500" />
                  <StatCard title="Concluídas" value={stats.concluidas} icon={CheckCircle2} color="bg-green-500" />
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Últimos Registros</h3>
                    <button onClick={() => navigateTo('list')} className="text-sm text-indigo-600 hover:underline font-medium">Ver todas</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-xs">
                        <tr>
                          <th className="px-6 py-3 font-semibold">NUP</th>
                          <th className="px-6 py-3 font-semibold">Título</th>
                          <th className="px-6 py-3 font-semibold">Origem</th>
                          <th className="px-6 py-3 font-semibold">Status</th>
                          <th className="px-6 py-3 font-semibold">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {manifestations.slice(0, 5).map((m) => (
                          <tr key={m.id} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900">{m.nup}</td>
                            <td className="px-6 py-4 text-gray-600 font-medium">{m.title}</td>
                            <td className="px-6 py-4"><OriginBadge origin={m.origin} /></td>
                            <td className="px-6 py-4"><StatusBadge status={m.status} /></td>
                            <td className="px-6 py-4 text-gray-500">{m.date}</td>
                          </tr>
                        ))}
                        {manifestations.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                              Vazio
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* --- LISTA --- */}
        {currentView === 'list' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Manifestações</h2>
                <p className="text-gray-500">{filteredList.length} registros</p>
              </div>
              <div className="flex gap-2">
                 <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm font-medium">
                   <Filter className="w-4 h-4" /> Filtros
                 </button>
                 {/* BOTÃO EXCEL FUNCIONANDO AGORA */}
                 <button onClick={exportToExcel} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm shadow-green-200 font-medium transition-colors">
                   <Download className="w-4 h-4" /> Excel
                 </button>
                 <button onClick={() => navigateTo('form')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-sm shadow-indigo-200 font-medium transition-colors">
                   <Plus className="w-4 h-4" /> Nova
                 </button>
              </div>
            </div>

            <div className="bg-white p-2 rounded-xl border border-gray-200 flex items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
              <Search className="w-5 h-5 text-gray-400 ml-2" />
              <input 
                type="text"
                placeholder="Buscar..."
                className="flex-1 p-2 outline-none text-gray-700 bg-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="text-center p-10 text-gray-500">Carregando...</div>
            ) : (
              <div className="space-y-3">
                {filteredList.map((item) => (
                  <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all flex flex-col md:flex-row md:items-center gap-5 group relative">
                    <div className="p-3 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                      <FileText className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="font-bold text-gray-900 text-lg">{item.nup}</span>
                        <OriginBadge origin={item.origin} />
                        <StatusBadge status={item.status} />
                      </div>
                      <h3 className="text-gray-800 font-medium mb-2">{item.title}</h3>
                      <div className="text-sm text-gray-500 flex flex-wrap gap-x-6 gap-y-2">
                        <span className="flex items-center gap-1"><User className="w-3 h-3"/> {item.responsible || 'Não atribuído'}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {item.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-2 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button className="p-2 bg-gray-50 rounded-full text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredList.length === 0 && (
                   <div className="text-center p-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                     Nenhum registro encontrado.
                   </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- FORMULÁRIO --- */}
        {currentView === 'form' && (
          <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Nova Manifestação</h2>
                <p className="text-gray-500">Preencha os dados</p>
              </div>
              <button onClick={() => navigateTo('dashboard')} className="text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg border border-gray-200 bg-white transition-colors font-medium">
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded">1</span> Informações Básicas
                </h3>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">NUP <span className="text-red-500">*</span></label>
                    <input 
                      required
                      name="nup"
                      value={formData.nup}
                      onChange={handleInputChange}
                      placeholder="Ex: 2024-0001" 
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Título <span className="text-red-500">*</span></label>
                    <input 
                      required
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Assunto" 
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição <span className="text-red-500">*</span></label>
                    <textarea 
                      required
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Detalhamento..." 
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Origem</label>
                      <div className="relative">
                        <select 
                          name="origin"
                          value={formData.origin}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-200 rounded-lg outline-none bg-white focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                        >
                          <option>SEI</option>
                          <option>Fala.Br</option>
                          <option>SAT</option>
                        </select>
                        <div className="absolute right-3 top-3.5 pointer-events-none">
                          <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Responsável</label>
                      <div className="relative">
                        <User className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                        <input 
                          name="responsible"
                          value={formData.responsible}
                          onChange={handleInputChange}
                          placeholder="Nome" 
                          className="w-full pl-10 p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                   <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded">2</span> Anexos
                </h3>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center text-gray-500 hover:bg-indigo-50 hover:border-indigo-400 transition-all cursor-pointer group">
                  <div className="bg-gray-100 p-4 rounded-full mb-3 group-hover:bg-indigo-100 transition-colors">
                    <Paperclip className="w-6 h-6 text-gray-500 group-hover:text-indigo-600" />
                  </div>
                  <p className="font-medium text-gray-700">Clique para adicionar arquivos</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                 <button type="button" onClick={() => navigateTo('list')} className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                   Cancelar
                 </button>
                 <button type="submit" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transform active:scale-95 transition-all">
                   Salvar
                 </button>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}
