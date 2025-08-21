import React, { useState } from 'react';
import { Plus, Users, Clock, Euro, Coffee, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { CardTable, Player, Product } from '../types';

export default function CardsScreen() {
  const { state, dispatch } = useApp();
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [showConsumptionDialog, setShowConsumptionDialog] = useState(false);
  const [selectedTable, setSelectedTable] = useState<CardTable | null>(null);
  const [players, setPlayers] = useState<string[]>(['']);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');

  const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;
  const formatTime = (date: Date) => date.toLocaleTimeString('it-IT');

  const handleAddPlayer = () => {
    if (players.length < 8) {
      setPlayers([...players, '']);
    }
  };

  const handleRemovePlayer = (index: number) => {
    if (players.length > 1) {
      const newPlayers = players.filter((_, i) => i !== index);
      setPlayers(newPlayers);
    }
  };

  const handlePlayerChange = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  };

  const handleCreateTable = () => {
    const validPlayers = players.filter(name => name.trim() !== '');
    if (validPlayers.length === 0) return;

    const tablePlayers: Player[] = validPlayers.map((name, index) => ({
      id: `player-${Date.now()}-${index}`,
      name: name.trim()
    }));

    const newTable: CardTable = {
      id: `table-${Date.now()}`,
      tableNumber: state.cardTables.length + 1,
      players: tablePlayers,
      startTime: new Date(),
      hourlyRate: 4,
      isActive: true,
      consumptions: []
    };

    dispatch({ type: 'ADD_CARD_TABLE', payload: newTable });
    setPlayers(['']);
    setShowTableDialog(false);
  };

  const handleCloseTable = (table: CardTable) => {
    const endTime = new Date();
    const duration = (endTime.getTime() - table.startTime.getTime()) / (1000 * 60 * 60);
    const timeCost = duration * table.hourlyRate;
    const consumptionsCost = table.consumptions.reduce((sum, c) => sum + c.price, 0);

    const closedTable: CardTable = {
      ...table,
      endTime,
      isActive: false
    };

    dispatch({ type: 'UPDATE_CARD_TABLE', payload: closedTable });
  };

  const handleAddConsumption = () => {
    if (!selectedTable || !selectedProduct || !selectedPlayerId) return;

    const consumption = {
      id: `consumption-${Date.now()}`,
      playerId: selectedPlayerId,
      productName: selectedProduct.name,
      price: selectedProduct.price,
      timestamp: new Date()
    };

    const updatedTable: CardTable = {
      ...selectedTable,
      consumptions: [...selectedTable.consumptions, consumption]
    };

    dispatch({ type: 'UPDATE_CARD_TABLE', payload: updatedTable });
    setSelectedProduct(null);
    setSelectedPlayerId('');
    setShowConsumptionDialog(false);
  };

  const getTableDuration = (table: CardTable) => {
    const endTime = table.endTime || new Date();
    return (endTime.getTime() - table.startTime.getTime()) / (1000 * 60 * 60);
  };

  const getTableCost = (table: CardTable) => {
    const duration = getTableDuration(table);
    const timeCost = duration * table.hourlyRate;
    const consumptionsCost = table.consumptions.reduce((sum, c) => sum + c.price, 0);
    return { timeCost, consumptionsCost, total: timeCost + consumptionsCost };
  };

  if (!state.isDayStarted) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Devi iniziare la giornata per gestire i tavoli carte</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Tavoli Carte</h2>
        <button
          onClick={() => setShowTableDialog(true)}
          disabled={state.cardTables.filter(t => t.isActive).length >= 5}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuovo Tavolo
        </button>
      </div>

      {/* Active Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.cardTables.filter(table => table.isActive).map(table => {
          const duration = getTableDuration(table);
          const costs = getTableCost(table);

          return (
            <div key={table.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Tavolo {table.tableNumber}
                </h3>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Attivo
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{table.players.length} giocatori</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Iniziato alle {formatTime(table.startTime)}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Euro className="w-4 h-4 mr-2" />
                  <span>Durata: {duration.toFixed(2)}h</span>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Tempo ({formatCurrency(table.hourlyRate)}/h):</span>
                      <span>{formatCurrency(costs.timeCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Consumazioni:</span>
                      <span>{formatCurrency(costs.consumptionsCost)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-gray-800 border-t pt-1">
                      <span>Totale:</span>
                      <span>{formatCurrency(costs.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Giocatori:</p>
                  <div className="space-y-1">
                    {table.players.map(player => (
                      <div key={player.id} className="text-sm text-gray-600">
                        {player.name}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => {
                      setSelectedTable(table);
                      setShowConsumptionDialog(true);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium"
                  >
                    + Consumazione
                  </button>
                  <button
                    onClick={() => handleCloseTable(table)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium"
                  >
                    Chiudi Tavolo
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Closed Tables */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Tavoli Chiusi Oggi</h3>
        </div>
        <div className="p-6">
          {state.cardTables.filter(table => !table.isActive).length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nessun tavolo chiuso oggi</p>
          ) : (
            <div className="space-y-4">
              {state.cardTables.filter(table => !table.isActive).slice(-5).reverse().map(table => {
                const costs = getTableCost(table);
                const duration = getTableDuration(table);

                return (
                  <div key={table.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-800">Tavolo {table.tableNumber}</h4>
                        <p className="text-sm text-gray-600">
                          {formatTime(table.startTime)} - {table.endTime && formatTime(table.endTime)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Durata: {duration.toFixed(2)} ore
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-blue-600">
                          {formatCurrency(costs.total)}
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
                          <div>Tempo: {formatCurrency(costs.timeCost)}</div>
                          <div>Consumazioni: {formatCurrency(costs.consumptionsCost)}</div>
                        </div>
                      </div>
                    </div>

                    {table.consumptions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <h5 className="font-medium text-gray-700 mb-2">Consumazioni</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {table.consumptions.map((consumption, index) => (
                            <div key={index} className="text-sm text-gray-600 flex justify-between">
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

      {/* New Table Dialog */}
      {showTableDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Nuovo Tavolo Carte</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giocatori (max 8)
                </label>
                <div className="space-y-2">
                  {players.map((player, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={player}
                        onChange={(e) => handlePlayerChange(index, e.target.value)}
                        placeholder={`Giocatore ${index + 1}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {players.length > 1 && (
                        <button
                          onClick={() => handleRemovePlayer(index)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {players.length < 8 && (
                  <button
                    onClick={handleAddPlayer}
                    className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    + Aggiungi giocatore
                  </button>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  💡 Tariffa: €4,00 all'ora • Timer automatico
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowTableDialog(false);
                  setPlayers(['']);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleCreateTable}
                disabled={players.filter(p => p.trim()).length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Crea Tavolo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Consumption Dialog */}
      {showConsumptionDialog && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Aggiungi Consumazione</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giocatore
                </label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleziona giocatore...</option>
                  {selectedTable.players.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prodotto
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {state.products.map(product => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className={`p-3 text-left border rounded-md hover:bg-gray-50 ${
                        selectedProduct?.id === product.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-blue-600 font-semibold">{formatCurrency(product.price)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowConsumptionDialog(false);
                  setSelectedProduct(null);
                  setSelectedPlayerId('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleAddConsumption}
                disabled={!selectedProduct || !selectedPlayerId}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Aggiungi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}