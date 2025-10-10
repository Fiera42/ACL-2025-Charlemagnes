import {Calendar} from "../../domain/entities/Calendar";
import {MockCalendarDB} from "../mocks/MockCalendarDB";
import {AppointmentService} from "../../application/services/AppointmentService";
import assert from "node:assert";
import test from "node:test";

const mockDB = new MockCalendarDB();
const appointmentService = new AppointmentService(mockDB);

mockDB.createCalendar(
    new Calendar("CAL_1", "testCalendar", "A testing calendar", "blue", "ME_42")
);

const BASE_APPOINTMENT = {
    ownerId: "ME_42",
    calendarId: "CAL_1",
    title: "new appointment",
    description: "a new appointment",
    startDate: new Date(1),
    endDate: new Date(2),
};

test("createAppointment", async () => {
    const appointment = await appointmentService.createAppointment(
        BASE_APPOINTMENT.ownerId,
        BASE_APPOINTMENT.calendarId,
        BASE_APPOINTMENT.title,
        BASE_APPOINTMENT.description,
        BASE_APPOINTMENT.startDate,
        BASE_APPOINTMENT.endDate
    );

    assert.deepStrictEqual(
        {...appointment, id: undefined},
        {...BASE_APPOINTMENT, id: undefined}
    );

    assert.ok(appointment.id);
    const other = mockDB.appointments[appointment.id];
    assert.ok(other);
    assert.deepStrictEqual(
        {...other, id: undefined},
        {...BASE_APPOINTMENT, id: undefined}
    );
    assert.strictEqual(appointment.id, other.id);
});
