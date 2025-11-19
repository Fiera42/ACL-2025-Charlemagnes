import { Tag } from "../../domain/entities/Tag";
import { ITagDB } from "../../domain/interfaces/ITagDB";
import { ITagService } from "../../domain/interfaces/ITagService";
import { Sanitizer } from "./utils/Sanitizer";
import { decode, encode } from "html-entities";

export class TagService implements ITagService {
    constructor(private tagDB: ITagDB) {}

    async createTag(
        ownerId: string,
        name: string,
        color: string
    ): Promise<Tag> {
        this.validateId("ownerId", ownerId);
        this.validateTagFields(name, color);

        const sanitizedName = this.sanitize(name);
        const sanitizedColor = this.sanitizeColor(color);

        const tag = Tag.create(sanitizedName, sanitizedColor, ownerId);

        if (!tag.isValid()) {
            throw new Error("Invalid tag data");
        }

        const createdTag = await this.tagDB.createTag(tag);
        return this.desanitizeTag(createdTag);
    }

    async deleteTag(
        ownerId: string,
        tagId: string
    ): Promise<boolean> {
        this.validateId("ownerId", ownerId);
        this.validateId("tagId", tagId);

        const tag = await this.tagDB.findTagById(tagId);
        
        if (!tag) {
            throw new Error(`Tag with id ${tagId} not found`);
        }

        if (tag.createdBy !== ownerId) {
            throw new Error(`User ${ownerId} does not own tag ${tagId}`);
        }

        return await this.tagDB.deleteTag(tagId);
    }
    
    async updateTag(
        ownerId: string,
        tagId: string,
        tagUpdate: Partial<Tag>
    ): Promise<boolean> {
        this.validateId("ownerId", ownerId);
        this.validateId("tagId", tagId);

        const existingTag = await this.tagDB.findTagById(tagId);
        
        if (!existingTag) {
            throw new Error(`Tag with id ${tagId} not found`);
        }

        if (existingTag.createdBy !== ownerId) {
            throw new Error(`User ${ownerId} does not own tag ${tagId}`);
        }

        const sanitizedUpdate: Partial<Tag> = {};

        if (tagUpdate.name !== undefined) {
            if (!tagUpdate.name || tagUpdate.name.trim().length === 0) {
                throw new Error("Tag name cannot be empty");
            }
            sanitizedUpdate.name = this.sanitize(tagUpdate.name);
        }

        if (tagUpdate.color !== undefined) {
            this.validateColor(tagUpdate.color);
            sanitizedUpdate.color = this.sanitizeColor(tagUpdate.color);
        }

        if (tagUpdate.createdBy !== undefined || tagUpdate.createdAt !== undefined) {
            throw new Error("Cannot modify createdBy or createdAt fields");
        }

        await this.tagDB.updateTag(tagId, sanitizedUpdate);
        return true;
    }

    async getTagById(id: string): Promise<Tag | null> {
        this.validateId("tagId", id);

        const tag = await this.tagDB.findTagById(id);

        if (!tag) {
            return null;
        }

        return this.desanitizeTag(tag);
    }

    async getTagsByOwnerId(ownerId: string): Promise<Tag[]> {
        this.validateId("ownerId", ownerId);

        const tags = await this.tagDB.findTagsByUser(ownerId);
        return tags.map((tag: any) => this.desanitizeTag(tag));
    }

    private validateId(fieldName: string, id: string): void {
        if (!id || id.trim().length === 0) {
            throw new Error(`${fieldName} cannot be empty`);
        }

        if (Sanitizer.doesStringContainSpecialChar(id)) {
            throw new Error(`${fieldName} (${id}) contains special characters`);
        }
    }

    private validateTagFields(name: string, color: string): void {
        if (!name || name.trim().length === 0) {
            throw new Error("Tag name cannot be empty");
        }

        if (name.length > 50) {
            throw new Error("Tag name cannot exceed 50 characters");
        }

        this.validateColor(color);
    }

    private validateColor(color: string): void {
        if (!color || color.trim().length === 0) {
            throw new Error("Tag color cannot be empty");
        }

        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        
        if (!hexColorRegex.test(color)) {
            throw new Error(`Invalid color format: ${color}. Expected hexadecimal format (#RRGGBB or #RGB)`);
        }
    }

    private sanitize(text: string): string {
        return encode(text.trim(), { mode: 'extensive' });
    }

    private sanitizeColor(color: string): string {
        return color.trim().toUpperCase();
    }

    private desanitizeTag(tag: Tag): Tag {
        return new Tag(
            tag.id,
            decode(tag.name),
            tag.color,
            tag.createdBy,
            tag.createdAt
        );
    }
}
