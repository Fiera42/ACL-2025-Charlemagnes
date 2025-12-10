import { UpdateRule } from './UpdateRule';

export class Calendar {
    constructor(
        public id: string | null,
        public name: string,
        public description: string,
        public color: string,
        public ownerId: string,
        public createdAt: Date = new Date(),
        public updatedAt: Date = new Date(),
        public updatedBy: string | null = null,
        public url: string | null = null,
        public updateRule: UpdateRule | null = null,
        public publicToken: string | null = null
    ) {}

    static create(name: string, description: string, color: string, ownerId: string, url: string | null = null, updateRule: UpdateRule | null = null): Calendar {
        return new Calendar(null, name, description, color, ownerId, new Date(), new Date(), null, url, updateRule, null);
    }

    isValid(): boolean {
        return Boolean(this.name && this.ownerId);
    }
}
