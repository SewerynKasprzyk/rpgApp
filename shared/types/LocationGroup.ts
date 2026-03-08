export interface LocationStatus {
  id: string;
  label: string;
}

export interface LocationBoxTag {
  id: string;
  label: string;
  note: string;
  checkboxes: [boolean, boolean, boolean, boolean, boolean, boolean];
}

export interface LocationBoxStatus {
  id: string;
  label: string;
  notes: string[];
}

export interface LocationNPC {
  id: string;
  name: string;
  portraitUrl: string;
  statuses: string[];
}

export interface LocationBox {
  id: string;
  title: string;
  statuses: LocationBoxStatus[];
  tags: LocationBoxTag[];
  npcs: LocationNPC[];
}

export interface Location {
  id: string;
  name: string;
  portraitUrl: string;
  description: string;
  statuses: LocationStatus[];
  boxes: LocationBox[];
}

export interface LocationGroup {
  id: string;
  name: string;
  locations: Location[];
}

export type CreateLocationGroupInput = Omit<LocationGroup, "id">;
export type UpdateLocationGroupInput = Partial<Omit<LocationGroup, "id">>;
