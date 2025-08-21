import React, { useState } from 'react';
import { Archive, Search, Filter, Calendar } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function ArchiveScreen() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<'consumptions' | 'cards'>('consumptions');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;
  const formatDate = (date: Date) => date.toLocaleDateString('it-IT');
  const formatTime = (date: Date) => date.toLocaleTimeString('it-IT');

  // Get all consumptions from card tables
  const allConsumptions = state.cardTables.flatMap(table => 
    table.consumptions.map(consumption => ({
      ...consumption,
      tableNumber: table.tableNumber,
      playerName: table.players.find(p => p.id === consumption.playerId)?.name || 'Sconosciuto'
    }))
  );

  const filteredConsumptions = allConsumptions.filter(consumption => {
    const matchesSearch = consumption.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consumption.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || consumption.timestamp.toDateString() === new Date(dateFilter).toDateString();
    return matchesSearch && matchesDate;
  });

  const filteredCardTables = state.cardTables.filter(table => {
    const matchesSearch = table.players.some(player => 
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesDate = !dateFilter || table.startTime.toDateString() === new Date(dateFilter).toDateString();
    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Storico Consumi / Carte</h2>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('consumptions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'consumptions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Storico Consumi
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cards'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Storico Carte
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={activeTab === 'consumptions' ? 'Cerca per cliente o prodotto...' : 'Cerca per giocatore...'}
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

      {/* Content */}
      {activeTab === 'consumptions' ? (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <div className="flex items-center">
              <Archive className="w-6 h-6 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Storico Consumazioni</h3>
              <span className="ml-2 bg-gray-100 text-gray-600 text-sm font-medium px-2 py-1 rounded-full">
                {filteredConsumptions.length}
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {filteredConsumptions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {allConsumptions.length === 0 ? 'Nessuna consumazione registrata' : 'Nessun risultato trovato'}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Ora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prodotto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tavolo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prezzo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredConsumptions.slice().reverse().map((consumption, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{formatDate(consumption.timestamp)}</div>
                          <div className="text-gray-500">{formatTime(consumption.timestamp)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {consumption.playerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {consumption.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Tavolo {consumption.tableNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatCurrency(consumption.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <div className="flex items-center">
              <Archive className="w-6 h-6 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Storico Tavoli Carte</h3>
              <span className="ml-2 bg-gray-100 text-gray-600 text-sm font-medium px-2 py-1 rounded-full">
                {filteredCardTables.length}
              </span>
            </div>
          </div>
          
          <div className="p-6">
            {filteredCardTables.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {state.cardTables.length === 0 ? 'Nessun tavolo carte registrato' : 'Nessun risultato trovato'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCardTables.slice().reverse().map((table, index) => {
                  const duration = table.endTime 
                    ? (table.endTime.getTime() - table.startTime.getTime()) / (1000 * 60 * 60)
                    : 0;
                  const timeCost = duration * table.hourlyRate;
                  const consumptionsCost = table.consumptions.reduce((sum, c) => sum + c.price, 0);
                  const totalCost = timeCost + consumptionsCost;

                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-800">Tavolo {table.tableNumber}</h4>
                          <p className="text-sm text-gray-600">
                            {formatDate(table.startTime)} • {formatTime(table.startTime)}
                            {table.endTime && ` - ${formatTime(table.endTime)}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-blue-600">
                            {formatCurrency(totalCost)}
                          </div>
                          <div className={`text-sm px-2 py-1 rounded-full ${
                            table.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {table.isActive ? 'Attivo' : 'Chiuso'}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Giocatori</h5>
                          <div className="space-y-1">
                            {table.players.map(player => (
                              <div key={player.id} className="text-sm text-gray-600">
                                {player.name}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Dettagli</h5>
                          <div className="text-sm text-gray-600 space-y-1">
                            {table.endTime && (
                              <div>Durata: {duration.toFixed(2)} ore</div>
                            )}
                            <div>Costo tempo: {formatCurrency(timeCost)}</div>
                            <div>Consumazioni: {formatCurrency(consumptionsCost)}</div>
                          </div>
                        </div>
                      </div>

                      {table.consumptions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <h5 className="font-medium text-gray-700 mb-2">Consumazioni</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {table.consumptions.map((consumption, cIndex) => (
                              <div key={cIndex} className="text-sm text-gray-600 flex justify-between">
                                <span>
                                  {table.players.find(p => p.id === consumption.playerId)?.name} - {consumption.productName}
                                </span>
                                <span className="font-medium">{formatCurrency(consumption.price)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}