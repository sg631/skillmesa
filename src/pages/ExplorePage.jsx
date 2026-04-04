import React from 'react';
import { Title, Text, Button, Group, Paper, Stack, Badge, Divider, Select, SimpleGrid, Pill, PillsInput } from '@mantine/core';
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

  const toggle = (value) => {
    refine(activeValue === value ? '' : value);
  };

  return (
    <Group gap={0} style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-xl)', overflow: 'hidden' }}>
      <Button
        variant={activeValue === 'Online' ? 'filled' : 'subtle'}
        color={activeValue === 'Online' ? 'cyan' : 'gray'}
        radius={0}
        size="sm"
        onClick={() => toggle('Online')}
      >
        Online
      </Button>
      <Button
        variant={activeValue === 'In-Person' ? 'filled' : 'subtle'}
        color={activeValue === 'In-Person' ? 'cyan' : 'gray'}
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
      radius="xl"
      style={{ minWidth: 180 }}
      aria-label={label}
    />
  );
}

function TagPicker() {
  const { items, refine, searchForItems } = useRefinementList({
    attribute: 'tags',
    limit: 50,
  });

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
    <div ref={wrapperRef} style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
      <PillsInput size="sm" radius="xl">
        <Pill.Group>
          {selectedTags.map((tag) => (
            <Pill
              key={tag.value}
              withRemoveButton
              onRemove={() => refine(tag.value)}
            >
              {tag.label}
            </Pill>
          ))}
          <PillsInput.Field
            placeholder="Search tags..."
            value={query}
            onChange={handleInputChange}
            onFocus={() => { setDropdownOpen(true); searchForItems(query); }}
          />
        </Pill.Group>
      </PillsInput>

      {dropdownOpen && suggestions.length > 0 && (
        <Paper
          shadow="md"
          radius="md"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            zIndex: 100,
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {suggestions.slice(0, 8).map((item) => (
            <Group
              key={item.value}
              justify="space-between"
              px="sm"
              py={6}
              style={{ cursor: 'pointer', fontSize: 14, transition: 'background 0.1s' }}
              onMouseDown={() => handleSelect(item.value)}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--mantine-color-cyan-0)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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

/** Custom Hits grid using Mantine SimpleGrid */
function MantineHitsGrid() {
  const { hits } = useHits();

  if (hits.length === 0) {
    return <Text ta="center" c="dimmed" py="xl">No results found.</Text>;
  }

  return (
    <SimpleGrid
      cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}
      spacing="lg"
      verticalSpacing="lg"
    >
      {hits.map((hit) => (
        <div key={hit.objectID} style={{ display: 'flex', justifyContent: 'center' }}>
          <AlgoliaHit hit={hit} />
        </div>
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
    <Stack gap="md" py="xl" maw={1600} mx="auto" px="md">
      <Title order={1} ta="center">Explore</Title>
      <Text ta="center" c="dimmed">
        Explore everything that skillmesa has to offer. From babysitting to garden tending, from homework help to SAT prep, we're here.
      </Text>

      <InstantSearch
        searchClient={searchClient}
        indexName={ALGOLIA_INDEX_NAME}
        routing
        future={{ preserveSharedStateOnUnmount: true }}
      >
        <Configure hitsPerPage={12} />

        {/* Search & Filters Panel */}
        <Paper shadow="sm" p="lg" radius="lg" bg="gray.0">
          <MantineSearchBox placeholder="Search listings..." />

          <Group mt="md" gap="sm" wrap="wrap" align="center">
            <ModalityToggle />
            <TagPicker />
            <MenuDropdown attribute="type" label="Type" allLabel="All Types" />
          </Group>

          <Divider my="sm" />

          <Group justify="space-between" align="center" wrap="wrap">
            <MantineCurrentRefinements />
            <Group gap="xs">
              <MantineClearRefinements />
              <Button
                variant="light"
                color="cyan"
                size="sm"
                onClick={() => setAdvancedOpen(!advancedOpen)}
              >
                {advancedOpen ? 'Hide Advanced' : 'Advanced'}
              </Button>
            </Group>
          </Group>

          {advancedOpen && (
            <Paper p="md" radius="md" mt="sm" bg="white">
              <Group gap="xl" wrap="wrap">
                <Stack gap="xs" style={{ flex: '1 1 200px', maxWidth: 350 }}>
                  <Text size="sm" fw={600} c="dimmed">Category</Text>
                  <MenuDropdown attribute="category" label="Category" allLabel="All Categories" />
                </Stack>
                <Stack gap="xs" style={{ flex: '1 1 200px', maxWidth: 350 }}>
                  <Text size="sm" fw={600} c="dimmed">Price Range</Text>
                  <MantineRangeInput attribute="price" />
                </Stack>
              </Group>
            </Paper>
          )}
        </Paper>

        {/* Results */}
        <Stack gap="md">
          <MantineStats />
          <MantineHitsGrid />
          <Group justify="center" mt="lg">
            <MantinePaginationWidget />
          </Group>
        </Stack>
      </InstantSearch>
    </Stack>
  );
}

export default ExplorePage;
