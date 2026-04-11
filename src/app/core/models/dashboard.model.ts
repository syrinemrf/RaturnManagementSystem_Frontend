import { RetourProduit } from './retour.model';
import { HistoriqueRetour } from './historique.model';

export interface DashboardStats {
  totalRetours: number;
  retoursEnAttente: number;
  retoursEnCours: number;
  retoursValides: number;
  retoursTraites: number;
  retoursRejetes: number;
  totalNonConformites: number;
  nonConformitesCritiques: number;
  nonConformitesHautes: number;
  tauxResolution: number;
  recentRetours: RetourProduit[];
  recentActivite: HistoriqueRetour[];
}
