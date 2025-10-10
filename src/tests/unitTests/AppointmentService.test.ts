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
    const bdAppointment = mockDB.appointments[appointment.id];
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
    let bdResult = await mockDB.createCalendar(
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
    const bdAppointment = mockDB.appointments[appointment.id];
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

test("deleteAppointment", async () => {
    const bdCalendar = await mockDB.createCalendar(
        Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
    );
    const bdAppointment = await mockDB.createAppointment(
        Appointment.create(bdCalendar.id as string, BASE_APPOINTMENT.title, BASE_APPOINTMENT.description, BASE_APPOINTMENT.startDate, BASE_APPOINTMENT.endDate, BASE_APPOINTMENT.ownerId)
    )

    const deletionResult = await appointmentService.deleteAppointment(BASE_APPOINTMENT.ownerId, bdAppointment.id as string)
        .catch((reason: any) => {throw new Error(reason)})

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
        .catch((reason: any) => {throw new Error(reason)})

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
        .catch((reason: any) => {throw new Error(reason)})

    assert.deepStrictEqual(deletionResult, CalendarServiceResponse.RESOURCE_NOT_EXIST, "The appointment does not exist, refuse the deletion");
    assert.deepStrictEqual(mockDB.appointments[bdAppointment.id as string], bdAppointment);

    mockDB.reset();
})

test("fromage", async () => {
    await mockDB.createCalendar(
        Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
    );
    await mockDB.createCalendar(
        Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
    );
    await mockDB.createCalendar(
        Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
    );
    await mockDB.createCalendar(
        Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
    );
    await mockDB.createCalendar(
        Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
    );
    await mockDB.createCalendar(
        Calendar.create("testCalendar", "A testing calendar", "blue", BASE_APPOINTMENT.ownerId)
    );

    console.log(await mockDB.findCalendarsByOwnerId(BASE_APPOINTMENT.ownerId));
})