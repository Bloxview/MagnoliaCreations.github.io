const grid = document.getElementById("cardGrid");

magnoliaCards.forEach(card => {
  const cardElement = document.createElement("div");
  cardElement.className = "magnolia-card";

  cardElement.innerHTML = `
    <div class="card-preview">
      <h2 style="margin:0; font-size:28px; font-weight:400;">
        ${card.title}
      </h2>
      <p style="margin-top:14px; font-size:12px; letter-spacing:2.5px; color:#6f6f6f; text-transform:uppercase;">
        ${card.subtitle}
      </p>
    </div>

    <img src="${card.image}" alt="${card.title}" class="card-image">

    <div class="card-full">
      <p style="font-size:11px; letter-spacing:3px; color:#8a8a8a; text-transform:uppercase;">
        Preset Build
      </p>

      <h2 style="margin:0; font-size:28px; font-weight:400;">
        ${card.title}
      </h2>

      <p style="margin-top:12px; font-size:12px; letter-spacing:2.5px; color:#6f6f6f; text-transform:uppercase;">
        ${card.subtitle}
      </p>

      <hr style="margin:26px auto; width:60px; border:none; border-top:1px solid #dedede;">

      <p style="font-size:14px; line-height:1.6;">
        ${card.description}
      </p>

      <div style="font-size:14px; line-height:1.9; margin:24px 0;">
        ${card.bedrooms} Bedrooms • ${card.bathrooms} Bathrooms<br>
        ${card.garage}<br>
        Approx. Footprint: ${card.footprint}
      </div>

      <p style="font-size:15px; margin:0;">
        <strong>${card.price}</strong>
      </p>

      <p style="margin-top:6px; font-size:13px; color:#6f6f6f;">
        Required budget: ${card.budget}
      </p>

      <p style="margin-top:24px; font-size:11px; letter-spacing:2px; color:#8a8a8a; text-transform:uppercase;">
        ${card.notes}
      </p>
    </div>
  `;

  grid.appendChild(cardElement);
});
