import test from "node:test";
import { ICalendarDB } from "../../domain/interfaces/ICalendarDB";
import { Appointment } from "../../domain/entities/Appointment";
import { Calendar } from "../../domain/entities/Calendar";
import { MockCalendarDB } from "../mocks/MockCalendarDB";

const MockDB = new MockCalendarDB();
