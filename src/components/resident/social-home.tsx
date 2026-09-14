"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, MessageCircle, MoreHorizontal, Send, Sparkles, Heart, Loader2, UserRound } from "lucide-react";
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
type FriendCard = Author & { status?: "FRIEND" | "INCOMING" | "SUGGESTION"; mutualCount?: number; requestId?: string };

function mediaList(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }

export function SocialHome({ initialView = "home" }: { initialView?: string }) {
  const searchParams = useSearchParams();
  const [view, setView] = useState(searchParams.get("view") ?? initialView);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [composer, setComposer] = useState("");
  const [media, setMedia] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setView(searchParams.get("view") ?? "home");
  }, [searchParams]);

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
  const [items, setItems] = useState<FriendCard[] | Listing[] | Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [listingTitle, setListingTitle] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  const [listingImage, setListingImage] = useState("");
  const listingFileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const endpoint = view === "friends" ? "/api/social/friends" : view === "shop" ? "/api/social/marketplace" : "/api/social/messages";
    fetch(endpoint).then((response) => response.json()).then((data) => setItems(view === "friends" ? [...(data.friends ?? []), ...(data.requests ?? []).map((item: FriendCard) => ({ ...item, requestId: item.requestId })), ...(data.suggestions ?? [])] : data)).finally(() => setLoading(false));
  }, [view]);

  async function createListing() {
    if (!listingTitle.trim() || !listingPrice) return;
    const response = await fetch("/api/social/marketplace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: listingTitle, price: Number(listingPrice), imageUrls: listingImage ? [listingImage] : [] }) });
    if (response.ok) { const listing = await response.json(); setListingTitle(""); setListingPrice(""); setListingImage(""); setItems((current) => [listing, ...current]); }
  }

  function handleListingImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file.");
    if (file.size > 6 * 1024 * 1024) return toast.error("The item image must be smaller than 6 MB.");
    const reader = new FileReader();
    reader.onload = () => setListingImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function sendMessage() {
    const conversations = items as Conversation[];
    if (!message.trim() || !conversations[0]?.id) return;
    const response = await fetch("/api/social/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: items[0].id, body: message }) });
    if (response.ok) setMessage("");
  }

  async function updateFriendRequest(requestId: string, status: "ACCEPTED" | "DECLINED") {
    const response = await fetch("/api/social/friends", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId, status }) });
    if (response.ok) {
      const refreshed = await fetch("/api/social/friends").then((res) => res.json());
      setItems([...(refreshed.friends ?? []), ...(refreshed.requests ?? []), ...(refreshed.suggestions ?? [])]);
      toast.success(status === "ACCEPTED" ? "Friend request accepted" : "Friend request removed");
    }
  }

  async function sendFriendRequest(receiverId: string) {
    const response = await fetch("/api/social/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId }) });
    if (response.ok) { setItems((current) => current.filter((item) => item.id !== receiverId)); toast.success("Friend request sent"); }
  }

  if (view === "profile") return <div className="rounded-[2rem] border border-border/60 bg-card p-8 text-center shadow-sm"><UserRound className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-4 text-3xl font-bold">My profile</h1><p className="mt-2 text-muted-foreground">Manage your personal information and community identity.</p><Link href="/resident/profile" className="mt-6 inline-block"><Button>Open profile</Button></Link></div>;
  if (view === "shop") { const listings = items as Listing[]; return <div className="space-y-5"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Marketplace</p><h1 className="mt-1 text-3xl font-bold">Community shop</h1><p className="mt-1 text-muted-foreground">Buy and sell with every resident in the community.</p></div><Card><CardContent className="space-y-3 p-4"><div className="grid gap-3 sm:grid-cols-[1fr_160px_auto]"><Input placeholder="What are you selling?" value={listingTitle} onChange={(event) => setListingTitle(event.target.value)} /><Input type="number" placeholder="Price ₱" value={listingPrice} onChange={(event) => setListingPrice(event.target.value)} /><Button onClick={() => void createListing()}>List item</Button></div><input ref={listingFileRef} type="file" accept="image/*" className="sr-only" onChange={handleListingImage} /><Button type="button" variant="outline" size="sm" onClick={() => listingFileRef.current?.click()}><ImagePlus className="mr-2 h-4 w-4" />{listingImage ? "Change item image" : "Add item image"}</Button>{listingImage && <img src={listingImage} alt="New marketplace item preview" className="h-28 w-28 rounded-xl object-cover ring-1 ring-border" />}</CardContent></Card><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{listings.map((item) => <Card key={item.id} className="overflow-hidden"><CardContent className="p-0">{Array.isArray((item as Listing & { imageUrls?: unknown }).imageUrls) && ((item as Listing & { imageUrls?: unknown }).imageUrls as string[])[0] && <img src={((item as Listing & { imageUrls?: unknown }).imageUrls as string[])[0]} alt={item.title} className="h-44 w-full object-cover" />}<div className="p-5"><Badge>₱{Number(item.price).toFixed(2)}</Badge><h2 className="mt-3 font-bold">{item.title}</h2><p className="mt-1 text-sm text-muted-foreground">{item.seller?.name ?? "Resident seller"}</p><Button className="mt-4 w-full" variant="outline"><MessageCircle className="mr-2 h-4 w-4" />Message seller</Button></div></CardContent></Card>)}</div>{!loading && listings.length === 0 && <Card><CardContent className="py-14 text-center text-muted-foreground">No listings yet. Be the first to list something.</CardContent></Card>}</div>; }
  if (view === "messages") { const conversations = items as Conversation[]; return <div className="grid gap-5 lg:grid-cols-[280px_1fr]"><Card><CardContent className="p-4"><h1 className="text-xl font-bold">Messenger</h1><p className="mt-1 text-sm text-muted-foreground">Recent conversations</p><div className="mt-5 space-y-2">{conversations.map((conversation) => <button key={conversation.id} className="w-full rounded-xl p-3 text-left hover:bg-muted"><p className="font-medium">{conversation.members?.[0]?.user.name ?? "Conversation"}</p><p className="truncate text-xs text-muted-foreground">{conversation.messages?.[0]?.body ?? "Start a conversation"}</p></button>)}</div></CardContent></Card><Card><CardContent className="flex min-h-80 flex-col justify-end p-5"><div className="flex gap-2"><Input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a message..." onKeyDown={(event) => { if (event.key === "Enter") void sendMessage(); }} /><Button size="icon" onClick={() => void sendMessage()} aria-label="Send message"><Send className="h-4 w-4" /></Button></div></CardContent></Card></div>; }
  const friends = items as FriendCard[];
  const incoming = friends.filter((friend) => friend.status === "INCOMING");
  const accepted = friends.filter((friend) => friend.status === "FRIEND");
  const suggestions = friends.filter((friend) => friend.status === "SUGGESTION");
  const personCard = (person: FriendCard, action: React.ReactNode, detail: string) => <Card key={person.id} className="overflow-hidden"><CardContent className="p-0"><div className="flex h-36 items-center justify-center bg-muted/40">{person.image ? <img src={person.image} alt={`${person.name ?? "Resident"} profile`} className="h-full w-full object-cover" /> : <Avatar className="h-20 w-20"><AvatarFallback className="text-2xl">{getInitials(person.name)}</AvatarFallback></Avatar>}</div><div className="p-3"><p className="truncate font-semibold">{person.name ?? "Resident"}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p><div className="mt-3 flex gap-2">{action}</div></div></CardContent></Card>;
  return <div className="space-y-7"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Connections</p><h1 className="mt-1 text-3xl font-bold">Friends hub</h1><p className="mt-1 text-muted-foreground">Connect with residents and discover mutual friends.</p></div>{incoming.length > 0 && <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Friend requests</h2><Badge>{incoming.length} pending</Badge></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{incoming.map((person) => personCard(person, <><Button size="sm" className="flex-1" onClick={() => void updateFriendRequest(person.requestId!, "ACCEPTED")}>Confirm</Button><Button size="sm" variant="outline" className="flex-1" onClick={() => void updateFriendRequest(person.requestId!, "DECLINED")}>Delete</Button></>, "Wants to connect with you"))}</div></section>}<section><h2 className="mb-3 text-lg font-bold">People you may know</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{suggestions.map((person) => personCard(person, <Button size="sm" className="w-full" onClick={() => void sendFriendRequest(person.id)}>Add friend</Button>, person.mutualCount ? `${person.mutualCount} mutual friends` : "Resident in your community"))}</div>{!loading && suggestions.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">All available residents are already connected or have a pending request.</p>}</section><section><h2 className="mb-3 text-lg font-bold">Your friends</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{accepted.map((person) => personCard(person, <Button size="sm" variant="outline" className="w-full"><MessageCircle className="mr-2 h-4 w-4" />Message</Button>, person.mutualCount ? `${person.mutualCount} mutual friends` : "Community friend"))}</div>{!loading && accepted.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Accept requests to build your friend list.</p>}</section></div>;
}
