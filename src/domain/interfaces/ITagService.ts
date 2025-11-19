import { Tag } from "../entities/Tag";

export interface ITagService {
    createTag(
        ownerId: string,
        name: string,
        color:string
    ): Promise<Tag>;

    deleteTag(
        ownerId: string,
        tagId: string
    ): Promise<boolean>;

    updateTag(
        ownerId: string,
        tagId: string,
        tag: Partial<Tag>
    ): Promise<boolean>;

    getTagById(id: string): Promise<Tag | null>;

    getTagsByOwnerId(ownerId: string): Promise<Tag[]>;

    
}