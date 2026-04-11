export enum RoleUtilisateur {
  ROLE_ADMIN = 'ROLE_ADMIN',
  ROLE_QUALITE = 'ROLE_QUALITE',
  ROLE_EMPLOYE = 'ROLE_EMPLOYE'
}

export interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  role: RoleUtilisateur;
  createdAt: string;
}

export interface RegisterRequest {
  nom: string;
  email: string;
  motDePasse: string;
  role: RoleUtilisateur;
}
