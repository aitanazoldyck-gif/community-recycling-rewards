"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, MessageCircle, MoreHorizontal, Send, ShoppingBag, Sparkles, Users, Video, UserRound, Home, Heart, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";

type Author = { id: string; name: string | null; image: string | null };
type Post = { id: string; body: string | null; mediaUrls: unknown; isVideo: boolean; createdAt: string; author: Author; reactions: { userId: string; type: string }[]; comments: { id: string; body: string; author: { name: string | null; image: string | null } }[] };
type Story = { id: string; body: string | null; mediaUrl: string | null; author: Author };
type Friend = Author;
type Listing = { id: string; title: string; price: number; seller?: Author };
type Conversation = { id: string; members?: { user: Author }[]; messages?: { body: string }[] };

const navItems = [
  { href: "/resident/home", label: "Home", icon: Home },
  { href: "/resident/home?view=videos", label: "Videos", icon: Video },
  { href: "/resident/home?view=friends", label: "Friends", icon: Users },
  { href: "/resident/profile", label: "Profile", icon: UserRound },
  { href: "/resident/home?view=shop", label: "Shop", icon: ShoppingBag },
  { href: "/resident/home?view=messages", label: "Messenger", icon: MessageCircle },
];

function mediaList(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }

export function SocialHome({ initialView = "home" }: { initialView?: string }) {
  const [view, setView] = useState(initialView);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [composer, setComposer] = useState("");
  const [media, setMedia] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadFeed() {
    setLoading(true);
    try {
      const [feedRes, storyRes] = await Promise.all([fetch("/api/social/feed"), fetch("/api/social/stories")]);
      if (feedRes.ok) setPosts((await feedRes.json()).posts);
      if (storyRes.ok) setStories(await storyRes.json());
    } finally { setLoading(false); }
  }
  useEffect(() => {
    const timer = window.setTimeout(() => { void loadFeed(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function readMedia(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 4);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setMedia((current) => [...current, String(reader.result)].slice(0, 4));
      reader.readAsDataURL(file);
    });
  }

  async function publish() {
    if (!composer.trim() && media.length === 0) return;
    const response = await fetch("/api/social/feed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: composer, mediaUrls: media, isVideo: media.some((item) => item.startsWith("data:video")) }) });
    const data = await response.json();
    if (!response.ok) return toast.error(data.error ?? "Unable to publish");
    setComposer(""); setMedia([]); toast.success("Posted to your community feed"); await loadFeed();
  }

  async function react(postId: string, reaction = "LIKE") {
    const response = await fetch("/api/social/interactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId, reaction }) });
    if (response.ok) await loadFeed();
  }

  async function sendComment(postId: string) {
    const body = comment[postId]?.trim(); if (!body) return;
    const response = await fetch("/api/social/interactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId, comment: body }) });
    if (response.ok) { setComment((current) => ({ ...current, [postId]: "" })); await loadFeed(); }
  }

  const filteredPosts = view === "videos" ? posts.filter((post) => post.isVideo || mediaList(post.mediaUrls).some((item) => item.includes("video"))) : posts;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="sticky top-2 z-20 flex items-center gap-2 overflow-x-auto rounded-2xl border border-border/70 bg-background/90 p-2 shadow-lg shadow-primary/5 backdrop-blur-xl">
        <Link href="/resident/home" className="mr-2 flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 font-bold text-primary"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="h-4 w-4" /></span><span className="hidden sm:inline">Community</span></Link>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = (label.toLowerCase() === view) || (label === "Home" && view === "home");
          return <Link key={label} href={href} onClick={() => setView(label.toLowerCase())} aria-label={label} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${active ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="h-4 w-4" /><span className="hidden md:inline">{label}</span></Link>;
        })}
      </header>

      {view === "home" || view === "videos" ? <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="space-y-5">
          <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{view === "videos" ? "Watch together" : "Your community"}</p><h1 className="mt-1 text-3xl font-bold">{view === "videos" ? "Video feed" : "Good morning, resident"}</h1><p className="mt-1 text-muted-foreground">{view === "videos" ? "Short videos shared by people in your community." : "A closer, kinder feed for the people around you."}</p></div>
          {view === "home" && <div className="flex gap-3 overflow-x-auto pb-1"><button className="grid h-28 min-w-20 place-items-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-2 text-center text-xs font-semibold text-primary" onClick={() => toast.info("Create a story from the composer below")}>+<span> Your story</span></button>{stories.map((story) => <div key={story.id} className="relative grid h-28 min-w-20 place-items-end overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-secondary p-2 text-left text-xs font-semibold text-white"><Avatar className="absolute left-2 top-2 h-8 w-8 ring-2 ring-white"><AvatarImage src={story.author.image ?? undefined} /><AvatarFallback>{getInitials(story.author.name)}</AvatarFallback></Avatar><span className="line-clamp-2">{story.author.name ?? "Resident"}</span></div>)}</div>}
          {view === "home" && <Card className="border-primary/15"><CardContent className="p-4"><div className="flex gap-3"><Avatar><AvatarFallback>ME</AvatarFallback></Avatar><Textarea value={composer} onChange={(event) => setComposer(event.target.value)} placeholder="Share something with your community..." className="min-h-20 resize-none border-0 bg-muted/50 shadow-none" /></div><div className="mt-3 flex items-center justify-between gap-3 border-t pt-3"><input ref={fileRef} type="file" accept="image/*,video/*" multiple className="sr-only" onChange={readMedia} /><Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}><ImagePlus className="mr-2 h-4 w-4 text-primary" />Photo / video</Button><Button size="sm" onClick={publish} disabled={!composer.trim() && media.length === 0}><Send className="mr-2 h-4 w-4" />Publish</Button></div>{media.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{media.length} media item(s) ready to share</p>}</CardContent></Card>}
          {loading ? <Card><CardContent className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading your feed...</CardContent></Card> : filteredPosts.length === 0 ? <Card><CardContent className="py-16 text-center text-muted-foreground">No posts yet. Be the first to share something with your community.</CardContent></Card> : filteredPosts.map((post) => <Card key={post.id} className="overflow-hidden border-border/70"><CardContent className="p-0"><div className="flex items-center gap-3 p-4"><Avatar><AvatarImage src={post.author.image ?? undefined} /><AvatarFallback>{getInitials(post.author.name)}</AvatarFallback></Avatar><div className="flex-1"><p className="font-semibold">{post.author.name ?? "Resident"}</p><p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleString()}</p></div><Button variant="ghost" size="icon" aria-label="Post options"><MoreHorizontal className="h-4 w-4" /></Button></div>{post.body && <p className="px-4 pb-4 leading-7">{post.body}</p>}{mediaList(post.mediaUrls).map((url) => <img key={url} src={url} alt="Community post media" className="max-h-[520px] w-full object-cover" />)}<div className="flex items-center gap-2 border-t px-4 py-2"><Button variant="ghost" size="sm" onClick={() => react(post.id)}><Heart className="mr-2 h-4 w-4" />{post.reactions.length || "React"}</Button><Button variant="ghost" size="sm"><MessageCircle className="mr-2 h-4 w-4" />{post.comments.length || "Comment"}</Button><Button variant="ghost" size="sm" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/resident/home#${post.id}`)}><Send className="mr-2 h-4 w-4" />Share</Button></div><div className="space-y-2 bg-muted/30 px-4 py-3">{post.comments.map((item) => <p key={item.id} className="text-sm"><b>{item.author.name ?? "Resident"}</b> {item.body}</p>)}<div className="flex gap-2"><Input value={comment[post.id] ?? ""} onChange={(event) => setComment((current) => ({ ...current, [post.id]: event.target.value }))} placeholder="Write a comment..." onKeyDown={(event) => { if (event.key === "Enter") void sendComment(post.id); }} /><Button size="icon" aria-label="Send comment" onClick={() => void sendComment(post.id)}><Send className="h-4 w-4" /></Button></div></div></CardContent></Card>)}
        </main>
        <aside className="hidden space-y-4 lg:block"><Card className="bg-gradient-to-br from-primary/10 to-secondary/10"><CardContent className="p-5"><Badge variant="success">Community pulse</Badge><h2 className="mt-3 text-xl font-bold">Small actions, shared impact.</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Share recycling wins, find neighbors, and keep your barangay moving forward.</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm font-semibold">Quick links</p><div className="mt-3 space-y-2 text-sm text-muted-foreground"><Link className="block hover:text-primary" href="/resident/wallet">Reward wallet</Link><Link className="block hover:text-primary" href="/resident/centers">Nearby centers</Link><Link className="block hover:text-primary" href="/resident/leaderboard">Community leaderboard</Link></div></CardContent></Card></aside>
      </div> : <SectionPanel view={view} />}
    </div>
  );
}

function SectionPanel({ view }: { view: string }) {
  const [items, setItems] = useState<Friend[] | Listing[] | Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [listingTitle, setListingTitle] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  useEffect(() => {
    const endpoint = view === "friends" ? "/api/social/friends" : view === "shop" ? "/api/social/marketplace" : "/api/social/messages";
    fetch(endpoint).then((response) => response.json()).then((data) => setItems(view === "friends" ? data.friends ?? [] : data)).finally(() => setLoading(false));
  }, [view]);

  async function createListing() {
    if (!listingTitle.trim() || !listingPrice) return;
    const response = await fetch("/api/social/marketplace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: listingTitle, price: Number(listingPrice) }) });
    if (response.ok) { const listing = await response.json(); setListingTitle(""); setListingPrice(""); setItems((current) => [listing, ...current]); }
  }

  async function sendMessage() {
    const conversations = items as Conversation[];
    if (!message.trim() || !conversations[0]?.id) return;
    const response = await fetch("/api/social/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: items[0].id, body: message }) });
    if (response.ok) setMessage("");
  }

  if (view === "profile") return <div className="rounded-[2rem] border border-border/60 bg-card p-8 text-center shadow-sm"><UserRound className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-4 text-3xl font-bold">My profile</h1><p className="mt-2 text-muted-foreground">Manage your personal information and community identity.</p><Link href="/resident/profile" className="mt-6 inline-block"><Button>Open profile</Button></Link></div>;
  if (view === "shop") { const listings = items as Listing[]; return <div className="space-y-5"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Marketplace</p><h1 className="mt-1 text-3xl font-bold">Community shop</h1><p className="mt-1 text-muted-foreground">Buy and sell with every resident in the community.</p></div><Card><CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_160px_auto]"><Input placeholder="What are you selling?" value={listingTitle} onChange={(event) => setListingTitle(event.target.value)} /><Input type="number" placeholder="Price ₱" value={listingPrice} onChange={(event) => setListingPrice(event.target.value)} /><Button onClick={() => void createListing()}>List item</Button></CardContent></Card><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{listings.map((item) => <Card key={item.id}><CardContent className="p-5"><Badge>₱{Number(item.price).toFixed(2)}</Badge><h2 className="mt-3 font-bold">{item.title}</h2><p className="mt-1 text-sm text-muted-foreground">{item.seller?.name ?? "Resident seller"}</p><Button className="mt-4 w-full" variant="outline"><MessageCircle className="mr-2 h-4 w-4" />Message seller</Button></CardContent></Card>)}</div>{!loading && listings.length === 0 && <Card><CardContent className="py-14 text-center text-muted-foreground">No listings yet. Be the first to list something.</CardContent></Card>}</div>; }
  if (view === "messages") { const conversations = items as Conversation[]; return <div className="grid gap-5 lg:grid-cols-[280px_1fr]"><Card><CardContent className="p-4"><h1 className="text-xl font-bold">Messenger</h1><p className="mt-1 text-sm text-muted-foreground">Recent conversations</p><div className="mt-5 space-y-2">{conversations.map((conversation) => <button key={conversation.id} className="w-full rounded-xl p-3 text-left hover:bg-muted"><p className="font-medium">{conversation.members?.[0]?.user.name ?? "Conversation"}</p><p className="truncate text-xs text-muted-foreground">{conversation.messages?.[0]?.body ?? "Start a conversation"}</p></button>)}</div></CardContent></Card><Card><CardContent className="flex min-h-80 flex-col justify-end p-5"><div className="flex gap-2"><Input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a message..." onKeyDown={(event) => { if (event.key === "Enter") void sendMessage(); }} /><Button size="icon" onClick={() => void sendMessage()} aria-label="Send message"><Send className="h-4 w-4" /></Button></div></CardContent></Card></div>; }
  const friends = items as Friend[];
  return <div className="space-y-5"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Connections</p><h1 className="mt-1 text-3xl font-bold">Friends hub</h1><p className="mt-1 text-muted-foreground">Build a trusted community circle for your feed.</p></div><div className="flex gap-2"><Button variant="default">All friends</Button><Button variant="outline">Requests</Button><Button variant="outline">Suggestions</Button></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{friends.map((friend) => <Card key={friend.id}><CardContent className="flex items-center gap-3 p-4"><Avatar><AvatarImage src={friend.image ?? undefined} /><AvatarFallback>{getInitials(friend.name)}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate font-semibold">{friend.name ?? "Resident"}</p><p className="text-xs text-muted-foreground">Community friend</p></div><Button size="sm" variant="outline"><MessageCircle className="h-4 w-4" /></Button></CardContent></Card>)}</div>{!loading && friends.length === 0 && <Card><CardContent className="py-14 text-center text-muted-foreground">No friends yet. Friend requests will appear here.</CardContent></Card>}</div>;
}
