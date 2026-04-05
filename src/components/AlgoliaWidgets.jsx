import React from 'react';
import {
  TextInput,
  Button,
  Group,
  Text,
  Badge,
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
import { X } from 'lucide-react';

export function MantineSearchBox(props) {
  const { query, refine, clear } = useSearchBox(props);
  const [value, setValue] = React.useState(query);
  const inputRef = React.useRef(null);

  React.useEffect(() => { setValue(query); }, [query]);

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
      rightSection={
        value ? (
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={handleClear}>
            <X size={14} />
          </ActionIcon>
        ) : null
      }
    />
  );
}

export function MantinePaginationWidget(props) {
  const { currentRefinement, nbPages, refine } = usePagination(props);
  if (nbPages <= 1) return null;
  return (
    <MantinePagination
      total={nbPages}
      value={currentRefinement + 1}
      onChange={(page) => refine(page - 1)}
      withEdges
    />
  );
}

export function MantineStats(props) {
  const { nbHits, processingTimeMS } = useStats(props);
  return (
    <Text size="sm" c="dimmed">
      {nbHits.toLocaleString()} result{nbHits !== 1 ? 's' : ''} in {processingTimeMS}ms
    </Text>
  );
}

export function MantineCurrentRefinements(props) {
  const { items, refine } = useCurrentRefinements(props);
  if (items.length === 0) return null;
  return (
    <Group gap={6} wrap="wrap">
      {items.map((item) =>
        item.refinements.map((refinement) => (
          <Badge
            key={`${item.attribute}-${refinement.label}`}
            variant="outline"
            color="gray"
            size="sm"
            rightSection={
              <span
                style={{ cursor: 'pointer', fontWeight: 700, marginLeft: 2 }}
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

export function MantineClearRefinements(props) {
  const { canRefine, refine } = useClearRefinements(props);
  return (
    <Button variant="subtle" color="gray" size="sm" disabled={!canRefine} onClick={() => refine()}>
      Clear all
    </Button>
  );
}

export function MantineRangeInput({ attribute }) {
  const { start, range, refine } = useRange({ attribute });
  const [min, setMin] = React.useState('');
  const [max, setMax] = React.useState('');

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
          style={{ width: 90 }}
          type="number"
        />
        <Text size="sm" c="dimmed">–</Text>
        <TextInput
          placeholder={range.max != null ? `$${range.max}` : 'Max'}
          value={max}
          onChange={(e) => setMax(e.target.value)}
          size="sm"
          style={{ width: 90 }}
          type="number"
        />
        <Button type="submit" variant="default" size="sm">Apply</Button>
      </Group>
    </form>
  );
}
