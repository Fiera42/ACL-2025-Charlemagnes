export class Calendar {
    constructor(
        public id: string | null,
        public name: string,
        public description: string,
        public color: string,
        public ownerId: string,
        public createdAt: Date = new Date(),
        public updatedAt: Date = new Date(),
        public updatedBy: string | null = null
    ) {}

    static create(name: string, description: string, color: string, ownerId: string): Calendar {
        return new Calendar(null, name, description, color, ownerId);
    }

    isValid(): boolean {
        return Boolean(this.name && this.ownerId);
    }
}
