const CONTENT_URL = "src/content.json";
const LINKEDIN_BADGE_SCRIPT = "https://platform.linkedin.com/badges/js/profile.js";
const THEMES = {
  light: "light",
  dark: "dark"
};

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? THEMES.dark : THEMES.light;

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
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
    if (node.dataset.field === selector) node.textContent = value || "";
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

const loadLinkedInBadgeScript = () => {
  if (document.querySelector(`script[src="${LINKEDIN_BADGE_SCRIPT}"]`)) return;

  const script = document.createElement("script");
  script.src = LINKEDIN_BADGE_SCRIPT;
  script.async = true;
  script.defer = true;
  script.type = "text/javascript";
  document.body.append(script);
};

const renderLinkedIn = (linkedin) => {
  clearRegion("hero-linkedin");
  clearRegion("linkedin-action");

  if (!linkedin?.badge?.enabled) {
    if (linkedin?.url) regions["linkedin-action"].append(makeLink(linkedin));
    return;
  }

  const badge = linkedin.badge;
  const profile = document.createElement("div");
  profile.className = "badge-base LI-profile-badge";
  profile.dataset.locale = badge.locale;
  profile.dataset.size = badge.size;
  profile.dataset.theme = document.documentElement.dataset.theme;
  profile.dataset.type = badge.type;
  profile.dataset.vanity = badge.vanity;
  profile.dataset.version = badge.version;

  const link = document.createElement("a");
  link.className = "badge-base__link LI-simple-link";
  link.href = linkedin.url;
  link.textContent = badge.profileName || linkedin.label;
  profile.append(link);
  regions["hero-linkedin"].append(profile);

  if (linkedin.url) regions["linkedin-action"].append(makeLink(linkedin));

  loadLinkedInBadgeScript();
};

const renderContent = (content) => {
  document.title = `${content.person.name} | ${content.person.domain}`;
  setText("initial", content.person.name.charAt(0));
  setText("name", content.person.name);
  setText("domain", content.person.domain);
  setText("role", content.person.role);
  setText("intro", content.person.intro);
  setText("focus-title", content.focus.title);
  setText("focus-lede", content.focus.lede);
  setText("experience-title", content.experience.title);
  setText("experience-lede", content.experience.lede);
  setText("linkedin-title", content.linkedin.title);
  setText("linkedin-body", content.linkedin.body);
  setText("contact-title", content.contact.title);
  setText("contact-body", content.contact.body);
  setText("footer-privacy", content.footer.privacy);
  setText("footer-copyright", `${new Date().getFullYear()} ${content.footer.copyright}`);

  clearRegion("navigation");
  clearRegion("actions");
  clearRegion("system");
  clearRegion("focus");
  clearRegion("skills");

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
