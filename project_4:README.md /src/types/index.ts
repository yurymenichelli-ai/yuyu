import React, { useState } from 'react';
import { Plus, Users, Clock, Euro } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { BilliardGame, Player } from '../types';

export default function BilliardsScreen() {
  const { state, dispatch } = useApp();
  const [showGameDialog, setShowGameDialog] = useState(false);
  const [selectedGame, setSelectedGame] = useState<BilliardGame | null>(null);
  const [selectedTable, setSelectedTable] = useState(2);
  const [players, setPlayers] = useState<string[]>(['']);
  const [amount, setAmount] = useState(0);
  const [isCreatingGame, setIsCreatingGame] = useState(true);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedTableHistory, setSelectedTableHistory] = useState<number | null>(null);
  const [paymentType, setPaymentType] = useState<'equal' | 'single' | 'custom'>('equal');
  const [selectedPayingPlayers, setSelectedPayingPlayers] = useState<string[]>([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingGame, setEditingGame] = useState<BilliardGame | null>(null);

  const tables = [2, 3, 4, 7, 6];

  const handleAddPlayer = () => {
    if (players.length < 4) {
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

  const getTableHistory = (tableNumber: number) => {
    return state.billiardGames.filter(game => 
      game.tableNumber === tableNumber && game.amount !== undefined
    ).sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  };

  const handlePaymentTypeChange = (type: 'equal' | 'single' | 'custom') => {
    setPaymentType(type);
    setSelectedPayingPlayers([]);
  };

  const togglePayingPlayer = (playerId: string) => {
    if (paymentType === 'single') {
      setSelectedPayingPlayers([playerId]);
    } else {
      setSelectedPayingPlayers(prev => 
        prev.includes(playerId) 
          ? prev.filter(id => id !== playerId)
          : [...prev, playerId]
      );
    }
  };

  const handleCreateOrFinishGame = () => {
    const validPlayers = players.filter(name => name.trim() !== '');
    if (validPlayers.length === 0) return;

    if (isCreatingGame) {
      // Crea nuova partita (solo con giocatori)
      const gamePlayers: Player[] = validPlayers.map((name, index) => ({
        id: `player-${Date.now()}-${index}`,
        name: name.trim()
      }));

      const game: BilliardGame = {
        id: `game-${Date.now()}`,
        tableNumber: selectedTable,
        players: gamePlayers,
        isTraining: validPlayers.length === 1,
        startTime: new Date()
      };

      dispatch({ type: 'ADD_BILLIARD_GAME', payload: game });
    } else {
      // Finisci partita esistente (con importo)
      if (amount <= 0 || !selectedGame) return;

      const isTraining = selectedGame.isTraining;
      
      let distribution: { playerId: string; amount: number }[] = [];
      let payingPlayers: string[] = [];
      
      if (isTraining) {
        // Allenamento: sempre un solo giocatore che paga la metà
        distribution = [{
          playerId: selectedGame.players[0].id,
          amount: amount / 2
        }];
        payingPlayers = [selectedGame.players[0].id];
      } else {
        // Partita normale: distribuzione personalizzata
        if (paymentType === 'equal') {
          // Dividi equamente tra tutti i giocatori
          const amountPerPlayer = amount / selectedGame.players.length;
          distribution = selectedGame.players.map(player => ({
            playerId: player.id,
            amount: amountPerPlayer
          }));
          payingPlayers = selectedGame.players.map(p => p.id);
        } else if (paymentType === 'single') {
          // Un solo giocatore paga tutto
          if (selectedPayingPlayers.length === 0) return;
          distribution = selectedGame.players.map(player => ({
            playerId: player.id,
            amount: selectedPayingPlayers.includes(player.id) ? amount : 0
          }));
          payingPlayers = selectedPayingPlayers;
        } else {
          // Distribuzione personalizzata tra giocatori selezionati
          if (selectedPayingPlayers.length === 0) return;
          const amountPerPlayer = amount / selectedPayingPlayers.length;
          distribution = selectedGame.players.map(player => ({
            playerId: player.id,
            amount: selectedPayingPlayers.includes(player.id) ? amountPerPlayer : 0
          }));
          payingPlayers = selectedPayingPlayers;
        }
      }

      const realAmount = distribution.reduce((sum, d) => sum + d.amount, 0);

      const finishedGame: BilliardGame = {
        ...selectedGame,
        amount,
        endTime: new Date(),
        paymentDistribution: distribution,
        paymentType: isTraining ? 'single' : paymentType,
        payingPlayerIds: payingPlayers
      };

      dispatch({ type: 'UPDATE_BILLIARD_GAME', payload: finishedGame });
      dispatch({ type: 'UPDATE_COUNTERS', payload: { real: realAmount, full: amount } });

      // Add debts only for paying players
      distribution.forEach(dist => {
        if (dist.amount > 0) {
          const player = selectedGame.players.find(p => p.id === dist.playerId);
          if (!player) return;
          
          dispatch({
            type: 'ADD_CLIENT_DEBT',
            payload: {
              clientName: player.name,
              amount: dist.amount,
              isOverdue: false,
              details: [{
                type: 'billiard',
                description: `Biliardo Tavolo ${selectedTable}${isTraining ? ' (Allenamento)' : ''}`,
                amount: dist.amount,
                date: new Date()
              }]
            }
          });
        }
      });
    }

    // Reset form
    resetForm();
  };

  const resetForm = () => {
    setPlayers(['']);
    setAmount(0);
    setSelectedGame(null);
    setIsCreatingGame(true);
    setPaymentType('equal');
    setSelectedPayingPlayers([]);
    setShowGameDialog(false);
  };

  const handleEditGameDistribution = (game: BilliardGame) => {
    setEditingGame(game);
    setAmount(game.amount || 0);
    setPaymentType(game.paymentType || 'equal');
    setSelectedPayingPlayers(game.payingPlayerIds || []);
    setShowEditDialog(true);
  };

  const handleUpdateGameDistribution = () => {
    if (!editingGame || amount <= 0) return;

    const isTraining = editingGame.isTraining;
    let distribution: { playerId: string; amount: number }[] = [];
    let payingPlayers: string[] = [];
    
    if (isTraining) {
      // Allenamento: sempre un solo giocatore che paga la metà
      distribution = [{
        playerId: editingGame.players[0].id,
        amount: amount / 2
      }];
      payingPlayers = [editingGame.players[0].id];
    } else {
      // Partita normale: distribuzione personalizzata
      if (paymentType === 'equal') {
        const amountPerPlayer = amount / editingGame.players.length;
        distribution = editingGame.players.map(player => ({
          playerId: player.id,
          amount: amountPerPlayer
        }));
        payingPlayers = editingGame.players.map(p => p.id);
      } else if (paymentType === 'single') {
        if (selectedPayingPlayers.length === 0) return;
        distribution = editingGame.players.map(player => ({
          playerId: player.id,
          amount: selectedPayingPlayers.includes(player.id) ? amount : 0
        }));
        payingPlayers = selectedPayingPlayers;
      } else {
        if (selectedPayingPlayers.length === 0) return;
        const amountPerPlayer = amount / selectedPayingPlayers.length;
        distribution = editingGame.players.map(player => ({
          playerId: player.id,
          amount: selectedPayingPlayers.includes(player.id) ? amountPerPlayer : 0
        }));
        payingPlayers = selectedPayingPlayers;
      }
    }

    // Remove old debts for this game's players
    editingGame.players.forEach(player => {
      dispatch({ type: 'REMOVE_CLIENT_DEBT_BY_GAME', payload: { clientName: player.name, gameId: editingGame.id } });
    });

    const realAmount = distribution.reduce((sum, d) => sum + d.amount, 0);
    const oldRealAmount = editingGame.paymentDistribution?.reduce((sum, d) => sum + d.amount, 0) || 0;
    const oldFullAmount = editingGame.amount || 0;

    const updatedGame: BilliardGame = {
      ...editingGame,
      amount,
      paymentDistribution: distribution,
      paymentType: isTraining ? 'single' : paymentType,
      payingPlayerIds: payingPlayers
    };

    dispatch({ type: 'UPDATE_BILLIARD_GAME', payload: updatedGame });
    
    // Update counters (subtract old amounts, add new amounts)
    dispatch({ 
      type: 'UPDATE_COUNTERS', 
      payload: { 
        real: realAmount - oldRealAmount, 
        full: amount - oldFullAmount 
      } 
    });

    // Add new debts
    distribution.forEach(dist => {
      if (dist.amount > 0) {
        const player = editingGame.players.find(p => p.id === dist.playerId);
        if (!player) return;
        
        dispatch({
          type: 'ADD_CLIENT_DEBT',
          payload: {
            clientName: player.name,
            amount: dist.amount,
            isOverdue: false,
            details: [{
              type: 'billiard',
              description: `Biliardo Tavolo ${editingGame.tableNumber}${isTraining ? ' (Allenamento)' : ''}`,
              amount: dist.amount,
              date: new Date()
            }]
          }
        });
      }
    });

    setEditingGame(null);
    setShowEditDialog(false);
    resetForm();
  };

  const handleTableClick = (tableNumber: number) => {
    const activeGame = state.billiardGames.find(
      game => game.tableNumber === tableNumber && game.amount === undefined
    );
    
    if (activeGame) {
      // Tavolo occupato - finisci partita
      setSelectedGame(activeGame);
      setSelectedTable(tableNumber);
      setPlayers(activeGame.players.map(p => p.name));
      setAmount(0);
      setIsCreatingGame(false);
      setPaymentType('equal');
      setSelectedPayingPlayers([]);
      setShowGameDialog(true);
    } else {
      // Tavolo libero - crea nuova partita
      setSelectedTable(tableNumber);
      setPlayers(['']);
      setAmount(0);
      setSelectedGame(null);
      setIsCreatingGame(true);
      setPaymentType('equal');
      setSelectedPayingPlayers([]);
      setShowGameDialog(true);
    }
  };

  const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;

  if (!state.isDayStarted) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Devi iniziare la giornata per gestire i tavoli biliardi</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Tavoli Biliardi</h2>
        <div className="text-sm text-gray-600">
          Clicca su un tavolo libero per iniziare una partita
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {tables.map(tableNumber => {
          const activeGame = state.billiardGames.find(
            game => game.tableNumber === tableNumber && game.amount === undefined
          );

          return (
            <div 
              key={tableNumber} 
              className="bg-white rounded-lg shadow-md p-6 transition-all duration-200 hover:shadow-lg border-2 border-transparent hover:border-blue-300"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Tavolo {tableNumber}
                </h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  activeGame ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {activeGame ? 'Occupato' : 'Libero'}
                </div>
              </div>

              {activeGame ? (
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{activeGame.players.length} giocatori</span>
                    {activeGame.isTraining && (
                      <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                        Allenamento
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Euro className="w-4 h-4 mr-2" />
                    <span>In attesa importo...</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Iniziata alle {activeGame.startTime.toLocaleTimeString()}</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Giocatori:</p>
                    <div className="space-y-1">
                      {activeGame.players.map(player => (
                        <div key={player.id} className="text-sm text-gray-600">
                          {player.name}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={() => handleTableClick(tableNumber)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium"
                    >
                      Termina Partita
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTableHistory(tableNumber);
                        setShowHistoryDialog(true);
                      }}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded text-sm font-medium"
                    >
                      📊
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                    <Plus className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-gray-500 text-sm mb-4">Clicca per iniziare partita</p>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleTableClick(tableNumber)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium"
                    >
                      Inizia
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTableHistory(tableNumber);
                        setShowHistoryDialog(true);
                      }}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded text-sm font-medium"
                    >
                      📊
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Games */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Partite Recenti</h3>
        </div>
        <div className="p-6">
          {state.billiardGames.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nessuna partita giocata oggi</p>
          ) : (
            <div className="space-y-3">
              {state.billiardGames.filter(game => game.amount !== undefined).slice(-5).reverse().map(game => (
                <div key={game.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Tavolo {game.tableNumber}</span>
                      {game.isTraining && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          Allenamento
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {game.players.map(p => p.name).join(', ')} • {game.startTime.toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(game.amount || 0)}</div>
                    <div className="text-sm text-gray-500">
                      {game.players.length} giocatori
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Game Dialog */}
      {showGameDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {isCreatingGame ? 'Nuova Partita Biliardo' : 'Termina Partita'}
            </h3>
            
            <div className="space-y-4">
              {/* Table Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tavolo
                </label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                >
                  <option value={selectedTable}>Tavolo {selectedTable}</option>
                </select>
              </div>

              {/* Players */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giocatori (max 4)
                </label>
                {isCreatingGame ? (
                  <>
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
                    {players.length < 4 && (
                      <button
                        onClick={handleAddPlayer}
                        className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        + Aggiungi giocatore
                      </button>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
                    {players.map((player, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{player}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Amount - solo quando si finisce la partita */}
              {!isCreatingGame && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Importo (€)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    step="0.50"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              )}

              {/* Payment Distribution - solo per partite normali */}
              {!isCreatingGame && selectedGame && !selectedGame.isTraining && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chi paga?
                  </label>
                  
                  <div className="space-y-3">
                    <div className="flex flex-col space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="paymentType"
                          value="equal"
                          checked={paymentType === 'equal'}
                          onChange={() => handlePaymentTypeChange('equal')}
                          className="mr-2"
                        />
                        Tutti (diviso equamente)
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="paymentType"
                          value="single"
                          checked={paymentType === 'single'}
                          onChange={() => handlePaymentTypeChange('single')}
                          className="mr-2"
                        />
                        Solo uno
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="paymentType"
                          value="custom"
                          checked={paymentType === 'custom'}
                          onChange={() => handlePaymentTypeChange('custom')}
                          className="mr-2"
                        />
                        Personalizzato
                      </label>
                    </div>

                    {(paymentType === 'single' || paymentType === 'custom') && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          {paymentType === 'single' ? 'Seleziona chi paga tutto:' : 'Seleziona chi paga (diviso tra loro):'}
                        </p>
                        {selectedGame.players.map(player => (
                          <label key={player.id} className="flex items-center">
                            <input
                              type={paymentType === 'single' ? 'radio' : 'checkbox'}
                              name={paymentType === 'single' ? 'payingPlayer' : undefined}
                              checked={selectedPayingPlayers.includes(player.id)}
                              onChange={() => togglePayingPlayer(player.id)}
                              className="mr-2"
                            />
                            {player.name}
                            {paymentType === 'custom' && selectedPayingPlayers.includes(player.id) && selectedPayingPlayers.length > 0 && (
                              <span className="ml-2 text-sm text-gray-500">
                                (€{(amount / selectedPayingPlayers.length).toFixed(2)})
                              </span>
                            )}
                            {paymentType === 'single' && selectedPayingPlayers.includes(player.id) && (
                              <span className="ml-2 text-sm text-gray-500">
                                (€{amount.toFixed(2)})
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    )}

                    {paymentType === 'equal' && amount > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-sm text-blue-800">
                          Ogni giocatore paga: <strong>€{(amount / (selectedGame?.players.length || 1)).toFixed(2)}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Training Warning */}
              {!isCreatingGame && selectedGame?.isTraining && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Allenamento: il cliente pagherà solo la metà dell'importo inserito
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowGameDialog(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleCreateOrFinishGame}
                disabled={
                  players.filter(p => p.trim()).length === 0 || 
                  (!isCreatingGame && amount <= 0) ||
                  (!isCreatingGame && selectedGame && !selectedGame.isTraining && paymentType !== 'equal' && selectedPayingPlayers.length === 0)
                }
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isCreatingGame ? 'Inizia Partita' : 'Termina Partita'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table History Dialog */}
      {showHistoryDialog && selectedTableHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Storico Tavolo {selectedTableHistory}</h3>
              <button
                onClick={() => {
                  setShowHistoryDialog(false);
                  setSelectedTableHistory(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {getTableHistory(selectedTableHistory).length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nessuna partita giocata su questo tavolo oggi
                </p>
              ) : (
                getTableHistory(selectedTableHistory).map((game, index) => {
                  const duration = game.endTime 
                    ? (game.endTime.getTime() - game.startTime.getTime()) / (1000 * 60)
                    : 0;
                  
                  return (
                    <div key={game.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            Partita #{index + 1}
                            {game.isTraining && (
                              <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                                Allenamento
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {game.startTime.toLocaleDateString()} • {game.startTime.toLocaleTimeString()}
                            {game.endTime && ` - ${game.endTime.toLocaleTimeString()}`}
                          </p>
                          {game.endTime && (
                            <p className="text-sm text-gray-500">
                              Durata: {Math.floor(duration / 60)}h {Math.floor(duration % 60)}m
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-blue-600">
                            {formatCurrency(game.amount || 0)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Giocatori</h5>
                          <div className="space-y-1">
                            {game.players.map(player => {
                              const playerAmount = game.paymentDistribution?.find(d => d.playerId === player.id)?.amount || 0;
                              return (
                                <div key={player.id} className="flex justify-between text-sm">
                                  <span className={playerAmount > 0 ? 'font-medium' : 'text-gray-500'}>
                                    {player.name}
                                    {playerAmount === 0 && ' (non paga)'}
                                  </span>
                                  <span className="font-medium">
                                    {playerAmount > 0 ? formatCurrency(playerAmount) : '-'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="mt-3 pt-2 border-t border-gray-100">
                            <button
                              onClick={() => handleEditGameDistribution(game)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              ✏️ Modifica Distribuzione
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Game Distribution Dialog */}
      {showEditDialog && editingGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Modifica Distribuzione Pagamento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Importo (€)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  step="0.50"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {!editingGame.isTraining && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chi paga?
                  </label>
                  
                  <div className="space-y-3">
                    <div className="flex flex-col space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="editPaymentType"
                          value="equal"
                          checked={paymentType === 'equal'}
                          onChange={() => handlePaymentTypeChange('equal')}
                          className="mr-2"
                        />
                        Tutti
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="editPaymentType"
                          value="single"
                          checked={paymentType === 'single'}
                          onChange={() => handlePaymentTypeChange('single')}
                          className="mr-2"
                        />
                        Solo uno
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="editPaymentType"
                          value="custom"
                          checked={paymentType === 'custom'}
                          onChange={() => handlePaymentTypeChange('custom')}
                          className="mr-2"
                        />
                        Personalizzato
                      </label>
                    </div>

                    {(paymentType === 'single' || paymentType === 'custom') && (
                      <div className="space-y-2">
                        {editingGame.players.map(player => (
                          <label key={player.id} className="flex items-center">
                            <input
                              type={paymentType === 'single' ? 'radio' : 'checkbox'}
                              name={paymentType === 'single' ? 'editPayingPlayer' : undefined}
                              checked={selectedPayingPlayers.includes(player.id)}
                              onChange={() => togglePayingPlayer(player.id)}
                              className="mr-2"
                            />
                            {player.name}
                            {paymentType === 'custom' && selectedPayingPlayers.includes(player.id) && selectedPayingPlayers.length > 0 && (
                              <span className="ml-2 text-sm text-gray-500">
                                (€{(amount / selectedPayingPlayers.length).toFixed(2)})
                              </span>
                            )}
                            {paymentType === 'single' && selectedPayingPlayers.includes(player.id) && (
                              <span className="ml-2 text-sm text-gray-500">
                                (€{amount.toFixed(2)})
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {editingGame.isTraining && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Allenamento: il cliente pagherà sempre la metà dell'importo
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingGame(null);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleUpdateGameDistribution}
                disabled={
                  amount <= 0 || 
                  (!editingGame.isTraining && paymentType !== 'equal' && selectedPayingPlayers.length === 0)
                }
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Salva Modifiche
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}