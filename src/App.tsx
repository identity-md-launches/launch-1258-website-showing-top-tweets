import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { EDITION_DATE, posts, postUrl, selectPosts, topics, type Post, type Sort, type Topic } from './data';
import { Icon, type IconName } from './Icon';

const STORAGE_KEY = 'identitymd-pond:saved:v1';
const topicIcons: Record<Exclude<Topic, 'All posts'>, IconName> = { Building: 'code', Ecosystem: 'globe', Community: 'people' };

function loadSaved(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && posts.some(post => post.id === id)))] : [];
  } catch { return []; }
}

function Avatar({ post, small = false }: { post: Post; small?: boolean }) {
  return <span className={`avatar avatar-${post.avatar} ${small ? 'avatar-small' : ''}`} aria-hidden="true">{post.initials}</span>;
}

function PostCard({ post, saved, onSave, onCopy }: { post: Post; saved: boolean; onSave: (post: Post) => void; onCopy: (post: Post) => void }) {
  const date = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${post.date}T12:00:00Z`));
  return <article className={`post-card ${post.featured ? 'post-featured' : ''}`} data-post-id={post.id} aria-labelledby={`title-${post.id}`}>
    {post.featured && <div className="editor-pick"><Icon name="feed" size={15} /> Editor’s pick <span>A good place to start</span></div>}
    <div className="post-author-row">
      <a className="author-link" href={`https://x.com/${post.handle}`} target="_blank" rel="noopener noreferrer" aria-label={`${post.author} on X (opens in a new tab)`}>
        <Avatar post={post} />
        <span className="author-details"><strong>{post.author}</strong><span>@{post.handle}</span></span>
      </a>
      <span className="post-date"><time dateTime={post.date}>{date}</time><Icon name="x" size={16} /></span>
    </div>
    <div className="post-copy">
      <h3 id={`title-${post.id}`}>{post.title}</h3>
      <p>{post.summary}</p>
    </div>
    <div className="post-meta"><span className="topic-badge"><Icon name={topicIcons[post.topic]} size={13} />{post.topic}</span><span>Post summary</span></div>
    <div className="post-footer">
      <div className="metrics" role="group" aria-label="Engagement snapshot">
        {post.likes !== null && <span title="Likes in the source snapshot"><Icon name="heart" size={16} /><span className="sr-only">Likes: </span>{post.likes}<span className="sr-only"> in source snapshot</span></span>}
        {post.reposts !== null && <span title="Reposts in the source snapshot"><Icon name="repeat" size={16} /><span className="sr-only">Reposts: </span>{post.reposts}<span className="sr-only"> in source snapshot</span></span>}
        {post.likes === null && <span className="no-counts">Guide & resources</span>}
      </div>
      <div className="post-actions">
        <button className="icon-button copy-button" type="button" onClick={() => onCopy(post)} aria-label={`Copy link to ${post.title}`} title="Copy post link"><Icon name="copy" size={17} /></button>
        <button className={`icon-button save-button ${saved ? 'is-saved' : ''}`} type="button" onClick={() => onSave(post)} aria-pressed={saved} aria-label={`${saved ? 'Unsave' : 'Save'} ${post.title}`} title={saved ? 'Remove from saved posts' : 'Save post'}><Icon name="bookmark" size={17} /></button>
        <a className="read-post" href={postUrl(post)} target="_blank" rel="noopener noreferrer" aria-label={`Read ${post.title} on X (opens in a new tab)`}>Read on X<Icon name="external" size={14} /></a>
      </div>
    </div>
  </article>;
}

export default function App() {
  const [isPhone, setIsPhone] = useState(() => matchMedia('(max-width: 720px)').matches);
  const [saved, setSaved] = useState(loadSaved);
  const [savedOnly, setSavedOnly] = useState(location.hash === '#saved');
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<Topic>('All posts');
  const [sort, setSort] = useState<Sort>('picks');
  const [limit, setLimit] = useState(4);
  const [notice, setNotice] = useState('');
  const [storageWarning, setStorageWarning] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const feedHeadingRef = useRef<HTMLHeadingElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const results = selectPosts(query, topic, sort, savedOnly, saved);

  useEffect(() => {
    // Keep the visual and keyboard reading order aligned at the CSS breakpoint.
    const media = matchMedia('(max-width: 720px)');
    const onChange = () => setIsPhone(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      setSavedOnly(location.hash === '#saved');
      setQuery(''); setTopic('All posts'); setLimit(4);
      requestAnimationFrame(() => feedHeadingRef.current?.focus({ preventScroll: true }));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  function toggleSave(post: Post) {
    const isSaved = saved.includes(post.id);
    const next = isSaved ? saved.filter(id => id !== post.id) : [...saved, post.id];
    setSaved(next);
    if (isSaved && savedOnly) requestAnimationFrame(() => feedHeadingRef.current?.focus({ preventScroll: true }));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStorageWarning(false);
      setNotice(isSaved ? 'Post removed from saved posts.' : 'Post saved. Find it in Saved posts.');
    } catch {
      setStorageWarning(true);
      setNotice(isSaved ? 'Post removed for this visit.' : 'Post saved for this visit.');
    }
  }

  async function copyPost(post: Post) {
    try {
      await navigator.clipboard.writeText(postUrl(post));
      setNotice('Post link copied to your clipboard.');
    } catch {
      setNotice('Couldn’t copy the link. Use Read on X, then copy the address from your browser.');
    }
  }

  function resetFilters() { setQuery(''); setTopic('All posts'); setLimit(4); searchRef.current?.focus(); }
  function chooseTopic(next: Topic) { setTopic(next); setLimit(4); }
  function openAbout() { dialogRef.current?.showModal(); }
  function handleDialogKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], summary')].filter(element => element.getClientRects().length > 0);
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  const authorCount = new Set(posts.map(post => post.handle)).size;
  const hero = <section className="hero" aria-labelledby="hero-heading">
    <div className="hero-art" aria-hidden="true"><img src="./assets/pepe-squad.webp" width="1200" height="800" alt="" fetchPriority="high" /></div>
    <div className="hero-copy"><h1 id="hero-heading">Tweets from the<br /><span>AI pond.</span></h1><p>A collection of posts about Identity.md and its AI-powered Pepe community.</p><a className="button button-primary" href="#feed" onClick={() => { if (location.hash === '#feed') feedHeadingRef.current?.focus(); }}>Explore the feed <Icon name="arrow" size={18} /></a></div>
  </section>;

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="app-shell">
      <aside className="sidebar" aria-label="Site navigation">
        <a href="#feed" className="brand" aria-label="The Pond, Identity.md community feed"><img src="./favicon.svg" width="40" height="40" alt="" /><span>the pond<span>Identity.md community</span></span></a>
        <div className="sidebar-divider" />
        <nav className="main-nav" aria-label="Main">
          <a href="#feed" className={!savedOnly ? 'nav-item active' : 'nav-item'} aria-current={!savedOnly ? 'page' : undefined}><Icon name="feed" /> <span>Explore feed</span><span className="nav-count">{posts.length}</span></a>
          <a href="#saved" className={savedOnly ? 'nav-item active' : 'nav-item'} aria-current={savedOnly ? 'page' : undefined}><Icon name="bookmark" /><span>Saved posts</span>{saved.length > 0 && <span className="nav-count">{saved.length}</span>}</a>
          <button className="nav-item about-nav" type="button" onClick={openAbout}><Icon name="info" /><span>About the feed</span></button>
        </nav>
        <div className="sidebar-bottom">
          <a className="ecosystem-link" href="https://imd.fun" target="_blank" rel="noopener noreferrer">Explore Identity.md<Icon name="external" size={15} /></a>
          <div className="sidebar-footnote"><span className="tiny-frog" aria-hidden="true">◡</span> Made for the pond.</div>
        </div>
      </aside>

      <main id="main" className="main-content" tabIndex={-1}>
        <header className="topbar"><span>Identity.md <span className="breadcrumb-slash">/</span> <strong>Community feed</strong></span><button type="button" className="edition" onClick={openAbout}><span className="edition-dot" /> Curated edition <span className="edition-date">· {EDITION_DATE}</span><Icon name="info" size={14} /></button></header>

        {!isPhone && hero}

        <div className="content-grid">
          <section className="feed-section" aria-labelledby="feed-heading" id={savedOnly ? 'saved' : 'feed'}>
            <div className="section-heading"><div><h2 id="feed-heading" ref={feedHeadingRef} tabIndex={-1}>{savedOnly ? 'Saved posts' : 'From around the pond'}<span className="heading-dot">.</span></h2>{savedOnly && <p>Saved in this browser.</p>}</div><Icon name={savedOnly ? 'bookmark' : 'feed'} size={24} /></div>
            <div className="feed-controls">
              <label className="search-label" htmlFor="search">Search the feed</label>
              <div className="search-field"><Icon name="search" size={19} /><input ref={searchRef} id="search" name="query" type="search" autoComplete="off" placeholder="Try “swarm” or an @handle" value={query} onChange={event => { setQuery(event.target.value); setLimit(4); }} />{query && <button type="button" className="icon-button" aria-label="Clear search" onClick={() => { setQuery(''); searchRef.current?.focus(); }}><Icon name="close" size={16} /></button>}</div>
              <div className="filter-row"><div className="topic-filters" role="group" aria-label="Filter by topic">{topics.map(item => <button type="button" className={`filter-chip ${topic === item ? 'selected' : ''}`} key={item} aria-pressed={topic === item} onClick={() => chooseTopic(item)}>{item}</button>)}</div></div>
            </div>
            <div className="result-toolbar"><span role="status" aria-live="polite">{results.length} {results.length === 1 ? 'post' : 'posts'}{topic !== 'All posts' ? ` in ${topic.toLowerCase()}` : savedOnly ? ' saved' : ' in this edition'}</span><label className="sort-control"><span>Sort:</span><select aria-label="Sort posts" value={sort} onChange={event => { setSort(event.target.value as Sort); setLimit(4); }}><option value="picks">Top picks</option><option value="latest">Newest first</option><option value="likes">Most liked</option></select><Icon name="down" size={13} /></label></div>
            {storageWarning && <p className="storage-warning" role="alert">Your browser blocked storage. Saved posts will last only for this visit. Enable site storage to keep them after a refresh.</p>}
            <div className="post-list">{results.slice(0, limit).map(post => <PostCard key={post.id} post={post} saved={saved.includes(post.id)} onSave={toggleSave} onCopy={copyPost} />)}</div>
            {results.length === 0 && <div className="empty-state"><span className="empty-icon"><Icon name={savedOnly && !query && topic === 'All posts' ? 'bookmark' : 'search'} size={28} /></span><h3>{savedOnly && !query && topic === 'All posts' ? 'Keep a little signal.' : 'Nothing in this corner of the pond.'}</h3><p>{savedOnly && !query && topic === 'All posts' ? 'Save a post with its bookmark button and find it here whenever you return.' : `No posts match ${query ? `“${query}”` : 'these filters'}${savedOnly ? ' in your saved posts' : ''}. Try another search or clear your filters.`}</p>{savedOnly && !query && topic === 'All posts' ? <a className="button button-primary" href="#feed">Explore the feed<Icon name="arrow" size={16} /></a> : <button className="button button-primary" type="button" onClick={resetFilters}>Clear filters<Icon name="close" size={16} /></button>}</div>}
            {results.length > limit && <button className="load-more" type="button" onClick={() => setLimit(limit + 4)}>Show {Math.min(4, results.length - limit)} more posts<Icon name="down" size={17} /></button>}
            {results.length > 0 && results.length <= limit && <p className="feed-end"><Icon name="check" size={15} />You’re all caught up with this selection.</p>}
            <p className="snapshot-note"><Icon name="clock" size={14} /> Curated {EDITION_DATE}. Summaries and engagement are snapshots.<button type="button" onClick={openAbout}>How this works<Icon name="external" size={12} /></button></p>
          </section>

          <aside className="context-column" aria-label="About this edition">
            <section className="pond-card"><div className="aside-heading"><h2>The pond, at a glance</h2><Icon name="leaf" size={18} /></div><div className="edition-stats"><div><strong>{String(posts.length).padStart(2, '0')}</strong><span>Curated posts</span></div><div><strong>{String(authorCount).padStart(2, '0')}</strong><span>Community voices</span></div></div><div className="avatar-stack" aria-hidden="true">{posts.filter((post, index, all) => all.findIndex(item => item.handle === post.handle) === index).map(post => <Avatar key={post.handle} post={post} small />)}<span>One shared curiosity.</span></div></section>
            <section className="topics-card"><h2>In the conversation</h2><p>Find your corner of the ecosystem.</p><div>{topics.filter((item): item is Exclude<Topic, 'All posts'> => item !== 'All posts').map(item => <button type="button" className={`topic-row ${topic === item ? 'topic-active' : ''}`} key={item} onClick={() => { chooseTopic(item); feedHeadingRef.current?.scrollIntoView({ block: 'start' }); }}><span className="topic-icon"><Icon name={topicIcons[item]} size={19} /></span><span><strong>{item}</strong><span>{item === 'Building' ? 'Agents, tools & things shipped' : item === 'Ecosystem' ? 'Projects taking shape' : 'The people behind the Pepes'}</span></span><span className="topic-count">{posts.filter(post => post.topic === item).length}</span><Icon name="chevron" size={14} /></button>)}</div></section>
            <section className="field-note"><span className="note-icon"><Icon name="code" size={22} /></span><h2>Not just a profile picture.</h2><p>A community of curious humans and AI-powered Pepes, building something together.</p><a href="https://imd.fun" target="_blank" rel="noopener noreferrer">Meet Identity.md<Icon name="arrow" size={17} /></a><div className="terminal-line" aria-hidden="true"><span>&gt;_</span> curiosity.exe is running<span className="terminal-cursor" /></div></section>
            <div className="side-links"><button type="button" onClick={openAbout}>Curation & sources</button><span>·</span><a href="https://x.com/search?q=%22identity.md%22%20OR%20%24IMD&f=top" target="_blank" rel="noopener noreferrer">More on X<Icon name="external" size={12} /></a></div>
            <p className="community-note">An independent community project.<br />A good feed starts with good people.</p>
          </aside>
        </div>
        {isPhone && hero}
        <footer className="page-footer"><span><img src="./favicon.svg" width="20" height="20" alt="" /> the pond <span className="footer-dash">/</span> Stay curious. Stay a little green.</span><span>Identity.md community · 2026</span></footer>
      </main>
    </div>

    <div className="sr-only" role="status" aria-live="polite">{notice}</div>
    <div className={`toast ${notice ? 'toast-visible' : ''}`}><div>{notice && <><Icon name="info" size={18} /><span>{notice}</span></>}</div>{notice && <button type="button" className="icon-button" aria-label="Dismiss message" onClick={() => setNotice('')}><Icon name="close" size={17} /></button>}</div>

    <dialog ref={dialogRef} onKeyDown={handleDialogKeyDown} className="about-dialog" aria-labelledby="about-title"><div className="dialog-heading"><span className="dialog-brand"><img src="./favicon.svg" alt="" width="32" height="32" /> The Pond</span><form method="dialog"><button className="icon-button" aria-label="Close about the feed"><Icon name="close" /></button></form></div><h2 id="about-title">Good feeds have clear sources.</h2><p>The Pond is an independent, hand-curated collection of posts about Identity.md. This edition was assembled on <strong>{EDITION_DATE}</strong>.</p><h3>What does “top” mean?</h3><p><strong>Top picks</strong> is our editorial reading order, prioritizing useful guides, builder updates, and community perspectives. It is a selection, not an exhaustive ranking of X. <strong>Most liked</strong> uses the available source counts; posts without counts appear last. <strong>Newest first</strong> uses the original post dates.</p><h3>Summaries, with receipts.</h3><p>Card titles and text are editorial summaries, not direct quotes. Each “Read on X” link opens the original post. Publicly indexed mirrors supplied the content and engagement snapshots; counts may be older than this edition and can change. An omitted count means it was unavailable.</p><details><summary>View the {posts.length} source records</summary><ul className="source-list">{posts.map(post => <li key={post.id}><a href={post.source} target="_blank" rel="noopener noreferrer">{post.title}<Icon name="external" size={13} /></a><span>@{post.handle} · {post.date}</span></li>)}</ul></details><h3>Your bookmarks stay with you.</h3><p>Saved posts live in this browser’s local storage. No account, tracking, wallet, or live X connection is needed. They do not sync across devices.</p><form method="dialog"><button className="button button-primary">Back to the pond<Icon name="arrow" size={16} /></button></form></dialog>
  </>;
}
