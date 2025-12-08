// ----------------------------------------------------------- DEFINITIONS

import {calendarService} from "../../assets/calendar.js";

function* lineReader_cons(str) {
    let start = 0;
    while (true) {
        const idx = str.indexOf('\n', start);
        if (idx === -1) {
            if (start < str.length) yield str.slice(start);
            return;
        }
        yield str.slice(start, idx);
        start = idx + 1;
    }
}

/**
 * @typedef {Object} Appointment
 * @property {String} id
 * @property {String} title
 * @property {String} description
 * @property {String} calendarId
 * @property {Date} startDate
 * @property {Date} endDate
 * @property {Boolean} isRecurring
 * @property {Number} recursionRule
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
const calendarKeys = new Map([
    ['UID', '[String]id'],
    ['NAME', '[String]name'],
    ['DESCRIPTION', '[String]description'],
    ['COLOR', '[String]color'],
]);

const appointmentKeys = new Map( [
    ['UID', '[String]id'],
    ['SUMMARY', '[String]title'],
    ['DESCRIPTION', '[String]description'],
    ['DTSTART', '[Date]startDate'],
    ['DTEND', '[Date]endDate'],
    ['RRULE', '[Number]recursionRule'],
    ['CATEGORIES', '[String[]]tags'],
]);

const icsKeyRegex = /^([\w\s]+):(.*)$/m
const objectTypeRegex = /^\[(.+)][\s_\-]*(\w+)/m

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
    calendarKeys.forEach((value, key) => {
        // Extract the type of the target object field
        const regexResult = objectTypeRegex.exec(value);
        if(regexResult === null) throw new Error(`Invalid calendar key in exporter key:${key} value:${value}`);
        let [, type, name] = regexResult;
        type = type.toLowerCase();

        // Convert the value to the right type
        switch (type) {
            case "string":
                value = calendar[name];
                break;
            default:
                throw new Error(`Unknown type "${type}" in object keys in exporter`);
        }

        // Add the converted result to the file
        icsFile.push(`${key}:${value}`);
    });

    // Appointments
    appointments.forEach(appointment => {
        icsFile.push(appointmentToICS(appointment));
    });

    icsFile.push("END:VCALENDAR");
    return icsFile.join("\n");
}

/**
 * Convert an ICS file into a calendar
 * @param {String} icsCalendar An ICS representation of the calendar
 * @returns {{calendar: Calendar, appointments: Appointment[]}} The decoded calendar
 */
export function ICSToCalendar(icsCalendar) {
    /**
     * @type {Calendar}
     */
    let calendar = {};
    let appointments = [];

    const lineReader = lineReader_cons(icsCalendar);

    for (const line of lineReader) {
        // Extract the ics key and it's value from the line
        const regexResult = icsKeyRegex.exec(line);

        // We ignore invalid lines
        if(regexResult === null) {
            console.warn(`ignored line ${line} while reading an ICS file`);
            continue;
        }

        let [, icsKey, value] = regexResult;
        icsKey = icsKey.trim().toUpperCase();
        switch (icsKey) {
            case "BEGIN" :
                switch (value) {
                    case "VEVENT":
                        let appointment = ICSToAppointment(lineReader);
                        appointment.calendarId = calendar.id;
                        appointment.isRecurring = !!appointment.recursionRule;
                        appointment = calendarService.normalize(appointment, calendar);
                        appointments.push(appointment);
                        break;
                    case "VALARM":
                        ICSToAlarm(lineReader); // This just skip for now
                        break;
                    case "VTIMEZONE":
                        ICSToTimezone(lineReader); // This just skip for now
                        break;
                    case "VFREEBUSY":
                        ICSToFreeBusy(lineReader); // This just skip for now
                        break;
                    case "VJOURNAL":
                        ICSToJournal(lineReader); // This just skip for now
                        break;
                    case "VTODO":
                        ICSToTODO(lineReader); // This just skip for now
                        break;
                    case "VCALENDAR":
                        break;
                    default:
                        console.warn(`Unknown "Begin" value found in ICS file: ${value}`)
                        unknownBEGINSkipper(lineReader);
                }
                break;
            default:
                // Get the according ICS to Object mapping
                const targetObjectField = calendarKeys.get(icsKey);
                if(!targetObjectField) continue; // If we don't know the thing we mostly does not care

                // Extract the type of the target object field
                const regexResult = objectTypeRegex.exec(targetObjectField);
                if(regexResult === null) throw new Error(`Invalid calendar key in exporter key:${key} value:${value}`);
                let [, type, name] = regexResult;
                type = type.toLowerCase();

                // Convert the value to the right type
                switch (type) {
                    case "string":
                        calendar[name] = value.trim();
                        break;
                    default:
                        throw new Error(`Unknown type "${type}" in object keys`);
                }
        }
    }

    return {
        calendar: calendar,
        appointments: appointments,
    };
}

function unknownBEGINSkipper(lineReader) {
    let line;
    while (!(line = lineReader.next()).done) {
        line = line.value;
        // Extract the ics key and it's value from the line
        const regexResult = icsKeyRegex.exec(line);

        // We ignore invalid lines
        if(regexResult === null) {
            console.warn(`ignored line ${line} while reading an ICS file`);
            continue;
        }

        let [, icsKey, _] = regexResult;
        icsKey = icsKey.trim().toUpperCase();

        if(icsKey === "END") return;
    }

    throw new Error("ICS file is missing an \"END\" statement");
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
    let icsFile = [];

    // Header
    icsFile.push("BEGIN:VEVENT");

    // Appointment metadata
    appointmentKeys.forEach((value, key) => {
        // Extract the type of the target object field
        const regexResult = objectTypeRegex.exec(value);
        if(regexResult === null) throw new Error(`Invalid appointment key in exporter key:${key} value:${value}`);
        let [, type, name] = regexResult;
        type = type.toLowerCase();

        if(name === "recursionRule" && !appointment.recursionRule) return;

        // Convert the value to the right type
        switch (type) {
            case "string":
                value = appointment[name];
                break;
            case "string[]":
                value = appointment[name].join(",");
                break;
            case "date":
                value = appointment[name].toISOString();
                break;
            default:
                throw new Error(`Unknown type "${type}" in object keys`);
        }

        // Add the converted result to the file
        icsFile.push(`${key}:${value}`);
    });

    icsFile.push("END:VEVENT");
    return icsFile.join("\n");
}

/**
 * Convert an ICS file into an appointment
 * @param {Generator<*, void, ?>} lineReader The ICS file
 * @returns {Appointment} The decoded appointment
 */
function ICSToAppointment(lineReader) {
    /**
     * @type {Appointment}
     */
    let appointment = {};

    let line;
    while (!(line = lineReader.next()).done) {
        line = line.value;
        // Extract the ics key and it's value from the line
        const regexResult = icsKeyRegex.exec(line);

        // We ignore invalid lines
        if(regexResult === null) {
            console.warn(`ignored line ${line} while reading an ICS file`);
            continue;
        }

        let [, icsKey, value] = regexResult;
        icsKey = icsKey.trim().toUpperCase();

        switch (icsKey) {
            case "END" :
                if(value === "VEVENT") return appointment;
                break;
            default:
                // Get the according ICS to Object mapping
                const targetObjectField = appointmentKeys.get(icsKey);
                if(!targetObjectField) continue; // If we don't know the thing we mostly does not care

                // Extract the type of the target object field
                const regexResult = objectTypeRegex.exec(targetObjectField);
                if(regexResult === null) throw new Error(`Invalid appointment key in exporter key:${key} value:${value}`);
                let [, type, name] = regexResult;
                type = type.toLowerCase();

                // Convert the value to the right type
                switch (type) {
                    case "string":
                        appointment[name] = value.trim();
                        break;
                    case "string[]":
                        appointment[name] = value.trim().split(",");
                        break;
                    case "date":
                        appointment[name] = new Date(value.trim());
                        break;
                    case "number":
                        appointment[name] = parseInt(value.trim());
                        break;
                    default:
                        throw new Error(`Unknown type "${type}" in object keys`);
                }
        }
    }

    throw new Error("ICS file is missing an \"END:VEVENT\" statement");
}

// ----------------------------------------------------------- TO-DO
/**
 * Convert an ICS file into a TO-DO object
 * @param {Generator<*, void, ?>} lineReader The ICS file
 * @returns {void} The decoded TO-DO
 */
function ICSToTODO(lineReader) {
    let line;
    while (!(line = lineReader.next()).done) {
        line = line.value;
        // Extract the ics key and it's value from the line
        const regexResult = icsKeyRegex.exec(line);

        // We ignore invalid lines
        if(regexResult === null) {
            console.warn(`ignored line ${line} while reading an ICS file`);
            continue;
        }

        let [, icsKey, value] = regexResult;
        icsKey = icsKey.trim().toUpperCase();

        if(icsKey === "END" && value === "VTODO") return;
    }

    throw new Error("ICS file is missing an \"END:VTODO\" statement");
}
// ----------------------------------------------------------- JOURNAL
/**
 * Convert an ICS file into a journal object
 * @param {Generator<*, void, ?>} lineReader The ICS file
 * @returns {void} The decoded journal
 */
function ICSToJournal(lineReader) {
    let line;
    while (!(line = lineReader.next()).done) {
        line = line.value;
        // Extract the ics key and it's value from the line
        const regexResult = icsKeyRegex.exec(line);

        // We ignore invalid lines
        if(regexResult === null) {
            console.warn(`ignored line ${line} while reading an ICS file`);
            continue;
        }

        let [, icsKey, value] = regexResult;
        icsKey = icsKey.trim().toUpperCase();

        if(icsKey === "END" && value === "VJOURNAL") return;
    }

    throw new Error("ICS file is missing an \"END:VJOURNAL\" statement");
}
// ----------------------------------------------------------- FREEBUSY
/**
 * Convert an ICS file into a free-busy object
 * @param {Generator<*, void, ?>} lineReader The ICS file
 * @returns {void} The decoded free-busy
 */
function ICSToFreeBusy(lineReader) {
    let line;
    while (!(line = lineReader.next()).done) {
        line = line.value;
        // Extract the ics key and it's value from the line
        const regexResult = icsKeyRegex.exec(line);

        // We ignore invalid lines
        if(regexResult === null) {
            console.warn(`ignored line ${line} while reading an ICS file`);
            continue;
        }

        let [, icsKey, value] = regexResult;
        icsKey = icsKey.trim().toUpperCase();

        if(icsKey === "END" && value === "VFREEBUSY") return;
    }

    throw new Error("ICS file is missing an \"END:VFREEBUSY\" statement");
}
// ----------------------------------------------------------- TIMEZONE
/**
 * Convert an ICS file into a timezone object
 * @param {Generator<*, void, ?>} lineReader The ICS file
 * @returns {void} The decoded timezone
 */
function ICSToTimezone(lineReader) {
    let line;
    while (!(line = lineReader.next()).done) {
        line = line.value;
        // Extract the ics key and it's value from the line
        const regexResult = icsKeyRegex.exec(line);

        // We ignore invalid lines
        if(regexResult === null) {
            console.warn(`ignored line ${line} while reading an ICS file`);
            continue;
        }

        let [, icsKey, value] = regexResult;
        icsKey = icsKey.trim().toUpperCase();

        if(icsKey === "END" && value === "VTIMEZONE") return;
    }

    throw new Error("ICS file is missing an \"END:VTIMEZONE\" statement");
}
// ----------------------------------------------------------- ALARM
/**
 * Convert an ICS file into an alarm object
 * @param {Generator<*, void, ?>} lineReader The ICS file
 * @returns {void} The decoded alarm
 */
function ICSToAlarm(lineReader) {
    let line;
    while (!(line = lineReader.next()).done) {
        line = line.value;
        // Extract the ics key and it's value from the line
        const regexResult = icsKeyRegex.exec(line);

        // We ignore invalid lines
        if(regexResult === null) {
            console.warn(`ignored line ${line} while reading an ICS file`);
            continue;
        }

        let [, icsKey, value] = regexResult;
        icsKey = icsKey.trim().toUpperCase();

        if(icsKey === "END" && value === "VALARM") return;
    }

    throw new Error("ICS file is missing an \"END:VALARM\" statement");
}