import React from 'react';
import {
  InstantSearch,
  SearchBox,
  Hits,
  RangeInput,
  Pagination,
  CurrentRefinements,
  ClearRefinements,
  Stats,
  Configure,
  useMenu,
  useRefinementList,
} from 'react-instantsearch';
import { searchClient, ALGOLIA_INDEX_NAME } from '../algolia';
import AlgoliaHit from '../components/AlgoliaHit.jsx';

function ModalityToggle() {
  const { items, refine } = useMenu({ attribute: 'modality' });
  const activeValue = items.find((i) => i.isRefined)?.value || null;

  const toggle = (value) => {
    refine(activeValue === value ? '' : value);
  };

  return (
    <div className="modality-toggle">
      <button
        className={`modality-toggle-btn ${activeValue === 'Online' ? 'active' : ''}`}
        onClick={() => toggle('Online')}
      >
        Online
      </button>
      <button
        className={`modality-toggle-btn ${activeValue === 'In-Person' ? 'active' : ''}`}
        onClick={() => toggle('In-Person')}
      >
        In-Person
      </button>
    </div>
  );
}

function MenuDropdown({ attribute, label, allLabel = 'All' }) {
  const { items, refine } = useMenu({ attribute });
  const activeValue = items.find((i) => i.isRefined)?.value || '';

  return (
    <select
      className="explore-dropdown"
      value={activeValue}
      onChange={(e) => refine(e.target.value)}
      aria-label={label}
    >
      <option value="">{allLabel}</option>
      {items.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label} ({item.count})
        </option>
      ))}
    </select>
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

  // Close dropdown when clicking outside
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

  const handleRemove = (value) => {
    refine(value);
  };

  const handleFocus = () => {
    setDropdownOpen(true);
    searchForItems(query);
  };

  return (
    <div className="tag-picker" ref={wrapperRef}>
      <div className="tag-picker-input-row">
        <input
          className="tag-picker-input"
          type="text"
          placeholder="Search tags..."
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
        />
        {selectedTags.map((tag) => (
          <span key={tag.value} className="tag-picker-chip">
            {tag.label}
            <button
              className="tag-picker-chip-remove"
              onClick={() => handleRemove(tag.value)}
            >
              x
            </button>
          </span>
        ))}
      </div>

      {dropdownOpen && suggestions.length > 0 && (
        <ul className="tag-picker-dropdown">
          {suggestions.slice(0, 8).map((item) => (
            <li
              key={item.value}
              className="tag-picker-dropdown-item"
              onMouseDown={() => handleSelect(item.value)}
            >
              <span>{item.label}</span>
              <span className="tag-picker-dropdown-count">{item.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ExplorePage() {
  const [advancedOpen, setAdvancedOpen] = React.useState(false);

  React.useEffect(() => {
    document.title = 'Explore | skillmesa';
  }, []);

  return (
    <>
      <h1>Explore</h1>
      <p>Explore everything that skillmesa has to offer. From babysitting to garden tending, from homework help to SAT prep, we're here.</p>

      <InstantSearch
        searchClient={searchClient}
        indexName={ALGOLIA_INDEX_NAME}
        routing
        future={{ preserveSharedStateOnUnmount: true }}
      >
        <Configure hitsPerPage={12} />

        <div className="explore-search-panel">
          <SearchBox placeholder="Search listings..." />

          <div className="explore-controls-row">
            <ModalityToggle />
            <TagPicker />
            <MenuDropdown attribute="type" label="Type" allLabel="All Types" />
          </div>

          <hr className="explore-divider" />

          <div className="explore-advanced-row">
            <CurrentRefinements />
            <ClearRefinements translations={{ resetButtonText: 'Clear all' }} />
            <button
              className="explore-advanced-btn"
              onClick={() => setAdvancedOpen(!advancedOpen)}
            >
              {advancedOpen ? 'Hide Advanced' : 'Advanced'}
            </button>
          </div>

          {advancedOpen && (
            <div className="explore-advanced-panel">
              <div className="explore-filter-group">
                <h4>Category</h4>
                <MenuDropdown attribute="category" label="Category" allLabel="All Categories" />
              </div>
              <div className="explore-filter-group">
                <h4>Price Range</h4>
                <RangeInput attribute="price" />
              </div>
            </div>
          )}
        </div>

        <div className="explore-results">
          <Stats />
          <Hits hitComponent={AlgoliaHit} />
          <div className="explore-pagination">
            <Pagination />
          </div>
        </div>
      </InstantSearch>
    </>
  );
}

export default ExplorePage;
