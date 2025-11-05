import {Calendar} from "../../domain/entities/Calendar";
import {MockCalendarDB} from "../mocks/MockCalendarDB";
import {AppointmentService} from "../../application/services/AppointmentService";
import assert from "node:assert";
import test from "node:test";
import {Appointment} from "../../domain/entities/Appointment";
import {ServiceResponse} from "../../domain/entities/ServiceResponse.ts";

const mockDB = new MockCalendarDB();
const appointmentService = new AppointmentService(mockDB);

const BASE_APPOINTMENT = {
    ownerId: "ME42",
    title: "new appointment",
    description: "a new appointment",
    startDate: new Date('2024-01-07'),
    endDate: new Date('2025-02-08'),
};

const SQL_INJECT_STRING = "' DROP TABLE *;";
const SQL_INJECT_SANITIZED_STRING = "&apos; DROP TABLE &midast;&semi;";

test.describe("createAppointment", () => {
    test("createAppointment", async () => {
        let dbResult = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );

        const appointment = await appointmentService.createAppointment(
            BASE_APPOINTMENT.ownerId,
            dbResult.id as string,
            BASE_APPOINTMENT.title,
            BASE_APPOINTMENT.description,
            BASE_APPOINTMENT.startDate,
            BASE_APPOINTMENT.endDate
        ).catch((reason) => {
            throw new Error(reason);
        });

        assert.ok(appointment.id);
        const dbAppointment = await mockDB.findAppointmentById(appointment.id);
        assert.ok(dbAppointment);

        assert.deepStrictEqual(
            {...appointment},
            {
                ...appointment,
                ...BASE_APPOINTMENT
            },
        );
        assert.deepStrictEqual(
            {...dbAppointment},
            {
                ...dbAppointment,
                ...appointment
            }
        );

        mockDB.reset();
    });
    test("createAppointment (calendar not in DB)", async () => {
        await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );

        await assert.rejects(
            appointmentService.createAppointment(
                BASE_APPOINTMENT.ownerId,
                "42",
                BASE_APPOINTMENT.title,
                BASE_APPOINTMENT.description,
                BASE_APPOINTMENT.startDate,
                BASE_APPOINTMENT.endDate
            ),
            "Creating an appointment with a non-existing calendar should throw an exception"
        );

        mockDB.reset();
    });
    test("createAppointment (wrong owner id)", async () => {
        let dbResult = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );

        await assert.rejects(
            appointmentService.createAppointment(
                "42",
                dbResult.id as string,
                BASE_APPOINTMENT.title,
                BASE_APPOINTMENT.description,
                BASE_APPOINTMENT.startDate,
                BASE_APPOINTMENT.endDate
            ),
            "Creating an appointment on the calendar of an other user should thrown an exception"
        );

        mockDB.reset();
    });
    test("createAppointment (inverted date)", async () => {
        let dbResult = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );

        const appointment = await appointmentService.createAppointment(
            BASE_APPOINTMENT.ownerId,
            dbResult.id as string,
            BASE_APPOINTMENT.title,
            BASE_APPOINTMENT.description,
            BASE_APPOINTMENT.endDate,
            BASE_APPOINTMENT.startDate
        ).catch((reason) => {
            throw new Error(reason);
        });

        assert.ok(appointment.id);
        const dbAppointment = await mockDB.findAppointmentById(appointment.id);
        assert.ok(dbAppointment);

        assert.deepStrictEqual(
            {...appointment},
            {
                ...appointment, // We check the id elsewhere and does not care about creation date
                ...BASE_APPOINTMENT,
            },
            "when endDate > startDate, swap them silently"
        );
        assert.deepStrictEqual(
            {...dbAppointment},
            {
                ...dbAppointment,
                ...appointment,
            },
            "when endDate > startDate, swap them silently"
        );

        mockDB.reset();
    });
    test("createAppointment (invalid date)", async () => {
        let dbResult = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );

        await assert.rejects(
            appointmentService.createAppointment(
                BASE_APPOINTMENT.ownerId,
                dbResult.id as string,
                BASE_APPOINTMENT.title,
                BASE_APPOINTMENT.description,
                null as unknown as Date,
                BASE_APPOINTMENT.endDate
            ),
            "NewDate does not check for null dates"
        );
        await assert.rejects(
            appointmentService.createAppointment(
                BASE_APPOINTMENT.ownerId,
                dbResult.id as string,
                BASE_APPOINTMENT.title,
                BASE_APPOINTMENT.description,
                BASE_APPOINTMENT.startDate,
                null as unknown as Date
            ),
            "EndDate does not check for null dates"
        );
        await assert.rejects(
            appointmentService.createAppointment(
                BASE_APPOINTMENT.ownerId,
                dbResult.id as string,
                BASE_APPOINTMENT.title,
                BASE_APPOINTMENT.description,
                new Date("This is not a date"),
                BASE_APPOINTMENT.endDate
            ),
            "NewDate does not check for invalid dates"
        );
        await assert.rejects(
            appointmentService.createAppointment(
                BASE_APPOINTMENT.ownerId,
                dbResult.id as string,
                BASE_APPOINTMENT.title,
                BASE_APPOINTMENT.description,
                BASE_APPOINTMENT.startDate,
                new Date("This is not a date")
            ),
            "EndDate does not check for invalid dates"
        );

        mockDB.reset();
    });
    test("createAppointment (sanitize check)", async () => {
        const dbResult = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );
        const corruptedDbResult = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", SQL_INJECT_STRING)
        );

        mockDB.calendars[SQL_INJECT_STRING] = {...dbResult, isValid: dbResult.isValid};

        await assert.rejects(
            appointmentService.createAppointment(
                SQL_INJECT_STRING,
                corruptedDbResult.id as string,
                BASE_APPOINTMENT.title,
                BASE_APPOINTMENT.description,
                BASE_APPOINTMENT.startDate,
                BASE_APPOINTMENT.endDate
            ),
            "OwnerID is not checked for safety"
        );

        await assert.rejects(
            appointmentService.createAppointment(
                BASE_APPOINTMENT.ownerId,
                SQL_INJECT_STRING,
                BASE_APPOINTMENT.title,
                BASE_APPOINTMENT.description,
                BASE_APPOINTMENT.startDate,
                BASE_APPOINTMENT.endDate
            ),
            "CalendarID is not checked for safety"
        );

        const appointment = await appointmentService.createAppointment(
            BASE_APPOINTMENT.ownerId,
            dbResult.id as string,
            SQL_INJECT_STRING + " title",
            SQL_INJECT_STRING + " description",
            BASE_APPOINTMENT.startDate,
            BASE_APPOINTMENT.endDate
        ).catch((reason) => {
            throw new Error(reason);
        });

        assert.ok(appointment.id);
        const dbAppointment = await mockDB.findAppointmentById(appointment.id);
        assert.ok(dbAppointment);

        assert.deepStrictEqual(
            {...appointment},
            {
                ...appointment,
                ...BASE_APPOINTMENT,
                title: SQL_INJECT_STRING + " title",
                description: SQL_INJECT_STRING + " description",
            },
            "Appointment returned by the API must NOT be sanitized"
        );

        assert.deepStrictEqual(
            {...dbAppointment},
            {
                ...dbAppointment,
                ...appointment,
                title: SQL_INJECT_SANITIZED_STRING + " title",
                description: SQL_INJECT_SANITIZED_STRING + " description",
            },
            "Appointment sent to DB must be sanitized"
        );

        mockDB.reset();
    });
    test("createAppointment (wrong owner)", async () => {
        const dbCalendar = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );

        await assert.rejects(
            appointmentService.createAppointment("WRONG", dbCalendar.id as string, BASE_APPOINTMENT.title, BASE_APPOINTMENT.description, BASE_APPOINTMENT.startDate, BASE_APPOINTMENT.endDate),
            "Should check if ownerID is the same as the ownerID of the calendar"
        );

        mockDB.reset();
    });
})

test.describe("deleteAppointment", () => {
    test("deleteAppointment", async () => {
        const dbCalendar = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );
        const dbAppointment = await mockDB.createAppointment(
            Appointment.create(dbCalendar.id as string, BASE_APPOINTMENT.title, BASE_APPOINTMENT.description, BASE_APPOINTMENT.startDate, BASE_APPOINTMENT.endDate, BASE_APPOINTMENT.ownerId)
        )

        const deletionResult = await appointmentService.deleteAppointment(BASE_APPOINTMENT.ownerId, dbAppointment.id as string)
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(deletionResult, ServiceResponse.SUCCESS);
        assert.deepStrictEqual(mockDB.appointments[dbAppointment.id as string], undefined);

        mockDB.reset();
    });
    test("deleteAppointment (wrong owner)", async () => {
        const dbCalendar = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );
        const dbAppointment = await mockDB.createAppointment(
            Appointment.create(dbCalendar.id as string, BASE_APPOINTMENT.title, BASE_APPOINTMENT.description, BASE_APPOINTMENT.startDate, BASE_APPOINTMENT.endDate, BASE_APPOINTMENT.ownerId)
        )

        const deletionResult = await appointmentService.deleteAppointment("42", dbAppointment.id as string)
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(deletionResult, ServiceResponse.FORBIDDEN, "If the user does not own the appointment, refuse the deletion");
        assert.deepStrictEqual(mockDB.appointments[dbAppointment.id as string], dbAppointment);

        mockDB.reset();
    });
    test("deleteAppointment (not exist)", async () => {
        const dbCalendar = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );
        const dbAppointment = await mockDB.createAppointment(
            Appointment.create(dbCalendar.id as string, BASE_APPOINTMENT.title, BASE_APPOINTMENT.description, BASE_APPOINTMENT.startDate, BASE_APPOINTMENT.endDate, BASE_APPOINTMENT.ownerId)
        )

        const deletionResult = await appointmentService.deleteAppointment(BASE_APPOINTMENT.ownerId, "42")
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(deletionResult, ServiceResponse.RESOURCE_NOT_EXIST, "The appointment does not exist, refuse the deletion");
        assert.deepStrictEqual(mockDB.appointments[dbAppointment.id as string], dbAppointment);

        mockDB.reset();
    });
    test("deleteAppointment (sanitize)", async () => {
        const dbCalendar = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );
        const dbAppointment = await mockDB.createAppointment(
            Appointment.create(dbCalendar.id as string, BASE_APPOINTMENT.title, BASE_APPOINTMENT.description, BASE_APPOINTMENT.startDate, BASE_APPOINTMENT.endDate, BASE_APPOINTMENT.ownerId)
        )

        mockDB.appointments[SQL_INJECT_STRING] = dbAppointment;

        await assert.rejects(
            appointmentService.deleteAppointment(SQL_INJECT_STRING, dbAppointment.id as string),
            "OwnerID is not checked for safety"
        );

        await assert.rejects(
            appointmentService.deleteAppointment(BASE_APPOINTMENT.ownerId, SQL_INJECT_STRING),
            "AppointmentID is not checked for safety"
        );

        assert.deepStrictEqual(mockDB.appointments[dbAppointment.id as string], dbAppointment);
        assert.deepStrictEqual(mockDB.appointments[SQL_INJECT_STRING], dbAppointment);

        mockDB.reset();
    });
})

test.describe("updateAppointment", () => {
    test("updateAppointment", async () => {
        const dbCalendar = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );

        const dbCalendar2 = await mockDB.createCalendar(
            Calendar.create("testCalendar2", "A testing calendar2", "red", BASE_APPOINTMENT.ownerId + "2")
        );

        const appointment = await mockDB.createAppointment(
            Appointment.create(dbCalendar.id as string, BASE_APPOINTMENT.title, BASE_APPOINTMENT.description, BASE_APPOINTMENT.startDate, BASE_APPOINTMENT.endDate, BASE_APPOINTMENT.ownerId)
        )

        const partialAppointment: Partial<Appointment> = {
            id: appointment.id as string,
            ownerId: appointment.ownerId as string,
            calendarId: dbCalendar2.id as string,
            title: "Modified title",
            description: "Modified description",
            startDate: new Date('2025-02-08'),
            endDate: new Date('2026-03-09'),
        }

        let updateResult = await appointmentService.updateAppointment(BASE_APPOINTMENT.ownerId, appointment.id as string, partialAppointment)
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(updateResult, ServiceResponse.SUCCESS);

        let dbAppointment = await mockDB.findAppointmentById(appointment.id as string);
        assert.ok(dbAppointment);

        assert.deepStrictEqual(
            {...dbAppointment},
            {
                ...dbAppointment,
                ...partialAppointment,
            }
        );

        updateResult = await appointmentService.updateAppointment(BASE_APPOINTMENT.ownerId, appointment.id as string, {title: "This is a new title"})
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(updateResult, ServiceResponse.SUCCESS);

        dbAppointment = await mockDB.findAppointmentById(appointment.id as string);
        assert.ok(dbAppointment);

        assert.deepStrictEqual(
            {...dbAppointment},
            {
                ...dbAppointment,
                title: "This is a new title",
            },
            "Should be able to update even without an id in the partial"
        );

        mockDB.reset();
    });
    test("updateAppointment (wrong owner id)", async () => {
        const dbCalendar = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );

        const appointment = await mockDB.createAppointment(
            Appointment.create(dbCalendar.id as string, BASE_APPOINTMENT.title, BASE_APPOINTMENT.description, BASE_APPOINTMENT.startDate, BASE_APPOINTMENT.endDate, BASE_APPOINTMENT.ownerId)
        )

        let updateResult = await appointmentService.updateAppointment("42", appointment.id as string, {title: "Modified title"})
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(updateResult, ServiceResponse.FORBIDDEN, "If the user does not own the appointment, refuse the update");
        assert.deepStrictEqual(mockDB.appointments[appointment.id as string], appointment, "If the user does not own the appointment, refuse the update");

        mockDB.reset();
    });
    test("updateAppointment (immutable owner id)", async () => {
        const dbCalendar = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );

        const appointment = await mockDB.createAppointment(
            Appointment.create(dbCalendar.id as string, BASE_APPOINTMENT.title, BASE_APPOINTMENT.description, BASE_APPOINTMENT.startDate, BASE_APPOINTMENT.endDate, BASE_APPOINTMENT.ownerId)
        )

        let updateResult = await appointmentService.updateAppointment(BASE_APPOINTMENT.ownerId, appointment.id as string, {title: "Modified title", ownerId: "42"})
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(updateResult, ServiceResponse.FORBIDDEN, "Refuse to modify the ownerID: it is immutable");
        assert.deepStrictEqual(mockDB.appointments[appointment.id as string], appointment, "Refuse to modify the ownerID: it is immutable");

        mockDB.reset();
    });
    test("updateAppointment (wrong appointment id)", async () => {
        const dbCalendar = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );

        const appointment = await mockDB.createAppointment(
            Appointment.create(dbCalendar.id as string, BASE_APPOINTMENT.title, BASE_APPOINTMENT.description, BASE_APPOINTMENT.startDate, BASE_APPOINTMENT.endDate, BASE_APPOINTMENT.ownerId)
        )

        let updateResult = await appointmentService.updateAppointment(BASE_APPOINTMENT.ownerId, "42", {title: "Modified title"})
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(updateResult, ServiceResponse.RESOURCE_NOT_EXIST, "Must check if the appointment exist");
        assert.deepStrictEqual(mockDB.appointments[appointment.id as string], appointment, "Wtf why this changed");

        mockDB.reset();
    });
    test("updateAppointment (immutable appointment id)", async () => {
        const dbCalendar = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );

        const appointment = await mockDB.createAppointment(
            Appointment.create(dbCalendar.id as string, BASE_APPOINTMENT.title, BASE_APPOINTMENT.description, BASE_APPOINTMENT.startDate, BASE_APPOINTMENT.endDate, BASE_APPOINTMENT.ownerId)
        )

        let updateResult = await appointmentService.updateAppointment(BASE_APPOINTMENT.ownerId, appointment.id as string, {title: "Modified title", id: "42"})
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(updateResult, ServiceResponse.FORBIDDEN, "Refuse to modify the appointmentID: it is immutable");
        assert.deepStrictEqual(mockDB.appointments[appointment.id as string], appointment, "Refuse to modify the appointmentID: it is immutable");

        mockDB.reset();
    });
    test("updateAppointment (sanitize)", async () => {
        const dbCalendar = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );

        const dbCalendar2 = await mockDB.createCalendar(
            Calendar.create("testCalendar2", "A testing calendar2", "red", BASE_APPOINTMENT.ownerId + "2")
        );

        const appointment = await mockDB.createAppointment(
            Appointment.create(dbCalendar.id as string, BASE_APPOINTMENT.title, BASE_APPOINTMENT.description, BASE_APPOINTMENT.startDate, BASE_APPOINTMENT.endDate, BASE_APPOINTMENT.ownerId)
        );

        mockDB.appointments[SQL_INJECT_STRING] = {...appointment, ownerId: SQL_INJECT_STRING, isValid: appointment.isValid, id: SQL_INJECT_STRING};
        mockDB.calendars[SQL_INJECT_STRING] = {...dbCalendar, id: SQL_INJECT_STRING, isValid: dbCalendar.isValid};

        await assert.rejects(
            appointmentService.updateAppointment(SQL_INJECT_STRING, appointment.id as string, {title: "This should not be in the result"}),
            "OwnerID is not checked for safety"
        );

        await assert.rejects(
            appointmentService.updateAppointment(BASE_APPOINTMENT.ownerId, SQL_INJECT_STRING as string, {title: "This should not be in the result"}),
            "AppointmentID is not checked for safety"
        );

        await assert.rejects(
            appointmentService.updateAppointment(BASE_APPOINTMENT.ownerId, appointment.id as string, {title: "This should not be in the result", calendarId: SQL_INJECT_STRING}),
            "Partial.calendarId is not checked for safety"
        );

        assert.deepStrictEqual(mockDB.appointments[appointment.id as string], appointment);
        assert.deepStrictEqual(mockDB.appointments[SQL_INJECT_STRING], {...appointment, ownerId: SQL_INJECT_STRING, isValid: appointment.isValid, id: SQL_INJECT_STRING});

        const partialAppointment: Partial<Appointment> = {
            id: appointment.id as string,
            ownerId: appointment.ownerId as string,
            calendarId: dbCalendar2.id as string,
            title: SQL_INJECT_STRING + " title",
            description: SQL_INJECT_STRING + " description",
            startDate: new Date('2025-02-08'),
            endDate: new Date('2026-03-09'),
        }

        const updateResult = await appointmentService.updateAppointment(BASE_APPOINTMENT.ownerId, appointment.id as string, partialAppointment)
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(updateResult, ServiceResponse.SUCCESS);

        const dbAppointment = await mockDB.findAppointmentById(appointment.id as string);
        assert.ok(dbAppointment);

        assert.deepStrictEqual(
            {...dbAppointment},
            {
                ...dbAppointment,
                ...partialAppointment,
                title: SQL_INJECT_SANITIZED_STRING + " title",
                description: SQL_INJECT_SANITIZED_STRING + " description",
            },
            "Title and description should be sanitized before being sent to DB"
        );

        mockDB.reset();
    });
    test("updateAppointment (calendar not exist)", async () => {
        const dbCalendar = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );

        const appointment = await mockDB.createAppointment(
            Appointment.create(dbCalendar.id as string, BASE_APPOINTMENT.title, BASE_APPOINTMENT.description, BASE_APPOINTMENT.startDate, BASE_APPOINTMENT.endDate, BASE_APPOINTMENT.ownerId)
        )

        let updateResult = await appointmentService.updateAppointment(BASE_APPOINTMENT.ownerId, appointment.id as string, {title: "Modified title", calendarId: "42"})
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(updateResult, ServiceResponse.RESOURCE_NOT_EXIST, "Refuse to modify the appointment: calendar of id 42 odes not exist");
        assert.deepStrictEqual(mockDB.appointments[appointment.id as string], appointment, "Refuse to modify the appointment: calendar of id 42 odes not exist");

        mockDB.reset();
    });
    test("updateAppointment (inverted date)", async () => {
        const dbCalendar = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );

        const dbCalendar2 = await mockDB.createCalendar(
            Calendar.create("testCalendar2", "A testing calendar2", "red", BASE_APPOINTMENT.ownerId + "2")
        );

        const appointment = await mockDB.createAppointment(
            Appointment.create(dbCalendar.id as string, BASE_APPOINTMENT.title, BASE_APPOINTMENT.description, BASE_APPOINTMENT.startDate, BASE_APPOINTMENT.endDate, BASE_APPOINTMENT.ownerId)
        )

        const partialAppointment: Partial<Appointment> = {
            id: appointment.id as string,
            ownerId: appointment.ownerId as string,
            calendarId: dbCalendar2.id as string,
            title: "Modified title",
            description: "Modified description",
            startDate: new Date('2026-03-09'),
            endDate: new Date('2025-02-08'),
        }

        let updateResult = await appointmentService.updateAppointment(BASE_APPOINTMENT.ownerId, appointment.id as string, partialAppointment)
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(updateResult, ServiceResponse.SUCCESS);

        let dbAppointment = await mockDB.findAppointmentById(appointment.id as string);
        assert.ok(dbAppointment);

        assert.deepStrictEqual(
            {...dbAppointment},
            {
                ...dbAppointment,
                ...partialAppointment,
                startDate: partialAppointment.endDate,
                endDate: partialAppointment.startDate,
            },
            "when endDate > startDate, swap them silently"
        );

        updateResult = await appointmentService.updateAppointment(BASE_APPOINTMENT.ownerId, appointment.id as string, {startDate: new Date('2027-04-10')})
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(updateResult, ServiceResponse.SUCCESS);

        dbAppointment = await mockDB.findAppointmentById(appointment.id as string);
        assert.ok(dbAppointment);

        assert.deepStrictEqual(
            {...dbAppointment},
            {
                ...dbAppointment,
                ...partialAppointment,
                startDate: new Date('2026-03-09'),
                endDate: new Date('2027-04-10'),
            },
            "when endDate > startDate, swap them silently. Even with only startDate as argument"
        );

        updateResult = await appointmentService.updateAppointment(BASE_APPOINTMENT.ownerId, appointment.id as string, {endDate: new Date('2025-02-08')})
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(updateResult, ServiceResponse.SUCCESS);

        dbAppointment = await mockDB.findAppointmentById(appointment.id as string);
        assert.ok(dbAppointment);

        assert.deepStrictEqual(
            {...dbAppointment},
            {
                ...dbAppointment,
                ...partialAppointment,
                startDate: new Date('2025-02-08'),
                endDate: new Date('2026-03-09'),
            },
            "when endDate > startDate, swap them silently. Even with only endDate as argument"
        );

        mockDB.reset();
    });
    test("updateAppointment (wrong date)", async () => {
        const dbCalendar = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );

        const appointment = await mockDB.createAppointment(
            Appointment.create(dbCalendar.id as string, BASE_APPOINTMENT.title, BASE_APPOINTMENT.description, BASE_APPOINTMENT.startDate, BASE_APPOINTMENT.endDate, BASE_APPOINTMENT.ownerId)
        )

        await assert.rejects(
            appointmentService.updateAppointment(appointment.ownerId as string, appointment.id as string, {startDate: null as unknown as Date}),
            "StartDate does not check for null dates"
        );
        await assert.rejects(
            appointmentService.updateAppointment(appointment.ownerId as string, appointment.id as string, {endDate: null as unknown as Date}),
            "EndDate does not check for null dates"
        );
        await assert.rejects(
            appointmentService.updateAppointment(appointment.ownerId as string, appointment.id as string, {startDate: new Date("ahahahah wrong startDate")}),
            "StartDate does not check for invalid dates"
        );
        await assert.rejects(
            appointmentService.updateAppointment(appointment.ownerId as string, appointment.id as string, {endDate: new Date("ahahahah wrong endDate")}),
            "EndDate does not check for invalid dates"
        );

        assert.deepStrictEqual(mockDB.appointments[appointment.id as string], appointment, "Should not modify the appointment when using a wrong date");

        mockDB.reset();
    });
    test("updateAppointment (ignore metaData)", async () => {
        const dbCalendar = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );

        const appointment = await mockDB.createAppointment(
            Appointment.create(dbCalendar.id as string, BASE_APPOINTMENT.title, BASE_APPOINTMENT.description, BASE_APPOINTMENT.startDate, BASE_APPOINTMENT.endDate, BASE_APPOINTMENT.ownerId)
        )

        const partialAppointment: any = {
            createdAt: new Date('1800-06-20'),
            updatedAt: new Date('1700-05-21'),
            updatedBy: "Gromit",
            fromage: "miam this should be ignored",
            isValid() {
                return "Banane";
            },
        }

        const updateResult = await appointmentService.updateAppointment(BASE_APPOINTMENT.ownerId, appointment.id as string, partialAppointment)
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(updateResult, ServiceResponse.SUCCESS);

        const dbAppointment = await mockDB.findAppointmentById(appointment.id as string);
        assert.ok(dbAppointment);

        assert.deepStrictEqual(
            {...dbAppointment},
            {
                ...appointment
            },
            "Fields 'createdAt', 'updatedAt' and 'updatedBy' should be ignored as well as other unknown fields"
        );

        mockDB.reset();
    });
})

test.describe("getAppointment by ID", () => {
    test("getAppointment by ID", async () => {
        const dbCalendar = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );
        const dbAppointment = await mockDB.createAppointment(
            Appointment.create(dbCalendar.id as string, BASE_APPOINTMENT.title, BASE_APPOINTMENT.description, BASE_APPOINTMENT.startDate, BASE_APPOINTMENT.endDate, BASE_APPOINTMENT.ownerId)
        )

        const getResult = await appointmentService.getAppointmentById(dbAppointment.id as string)
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(getResult, dbAppointment);
        assert.deepStrictEqual(mockDB.appointments[dbAppointment.id as string], dbAppointment);

        mockDB.reset();
    });
    test("getAppointment by ID (appointment not exist)", async () => {
        const dbCalendar = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );
        const dbAppointment = await mockDB.createAppointment(
            Appointment.create(dbCalendar.id as string, BASE_APPOINTMENT.title, BASE_APPOINTMENT.description, BASE_APPOINTMENT.startDate, BASE_APPOINTMENT.endDate, BASE_APPOINTMENT.ownerId)
        )

        const getResult = await appointmentService.getAppointmentById("42")
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(getResult, null);
        assert.deepStrictEqual(mockDB.appointments[dbAppointment.id as string], dbAppointment);

        mockDB.reset();
    });
    test("getAppointment by ID (sanitize check)", async () => {
        const dbResult = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );
        const corruptedDbResult = await mockDB.createAppointment(
            Appointment.create(dbResult.id as string,
                SQL_INJECT_SANITIZED_STRING + " title",
                SQL_INJECT_SANITIZED_STRING + " description",
                BASE_APPOINTMENT.startDate,
                BASE_APPOINTMENT.endDate,
                BASE_APPOINTMENT.ownerId,
            ),
        );

        mockDB.calendars[SQL_INJECT_STRING] = {...dbResult, isValid: dbResult.isValid};

        await assert.rejects(
            appointmentService.getAppointmentById(SQL_INJECT_STRING),
            "AppointmentID is not checked for safety"
        );

        const getResult = await appointmentService.getAppointmentById(corruptedDbResult.id as string)
            .catch((reason: any) => {
                throw new Error(reason)
            });

        assert.deepStrictEqual(getResult, {
            ...corruptedDbResult,
            title: SQL_INJECT_STRING + " title",
            description: SQL_INJECT_STRING + " description",
        }, "Appointment returned by the API must NOT be sanitized");

        mockDB.reset();
    });
});

test.describe("getAppointments by calendar ID", () => {
    test("getAppointments by calendar ID", async () => {
        const dbCalendar = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );
        const fakeDbCalendar = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );
        const dbAppointments = await Promise.all([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            .map(async (value) => {
                return await mockDB.createAppointment(
                    Appointment.create(dbCalendar.id as string, BASE_APPOINTMENT.title + value, BASE_APPOINTMENT.description + ` for nb ${value}`, new Date(`2024-01-${value}`), new Date(`2025-02-${value + 10}`), BASE_APPOINTMENT.ownerId)
                )
            }));

        await Promise.all([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            .map(async (value) => {
                return await mockDB.createAppointment(
                    Appointment.create(fakeDbCalendar.id as string, "This should not be in the result", "This should not be in the result", new Date(`2024-01-${value}`), new Date(`2025-02-${value + 10}`), BASE_APPOINTMENT.ownerId)
                )
            }));

        const getResults = await appointmentService.getAppointmentsByCalendarId(dbCalendar.id as string)
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(getResults, dbAppointments);

        mockDB.reset();
    });
    test("getAppointments by calendar ID (empty result)", async () => {
        const dbCalendar = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );
        const fakeDbCalendar = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );

        await Promise.all([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            .map(async (value) => {
                return await mockDB.createAppointment(
                    Appointment.create(fakeDbCalendar.id as string, "This should not be in the result", "This should not be in the result", new Date(`2024-01-${value}`), new Date(`2025-02-${value + 10}`), BASE_APPOINTMENT.ownerId)
                )
            }));

        const getResults = await appointmentService.getAppointmentsByCalendarId(dbCalendar.id as string)
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(getResults, []);

        mockDB.reset();
    });
    test("getAppointments by calendar ID (sanitize check)", async () => {
        const dbCalendar = await mockDB.createCalendar(
            Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
        );
        const corruptedAppointments = await Promise.all([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            .map(async (value) => {
                return await mockDB.createAppointment(
                    Appointment.create(dbCalendar.id as string, SQL_INJECT_SANITIZED_STRING + value, SQL_INJECT_SANITIZED_STRING + ` for nb ${value}`, new Date(`2024-01-${value}`), new Date(`2025-02-${value + 10}`), BASE_APPOINTMENT.ownerId)
                )
            }));

        await assert.rejects(
            appointmentService.getAppointmentsByCalendarId(SQL_INJECT_STRING),
            "CalendarID is not checked for safety"
        );

        const getResults = await appointmentService.getAppointmentsByCalendarId(dbCalendar.id as string)
            .catch((reason: any) => {
                throw new Error(reason)
            })

        assert.deepStrictEqual(getResults, corruptedAppointments.map((appointment) => {
            appointment.title = SQL_INJECT_STRING + appointment.startDate.getDate();
            appointment.description = SQL_INJECT_STRING + ` for nb ${appointment.startDate.getDate()}`;
            return appointment;
        }), "Appointments returned by the API must NOT be sanitized");

        mockDB.reset();
    });
});