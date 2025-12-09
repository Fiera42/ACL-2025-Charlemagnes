// domain/interfaces/IPauseDB.ts
import { Pause } from "../entities/Pause";

export interface IPauseDB {
    createPause(pause: Pause): Promise<Pause>;
    findPauseById(id: string): Promise<Pause | null>;
    findPausesByRecurrentAppointmentId(recurrentAppointmentId: string): Promise<Pause[]>;
    update(pause: Pause): Promise<void>;
    deletePause(id: string): Promise<boolean>;
}
