export class Tag {
    constructor(
        public id: string | null,
        public name: string,
        public color: string,
        public createdBy: string,
        public createdAt: Date = new Date()
    ) {}

    static create(
        name: string,
        color: string,
        createdBy: string
    ): Tag {
        return new Tag(null, name, color, createdBy);
    }

    isValid(): boolean {
        return Boolean(this.name && this.color && this.createdBy);
    }
}
