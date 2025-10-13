import {MockCalendarDB} from "../mocks/MockCalendarDB";
import assert from "node:assert";
import test from "node:test";
import {CalendarServiceResponse} from "../../domain/entities/CalendarServiceResponse";
import {CalendarService} from "../../application/services/CalendarService";
import {MockAuthDB} from "../mocks/MockAuthDB";
import {User} from "../../domain/entities/User";

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
})