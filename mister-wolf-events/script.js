const menuToggle = document.querySelector(".menu-toggle");
const siteNavigation = document.querySelector("#site-navigation");

if (menuToggle && siteNavigation) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    siteNavigation.classList.toggle("is-open", !isExpanded);
  });

  siteNavigation.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      menuToggle.setAttribute("aria-expanded", "false");
      siteNavigation.classList.remove("is-open");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      menuToggle.setAttribute("aria-expanded", "false");
      siteNavigation.classList.remove("is-open");
      menuToggle.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760 && menuToggle.getAttribute("aria-expanded") === "true") {
      menuToggle.setAttribute("aria-expanded", "false");
      siteNavigation.classList.remove("is-open");
    }
  });
}

const currentYear = document.querySelector("#current-year");
if (currentYear) {
  currentYear.textContent = String(new Date().getFullYear());
}

const cityScenes = document.querySelector(".city-scenes");
if (
  cityScenes instanceof HTMLElement &&
  "IntersectionObserver" in window &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  const scenes = [...cityScenes.querySelectorAll(".city-scene")];
  cityScenes.classList.add("has-scroll-fade");

  const sceneObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const progress = Math.min(1, entry.intersectionRatio / 0.75);
        const imageOpacity = 0.42 + progress * 0.58;
        const contentOpacity = 0.72 + progress * 0.28;
        const contentOffset = (1 - progress) * 10;

        entry.target.style.setProperty("--scene-image-opacity", imageOpacity.toFixed(2));
        entry.target.style.setProperty("--scene-content-opacity", contentOpacity.toFixed(2));
        entry.target.style.setProperty("--scene-content-offset", `${contentOffset.toFixed(1)}px`);
      }
    },
    {
      rootMargin: "-18% 0px -18% 0px",
      threshold: Array.from({ length: 11 }, (_, index) => index / 10),
    },
  );

  for (const scene of scenes) {
    sceneObserver.observe(scene);
  }
}

const eventCardsForTicketing = [...document.querySelectorAll(".event-month .event-card")];
const eventCities = ["Bassano del Grappa", "Cremona", "Mantova", "Milano", "Napoli", "Roma", "Asti", "Torino"];
const spotifyArtistUrls = new Map([
  ["Arisa", "https://open.spotify.com/artist/25x6MD0spNNS7z93Sat30K"],
  ["Irama", "https://open.spotify.com/artist/5iot8OPcosJN9nCl7I5SdK"],
  ["Francesco De Gregori", "https://open.spotify.com/artist/16FJYC4FqKhZXiXIzMI4ul"],
  ["Antonello Venditti", "https://open.spotify.com/artist/3hYLJPJuDyblFKersEaFd6"],
  ["Sting", "https://open.spotify.com/artist/0Ty63ceoRnnJKVEYP0VQpk"],
]);
const calendarMonthNumbers = new Map([
  ["GEN", 1],
  ["FEB", 2],
  ["MAR", 3],
  ["APR", 4],
  ["MAG", 5],
  ["GIU", 6],
  ["LUG", 7],
  ["AGO", 8],
  ["SET", 9],
  ["OTT", 10],
  ["NOV", 11],
  ["DIC", 12],
]);
const calendarTextEncoder = new TextEncoder();
const escapeCalendarText = (value) => value
  .replace(/\\/g, "\\\\")
  .replace(/\r?\n/g, "\\n")
  .replace(/,/g, "\\,")
  .replace(/;/g, "\\;");
const foldCalendarLine = (line) => {
  const foldedLines = [];
  let currentLine = "";
  let currentBytes = 0;

  for (const character of line) {
    const characterBytes = calendarTextEncoder.encode(character).length;
    if (currentBytes + characterBytes > 73) {
      foldedLines.push(currentLine);
      currentLine = " ";
      currentBytes = 1;
    }

    currentLine += character;
    currentBytes += characterBytes;
  }

  foldedLines.push(currentLine);
  return foldedLines.join("\r\n");
};
const getCalendarDate = (card) => {
  const dateParts = [...card.querySelectorAll(".event-date span")]
    .map((part) => part.textContent?.trim() ?? "");
  const day = Number(dateParts[0]);
  const [monthLabel, yearLabel] = (dateParts[1] ?? "").split(/\s+/);
  const month = calendarMonthNumbers.get(monthLabel);
  const year = Number(yearLabel);

  if (!Number.isInteger(day) || !month || !Number.isInteger(year)) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }

  return { date, year, month, day };
};
const getRomeDateTime = (date, time) => {
  const [hour, minute] = time.split(":").map(Number);
  const localAsUtc = Date.UTC(date.year, date.month - 1, date.day, hour, minute);
  const romeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(localAsUtc));
  const getPart = (type) => Number(romeParts.find((part) => part.type === type)?.value);
  const romeAsUtc = Date.UTC(
    getPart("year"),
    getPart("month") - 1,
    getPart("day"),
    getPart("hour"),
    getPart("minute"),
  );
  const offsetMinutes = (romeAsUtc - localAsUtc) / 60000;
  return new Date(localAsUtc - offsetMinutes * 60000)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
};
for (const card of eventCardsForTicketing) {
  const details = card.querySelector(".event-details");
  const poster = card.querySelector(".event-poster");
  const title = details?.querySelector("h3")?.textContent?.trim();
  const date = [...(card.querySelectorAll(".event-date span") ?? [])]
    .map((part) => part.textContent?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
  const location = [...(details?.querySelectorAll("p") ?? [])]
    .map((paragraph) => paragraph.textContent?.trim() ?? "")
    .find((text) => eventCities.some((city) => text.toLocaleLowerCase("it-IT").startsWith(`${city.toLocaleLowerCase("it-IT")} · `)));
  const status = details?.querySelector(".event-status");
  const category = details?.querySelector(".event-category")?.textContent?.trim();
  const subtitle = details?.querySelector(".event-subtitle")?.textContent?.trim() ?? "";

  if (
    details &&
    title &&
    (category === "Musica" || title === "Antonello Venditti") &&
    title !== "Le Grandi Musiche per il Cinema"
  ) {
    let spotifyLink = details.querySelector(".event-spotify");

    if (!spotifyLink) {
      spotifyLink = document.createElement("a");
      spotifyLink.className = "event-spotify";
      spotifyLink.target = "_blank";
      spotifyLink.rel = "noopener noreferrer";
      spotifyLink.innerHTML = 'Ascolta su Spotify <span aria-hidden="true">↗</span>';
      details.append(spotifyLink);
    } else {
      spotifyLink.innerHTML = 'Ascolta su Spotify <span aria-hidden="true">↗</span>';
    }

    const spotifyUrl = spotifyArtistUrls.get(title);
    spotifyLink.href = spotifyUrl ?? `https://open.spotify.com/search/${encodeURIComponent(title)}`;
    spotifyLink.setAttribute("aria-label", `Ascolta ${title} su Spotify`);
  }

  if (!details || !poster || !title || !date || !location || !category || !status) {
    console.error("Impossibile creare il collegamento alla biglietteria: dati evento incompleti.", card);
    continue;
  }

  const ticketUrl = new URL("biglietteria.html", window.location.href);
  const eventParams = new URLSearchParams({
    titolo: title,
    sottotitolo: subtitle,
    data: date,
    luogo: location,
    tipologia: category,
    locandina: poster.getAttribute("src") ?? "",
    stato: status.classList.contains("is-soldout")
      ? "soldout"
      : status.classList.contains("is-refund")
        ? "refund"
        : status.classList.contains("is-new-date")
          ? "new-date"
          : status.classList.contains("is-rescheduled")
            ? "rescheduled"
            : "available",
  });
  ticketUrl.search = eventParams.toString();

  const ticketLink = document.createElement("a");
  ticketLink.className = "event-ticket-link";
  ticketLink.href = ticketUrl.href;
  ticketLink.textContent = status.classList.contains("is-soldout") || status.classList.contains("is-refund")
    ? "Dettagli biglietteria"
    : "Vai alla biglietteria";
  ticketLink.setAttribute("aria-label", `${ticketLink.textContent}: ${title}, ${date}`);
  details.append(ticketLink);

  const eventIndex = eventCardsForTicketing.indexOf(card);
  const eventSlug = `${title}-${date}`
    .toLocaleLowerCase("it-IT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  card.id = `event-${eventIndex + 1}-${eventSlug}`;

  const shareUrl = new URL(window.location.href);
  shareUrl.search = "";
  shareUrl.hash = card.id;
  const shareButton = document.createElement("button");
  shareButton.className = "event-share-button";
  shareButton.type = "button";
  shareButton.textContent = "Condividi";
  shareButton.setAttribute("aria-label", `Condividi ${title}, ${date}`);
  const shareStatus = document.createElement("span");
  shareStatus.className = "event-share-status";
  shareStatus.setAttribute("role", "status");
  shareStatus.setAttribute("aria-live", "polite");
  details.append(shareButton, shareStatus);

  shareButton.addEventListener("click", async () => {
    if (window.location.protocol === "file:") {
      shareStatus.textContent = "Apri il sito pubblicato per condividere un link accessibile agli altri.";
      return;
    }

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: subtitle ? `${title} - ${subtitle}` : title,
          text: `${date} · ${location}`,
          url: shareUrl.href,
        });
        shareStatus.textContent = "";
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("La condivisione e gli appunti non sono disponibili in questo browser.");
      }
      await navigator.clipboard.writeText(shareUrl.href);
      shareStatus.textContent = "Link copiato negli appunti.";
    } catch (error) {
      console.error("Impossibile condividere o copiare il link dell'evento.", error);
      shareStatus.textContent = "Condivisione non riuscita. Riprova dal sito pubblicato.";
    }
  });

  const calendarDate = getCalendarDate(card);
  if (!calendarDate) {
    console.error("Impossibile creare il file calendario: data evento non valida.", card);
    continue;
  }

  const timeText = details.querySelector(".event-time")?.textContent?.trim() ?? "";
  const timeMatch = timeText.match(/inizio show(?:\s+ore)?\s+(\d{1,2}:\d{2})/i) ?? timeText.match(/(\d{1,2}:\d{2})/);
  const time = timeMatch?.[1] ?? null;
  const calendarButton = document.createElement("button");
  calendarButton.className = "event-calendar-button";
  calendarButton.type = "button";
  calendarButton.innerHTML = time
    ? "Aggiungi al calendario"
    : 'Aggiungi al calendario <span>Orario da confermare</span>';
  calendarButton.setAttribute(
    "aria-label",
    `Aggiungi ${title} del ${date} al calendario${time ? "" : "; orario da confermare"}`,
  );
  details.append(calendarButton);

  const eventTitle = subtitle ? `${title} - ${subtitle}` : title;
  const eventDescription = time
    ? `Orario indicato: ${time}. Verifica eventuali aggiornamenti sui canali ufficiali.`
    : "Orario non indicato nella scheda dell'evento: verifica i canali ufficiali.";
  const dateStamp = calendarDate.date.toISOString().slice(0, 10).replace(/-/g, "");
  const endDate = new Date(calendarDate.date);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  const calendarLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mister Wolf Events//Event Calendar//IT",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${dateStamp}-${eventCardsForTicketing.indexOf(card)}@mister-wolf-events`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    ...(time
      ? [`DTSTART:${getRomeDateTime(calendarDate, time)}`]
      : [
          `DTSTART;VALUE=DATE:${dateStamp}`,
          `DTEND;VALUE=DATE:${endDate.toISOString().slice(0, 10).replace(/-/g, "")}`,
        ]),
    `SUMMARY:${escapeCalendarText(eventTitle)}`,
    `LOCATION:${escapeCalendarText(location)}`,
    `DESCRIPTION:${escapeCalendarText(eventDescription)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].map(foldCalendarLine).join("\r\n");
  const fileName = eventTitle
    .toLocaleLowerCase("it-IT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  calendarButton.addEventListener("click", () => {
    const calendarFile = new Blob([calendarLines], { type: "text/calendar;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(calendarFile);
    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = `${dateStamp}-${fileName}.ics`;
    downloadLink.hidden = true;
    document.body.append(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  });
}

if (window.location.hash) {
  const sharedEventId = window.location.hash.slice(1);
  const sharedEvent = document.getElementById(sharedEventId);
  if (sharedEvent?.classList.contains("event-card")) {
    window.requestAnimationFrame(() => sharedEvent.scrollIntoView({ block: "center" }));
  }
}

const eventFilters = document.querySelector("#event-filters");
if (eventFilters instanceof HTMLFormElement) {
  const monthSelect = eventFilters.querySelector("#filter-month");
  const citySelect = eventFilters.querySelector("#filter-city");
  const categorySelect = eventFilters.querySelector("#filter-category");
  const eventCards = [...document.querySelectorAll(".event-card")];
  const monthSections = [...document.querySelectorAll(".event-month")];
  const results = document.querySelector("#filter-results");
  const noResults = document.querySelector("#event-no-results");

  if (
    monthSelect instanceof HTMLSelectElement &&
    citySelect instanceof HTMLSelectElement &&
    categorySelect instanceof HTMLSelectElement &&
    results instanceof HTMLElement &&
    noResults instanceof HTMLElement
  ) {
    const normalize = (value) => value.trim().toLocaleLowerCase("it-IT");
    const eventData = eventCards.map((card) => {
      const monthSection = card.closest(".event-month");
      const dateText = card.querySelector(".event-date span:last-child")?.textContent ?? "";
      const category = card.querySelector(".event-category")?.textContent ?? "";
      const location = [...card.querySelectorAll(".event-details p")]
        .map((paragraph) => paragraph.textContent ?? "")
        .find((text) => eventCities.some((cityName) => normalize(text).startsWith(`${normalize(cityName)} · `))) ?? "";

      return {
        card,
        section: monthSection,
        month: normalize(dateText.replace(/\s+/g, " ")),
        city: normalize(location.split(" · ")[0] ?? ""),
        category: normalize(category),
      };
    });

    const addOptions = (select, values, placeholder) => {
      const uniqueValues = [...new Set(values.filter(Boolean))]
        .sort((left, right) => left.localeCompare(right, "it"));

      for (const value of uniqueValues) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value
          .split(" ")
          .map((word, index) => {
            if (index > 0 && ["da", "del", "della", "di"].includes(word)) {
              return word;
            }
            return word.charAt(0).toLocaleUpperCase("it-IT") + word.slice(1);
          })
          .join(" ");
        select.append(option);
      }

      select.setAttribute("aria-label", placeholder);
    };

    const monthLabels = new Map();
    for (const section of monthSections) {
      const label = section.querySelector(".event-month-heading h2")?.textContent?.replace(/\s+/g, " ").trim() ?? "";
      const dateValue = eventData.find((event) => event.section === section)?.month;
      if (dateValue) {
        monthLabels.set(dateValue, label);
      }
    }

    for (const [value, label] of monthLabels) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      monthSelect.append(option);
    }

    addOptions(citySelect, eventData.map((event) => event.city), "Tutte le città");
    addOptions(categorySelect, eventData.map((event) => event.category), "Tutte le tipologie");

    const requestedCity = normalize(new URLSearchParams(window.location.search).get("citta") ?? "");
    if ([...citySelect.options].some((option) => option.value === requestedCity)) {
      citySelect.value = requestedCity;
    }

    const applyFilters = () => {
      const month = monthSelect.value;
      const city = citySelect.value;
      const category = categorySelect.value;
      let visibleCount = 0;

      for (const event of eventData) {
        const isVisible =
          (!month || event.month === month) &&
          (!city || event.city === city) &&
          (!category || event.category === category);
        event.card.hidden = !isVisible;
        if (isVisible) {
          visibleCount += 1;
        }
      }

      for (const section of monthSections) {
        section.hidden = !eventData.some((event) => event.section === section && !event.card.hidden);
      }

      results.textContent = `${visibleCount} ${visibleCount === 1 ? "evento trovato" : "eventi trovati"}`;
      noResults.hidden = visibleCount > 0;
    };

    eventFilters.addEventListener("change", applyFilters);
    applyFilters();
  }
}

const newsletterForm = document.querySelector("#newsletter-form");
if (newsletterForm instanceof HTMLFormElement) {
  const newsletterStatus = document.querySelector("#newsletter-status");
  newsletterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!(newsletterStatus instanceof HTMLElement) || !newsletterForm.reportValidity()) {
      return;
    }

    newsletterStatus.textContent = "Il modulo è dimostrativo: non è stata effettuata l’iscrizione e l’indirizzo non è stato salvato né inviato.";
  });
}

const ticketForm = document.querySelector("#ticket-form");
const ticketEvent = document.querySelector(".ticket-event");
const demoCard = document.querySelector("#demo-card");
const cardGuideHint = document.querySelector("#card-guide-hint");
const cardGuideControls = [...document.querySelectorAll("[data-card-field-target]")];
const paymentMethodControls = [...document.querySelectorAll("[data-payment-method]")];

if (demoCard instanceof HTMLElement && cardGuideHint instanceof HTMLElement) {
  const cardFieldHints = {
    number: "Il numero della carta si trova sul fronte. Qui è sostituito da cifre fittizie.",
    name: "Il nome dell’intestatario si trova sul fronte. Qui è sostituito da un nome inventato.",
    expiry: "La data di scadenza si trova sul fronte. Qui è mostrata nel formato MM/AA, senza una data reale.",
    security: "Il codice di sicurezza è di solito sul retro, vicino allo spazio firma. La posizione può variare in base alla carta; qui è rappresentato solo da puntini.",
    wallet: "PayPal è un portafoglio digitale, non una carta fisica: si accede al checkout PayPal con il proprio account. Qui vedi solo un indirizzo inventato.",
  };
  const paymentMethods = {
    visa: {
      label: "VISA",
      fields: ["number", "name", "expiry", "security"],
      cardLabel: "Illustrazione dimostrativa di una carta Visa",
    },
    mastercard: {
      label: "mastercard",
      fields: ["number", "name", "expiry", "security"],
      cardLabel: "Illustrazione dimostrativa di una carta Mastercard",
    },
    bancomat: {
      label: "BANCOMAT",
      fields: ["number", "name", "expiry", "security"],
      cardLabel: "Illustrazione dimostrativa di una carta Bancomat",
    },
    paypal: {
      label: "PayPal",
      fields: ["wallet"],
      cardLabel: "Illustrazione dimostrativa del checkout PayPal",
    },
  };
  const walletView = demoCard.querySelector(".demo-wallet-view");
  const standardCardView = demoCard.querySelector(".demo-card-standard-content");

  const selectField = (field) => {
    if (!Object.hasOwn(cardFieldHints, field)) {
      return;
    }

    demoCard.dataset.side = field === "security" ? "back" : "front";
    cardGuideHint.textContent = cardFieldHints[field];
    for (const cardField of demoCard.querySelectorAll("[data-card-field]")) {
      cardField.classList.toggle("is-highlighted", cardField.getAttribute("data-card-field") === field);
    }
    for (const marker of demoCard.querySelectorAll("[data-card-marker]")) {
      marker.hidden = marker.getAttribute("data-card-marker") !== field;
    }

    for (const control of cardGuideControls) {
      const isActive = control instanceof HTMLButtonElement && control.dataset.cardFieldTarget === field;
      control.classList.toggle("is-active", isActive);
      control.setAttribute("aria-pressed", String(isActive));
    }
  };

  const updatePaymentMethod = (methodName) => {
    const method = paymentMethods[methodName];
    if (!method) {
      return;
    }

    demoCard.dataset.method = methodName;
    demoCard.setAttribute("aria-label", method.cardLabel);
    const brand = demoCard.querySelector("[data-card-brand]");
    if (brand) {
      brand.textContent = method.label;
    }

    const isWallet = methodName === "paypal";
    if (walletView instanceof HTMLElement && standardCardView instanceof HTMLElement) {
      walletView.hidden = !isWallet;
      standardCardView.hidden = isWallet;
    }

    for (const control of cardGuideControls) {
      const isAvailable = method.fields.includes(control.dataset.cardFieldTarget ?? "");
      control.hidden = !isAvailable;
    }

    for (const control of paymentMethodControls) {
      const isActive = control instanceof HTMLButtonElement && control.dataset.paymentMethod === methodName;
      control.classList.toggle("is-active", isActive);
      control.setAttribute("aria-pressed", String(isActive));
    }

    selectField(method.fields[0]);
  };

  for (const control of cardGuideControls) {
    if (control instanceof HTMLButtonElement) {
      control.addEventListener("click", () => selectField(control.dataset.cardFieldTarget ?? ""));
    }
  }

  for (const control of paymentMethodControls) {
    if (control instanceof HTMLButtonElement) {
      control.addEventListener("click", () => updatePaymentMethod(control.dataset.paymentMethod ?? ""));
    }
  }

  updatePaymentMethod("visa");
}

if (ticketEvent) {
  const params = new URLSearchParams(window.location.search);
  const selectedTitle = params.get("titolo");
  const selectedDate = params.get("data");
  const selectedPlace = params.get("luogo");
  const selectedCategory = params.get("tipologia");
  const selectedPoster = params.get("locandina");
  const selectedStatus = params.get("stato");
  const selectedSubtitle = params.get("sottotitolo");

  if (selectedTitle && selectedDate && selectedPlace && selectedCategory) {
    const title = ticketEvent.querySelector("#ticket-event-title");
    const description = ticketEvent.querySelector("#ticket-event-description");
    const date = ticketEvent.querySelector("#ticket-event-date");
    const place = ticketEvent.querySelector("#ticket-event-place");
    const category = ticketEvent.querySelector("#ticket-event-category");
    const poster = ticketEvent.querySelector("#ticket-event-poster");
    const availability = ticketEvent.querySelector("#ticket-event-availability");

    if (
      title instanceof HTMLElement &&
      description instanceof HTMLElement &&
      date instanceof HTMLElement &&
      place instanceof HTMLElement &&
      category instanceof HTMLElement &&
      availability instanceof HTMLElement
    ) {
      title.textContent = selectedTitle;
      description.textContent = selectedSubtitle || "Evento selezionato dal calendario.";
      date.textContent = selectedDate;
      place.textContent = selectedPlace;
      category.textContent = selectedCategory;
      ticketEvent.classList.add("has-selected-event");

      if (poster instanceof HTMLImageElement && /^assets\/posters\/[a-z0-9-]+\.jpg$/i.test(selectedPoster ?? "")) {
        poster.src = selectedPoster;
        poster.alt = `Locandina di ${selectedTitle}`;
        poster.hidden = false;
        ticketEvent.classList.add("has-event-poster");
      }

      const isUnavailable = selectedStatus === "soldout" || selectedStatus === "refund";
      if (selectedStatus === "soldout") {
        availability.textContent = "Nello screenshot l’evento risulta sold out. Controlla il canale ufficiale per eventuali aggiornamenti.";
      } else if (selectedStatus === "refund") {
        availability.textContent = "Nello screenshot è indicata la procedura rimborsi. Verifica gli aggiornamenti sul canale ufficiale.";
      } else if (selectedStatus === "new-date") {
        availability.textContent = "Nello screenshot questa data è indicata come nuova data. La disponibilità va verificata sul canale ufficiale.";
      } else if (selectedStatus === "rescheduled") {
        availability.textContent = "Nello screenshot la data è indicata come riprogrammata. Verifica gli aggiornamenti sul canale ufficiale.";
      } else {
        availability.textContent = "Data e evento selezionati dal calendario. Disponibilità e prezzi reali vanno verificati sul canale ufficiale.";
      }

      if (isUnavailable && ticketForm instanceof HTMLFormElement) {
        ticketForm.classList.add("is-unavailable");
        const unavailableNote = document.createElement("p");
        unavailableNote.className = "ticket-form-unavailable";
        unavailableNote.textContent = selectedStatus === "soldout"
          ? "La data risulta sold out nel materiale condiviso: non è possibile simulare la selezione di biglietti."
          : "Nel materiale condiviso sono indicati rimborsi: la selezione di biglietti non è disponibile.";
        ticketForm.insertBefore(unavailableNote, ticketForm.querySelector(".ticket-option"));
        for (const control of ticketForm.querySelectorAll("input, button[type='submit']")) {
          if (control instanceof HTMLInputElement || control instanceof HTMLButtonElement) {
            control.disabled = true;
          }
        }
      } else if (ticketForm instanceof HTMLFormElement) {
        const firstQuantity = ticketForm.querySelector("#quantity-platea");
        if (firstQuantity instanceof HTMLInputElement) {
          firstQuantity.value = "1";
          firstQuantity.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    }
  }
}

if (ticketForm instanceof HTMLFormElement) {
  const ticketInputs = [...ticketForm.querySelectorAll('input[type="number"]')];
  const ticketTotal = document.querySelector("#ticket-total");
  const ticketStatus = document.querySelector("#ticket-status");
  const ticketPrices = [35, 25];
  const formatPrice = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  });

  const updateTicketTotal = () => {
    if (!(ticketTotal instanceof HTMLOutputElement) || !(ticketStatus instanceof HTMLElement)) {
      return;
    }

    const hasInvalidQuantity = ticketInputs.some((input) => !input.validity.valid);
    if (hasInvalidQuantity) {
      ticketStatus.textContent = "Inserisci una quantità intera da 0 a 6 per ogni tipologia.";
      return;
    }

    const quantities = ticketInputs.map((input) => input.valueAsNumber || 0);
    const total = quantities.reduce((sum, quantity, index) => sum + quantity * ticketPrices[index], 0);
    ticketTotal.value = formatPrice.format(total);
    ticketStatus.textContent = "";
  };

  ticketInputs.forEach((input) => input.addEventListener("input", updateTicketTotal));
  updateTicketTotal();

  ticketForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!(ticketStatus instanceof HTMLElement) || !ticketForm.reportValidity()) {
      return;
    }

    const quantities = ticketInputs.map((input) => input.valueAsNumber || 0);
    const ticketCount = quantities.reduce((sum, quantity) => sum + quantity, 0);
    if (ticketCount === 0) {
      ticketStatus.textContent = "Seleziona almeno un biglietto per vedere il riepilogo.";
      ticketInputs[0]?.focus();
      return;
    }

    const total = quantities.reduce((sum, quantity, index) => sum + quantity * ticketPrices[index], 0);
    ticketStatus.textContent = `Simulazione completata: ${ticketCount} ${ticketCount === 1 ? "biglietto selezionato" : "biglietti selezionati"}, totale ${formatPrice.format(total)}. Nessun ordine creato.`;
  });
}
