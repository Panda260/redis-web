const dom = {
  connectionForm: document.getElementById("connection-form"),
  protocol: document.getElementById("redis-protocol"),
  host: document.getElementById("redis-host"),
  port: document.getElementById("redis-port"),
  username: document.getElementById("redis-username"),
  password: document.getElementById("redis-password"),
  connectBtn: document.getElementById("connect-btn"),
  refreshBtn: document.getElementById("refresh-btn"),
  addForm: document.getElementById("add-form"),
  newField: document.getElementById("new-field"),
  newValue: document.getElementById("new-value"),
  entries: document.getElementById("entries"),
  template: document.getElementById("entry-template"),
  connectionStatus: document.getElementById("connection-status"),
  search: document.getElementById("search"),
  totalCount: document.getElementById("total-count"),
  categoryList: document.getElementById("category-list"),
  clearFilter: document.getElementById("clear-filter"),
};

const state = {
  baseUrl: "",
  protocol: "http",
  username: "",
  password: "",
  entries: [],
  filter: "",
  category: "",
  connecting: false,
};

const STORAGE_KEY = "redis-web-connection";

init();

function init() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  if (saved) {
    dom.protocol.value = saved.protocol || "http";
    dom.host.value = saved.host || "";
    dom.port.value = saved.port || "";
    dom.username.value = saved.username || "";
    dom.password.value = saved.password || "";
  }

  dom.connectionForm.addEventListener("submit", handleConnect);
  dom.refreshBtn.addEventListener("click", loadEntries);
  dom.addForm.addEventListener("submit", handleAdd);
  dom.protocol.addEventListener("change", updatePortPlaceholder);
  dom.search.addEventListener("input", () => {
    state.filter = dom.search.value.toLowerCase();
    renderEntries();
  });
  dom.clearFilter.addEventListener("click", () => {
    state.category = "";
    dom.clearFilter.disabled = true;
    renderCategories();
    renderEntries();
  });

  updatePortPlaceholder();
}

function updatePortPlaceholder() {
  const protocol = dom.protocol.value;
  dom.port.placeholder = protocol === "https" ? "443" : "80";
}

function setStatus(text, tone = "muted") {
  dom.connectionStatus.textContent = text;
  dom.connectionStatus.className = `status-box ${tone}`;
}

function saveConnectionInfo(host, port, username, password, baseUrl) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      host,
      port,
      username,
      password,
      baseUrl,
      protocol: dom.protocol.value || "http",
    })
  );
}

function buildBaseUrl(protocol, host, port) {
  try {
    const sanitizedHost = host.replace(/^https?:\/\//, "");
    const prefixed = `${protocol}://${sanitizedHost}`;
    const url = new URL(prefixed);
    if (port) url.port = port;
    return url.toString().replace(/\/$/, "");
  } catch (error) {
    return null;
  }
}

async function sendCommand(command) {
  if (!state.baseUrl) throw new Error("Not connected");
  const headers = { "Content-Type": "application/json" };
  const hasAuth = state.username || state.password;
  if (hasAuth) {
    headers["Authorization"] = `Basic ${btoa(`${state.username}:${state.password}`)}`;
  }

  let response;
  try {
    response = await fetch(state.baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ command }),
    });
  } catch (error) {
    throw new Error(
      `Network error: ${error.message}. If you are on HTTPS, HTTP endpoints will be blocked.`
    );
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }

  const payload = await response.json();
  if (payload.error) throw new Error(payload.error);
  return payload.result;
}

async function handleConnect(event) {
  event.preventDefault();
  if (state.connecting) return;

  const host = dom.host.value.trim();
  const port = dom.port.value.trim();
  const username = dom.username.value.trim();
  const password = dom.password.value.trim();
  const protocol = dom.protocol.value || "http";

  if (window.location.protocol === "https:" && protocol === "http") {
    setStatus(
      "HTTPS pages cannot call HTTP endpoints. Pick https or open the UI over http.",
      "danger"
    );
    return;
  }

  const baseUrl = buildBaseUrl(protocol, host, port);
  if (!baseUrl) {
    setStatus("Invalid URL", "danger");
    return;
  }

  state.connecting = true;
  dom.connectBtn.disabled = true;
  setStatus("Connecting...");

  try {
    state.baseUrl = baseUrl;
    state.protocol = protocol;
    state.username = username;
    state.password = password;

    await sendCommand(["PING"]);
    saveConnectionInfo(host, port, username, password, baseUrl);
    dom.refreshBtn.disabled = false;
    dom.clearFilter.disabled = false;

    setStatus(`Connected to ${baseUrl}`, "success");
    await loadEntries();
  } catch (error) {
    console.error(error);
    setStatus(`Connection failed: ${error.message}`, "danger");
  } finally {
    state.connecting = false;
    dom.connectBtn.disabled = false;
  }
}

function parseHash(result) {
  if (!result) return [];
  if (Array.isArray(result)) {
    const entries = [];
    for (let i = 0; i < result.length; i += 2) {
      const field = result[i];
      const value = result[i + 1] ?? "";
      entries.push({ field, value });
    }
    return entries;
  }
  if (typeof result === "object") {
    return Object.entries(result).map(([field, value]) => ({ field, value }));
  }
  return [];
}

async function loadEntries() {
  try {
    setStatus("Loading messages...");
    const result = await sendCommand(["HGETALL", "messages"]);
    state.entries = parseHash(result).sort((a, b) => a.field.localeCompare(b.field));
    renderCategories();
    renderEntries();
    setStatus(`Loaded ${state.entries.length} field(s)`, "success");
  } catch (error) {
    console.error(error);
    setStatus(`Failed to load: ${error.message}`, "danger");
  }
}

function renderCategories() {
  dom.categoryList.innerHTML = "";
  const groups = state.entries.reduce((acc, entry) => {
    const prefix = entry.field.includes(".") ? entry.field.split(".")[0] : "uncategorized";
    acc[prefix] = (acc[prefix] || 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [name, count] of sorted) {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = name;
    const badge = document.createElement("span");
    badge.className = "count";
    badge.textContent = count;
    button.appendChild(badge);
    button.addEventListener("click", () => {
      state.category = name;
      dom.clearFilter.disabled = false;
      renderEntries();
    });
    li.appendChild(button);
    dom.categoryList.appendChild(li);
  }

  dom.clearFilter.disabled = !state.category;
}

function renderEntries() {
  dom.entries.innerHTML = "";
  const filter = state.filter;
  const category = state.category;

  const filtered = state.entries.filter((item) => {
    const matchesFilter = !filter || item.field.toLowerCase().includes(filter);
    const currentCategory = item.field.includes(".")
      ? item.field.split(".")[0]
      : "uncategorized";
    const matchesCategory = !category || currentCategory === category;
    return matchesFilter && matchesCategory;
  });

  dom.totalCount.textContent = `${filtered.length} / ${state.entries.length}`;

  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = state.entries.length
      ? "No items match the filter."
      : "No fields found in messages.";
    dom.entries.appendChild(empty);
    return;
  }

  for (const entry of filtered) {
    const node = dom.template.content.firstElementChild.cloneNode(true);
    const fieldEl = node.querySelector("[data-field]");
    const valueEl = node.querySelector("[data-value]");
    const statusEl = node.querySelector("[data-status]");
    const categoryEl = node.querySelector("[data-category]");
    const saveBtn = node.querySelector("[data-save]");
    const deleteBtn = node.querySelector("[data-delete]");

    const prefix = entry.field.includes(".") ? entry.field.split(".")[0] : "uncategorized";

    fieldEl.textContent = entry.field;
    categoryEl.textContent = prefix;
    valueEl.value = entry.value;

    saveBtn.addEventListener("click", async () => {
      statusEl.textContent = "Saving...";
      saveBtn.disabled = true;
      try {
        await sendCommand(["HSET", "messages", entry.field, valueEl.value]);
        statusEl.textContent = "Saved";
      } catch (error) {
        console.error(error);
        statusEl.textContent = `Error: ${error.message}`;
      } finally {
        saveBtn.disabled = false;
      }
    });

    deleteBtn.addEventListener("click", async () => {
      statusEl.textContent = "Deleting...";
      deleteBtn.disabled = true;
      try {
        await sendCommand(["HDEL", "messages", entry.field]);
        statusEl.textContent = "Deleted";
        state.entries = state.entries.filter((e) => e.field !== entry.field);
        renderCategories();
        renderEntries();
      } catch (error) {
        console.error(error);
        statusEl.textContent = `Error: ${error.message}`;
      }
    });

    dom.entries.appendChild(node);
  }
}

async function handleAdd(event) {
  event.preventDefault();
  const field = dom.newField.value.trim();
  const value = dom.newValue.value.trim();
  if (!field) return;

  try {
    setStatus("Adding field...");
    await sendCommand(["HSET", "messages", field, value]);
    dom.newField.value = "";
    dom.newValue.value = "";
    await loadEntries();
    setStatus(`Added ${field}`, "success");
  } catch (error) {
    console.error(error);
    setStatus(`Failed to add: ${error.message}`, "danger");
  }
}
