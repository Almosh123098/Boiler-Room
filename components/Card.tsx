import React, { useState, useRef } from 'react';
import { CardData, CardType } from '../types';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface CardProps {
  data: CardData;
  onSwipe?: (id: string, direction: 'up' | 'down' | 'left' | 'right') => void;
  index: number;
  totalCards: number;
  isInteractable: boolean;
  isExiting?: boolean; 
  exitDirection?: 'up' | 'down' | 'left' | 'right' | null;
  isShuffling?: boolean;
  gridPos?: { x: number, y: number };
}

const Card: React.FC<CardProps> = ({ 
  data, 
  onSwipe, 
  index, 
  totalCards, 
  isInteractable, 
  isExiting = false,
  exitDirection = null,
  isShuffling = false,
  gridPos = { x: 0, y: 0 }
}) => {
  // Drag state
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Constants for physics
  const SWIPE_THRESHOLD = 50; // Lower threshold for easier sliding
  
  const isAwake = data.type === CardType.AWAKE;
  const isAsleep = data.type === CardType.ASLEEP_COVER;
  const isBoiler = data.type === CardType.BOILER_ROOM;

  // Event Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only allow interaction if specifically enabled
    if (!isInteractable || isExiting || isShuffling) return;
    
    // For boiler cards, we don't want to prevent default too aggressively to allow scrolling if needed,
    // but here we are in a fixed app.
    e.preventDefault(); 
    
    setIsDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setDragPos(prev => ({
      x: prev.x + e.movementX,
      y: prev.y + e.movementY
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);

    // Determine direction
    const absX = Math.abs(dragPos.x);
    const absY = Math.abs(dragPos.y);

    if (absX > SWIPE_THRESHOLD || absY > SWIPE_THRESHOLD) {
      // Swiped! Find dominant direction
      let dir: 'up'|'down'|'left'|'right' = 'right';
      if (absX > absY) {
        dir = dragPos.x > 0 ? 'right' : 'left';
      } else {
        dir = dragPos.y > 0 ? 'down' : 'up';
      }
      onSwipe?.(data.id, dir);
    } 
    
    // Always reset drag pos - the parent will update gridPos if swipe was successful
    setDragPos({ x: 0, y: 0 });
  };

  // Visual Styling Logic
  // For Boiler Rooms and Asleep Cover, we remove the "deck stack" scale/offset effects to allow precise puzzle alignment
  // For Awake, we keep them for the nice look
  const useStackEffects = !isBoiler && !isAsleep && !isShuffling;

  const scale = useStackEffects ? Math.max(0.9, 1 - index * 0.05) : 1;
  const depthY = useStackEffects ? index * 12 : 0; 
  const opacity = useStackEffects ? Math.max(0, 1 - index * 0.2) : 1;
  const zIndex = 50 - index; // Higher index = lower z-index

  // Calculate Transform
  let transformString = '';
  let opacityValue = isExiting ? 0 : opacity;
  let transitionClass = 'transition-all duration-300 ease-out'; // Default springy transition

  if (isExiting && exitDirection) {
    // Fly out animation
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
  } else if (isDragging) {
    // Dragging: Combine percentage-based grid position with pixel-based drag offset
    // 50% = 1 step
    const rotation = dragPos.x * 0.05; // Slight tilt while dragging
    transformString = `translate(calc(${gridPos.x * 50}% + ${dragPos.x}px), calc(${gridPos.y * 50}% + ${dragPos.y + depthY}px)) rotate(${rotation}deg) scale(${scale})`;
    transitionClass = 'transition-none'; // Instant response
  } else {
    // Resting state: Purely calculated positions
    transformString = `translate(${gridPos.x * 50}%, calc(${gridPos.y * 50}% + ${depthY}px)) scale(${scale})`;
  }
  
  // Helper to show swipe cues
  const showSwipeCue = isDragging && isInteractable;
  const absX = Math.abs(dragPos.x);
  const absY = Math.abs(dragPos.y);
  
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
        ${isBoiler ? 'rounded-none' : 'rounded-2xl'} 
        ${isBoiler ? 'border-0' : 'border-[3px] border-stone-800'}
        overflow-hidden shadow-2xl bg-stone-900 group select-none
        ${isInteractable && !isDragging && !isShuffling && !isBoiler ? 'hover:scale-[1.02] transition-transform duration-300' : ''}
      `}>
        
        {/* Card Image */}
        <div className="absolute inset-0 bg-stone-800" />
        <img 
            src={data.imageUrl} 
            alt={data.name} 
            className="w-full h-full object-cover relative z-10 pointer-events-none"
            draggable={false}
        />

        {/* Overlay */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />
        
        {/* Direction Cues Overlay (Only while dragging) */}
        {showSwipeCue && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                {absX > absY && dragPos.x > 50 && <ArrowRight size={64} className="text-white/80 drop-shadow-lg" />}
                {absX > absY && dragPos.x < -50 && <ArrowLeft size={64} className="text-white/80 drop-shadow-lg" />}
                {absY > absX && dragPos.y > 50 && <ArrowDown size={64} className="text-white/80 drop-shadow-lg" />}
                {absY > absX && dragPos.y < -50 && <ArrowUp size={64} className="text-white/80 drop-shadow-lg" />}
            </div>
        )}

        {/* Interaction Prompt (Only if not dragging) */}
        {index === 0 && isInteractable && !isDragging && !isShuffling && !isBoiler && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-40 w-full text-center">
                 <div className="inline-block bg-black/60 text-white px-6 py-3 rounded-full backdrop-blur-md text-sm font-bold border border-white/10 shadow-xl transform hover:scale-105 transition-transform">
                    {isAwake ? 'SWIPE TO SLEEP' : isAsleep ? 'SWIPE TO REVEAL' : 'SWIPE TO MOVE'}
                 </div>
             </div>
        )}
      </div>
    </div>
  );
};

export default Card;