export class User {
    constructor(
        public id: string | null,
        public username: string,
        public email: string,
        public password: string,
        public createdAt: Date = new Date()
    ) {}

    static create(username: string, email: string, password: string): User {
        return new User(null, username, email, password);
    }

    isValid(): boolean {
        return Boolean(this.username && this.email && this.password);
    }
}