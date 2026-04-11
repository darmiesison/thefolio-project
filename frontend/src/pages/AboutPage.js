import React from "react";
import { breed } from "../data/breed";
import MazeGame from "../components/MazeGame";

function AboutPage() {
  return (
    <main>
      {/*  Intro Section */}
      <section className="intro-container">
        <div className="intro-flex">
          <div className="intro-text">
            <h2>Discover the Magic of Cats</h2>
            <ol>
              <li>
                Cats are known for their unique personalities and independent
                nature.
              </li>
              <li>
                They can be calm companions while also being playful and
                energetic.
              </li>
              <li>
                I love cats because they offer quiet and comforting
                companionship without being overwhelming. They respect personal
                space yet show affection in meaningful ways.
              </li>
              <li>
                The gentle presence, soft purring, and playful moments of cats
                help reduce stress and bring calm and joy to everyday life.
              </li>
              <li>
                Cats are independent but loyal, making their love feel genuine
                and reassuring.
              </li>
            </ol>
          </div>
          <div className="intro-images">
            <img src="assets/cat1.png" alt="Happy Cat" />
          </div>
        </div>
      </section>

      {/*  History Section */}
      <div className="history-container">
        <div className="history-content">
          <div className="history-text">
            <h2>A Brief History</h2>
            <p>
              Cats have shared a unique relationship with humans for thousands
              of years. The domestication of cats is believed to have begun
              around 9,000 years ago in the Fertile Crescent. Early humans
              welcomed wild cats because of their natural hunting abilities,
              which helped protect grain stores. Over time, wild cats became
              domesticated, leading to the cats we know today. Ancient Egyptians
              revered cats, associating them with the goddess Bastet. Cats
              spread across Europe and Asia and became cherished companions.
            </p>
          </div>
        </div>
      </div>

      <section>
        <h2>Popular Cat breed</h2>
        {/* The 'card-container' div is essential for the Grid layout */}
        <div className="card-container">
          {breed.map((breed) => (
            /* The 'card' div acts as the frame for the image */
            <div className="card" key={breed.id}>
              <img src={breed.img} alt={breed.name} />
              <h3>{breed.name}</h3>
              <p>{breed.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <blockquote>“Cats choose us; we don’t own them.”</blockquote>

      <MazeGame />
    </main>
  );
}

export default AboutPage;
