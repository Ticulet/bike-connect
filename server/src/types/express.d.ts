import type { Profile } from 'passport-google-oauth20';

export {};

declare global {
  namespace Express {
    interface User {
      id: string;
      google_id: string;
      email: string;
      display_name: string;
      avatar_url: string | null;
      bio: string | null;
      created_at: Date;
      updated_at: Date;
    }

    interface Request {
      googleProfile?: Profile;
    }
  }
}
