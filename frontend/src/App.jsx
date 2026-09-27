import React, { useState } from 'react';
import { 
  Upload, Activity, ShieldCheck, FileSpreadsheet, 
  Settings, Home, BarChart2, Filter, AlertCircle,
  Sun, Moon, Users, TrendingUp, User
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // État du patient et de l'analyse
  const [patientName, setPatientName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);

  // Historique des examens (remis à zéro)
  const [history, setHistory] = useState([]);

  // --- CALCULS DYNAMIQUES DEPUIS ZERO ---
  const totalScans = history.length;

  const totalCritical = history.filter(item => 
    ['COVID-19', 'Lung_Opacity', 'Lung Opacity', 'Viral Pneumonia'].includes(item.diagnostic)
  ).length;

  const avgConfidence = history.length > 0
    ? (history.reduce((acc, item) => {
        const val = parseFloat(item.confidence.replace('%', ''));
        return acc + (isNaN(val) ? 0 : val);
      }, 0) / history.length).toFixed(1)
    : '0.0';

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setCurrentResult(null);
    }
  };

  const runAiAnalysis = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const API_URL = "http://127.0.0.1:8000";

      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur HTTP ${response.status}`);
      }

      const data = await response.json();

      const diag = data.diagnostic || data.prediction || data.class || "Inconnu";
      const conf = data.confiance ?? data.confidence ?? data.score ?? 0;
      const details = data.details || data.probabilities || data.probabilities_dict || {};

      const getVal = (keyAlternative1, keyAlternative2) => {
        const raw = details[keyAlternative1] ?? details[keyAlternative2] ?? 0;
        return typeof raw === 'number' ? (raw <= 1 ? raw * 100 : raw) : parseFloat(raw) || 0;
      };

      const result = {
        diagnostic: diag,
        confidence: typeof conf === 'number' ? (conf <= 1 ? (conf * 100).toFixed(1) : conf.toFixed(1)) : conf,
        probabilities: [
          { name: 'COVID-19', val: getVal('COVID', 'COVID-19'), color: 'bg-red-500' },
          { name: 'Lung Opacity', val: getVal('Lung_Opacity', 'Lung Opacity'), color: 'bg-amber-500' },
          { name: 'Viral Pneumonia', val: getVal('Viral Pneumonia', 'ViralPneumonia'), color: 'bg-blue-500' },
          { name: 'Normal', val: getVal('Normal', 'normal'), color: 'bg-emerald-500' }
        ]
      };

      setCurrentResult(result);

      const confDisplay = typeof conf === 'number' ? (conf <= 1 ? (conf * 100).toFixed(1) : conf.toFixed(1)) : conf;

      const newEntry = {
        id: `RAD-${Math.floor(1000 + Math.random() * 9000)}`,
        patient: patientName.trim() ? patientName.trim() : 'Patient Anonyme',
        date: new Date().toLocaleDateString('fr-FR'),
        diagnostic: diag,
        confidence: `${confDisplay}%`
      };
      
      setHistory(prev => [newEntry, ...prev]);

      // Réinitialisation après succès
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
      setPatientName('');

    } catch (error) {
      console.error("Erreur lors de l'analyse :", error);
      alert("⚠️ Impossible de joindre le serveur API. Vérifie que main.py est lancé avec uvicorn sur le port 8000.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const bgMain = isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800';
  const cardBg = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300/70';
  const headerBg = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300/70';
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`flex h-screen ${bgMain} font-sans overflow-hidden transition-colors duration-300`}>
      
      {/* SIDEBAR */}
      <aside className={`w-16 ${isDarkMode ? 'bg-slate-900 border-r border-slate-800' : 'bg-slate-900'} flex flex-col items-center py-6 gap-6 text-slate-400 z-10`}>
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
          🫁
        </div>
        <nav className="flex flex-col gap-4 mt-4">
          <button 
            onClick={() => setActiveTab('home')}
            title="Accueil / Analyse"
            className={`p-3 rounded-xl transition ${activeTab === 'home' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Home size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('activity')}
            title="Activité Récente"
            className={`p-3 rounded-xl transition ${activeTab === 'activity' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Activity size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            title="Registre Complet"
            className={`p-3 rounded-xl transition ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <FileSpreadsheet size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            title="Statistiques & Métriques"
            className={`p-3 rounded-xl transition ${activeTab === 'stats' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <BarChart2 size={20} />
          </button>
        </nav>
        <div className="mt-auto">
          <button 
            onClick={() => alert("Paramètres de l'application DenseNet121")}
            title="Paramètres"
            className="p-3 hover:bg-slate-800 hover:text-white rounded-xl transition"
          >
            <Settings size={20} />
          </button>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
        
        {/* HEADER */}
        <header className={`flex justify-between items-center ${headerBg} p-4 rounded-2xl shadow-sm border transition-colors duration-300`}>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">RADIOLOGY & AI DIAGNOSTIC DASHBOARD</h1>
            <p className={`text-xs ${textMuted} font-medium`}>Analyse Thoracique Assistée par IA (DenseNet121)</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' 
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              <span>{isDarkMode ? 'Mode Jour' : 'Mode Nuit'}</span>
            </button>

            <button className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${
              isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-700'
            }`}>
              <Filter size={14} /> Filtrer
            </button>
          </div>
        </header>

        {/* --- VUE 1 : ACCUEIL & ANALYSE --- */}
        {activeTab === 'home' && (
          <div className="grid grid-cols-12 gap-6 flex-1">
            
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
              
              {/* KPIS DYNAMIQUES (DÉMARRAGE À 0) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`${cardBg} p-4 rounded-2xl border shadow-sm flex items-center justify-between`}>
                  <div>
                    <p className={`text-xs font-bold uppercase ${textMuted}`}>Total Scans</p>
                    <h3 className="text-2xl font-black mt-1 text-blue-500">{totalScans}</h3>
                  </div>
                  <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Activity size={22} /></div>
                </div>

                <div className={`${cardBg} p-4 rounded-2xl border shadow-sm flex items-center justify-between`}>
                  <div>
                    <p className={`text-xs font-bold uppercase ${textMuted}`}>Cas Critiques</p>
                    <h3 className="text-2xl font-black mt-1 text-red-500">{totalCritical}</h3>
                  </div>
                  <div className="p-3 bg-red-500/10 text-red-500 rounded-xl"><AlertCircle size={22} /></div>
                </div>

                <div className={`${cardBg} p-4 rounded-2xl border shadow-sm flex items-center justify-between`}>
                  <div>
                    <p className={`text-xs font-bold uppercase ${textMuted}`}>Confiance Moyenne</p>
                    <h3 className="text-2xl font-black mt-1 text-emerald-500">{avgConfidence}%</h3>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><ShieldCheck size={22} /></div>
                </div>
              </div>

              {/* UPLOAD & RESULTATS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                
                {/* Carte UPLOAD */}
                <div className={`${cardBg} p-5 rounded-2xl border shadow-sm flex flex-col justify-between gap-3`}>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Upload size={16} className="text-blue-500" /> Nouvel Examen Radiologique
                  </h3>

                  {/* Saisie du Nom du Patient */}
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${textMuted}`}>
                      Nom du Patient
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Ex: Jean Dupont" 
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none transition ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-blue-500' 
                            : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-500'
                        }`}
                      />
                      <User size={14} className={`absolute left-3 top-2.5 ${textMuted}`} />
                    </div>
                  </div>

                  {/* Zone de sélection du fichier */}
                  <label className={`border-2 border-dashed ${
                    isDarkMode ? 'border-slate-700 bg-slate-950 hover:border-blue-500' : 'border-slate-300 bg-slate-50 hover:border-blue-500'
                  } rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer flex-1 transition`}>
                    {previewUrl ? (
                      <img src={previewUrl} alt="Aperçu X-Ray" className="max-h-36 object-contain rounded-lg" />
                    ) : (
                      <div className="text-center py-2">
                        <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Upload size={18} />
                        </div>
                        <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          Cliquez pour charger la radiographie
                        </p>
                      </div>
                    )}
                    <input type="file" value="" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>

                  <button 
                    onClick={runAiAnalysis}
                    disabled={!selectedFile || isAnalyzing}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition"
                  >
                    {isAnalyzing ? "Analyse DenseNet121 en cours..." : "LANCER L'ANALYSE DENSENET121"}
                  </button>
                </div>

                {/* Carte PROBABILITÉS */}
                <div className={`${cardBg} p-5 rounded-2xl border shadow-sm flex flex-col justify-between`}>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <BarChart2 size={16} className="text-blue-500" /> Probabilités du Diagnostic
                  </h3>

                  {currentResult ? (
                    <div className="my-auto flex flex-col gap-3">
                      <div className="bg-slate-950 text-white p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-semibold">Diagnostic</span>
                          <span className="text-lg font-black text-red-400">{currentResult.diagnostic}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase font-semibold">Confiance</span>
                          <span className="text-lg font-bold text-emerald-400">{currentResult.confidence}%</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {currentResult.probabilities.map((item, idx) => (
                          <div key={idx} className="text-xs">
                            <div className={`flex justify-between font-semibold ${textMuted} mb-0.5`}>
                              <span>{item.name}</span>
                              <span>{item.val.toFixed(1)}%</span>
                            </div>
                            <div className={`w-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'} h-2 rounded-full overflow-hidden`}>
                              <div className={`${item.color} h-full transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(0, item.val))}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className={`flex flex-col items-center justify-center my-auto ${textMuted} text-center py-8`}>
                      <Activity size={32} className="stroke-1 mb-2 opacity-50" />
                      <p className="text-xs font-medium">Saisissez le nom, sélectionnez une image et lancez l'analyse.</p>
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* REGISTRE À DROITE */}
            <div className={`col-span-12 lg:col-span-4 ${cardBg} rounded-2xl border shadow-sm flex flex-col overflow-hidden`}>
              <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-sm">Registre des Examens</h2>
                  <p className="text-[10px] text-blue-200">Historique des analyses</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {history.length > 0 ? (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`${isDarkMode ? 'bg-slate-950/50 text-slate-400' : 'bg-slate-50 text-slate-500'} border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'} font-bold uppercase text-[10px]`}>
                        <th className="p-3">Patient</th>
                        <th className="p-3">Diagnostic</th>
                        <th className="p-3 text-right">Confiance</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
                      {history.map((item, idx) => (
                        <tr key={idx} className={`${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'} transition`}>
                          <td className="p-3">
                            <div className="font-bold text-slate-100">{item.patient}</div>
                            <div className={`text-[10px] ${textMuted}`}>{item.id}</div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              item.diagnostic === 'COVID-19' ? 'bg-red-500/20 text-red-400' :
                              item.diagnostic === 'Normal' ? 'bg-emerald-500/20 text-emerald-400' :
                              'bg-amber-500/20 text-amber-400'
                            }`}>
                              {item.diagnostic}
                            </span>
                          </td>
                          <td className="p-3 text-right font-black">
                            {item.confidence}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className={`p-6 text-center text-xs ${textMuted}`}>
                    Aucun examen enregistré pour le moment.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* --- VUE 2 : ACTIVITÉ --- */}
        {activeTab === 'activity' && (
          <div className={`${cardBg} p-6 rounded-2xl border shadow-sm space-y-4`}>
            <h2 className="text-lg font-bold flex items-center gap-2 text-blue-500">
              <Activity size={20} /> Journal d'Activité du Système
            </h2>
            {history.length > 0 ? (
              <div className="space-y-3">
                {history.map((item, index) => (
                  <div key={index} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} flex justify-between items-center`}>
                    <div>
                      <span className="text-xs font-bold text-blue-500">{item.id}</span>
                      <p className="text-sm font-semibold">Analyse effectuée pour {item.patient}</p>
                      <span className={`text-xs ${textMuted}`}>{item.date}</span>
                    </div>
                    <span className="font-bold text-xs bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full">
                      {item.diagnostic} ({item.confidence})
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-xs ${textMuted}`}>Aucune activité enregistrée.</p>
            )}
          </div>
        )}

        {/* --- VUE 3 : REGISTRE COMPLET --- */}
        {activeTab === 'history' && (
          <div className={`${cardBg} p-6 rounded-2xl border shadow-sm space-y-4`}>
            <h2 className="text-lg font-bold flex items-center gap-2 text-blue-500">
              <FileSpreadsheet size={20} /> Registre Complet des Diagnostics
            </h2>
            {history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className={`border-b ${isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'} uppercase text-xs`}>
                      <th className="p-3">ID Examen</th>
                      <th className="p-3">Patient</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Résultat IA</th>
                      <th className="p-3 text-right">Confiance</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
                    {history.map((item, idx) => (
                      <tr key={idx} className={`${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                        <td className="p-3 font-mono text-xs text-blue-400">{item.id}</td>
                        <td className="p-3 font-semibold">{item.patient}</td>
                        <td className={`p-3 text-xs ${textMuted}`}>{item.date}</td>
                        <td className="p-3 font-bold">{item.diagnostic}</td>
                        <td className="p-3 text-right font-black">{item.confidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={`text-xs ${textMuted}`}>Aucune donnée dans le registre.</p>
            )}
          </div>
        )}

        {/* --- VUE 4 : STATISTIQUES --- */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${cardBg} p-6 rounded-2xl border shadow-sm space-y-3`}>
              <h2 className="text-lg font-bold flex items-center gap-2 text-blue-500">
                <TrendingUp size={20} /> Performance du Modèle
              </h2>
              <p className={`text-xs ${textMuted}`}>Performances basées sur le modèle DenseNet121 ré-entraîné.</p>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Précision Globale (Accuracy)</span>
                  <span className="text-emerald-400">97.8%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: '97.8%' }}></div>
                </div>
              </div>
            </div>

            <div className={`${cardBg} p-6 rounded-2xl border shadow-sm space-y-3`}>
              <h2 className="text-lg font-bold flex items-center gap-2 text-blue-500">
                <Users size={20} /> Répartition des Diagnostics
              </h2>
              <p className={`text-xs ${textMuted}`}>Distribution relative des cas analysés dans cette session.</p>
              {history.length > 0 ? (
                <ul className="space-y-2 text-xs mt-4">
                  <li className="flex justify-between">
                    <span>Total examens réalisés</span>
                    <span className="font-bold">{history.length}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Cas critiques détectés</span>
                    <span className="font-bold text-red-400">{totalCritical}</span>
                  </li>
                </ul>
              ) : (
                <p className={`text-xs ${textMuted} mt-4`}>Effectuez des analyses pour générer des statistiques en direct.</p>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}