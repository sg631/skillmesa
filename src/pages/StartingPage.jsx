import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LinkButton } from '../components/LinkElements.jsx';
import CarouselElement from '../components/CarouselElement.jsx';

function StartingPage() {
  return (
    <>
      <title>skillmesa</title>
        <br></br>
        <img src="/assets/logos/skillmesa-large.png" alt="Skillmesa Logo" width={465} height={110} />
      <p><span className='textmedium'>Whether you're looking for opportunities, services, or knowledge in</span>
        <br></br>
        <CarouselElement className="textcenter" style={{ marginTop: '20px' }}>
        <li><span className='texthuge'>coding</span></li>
        <li><span className='texthuge'>design</span></li>
        <li><span className='texthuge'>writing</span></li>
        <li><span className='texthuge'>music</span></li>
      </CarouselElement>
        <br></br>
        or more, Skillmesa is your platform to connect and thrive.
        <br></br>
        <br></br>
        <br></br>
        <br></br>
        <span className='textmedium'>Join us in building a community where skills are shared, opportunities are created, and knowledge is plentiful</span>
      </p>
      <LinkButton to="/signon" className="textcenter">Get Started</LinkButton>
      <footer className='texttiny'>Skillmesa is currently in development. Stay tuned for updates!</footer>
    </>
  );
}

export default StartingPage;