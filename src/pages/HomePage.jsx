import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LinkButton, LinkImage } from '../components/LinkElements.jsx';
import { ListingElement } from '../components/ListingElement.jsx';

function HomePage() {
  return (
    <>
      <title>home | skillmesa</title>
      <h1>Owned by you</h1>
      <ListingElement listingId="exampleListingId1" />
    </>
  );
}

export default HomePage;