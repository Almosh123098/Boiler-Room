import React, { useState, useRef } from 'react';
import { CardData, CardType } from '../types';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface CardProps {
  data: CardData;
  onSwipe?: (id: string, direction: 'up' | 'down' | 'left' | 'right') => void;
  onDrag?: (id: string, x: number, y: number) => void;
  dragOffset?: { x: number, y: number };
  index: number;
  totalCards: number;
  isInteractable: boolean;
  isExiting?: boolean; 
  exitDirection?: 'up' | 'down' | 'left' | 'right' | null;
  isShuffling?: boolean;
  gridPos?: { x: number, y: number };
  isTargeted?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  data, 
  onSwipe, 
  onDrag,
  dragOffset = { x: 0, y: 0 },
  index, 
  totalCards, 
  isInteractable, 
  isExiting = false,
  exitDirection = null,
  isShuffling = false,
  gridPos = { x: 0, y: 0 },
  isTargeted = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragDeltaRef = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  
  const SWIPE_THRESHOLD = 50;
  
  const isAwake = data.type === CardType.AWAKE;
  const isAsleep = data.type === CardType.ASLEEP_COVER;
  const isBoiler = data.type === CardType.BOILER_ROOM;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isInteractable || isExiting || isShuffling) return;
    e.preventDefault(); 
    setIsDragging(true);
    dragDeltaRef.current = { x: 0, y: 0 };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    dragDeltaRef.current.x += e.movementX;
    dragDeltaRef.current.y += e.movementY;
    onDrag?.(data.id, dragDeltaRef.current.x, dragDeltaRef.current.y);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);

    const absX = Math.abs(dragDeltaRef.current.x);
    const absY = Math.abs(dragDeltaRef.current.y);

    if (absX > SWIPE_THRESHOLD || absY > SWIPE_THRESHOLD) {
      let dir: 'up'|'down'|'left'|'right' = 'right';
      if (absX > absY) {
        dir = dragDeltaRef.current.x > 0 ? 'right' : 'left';
      } else {
        dir = dragDeltaRef.current.y > 0 ? 'down' : 'up';
      }
      onSwipe?.(data.id, dir);
    } 
    onDrag?.(data.id, 0, 0);
    dragDeltaRef.current = { x: 0, y: 0 };
  };

  const useStackEffects = !isBoiler && !isAsleep && !isShuffling;
  const scale = useStackEffects ? Math.max(0.9, 1 - index * 0.05) : 1;
  const depthY = useStackEffects ? index * 12 : 0; 
  const opacity = useStackEffects ? Math.max(0, 1 - index * 0.2) : 1;
  const zIndex = 50 - index;

  let transformString = '';
  let opacityValue = isExiting ? 0 : opacity;
  let transitionClass = 'transition-all duration-300 ease-out';

  if (isExiting && exitDirection) {
    const exitDistance = 1000;
    let x = 0;
    let y = 0;
    let rot = 0;
    switch(exitDirection) {
      case 'left': x = -exitDistance; rot = -20; break;
      case 'right': x = exitDistance; rot = 20; break;
      case 'up': y = -exitDistance; break;
      case 'down': y = exitDistance; break;
    }
    transformString = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
    transitionClass = 'transition-all duration-300 ease-in';
  } else if (isDragging || (dragOffset.x !== 0 || dragOffset.y !== 0)) {
    const rotation = dragOffset.x * 0.05;
    transformString = `translate(calc(${gridPos.x * 50}% + ${dragOffset.x}px), calc(${gridPos.y * 50}% + ${dragOffset.y + depthY}px)) rotate(${rotation}deg) scale(${scale})`;
    transitionClass = 'transition-none';
  } else {
    transformString = `translate(${gridPos.x * 50}%, calc(${gridPos.y * 50}% + ${depthY}px)) scale(${scale})`;
  }
  
  const showSwipeCue = isDragging && isInteractable;
  const displayAbsX = Math.abs(dragOffset.x);
  const displayAbsY = Math.abs(dragOffset.y);
  
  return (
    <div
      ref={cardRef}
      className={`absolute w-full h-full origin-bottom touch-none ${transitionClass} ${isInteractable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{
        zIndex: zIndex,
        transform: transformString,
        opacity: opacityValue,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className={`
        relative w-full h-full 
        rounded-2xl border-[3px] 
        ${isTargeted ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-stone-800'}
        overflow-hidden shadow-2xl bg-stone-900 group select-none
        transition-colors duration-300
      `}>
        
        {/* Card Image */}
        <div className="absolute inset-0 bg-stone-800" />
        <img 
            src={data.imageUrl} 
            alt={data.name} 
            className="w-full h-full object-cover relative z-10 pointer-events-none"
            draggable={false}
        />

        {/* Target Indicator Overlay */}
        {isTargeted && !isShuffling && (
          <div className="absolute inset-0 z-30 border-4 border-red-500/30 animate-pulse pointer-events-none" />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />
        
        {/* Direction Cues */}
        {showSwipeCue && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                {displayAbsX > displayAbsY && dragOffset.x > 50 && <ArrowRight size={64} className="text-white/80 drop-shadow-lg" />}
                {displayAbsX > displayAbsY && dragOffset.x < -50 && <ArrowLeft size={64} className="text-white/80 drop-shadow-lg" />}
                {displayAbsY > displayAbsX && dragOffset.y > 50 && <ArrowDown size={64} className="text-white/80 drop-shadow-lg" />}
                {displayAbsY > displayAbsX && dragOffset.y < -50 && <ArrowUp size={64} className="text-white/80 drop-shadow-lg" />}
            </div>
        )}

        {/* Interaction Prompt */}
        {index === 0 && isInteractable && !isDragging && !isShuffling && !isBoiler && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-40 w-full text-center">
                 <div className="inline-block bg-black/60 text-white px-6 py-3 rounded-full backdrop-blur-md text-sm font-bold border border-white/10 shadow-xl">
                    {isAwake ? 'SWIPE TO SLEEP' : isAsleep ? 'SWIPE TO REVEAL' : 'SWIPE TO MOVE'}
                 </div>
             </div>
        )}
      </div>
    </div>
  );
};

export default Card;