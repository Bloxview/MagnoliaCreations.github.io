:root {
  --paper: #f6f5f1;
  --card: #ffffff;
  --text-main: #1f1f1f;
  --text-muted: #777777;
  --border: rgba(0,0,0,0.08);
}

/* BASE */
body {
  margin: 0;
  background-color: var(--paper);
  color: var(--text-main);
  font-family: 'Times New Roman', Georgia, serif;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}

/* HEADER */
.site-header {
  padding: 96px 24px 72px;
  background-color: var(--paper);
  text-align: center;
}

.site-logo {
  width: 56px;
  margin-bottom: 24px;
}

.site-header h1 {
  margin: 0;
  font-size: 44px;
  font-weight: 400;
  letter-spacing: -0.3px;
}

.site-header p {
  margin-top: 18px;
  font-size: 11px;
  letter-spacing: 4px;
  color: var(--text-muted);
  text-transform: uppercase;
}

/* GRID */
.grid-container {
  max-width: 1100px;
  margin: 96px auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 72px;
}

/* CARD */
.magnolia-card {
  background-color: var(--card);
  text-align: center;
}

/* No heavy borders — editorial uses separation, not boxes */
.card-preview,
.card-full {
  padding: 0;
}

.card-full {
  display: none;
}

/* Image */
.card-image {
  width: 100%;
  display: block;
  margin-bottom: 28px;
}

/* Typography inside cards */
.magnolia-card h2 {
  font-size: 26px;
  font-weight: 400;
  margin: 0 0 14px;
}

.magnolia-card p {
  font-size: 16px;
  color: var(--text-muted);
  margin: 0 auto;
  max-width: 520px;
}

/* Desktop interaction — subtle, slow */
@media (hover: hover) {
  .magnolia-card {
    transition: transform 0.4s ease;
  }

  .magnolia-card:hover {
    transform: translateY(-2px);
  }

  .magnolia-card:hover .card-preview {
    display: none;
  }

  .magnolia-card:hover .card-full {
    display: block;
  }
}

/* FOOTER */
.contact-footer {
  text-align: center;
  margin: 120px 0 96px;
  padding: 0 24px;
}

.contact-footer p {
  font-size: 11px;
  letter-spacing: 3px;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 14px;
}

.contact-footer a {
  font-size: 16px;
  color: var(--text-main);
  text-decoration: none;
  border-bottom: 1px solid var(--border);
  padding-bottom: 2px;
}

/* MOBILE */
@media (max-width: 600px) {
  .site-header {
    padding: 72px 20px 56px;
  }

  .site-header h1 {
    font-size: 34px;
  }

  .grid-container {
    margin: 64px auto;
    gap: 48px;
  }

  .magnolia-card h2 {
    font-size: 22px;
  }

  .magnolia-card p {
    font-size: 15px;
  }

  /* Editorial rule: no hidden content on mobile */
  .card-preview {
    display: none;
  }

  .card-full {
    display: block;
  }
}
