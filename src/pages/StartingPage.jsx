import React from 'react';
import { LinkButton } from '../components/LinkElements.jsx';
import CarouselElement from '../components/CarouselElement.jsx';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from "../firebase";

function StartingPage() {
  const [user, setUser] = React.useState(null);
  const [checkedAuth, setCheckedAuth] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setCheckedAuth(true); // marks that Firebase has finished checking
    });
    return () => unsubscribe();
  }, []);

  // Only render the button after auth state is known
  const getStartedLink = checkedAuth ? (user ? "/home" : "/signon") : "/signon";

  return (
    <>
      <title>skillmesa</title>
      <br />
      <img src="/assets/logos/skillmesa-large.png" alt="Skillmesa Logo" width={465} height={110} />
      <p>
        <span className='textmedium'>
          Whether you're looking for opportunities, services, or knowledge in
        </span>
        <br />
        <CarouselElement className="textcenter" style={{ marginTop: '20px' }}>
          <li><span className='texthuge'>coding</span></li>
          <li><span className='texthuge'>design</span></li>
          <li><span className='texthuge'>writing</span></li>
          <li><span className='texthuge'>music</span></li>
        </CarouselElement>
        <br />
        or more, Skillmesa is your platform to connect and thrive.
        <br /><br /><br /><br />
        <span className='textmedium'>
          Join us in building a community where skills are shared, opportunities are created, and knowledge is plentiful
        </span>
      </p>

      <LinkButton to={getStartedLink} className="textcenter">
        Get Started
      </LinkButton>

      <footer className='texttiny'>
        Skillmesa is currently in development. Stay tuned for updates!
      </footer>
    </>
  );
}

export default StartingPage;
