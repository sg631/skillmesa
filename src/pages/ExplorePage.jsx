import React from 'react';
import ListingsPanel from '../components/ListingsPanel.jsx';
import { db } from '../firebase';
import { collection, query, where } from 'firebase/firestore';

function useExploreSearch(listingsColl) {
    // UI form state (what the user is editing)
    const [zipInput, setZipInput] = React.useState('');
    const [typeInput, setTypeInput] = React.useState('irrelevant');
    const [modalityInput, setModalityInput] = React.useState('irrelevant');
    const [categoryInput, setCategoryInput] = React.useState('irrelevant');
    const [minPriceInput, setMinPriceInput] = React.useState('');
    const [maxPriceInput, setMaxPriceInput] = React.useState('');
    const [tagsInput, setTagsInput] = React.useState('');

    // "Applied" snapshot — the query is built from this only. This lets the user
    // edit freely and then press "Update Filters" to actually run the query.
    const [applied, setApplied] = React.useState({
        zip: '',
        typeFilter: 'irrelevant',
        modality: 'irrelevant',
        category: 'irrelevant',
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
            category: categoryInput,
            minPrice: minPriceInput,
            maxPrice: maxPriceInput,
            tags: tagsInput
        });
    }, [zipInput, typeInput, modalityInput, categoryInput, minPriceInput, maxPriceInput, tagsInput]);

    const resetFilters = React.useCallback(() => {
        setZipInput('');
        setTypeInput('irrelevant');
        setModalityInput('irrelevant');
        setCategoryInput('irrelevant');
        setMinPriceInput('');
        setMaxPriceInput('');
        setTagsInput('');
        setApplied({
            zip: '',
            typeFilter: 'irrelevant',
            modality: 'irrelevant',
            category: 'irrelevant',
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
        const category = applied.category;
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

        // modality -> stored boolean "online" flag (true for online, false for in-person)
        if (modality && modality !== 'irrelevant') {
            const isOnline = modality === 'online';
            clauses.push(where('online', '==', isOnline));
        }

        // category exact match (if the documents use a field named `category`)
        if (category && category !== 'irrelevant') {
            clauses.push(where('category', '==', category));
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

        // build the Firestore query (if no clauses, returns the collection reference)
        return clauses.reduce((qSoFar, clause) => query(qSoFar, clause), listingsColl);
    }, [applied, listingsColl]);

    // a small helper to describe which filters are active (for UI)
    const activeFiltersSummary = React.useMemo(() => {
        const parts = [];
        if (applied.zip) parts.push(`zip ${applied.zip}`);
        if (applied.typeFilter && applied.typeFilter !== 'irrelevant') parts.push(applied.typeFilter);
        if (applied.modality && applied.modality !== 'irrelevant') parts.push(applied.modality);
        if (applied.category && applied.category !== 'irrelevant') parts.push(applied.category);
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
        categoryInput, setCategoryInput,
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
            },
            {
                name: "Coding & Development Classes",
                query: query(listingsCollection, where("type", "==", "class"), where("category", "==", "coding")),
                description: "Learn web, app, and software development — from beginner tutorials to advanced workshops."
            },
            {
                name: "Music Classes",
                query: query(listingsCollection, where("type", "==", "class"), where("category", "==", "music")),
                description: "Instrument lessons, theory, production, and ensemble workshops for all ages and levels."
            },
            {
                name: "Math Classes",
                query: query(listingsCollection, where("type", "==", "class"), where("category", "==", "math")),
                description: "From arithmetic to calculus and competition prep — structured classes to build math skills."
            },
            {
                name: "Art Classes",
                query: query(listingsCollection, where("type", "==", "class"), where("category", "==", "art")),
                description: "Painting, drawing, ceramics, and mixed media classes to explore creativity and technique."
            },
            {
                name: "Language Classes",
                query: query(listingsCollection, where("type", "==", "class"), where("category", "==", "language")),
                description: "Spoken and written language courses, conversation groups, and exam prep."
            },
            {
                name: "Design Classes",
                query: query(listingsCollection, where("type", "==", "class"), where("category", "==", "design")),
                description: "Graphic, UX/UI, and product design classes focused on practical tools and portfolios."
            },
            {
                name: "Writing & Editing Classes",
                query: query(listingsCollection, where("type", "==", "class"), where("category", "==", "writing")),
                description: "Creative writing, copywriting, and editing workshops to sharpen your voice and craft."
            },
            {
                name: "Health, Fitness & Wellness Classes",
                query: query(listingsCollection, where("type", "==", "class"), where("category", "==", "health")),
                description: "Yoga, fitness, nutrition, and mindfulness classes to support wellbeing."
            },
            {
                name: "General Education Classes",
                query: query(listingsCollection, where("type", "==", "class"), where("category", "==", "education")),
                description: "Classes that don't fit other categories — special topics, seminars, and community learning."
            }
        ],
        services: [
            {
                name: "All Skill Services",
                query: query(listingsCollection, where("type", "==", "service")),
                description: "Celebrating the dual usage of this platform for classes and tutoring as well as various services, including lawn mowing, watching the dog, etc.!"
            },
            {
                name: "Business & Marketing Services",
                query: query(listingsCollection, where("type", "==", "service"), where("category", "==", "business")),
                description: "Consulting, marketing help, small business services, and freelance business support."
            },
            {
                name: "Home & Personal Services",
                query: query(listingsCollection, where("type", "==", "service"), where("category", "==", "home-services")),
                description: "Cleaning, gardening, pet care, help around the house, and other local personal services."
            },
            {
                name: "Tutoring Services",
                query: query(listingsCollection, where("type", "==", "service"), where("category", "==", "tutoring")),
                description: "One-on-one or small-group tutoring across subjects — homework help, test prep, and mentoring."
            },
            {
                name: "Volunteering Opportunities",
                query: query(listingsCollection, where("type", "==", "service"), where("category", "==", "volunteering")),
                description: "Volunteer listings and community service opportunities to get involved and give back."
            },
            {
                name: "Other Services",
                query: query(listingsCollection, where("type", "==", "service"), where("category", "==", "other")),
                description: "Miscellaneous services that don't fit in the main categories — unique offerings and one-offs."
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
                    </select><br/><br/>

                    <span className="textmedium">Category</span><br />
                    <select value={explore.categoryInput} onChange={e => explore.setCategoryInput(e.target.value)}>
                        <option value="irrelevant">Any</option>
                        <option value="coding">Coding and Development</option>
                        <option value="music">Music</option>
                        <option value="math">Math</option>
                        <option value="art">Art</option>
                        <option value="language">Language</option>
                        <option value="design">Design</option>
                        <option value="writing">Writing and Editing</option>
                        <option value="business">Business and Marketing</option>
                        <option value="home-services">Home and Personal Services</option>
                        <option value="health">Health, Fitness and Wellness</option>
                        <option value="tutoring">General Tutoring</option>
                        <option value="education">Class (Not encompassed by other options)</option>
                        <option value="volunteering">Volunteering Opportunity</option>
                        <option value="other">Other</option>
                    </select><br/><br/>

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
