import React, { useState, useEffect } from 'react';
import {
  Tabs, Stack, Group, Text, Avatar, Box, Button, Textarea,
  Loader, ActionIcon, Divider,
} from '@mantine/core';
import { Star, StarHalf, MessageSquare, Reply, Trash2 } from 'lucide-react';
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, deleteDoc,
  updateDoc, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase';

// ── Star display (1–10 scale, 5 stars with half-star support) ────────
// value: integer 0–10. Each star = 2 points. Half-star = odd value.
function StarRow({ value, interactive = false, onChange, size = 16 }) {
  const [hovered, setHovered] = useState(0);
  const display = interactive ? (hovered || value) : value;

  return (
    <Group
      gap={2}
      style={{ userSelect: 'none' }}
      onMouseLeave={() => interactive && setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map(n => {
        const leftVal  = n * 2 - 1; // half-star threshold
        const rightVal = n * 2;     // full-star threshold
        const full = display >= rightVal;
        const half = !full && display >= leftVal;
        const lit  = 'var(--mantine-color-yellow-5)';
        const dim  = 'var(--mantine-color-gray-5)';

        return (
          <Box
            key={n}
            style={{ position: 'relative', display: 'inline-flex', cursor: interactive ? 'pointer' : 'default' }}
          >
            {/* Invisible left/right click zones for half-star picking */}
            {interactive && (
              <>
                <Box
                  style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', zIndex: 1 }}
                  onMouseEnter={() => setHovered(leftVal)}
                  onClick={() => onChange?.(leftVal)}
                />
                <Box
                  style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', zIndex: 1 }}
                  onMouseEnter={() => setHovered(rightVal)}
                  onClick={() => onChange?.(rightVal)}
                />
              </>
            )}
            {full ? (
              <Star size={size} fill={lit} color={lit} />
            ) : half ? (
              <StarHalf size={size} fill={lit} color={lit} />
            ) : (
              <Star size={size} fill="none" color={dim} />
            )}
          </Box>
        );
      })}
    </Group>
  );
}

function timeAgo(ts) {
  if (!ts?.toDate) return '';
  const diff = (Date.now() - ts.toDate().getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return ts.toDate().toLocaleDateString();
}

// ── Recalc listing aggregate ─────────────────────────────────────────
async function recalcRating(listingId) {
  try {
    const snap    = await getDocs(collection(db, 'listings', listingId, 'reviews'));
    const ratings = snap.docs.map(d => d.data().rating).filter(n => typeof n === 'number');
    const avg     = ratings.length > 0
      ? ratings.reduce((s, n) => s + n, 0) / ratings.length
      : null;
    await updateDoc(doc(db, 'listings', listingId), {
      rating:      avg,
      reviewCount: ratings.length,
    });
  } catch (e) {
    console.error('recalcRating failed:', e);
  }
}

// ── Reviews tab ──────────────────────────────────────────────────────
function ReviewCard({ review, currentUserId, onDelete }) {
  const isOwn = review.authorId === currentUserId;
  return (
    <Box>
      <Group gap="sm" align="flex-start" wrap="nowrap">
        <Avatar src={review.authorPic || null} size={32} radius="xl" style={{ flexShrink: 0 }} />
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" justify="space-between" wrap="nowrap">
            <Group gap="xs" align="center" wrap="nowrap">
              <Text size="sm" fw={600}>{review.authorName || 'Anonymous'}</Text>
              <StarRow value={review.rating} size={12} />
              <Text size="xs" c="dimmed">{review.rating}/10</Text>
            </Group>
            <Group gap={4} style={{ flexShrink: 0 }}>
              <Text size="xs" c="dimmed">{timeAgo(review.createdAt)}</Text>
              {isOwn && (
                <ActionIcon variant="subtle" color="red" size="xs" onClick={onDelete}>
                  <Trash2 size={11} />
                </ActionIcon>
              )}
            </Group>
          </Group>
          {review.text && (
            <Text size="sm" mt={4} style={{ lineHeight: 1.6 }}>{review.text}</Text>
          )}
        </Box>
      </Group>
    </Box>
  );
}

function ReviewsSection({ listingId, ownerId }) {
  const user    = auth.currentUser;
  const isOwner = Boolean(user && ownerId && user.uid === ownerId);

  const [reviews, setReviews]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [myReview, setMyReview]     = useState(null);
  const [rating, setRating]         = useState(0);
  const [text, setText]             = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing]       = useState(false);

  // getDocs instead of onSnapshot to avoid Firebase SDK + React 19 StrictMode
  // internal assertion errors caused by rapid mount/unmount of listeners.
  async function loadReviews() {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'listings', listingId, 'reviews'), orderBy('createdAt', 'desc'))
      );
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReviews(all);
      setMyReview(user ? (all.find(r => r.authorId === user.uid) ?? null) : null);
    } catch (e) {
      console.error('loadReviews failed:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReviews(); }, [listingId]);

  async function submitReview() {
    if (!user || rating === 0 || submitting) return;
    setSubmitting(true);
    try {
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const ud       = userSnap.exists() ? userSnap.data() : {};
      await setDoc(doc(db, 'listings', listingId, 'reviews', user.uid), {
        rating,
        text:       text.trim(),
        authorId:   user.uid,
        authorName: ud.displayName || user.email || 'Anonymous',
        authorPic:  ud.profilePic?.currentUrl || null,
        createdAt:  serverTimestamp(),
      });
      await recalcRating(listingId);
      setEditing(false);
      await loadReviews();
    } catch (e) {
      console.error('submitReview failed:', e);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteMyReview() {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'listings', listingId, 'reviews', user.uid));
      await recalcRating(listingId);
      setRating(0);
      setText('');
      setEditing(false);
      await loadReviews();
    } catch (e) {
      console.error('deleteReview failed:', e);
    }
  }

  function startEditing() {
    if (myReview) { setRating(myReview.rating); setText(myReview.text || ''); }
    setEditing(true);
  }

  const avg = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  if (loading) return <Group justify="center" py="xl"><Loader color="gray" size="sm" /></Group>;

  return (
    <Stack gap="lg">
      {/* Summary bar */}
      {avg !== null && (
        <Group gap="sm" align="center">
          <Text size="xl" fw={700}>{avg.toFixed(1)}</Text>
          <Text size="sm" c="dimmed" fw={500}>/10</Text>
          <StarRow value={Math.round(avg)} size={18} />
          <Text size="sm" c="dimmed">
            ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
          </Text>
        </Group>
      )}

      {/* Write / edit form */}
      {user && !isOwner && (
        <>
          {!editing && !myReview && (
            <Button variant="default" size="xs" w="fit-content" onClick={() => setEditing(true)}>
              Write a review
            </Button>
          )}
          {!editing && myReview && (
            <Group gap="xs">
              <Text size="xs" c="dimmed">You reviewed this listing.</Text>
              <Button variant="subtle" color="gray" size="xs" onClick={startEditing}>Edit</Button>
            </Group>
          )}
          {editing && (
            <Stack gap="xs">
              <Group gap="xs" align="center">
                <Text size="xs" fw={500} c="dimmed">Your rating</Text>
                {rating > 0 && (
                  <Text size="xs" c="yellow" fw={600}>{rating}/10</Text>
                )}
              </Group>
              <StarRow value={rating} interactive onChange={setRating} size={24} />
              <Textarea
                placeholder="Share your experience (optional)"
                value={text}
                onChange={e => setText(e.target.value)}
                minRows={2}
                autosize
                size="sm"
              />
              <Group gap="xs">
                <Button size="xs" disabled={rating === 0} loading={submitting} onClick={submitReview}>
                  {myReview ? 'Update review' : 'Submit review'}
                </Button>
                <Button size="xs" variant="subtle" color="gray" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                {myReview && (
                  <Button size="xs" variant="subtle" color="red" onClick={deleteMyReview}>
                    Delete review
                  </Button>
                )}
              </Group>
            </Stack>
          )}
        </>
      )}
      {isOwner && (
        <Text size="xs" c="dimmed">You cannot review your own listing.</Text>
      )}
      {!user && (
        <Text size="sm" c="dimmed">Sign in to leave a review.</Text>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="md">
          No reviews yet.{!isOwner && user ? ' Be the first!' : ''}
        </Text>
      ) : (
        <Stack gap="md">
          {reviews.map((r, i) => (
            <React.Fragment key={r.id}>
              {i > 0 && <Divider />}
              <ReviewCard review={r} currentUserId={user?.uid} onDelete={deleteMyReview} />
            </React.Fragment>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

// ── Comments tab ─────────────────────────────────────────────────────
function CommentItem({ comment, currentUserId, onDelete, onReply, depth = 0 }) {
  const isOwn = comment.authorId === currentUserId;
  return (
    <Box style={{ paddingLeft: depth > 0 ? 32 : 0 }}>
      <Group gap="sm" align="flex-start" wrap="nowrap">
        <Avatar src={comment.authorPic || null} size={28} radius="xl" style={{ flexShrink: 0 }} />
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" justify="space-between" wrap="nowrap">
            <Text size="sm" fw={600}>{comment.authorName || 'Anonymous'}</Text>
            <Group gap={4} style={{ flexShrink: 0 }}>
              <Text size="xs" c="dimmed">{timeAgo(comment.createdAt)}</Text>
              {depth === 0 && currentUserId && (
                <ActionIcon variant="subtle" color="gray" size="xs" onClick={() => onReply(comment)}>
                  <Reply size={11} />
                </ActionIcon>
              )}
              {isOwn && (
                <ActionIcon variant="subtle" color="red" size="xs" onClick={() => onDelete(comment.id)}>
                  <Trash2 size={11} />
                </ActionIcon>
              )}
            </Group>
          </Group>
          <Text size="sm" mt={2} style={{ lineHeight: 1.6 }}>
            {comment.parentName && (
              <Text span size="xs" c="dimmed" fw={500}>@{comment.parentName} </Text>
            )}
            {comment.text}
          </Text>
        </Box>
      </Group>
    </Box>
  );
}

function CommentsSection({ listingId }) {
  const user = auth.currentUser;
  const [comments, setComments]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [text, setText]             = useState('');
  const [replyTo, setReplyTo]       = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadComments() {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'listings', listingId, 'comments'), orderBy('createdAt', 'asc'))
      );
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error('loadComments failed:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadComments(); }, [listingId]);

  async function submitComment() {
    if (!user || !text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const ud       = userSnap.exists() ? userSnap.data() : {};
      await addDoc(collection(db, 'listings', listingId, 'comments'), {
        text:       text.trim(),
        authorId:   user.uid,
        authorName: ud.displayName || user.email || 'Anonymous',
        authorPic:  ud.profilePic?.currentUrl || null,
        parentId:   replyTo?.id ?? null,
        parentName: replyTo?.authorName ?? null,
        createdAt:  serverTimestamp(),
      });
      setText('');
      setReplyTo(null);
      await loadComments();
    } catch (e) {
      console.error('submitComment failed:', e);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteComment(commentId) {
    try {
      await deleteDoc(doc(db, 'listings', listingId, 'comments', commentId));
      await loadComments();
    } catch (e) {
      console.error('deleteComment failed:', e);
    }
  }

  const topLevel = comments.filter(c => !c.parentId);
  const replies  = comments.filter(c => c.parentId);

  if (loading) return <Group justify="center" py="xl"><Loader color="gray" size="sm" /></Group>;

  return (
    <Stack gap="lg">
      {user ? (
        <Stack gap="xs">
          {replyTo && (
            <Group gap="xs">
              <Text size="xs" c="dimmed">
                Replying to <Text span fw={600}>{replyTo.authorName}</Text>
              </Text>
              <ActionIcon
                variant="subtle" color="gray" size="xs"
                onClick={() => setReplyTo(null)}
                aria-label="Cancel reply"
              >
                <Trash2 size={10} />
              </ActionIcon>
            </Group>
          )}
          <Textarea
            placeholder={replyTo ? `Reply to ${replyTo.authorName}…` : 'Add a comment…'}
            value={text}
            onChange={e => setText(e.target.value)}
            minRows={2}
            autosize
            size="sm"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment(); }}
          />
          <Group gap="xs">
            <Button size="xs" disabled={!text.trim()} loading={submitting} onClick={submitComment}>
              {replyTo ? 'Reply' : 'Comment'}
            </Button>
            {replyTo && (
              <Button size="xs" variant="subtle" color="gray"
                onClick={() => { setReplyTo(null); setText(''); }}
              >
                Cancel
              </Button>
            )}
          </Group>
        </Stack>
      ) : (
        <Text size="sm" c="dimmed">Sign in to leave a comment.</Text>
      )}

      {topLevel.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="md">
          No comments yet.{user ? ' Start the conversation!' : ''}
        </Text>
      ) : (
        <Stack gap="md">
          {topLevel.map((c, i) => {
            const childReplies = replies.filter(r => r.parentId === c.id);
            return (
              <Box key={c.id}>
                {i > 0 && <Divider mb="md" />}
                <CommentItem
                  comment={c}
                  currentUserId={user?.uid}
                  onDelete={deleteComment}
                  onReply={setReplyTo}
                />
                {childReplies.map(r => (
                  <Box key={r.id} mt="sm">
                    <CommentItem
                      comment={r}
                      currentUserId={user?.uid}
                      onDelete={deleteComment}
                      onReply={() => {}}
                      depth={1}
                    />
                  </Box>
                ))}
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}

// ── Exported tabbed component ────────────────────────────────────────
export default function ListingFeedback({ listingId, ownerId, reviewCount }) {
  return (
    <Tabs defaultValue="ratings" keepMounted={false}>
      <Tabs.List>
        <Tabs.Tab value="ratings" leftSection={<Star size={13} />}>
          Ratings{reviewCount > 0 ? ` (${reviewCount})` : ''}
        </Tabs.Tab>
        <Tabs.Tab value="comments" leftSection={<MessageSquare size={13} />}>
          Comments
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="ratings" pt="lg">
        <ReviewsSection listingId={listingId} ownerId={ownerId} />
      </Tabs.Panel>
      <Tabs.Panel value="comments" pt="lg">
        <CommentsSection listingId={listingId} />
      </Tabs.Panel>
    </Tabs>
  );
}
