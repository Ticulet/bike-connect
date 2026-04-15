export {};

// Augment passport's Express.User interface so that req.user is typed as
// our full database User record everywhere in the application.
// passport sets req.user to Express.User after authentication.

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
  }
}
