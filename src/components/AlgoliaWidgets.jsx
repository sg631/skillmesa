import React from 'react';
import {
  TextInput,
  Button,
  Group,
  Text,
  Badge,
  NumberInput,
  ActionIcon,
  Pagination as MantinePagination,
} from '@mantine/core';
import {
  useSearchBox,
  usePagination,
  useStats,
  useCurrentRefinements,
  useClearRefinements,
  useRange,
} from 'react-instantsearch';

/** Mantine-styled search box */
export function MantineSearchBox(props) {
  const { query, refine, clear } = useSearchBox(props);
  const [value, setValue] = React.useState(query);
  const inputRef = React.useRef(null);

  // Sync external query changes
  React.useEffect(() => {
    setValue(query);
  }, [query]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    refine(newValue);
  };

  const handleClear = () => {
    setValue('');
    clear();
    inputRef.current?.focus();
  };

  return (
    <TextInput
      ref={inputRef}
      value={value}
      onChange={handleChange}
      placeholder={props.placeholder || 'Search...'}
      size="md"
      radius="xl"
      rightSection={
        value ? (
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={handleClear}>
            ×
          </ActionIcon>
        ) : null
      }
      styles={{
        input: {
          border: '1px solid var(--mantine-color-gray-3)',
          '&:focus': {
            borderColor: 'var(--mantine-color-cyan-4)',
          },
        },
      }}
    />
  );
}

/** Mantine-styled pagination */
export function MantinePaginationWidget(props) {
  const { currentRefinement, nbPages, refine } = usePagination(props);

  if (nbPages <= 1) return null;

  return (
    <MantinePagination
      total={nbPages}
      value={currentRefinement + 1}
      onChange={(page) => refine(page - 1)}
      color="cyan"
      radius="md"
      withEdges
    />
  );
}

/** Mantine-styled stats */
export function MantineStats(props) {
  const { nbHits, processingTimeMS } = useStats(props);

  return (
    <Text size="sm" c="dimmed" mb="sm">
      {nbHits.toLocaleString()} result{nbHits !== 1 ? 's' : ''} found in {processingTimeMS}ms
    </Text>
  );
}

/** Mantine-styled current refinements */
export function MantineCurrentRefinements(props) {
  const { items, refine } = useCurrentRefinements(props);

  if (items.length === 0) return null;

  return (
    <Group gap={6} wrap="wrap">
      {items.map((item) =>
        item.refinements.map((refinement) => (
          <Badge
            key={`${item.attribute}-${refinement.label}`}
            variant="light"
            color="cyan"
            size="md"
            rightSection={
              <span
                style={{ cursor: 'pointer', fontWeight: 700, marginLeft: 4 }}
                onClick={() => refine(refinement)}
              >
                ×
              </span>
            }
          >
            {item.label}: {refinement.label}
          </Badge>
        ))
      )}
    </Group>
  );
}

/** Mantine-styled clear refinements */
export function MantineClearRefinements(props) {
  const { canRefine, refine } = useClearRefinements(props);

  return (
    <Button
      variant="subtle"
      color="gray"
      size="sm"
      disabled={!canRefine}
      onClick={() => refine()}
    >
      Clear all
    </Button>
  );
}

/** Mantine-styled range input */
export function MantineRangeInput({ attribute }) {
  const { start, range, refine } = useRange({ attribute });
  const [min, setMin] = React.useState('');
  const [max, setMax] = React.useState('');

  // Sync with current refinement
  React.useEffect(() => {
    setMin(start[0] !== -Infinity && start[0] !== range.min ? start[0] : '');
    setMax(start[1] !== Infinity && start[1] !== range.max ? start[1] : '');
  }, [start, range]);

  const handleSubmit = (e) => {
    e.preventDefault();
    refine([
      min === '' ? undefined : Number(min),
      max === '' ? undefined : Number(max),
    ]);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Group gap="xs" align="flex-end">
        <TextInput
          placeholder={range.min != null ? `$${range.min}` : 'Min'}
          value={min}
          onChange={(e) => setMin(e.target.value)}
          size="sm"
          radius="xl"
          style={{ width: 90 }}
          type="number"
        />
        <Text size="sm" c="dimmed">to</Text>
        <TextInput
          placeholder={range.max != null ? `$${range.max}` : 'Max'}
          value={max}
          onChange={(e) => setMax(e.target.value)}
          size="sm"
          radius="xl"
          style={{ width: 90 }}
          type="number"
        />
        <Button type="submit" variant="light" color="cyan" size="sm">
          Go
        </Button>
      </Group>
    </form>
  );
}
