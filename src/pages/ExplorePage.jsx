import React from 'react';
import ListingsPanel from '../components/ListingsPanel.jsx';
import { db } from '../firebase';
import { collection, query, where } from 'firebase/firestore';

function useExploreSearch(listingsColl) {
    // UI form state (what the user is editing)
    const [zipInput, setZipInput] = React.useState('');
    const [typeInput, setTypeInput] = React.useState('irrelevant');
    const [modalityInput, setModalityInput] = React.useState('irrelevant');
    const [minPriceInput, setMinPriceInput] = React.useState('');
    const [maxPriceInput, setMaxPriceInput] = React.useState('');
    const [tagsInput, setTagsInput] = React.useState('');

    // "Applied" snapshot — the query is built from this only. This lets the user
    // edit freely and then press "Update Filters" to actually run the query.
    const [applied, setApplied] = React.useState({
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
            zip: zipInput,
            typeFilter: typeInput,
            modality: modalityInput,
            minPrice: minPriceInput,
            maxPrice: maxPriceInput,
            tags: tagsInput
        });
    }, [zipInput, typeInput, modalityInput, minPriceInput, maxPriceInput, tagsInput]);

    const resetFilters = React.useCallback(() => {
        setZipInput('');
        setTypeInput('irrelevant');
        setModalityInput('irrelevant');
        setMinPriceInput('');
        setMaxPriceInput('');
        setTagsInput('');
        setApplied({
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

        const zip = applied.zip || '';
        const typeFilter = applied.typeFilter;
        const modality = applied.modality;
        const minPrice = applied.minPrice;
        const maxPrice = applied.maxPrice;
        const tags = applied.tags || '';

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
            clauses.push(where('online', '==', isOnline ? "online" : "in-person"));
        }

        // zip code exact match
        if (zip) {
            clauses.push(where('zipCode', '==', zip));
        }

        // price range
        const minN = parsePrice(minPrice);
        const maxN = parsePrice(maxPrice);
        console.log(minPrice, maxPrice)
        if (minN !== null) clauses.push(where('price', '>=', minN));
        if (maxN !== null) clauses.push(where('price', '<=', maxN));

        // If the user supplied tags, try matching a tags[] array on the document.
        if (tagList.length > 0) {
            clauses.push(where('tags', 'array-contains-any', tagList));
        }

        // build the Firestore query (if no clauses, returns the collection reference)
        return clauses.reduce((qSoFar, clause) => query(qSoFar, clause), listingsColl);
    }, [applied, listingsColl]);

    // no client-side post-filtering (search bar removed)

    // a small helper to describe which filters are active (for UI)
    const activeFiltersSummary = React.useMemo(() => {
        const parts = [];
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

            <h2>Filters</h2>
            <div className="search-filter-panel">
                <h3>Filter</h3>
                <form onSubmit={(e) => { e.preventDefault(); explore.applyFilters(); }}>
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

            <ListingsPanel
                query={explore.searchQuery}
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
