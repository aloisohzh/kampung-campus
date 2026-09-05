'use client';
/* oxlint-disable next/no-img-element -- Owner-authenticated R2 image; fixed dimensions. */
import type { ResidentProfile } from '@/lib/profile';
export function ProfileAvatar({
  profile,
  className = '',
}: {
  profile?: ResidentProfile;
  className?: string;
}) {
  const name = profile?.name || 'Neighbour';
  return (
    <span className={'avatar resident-avatar ' + className}>
      {profile?.photo ? (
        <img
          src={
            '/api/evidence?id=' +
            encodeURIComponent(profile.photo.id) +
            '&view=photo'
          }
          alt={name + ' profile photo'}
        />
      ) : (
        name
          .split(' ')
          .map((part) => part[0])
          .slice(0, 2)
          .join('')
      )}
    </span>
  );
}
