import React, { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Center, Loader, Text, Stack } from '@mantine/core';

const SOURCE_PATTERNS = [
  { key: 'facebook',  test: r => /facebook\.com|fb\.me|fbclid/.test(r) },
  { key: 'instagram', test: r => /instagram\.com/.test(r) },
  { key: 'twitter',   test: r => /twitter\.com|t\.co|x\.com/.test(r) },
  { key: 'whatsapp',  test: r => /whatsapp\.com|wa\.me/.test(r) },
  { key: 'reddit',    test: r => /reddit\.com|redd\.it/.test(r) },
  { key: 'tiktok',    test: r => /tiktok\.com/.test(r) },
  { key: 'youtube',   test: r => /youtube\.com|youtu\.be/.test(r) },
  { key: 'google',    test: r => /google\./.test(r) },
  { key: 'linkedin',  test: r => /linkedin\.com/.test(r) },
];

function detectSource(referrer) {
  if (!referrer) return 'direct';
  const lower = referrer.toLowerCase();
  for (const { key, test } of SOURCE_PATTERNS) {
    if (test(lower)) return key;
  }
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    return host || 'other';
  } catch {
    return 'other';
  }
}

export default function AliasRedirectPage() {
  const { alias }        = useParams();
  const navigate         = useNavigate();
  const [searchParams]   = useSearchParams();

  useEffect(() => {
    if (!alias) { navigate('/', { replace: true }); return; }

    async function redirect() {
      try {
        const snap = await getDoc(doc(db, 'shareLinks', alias));
        if (!snap.exists()) { navigate('/404', { replace: true }); return; }

        const { listingId } = snap.data();
        // ?src=platform baked in by ShareModal takes precedence over referrer detection
        const source = searchParams.get('src') || detectSource(document.referrer);

        // Fire-and-forget — don't block the redirect on this
        updateDoc(doc(db, 'shareLinks', alias), {
          totalClicks:         increment(1),
          [`sources.${source}`]: increment(1),
          lastClickAt:         serverTimestamp(),
        }).catch(() => {});

        navigate(`/listing/${listingId}`, { replace: true });
      } catch {
        navigate('/', { replace: true });
      }
    }

    redirect();
  }, [alias]);

  return (
    <Center py="xl">
      <Stack align="center" gap="sm">
        <Loader color="gray" />
        <Text c="dimmed" size="sm">Opening link…</Text>
      </Stack>
    </Center>
  );
}
