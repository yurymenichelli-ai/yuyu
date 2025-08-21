import React, { useState } from 'react';
import { Calendar, Download, Search, Filter, TrendingUp, Users, Euro } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function HistoryScreen() {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '€0.00';
    }
    return `€${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const filteredHistory = state.dayHistory.filter(day => {
    const matchesSearch = !searchTerm || day.date.includes(searchTerm);
    const matchesDate = !dateFilter || day.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  const exportToCSV = () => {
    const csvContent = [
      ['Data', 'Contatore Iniziale', 'Incasso Reale', 'Incasso Intero', 'Contatore Finale', 'Partite Biliardi', 'Tavoli Carte', 'Clienti Debitori'].join(','),
      ...filteredHistory.map(day => [
        day.date,
        formatCurrency(day.counters.initial),
        formatCurrency(day.counters.real - day.counters.initial),
        formatCurrency(day.counters.full - day.counters.initial),
        formatCurrency(day.counters.real),
        day.billiardGames.length,
        day.cardGames.length,
        day.clientDebts.length
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storico-giornate-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Storico Giornate</h2>
        <button
          onClick={exportToCSV}
          disabled={filteredHistory.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50"
        >
          <Download className="w-5 h-5 mr-2" />
          Esporta CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cerca per data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {filteredHistory.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Incasso Totale Reale</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    filteredHistory.reduce((sum, day) => 
                      sum + (day.counters.real - day.counters.initial), 0
                    )
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Euro className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Incasso Totale Intero</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(
                    filteredHistory.reduce((sum, day) => 
                      sum + (day.counters.full - day.counters.initial), 0
                    )
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Giorni Totali</p>
                <p className="text-2xl font-bold text-purple-600">{filteredHistory.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <div className="flex items-center">
            <Calendar className="w-6 h-6 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Storico Dettagliato</h3>
            <span className="ml-2 bg-gray-100 text-gray-600 text-sm font-medium px-2 py-1 rounded-full">
              {filteredHistory.length}
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {filteredHistory.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {state.dayHistory.length === 0 ? 'Nessuna giornata completata' : 'Nessun risultato trovato'}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contatore Iniziale
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incasso Reale
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incasso Intero
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contatore Finale
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attività
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHistory.slice().reverse().map((day, index) => {
                  const realEarnings = day.counters.real - day.counters.initial;
                  const fullEarnings = day.counters.full - day.counters.initial;
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDate(day.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(day.counters.initial)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatCurrency(realEarnings)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                        {formatCurrency(fullEarnings)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(day.counters.real)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {day.billiardGames.length} biliardi
                          </span>
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {day.cardGames.length} carte
                          </span>
                          {day.clientDebts.length > 0 && (
                            <span className="text-orange-600">
                              {day.clientDebts.length} debitori
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detailed Day View */}
      {filteredHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Dettagli Giornate Recenti</h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {filteredHistory.slice(-3).reverse().map((day, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-800">{formatDate(day.date)}</h4>
                      <p className="text-sm text-gray-600">
                        Incasso: {formatCurrency(day.counters.real - day.counters.initial)} reale, {formatCurrency(day.counters.full - day.counters.initial)} intero
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Partite Biliardi</h5>
                      <div className="text-sm text-gray-600">
                        {day.billiardGames.length === 0 ? (
                          <p>Nessuna partita</p>
                        ) : (
                          <div className="space-y-1">
                            {day.billiardGames.slice(0, 3).map((game, gameIndex) => (
                              <div key={gameIndex}>
                                Tavolo {game.tableNumber}: {formatCurrency(game.amount || 0)}
                                {game.isTraining && <span className="text-yellow-600"> (Allenamento)</span>}
                              </div>
                            ))}
                            {day.billiardGames.length > 3 && (
                              <p className="text-gray-500">...e altri {day.billiardGames.length - 3}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Tavoli Carte</h5>
                      <div className="text-sm text-gray-600">
                        {day.cardGames.length === 0 ? (
                          <p>Nessun tavolo</p>
                        ) : (
                          <div className="space-y-1">
                            {day.cardGames.slice(0, 3).map((game, gameIndex) => (
                              <div key={gameIndex}>
                                Tavolo {game.tableNumber}: {formatCurrency(game.amount || 0)}
                              </div>
                            ))}
                            {day.cardGames.length > 3 && (
                              <p className="text-gray-500">...e altri {day.cardGames.length - 3}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Clienti Debitori</h5>
                      <div className="text-sm text-gray-600">
                        {day.clientDebts.length === 0 ? (
                          <p>Nessun debitore</p>
                        ) : (
                          <div className="space-y-1">
                            {day.clientDebts.slice(0, 3).map((debt, debtIndex) => (
                              <div key={debtIndex}>
                                {debt.clientName}: {formatCurrency(debt.amount)}
                              </div>
                            ))}
                            {day.clientDebts.length > 3 && (
                              <p className="text-gray-500">...e altri {day.clientDebts.length - 3}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}