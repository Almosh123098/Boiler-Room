import { CardData, CardType } from './types';

// USER: To use your own images:
// 1. Move files to 'public/' and use local paths: '/images/my-card.png'
// 2. OR use a hosted URL.
//
// IMPORTANT FOR GITHUB LINKS:
// You must use the "Raw" version of the link.
// INCORRECT: https://github.com/user/repo/blob/main/image.png (This is a webpage)
// CORRECT:   https://raw.githubusercontent.com/user/repo/main/image.png

export const IMAGES = {
  // A calm, bright bedroom or living room light
  // Placeholder: Bright window/room
  AWAKE: 'https://i.imgur.com/S0aTplv.png&auto=format&fit=crop', 
  
  // A dark, red/black abstract nightmare texture
  ASLEEP: 'https://i.imgur.com/K6iYS6U.png&auto=format&fit=crop',
  
  // Boiler Room Variations: Industrial, piping, rust, dark basements
  // Representing 4 Quadrants
  BOILER_NW: 'https://i.imgur.com/7FbMOer.png&auto=format&fit=crop', 
  BOILER_NE: 'https://i.imgur.com/IFTCnxB.png&auto=format&fit=crop', 
  BOILER_SW: 'https://i.imgur.com/23bRDuA.png&auto=format&fit=crop', 
  BOILER_SE: 'https://i.imgur.com/JSaRYe4.png&auto=format&fit=crop', 
};

export const BOILER_ROOM_DECK: CardData[] = [
  { id: 'b_nw', type: CardType.BOILER_ROOM, imageUrl: IMAGES.BOILER_NW, name: 'Boiler Room: North-West' },
  { id: 'b_ne', type: CardType.BOILER_ROOM, imageUrl: IMAGES.BOILER_NE, name: 'Boiler Room: North-East' },
  { id: 'b_sw', type: CardType.BOILER_ROOM, imageUrl: IMAGES.BOILER_SW, name: 'Boiler Room: South-West' },
  { id: 'b_se', type: CardType.BOILER_ROOM, imageUrl: IMAGES.BOILER_SE, name: 'Boiler Room: South-East' },
];

export const AWAKE_CARD: CardData = {
  id: 'awake',
  type: CardType.AWAKE,
  imageUrl: IMAGES.AWAKE,
  name: 'Awake',
};

export const ASLEEP_COVER_CARD: CardData = {
  id: 'asleep_cover',
  type: CardType.ASLEEP_COVER,
  imageUrl: IMAGES.ASLEEP,
  name: 'Asleep',
};