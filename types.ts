export enum CardType {
  AWAKE = 'AWAKE',
  ASLEEP_COVER = 'ASLEEP_COVER',
  BOILER_ROOM = 'BOILER_ROOM',
}

export interface CardData {
  id: string;
  type: CardType;
  imageUrl: string;
  name: string;
}
