// ----------------------------------------------------------- DEFINITIONS

// From
// https://stackoverflow.com/questions/21070836/how-can-i-create-a-two-way-mapping-in-javascript-or-some-other-way-to-swap-out
class TwoWayMap {
    constructor(map) {
        this.map = map;
        this.reverseMap = {};
        for(const key in map) {
            const value = map[key];
            this.reverseMap[value] = key;
        }
    }
    get(key) { return this.map[key]; }
    revGet(key) { return this.reverseMap[key]; }
}

/**
 * @typedef {Object} Appointment
 * @property {String} id
 * @property {String} title
 * @property {String} description
 * @property {String} calendarId
 * @property {String} startDate
 * @property {String} endDate
 * @property {Boolean} isRecurring
 * @property {String} recursionRule
 * @property {String[]} tags
 */

/**
 * @typedef {Object} Calendar
 * @property {String} id
 * @property {String} name
 * @property {String} description
 * @property {String} color
 */

// We use this to map ICS keys to object keys
// Format: [type]name
const calendarKeys = new TwoWayMap( {
    'UID' : '[String]id',
    'NAME' : '[String]name',
    'DESCRIPTION' : '[String]description',
    'COLOR' : '[String]color',
});

const appointmentKeys = new TwoWayMap( {
    'UID' : '[String]id',
    'SUMMARY' : '[String]title',
    'DESCRIPTION' : '[String]description',
    '3' : '[String]calendarId', // TODO: get that from the parent agenda
    'DTSTART' : '[String]startDate',
    'DTEND' : '[String]endDate',
    '6' : '[Boolean]isRecurring', // TODO: infer that from recursionRule
    'RRULE' : '[String]recursionRule',
    'CATEGORIES' : '[String[]]tags',
});

const objectTypeRegex = /^(\[.+\])[\s_\-]*(\w+)/m

// ----------------------------------------------------------- CALENDAR
// Useful doc:
// https://icalendar.org/RFC-Specifications/iCalendar-RFC-7986/

/**
 * Convert a calendar into an ICS file
 * @param {Calendar} calendar
 * @param {Appointment[]} appointments
 * @returns {String} An ICS representation of the calendar
 */
export function calendarToICS(calendar, appointments) {
    let icsFile = [];

    // Header
    icsFile.push("BEGIN:VCALENDAR");
    icsFile.push("VERSION:2.0"); // Do not touch, it's the ICS version not our own version number :]
    icsFile.push("PRODID:-//ACL 2025 CHARLEMAGNES//NONSGML Calendar//FR");

    // Calendar metadata
    calendarKeys.map.forEach((key, value) => {
        // Extract the type of the target object field
        const regexResult = objectTypeRegex.exec(value);
        if(regexResult === null) throw new Error("Invalid calendar key");
        let [, type, name] = regexResult;
        type = type.replace(/(^\[|]$)/m, "").toLowerCase();

        // Convert the value to the right type
        switch (type) {
            case "string":
                value = name;
                break;
            default:
                throw new Error("Unknown type in object keys");
        }

        // Add the converted result to the file
        icsFile.push(`${key}:${value}`);
    });

    // Appointments
    appointments.forEach(appointment => {
        icsFile.push("BEGIN:VEVENT");
        icsFile.push(appointmentToICS(appointment));
        icsFile.push("END:VEVENT");
    });

    icsFile.push("END:VCALENDAR");
    return icsFile.join("\n");
}

/**
 * Convert an ICS file into a calendar
 * @param {String} icsCalendar An ICS representation of the calendar
 * @returns {{calendar: Calendar, appointments: Appointment}} The decoded calendar
 */
export function ICSToCalendar(icsCalendar) {
    // Event states for every type of events, even if it's just to ignore unsupported types
    let isInVEVENT = false,
        isInALARM = false,
        isInVTIMEZONE = false,
        isInVFREEBUSY = false,
        isInVJOURNAL = false,
        isInVTODO = false;

    // TODO
}

// ----------------------------------------------------------- APPOINTMENT
// Useful doc:
// https://icalendar.org/iCalendar-RFC-5545/3-6-1-event-component.html
/*
The following is an example of the "VEVENT" calendar component used to represent an anniversary that will occur annually:

 BEGIN:VEVENT
 UID:19970901T130000Z-123403@example.com
 DTSTAMP:19970901T130000Z
 DTSTART;VALUE=DATE:19971102
 SUMMARY:Our Blissful Anniversary
 TRANSP:TRANSPARENT
 CLASS:CONFIDENTIAL
 CATEGORIES:ANNIVERSARY,PERSONAL,SPECIAL OCCASION
 RRULE:FREQ=YEARLY
 END:VEVENT
 */

/**
 * Convert an appointment into an ICS file
 * @param {Appointment} appointment
 * @returns {String} An ICS representation of the appointment
 */
function appointmentToICS(appointment) {
    // TODO
}

/**
 * Convert an ICS file into an appointment
 * @param {String} icsAppointment An ICS representation of the appointment
 * @returns {Appointment} The decoded appointment
 */
function ICSToAppointment(icsAppointment) {
    // TODO
}