import React from 'react';
import ListingsPanel from '../components/ListingsPanel.jsx';
import { db } from '../firebase';
import { collection, query, where } from 'firebase/firestore';

function useExploreSearch(listingsColl) {
    // UI form state (what the user is editing)
    const [searchInput, setSearchInput] = React.useState('');
    const [zipInput, setZipInput] = React.useState('');
    const [typeInput, setTypeInput] = React.useState('irrelevant');
    const [modalityInput, setModalityInput] = React.useState('irrelevant');
    const [minPriceInput, setMinPriceInput] = React.useState('');
    const [maxPriceInput, setMaxPriceInput] = React.useState('');
    const [tagsInput, setTagsInput] = React.useState('');

    // "Applied" snapshot — the query is built from this only. This lets the user
    // edit freely and then press "Update Filters" to actually run the query.
    const [applied, setApplied] = React.useState({
        search: '',
        zip: '',
        typeFilter: 'irrelevant',
        modality: 'irrelevant',
        minPrice: '',
        maxPrice: '',
        tags: ''
    });

    const parsePrice = (v) => {
        if (v === '' || v === null || v === undefined) return null;
        const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
        return Number.isFinite(n) ? n : null;
    };

    const applyFilters = React.useCallback(() => {
        setApplied({
            search: searchInput,
            zip: zipInput,
            typeFilter: typeInput,
            modality: modalityInput,
            minPrice: minPriceInput,
            maxPrice: maxPriceInput,
            tags: tagsInput
        });
    }, [searchInput, zipInput, typeInput, modalityInput, minPriceInput, maxPriceInput, tagsInput]);

    const resetFilters = React.useCallback(() => {
        setSearchInput('');
        setZipInput('');
        setTypeInput('irrelevant');
        setModalityInput('irrelevant');
        setMinPriceInput('');
        setMaxPriceInput('');
        setTagsInput('');
        setApplied({
            search: '',
            zip: '',
            typeFilter: 'irrelevant',
            modality: 'irrelevant',
            minPrice: '',
            maxPrice: '',
            tags: ''
        });
    }, []);

    const searchQuery = React.useMemo(() => {
        const clauses = [];

        const search = (applied.search || '').trim();
        const zip = applied.zip || '';
        const typeFilter = applied.typeFilter;
        const modality = applied.modality;
        const minPrice = applied.minPrice;
        const maxPrice = applied.maxPrice;
        const tags = applied.tags || '';

        // split keywords (max 10 tokens) — still useful for client-side matching if you add that later
        const words = search
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 10);

        const tagList = tags
            .split(',')
            .map(t => t.trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 10);

        // type filter
        let mappedType = null;
        if (typeFilter && typeFilter !== 'irrelevant') {
            mappedType = typeFilter.toLowerCase().includes('class') ? 'class' : 'service';
            clauses.push(where('type', '==', mappedType));
        }

        // modality -> stored boolean "online" flag
        if (modality && modality !== 'irrelevant') {
            const isOnline = modality === 'online';
            clauses.push(where('online', '==', isOnline));
        }

        // zip code exact match
        if (zip) {
            clauses.push(where('zipCode', '==', zip));
        }

        // price range
        const minN = parsePrice(minPrice);
        const maxN = parsePrice(maxPrice);
        if (minN !== null) clauses.push(where('price', '>=', minN));
        if (maxN !== null) clauses.push(where('price', '<=', maxN));

        // If the user supplied tags, try matching a tags[] array on the document.
        if (tagList.length > 0) {
            clauses.push(where('tags', 'array-contains-any', tagList));
        }

        // Keep the old lightweight title-prefix fallback for a small server-side narrowing
        if (words.length > 0) {
            const first = words[0];
            if (first) {
                clauses.push(where('title', '>=', first));
                clauses.push(where('title', '<=', first + '\uf8ff'));
            }
        }

        // build the Firestore query (if no clauses, returns the collection reference)
        return clauses.reduce((qSoFar, clause) => query(qSoFar, clause), listingsColl);
    }, [applied, listingsColl]);

    // Build a client-side post-filter that truly matches the user's search terms
    // across description, title, and tags in order to emulate a "keywords" field.
    // This function should be applied after Firestore returns a candidate set.
    // Updated to be more forgiving: case-insensitive, normalizes punctuation,
    // tokenizes the search, and performs a loose substring match. To make it
    // easy to find results we match if any search token appears in title/desc/tags.
    const postFilter = React.useMemo(() => {
        const rawSearch = (applied.search || '').trim().toLowerCase();
        const words = rawSearch
            .split(/\s+/)
            .map(w => w.replace(/[^\w]/g, '')) // drop punctuation inside tokens
            .filter(Boolean)
            .slice(0, 10);

        if (words.length === 0) return null; // no client-side filtering needed

        // normalize strings for loose matching: lowercase and replace non-word chars with spaces
        const normalize = (s) => String(s || '').toLowerCase().replace(/[^\w]+/g, ' ').trim();

        // returns true if a doc (DocumentSnapshot or plain object) matches the search
        return (docLike) => {
            // Support either DocumentSnapshot or plain data object
            const data = typeof docLike?.data === 'function' ? docLike.data() : docLike;

            const title = normalize(data?.title);
            const description = normalize(data?.description);

            // tags in the DB may be an array or a comma-separated string
            let tagsArr = [];
            if (Array.isArray(data?.tags)) {
                tagsArr = data.tags.map(t => String(t).toLowerCase().replace(/[^\w]+/g, ' ').trim()).filter(Boolean);
            } else if (typeof data?.tags === 'string' && data.tags.trim() !== '') {
                tagsArr = data.tags.split(',').map(t => t.trim().toLowerCase().replace(/[^\w]+/g, ' ').trim()).filter(Boolean);
            }

            // Create a single searchable string in the requested priority:
            // description first, then title, then tags.
            const haystack = `${description} ${title} ${tagsArr.join(' ')}`;

            // Loose matching: match if any search token appears anywhere in the haystack.
            // This is intentionally permissive to make finding results easy.
            return words.some(word => haystack.includes(word));
        };
    }, [applied.search]);

    // a small helper to describe which filters are active (for UI)
    const activeFiltersSummary = React.useMemo(() => {
        const parts = [];
        if (applied.search) parts.push(`"${applied.search}"`);
        if (applied.zip) parts.push(`zip ${applied.zip}`);
        if (applied.typeFilter && applied.typeFilter !== 'irrelevant') parts.push(applied.typeFilter);
        if (applied.modality && applied.modality !== 'irrelevant') parts.push(applied.modality);
        if (applied.minPrice) parts.push(`min $${applied.minPrice}`);
        if (applied.maxPrice) parts.push(`max $${applied.maxPrice}`);
        if (applied.tags) parts.push(`tags: ${applied.tags}`);
        return parts.length ? parts.join(' • ') : 'No filters applied';
    }, [applied]);

    return {
        // form state (controlled inputs)
        searchInput, setSearchInput,
        zipInput, setZipInput,
        typeInput, setTypeInput,
        modalityInput, setModalityInput,
        minPriceInput, setMinPriceInput,
        maxPriceInput, setMaxPriceInput,
        tagsInput, setTagsInput,
        // control actions
        applyFilters, resetFilters,
        // applied query + helpers
        searchQuery,
        postFilter, // client-side filter function (or null)
        activeFiltersSummary
    };
}

const listingsCollection = collection(db, "listings");

function ExplorePage() {
    React.useEffect(() => {
        document.title = 'Explore | skillmesa';
    }, []);

    const explore = useExploreSearch(listingsCollection);

    const panelInfos = {
        courses: [
            {
                name: "All Classes",
                query: query(listingsCollection, where("type", "==", "class")),
                description: "A showcase and celebration of all of the classes that have been made by the youth and the experienced alike."
            }
        ],
        services: [
            {
                name: "All Skill Services",
                query: query(listingsCollection, where("type", "==", "service")),
                description: "Celebrating the dual usage of this platform for classes and tutoring as well as various services, including lawn mowing, watching the dog, etc.!"
            }
        ]
    };

    // small helper to keep zip numeric only while typing
    const onZipChange = (e) => {
        const onlyDigits = e.target.value.replace(/\D/g, '');
        explore.setZipInput(onlyDigits);
    };

    return (
        <>
            <h1>Explore</h1>
            <p>Explore everything that skillmesa has to offer. From babysitting to garden tending, from homework help to SAT prep, we're here.</p>

            <h2>Search</h2>
            <div className="search-filter-panel">
                <h3>Filter</h3>
                <form onSubmit={(e) => { e.preventDefault(); explore.applyFilters(); }}>
                    <input
                        placeholder='Search (keywords, title, description)'
                        style={{ minHeight: '20px', borderTopRightRadius: '0', borderBottomRightRadius: '0' }}
                        value={explore.searchInput}
                        onChange={e => explore.setSearchInput(e.target.value)}
                    />
                    <button type="submit" style={{ borderBottomLeftRadius: '0', borderTopLeftRadius: '0' }}>Search</button>
                    <br /><br />

                    <span className="textmedium">Location</span><br />
                    <input
                        placeholder='Zip Code'
                        value={explore.zipInput}
                        onChange={onZipChange}
                        inputMode="numeric"
                        pattern="\d*"
                    /><br />

                    <span className="textmedium">Flags</span><br /><br />
                    <select value={explore.typeInput} onChange={e => explore.setTypeInput(e.target.value)}>
                        <option value="irrelevant">Either</option>
                        <option value="class">Class</option>
                        <option value="service">Skill Service</option>
                    </select><br /><br/>
                    <select value={explore.modalityInput} onChange={e => explore.setModalityInput(e.target.value)}>
                        <option value="irrelevant">Either</option>
                        <option value="in-person">In-person</option>
                        <option value="online">Online</option>
                    </select><br/>

                    <span className="textmedium">Price</span><br/>
                    <input
                        placeholder="Minimum price (USD)"
                        type="number"
                        step="0.01"
                        min="0"
                        value={explore.minPriceInput}
                        onChange={e => explore.setMinPriceInput(e.target.value)}
                    /><br/>
                    <input
                        placeholder="Maximum price (USD)"
                        type="number"
                        step="0.01"
                        min="0"
                        value={explore.maxPriceInput}
                        onChange={e => explore.setMaxPriceInput(e.target.value)}
                    /><br/>

                    <span className="textmedium">Other</span><br/>
                    <input
                        placeholder='Tags (comma-separated)'
                        value={explore.tagsInput}
                        onChange={e => explore.setTagsInput(e.target.value)}
                    /><br/><br/>

                    <button type="button" onClick={explore.applyFilters}>Update Filters</button>{' '}
                    <button type="button" onClick={explore.resetFilters}>Clear</button>

                    <div style={{ marginTop: 10, color: '#555' }}>
                        <strong>Active:</strong> {explore.activeFiltersSummary}
                    </div>
                </form>
            </div>

            {/* Pass a client-side postFilter so ListingsPanel can do final loose matching
                across description, title, and tags (emulating a "keywords" field). */}
            <ListingsPanel
                query={explore.searchQuery}
                postFilter={explore.postFilter}
                size={15}
                paginated={true}
                emptyMessage='Sorry, there is nothing that fits those filters yet!'
            />

            <h2>Classes & Services</h2>
            {Object.entries(panelInfos).map(([group, infos]) => (
                <section key={group}>
                    {group !== 'courses' && <h2>{group.charAt(0).toUpperCase() + group.slice(1)}</h2>}
                    {infos.map(info => (
                        <div key={info.name} className="panel">
                            <h3>{info.name}</h3>
                            <p>{info.description}</p>
                            <ListingsPanel
                                query={info.query}
                                size={5}
                                paginated={true}
                                emptyMessage="There is no listings in this category yet!"
                            />
                        </div>
                    ))}
                </section>
            ))}
        </>
    );
}
export default ExplorePage;
