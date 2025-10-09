class Appointment {
  constructor(id, calendarId, title, description, startDate, endDate, createdAt = new Date()) {
    this.id = id;
    this.calendarId = calendarId;
    this.title = title;
    this.description = description;
    this.startDate = startDate;
    this.endDate = endDate;
    this.createdAt = createdAt;
  }

  static create(calendarId, title, description, startDate, endDate) {
    return new Appointment(null, calendarId, title, description, startDate, endDate);
  }

  isValid() {
    return this.calendarId && this.title && this.startDate;
  }
}

module.exports = Appointment;
