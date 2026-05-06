const CONTENT_URL = "src/content.json";
const THEMES = {
  light: "light",
  dark: "dark"
};
const LINKEDIN_BADGE_PAGES = {
  light: "src/html/linkedin-badge-light.html",
  dark: "src/html/linkedin-badge-dark.html"
};

const updateLinkedInBadgeFrames = (theme) => {
  document.querySelectorAll("[data-linkedin-local-badge-frame]").forEach((frame) => {
    const nextSrc = LINKEDIN_BADGE_PAGES[theme];
    if (frame.getAttribute("src") !== nextSrc) frame.setAttribute("src", nextSrc);
  });
};

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? THEMES.dark : THEMES.light;

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  updateLinkedInBadgeFrames(theme);
};

let hasManualThemeSelection = false;

applyTheme(getSystemTheme());

const fields = document.querySelectorAll("[data-field]");
const regions = Object.fromEntries(
  Array.from(document.querySelectorAll("[data-region]")).map((node) => [node.dataset.region, node])
);
const themeToggle = document.querySelector("[data-theme-toggle]");

const updateThemeToggle = () => {
  if (!themeToggle) return;

  const isDark = document.documentElement.dataset.theme === THEMES.dark;
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} theme`);
};

themeToggle?.addEventListener("click", () => {
  const currentTheme = document.documentElement.dataset.theme;
  const nextTheme = currentTheme === THEMES.dark ? THEMES.light : THEMES.dark;

  hasManualThemeSelection = true;
  applyTheme(nextTheme);
  updateThemeToggle();
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (hasManualThemeSelection) return;

  applyTheme(getSystemTheme());
  updateThemeToggle();
});

updateThemeToggle();

const setText = (selector, value) => {
  fields.forEach((node) => {
    if (node.dataset.field !== selector) return;

    node.textContent = value || "";
    node.hidden = !value;
  });
};

const makeLink = ({ label, href, style }) => {
  const anchor = document.createElement("a");
  anchor.className = style === "primary" ? "button primary" : "button";
  anchor.href = href;
  anchor.textContent = label;
  return anchor;
};

const makeNavLink = ({ label, href }) => {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.textContent = label;
  return anchor;
};

const clearRegion = (region) => {
  if (regions[region]) regions[region].replaceChildren();
};

const makeLinkedInBadgeFrame = () => {
  const frame = document.createElement("iframe");
  frame.className = "linkedin-local-badge-frame";
  frame.title = "LinkedIn profile badge";
  frame.loading = "lazy";
  frame.allowTransparency = "true";
  frame.dataset.linkedinLocalBadgeFrame = "true";
  frame.src = LINKEDIN_BADGE_PAGES[document.documentElement.dataset.theme] || LINKEDIN_BADGE_PAGES.light;
  return frame;
};

const renderLinkedIn = (linkedin) => {
  clearRegion("hero-linkedin");
  clearRegion("linkedin-action");

  if (!linkedin?.badge?.enabled) {
    if (linkedin?.url) regions["linkedin-action"]?.append(makeLink(linkedin));
    return;
  }

  regions["hero-linkedin"]?.append(makeLinkedInBadgeFrame());

  if (linkedin.url) regions["linkedin-action"]?.append(makeLink(linkedin));
};

const renderContent = (content) => {
  document.title = `${content.person.name} | ${content.person.domain}`;
  setText("name", content.person.name);
  setText("domain", content.person.domain);
  setText("role", content.person.role);
  setText("intro", content.person.intro);
  setText("focus-title", content.focus.title);
  setText("focus-lede", content.focus.lede);
  setText("experience-title", content.experience.title);
  setText("experience-lede", content.experience.lede);
  setText("certifications-title", content.certifications.title);
  setText("certifications-lede", content.certifications.lede);
  setText("contact-title", content.contact.title);
  setText("contact-body", content.contact.body);
  setText("footer-privacy", content.footer.privacy);
  setText("footer-copyright", `${new Date().getFullYear()} ${content.footer.copyright}`);

  clearRegion("navigation");
  clearRegion("actions");
  clearRegion("system");
  clearRegion("focus");
  clearRegion("skills");
  clearRegion("certifications");

  content.navigation.forEach((item) => regions.navigation.append(makeNavLink(item)));
  content.actions.forEach((item) => regions.actions.append(makeLink(item)));

  if (regions.system) {
    content.system.forEach((item) => {
      const node = document.createElement("div");
      node.className = "node";
      node.innerHTML = `
        <span>
          <span class="node-title"></span>
          <span class="node-subtitle"></span>
        </span>
        <span class="node-tag"></span>
      `;
      node.querySelector(".node-title").textContent = item.title;
      node.querySelector(".node-subtitle").textContent = item.subtitle;
      node.querySelector(".node-tag").textContent = item.tag;
      regions.system.append(node);
    });
  }

  content.focus.items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = "<h3></h3><p></p>";
    card.querySelector("h3").textContent = item.title;
    card.querySelector("p").textContent = item.body;
    regions.focus.append(card);
  });

  content.experience.skills.forEach((skill) => {
    const item = document.createElement("li");
    item.textContent = skill;
    regions.skills.append(item);
  });

  content.certifications.items.forEach((certification) => {
    const item = document.createElement("article");
    item.className = "certification-card";
    item.innerHTML = `
      <img class="certification-image" alt="">
      <div>
        <div class="certification-meta">
          <p class="certification-issuer"></p>
          <p class="certification-status"></p>
        </div>
        <h3></h3>
        <p class="certification-summary"></p>
      </div>
    `;
    const image = item.querySelector(".certification-image");
    image.src = certification.image.src;
    image.alt = certification.image.alt;
    item.querySelector(".certification-issuer").textContent = certification.issuer;
    item.querySelector(".certification-status").textContent = certification.status;
    item.querySelector("h3").textContent = certification.title;
    item.querySelector(".certification-summary").textContent = certification.summary;
    regions.certifications.append(item);
  });

  const contact = document.querySelector('[data-field="contact-link"]');
  contact.href = content.contact.href;
  contact.textContent = content.contact.label;

  renderLinkedIn(content.linkedin);
};

const showContentError = () => {
  document.body.insertAdjacentHTML(
    "afterbegin",
    '<p class="content-error">Unable to load site content. Serve this page through GitHub Pages or a local web server so src/content.json can be requested.</p>'
  );
};

fetch(CONTENT_URL)
  .then((response) => {
    if (!response.ok) throw new Error(`Unable to load ${CONTENT_URL}`);
    return response.json();
  })
  .then(renderContent)
  .catch(showContentError);
