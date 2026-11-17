export type ParkingRecord = {
  id: string;
  photoPath: string; // file name relative to the photos directory
  lat: number | null;
  lng: number | null;
  note: string;
  createdAt: number; // epoch ms
  collectedAt: number | null; // null while the car is still parked
  expiresAt: number | null; // null = kept forever
};
