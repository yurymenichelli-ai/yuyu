import React from 'react';
import { Settings, Info, HelpCircle } from 'lucide-react';

export default function SettingsScreen() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <Settings className="w-8 h-8 text-gray-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-800">Impostazioni</h2>
      </div>

      {/* App Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <Info className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">Informazioni App</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Nome Applicazione:</span>
            <span className="font-medium">Gestione Sala Biliardi & Carte</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Versione:</span>
            <span className="font-medium">1.0.0 Demo</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tipo:</span>
            <span className="font-medium">Applicazione Web Demo</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <HelpCircle className="w-6 h-6 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">Funzionalità Implementate</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Gestione Giornata</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Inizio/Fine giornata</li>
              <li>✅ Contatori in tempo reale</li>
              <li>✅ Contatore esterno</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Tavoli Biliardi</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ 6 tavoli fissi</li>
              <li>✅ Partite fino a 4 giocatori</li>
              <li>✅ Modalità allenamento</li>
              <li>✅ Divisione importi</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Tavoli Carte</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Max 5 tavoli attivi</li>
              <li>✅ Timer automatico (€4/h)</li>
              <li>✅ Consumazioni per giocatore</li>
              <li>✅ Chiusura con riepilogo</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Gestione Clienti</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Lista clienti da pagare</li>
              <li>✅ Debiti persistenti</li>
              <li>✅ Distinzione arretrati</li>
              <li>✅ Pagamento clienti</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Prodotti & Consumazioni</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Gestione prodotti</li>
              <li>✅ Aggiunta consumazioni</li>
              <li>✅ Prezzi personalizzabili</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Storico & Esportazione</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Storico giornate</li>
              <li>✅ Storico consumazioni</li>
              <li>✅ Esportazione CSV</li>
              <li>✅ Ricerca e filtri</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <HelpCircle className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-yellow-800">Nota Demo</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p className="mb-2">
                Questa è una versione demo web dell'applicazione di gestione sala biliardi e carte. 
                Tutte le funzionalità principali sono implementate e funzionanti.
              </p>
              <p className="mb-2">
                <strong>Caratteristiche della demo:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>I dati vengono salvati solo durante la sessione corrente</li>
                <li>Al refresh della pagina i dati vengono persi</li>
                <li>L'interfaccia è ottimizzata per desktop e mobile</li>
                <li>Tutte le funzionalità del prompt originale sono implementate</li>
              </ul>
              <p className="mt-2">
                Per un'implementazione completa su desktop (Windows/macOS), questa demo può servire 
                come riferimento per lo sviluppo dell'applicazione finale.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}