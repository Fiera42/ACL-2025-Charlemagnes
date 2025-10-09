class User {
  constructor(id, username, email, password, createdAt = new Date()) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password = password;
    this.createdAt = createdAt;
  }

  static create(username, email, password) {
    return new User(null, username, email, password);
  }

  isValid() {
    return this.username && this.email && this.password;
  }
}

module.exports = User;
