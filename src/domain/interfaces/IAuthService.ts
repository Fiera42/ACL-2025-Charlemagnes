import {User} from "../entities/User.ts";
import {ServiceResponse} from "../entities/ServiceResponse.ts";

export interface IAuthService {
    createUser(username: string, password: string): Promise<User>;
    findUserByEmail(email: string): Promise<User | null>;
    findUserById(id: string): Promise<User | null>;
    findUserByUsername(username: string): Promise<User | null>;
    updateUser(id: string, user: Partial<User>): Promise<ServiceResponse>;
    deleteUser(id: string): Promise<ServiceResponse>;
    verifyPassword(user: User, password: string): Promise<boolean>
}
