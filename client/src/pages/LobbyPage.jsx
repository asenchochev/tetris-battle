import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import toast from 'react-hot-toast';

const RANK_COLORS = {
  Bronze: '#cd7f32', Silver: '#c0c0c0', Gold: '#ffd700', Diamond: '#b9f2ff', Master: '#ff00ff'
};

function RoomCard({ room, onJoin, onSpectate }) {
  const statusColor = room.status === 'playing' ? '#ff8800' : '#00ff88';
  const statusLabel = room.status === 'playing' ? 'In Game' : 'Waiting';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01, borderColor: 'rgba(0,245,255,0.4)' }}
      className="glass rounded-lg p-4 border border-opacity-10 cursor-pointer transition-all"
      style={{ borderColor: 'rgba(0,245,255,0.15)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
          <div>
            <div className="font-display text-sm text-blue-200">{room.name}</div>
            <div className="text-xs text-gray-500 font-mono mt-0.5">
              #{room.id} · {room.players}/{room.maxPlayers} players
              {room.spectators > 0 && ` · ${room.spectators} watching`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-1 rounded" style={{ color: statusColor, background: `${statusColor}11`, border: `1px solid ${statusColor}33` }}>
            {statusLabel}
          </span>
          {room.status === 'waiting' && room.players < room.maxPlayers ? (
            <button className="btn-primary text-xs px-3 py-1.5" onClick={() => onJoin(room.id)}>JOIN</button>
          ) : (
            <button
              className="px-3 py-1.5 text-xs font-display uppercase tracking-wider rounded border border-orange-500 border-opacity-40 text-orange-400 hover:bg-orange-500 hover:bg-opacity-10 transition-all"
              onClick={() => onSpectate(room.id)}
            >WATCH</button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CreateRoomModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [isPrivate, setIsPrivate] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 30 }}
        className="glass rounded-2xl p-8 w-full max-w-md mx-4"
        style={{ border: '1px solid rgba(0,245,255,0.3)', boxShadow: '0 0 40px rgba(0,245,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-display text-xl text-blue-400 mb-6 uppercase tracking-wider">Create Room</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 font-mono uppercase tracking-wider block mb-1">Room Name</label>
            <input
              className="w-full bg-dark-900 border border-blue-500 border-opacity-30 rounded px-3 py-2 text-white font-body focus:outline-none focus:border-blue-400 text-sm"
              placeholder="My Battle Room"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={30}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-mono uppercase tracking-wider block mb-1">Max Players</label>
            <div className="flex gap-2">
              {[2, 3, 4].map(n => (
                <button
                  key={n}
                  className={`flex-1 py-2 rounded border font-display text-sm transition-all ${maxPlayers === n ? 'border-blue-400 text-blue-400 bg-blue-500 bg-opacity-15' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}
                  onClick={() => setMaxPlayers(n)}
                >{n}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              className={`w-10 h-6 rounded-full border transition-all relative ${isPrivate ? 'bg-blue-500 border-blue-400' : 'bg-gray-800 border-gray-600'}`}
              onClick={() => setIsPrivate(!isPrivate)}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${isPrivate ? 'left-5' : 'left-1'}`} />
            </button>
            <span className="text-sm text-gray-400">Private Room</span>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button className="btn-primary flex-1" onClick={() => onCreate({ name: name || undefined, maxPlayers, isPrivate })}>
            ✨ Create
          </button>
          <button className="btn-danger" onClick={onClose}>Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function JoinCodeModal({ onClose, onJoin }) {
  const [code, setCode] = useState('');
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8 }}
        className="glass rounded-2xl p-8 w-full max-w-sm mx-4"
        style={{ border: '1px solid rgba(191,0,255,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-display text-xl text-purple-400 mb-6 uppercase tracking-wider">Join by Code</h3>
        <input
          className="w-full bg-dark-900 border border-purple-500 border-opacity-30 rounded px-3 py-3 text-white font-display text-2xl tracking-widest text-center focus:outline-none focus:border-purple-400 uppercase"
          placeholder="XXXXXX"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
          autoFocus
          onKeyDown={e => e.key === 'Enter' && code.length === 6 && onJoin(code)}
        />
        <div className="flex gap-3 mt-6">
          <button className="btn-primary flex-1" onClick={() => onJoin(code)} disabled={code.length !== 6}>
            ⚡ Join
          </button>
          <button className="btn-danger" onClick={onClose}>Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function LobbyPage() {
  const { rooms, socket, user, setCurrentRoom, setActiveTab, inQueue, setInQueue, onlinePlayers } = useGameStore();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [filter, setFilter] = useState('all');

  const filteredRooms = rooms.filter(r => filter === 'all' || r.status === filter);

  const handleCreate = (opts) => {
    socket?.emit('lobby:createRoom', { ...opts, hostNickname: user?.nickname }, (res) => {
      if (res?.error) { toast.error(res.error); return; }
      setCurrentRoom(res.room);
      setActiveTab('room');
      setShowCreate(false);
      toast.success('Room created!');
    });
  };

  const handleJoin = (roomId) => {
    socket?.emit('lobby:joinRoom', { roomId }, (res) => {
      if (res?.error) { toast.error(res.error); return; }
      setCurrentRoom(res.room);
      setActiveTab('room');
    });
  };

  const handleSpectate = (roomId) => {
    socket?.emit('lobby:spectate', { roomId }, (res) => {
      if (res?.error) { toast.error(res.error); return; }
      setCurrentRoom(res.room);
      setActiveTab('room');
    });
  };

  const handleMatchmaking = () => {
    if (inQueue) {
      socket?.emit('match:leaveQueue');
      setInQueue(false);
      toast('Left matchmaking queue');
    } else {
      socket?.emit('match:joinQueue');
      setInQueue(true);
      toast.success('Searching for match...');
    }
  };

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="font-display text-2xl font-bold text-blue-400" style={{ textShadow: '0 0 15px #00f5ff' }}>
            BATTLE LOBBY
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-400 font-mono">{onlinePlayers} online · {rooms.length} rooms</span>
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded font-display text-sm uppercase tracking-wider border transition-all ${inQueue ? 'border-yellow-400 text-yellow-400 bg-yellow-500 bg-opacity-10 animate-pulse' : 'border-orange-500 text-orange-400 hover:bg-orange-500 hover:bg-opacity-10'}`}
            onClick={handleMatchmaking}
          >
            {inQueue ? '⏳ Searching...' : '⚡ Quick Match'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="btn-primary"
            onClick={() => setShowCreate(true)}
          >+ Create Room</motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded font-display text-sm uppercase tracking-wider border border-purple-500 text-purple-400 hover:bg-purple-500 hover:bg-opacity-10 transition-all"
            onClick={() => setShowJoinCode(true)}
          ># Join Code</motion.button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 flex-shrink-0">
        {['all', 'waiting', 'playing'].map(f => (
          <button
            key={f}
            className={`px-4 py-1.5 rounded text-xs font-display uppercase tracking-wider transition-all ${filter === f ? 'bg-blue-500 bg-opacity-20 text-blue-400 border border-blue-500 border-opacity-40' : 'text-gray-600 hover:text-gray-400'}`}
            onClick={() => setFilter(f)}
          >{f}</button>
        ))}
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        <AnimatePresence>
          {filteredRooms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-48 text-gray-700"
            >
              <div className="text-4xl mb-3">🎮</div>
              <div className="font-display text-sm">No rooms found</div>
              <div className="text-xs mt-1">Create one or use Quick Match!</div>
            </motion.div>
          ) : (
            filteredRooms.map(room => (
              <RoomCard key={room.id} room={room} onJoin={handleJoin} onSpectate={handleSpectate} />
            ))
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showCreate && <CreateRoomModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
        {showJoinCode && <JoinCodeModal onClose={() => setShowJoinCode(false)} onJoin={(code) => { handleJoin(code); setShowJoinCode(false); }} />}
      </AnimatePresence>
    </div>
  );
}
