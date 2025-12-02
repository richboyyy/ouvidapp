import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  User, 
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  LogOut,
  Lock,
  MessageSquare,
  Send,
  History,
  ChevronLeft,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  UserCog,
  UserPlus,
  Settings,
  X,
  Edit
} from 'lucide-react';

// --- BIBLIOTECAS DE GRÁFICOS ---
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend 
} from 'recharts';

// --- FIREBASE ---
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
  serverTimestamp,
  updateDoc,
  arrayUnion,
  setDoc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

// --- CONFIGURAÇÃO ---
const firebaseConfig = {
  apiKey: "AIzaSyAa5xou6StKEAweWFk6T4WXF4xRFYp98tU",
  authDomain: "ouvidapp-f3b21.firebaseapp.com",
  projectId: "ouvidapp-f3b21",
  storageBucket: "ouvidapp-f3b21.firebasestorage.app",
  messagingSenderId: "751555492516",
  appId: "1:751555492516:web:2f21f0deb51495cfae0431",
  measurementId: "G-ZCLXFV3X1Z"
};

let db: any;
let auth: any;

try {
  if (firebaseConfig.apiKey) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  }
} catch (error) {
  console.error("Erro Firebase:", error);
}

// --- INTERFACES ---
interface TimelineEvent {
  date: string;
  action: string;
  user: string;
}

interface Comment {
  id: string;
  text: string;
  user: string;
  createdAt: any;
  dateString: string;
}

interface Manifestation {
  id: string;
  nup: string;
  title: string;
  description: string;
  origin: string;
  responsible: string;
  status: string;
  date: string;
  deadline?: string; 
  createdAt?: any;
  timeline?: TimelineEvent[];
}

interface SystemUser {
  id: string;
  email: string;
  role: string;
  username?: string;
}

// --- COMPONENTES AUXILIARES ---

const getDeadlineStatus = (deadline?: string, status?: string) => {
  if (!deadline || status === 'Fechado') return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline + 'T00:00:00'); 
  
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { color: 'bg-red-100 text-red-700 border-red-200', label: 'Atrasado', icon: AlertCircle, key: 'expired' };
  if (diffDays <= 3) return { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Atenção', icon: AlertTriangle, key: 'warning' };
  return { color: 'bg-green-100 text-green-700 border-green-200', label: 'No prazo', icon: CheckCircle2, key: 'ok' };
};

const StatusBadge = ({ status }: { status?: string }) => {
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

const OriginBadge = ({ origin }: { origin?: string }) => {
  const styles: any = {
    'SEI': 'bg-blue-50 text-blue-600 border border-blue-200',
    'Fala.Br': 'bg-green-50 text-green-600 border border-green-200',
    'SAT': 'bg-purple-50 text-purple-600 border border-purple-200',
    'E-mail': 'bg-orange-50 text-orange-600 border border-orange-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${styles[origin || ''] || 'bg-gray-100'}`}>
      {origin}
    </span>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center space-x-4 transition-transform hover:scale-105 w-full">
    <div className={`p-3 rounded-lg ${color} shadow-sm`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
  </div>
);

// --- TELA DE LOGIN / CADASTRO ---
const LoginScreen = () => {
  const [isRegistering, setIsRegistering] = useState(false); 
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const FAKE_DOMAIN = "@ouvidapp.local";

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!auth) {
      setError('Erro de configuração.');
      setLoading(false);
      return;
    }

    const emailCompleto = username.trim().toLowerCase() + FAKE_DOMAIN;

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, emailCompleto, password);
        if (db) {
          await setDoc(doc(db, 'users', userCredential.user.uid), { 
            email: emailCompleto, 
            username: username, 
            role: 'user' 
          });
        }
      } else {
        await signInWithEmailAndPassword(auth, emailCompleto, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError('Este usuário já existe.');
      else if (err.code === 'auth/weak-password') setError('A senha deve ter pelo menos 6 caracteres.');
      else if (err.code === 'auth/invalid-email') setError('Nome de usuário inválido.');
      else setError('Usuário ou senha incorretos.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200 mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isRegistering ? 'Criar Nova Conta' : 'Acesso OuvidApp'}
          </h1>
          <p className="text-gray-500 text-center mt-2">
            {isRegistering ? 'Crie seu usuário para acessar' : 'Entre com seu usuário e senha'}
          </p>
        </div>

        <form onSubmit={handleAuthAction} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Usuário</label>
            <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input 
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder=""
                />
            </div>
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
            {loading ? 'Processando...' : (isRegistering ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>

        <div className="mt-6 text-center pt-4 border-t border-gray-100">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center justify-center gap-2 w-full"
          >
            {isRegistering ? (
              <>Já tem usuário? Faça login</>
            ) : (
              <><UserPlus className="w-4 h-4" /> Criar novo usuário</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---

export default function OuvidApp() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('user'); 
  const [authLoading, setAuthLoading] = useState(true);
  
  const [currentView, setCurrentView] = useState('dashboard'); 
  const [selectedManifestation, setSelectedManifestation] = useState<Manifestation | null>(null);
  
  const [manifestations, setManifestations] = useState<Manifestation[]>([]); 
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtros
  const [filterOrigin, setFilterOrigin] = useState('');
  const [filterResponsible, setFilterResponsible] = useState('');
  const [filterDeadlineStatus, setFilterDeadlineStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modo de Edição
  const [isEditing, setIsEditing] = useState(false);
  
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]); 

  const [formData, setFormData] = useState({
    nup: '',
    title: '',
    description: '',
    origin: 'SEI',
    responsible: '',
    status: 'Aberto',
    deadline: ''
  });

  const getUserDisplay = (email: string) => {
      return email ? email.split('@')[0] : 'Usuário';
  }

  // --- AUTH & PERMISSÕES ---
  useEffect(() => {
    if (!auth) { setAuthLoading(false); return; }
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        } else {
          await setDoc(doc(db, 'users', u.uid), { email: u.email, role: 'user' });
          setUserRole('user');
        }
      }
      setAuthLoading(false);
    });
  }, []);

  // --- DATA FETCHING ---
  useEffect(() => {
    if (!db || !user) { setLoading(false); return; }
    const q = query(collection(db, "manifestacoes"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot: any) => {
      const docs: Manifestation[] = [];
      snapshot.forEach((doc: any) => docs.push({ ...doc.data(), id: doc.id }));
      setManifestations(docs);
      setLoading(false);
    });
  }, [user]);

  // Carregar Usuários do Sistema
  useEffect(() => {
    if (!db) return;
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersList: SystemUser[] = [];
      querySnapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() } as SystemUser);
      });
      setSystemUsers(usersList);
    };
    fetchUsers();
  }, [user]); 

  useEffect(() => {
    if (!db || !selectedManifestation) {
      setComments([]);
      return;
    }
    const q = query(
      collection(db, "manifestacoes", selectedManifestation.id, "comments"), 
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot: any) => {
      const docs: Comment[] = [];
      snapshot.forEach((doc: any) => docs.push({ ...doc.data(), id: doc.id }));
      setComments(docs);
    });
  }, [selectedManifestation]);


  // --- ACTIONS ---

  const handleChangeRole = async (userId: string, currentRole: string) => {
    if (userRole !== 'admin') return;
    if (!window.confirm(`Deseja alterar a função deste usuário para ${currentRole === 'admin' ? 'USER' : 'ADMIN'}?`)) return;
    
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setSystemUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      alert("Perfil alterado com sucesso!");
    } catch (e) {
      console.error("Erro ao alterar perfil:", e);
      alert("Erro ao alterar perfil.");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedManifestation) return;
    try {
      await addDoc(collection(db, "manifestacoes", selectedManifestation.id, "comments"), {
        text: newComment,
        user: getUserDisplay(user.email), 
        createdAt: serverTimestamp(),
        dateString: new Date().toLocaleString('pt-BR')
      });
      setNewComment('');
    } catch (e) { console.error(e); }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedManifestation) return;
    try {
      const timelineEvent: TimelineEvent = {
        date: new Date().toLocaleString('pt-BR'),
        action: `Status alterado para ${newStatus}`,
        user: getUserDisplay(user.email)
      };
      await updateDoc(doc(db, "manifestacoes", selectedManifestation.id), {
        status: newStatus,
        timeline: arrayUnion(timelineEvent)
      });
      setSelectedManifestation(prev => prev ? {...prev, status: newStatus} : null);
    } catch (e) { console.error(e); }
  };

  // -- EDIÇÃO DE MANIFESTAÇÃO --
  const handleEditClick = () => {
    if (!selectedManifestation) return;
    setFormData({
      nup: selectedManifestation.nup,
      title: selectedManifestation.title,
      description: selectedManifestation.description,
      origin: selectedManifestation.origin,
      responsible: selectedManifestation.responsible,
      status: selectedManifestation.status,
      deadline: selectedManifestation.deadline || ''
    });
    setIsEditing(true);
    setCurrentView('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    
    try {
      if (isEditing && selectedManifestation) {
        // ATUALIZAÇÃO
        const timelineEvent: TimelineEvent = {
            date: new Date().toLocaleString('pt-BR'),
            action: 'Manifestação editada por admin',
            user: getUserDisplay(user.email)
        };

        await updateDoc(doc(db, "manifestacoes", selectedManifestation.id), {
            ...formData,
            timeline: arrayUnion(timelineEvent)
        });
        alert("✅ Atualizado com sucesso!");
        setIsEditing(false);
        setSelectedManifestation(null);
        setCurrentView('list');

      } else {
        // CRIAÇÃO
        const timelineInitial: TimelineEvent = {
            date: new Date().toLocaleString('pt-BR'),
            action: 'Manifestação criada',
            user: getUserDisplay(user.email)
        };
        await addDoc(collection(db, "manifestacoes"), {
            ...formData,
            date: new Date().toLocaleDateString('pt-BR'),
            createdAt: serverTimestamp(),
            timeline: [timelineInitial]
        });
        alert("✅ Criado com sucesso!");
        setCurrentView('list');
      }
      
      // Reset form
      setFormData({ nup: '', title: '', description: '', origin: 'SEI', responsible: '', status: 'Aberto', deadline: '' });

    } catch (e) { alert("Erro ao salvar."); }
  };

  const handleDelete = async (id: string, e: any) => {
    e.stopPropagation();
    if (!db) return;
    if (userRole !== 'admin') {
      alert("Apenas administradores podem excluir registros.");
      return;
    }
    if (window.confirm("TEM CERTEZA? Essa ação não pode ser desfeita.")) {
      try { await deleteDoc(doc(db, "manifestacoes", id)); } catch (error) { console.error(error); }
    }
  };

  const exportToExcel = () => {
    if (manifestations.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }
    const headers = ["NUP;Título;Origem;Status;Responsável;Data;Descrição"];
    const rows = manifestations.map(m => {
      const cleanDescription = (m.description || '').replace(/(\r\n|\n|\r)/gm, " ").replace(/"/g, '""');
      const cleanTitle = (m.title || '').replace(/(\r\n|\n|\r)/gm, " ").replace(/"/g, '""');
      return `"${m.nup}";"${cleanTitle}";"${m.origin}";"${m.status}";"${m.responsible}";"${m.date}";"${cleanDescription}"`;
    });
    const csvContent = "\ufeff" + [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `manifestacoes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- FILTRO MASTER ---
  const getFilteredManifestations = () => {
    return manifestations.filter(item => {
      const matchesSearch = 
        (item.nup?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.title?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      const matchesOrigin = filterOrigin ? item.origin === filterOrigin : true;
      const matchesResponsible = filterResponsible ? item.responsible === filterResponsible : true;

      let matchesDeadline = true;
      if (filterDeadlineStatus) {
        const status = getDeadlineStatus(item.deadline, item.status);
        matchesDeadline = status?.key === filterDeadlineStatus;
      }

      return matchesSearch && matchesOrigin && matchesResponsible && matchesDeadline;
    });
  };

  const filteredList = getFilteredManifestations();

  // Ordena as manifestações FILTRADAS por prazo para a tabela de vencimentos
  const sortedByDeadline = [...filteredList]
    .filter(m => m.deadline && m.status !== 'Fechado') 
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());


  // --- CALCULOS ---
  const stats = useMemo(() => {
    return {
      total: manifestations.length,
      abertas: manifestations.filter(m => m.status === 'Aberto').length,
      andamento: manifestations.filter(m => m.status === 'Em Andamento').length,
      concluidas: manifestations.filter(m => m.status === 'Fechado').length,
    };
  }, [manifestations]);

  // Dados para o Gráfico de Status
  const pieData = [
    { name: 'Aberto', value: stats.abertas, color: '#ef4444' },
    { name: 'Andamento', value: stats.andamento, color: '#eab308' },
    { name: 'Fechado', value: stats.concluidas, color: '#22c55e' },
  ].filter(d => d.value > 0);

  // Dados para o Gráfico de ORIGEM (AGORA EM PIZZA)
  const originData = [
    { name: 'SEI', value: manifestations.filter(m => m.origin === 'SEI').length, color: '#3b82f6' }, 
    { name: 'Fala.Br', value: manifestations.filter(m => m.origin === 'Fala.Br').length, color: '#22c55e' }, 
    { name: 'SAT', value: manifestations.filter(m => m.origin === 'SAT').length, color: '#a855f7' },
    { name: 'E-mail', value: manifestations.filter(m => m.origin === 'E-mail').length, color: '#f97316' }, 
  ].filter(d => d.value > 0);


  if (authLoading) return <div className="h-screen w-screen flex items-center justify-center bg-slate-50">Carregando...</div>;

  if (!user) return <LoginScreen />;

  // --- VIEW PRINCIPAL ---
  return (
    <div className="flex h-screen w-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex shrink-0">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg"><FileText className="w-5 h-5 text-white" /></div>
          <h1 className="text-xl font-extrabold tracking-tight">OuvidApp</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setCurrentView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentView === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button onClick={() => setCurrentView('list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentView === 'list' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <FileText className="w-5 h-5" /> Manifestações
          </button>
          <div className="pt-4"><button onClick={() => { setIsEditing(false); setFormData({ nup: '', title: '', description: '', origin: 'SEI', responsible: '', status: 'Aberto', deadline: '' }); setCurrentView('form'); }} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl shadow-lg active:scale-95 transition-all"><Plus className="w-5 h-5" /> Nova</button></div>
          
          {/* NOVA ABA CONFIGURAÇÕES */}
          {userRole === 'admin' && (
            <button onClick={() => setCurrentView('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all mt-2 ${currentView === 'settings' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Settings className="w-5 h-5" /> Configurações
            </button>
          )}
        </nav>
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className={`w-full flex items-center gap-2 mb-2 font-semibold text-xs p-2 rounded transition-colors ${userRole === 'admin' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
            {userRole === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <UserCog className="w-3 h-3" />} 
            {userRole === 'admin' ? 'Perfil: Admin' : 'Perfil: Usuário'}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4"><User className="w-4 h-4" /><span className="truncate w-32" title={getUserDisplay(user.email)}>{getUserDisplay(user.email)}</span></div>
          <button onClick={() => signOut(auth)} className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 p-2 rounded-lg text-sm font-medium"><LogOut className="w-4 h-4" /> Sair</button>
        </div>
      </aside>

      <main className="flex-1 h-full overflow-y-auto bg-slate-50 w-full">
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="md:hidden mb-6 flex items-center justify-between">
             <div className="flex items-center gap-2"><div className="bg-indigo-600 p-1.5 rounded-lg"><FileText className="w-5 h-5 text-white" /></div><h1 className="text-xl font-bold">OuvidApp</h1></div>
             <button onClick={() => signOut(auth)} className="p-2 text-red-600"><LogOut className="w-6 h-6" /></button>
          </div>

          {currentView === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-500 w-full">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                 <h2 className="text-3xl font-bold text-gray-900">Dashboard Estratégico</h2>
                 {/* BOTÃO DE FILTRO DO DASHBOARD */}
                 <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2 border text-gray-600 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm font-medium ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200'}`}
                   >
                     <Filter className="w-4 h-4" /> Filtros Globais {showFilters ? '(Ativo)' : ''}
                 </button>
              </div>

              {/* ÁREA DE FILTROS (COMPARTILHADA COM O DASHBOARD AGORA) */}
              {showFilters && (
                <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Origem</label>
                        <select 
                            className="w-full p-2 border rounded-lg text-sm"
                            value={filterOrigin}
                            onChange={e => setFilterOrigin(e.target.value)}
                        >
                            <option value="">Todas</option>
                            <option value="SEI">SEI</option>
                            <option value="Fala.Br">Fala.Br</option>
                            <option value="SAT">SAT</option>
                            <option value="E-mail">E-mail</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Responsável</label>
                        <select 
                            className="w-full p-2 border rounded-lg text-sm"
                            value={filterResponsible}
                            onChange={e => setFilterResponsible(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {systemUsers.map(u => (
                                <option key={u.id} value={getUserDisplay(u.email)}>{getUserDisplay(u.email)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Status do Prazo</label>
                        <select 
                            className="w-full p-2 border rounded-lg text-sm"
                            value={filterDeadlineStatus}
                            onChange={e => setFilterDeadlineStatus(e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="ok">No Prazo</option>
                            <option value="warning">Atenção</option>
                            <option value="expired">Atrasado</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                         <button 
                            onClick={() => { setFilterOrigin(''); setFilterResponsible(''); setFilterDeadlineStatus(''); setSearchTerm(''); }}
                            className="w-full p-2 text-red-600 border border-red-200 bg-red-50 rounded-lg text-sm hover:bg-red-100 flex items-center justify-center gap-2"
                         >
                             <X className="w-4 h-4" /> Limpar Filtros
                         </button>
                    </div>
                </div>
              )}

              {loading ? <div className="text-center py-20">Carregando...</div> : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                    <StatCard title="Total" value={stats.total} icon={FileText} color="bg-indigo-500" />
                    <StatCard title="Abertas" value={stats.abertas} icon={AlertCircle} color="bg-red-500" />
                    <StatCard title="Em Andamento" value={stats.andamento} icon={Clock} color="bg-yellow-500" />
                    <StatCard title="Concluídas" value={stats.concluidas} icon={CheckCircle2} color="bg-green-500" />
                  </div>
                  
                  {/* GRÁFICOS LADO A LADO */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {/* Gráfico de Status */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80">
                      <h3 className="font-bold text-gray-700 mb-4">Status Geral</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <RechartsTooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Gráfico de Origem (PIZZA) */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80">
                      <h3 className="font-bold text-gray-700 mb-4">Origem</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={originData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {originData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <RechartsTooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* TABELA DE PRAZOS EXPANDIDA (EMBAIXO DOS GRÁFICOS) */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 w-full">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2"><Clock className="w-4 h-4" /> Prazos a Vencer (Prioridade)</h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                      {sortedByDeadline.length > 0 ? (
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                            <tr>
                              <th className="px-4 py-3">Status Prazo</th>
                              <th className="px-4 py-3">NUP</th>
                              <th className="px-4 py-3">Título</th>
                              <th className="px-4 py-3">Origem</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Vencimento</th>
                              <th className="px-4 py-3">Responsável</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {sortedByDeadline.map((item) => {
                              const status = getDeadlineStatus(item.deadline, item.status);
                              // Aplica o filtro de prazo visualmente aqui também
                              if (filterDeadlineStatus && status?.key !== filterDeadlineStatus) return null;
                              
                              return (
                                <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedManifestation(item); setCurrentView('details'); }}>
                                  <td className="px-4 py-3">
                                     <span className={`flex items-center gap-1 px-2 py-1 rounded border w-fit ${status?.color.split(' ')[1]} bg-opacity-10 text-xs font-bold`}>
                                        {status?.label}
                                     </span>
                                  </td>
                                  <td className="px-4 py-3 font-medium">{item.nup}</td>
                                  <td className="px-4 py-3 font-medium truncate max-w-xs">{item.title}</td>
                                  <td className="px-4 py-3"><OriginBadge origin={item.origin} /></td>
                                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                                  <td className="px-4 py-3 font-bold text-gray-700">
                                    {new Date(item.deadline!).toLocaleDateString('pt-BR')}
                                  </td>
                                  <td className="px-4 py-3">{item.responsible}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-10 flex flex-col items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                          <CheckCircle2 className="w-10 h-10 mb-2 text-green-200" />
                          <p>Nenhum prazo pendente com este filtro.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {currentView === 'list' && (
            <div className="space-y-6 animate-in fade-in duration-300 w-full">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">Manifestações</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2 border text-gray-600 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm font-medium ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200'}`}
                   >
                     <Filter className="w-4 h-4" /> Filtros {showFilters ? '(Ativo)' : ''}
                   </button>
                   <button onClick={exportToExcel} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm shadow-green-200 font-medium transition-colors">
                     <Download className="w-4 h-4" /> Excel
                   </button>
                  <button onClick={() => { setIsEditing(false); setFormData({ nup: '', title: '', description: '', origin: 'SEI', responsible: '', status: 'Aberto', deadline: '' }); setCurrentView('form'); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> Nova</button>
                </div>
              </div>

              {/* ÁREA DE FILTROS AVANÇADOS (REUTILIZADA) */}
              {showFilters && (
                <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Origem</label>
                        <select 
                            className="w-full p-2 border rounded-lg text-sm"
                            value={filterOrigin}
                            onChange={e => setFilterOrigin(e.target.value)}
                        >
                            <option value="">Todas</option>
                            <option value="SEI">SEI</option>
                            <option value="Fala.Br">Fala.Br</option>
                            <option value="SAT">SAT</option>
                            <option value="E-mail">E-mail</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Responsável</label>
                        <select 
                            className="w-full p-2 border rounded-lg text-sm"
                            value={filterResponsible}
                            onChange={e => setFilterResponsible(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {systemUsers.map(u => (
                                <option key={u.id} value={getUserDisplay(u.email)}>{getUserDisplay(u.email)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Status do Prazo</label>
                        <select 
                            className="w-full p-2 border rounded-lg text-sm"
                            value={filterDeadlineStatus}
                            onChange={e => setFilterDeadlineStatus(e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="ok">No Prazo</option>
                            <option value="warning">Atenção</option>
                            <option value="expired">Atrasado</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                         <button 
                            onClick={() => { setFilterOrigin(''); setFilterResponsible(''); setFilterDeadlineStatus(''); setSearchTerm(''); }}
                            className="w-full p-2 text-red-600 border border-red-200 bg-red-50 rounded-lg text-sm hover:bg-red-100 flex items-center justify-center gap-2"
                         >
                             <X className="w-4 h-4" /> Limpar Filtros
                         </button>
                    </div>
                </div>
              )}

              <div className="bg-white p-2 rounded-xl border border-gray-200 flex items-center gap-2 w-full">
                <Search className="w-5 h-5 text-gray-400 ml-2" />
                <input className="flex-1 p-2 outline-none text-gray-700 bg-transparent w-full" placeholder="Buscar por NUP ou Título..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>

              <div className="space-y-3 w-full">
                {filteredList.map((item) => {
                  const deadlineInfo = getDeadlineStatus(item.deadline, item.status);
                  return (
                    <div key={item.id} onClick={() => { setSelectedManifestation(item); setCurrentView('details'); }} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-500 cursor-pointer transition-all flex items-center gap-5 group w-full">
                      <div className="p-3 bg-indigo-50 rounded-lg shrink-0"><FileText className="w-6 h-6 text-indigo-600" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span className="font-bold text-gray-900 text-lg">{item.nup}</span>
                          <StatusBadge status={item.status} />
                          {deadlineInfo && (
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded border ${deadlineInfo.color} text-xs font-bold`}>
                              <deadlineInfo.icon className="w-3 h-3" /> {deadlineInfo.label}
                            </span>
                          )}
                        </div>
                        <h3 className="text-gray-800 font-medium truncate">{item.title}</h3>
                      </div>
                      {userRole === 'admin' && (
                        <button onClick={(e) => handleDelete(item.id, e)} className="p-2 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Excluir">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      <ChevronRight className="text-gray-400 group-hover:text-indigo-600 shrink-0" />
                    </div>
                  )
                })}
                {filteredList.length === 0 && (
                    <div className="text-center py-10 text-gray-400">Nenhuma manifestação encontrada com estes filtros.</div>
                )}
              </div>
            </div>
          )}

          {/* NOVA ABA CONFIGURAÇÕES */}
          {currentView === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-500 w-full">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Settings className="w-6 h-6" /> Configurações do Sistema</h2>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">Gerenciar Perfis</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-3">Usuário</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Função</th>
                        <th className="px-4 py-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {systemUsers.map((sysUser) => (
                        <tr key={sysUser.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{getUserDisplay(sysUser.email)}</td>
                          <td className="px-4 py-3 text-gray-500">{sysUser.email}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${sysUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                              {sysUser.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                              <button 
                                onClick={() => handleChangeRole(sysUser.id, sysUser.role)}
                                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-xs bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors"
                              >
                                <UserCog className="w-3 h-3" />
                                {sysUser.role === 'admin' ? 'Rebaixar' : 'Promover'}
                              </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentView === 'form' && (
            <div className="max-w-3xl mx-auto w-full">
              <h2 className="text-2xl font-bold mb-6">{isEditing ? 'Editar Manifestação' : 'Nova Manifestação'}</h2>
              <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-4">
                <input required placeholder="NUP" className="w-full p-3 border rounded-lg" value={formData.nup} onChange={e => setFormData({...formData, nup: e.target.value})} />
                <input required placeholder="Título" className="w-full p-3 border rounded-lg" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                <textarea required placeholder="Descrição" rows={4} className="w-full p-3 border rounded-lg" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="text-xs text-gray-500 mb-1 block">Prazo Limite (SLA)</label>
                    <input type="date" className="w-full p-3 border rounded-lg" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                  </div>
                  
                  <div className="w-1/2">
                    <label className="text-xs text-gray-500 mb-1 block">Responsável</label>
                    <select 
                      className="w-full p-3 border rounded-lg bg-white" 
                      value={formData.responsible} 
                      onChange={e => setFormData({...formData, responsible: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {systemUsers.map(u => (
                        <option key={u.id} value={getUserDisplay(u.email)}>
                          {getUserDisplay(u.email)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="w-full">
                    <label className="text-xs text-gray-500 mb-1 block">Origem</label>
                    <select className="w-full p-3 border rounded-lg" value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})}>
                      <option>SEI</option><option>Fala.Br</option><option>SAT</option><option>E-mail</option>
                    </select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setCurrentView('list')} className="px-4 py-2 border rounded-lg">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Salvar</button>
                </div>
              </form>
            </div>
          )}

          {currentView === 'details' && selectedManifestation && (
            <div className="h-full w-full flex flex-col overflow-hidden">
              {/* Cabeçalho de Detalhes REUTILIZADO DA VERSÃO ANTERIOR para manter consistência */}
              <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <button onClick={() => setCurrentView('list')} className="p-2 hover:bg-gray-100 rounded-full">
                    <ChevronLeft className="text-gray-600" />
                  </button>
                  <div>
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      {selectedManifestation.nup}
                      <StatusBadge status={selectedManifestation.status} />
                    </h1>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>Criado: {selectedManifestation.date}</span>
                      {getDeadlineStatus(selectedManifestation.deadline, selectedManifestation.status) && (
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded border ${getDeadlineStatus(selectedManifestation.deadline, selectedManifestation.status)?.color} text-xs font-bold`}>
                          {getDeadlineStatus(selectedManifestation.deadline, selectedManifestation.status)?.label}: {new Date(selectedManifestation.deadline!).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {userRole === 'admin' && (
                  <div className="flex gap-2">
                    <button onClick={handleEditClick} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium border border-blue-200">
                       <Edit className="w-4 h-4" /> Editar
                    </button>
                    <button onClick={(e) => { handleDelete(selectedManifestation.id, e); setCurrentView('list'); }} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium border border-red-200">
                       <Trash2 className="w-4 h-4" /> Excluir
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 border-r border-gray-200">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Alterar Status</label>
                    <div className="flex gap-2 flex-wrap">
                      {['Aberto', 'Em Andamento', 'Aguardando Resposta', 'Fechado'].map(st => (
                        <button 
                          key={st}
                          onClick={() => handleStatusChange(st)}
                          disabled={selectedManifestation.status === st}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedManifestation.status === st ? 'bg-gray-100 text-gray-400' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Detalhes</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div><span className="text-xs text-gray-500 uppercase">Título</span><p className="font-medium">{selectedManifestation.title}</p></div>
                      <div><span className="text-xs text-gray-500 uppercase">Origem</span><div className="mt-1"><OriginBadge origin={selectedManifestation.origin} /></div></div>
                      <div><span className="text-xs text-gray-500 uppercase">Responsável</span><p className="font-medium flex items-center gap-1"><User className="w-3 h-3"/> {selectedManifestation.responsible}</p></div>
                      {selectedManifestation.deadline && (
                        <div>
                          <span className="text-xs text-gray-500 uppercase">Prazo Limite</span>
                          <p className="font-medium text-gray-800">{new Date(selectedManifestation.deadline).toLocaleDateString('pt-BR')}</p>
                        </div>
                      )}
                    </div>
                    <div><span className="text-xs text-gray-500 uppercase">Descrição</span><p className="text-gray-700 mt-1 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{selectedManifestation.description}</p></div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <History className="w-5 h-5 text-gray-400" /> Histórico
                      </h3>
                      <div className="space-y-4 pl-2 border-l-2 border-indigo-100">
                        {selectedManifestation.timeline?.map((evt, idx) => (
                          <div key={idx} className="relative pl-4">
                            <div className="absolute -left-[9px] top-1.5 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white"></div>
                            <p className="text-sm font-medium text-gray-800">{evt.action}</p>
                            <p className="text-xs text-gray-500">{evt.date} • {evt.user}</p>
                          </div>
                        ))}
                      </div>
                  </div>
                </div>

                <div className="w-full md:w-96 bg-gray-50 flex flex-col h-full border-l border-gray-200">
                  <div className="p-4 bg-white border-b border-gray-200 font-bold text-gray-700 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-600" /> Comentários
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {comments.map(c => (
                      <div key={c.id} className={`p-3 rounded-lg text-sm ${c.user === user.email ? 'bg-indigo-100 ml-8' : 'bg-white border border-gray-200 mr-8'}`}>
                        <p className="font-medium text-xs opacity-70 mb-1">{c.user} em {c.dateString}</p>
                        <p className="text-gray-800">{c.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-white border-t border-gray-200">
                    <div className="flex gap-2">
                      <input 
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                        placeholder="Comentar..."
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                      />
                      <button onClick={handleAddComment} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Send className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}