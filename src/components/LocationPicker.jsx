import React, { useState, useRef, useEffect } from 'react';
import { TextInput, Paper, Group, Text, Stack, Loader, ActionIcon, Tooltip } from '@mantine/core';
import { MapPin, LocateFixed } from 'lucide-react';

const NOMINATIM = 'https://nominatim.openstreetmap.org';

function parseResult(r) {
  const addr = r.address || {};
  const city =
    addr.city || addr.town || addr.village || addr.municipality || addr.county ||
    r.display_name.split(',')[0].trim();
  const region  = addr.state || addr.province || addr.region || '';
  const country = addr.country || '';
  const countryCode = (addr.country_code || '').toUpperCase();
  const display = [city, region, country].filter(Boolean).join(', ');
  return { display, city, region, country, countryCode, lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
}

// value: { display, city, region, country, countryCode, lat, lng } | null
// onChange: (location | null) => void
export default function LocationPicker({
  value,
  onChange,
  required,
  label = 'Location',
  placeholder = 'Search city or area…',
}) {
  const [query, setQuery]       = useState(value?.display || '');
  const [results, setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [open, setOpen]         = useState(false);
  const wrapperRef  = useRef(null);
  const debounceRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function outside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  // Sync display text when value prop changes externally (e.g. Firestore data loaded)
  useEffect(() => {
    if (value?.display) setQuery(value.display);
    else if (!value) setQuery('');
  }, [value?.display]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(e) {
    const q = e.target.value;
    setQuery(q);
    if (!q.trim()) {
      onChange(null);
      setResults([]);
      setOpen(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(q), 400);
  }

  async function doSearch(q) {
    setSearching(true);
    try {
      const url = `${NOMINATIM}/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1`;
      const data = await fetch(url).then(r => r.json());
      setResults(data);
      setOpen(true);
    } catch (err) {
      console.error('LocationPicker search:', err);
    } finally {
      setSearching(false);
    }
  }

  async function detectLocation() {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const url = `${NOMINATIM}/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&addressdetails=1`;
          const data = await fetch(url).then(r => r.json());
          const loc = parseResult({ ...data, lat: String(coords.latitude), lon: String(coords.longitude) });
          setQuery(loc.display);
          onChange(loc);
          setOpen(false);
        } catch (err) {
          console.error('LocationPicker reverse geocode:', err);
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        console.error('Geolocation denied:', err);
        setDetecting(false);
      },
    );
  }

  function select(r) {
    const loc = parseResult(r);
    setQuery(loc.display);
    onChange(loc);
    setOpen(false);
    setResults([]);
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <TextInput
        label={label}
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onFocus={() => results.length > 0 && setOpen(true)}
        required={required}
        leftSection={searching ? <Loader size={12} color="gray" /> : <MapPin size={14} />}
        rightSection={
          <Tooltip label="Detect my location" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              loading={detecting}
              onClick={detectLocation}
            >
              <LocateFixed size={14} />
            </ActionIcon>
          </Tooltip>
        }
      />

      {open && results.length > 0 && (
        <Paper
          withBorder
          shadow="sm"
          style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            marginTop: 4, zIndex: 300, maxHeight: 240, overflowY: 'auto',
          }}
        >
          {results.map((r) => {
            const p = parseResult(r);
            return (
              <Group
                key={r.place_id}
                px="sm"
                py={8}
                gap="xs"
                wrap="nowrap"
                style={{ cursor: 'pointer' }}
                onMouseDown={() => select(r)}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--mantine-color-gray-0)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <MapPin size={12} style={{ flexShrink: 0, color: 'var(--mantine-color-dimmed)', marginTop: 2 }} />
                <Stack gap={0} style={{ minWidth: 0 }}>
                  <Text size="sm" truncate>{p.city}</Text>
                  {(p.region || p.country) && (
                    <Text size="xs" c="dimmed" truncate>
                      {[p.region, p.country].filter(Boolean).join(', ')}
                    </Text>
                  )}
                </Stack>
              </Group>
            );
          })}
        </Paper>
      )}
    </div>
  );
}
