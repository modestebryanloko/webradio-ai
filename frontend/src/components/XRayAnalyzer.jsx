import React, { useState } from 'react';

export default function XRayAnalyzer() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Erreur d'analyse :", err);
      setError("Impossible de contacter le serveur Python. Assure-toi que FastAPI (uvicorn) tourne sur le port 8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-8 p-6 bg-white rounded-2xl shadow-xl border border-gray-100 font-sans">
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
        Analyse de Radiographie Thoracique
      </h2>

      {/* Zone de sélection du fichier */}
      <div className="flex flex-col items-center justify-center w-full mb-6">
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition duration-200">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <p className="mb-2 text-sm text-gray-500 font-semibold">
              Clique pour choisir une image
            </p>
            <p className="text-xs text-gray-400">PNG, JPG, JPEG (Radiographie)</p>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
      </div>

      {/* Aperçu de la photo */}
      {previewUrl && (
        <div className="mb-6 flex flex-col items-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Aperçu :</p>
          <img 
            src={previewUrl} 
            alt="Radiographie" 
            className="max-h-64 rounded-lg shadow-md border border-gray-200 object-contain"
          />
        </div>
      )}

      {/* Bouton de soumission */}
      <button
        onClick={handleAnalyze}
        disabled={!selectedFile || loading}
        className={`w-full py-3 px-4 rounded-xl font-semibold text-white shadow-md transition duration-200 flex items-center justify-center gap-2 ${
          !selectedFile || loading 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
        }`}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyse IA en cours...
          </>
        ) : (
          "Lancer l'analyse"
        )}
      </button>

      {/* Message d'erreur */}
      {error && (
        <div className="mt-4 p-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">
          ⚠️ {error}
        </div>
      )}

      {/* Résultat de l'analyse */}
      {result && (
        <div className={`mt-6 p-5 rounded-xl border transition-all duration-300 ${
          result.prediction === 'PNEUMONIA'
            ? 'bg-red-50 border-red-200 text-red-900'
            : 'bg-green-50 border-green-200 text-green-900'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-lg">
              {result.prediction === 'PNEUMONIA' ? 'Pneumonie Détectée ⚠️' : 'Poumons Sains (Normal) ✅'}
            </span>
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
              result.prediction === 'PNEUMONIA' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
            }`}>
              {result.prediction}
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full ${result.prediction === 'PNEUMONIA' ? 'bg-red-600' : 'bg-green-600'}`}
              style={{ width: `${result.confidence}%` }}
            ></div>
          </div>
          <p className="text-right text-xs mt-1 font-semibold opacity-80">
            Confiance : {result.confidence}%
          </p>
        </div>
      )}
    </div>
  );
}