const fs = require("fs");
const path = require("path");

class DataStore {
  constructor(basePath) {
    this.basePath = basePath;
    this.cache = new Map();
  }

  _file(type, id) {
    return path.join(this.basePath, type, `${id}.json`);
  }

  get(type, id, defaults = {}) {
    const key = `${type}:${id}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const file = this._file(type, id);
    let data = defaults;

    if (fs.existsSync(file)) {
      data = JSON.parse(fs.readFileSync(file, "utf8"));
    }

    this.cache.set(key, data);
    return data;
  }

  set(type, id, data) {
    const key = `${type}:${id}`;
    this.cache.set(key, data);
  }

  save(type, id) {
    const key = `${type}:${id}`;
    if (!this.cache.has(key)) return;

    const file = this._file(type, id);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(this.cache.get(key), null, 2));
  }

  saveAll() {
    for (const key of this.cache.keys()) {
      const [type, id] = key.split(":");
      this.save(type, id);
    }
  }
}

module.exports = new DataStore(path.join(__dirname, "../storage"));
