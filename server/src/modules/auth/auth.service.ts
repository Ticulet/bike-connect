import type { GoogleProfile } from './passport.config.js';
import { usersRepository } from '../users/users.repository.js';
import { ApiError } from '../../lib/api-error.js';
import type { User } from '../../db/types.js';

export async function processGoogleLogin(googleProfile: GoogleProfile): Promise<User> {
  const email = googleProfile.emails?.[0]?.value;

  if (!email) {
    throw ApiError.badRequest('Google account has no associated email address');
  }

  const avatarUrl = googleProfile.photos?.[0]?.value ?? null;

  return usersRepository.upsertByGoogleId({
    googleId: googleProfile.id,
    email,
    displayName: googleProfile.displayName,
    avatarUrl,
  });
}
