import React from 'react';
import { Title, Text, Button, Group, Paper, Stack, Select, Pill, PillsInput, Divider, SimpleGrid } from '@mantine/core';
import {
  InstantSearch,
  useHits,
  Configure,
  useMenu,
  useRefinementList,
} from 'react-instantsearch';
import { searchClient, ALGOLIA_INDEX_NAME } from '../algolia';
import AlgoliaHit from '../components/AlgoliaHit.jsx';
import {
  MantineSearchBox,
  MantinePaginationWidget,
  MantineStats,
  MantineCurrentRefinements,
  MantineClearRefinements,
  MantineRangeInput,
} from '../components/AlgoliaWidgets.jsx';

function ModalityToggle() {
  const { items, refine } = useMenu({ attribute: 'modality' });
  const activeValue = items.find((i) => i.isRefined)?.value || null;

  const toggle = (value) => refine(activeValue === value ? '' : value);

  return (
    <Group gap={0} style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-sm)', overflow: 'hidden' }}>
      <Button
        variant={activeValue === 'Online' ? 'filled' : 'subtle'}
        color={activeValue === 'Online' ? 'dark' : 'gray'}
        radius={0}
        size="sm"
        onClick={() => toggle('Online')}
      >
        Online
      </Button>
      <Button
        variant={activeValue === 'In-Person' ? 'filled' : 'subtle'}
        color={activeValue === 'In-Person' ? 'dark' : 'gray'}
        radius={0}
        size="sm"
        onClick={() => toggle('In-Person')}
      >
        In-Person
      </Button>
    </Group>
  );
}

function MenuDropdown({ attribute, label, allLabel = 'All' }) {
  const { items, refine } = useMenu({ attribute });
  const activeValue = items.find((i) => i.isRefined)?.value || '';

  return (
    <Select
      placeholder={allLabel}
      value={activeValue || null}
      onChange={(val) => refine(val || '')}
      data={[
        { value: '', label: allLabel },
        ...items.map((item) => ({
          value: item.value,
          label: `${item.label} (${item.count})`,
        })),
      ]}
      clearable
      size="sm"
      style={{ minWidth: 160 }}
      aria-label={label}
    />
  );
}

function TagPicker() {
  const { items, refine, searchForItems } = useRefinementList({ attribute: 'tags', limit: 50 });
  const [query, setQuery] = React.useState('');
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const wrapperRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedTags = items.filter((i) => i.isRefined);
  const suggestions = items.filter((i) => !i.isRefined);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    searchForItems(value);
    setDropdownOpen(true);
  };

  const handleSelect = (value) => {
    refine(value);
    setQuery('');
    searchForItems('');
    setDropdownOpen(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
      <PillsInput size="sm">
        <Pill.Group>
          {selectedTags.map((tag) => (
            <Pill key={tag.value} withRemoveButton onRemove={() => refine(tag.value)}>
              {tag.label}
            </Pill>
          ))}
          <PillsInput.Field
            placeholder="Filter by tag…"
            value={query}
            onChange={handleInputChange}
            onFocus={() => { setDropdownOpen(true); searchForItems(query); }}
          />
        </Pill.Group>
      </PillsInput>

      {dropdownOpen && suggestions.length > 0 && (
        <Paper
          withBorder
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            zIndex: 100,
            maxHeight: 220,
            overflowY: 'auto',
          }}
        >
          {suggestions.slice(0, 8).map((item) => (
            <Group
              key={item.value}
              justify="space-between"
              px="sm"
              py={6}
              style={{ cursor: 'pointer', fontSize: 13 }}
              onMouseDown={() => handleSelect(item.value)}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--mantine-color-gray-0)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span>{item.label}</span>
              <Text size="xs" c="dimmed">{item.count}</Text>
            </Group>
          ))}
        </Paper>
      )}
    </div>
  );
}

function MantineHitsGrid() {
  const { hits } = useHits();

  if (hits.length === 0) {
    return <Text ta="center" c="dimmed" py="xl">No results found.</Text>;
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3, xl: 4 }} spacing="md">
      {hits.map((hit) => (
        <AlgoliaHit key={hit.objectID} hit={hit} />
      ))}
    </SimpleGrid>
  );
}

function ExplorePage() {
  const [advancedOpen, setAdvancedOpen] = React.useState(false);

  React.useEffect(() => {
    document.title = 'Explore | skillmesa';
  }, []);

  return (
    <Stack gap="lg" py="xl" maw={1400} mx="auto" px="md">
      <div>
        <Title order={2}>Explore</Title>
        <Text size="sm" c="dimmed" mt={4}>
          Browse services and classes posted by people near you.
        </Text>
      </div>

      <InstantSearch
        searchClient={searchClient}
        indexName={ALGOLIA_INDEX_NAME}
        routing
        future={{ preserveSharedStateOnUnmount: true }}
        cleanUrlOnDispose={false}
      >
        <Configure hitsPerPage={12} />

        {/* Filter bar */}
        <Paper withBorder p="md">
          <MantineSearchBox placeholder="Search listings…" />

          <Group mt="sm" gap="sm" wrap="wrap" align="center">
            <ModalityToggle />
            <TagPicker />
            <MenuDropdown attribute="type" label="Type" allLabel="All Types" />
            <Group gap="xs" ml="auto">
              <MantineClearRefinements />
              <Button
                variant="default"
                size="sm"
                onClick={() => setAdvancedOpen(!advancedOpen)}
              >
                {advancedOpen ? 'Hide filters' : 'More filters'}
              </Button>
            </Group>
          </Group>

          {advancedOpen && (
            <>
              <Divider my="sm" />
              <Group gap="xl" wrap="wrap">
                <Stack gap={4} style={{ flex: '1 1 180px', maxWidth: 300 }}>
                  <Text size="xs" fw={500} c="dimmed">Category</Text>
                  <MenuDropdown attribute="category" label="Category" allLabel="All Categories" />
                </Stack>
                <Stack gap={4} style={{ flex: '1 1 180px', maxWidth: 300 }}>
                  <Text size="xs" fw={500} c="dimmed">Price Range</Text>
                  <MantineRangeInput attribute="price" />
                </Stack>
              </Group>
            </>
          )}

          <MantineCurrentRefinements />
        </Paper>

        {/* Results */}
        <Stack gap="sm">
          <MantineStats />
          <MantineHitsGrid />
          <Group justify="center" mt="md">
            <MantinePaginationWidget />
          </Group>
        </Stack>
      </InstantSearch>
    </Stack>
  );
}

export default ExplorePage;
