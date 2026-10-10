export const EDITION_DATE = '10 Oct 2026';
export const topics = ['All posts', 'Building', 'Ecosystem', 'Community'] as const;
export type Topic = typeof topics[number];
export type Sort = 'picks' | 'latest' | 'likes';
export type Post = {
  id: string;
  author: string;
  handle: string;
  initials: string;
  avatar: 'mint' | 'sand' | 'forest' | 'blue';
  date: string;
  topic: Exclude<Topic, 'All posts'>;
  title: string;
  summary: string;
  likes: number | null;
  reposts: number | null;
  source: string;
  featured?: boolean;
};

// Editorial order, not a claim of exhaustive or real-time X rankings.
// Text is an original editorial summary, never a fabricated quotation.
// Counts are observed source snapshots; null means unavailable, not zero.
export const posts: Post[] = [
  {
    id: '2108217956237009290', author: 'taylor', handle: 'taylor_', initials: 't', avatar: 'sand',
    date: '2026-10-08', topic: 'Building', title: 'Your first step into the swarm.',
    summary: 'Taylor shares a setup guide for joining the IMD swarm on Mac, Windows, Linux, or a VPS, with an option to let your AI assistant handle the setup.',
    likes: null, reposts: null,
    source: 'https://x.noodl3.net/nftgothsa', featured: true,
  },
  {
    id: '2108565127037669756', author: 'Adam', handle: 'surfcoderepeat', initials: 'a', avatar: 'mint',
    date: '2026-10-09', topic: 'Building', title: 'More building. Less dependency.',
    summary: 'Adam invites NFT holders into the community group and outlines plans to automate more of the ecosystem, reducing its reliance on him.',
    likes: 101, reposts: 15,
    source: 'https://x.noodl3.net/nftgothsa',
  },
  {
    id: '2108599895594504539', author: 'Gothsa', handle: 'nftgothsa', initials: 'g', avatar: 'blue',
    date: '2026-10-09', topic: 'Ecosystem', title: 'A whole city of possibilities.',
    summary: 'Gothsa explores Swarm City, a 3D world of Pepes, and shares an enthusiastic first look at a community project in the IMD ecosystem.',
    likes: 19, reposts: null,
    source: 'https://x.noodl3.net/nftgothsa/status/2108599895594504539',
  },
  {
    id: '2096592364391240143', author: 'Adam', handle: 'surfcoderepeat', initials: 'a', avatar: 'mint',
    date: '2026-09-06', topic: 'Building', title: 'Give your agent a new skill.',
    summary: 'An open-source skill lets AI agents inspect the POOL4 hook and answer questions about how it works. Adam shares the tool for other builders to use.',
    likes: 146, reposts: 23,
    source: 'https://zamantika.com/ur/surfcoderepeat/status/2096592364391240143',
  },
  {
    id: '2108737561514397824', author: 'Superintelligent Identity.md', handle: 'SuperIMD_eth', initials: 'si', avatar: 'forest',
    date: '2026-10-10', topic: 'Community', title: 'Keep shipping. Keep showing up.',
    summary: 'The SIMD account highlights Swarm City and encourages launchpad builders to keep developing their projects and connecting with their communities after launch day.',
    likes: 20, reposts: 3,
    source: 'https://x.noodl3.net/SuperIMD_eth/status/2108737561514397824',
  },
  {
    id: '2108199590356795604', author: 'IMD Radar', handle: 'imdradar', initials: 'ir', avatar: 'forest',
    date: '2026-10-08', topic: 'Ecosystem', title: 'On the radar: Swarm Pepes.',
    summary: 'IMD Radar covers the Swarm Pepes launch and describes its holder rewards and token mechanics. Read the original post for the author’s full breakdown.',
    likes: 19, reposts: null,
    source: 'https://x.noodl3.net/imdradar/status/2108199590356795604',
  },
  {
    id: '2108220016885743643', author: 'Gothsa', handle: 'nftgothsa', initials: 'g', avatar: 'blue',
    date: '2026-10-08', topic: 'Community', title: 'From collecting to contributing.',
    summary: 'Sharing Taylor’s onboarding guide, Gothsa welcomes the shift toward NFTs that let their owners take an active part in building the IMD ecosystem.',
    likes: 12, reposts: null,
    source: 'https://x.noodl3.net/nftgothsa',
  },
  {
    id: '2108291463721423345', author: 'Gothsa', handle: 'nftgothsa', initials: 'g', avatar: 'blue',
    date: '2026-10-08', topic: 'Community', title: 'The builders are still here.',
    summary: 'A community reminder to stay connected and keep creating. Gothsa points to the developers turning ideas into projects inside the IMD group.',
    likes: 5, reposts: null,
    source: 'https://x.noodl3.net/nftgothsa/status/2108291463721423345',
  },
];

export function postUrl(post: Post): string {
  return `https://x.com/${post.handle}/status/${post.id}`;
}

export function selectPosts(query: string, topic: Topic, sort: Sort, savedOnly: boolean, saved: string[]): Post[] {
  const normalized = query.trim().toLocaleLowerCase();
  const results = posts.filter(post =>
    (topic === 'All posts' || post.topic === topic) &&
    (!savedOnly || saved.includes(post.id)) &&
    `${post.author} ${post.handle} ${post.title} ${post.summary} ${post.topic} identity.md $imd`.toLocaleLowerCase().includes(normalized),
  );
  if (sort === 'latest') results.sort((a, b) => b.date.localeCompare(a.date) || (BigInt(a.id) < BigInt(b.id) ? 1 : -1));
  if (sort === 'likes') results.sort((a, b) => (b.likes ?? -1) - (a.likes ?? -1));
  return results;
}
