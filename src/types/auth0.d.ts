declare module '@auth0/nextjs-auth0/client' {
  export interface User {
    sub?: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    nickname?: string;
    picture?: string;
    email?: string;
    email_verified?: boolean;
    locale?: string;
    updated_at?: string;
  }

  export function useUser(): {
    user: User | undefined;
    error: Error | undefined;
    isLoading: boolean;
  };

  export const UserProvider: React.FC<{ children: React.ReactNode }>;
} 