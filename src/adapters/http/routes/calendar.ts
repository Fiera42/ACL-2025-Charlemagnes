import express, { Response, Router, Request } from 'express'; // Ajout de Request
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { ServiceFactory } from '../../factories/ServiceFactory';

const router: Router = express.Router();
const calendarService = ServiceFactory.getCalendarService();
const appointmentService = ServiceFactory.getAppointmentService();

// ==========================================
// ROUTES CALENDRIERS
// ==========================================

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const calendars = await calendarService.getCalendarsByOwnerId(req.user!.userId);
        res.json({ calendars });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des calendriers' });
    }
});

router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { name, description, color, url, updateRule } = req.body;
        const calendar = await calendarService.createCalendar(req.user!.userId, name, description, color, url, updateRule);
        res.status(201).json(calendar);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la création du calendrier' });
    }
});

// --- IMPORT / EXPORT ---
router.post('/import-content', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { icsContent, calendarName } = req.body;

        if (!icsContent) {
            return res.status(400).json({ error: 'Le contenu ICS est requis' });
        }
        
        // On appelle la méthode du service avec le contenu brut
        const result = await calendarService.importCalendarFromICS(
            req.user!.userId, 
            icsContent,
            null,
            null,
        );
        
        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de l\'import du fichier ICS' });
    }
});

router.post('/import-url', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { url, autoUpdate, updateRule } = req.body;
        
        const result = await calendarService.importCalendarFromUrl(
            req.user!.userId, 
            url, 
            autoUpdate,
            updateRule
        );
        
        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de l\'import du calendrier depuis l\'URL' });
    }
});

router.get('/:id/export.ics', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const icsContent = await calendarService.exportICSCalendar(req.params.id);
        const calendar = await calendarService.getCalendarById(req.params.id);
        
        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', `attachment; filename="${calendar?.name || 'calendar'}.ics"`);
        res.send(icsContent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de l\'export du calendrier' });
    }
});

// --- PARTAGE PUBLIC (iCal Subscription) ---

router.post('/:id/public-link', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const relativeUrl = await calendarService.getPublicLink(req.user!.userId, req.params.id);

        const fullUrl = `${req.protocol}://${req.get('host')}${relativeUrl}`;
        
        res.json({ url: fullUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la génération du lien public' });
    }
});

router.get('/public/:token.ics', async (req: Request, res: Response) => {
    try {
        const icsContent = await calendarService.exportPublicICSCalendar(req.params.token);
        
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', 'inline; filename="calendar.ics"');
        res.status(200).send(icsContent);
    } catch (error) {
        res.status(404).send('Calendrier introuvable ou lien invalide');
    }
});

// --- OPERTATIONS CRUD CLASSIQUES ---

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
        const response = await calendarService.updateCalendar(req.user!.userId, req.params.id, req.body);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour du calendrier' });
    }
});

router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const response = await calendarService.deleteCalendar(req.user!.userId, req.params.id);
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

// ==========================================
// ROUTES RENDEZ-VOUS
// ==========================================

router.get('/:calendarId/appointments', async (req, res) => {
    try {
        const data = await appointmentService.getAllAppointmentsByCalendarId(req.params.calendarId);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/:calendarId/appointments', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { title, description, startDate, endDate, recursionRule, recursionEndDate, tags = [] } = req.body;
        let appointment;

        if (recursionRule !== undefined && recursionRule !== null) {
            appointment = await appointmentService.createRecurrentAppointment(
                req.user!.userId,
                req.params.calendarId,
                title,
                description,
                new Date(startDate),
                new Date(endDate),
                recursionRule,
                new Date(recursionEndDate),
                tags
            );
        } else {
            appointment = await appointmentService.createAppointment(
                req.user!.userId,
                req.params.calendarId,
                title,
                description,
                new Date(startDate),
                new Date(endDate),
                tags
            );
        }

        res.status(201).json(appointment);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Erreur lors de la création du rendez-vous' });
    }
});

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

router.get('/appointmentsRecurrent/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const appointment = await appointmentService.getRecurrentAppointmentById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ error: 'Rendez-vous récurrent non trouvé' });
        }
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération du rendez-vous récurrent' });
    }
});

router.put('/appointments/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { title, description, startDate, endDate, recursionRule, recursionEndDate, tags } = req.body;
        const appointmentId = req.params.id;

        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;

        const updateResult = await appointmentService.updateAppointmentType(
            req.user!.userId,
            appointmentId,
            {
                title,
                description,
                startDate: start,
                endDate: end,
                recursionRule,
                recursionEndDate: recursionEndDate ? new Date(recursionEndDate) : null,
                tags
            }
        );
        res.json(updateResult);


    } catch (error) {
        console.error("Erreur PUT /appointments/:id :", error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du rendez-vous' });
    }
});

router.delete('/appointments/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const isRecurring = req.query.recurring === 'true';
        let response;

        if (isRecurring) {
            response = await appointmentService.deleteRecurrentAppointment(req.user!.userId, req.params.id);
        } else {
            response = await appointmentService.deleteAppointment(req.user!.userId, req.params.id);
        }

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