export enum EtatTraitement {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  VALIDE = 'VALIDE',
  REJETE = 'REJETE',
  TRAITE = 'TRAITE'
}

export interface RetourProduit {
  id: number;
  produit: string;
  client: string;
  raison: string;
  description?: string;
  etatTraitement: EtatTraitement;
  date: string;
  updatedAt?: string;
  utilisateurNom?: string;
  utilisateurId?: number;
}

export interface RetourRequest {
  produit: string;
  client: string;
  raison: string;
  description?: string;
  utilisateurId?: number;
}

export interface ChangerEtatRequest {
  nouvelEtat: EtatTraitement;
  employeId: number;
  commentaire?: string;
}
