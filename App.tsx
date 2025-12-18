import React, { useState, useCallback, useEffect } from 'react';
import { CardData, CardType } from './types';
import { AWAKE_CARD, ASLEEP_COVER_CARD, BOILER_ROOM_DECK } from './constants';
import { shuffleDeck } from './utils/deckUtils';
import Card from './components/Card';
import { 
  Moon, 
  Sun, 
  AlertTriangle, 
  Eye, 
  EyeOff,
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Loader, 
  ZoomIn, 
  ZoomOut, 
  Coffee, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  Gamepad2
} from 'lucide-react';

const App: React.FC = () => {
  const [isAwake, setIsAwake] = useState<boolean>(true);
  const [isZoomedOut, setIsZoomedOut] = useState<boolean>(false);
  
  // Initialize D-pad visibility from localStorage
  const [isDpadVisible, setIsDpadVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('isDpadVisible');
    return saved === 'true';
  });

  const [activeStack, setActiveStack] = useState<CardData[]>([AWAKE_CARD]);
  const [cardOffsets, setCardOffsets] = useState<Record<string, {x: number, y: number}>>({});
  
  // D-Pad Sequential Logic
  const [cursorIndex, setCursorIndex] = useState<number>(0);

  const [exitingCardId, setExitingCardId] = useState<string | null>(null);
  const [exitDirection, setExitDirection] = useState<'up'|'down'|'left'|'right'|null>(null);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [dragState, setDragState] = useState<{ id: string, x: number, y: number } | null>(null);

  // Persist D-pad visibility choice
  useEffect(() => {
    localStorage.setItem('isDpadVisible', String(isDpadVisible));
  }, [isDpadVisible]);

  const wakeUp = useCallback(() => {
    setExitingCardId(null);
    setExitDirection(null);
    setIsShuffling(false);
    setIsAwake(true);
    setCardOffsets({});
    setDragState(null);
    setActiveStack([AWAKE_CARD]);
    setIsZoomedOut(false);
    setCursorIndex(0);
    // Note: We don't reset isDpadVisible here because we want to "remember" the choice
  }, []);

  const fallAsleepSequence = useCallback(() => {
    setIsShuffling(true);
    setIsAwake(false);
    setCardOffsets({});
    setDragState(null);
    setIsZoomedOut(false);
    setCursorIndex(0);
    
    // Preliminary visual stack for animation
    setActiveStack([
      ASLEEP_COVER_CARD, 
      ...BOILER_ROOM_DECK.slice(0, 2)
    ]);
    
    setTimeout(() => {
      const shuffledBoiler = shuffleDeck(BOILER_ROOM_DECK);
      const newStack = [ASLEEP_COVER_CARD, ...shuffledBoiler];
      setActiveStack(newStack);
      setIsShuffling(false);
    }, 800);
  }, []);

  const handleCardDrag = useCallback((id: string, x: number, y: number) => {
    if (x === 0 && y === 0) {
      setDragState(null);
    } else {
      setDragState({ id, x, y });
    }
  }, []);

  const handleCardSwipe = (id: string, direction: 'up' | 'down' | 'left' | 'right', fromDpad = false) => {
    if (exitingCardId || isShuffling) return;

    const cardIndex = activeStack.findIndex(c => c.id === id);
    if (cardIndex === -1) return;
    const card = activeStack[cardIndex];

    if (card.type === CardType.AWAKE) {
        setExitingCardId(id);
        setExitDirection(direction);
        setTimeout(() => {
            setExitingCardId(null);
            setExitDirection(null);
            fallAsleepSequence();
        }, 300);
    } 
    else if (card.type === CardType.BOILER_ROOM || card.type === CardType.ASLEEP_COVER) {
        let dx = 0;
        let dy = 0;
        switch(direction) {
            case 'left': dx = -1; break;
            case 'right': dx = 1; break;
            case 'up': dy = -1; break;
            case 'down': dy = 1; break;
        }

        setCardOffsets(prev => {
            const nextOffsets = { ...prev };
            for (let i = 0; i <= cardIndex; i++) {
                const targetCard = activeStack[i];
                const current = nextOffsets[targetCard.id] || { x: 0, y: 0 };
                nextOffsets[targetCard.id] = { x: current.x + dx, y: current.y + dy };
            }
            return nextOffsets;
        });

        // Advance cursor if using D-pad or swiping the currently targeted card
        if (fromDpad || cardIndex === cursorIndex) {
          setCursorIndex(prev => Math.min(prev + 1, activeStack.length - 1));
        }
    }
  };

  const handleDpadPress = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (activeStack.length === 0 || isShuffling) return;
    const currentCard = activeStack[cursorIndex];
    if (currentCard) {
      handleCardSwipe(currentCard.id, direction, true);
    }
  };

  const isRoomEmpty = !isAwake && activeStack.length === 0 && !isShuffling;
  const isBoilerPhase = !isAwake && !isShuffling && !isRoomEmpty;
  const draggingCardIndex = dragState ? activeStack.findIndex(c => c.id === dragState.id) : -1;
  
  // Generous scaling for better visibility while ensuring space for controls
  const scaleClass = isZoomedOut 
    ? 'scale-[0.5] sm:scale-60' 
    : isDpadVisible 
      ? 'scale-[0.8] sm:scale-95' 
      : 'scale-[0.85] sm:scale-100';

  return (
    <div className="relative w-full h-[100dvh] bg-stone-950 flex flex-col items-center justify-between p-4 overflow-hidden">
      <div className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000 ${isAwake ? 'opacity-10' : 'opacity-30'}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900 via-stone-950 to-black"></div>
      </div>

      <header className="relative z-10 w-full flex justify-between items-center max-w-md mt-2 backdrop-blur-sm bg-black/20 p-3 rounded-xl border border-white/5">
        <div className="flex items-center gap-3">
           {isAwake ? (
             <div className="p-2 bg-yellow-500/10 rounded-full">
               <Sun size={24} className="text-yellow-500" />
             </div>
           ) : (
             <div className="p-2 bg-purple-500/10 rounded-full">
               <Moon size={24} className="text-purple-400" />
             </div>
           )}
           <div>
             <span className="block text-xs text-stone-500 uppercase tracking-widest font-bold">Current State</span>
             <span className={`block text-lg font-black tracking-wide ${isAwake ? 'text-yellow-100' : 'text-purple-100'}`}>
               {isAwake ? 'AWAKE' : 'ASLEEP'}
             </span>
           </div>
        </div>

        <a 
          href="https://buymeacoffee.com/madman123098"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-stone-100/10 hover:bg-stone-100/20 text-stone-300 border border-stone-100/10 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all hover:scale-105 active:scale-95"
        >
          <Coffee size={12} className="text-yellow-500" />
          SUPPORT
        </a>
      </header>

      {/* Restore larger card container dimensions */}
      <main className="relative z-10 flex-1 w-full flex items-center justify-center py-4">
        <div className={`relative w-72 h-[28rem] sm:w-80 sm:h-[32rem] md:w-80 md:h-[32rem] perspective-1000 transition-all duration-500 ${scaleClass} ${!isAwake ? 'rounded-2xl ring-4 ring-stone-800 shadow-2xl bg-black' : ''}`}>
            
            {isShuffling && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 rounded-2xl backdrop-blur-sm animate-in fade-in duration-300">
                    <Loader size={48} className="text-red-600 animate-spin mb-4" />
                    <p className="text-red-500 font-black tracking-[0.2em] text-xs animate-pulse">MANIFESTING...</p>
                </div>
            )}

            {isRoomEmpty && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in duration-500 z-20">
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 animate-pulse"></div>
                        <AlertTriangle size={64} className="text-red-500 relative z-10 drop-shadow-lg" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">BOILER ROOM CLEAR</h2>
                    <button 
                        onClick={wakeUp}
                        className="group flex items-center gap-3 bg-stone-100 text-stone-900 px-8 py-4 rounded-full font-black tracking-wider shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 transition-all"
                    >
                        <Sun size={20} className="group-hover:rotate-90 transition-transform" />
                        WAKE UP
                    </button>
                </div>
            )}

            {activeStack.map((card, index) => (
                <Card 
                    key={`${card.id}-${index}`} 
                    data={card}
                    index={index}
                    totalCards={activeStack.length}
                    onSwipe={handleCardSwipe}
                    onDrag={handleCardDrag}
                    dragOffset={dragState && index <= draggingCardIndex ? { x: dragState.x, y: dragState.y } : { x: 0, y: 0 }}
                    isInteractable={!isShuffling && !exitingCardId && (isBoilerPhase ? true : index === 0)}
                    isExiting={card.id === exitingCardId}
                    exitDirection={card.id === exitingCardId ? exitDirection : null}
                    isShuffling={isShuffling}
                    gridPos={cardOffsets[card.id] || {x: 0, y: 0}}
                    isTargeted={isBoilerPhase && index === cursorIndex}
                />
            ))}
        </div>
      </main>

      {/* D-Pad Interaction Area */}
      {!isAwake && !isShuffling && !isRoomEmpty && (
        <div className="relative z-20 flex flex-col items-center gap-2 mb-4 animate-in slide-in-from-bottom-10 fade-in duration-500 w-full max-w-sm">
            
            {/* Quick Actions Panel */}
            <div className="flex justify-center items-center gap-2 w-full px-8 mb-2">
                <button 
                    onClick={() => setIsZoomedOut(!isZoomedOut)}
                    className="flex items-center gap-2 text-stone-400 hover:text-yellow-400 text-[10px] font-black uppercase tracking-widest px-4 py-2 border border-stone-800 rounded-full transition-all bg-black/60 backdrop-blur-md shadow-lg"
                    title={isZoomedOut ? "Zoom In" : "Zoom Out"}
                >
                    {isZoomedOut ? <ZoomIn size={14} /> : <ZoomOut size={14} />}
                </button>

                <button 
                    onClick={() => setIsDpadVisible(!isDpadVisible)}
                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 border rounded-full transition-all bg-black/60 backdrop-blur-md shadow-lg ${isDpadVisible ? 'text-red-400 border-red-900/40' : 'text-stone-400 border-stone-800'}`}
                    title={isDpadVisible ? "Hide Controls" : "Show Controls"}
                >
                    <Gamepad2 size={14} className={isDpadVisible ? 'opacity-100' : 'opacity-50'} />
                </button>

                {/* Wake up button: only visible when D-pad is hidden */}
                {!isDpadVisible && (
                  <button 
                      onClick={wakeUp}
                      className="flex items-center gap-2 text-stone-600 hover:text-red-400 text-[10px] font-black uppercase tracking-widest px-4 py-2 border border-stone-800 rounded-full transition-all bg-black/60 backdrop-blur-md shadow-lg animate-in fade-in zoom-in duration-300"
                  >
                      <Eye size={14} />
                      Wake Up
                  </button>
                )}
            </div>

            {isDpadVisible && (
              <div className="flex flex-col items-center gap-2 w-full animate-in fade-in slide-in-from-bottom-4 duration-300 mb-2">
                <div className="relative w-32 h-32 sm:w-36 sm:h-36 bg-stone-900 rounded-full border-4 border-stone-800 shadow-[0_0_40px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(0,0,0,0.5)] p-2 grid grid-cols-3 grid-rows-3 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-800/20 to-transparent"></div>
                    
                    {/* D-Pad Buttons */}
                    <button onClick={() => handleDpadPress('up')} className="col-start-2 flex items-center justify-center text-stone-500 hover:text-red-500 active:scale-95 active:bg-red-500/10 rounded-t-xl transition-all z-10"><ChevronUp size={24} className="sm:w-7 sm:h-7" /></button>
                    <button onClick={() => handleDpadPress('left')} className="row-start-2 flex items-center justify-center text-stone-500 hover:text-red-500 active:scale-95 active:bg-red-500/10 rounded-l-xl transition-all z-10"><ChevronLeft size={24} className="sm:w-7 sm:h-7" /></button>
                    
                    {/* Center RESET/WAKE Button (RotateCcw) */}
                    <button 
                      onClick={wakeUp} 
                      title="Wake Up Immediately"
                      className="row-start-2 col-start-2 flex items-center justify-center group active:scale-90 transition-transform z-20"
                    >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-stone-800 border-2 border-stone-700 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:border-red-500 group-active:bg-red-500 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all">
                            <RotateCcw size={16} className="text-stone-500 group-hover:text-red-100 transition-all duration-300 sm:w-5 sm:h-5" />
                        </div>
                    </button>

                    <button onClick={() => handleDpadPress('right')} className="row-start-2 col-start-3 flex items-center justify-center text-stone-500 hover:text-red-500 active:scale-95 active:bg-red-500/10 rounded-r-xl transition-all z-10"><ChevronRight size={24} className="sm:w-7 sm:h-7" /></button>
                    <button onClick={() => handleDpadPress('down')} className="row-start-3 col-start-2 flex items-center justify-center text-stone-500 hover:text-red-500 active:scale-95 active:bg-red-500/10 rounded-b-xl transition-all z-10"><ChevronDown size={24} className="sm:w-7 sm:h-7" /></button>
                </div>
              </div>
            )}
        </div>
      )}

      <footer className="relative z-10 w-full max-w-md mb-2 flex flex-col items-center gap-1">
        <div className="text-center h-4">
            {isShuffling ? (
                <p className="text-red-400 text-xs font-black animate-pulse tracking-[0.3em] uppercase">MANIFESTING NIGHTMARE...</p>
            ) : isAwake ? (
                 <p className="text-stone-600 text-[10px] font-bold uppercase tracking-widest animate-pulse">Swipe card to fall asleep...</p>
            ) : null}
        </div>
      </footer>
    </div>
  );
};

export default App;