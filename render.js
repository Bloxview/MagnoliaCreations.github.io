const listings = document.getElementById("listings");

houses.forEach(house => {
  const card = document.createElement("div");
  card.className = "magnolia-card";

  card.innerHTML = `
    <div class="magnolia-preview">
      <h2 style="margin:0; font-size:30px; font-weight:400;">
        ${house.name}
      </h2>
      <p style="margin-top:14px; font-size:12px; letter-spacing:2.5px; color:#7a7a7a; text-transform:uppercase;">
        ${house.tagline}
      </p>
    </div>

    <img src="${house.image}" alt="${house.name}" class="magnolia-image">

    <div class="magnolia-full">
      <p style="font-size:11px; letter-spacing:3px; color:#8a8a8a; text-transform:uppercase;">
        Preset Build
      </p>

      <h2 style="margin:0; font-size:30px; font-weight:400;">
        ${house.name}
      </h2>

      <p style="margin-top:12px; font-size:12px; letter-spacing:2.5px; color:#7a7a7a; text-transform:uppercase;">
        ${house.tagline}
      </p>

      <hr style="margin:30px auto; width:60px; border:none; border-top:1px solid #dedede;">

      <p style="font-size:14px; line-height:1.65;">
        ${house.description}
      </p>

      <div style="font-size:14px; line-height:1.9; margin:26px 0;">
        ${house.beds} Bedrooms • ${house.baths} Bathrooms<br>
        ${house.garage} Garage<br>
        Approx. Footprint: ${house.footprint}
      </div>

      <hr style="margin:28px auto; width:60px; border:none; border-top:1px solid #dedede;">

      <p style="font-size:15px; margin:0;">
        <strong>${house.price}</strong>
      </p>

      <p style="margin-top:6px; font-size:13px; color:#6f6f6f;">
        Required budget: ~${house.budget}
      </p>

      <p style="margin-top:26px; font-size:11px; letter-spacing:2px; color:#8a8a8a; text-transform:uppercase;">
        No Structural Changes · Layout Included
      </p>
    </div>
  `;

  listings.appendChild(card);
});
