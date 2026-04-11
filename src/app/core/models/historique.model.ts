import { EtatTraitement } from './retour.model';

export interface HistoriqueRetour {
  id: number;
  action: string;
  date: string;
  ancienEtat?: EtatTraitement;
  nouvelEtat?: EtatTraitement;
  retourId: number;
  employeNom?: string;
}
