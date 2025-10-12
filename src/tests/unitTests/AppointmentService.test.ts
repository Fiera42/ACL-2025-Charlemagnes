import {Calendar} from "../../domain/entities/Calendar";
import {MockCalendarDB} from "../mocks/MockCalendarDB";
import {AppointmentService} from "../../application/services/AppointmentService";
import assert from "node:assert";
import test from "node:test";
import {Appointment} from "../../domain/entities/Appointment";
import {CalendarServiceResponse} from "../../domain/entities/CalendarServiceResponse";

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

test("createAppointment", async () => {
    let bdResult = await mockDB.createCalendar(
        Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
    );

    const appointment = await appointmentService.createAppointment(
        BASE_APPOINTMENT.ownerId,
        bdResult.id as string,
        BASE_APPOINTMENT.title,
        BASE_APPOINTMENT.description,
        BASE_APPOINTMENT.startDate,
        BASE_APPOINTMENT.endDate
    ).catch((reason) => {
        throw new Error(reason);
    });

    assert.ok(appointment.id);
    const bdAppointment = await mockDB.findAppointmentById(appointment.id);
    assert.ok(bdAppointment);

    assert.deepStrictEqual(
        {...appointment},
        {
            ...appointment,
            ...BASE_APPOINTMENT
        },
    );
    assert.deepStrictEqual(
        {...bdAppointment},
        {
            ...bdAppointment,
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
    let bdResult = await mockDB.createCalendar(
        Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
    );

    await assert.rejects(
        appointmentService.createAppointment(
            "42",
            bdResult.id as string,
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
    let bdResult = await mockDB.createCalendar(
        Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
    );

    const appointment = await appointmentService.createAppointment(
        BASE_APPOINTMENT.ownerId,
        bdResult.id as string,
        BASE_APPOINTMENT.title,
        BASE_APPOINTMENT.description,
        BASE_APPOINTMENT.endDate,
        BASE_APPOINTMENT.startDate
    ).catch((reason) => {
        throw new Error(reason);
    });

    assert.ok(appointment.id);
    const bdAppointment = await mockDB.findAppointmentById(appointment.id);
    assert.ok(bdAppointment);

    assert.deepStrictEqual(
        {...appointment},
        {
            ...appointment, // We check the id elsewhere and does not care about creation date
            ...BASE_APPOINTMENT,
        },
        "when endDate > startDate, swap them silently"
    );
    assert.deepStrictEqual(
        {...bdAppointment},
        {
            ...bdAppointment,
            ...appointment,
        },
        "when endDate > startDate, swap them silently"
    );

    mockDB.reset();
});
test("createAppointment (invalid date)", async () => {
    let bdResult = await mockDB.createCalendar(
        Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
    );

    await assert.rejects(
        appointmentService.createAppointment(
            BASE_APPOINTMENT.ownerId,
            bdResult.id as string,
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
            bdResult.id as string,
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
            bdResult.id as string,
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
            bdResult.id as string,
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
    const bdResult = await mockDB.createCalendar(
        Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
    );
    const corruptedBdResult = await mockDB.createCalendar(
        Calendar.create("testCalendar", "A testing calendar", "blue", SQL_INJECT_STRING)
    );

    mockDB.calendars[SQL_INJECT_STRING] = {...bdResult, isValid: bdResult.isValid};

    await assert.rejects(
        appointmentService.createAppointment(
            SQL_INJECT_STRING,
            corruptedBdResult.id as string,
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
        bdResult.id as string,
        SQL_INJECT_STRING,
        SQL_INJECT_STRING,
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
            title: SQL_INJECT_STRING,
            description: SQL_INJECT_STRING,
        },
        "Appointment returned by the API must NOT be sanitized"
    );

    assert.deepStrictEqual(
        {...dbAppointment},
        {
            ...dbAppointment,
            ...appointment,
            title: SQL_INJECT_SANITIZED_STRING,
            description: SQL_INJECT_SANITIZED_STRING,
        },
        "Appointment sent to DB must be sanitized"
    );

    mockDB.reset();
});

test("deleteAppointment", async () => {
    const bdCalendar = await mockDB.createCalendar(
        Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
    );
    const bdAppointment = await mockDB.createAppointment(
        Appointment.create(bdCalendar.id as string, BASE_APPOINTMENT.title, BASE_APPOINTMENT.description, BASE_APPOINTMENT.startDate, BASE_APPOINTMENT.endDate, BASE_APPOINTMENT.ownerId)
    )

    const deletionResult = await appointmentService.deleteAppointment(BASE_APPOINTMENT.ownerId, bdAppointment.id as string)
        .catch((reason: any) => {
            throw new Error(reason)
        })

    assert.deepStrictEqual(deletionResult, CalendarServiceResponse.SUCCESS);
    assert.deepStrictEqual(mockDB.appointments[bdAppointment.id as string], undefined);

    mockDB.reset();
})
test("deleteAppointment (wrong owner)", async () => {
    const bdCalendar = await mockDB.createCalendar(
        Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
    );
    const bdAppointment = await mockDB.createAppointment(
        Appointment.create(bdCalendar.id as string, BASE_APPOINTMENT.title, BASE_APPOINTMENT.description, BASE_APPOINTMENT.startDate, BASE_APPOINTMENT.endDate, BASE_APPOINTMENT.ownerId)
    )

    const deletionResult = await appointmentService.deleteAppointment("42", bdAppointment.id as string)
        .catch((reason: any) => {
            throw new Error(reason)
        })

    assert.deepStrictEqual(deletionResult, CalendarServiceResponse.FORBIDDEN, "If the user does not own the appointment, refuse the deletion");
    assert.deepStrictEqual(mockDB.appointments[bdAppointment.id as string], bdAppointment);

    mockDB.reset();
})
test("deleteAppointment (not exist)", async () => {
    const bdCalendar = await mockDB.createCalendar(
        Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
    );
    const bdAppointment = await mockDB.createAppointment(
        Appointment.create(bdCalendar.id as string, BASE_APPOINTMENT.title, BASE_APPOINTMENT.description, BASE_APPOINTMENT.startDate, BASE_APPOINTMENT.endDate, BASE_APPOINTMENT.ownerId)
    )

    const deletionResult = await appointmentService.deleteAppointment(BASE_APPOINTMENT.ownerId, "42")
        .catch((reason: any) => {
            throw new Error(reason)
        })

    assert.deepStrictEqual(deletionResult, CalendarServiceResponse.RESOURCE_NOT_EXIST, "The appointment does not exist, refuse the deletion");
    assert.deepStrictEqual(mockDB.appointments[bdAppointment.id as string], bdAppointment);

    mockDB.reset();
})

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
})
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
})
test("getAppointment by ID (sanitize check)", async () => {
    const bdResult = await mockDB.createCalendar(
        Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
    );
    const corruptedBdResult = await mockDB.createAppointment(
        Appointment.create(bdResult.id as string, SQL_INJECT_SANITIZED_STRING, SQL_INJECT_SANITIZED_STRING, BASE_APPOINTMENT.startDate, BASE_APPOINTMENT.endDate, BASE_APPOINTMENT.ownerId)
    );

    mockDB.calendars[SQL_INJECT_STRING] = {...bdResult, isValid: bdResult.isValid};

    await assert.rejects(
        appointmentService.getAppointmentById(SQL_INJECT_STRING),
        "AppointmentID is not checked for safety"
    );

    const getResult = await appointmentService.getAppointmentById(corruptedBdResult.id as string)
        .catch((reason: any) => {
            throw new Error(reason)
        });

    assert.deepStrictEqual(getResult, {
        ...corruptedBdResult,
        title: SQL_INJECT_STRING,
        description: SQL_INJECT_STRING,
    }, "Appointment returned by the API must NOT be sanitized");

    mockDB.reset();
})

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
})
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
})
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
})