import { Pause } from "../../domain/entities/Pause";
import { IPauseService } from "../../domain/interfaces/IPauseService";
import { IPauseDB } from "../../domain/interfaces/IPauseDB";
import { Sanitizer } from "./utils/Sanitizer";

export class PauseService implements IPauseService {
    constructor(private pauseDB: IPauseDB) {}

    async createPause(
        recurrentAppointmentId: string,
        pauseStartDate: Date,
        pauseEndDate: Date
    ): Promise<Pause> {

        this.validateDates(pauseStartDate, pauseEndDate);

        const existingPauses =
            await this.pauseDB.findPausesByRecurrentAppointmentId(recurrentAppointmentId);

        // 1. MERGE
        const { start, end, overlappedIds } =
            this.mergeAndDetect(existingPauses, pauseStartDate, pauseEndDate);

        // 2. SUPPRIMER LES ANCIENNES
        for (const id of overlappedIds) {
            await this.pauseDB.deletePause(id);
        }

        // 3. CRÉER LA NOUVELLE PAUSE
        const pause = Pause.create(recurrentAppointmentId, start, end);

        const created = await this.pauseDB.createPause(pause);

        return created;
    }


    async updatePause(
        pauseId: string,
        updates: Partial<Pick<Pause, "pauseStartDate" | "pauseEndDate">>
    ): Promise<void> {

        const pause = await this.pauseDB.findPauseById(pauseId);
        if (!pause) throw new Error(`Pause ${pauseId} not found`);

        if (updates.pauseStartDate && updates.pauseEndDate) {
            this.validateDates(updates.pauseStartDate, updates.pauseEndDate);
        }

        // Appliquer les mises à jour
        pause.pauseEndDate = updates.pauseEndDate || pause.pauseEndDate;
        pause.pauseStartDate = updates.pauseStartDate || pause.pauseStartDate;

        // Mise à jour
        await this.pauseDB.update(pause);
    }

    async deletePause(pauseId: string): Promise<boolean> {

        const pause = await this.pauseDB.findPauseById(pauseId);
        if (!pause) throw new Error(`Pause ${pauseId} not found`);

        return await this.pauseDB.deletePause(pauseId);
    }

    async getPauseById(pauseId: string): Promise<Pause | null> {
        return await this.pauseDB.findPauseById(pauseId);
    }

    async getPausesByRecurrentAppointmentId(
        recurrentAppointmentId: string
    ): Promise<Pause[]> {
        return await this.pauseDB.findPausesByRecurrentAppointmentId(recurrentAppointmentId);
    }

    async isDateInPause(
        recurrentAppointmentId: string,
        date: Date
    ): Promise<boolean> {
        const pauses = await this.pauseDB.findPausesByRecurrentAppointmentId(recurrentAppointmentId);

        return pauses.some(p => {
            const start = new Date(p.pauseStartDate);
            const end = new Date(p.pauseEndDate);

            return date >= start && date <= end;
        });
    }

    private validateDates(start: Date, end: Date) {
        if (!(start instanceof Date) || isNaN(start.getTime()))
            throw new Error("Invalid pauseStartDate");

        if (!(end instanceof Date) || isNaN(end.getTime()))
            throw new Error("Invalid pauseEndDate");

        if (end <= start)
            throw new Error("pauseEndDate must be after pauseStartDate");
    }

    private mergeAndDetect(
        existing: Pause[],
        start: Date,
        end: Date
    ): { start: Date, end: Date, overlappedIds: string[] } {

        let mergedStart = start;
        let mergedEnd = end;
        const toDelete: string[] = [];

        for (const p of existing) {
            const pStart = new Date(p.pauseStartDate);
            const pEnd = new Date(p.pauseEndDate);

            const overlap =
                (mergedStart >= pStart && mergedStart <= pEnd) ||
                (mergedEnd >= pStart && mergedEnd <= pEnd) ||
                (mergedStart <= pStart && mergedEnd >= pEnd);

            if (overlap) {
                toDelete.push(p.id); // on va la remplacer par la pause fusionnée
                mergedStart = new Date(Math.min(mergedStart.getTime(), pStart.getTime()));
                mergedEnd = new Date(Math.max(mergedEnd.getTime(), pEnd.getTime()));
            }
        }

        return { start: mergedStart, end: mergedEnd, overlappedIds: toDelete };
    }

}
