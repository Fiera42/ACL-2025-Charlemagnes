export class Calendar {
    constructor(
        public id: string | null,
        public name: string,
        public description: string,
        public ownerId: string,
        public createdAt: Date = new Date()
    ) {}

    static create(name: string, description: string, ownerId: string): Calendar {
        return new Calendar(null, name, description, ownerId);
    }

    isValid(): boolean {
        return Boolean(this.name && this.ownerId);
    }
}
