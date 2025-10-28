import React from 'react';
import { LinkButton } from '../components/LinkElements.jsx';
import ListingsPanel from '../components/ListingsPanel.jsx';
import { auth, db } from '../firebase';
import { collection, query, where } from 'firebase/firestore';

const listingsCollection = collection(db, "listings");

function ExplorePage() {
    const user = auth.currentUser;

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
                name: "All skill Services",
                query: query(listingsCollection, where("type", "==", "service")),
                description: "Celebrating the dual usage of this platform for classes and tutoring as well as various services, including lawn mowing, watching the dog, etc.!"
            }
        ]
    }

    return (
        <>
            <title>home | skillmesa</title>
            <h1>Explore</h1>
            <p>Explore everything that skillmesa has to offer. From babysitting to garden tending, from homework help to SAT prep, we're here.</p>
            <h2>Classes</h2>
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
