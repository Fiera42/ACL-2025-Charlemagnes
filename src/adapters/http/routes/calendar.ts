import express, { Response, Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { ServiceFactory } from '../../factories/ServiceFactory';

const router: Router = express.Router();
const calendarService = ServiceFactory.getCalendarService();
const appointmentService = ServiceFactory.getAppointmentService();

const OwnerID = "1" ;//req.user!.userId

// Routes pour les calendriers
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const calendars = await calendarService.getCalendarsByOwnerId(OwnerID);
        res.json({ calendars });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des calendriers' });
    }
});

router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { name, description, color } = req.body;
        const calendar = await calendarService.createCalendar(OwnerID, name, description, color);
        res.status(201).json(calendar);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la création du calendrier' });
    }
});

router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const calendar = await calendarService.getCalendarById(req.params.id);
        if (!calendar) {
            return res.status(404).json({ error: 'Calendrier non trouvé' });
        }
        res.json(calendar);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération du calendrier' });
    }
});

router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const response = await calendarService.updateCalendar(OwnerID, req.params.id, req.body);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour du calendrier' });
    }
});

router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const response = await calendarService.deleteCalendar(OwnerID, req.params.id);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la suppression du calendrier' });
    }
});

router.post('/:id/share', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { sharedToId } = req.body;
        const response = await calendarService.shareCalendar(req.user!.userId, req.params.id, sharedToId);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors du partage du calendrier' });
    }
});

router.delete('/:id/share/:sharedToId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const response = await calendarService.unShareCalendar(req.user!.userId, req.params.id, req.params.sharedToId);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de l\'arrêt du partage' });
    }
});

// Routes pour les rendez-vous d'un calendrier
router.get('/:calendarId/appointments', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const appointments = await appointmentService.getAppointmentsByCalendarId(req.params.calendarId);
        res.json({ appointments });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des rendez-vous' });
    }
});

router.post('/:calendarId/appointments', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { title, description, startDate, endDate, recursionRule } = req.body;
        let appointment;

        if (recursionRule) {
            appointment = await appointmentService.createRecurrentAppointment(
                //req.user!.userId,
                "1",
                //req.params.calendarId,
                "1",
                title,
                description,
                new Date(startDate),
                new Date(endDate),
                recursionRule
            );
        } else {
            appointment = await appointmentService.createAppointment(
                //req.user!.userId,
                "1",
                //req.params.calendarId,
                "1",
                title,
                description,
                new Date(startDate),
                new Date(endDate)
            );
        }

        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la création du rendez-vous' });
    }
});

// Routes pour les rendez-vous individuels
router.get('/appointments/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const appointment = await appointmentService.getAppointmentById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ error: 'Rendez-vous non trouvé' });
        }
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération du rendez-vous' });
    }
});

router.put('/appointments/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { title, description, startDate, endDate, recursionRule } = req.body;
        const appointmentId = req.params.id;

        const start = new Date(startDate);
        const end = new Date(endDate);

        let updatedAppointment;

        if (recursionRule) {
            updatedAppointment = await appointmentService.updateRecurrentAppointment(
                "1",
                appointmentId,
                {
                    title,
                    description,
                    startDate: start,
                    endDate: end,
                    recursionRule
                }
            );
        } else {
            updatedAppointment = await appointmentService.updateAppointment(
                "1",            // userId
                appointmentId,
                {
                    title,
                    description,
                    startDate: start,
                    endDate: end
                }
            );
        }

        res.json(updatedAppointment);

    } catch (error) {
        console.error("Erreur PUT /appointments/:id :", error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du rendez-vous' });
    }
});

router.delete('/appointments/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        //const response = await appointmentService.deleteAppointment(req.user!.userId, req.params.id);
        const response = await appointmentService.deleteAppointment("1", req.params.id);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la suppression du rendez-vous' });
    }
});

router.post('/appointments/:id/share', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { sharedToId } = req.body;
        const response = await appointmentService.shareAppointment(req.user!.userId, req.params.id, sharedToId);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors du partage du rendez-vous' });
    }
});

router.delete('/appointments/:id/share/:sharedToId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const response = await appointmentService.unShareAppointment(req.user!.userId, req.params.id, req.params.sharedToId);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de l\'arrêt du partage' });
    }
});

// Routes pour les conflits
router.get('/conflicts/user', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const conflicts = await appointmentService.getConflictsOfUser(req.user!.userId);
        res.json({ conflicts });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des conflits' });
    }
});

router.get('/conflicts/:calendarId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const conflicts = await appointmentService.getConflictsOfCalendar(req.params.calendarId);
        res.json({ conflicts });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des conflits' });
    }
});

export default router;
