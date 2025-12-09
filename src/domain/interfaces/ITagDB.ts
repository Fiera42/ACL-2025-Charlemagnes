import { Tag } from '../entities/Tag';

export interface ITagDB {
    createTag(tag: Tag): Promise<Tag>;
    findTagById(id: string): Promise<Tag | null>;
    findTagsByUser(userId: string): Promise<Tag[]>;
    updateTag(id: string, tag: Partial<Tag>): Promise<Tag>;
    deleteTag(id: string): Promise<boolean>;

    // Relations
    addTagToAppointment(appointmentId: string, tagId: string): Promise<void>;
    addAllTagsToAppointment(appointmentId: string, tagIds: string[]): Promise<void>;
    removeTagFromAppointment(appointmentId: string, tagId: string): Promise<boolean>;
    removeAllTagsFromAppointment(appointmentId: string): Promise<void>;
    findTagsByAppointment(appointmentId: string): Promise<Tag[]>;

    addTagToRecurrentAppointment(recurrentAppointmentId: string, tagId: string): Promise<void>;
    addAllTagsToRecurrentAppointment(recurrentAppointmentId: string, tagIds: string[]): Promise<void>;
    removeTagFromRecurrentAppointment(recurrentAppointmentId: string, tagId: string): Promise<boolean>;
    removeAllTagsFromRecurrentAppointment(recurrentAppointmentId: string): Promise<void>;
    findTagsByRecurrentAppointment(recurrentAppointmentId: string): Promise<Tag[]>;
}