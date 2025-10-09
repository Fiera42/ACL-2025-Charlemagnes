class Calendar {
  constructor(id, name, description, ownerId, createdAt = new Date()) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.ownerId = ownerId;
    this.createdAt = createdAt;
  }

  static create(name, description, ownerId) {
    return new Calendar(null, name, description, ownerId);
  }

  isValid() {
    return this.name && this.ownerId;
  }
}

module.exports = Calendar;
