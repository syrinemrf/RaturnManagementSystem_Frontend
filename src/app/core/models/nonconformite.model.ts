export enum Gravite {
  FAIBLE = 'FAIBLE',
  MOYENNE = 'MOYENNE',
  HAUTE = 'HAUTE',
  CRITIQUE = 'CRITIQUE'
}

export interface NonConformite {
  id: number;
  description: string;
  gravite: Gravite;
  date: string;
  produit: string;
  retourId?: number;
  retourProduit?: string;
}

export interface NonConformiteRequest {
  description: string;
  gravite: Gravite;
  produit: string;
  retourId?: number;
}
