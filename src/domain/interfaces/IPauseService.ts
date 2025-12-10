import { Pause } from "../entities/Pause";

export interface IPauseService {
    /**
     * Crée une nouvelle pause pour une récurrence donnée.
     * Peut fusionner automatiquement avec une pause existante si les dates se chevauchent.
     */
    createPause(
        recurrentAppointmentId: string,
        pauseStartDate: Date,
        pauseEndDate: Date
    ): Promise<Pause>;

    /**
     * Met à jour une pause existante.
     * Utilisé lorsqu'on veut étendre ou réduire une pause.
     */
    updatePause(
        pauseId: string,
        updates: Partial<Pick<Pause, "pauseStartDate" | "pauseEndDate">>
    ): Promise<void>;

    /**
     * Supprime une pause par son ID.
     */
    deletePause(
        pauseId: string
    ): Promise<boolean>;

    /**
     * Récupère une pause par son ID.
     */
    getPauseById(
        pauseId: string
    ): Promise<Pause | null>;

    /**
     * Récupère toutes les pauses liées à un rendez-vous récurrent.
     */
    getPausesByRecurrentAppointmentId(
        recurrentAppointmentId: string
    ): Promise<Pause[]>;

    /**
     * Vérifie si une date donnée tombe dans une pause.
     * Utile pour "cacher" les occurrences dans l'affichage.
     */
    isDateInPause(
        recurrentAppointmentId: string,
        date: Date
    ): Promise<boolean>;
}
