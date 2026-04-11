export interface LoginRequest {
  email: string;
  motDePasse: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  nom: string;
  email: string;
  role: string;
}
