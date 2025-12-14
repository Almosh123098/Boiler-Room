import React, { useState, useCallback } from 'react';
import { CardData, CardType } from './types';
import { AWAKE_CARD, ASLEEP_COVER_CARD, BOILER_ROOM_DECK } from './constants';
import { shuffleDeck } from './utils/deckUtils';
import Card from './components/Card';
import { Moon, Sun, AlertTriangle, Eye, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Loader } from 'lucide-react';

const App: React.FC = () => {
  // State to track if the player is awake or asleep
  const [isAwake, setIsAwake] = useState<boolean>(true);
  
  // The current stack of cards being displayed
  const [activeStack, setActiveStack] = useState<CardData[]>([AWAKE_CARD]);
  // Position offsets for boiler room cards (Puzzle mechanics)
  // Storing steps (integers) instead of pixels. 1 step = 50% width/height.
  const [cardOffsets, setCardOffsets] = useState<Record<string, {x: number, y: number}>>({});
  
  // Animation state
  const [exitingCardId, setExitingCardId] = useState<string | null>(null);
  const [exitDirection, setExitDirection] = useState<'up'|'down'|'left'|'right'|null>(null);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);

  // Initialize/Reset to Awake State
  const wakeUp = useCallback(() => {
    setExitingCardId(null);
    setExitDirection(null);
    setIsShuffling(false);
    setIsAwake(true);
    setCardOffsets({}); // Reset puzzle
    setActiveStack([AWAKE_CARD]);
  }, []);

  // Trigger Falling Asleep Sequence
  const fallAsleepSequence = useCallback(() => {
    // 1. Set Shuffling State
    setIsShuffling(true);
    setIsAwake(false);
    setCardOffsets({}); // Ensure clean slate
    
    // Create a temporary "dummy" stack for the visual shuffle effect
    setActiveStack([
      ASLEEP_COVER_CARD, 
      BOILER_ROOM_DECK[0], 
      BOILER_ROOM_DECK[1]
    ]);
    
    // 2. Wait for shuffle animation (e.g., 800ms)
    setTimeout(() => {
      const shuffledBoiler = shuffleDeck(BOILER_ROOM_DECK);
      const newStack = [ASLEEP_COVER_CARD, ...shuffledBoiler];
      
      setActiveStack(newStack);
      setIsShuffling(false);
    }, 800);
  }, []);

  // Handle Swipe Interaction
  const handleCardSwipe = (id: string, direction: 'up' | 'down' | 'left' | 'right') => {
    // Prevent interaction during animations
    if (exitingCardId || isShuffling) return;

    const cardIndex = activeStack.findIndex(c => c.id === id);
    if (cardIndex === -1) return;
    const card = activeStack[cardIndex];

    // --- Logic for Exit-type cards (Only AWAKE now) ---
    if (card.type === CardType.AWAKE) {
        setExitingCardId(id);
        setExitDirection(direction);

        // Wait for exit animation to complete
        setTimeout(() => {
            setExitingCardId(null);
            setExitDirection(null);
            fallAsleepSequence();
        }, 300);
    } 
    // --- Logic for Puzzle cards (Boiler Room & Asleep Cover) ---
    else if (card.type === CardType.BOILER_ROOM || card.type === CardType.ASLEEP_COVER) {
        // Use integer steps for 50% shifts
        let dx = 0;
        let dy = 0;

        switch(direction) {
            case 'left': dx = -1; break;
            case 'right': dx = 1; break;
            case 'up': dy = -1; break;
            case 'down': dy = 1; break;
        }

        // Apply shift to the swiped card AND all cards above it (lower indices)
        // This simulates the "Sticky Stack" mechanics where moving a bottom card 
        // carries the stack on top of it.
        setCardOffsets(prev => {
            const nextOffsets = { ...prev };
            
            // Iterate from the top of the stack (0) down to the swiped card (cardIndex)
            for (let i = 0; i <= cardIndex; i++) {
                const targetCardId = activeStack[i].id;
                const targetCardType = activeStack[i].type;
                
                // Allow both boiler cards and the asleep cover to be moved in the stack
                if (targetCardType === CardType.BOILER_ROOM || targetCardType === CardType.ASLEEP_COVER) {
                    const current = nextOffsets[targetCardId] || { x: 0, y: 0 };
                    nextOffsets[targetCardId] = {
                        x: current.x + dx,
                        y: current.y + dy
                    };
                }
            }
            return nextOffsets;
        });
    }
  };

  // derived state for empty room
  const isRoomEmpty = !isAwake && activeStack.length === 0 && !isShuffling;
  
  // Is this the "Boiler Room" phase? 
  // Any time we are asleep and not shuffling, we are in the interactive puzzle phase.
  const isBoilerPhase = !isAwake && !isShuffling && !isRoomEmpty;

  return (
    <div className="relative w-full h-full min-h-screen bg-stone-950 flex flex-col items-center justify-between p-6 overflow-hidden">
      
      {/* Background Texture/Effects */}
      <div className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000 ${isAwake ? 'opacity-10' : 'opacity-30'}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900 via-stone-950 to-black"></div>
      </div>

      {/* Header / Info */}
      <header className="relative z-10 w-full flex justify-between items-center max-w-md mt-4 backdrop-blur-sm bg-black/20 p-4 rounded-xl border border-white/5">
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
      </header>

      {/* Main Card Area */}
      <main className="relative z-10 flex-1 w-full flex items-center justify-center py-8">
        {/* Scale container down slightly to ensure spread out cards fit on mobile screens */}
        {/* Removed overflow-hidden to allow cards to extend visually outside the frame */}
        <div className={`relative w-72 h-[28rem] perspective-1000 scale-[0.85] sm:scale-100 transition-all duration-500 ${!isAwake ? 'rounded-2xl ring-4 ring-stone-800 shadow-2xl bg-black' : ''}`}>
            
            {/* Loading Overlay */}
            {isShuffling && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 rounded-2xl backdrop-blur-sm animate-in fade-in duration-300">
                    <Loader size={48} className="text-red-600 animate-spin mb-4" />
                    <p className="text-red-500 font-black tracking-[0.2em] text-xs animate-pulse">MANIFESTING...</p>
                </div>
            )}

            {/* If room is empty, show empty state message */}
            {isRoomEmpty && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in duration-500 z-20">
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 animate-pulse"></div>
                        <AlertTriangle size={64} className="text-red-500 relative z-10 drop-shadow-lg" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">BOILER ROOM CLEAR</h2>
                    <p className="text-stone-400 mb-8 max-w-[200px] leading-relaxed">The nightmare has ended... for now.</p>
                    <button 
                        onClick={wakeUp}
                        className="group flex items-center gap-3 bg-stone-100 text-stone-900 px-8 py-4 rounded-full font-black tracking-wider shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-105 transition-all active:scale-95"
                    >
                        <Sun size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                        WAKE UP
                    </button>
                </div>
            )}

            {/* Card Stack */}
            {activeStack.map((card, index) => (
                <Card 
                    key={`${card.id}-${index}`} 
                    data={card}
                    index={index}
                    totalCards={activeStack.length}
                    onSwipe={handleCardSwipe}
                    // Interaction Logic:
                    // 1. Boiler Phase (Asleep): All cards are technically interactable. 
                    //    Since they stack, you can only grab what is visible (exposed edges or top).
                    // 2. Awake Phase: Only the top card is interactable.
                    isInteractable={
                        !isShuffling && 
                        !exitingCardId && 
                        (isBoilerPhase ? true : index === 0)
                    }
                    isExiting={card.id === exitingCardId}
                    exitDirection={card.id === exitingCardId ? exitDirection : null}
                    isShuffling={isShuffling}
                    gridPos={cardOffsets[card.id] || {x: 0, y: 0}}
                />
            ))}
            
            {/* Empty State placeholder behind cards */}
            {!isRoomEmpty && activeStack.length > 0 && !isShuffling && (
                <div className="absolute inset-0 border-2 border-dashed border-stone-800 rounded-2xl -z-10 opacity-30 flex items-center justify-center bg-black/20">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                        <div className="flex gap-4">
                           <ArrowUp className="text-stone-500" />
                        </div>
                        <div className="flex gap-8">
                           <ArrowLeft className="text-stone-500" />
                           <ArrowRight className="text-stone-500" />
                        </div>
                        <div className="flex gap-4">
                           <ArrowDown className="text-stone-500" />
                        </div>
                    </div>
                </div>
            )}
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="relative z-10 w-full max-w-md mb-6 flex flex-col gap-4">
        
        {/* Helper Text */}
        <div className="text-center h-6">
            {isShuffling ? (
                <p className="text-red-400 text-sm font-bold animate-pulse tracking-widest">SHUFFLING BOILER ROOM...</p>
            ) : isAwake ? (
                 <p className="text-stone-500 text-sm animate-pulse">Swipe card to fall asleep...</p>
            ) : !isRoomEmpty && activeStack[0]?.type === CardType.ASLEEP_COVER ? (
                 <p className="text-red-900/50 text-sm font-bold uppercase tracking-widest">Swipe to reveal boiler room</p>
            ) : isBoilerPhase ? (
                <p className="text-stone-500 text-sm">Slide cards to reveal hidden paths</p>
            ) : null}
        </div>

        {/* Global Reset/Emergency Button */}
        <div className="flex justify-center">
            {!isAwake && !isRoomEmpty && !isShuffling && (
                 <button 
                 onClick={wakeUp}
                 className="flex items-center gap-2 text-stone-600 hover:text-red-400 hover:border-red-900/50 text-xs uppercase tracking-widest px-4 py-2 border border-stone-800 rounded-full transition-all bg-black/40 backdrop-blur-md"
             >
                 <Eye size={12} />
                 Wake Up Immediately
             </button>
            )}
        </div>
      </footer>
    </div>
  );
};

export default App;