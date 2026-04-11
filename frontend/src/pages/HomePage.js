import React from 'react';

function HomePage() {
  return (
    <main>

      {/*  Slider Section */}
      <section className="slider-section">
        <div className="slider-container">
          <div className="slider-track">
            {/* Slider images loop */}
            <img src="assets/cat1.png" alt="Cat 1" />
            <img src="assets/cat2.png" alt="Cat 2" />
            <img src="assets/cat3.png" alt="Cat 3" />
            <img src="assets/cat4.png" alt="Cat 4" />
            <img src="assets/cat5.png" alt="Cat 5" />
            <img src="assets/cat6.png" alt="Cat 6" />
            <img src="assets/cat7.png" alt="Cat 7" />
            <img src="assets/cat8.png" alt="Cat 8" />
            <img src="assets/cat1.png" alt="Cat 1" />
            <img src="assets/cat2.png" alt="Cat 2" />
            <img src="assets/cat3.png" alt="Cat 3" />
            <img src="assets/cat4.png" alt="Cat 4" />
          </div>
        </div>
      </section>


      {/*  Info & Icons Section */}
      <div className="content-wrapper">
        <section className="info-list">
          <h3>Why People Love Cats</h3><br />
          <ul>
            <li>Cats are known for their unique personalities and independent nature.</li>
                <li>They can be calm companions while also being playful and energetic.</li>
                <li>I love cats because they offer quiet and comforting companionship without being overwhelming. They respect personal space yet show affection in meaningful ways.</li>
                <li>The gentle presence, soft purring, and playful moments of cats help reduce stress and bring calm and joy to everyday life.</li>
                <li>Cats are independent but loyal, making their love feel genuine and reassuring.</li>
          </ul>
        </section>

        <section className="icon-section">
          <div class="icon-card">
                <img src="assets/about.png" alt="About" class="small-icon"/>
                <div>
                    <h4>About Cats</h4>
                    <p>Learn about cat behavior, history, and what makes them special companions.</p>
                </div>
            </div>
            <div class="icon-card">
                <img src="assets/resources.png  " alt="Resources" class="small-icon"/>
                <div>
                    <h4>Resources</h4>
                    <p>Discover helpful websites and guides about cat care and well-being.</p>
                </div>
            </div>
            <div class="icon-card">
                <img src="assets/join.png" alt="Join" class="small-icon"/>
                <div>
                    <h4>Join Us! Cat Lovers</h4>
                    <p>Register to receive fun cat facts, tips, and updates.</p>
                </div>
            </div>
        </section>
      </div>

    </main>
  );
}

export default HomePage;