import {IAuthDB} from "../../domain/interfaces/IAuthDB";
import {User} from "../../domain/entities/User";

export class MockAuthDB implements IAuthDB {
    users: { [id: string]: User } = {};
    maxUserId: string = "0";

    incrementID(input: string): string {
        const count = input.match(/([0-8]|9)9*$/);

        if (count === null) {
            input = "0";
            return input;
        }

        const index = count?.index as number;

        input = input.substring(0, index) + (Number(count[1]) + 1) + input.substring(index + 1, input.length)
        return input;
    }

    createUser(user: User): Promise<User> {
        return new Promise<User>((resolve) => {
            this.maxUserId = this.incrementID(this.maxUserId);

            let copy = structuredClone(user);
            copy.id = this.maxUserId;

            this.users[copy.id] = copy;

            resolve(structuredClone(copy));
            return;
        });
    }

    deleteUser(id: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            if (id in this.users) {
                delete this.users[id];
                resolve(true);
            } else resolve(false);
        });
    }

    findUserByEmail(email: string): Promise<User | null> {
        return new Promise<User | null>((resolve) => {
            resolve(
                Object.values(this.users).concat(null as unknown as User).filter((user) => user.email === email)
                    .map((user) => structuredClone(user))[0]
            );
        });
    }

    findUserById(id: string): Promise<User | null> {
        return new Promise<User | null>((resolve) => {
            if (id in this.users) resolve(structuredClone(this.users[id]));
            else resolve(null);
        });
    }

    findUserByUsername(username: string): Promise<User | null> {
        return new Promise<User | null>((resolve) => {
            resolve(
                Object.values(this.users).concat(null as unknown as User).filter((user) => user.username === username)
                    .map((user) => structuredClone(user))[0]
            );
        });
    }

    updateUser(id: string, user: Partial<User>): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            if (id in this.users) {
                Object.assign(this.users[id], user);
                resolve(structuredClone(this.users[id]));
            } else reject(new Error(`Calendar of id ${id} does not exist`));
        });
    }

    reset() {
        this.users = {};
        this.maxUserId = "0";
    }
}