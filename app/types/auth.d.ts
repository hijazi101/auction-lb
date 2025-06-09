// types/auth.d.ts
declare module 'jsonwebtoken' {
  export interface JwtPayload {
    userId: string;
    email: string;
    exp: number;
  }
}