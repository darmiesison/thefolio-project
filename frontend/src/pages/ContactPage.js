import React, { useState } from "react";
import API from "../api/axios";
import InteractiveMap from "../components/InteractiveMap";

function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setErrors({ form: "Please fill in all required fields." });
      return;
    }

    try {
      await API.post('/contact', formData);
      setSubmitted(true);
      setErrors({});
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      setErrors({ form: error.response?.data?.message || error.message || 'Unable to send message.' });
    }
  };

  return (
    <main>
      <section>
        <h2 id="contact">Contact Us</h2>
        {submitted ? (
          <div className="success">
            <h3>Thank you for reaching out!</h3>
          </div>
        ) : (
          <form id="contactForm" onSubmit={handleSubmit}>
            {errors.form && <p className="error">{errors.form}</p>}

            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />

            <label>Message</label>
            <textarea
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              rows="4"
            ></textarea>

            <button type="submit">Send</button>
          </form>
        )}
      </section>

      {/* Renders AFTER the form section */}
      <section className="resources-section">
        <h2>Helpful Cat Resources</h2>
        <div className="resources-container">
          <div className="resource-card">
            <a href="https://www.aspca.org" target="_blank" rel="noreferrer">
              ASPCA
            </a>
            <p>Information on cat care and adoption.</p>
          </div>
          <div className="resource-card">
            <a href="https://icatcare.org" target="_blank" rel="noreferrer">
              International Cat Care
            </a>
            <p>Guides on behavior and health.</p>
          </div>
          <div className="resource-card">
            <a href="https://www.petmd.com" target="_blank" rel="noreferrer">
              PetMD
            </a>
            <p>Articles about cat health, nutrition, and grooming</p>
          </div>
        </div>
      </section>
      {/* Interactive Map */}
      <section className="map-section">
        <h2>Map Location</h2>
        <InteractiveMap />
      </section>

      <section className="shelter-section">
        <div className="shelter-header">
          <img src="/assets/shelter.png" alt="Shelter Icon" width="60" />
          <h2>Sample Animal Shelters</h2>
        </div>
        <p>
          <strong>Happy Paws Shelter:</strong>
          <br /> 123 Cat Street, Sample City
        </p>
        <p>
          <strong>Feline Friends Center:</strong>
          <br /> 456 Whisker Avenue, Demo Town
        </p>
      </section>
    </main>
  );
}

export default ContactPage;
