import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { openGameQueries, playerQueries } from '@/entities/player';
import { getCurrentUser } from '@/server/auth';
import { listCourts } from '@/server/courts';
import { listOpenGames } from '@/server/games';
import { listPlayers, listSavedPlayerIds } from '@/server/players';
import { ensureProfile } from '@/server/profiles';
import { PlayersPage } from '@/views/players';

export const metadata: Metadata = { title: 'Players | Let.' };

export default async function Page() {
  const user = await getCurrentUser();
  if (user === undefined) redirect('/sign-in');

  // Games and saved players change on the client, so they go through the query cache.
  const queryClient = new QueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: openGameQueries.list().queryKey,
      queryFn: () => listOpenGames(user),
    }),
    queryClient.prefetchQuery({
      queryKey: playerQueries.saved().queryKey,
      queryFn: () => listSavedPlayerIds(user.id),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PlayersPage
        players={listPlayers(user)}
        courts={listCourts()}
        viewerRating={ensureProfile(user).rating}
      />
    </HydrationBoundary>
  );
}
