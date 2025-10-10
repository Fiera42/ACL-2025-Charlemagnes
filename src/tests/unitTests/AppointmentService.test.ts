import {Calendar} from "../../domain/entities/Calendar";
import {MockCalendarDB} from "../mocks/MockCalendarDB";
import {AppointmentService} from "../../application/services/AppointmentService";
import assert from "node:assert";
import test from "node:test";

const mockDB = new MockCalendarDB();
const appointmentService = new AppointmentService(mockDB);

const BASE_APPOINTMENT = {
    ownerId: "ME42",
    title: "new appointment",
    description: "a new appointment",
    startDate: new Date(1),
    endDate: new Date(2),
};

test("createAppointment", async () => {
    let bdResult = await mockDB.createCalendar(
        Calendar.create("testCalendar", "A testing calendar", "blue", "ME42")
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

    assert.deepStrictEqual(
        {...appointment},
        {
            ...BASE_APPOINTMENT,
            ...appointment
        },
    );

    assert.ok(appointment.id);
    const other = mockDB.appointments[appointment.id];
    assert.ok(other);
    assert.deepStrictEqual(
        {...other},
        {
            ...BASE_APPOINTMENT,
            ...other
        }
    );
    assert.strictEqual(appointment.id, other.id);
});
