import {MockCalendarDB} from "../mocks/MockCalendarDB";
import assert from "node:assert";
import test from "node:test";
import {ServiceResponse} from "../../domain/entities/ServiceResponse.ts";
import {CalendarService} from "../../application/services/CalendarService";
import {MockAuthDB} from "../mocks/MockAuthDB";
import {User} from "../../domain/entities/User";
import {Calendar} from "../../domain/entities/Calendar";

const mockCalendarDB = new MockCalendarDB();
const mockAuthDB = new MockAuthDB();
const calendarService = new CalendarService(mockCalendarDB, mockAuthDB);

const BASE_CALENDAR = {
    ownerId: "ME42",
    name: "new calendar",
    description: "a new calendar",
    color: "red",
};

const SQL_INJECT_STRING = "' DROP TABLE *;";
const SQL_INJECT_SANITIZED_STRING = "&apos; DROP TABLE &midast;&semi;";

test.describe("createCalendar", () => {
    test("createCalendar", async () => {
        mockAuthDB.users[BASE_CALENDAR.ownerId] = new User(BASE_CALENDAR.ownerId, "", "", "");

        const calendar = await calendarService.createCalendar(
            BASE_CALENDAR.ownerId,
            BASE_CALENDAR.name,
            BASE_CALENDAR.description,
            BASE_CALENDAR.color,
        ).catch((reason) => {
            throw new Error(reason);
        });

        assert.ok(calendar.id);
        const bdAppointment = await mockCalendarDB.findCalendarById(calendar.id)
        assert.ok(bdAppointment);

        assert.deepStrictEqual(
            {...calendar},
            {
                ...calendar,
                ...BASE_CALENDAR
            },
        );
        assert.deepStrictEqual(
            {...bdAppointment},
            {
                ...bdAppointment,
                ...calendar
            }
        );

        mockCalendarDB.reset();
        mockAuthDB.reset();
    });
    test("createCalendar (owner not in DB)", async () => {
        await assert.rejects(
            calendarService.createCalendar(
                BASE_CALENDAR.ownerId,
                BASE_CALENDAR.name,
                BASE_CALENDAR.description,
                BASE_CALENDAR.color,
            ),
            "Creating a calendar with a non-existing userID should throw an exception"
        );

        mockCalendarDB.reset();
        mockAuthDB.reset();
    });
    test("createCalendar (sanitize check)", async () => {
        mockAuthDB.users[BASE_CALENDAR.ownerId] = new User(BASE_CALENDAR.ownerId, "normal", "normal@normal.com", "123normal");
        mockAuthDB.users[SQL_INJECT_STRING] = new User(SQL_INJECT_STRING, "normal", "normal@normal.com", "123normal");

        await assert.rejects(
            calendarService.createCalendar(
                SQL_INJECT_STRING,
                BASE_CALENDAR.name,
                BASE_CALENDAR.description,
                BASE_CALENDAR.color,
            ),
            "OwnerID is not checked for safety"
        );

        const calendar = await calendarService.createCalendar(
            BASE_CALENDAR.ownerId,
            SQL_INJECT_STRING + " name",
            SQL_INJECT_STRING + " description",
            SQL_INJECT_STRING + " color",
        ).catch((reason) => {
            throw new Error(reason);
        });

        assert.ok(calendar.id);
        const dbCalendar = await mockCalendarDB.findCalendarById(calendar.id);
        assert.ok(dbCalendar);

        assert.deepStrictEqual(
            {...calendar},
            {
                ...calendar,
                ...BASE_CALENDAR,
                name: SQL_INJECT_STRING + " name",
                description: SQL_INJECT_STRING + " description",
                color: SQL_INJECT_STRING + " color"
            },
            "Calendar returned by the API must NOT be sanitized"
        );

        assert.deepStrictEqual(
            {...dbCalendar},
            {
                ...dbCalendar,
                ...calendar,
                name: SQL_INJECT_SANITIZED_STRING + " name",
                description: SQL_INJECT_SANITIZED_STRING + " description",
                color: SQL_INJECT_SANITIZED_STRING + " color",
            },
            "Calendar sent to DB must be sanitized"
        );

        mockCalendarDB.reset();
        mockAuthDB.reset();
    });
});

test.describe("deleteCalendar", () => {
    test("deleteCalendar", async () => {
        const dbCalendar = await mockCalendarDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_CALENDAR.ownerId)
        );

        const deletionResult = await calendarService.deleteCalendar(BASE_CALENDAR.ownerId, dbCalendar.id as string)
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(deletionResult, ServiceResponse.SUCCESS);
        assert.deepStrictEqual(mockCalendarDB.calendars[dbCalendar.id as string], undefined);

        mockCalendarDB.reset();
        mockAuthDB.reset();
    });
    test("deleteCalendar (wrong owner)", async () => {
        const dbCalendar = await mockCalendarDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_CALENDAR.ownerId)
        );

        const deletionResult = await calendarService.deleteCalendar("42", dbCalendar.id as string)
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(deletionResult, ServiceResponse.FORBIDDEN, "If the user does not own the calendar, refuse the deletion");
        assert.deepStrictEqual(mockCalendarDB.calendars[dbCalendar.id as string], dbCalendar);

        mockCalendarDB.reset();
        mockAuthDB.reset();
    });
    test("deleteCalendar (not exist)", async () => {
        const dbCalendar = await mockCalendarDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_CALENDAR.ownerId)
        );

        const deletionResult = await calendarService.deleteCalendar(BASE_CALENDAR.ownerId, "42")
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(deletionResult, ServiceResponse.RESOURCE_NOT_EXIST, "The calendar does not exist, refuse the deletion");
        assert.deepStrictEqual(mockCalendarDB.calendars[dbCalendar.id as string], dbCalendar);

        mockCalendarDB.reset();
        mockAuthDB.reset();
    });
    test("deleteCalendar (sanitize)", async () => {
        const dbCalendar = await mockCalendarDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", SQL_INJECT_STRING)
        );

        mockCalendarDB.calendars[SQL_INJECT_STRING] = {...dbCalendar, ownerId: BASE_CALENDAR.ownerId, isValid: dbCalendar.isValid};

        await assert.rejects(
            calendarService.deleteCalendar(SQL_INJECT_STRING, dbCalendar.id as string),
            "OwnerID is not checked for safety"
        );

        await assert.rejects(
            calendarService.deleteCalendar(BASE_CALENDAR.ownerId, SQL_INJECT_STRING),
            "CalendarID is not checked for safety"
        );

        assert.deepStrictEqual(mockCalendarDB.calendars[dbCalendar.id as string], dbCalendar);
        assert.deepStrictEqual(mockCalendarDB.calendars[SQL_INJECT_STRING], {...dbCalendar, ownerId: BASE_CALENDAR.ownerId, isValid: dbCalendar.isValid});

        mockCalendarDB.reset();
        mockAuthDB.reset();
    });
});

test.describe("updateCalendar", () => {
    test("updateCalendar", async () => {
        const calendar = await mockCalendarDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_CALENDAR.ownerId)
        );

        const partialCalendar: Partial<Calendar> = {
            id: calendar.id as string,
            name: "Changed name",
            description: "changed description",
            color: "changed color",
            ownerId: calendar.ownerId as string,
        };

        const updateResult = await calendarService.updateCalendar(calendar.ownerId, calendar.id as string, partialCalendar)
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(updateResult, ServiceResponse.SUCCESS);

        const dbCalendar = await mockCalendarDB.findCalendarById(calendar.id as string);
        assert.ok(dbCalendar);

        assert.deepStrictEqual(
            {...dbCalendar},
            {
                ...dbCalendar,
                ...partialCalendar,
            }
        );

        mockCalendarDB.reset();
        mockAuthDB.reset();
    });
    test("updateCalendar (wrong owner id)", async () => {
        const calendar = await mockCalendarDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_CALENDAR.ownerId)
        );

        const updateResult = await calendarService.updateCalendar("42", calendar.id as string, {name: "This should not be here"})
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(updateResult, ServiceResponse.FORBIDDEN, "If the user does not own the calendar, refuse the update");
        assert.deepStrictEqual(mockCalendarDB.calendars[calendar.id as string], calendar, "If the user does not own the calendar, refuse the update");

        mockCalendarDB.reset();
        mockAuthDB.reset();
    });
    test("updateCalendar (immutable owner id)", async () => {
        const calendar = await mockCalendarDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_CALENDAR.ownerId)
        );

        const updateResult = await calendarService.updateCalendar(BASE_CALENDAR.ownerId, calendar.id as string, {name: "This should not be here", ownerId: "42"})
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(updateResult, ServiceResponse.FORBIDDEN, "Refuse to modify the ownerID: it is immutable");
        assert.deepStrictEqual(mockCalendarDB.calendars[calendar.id as string], calendar, "Refuse to modify the ownerID: it is immutable");

        mockCalendarDB.reset();
        mockAuthDB.reset();
    });
    test("updateCalendar (wrong calendar id)", async () => {
        const calendar = await mockCalendarDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_CALENDAR.ownerId)
        );

        const updateResult = await calendarService.updateCalendar(BASE_CALENDAR.ownerId, "42", {name: "This should not be here"})
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(updateResult, ServiceResponse.RESOURCE_NOT_EXIST, "Must check if the calendar exist");
        assert.deepStrictEqual(mockCalendarDB.calendars[calendar.id as string], calendar, "Wtf why this changed");

        mockCalendarDB.reset();
        mockAuthDB.reset();
    });
    test("updateCalendar (immutable calendar id)", async () => {
        const calendar = await mockCalendarDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_CALENDAR.ownerId)
        );

        const updateResult = await calendarService.updateCalendar(BASE_CALENDAR.ownerId, calendar.id as string, {name: "This should not be here", id: "42"})
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(updateResult, ServiceResponse.FORBIDDEN, "Refuse to modify the ID: it is immutable");
        assert.deepStrictEqual(mockCalendarDB.calendars[calendar.id as string], calendar, "Refuse to modify the ID: it is immutable");

        mockCalendarDB.reset();
        mockAuthDB.reset();
    });
    test("updateCalendar (sanitize)", async () => {
        const calendar = await mockCalendarDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_CALENDAR.ownerId)
        );

        mockCalendarDB.calendars[SQL_INJECT_STRING] = {...calendar, id: SQL_INJECT_STRING, isValid: calendar.isValid};

        await assert.rejects(
            calendarService.updateCalendar(SQL_INJECT_STRING, calendar.id as string, {name: "This should not be in the result"}),
            "OwnerID is not checked for safety"
        );

        await assert.rejects(
            calendarService.updateCalendar(BASE_CALENDAR.ownerId, SQL_INJECT_STRING as string, {name: "This should not be in the result"}),
            "AppointmentID is not checked for safety"
        );

        assert.deepStrictEqual(mockCalendarDB.calendars[calendar.id as string], calendar);
        assert.deepStrictEqual(mockCalendarDB.calendars[SQL_INJECT_STRING], {...calendar, isValid: calendar.isValid, id: SQL_INJECT_STRING});

        const partialCalendar: Partial<Calendar> = {
            id: calendar.id as string,
            name: SQL_INJECT_STRING + " name",
            description: SQL_INJECT_STRING + " description",
            color: SQL_INJECT_STRING + " color",
            ownerId: calendar.ownerId as string,
        };

        const updateResult = await calendarService.updateCalendar(calendar.ownerId, calendar.id as string, partialCalendar)
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(updateResult, ServiceResponse.SUCCESS);

        const dbCalendar = await mockCalendarDB.findCalendarById(calendar.id as string);
        assert.ok(dbCalendar);

        assert.deepStrictEqual(
            {...dbCalendar},
            {
                ...dbCalendar,
                ...partialCalendar,
                name: SQL_INJECT_SANITIZED_STRING + " name",
                description: SQL_INJECT_SANITIZED_STRING + " description",
                color: SQL_INJECT_SANITIZED_STRING + " color",
            },
            "Name, description and color should be sanitized before being sent to DB"
        );

        mockCalendarDB.reset();
        mockAuthDB.reset();
    });
    test("updateCalendar (ignore metaData)", async () => {
        const calendar = await mockCalendarDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_CALENDAR.ownerId)
        );

        const partialCalendar: any = {
            createdAt: new Date('1800-06-20'),
            updatedAt: new Date('1700-05-21'),
            updatedBy: "Gromit",
            fromage: "miam this should be ignored",
            isValid() {
                return "Banane";
            },
        }

        const updateResult = await calendarService.updateCalendar(calendar.ownerId, calendar.id as string, partialCalendar)
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(updateResult, ServiceResponse.SUCCESS);

        const dbCalendar = await mockCalendarDB.findCalendarById(calendar.id as string);
        assert.ok(dbCalendar);

        assert.deepStrictEqual(
            {...dbCalendar},
            {
                ...calendar
            },
            "Fields 'createdAt', 'updatedAt' and 'updatedBy' should be ignored as well as other unknown fields"
        );

        mockCalendarDB.reset();
        mockAuthDB.reset();
    });
})

test.describe("getCalendar by ID", () => {
    test("getCalendar by ID", async () => {
        const dbCalendar = await mockCalendarDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_CALENDAR.ownerId)
        );

        const getResult = await calendarService.getCalendarById(dbCalendar.id as string)
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(getResult, dbCalendar);
        assert.deepStrictEqual(mockCalendarDB.calendars[dbCalendar.id as string], dbCalendar);

        mockCalendarDB.reset();
        mockAuthDB.reset();
    });
    test("getCalendar by ID (calendar not exist)", async () => {
        const dbCalendar = await mockCalendarDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_CALENDAR.ownerId)
        );

        const getResult = await calendarService.getCalendarById("42")
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(getResult, null);
        assert.deepStrictEqual(mockCalendarDB.calendars[dbCalendar.id as string], dbCalendar);

        mockCalendarDB.reset();
        mockAuthDB.reset();
    });
    test("getCalendar by ID (sanitize check)", async () => {
        const dbCalendar = await mockCalendarDB.createCalendar(
            Calendar.create(SQL_INJECT_SANITIZED_STRING + " name", SQL_INJECT_SANITIZED_STRING + " description", SQL_INJECT_SANITIZED_STRING + " color", BASE_CALENDAR.ownerId)
        );

        mockCalendarDB.calendars[SQL_INJECT_STRING] = {...dbCalendar, isValid: dbCalendar.isValid, id: SQL_INJECT_STRING};

        await assert.rejects(
            calendarService.getCalendarById(SQL_INJECT_STRING),
            "AppointmentID is not checked for safety"
        );

        assert.deepStrictEqual(mockCalendarDB.calendars[SQL_INJECT_STRING], {...dbCalendar, isValid: dbCalendar.isValid, id: SQL_INJECT_STRING}, "why this changed");

        const getResult = await calendarService.getCalendarById(dbCalendar.id as string)
            .catch((reason: any) => {
                throw new Error(reason)
            });

        assert.deepStrictEqual(getResult, {
            ...dbCalendar,
            name: SQL_INJECT_STRING + " name",
            description: SQL_INJECT_STRING + " description",
            color: SQL_INJECT_STRING + " color"
        }, "Appointment returned by the API must NOT be sanitized");
        assert.deepStrictEqual(mockCalendarDB.calendars[dbCalendar.id as string], dbCalendar);

        mockCalendarDB.reset();
        mockAuthDB.reset();
    });
});

test.describe("getCalendars by owner ID", () => {
    test("getCalendars by owner ID", async () => {
        const calendars = await Promise.all([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            .map(async (value) => {
                return await mockCalendarDB.createCalendar(
                    Calendar.create(BASE_CALENDAR.name + value, BASE_CALENDAR.description + ` for nb ${value}`, BASE_CALENDAR.color + ` is the color ${value}`, BASE_CALENDAR.ownerId)
                );
            }));

        await mockCalendarDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", "42")
        );

        const getResults = await calendarService.getCalendarsByOwnerId(BASE_CALENDAR.ownerId)
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(getResults, calendars);

        mockCalendarDB.reset();
        mockAuthDB.reset();
    });
    test("getCalendars by owner ID (empty result)", async () => {
        const calendars = await Promise.all([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            .map(async (value) => {
                return await mockCalendarDB.createCalendar(
                    Calendar.create(BASE_CALENDAR.name + value, BASE_CALENDAR.description + ` for nb ${value}`, BASE_CALENDAR.color + ` is the color ${value}`, BASE_CALENDAR.ownerId)
                );
            }));

        await mockCalendarDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", "42")
        );

        const getResults = await calendarService.getCalendarsByOwnerId("12")
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(getResults, []);

        mockCalendarDB.reset();
        mockAuthDB.reset();
    });
    test("getCalendars by owner ID (sanitize check)", async () => {
        const calendars = await Promise.all([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            .map(async (value) => {
                return await mockCalendarDB.createCalendar(
                    Calendar.create(SQL_INJECT_SANITIZED_STRING + " name", SQL_INJECT_SANITIZED_STRING + " description", SQL_INJECT_SANITIZED_STRING + " color", BASE_CALENDAR.ownerId)
                );
            }));

        await mockCalendarDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", "42")
        );

        await assert.rejects(
            calendarService.getCalendarsByOwnerId(SQL_INJECT_STRING),
            "CalendarID is not checked for safety"
        );

        const getResults = await calendarService.getCalendarsByOwnerId(BASE_CALENDAR.ownerId)
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(getResults, calendars.map((calendar) => {
            calendar.name = SQL_INJECT_STRING + " name";
            calendar.description = SQL_INJECT_STRING + " description";
            calendar.color = SQL_INJECT_STRING + " color";
            return calendar;
        }), "Appointments returned by the API must NOT be sanitized");

        mockCalendarDB.reset();
        mockAuthDB.reset();
    });
});