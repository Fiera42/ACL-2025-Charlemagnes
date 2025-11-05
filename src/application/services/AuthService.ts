import {IAuthService} from "../../domain/interfaces/IAuthService.ts";
import {User} from "../../domain/entities/User.ts";
import {IAuthDB} from "../../domain/interfaces/IAuthDB.ts";
import {decode, encode} from "html-entities";
import bcrypt from "bcryptjs";
import {ServiceResponse} from "../../domain/entities/ServiceResponse.ts";
import {Sanitizer} from "./utils/Sanitizer.ts";
import {Appointment} from "../../domain/entities/Appointment.ts";

export class AuthService implements IAuthService {
    private authDB: IAuthDB;

    constructor(authDB: IAuthDB) {
        this.authDB = authDB;
    }

    createUser(username: string, email: string, password: string): Promise<User> {
        return new Promise<User>(async (resolve, reject) => {
            username = encode(username, {mode: 'extensive'});
            email = encode(email, {mode: 'extensive'});

            let user = await this.authDB.findUserByEmail(email)
                .catch((reason) => {
                    reject(reason);
                });

            if (user === undefined) return; // We already rejected in the catch
            if (user !== null) {
                reject(new Error(`A user of email (${decode(email)}) already exist`));
                return;
            }

            user = await this.authDB.findUserByUsername(username)
                .catch((reason) => {
                    reject(reason);
                });

            if (user === undefined) return; // We already rejected in the catch
            if (user !== null) {
                reject(new Error(`A user of name (${decode(username)}) already exist`));
                return;
            }

            const salt = await bcrypt.genSalt(10);
            password = await bcrypt.hash(password, salt);

            user = User.create(username, email, password);

            this.authDB.createUser(user)
                .then((user: User) => {
                    user.username = decode(user.username);
                    user.email = decode(email);
                    user.password = "";
                    resolve(user);
                })
                .catch((reason: any) => {
                    reject(reason);
                });
        });
    }

    deleteUser(userId: string): Promise<ServiceResponse> {
        return new Promise<ServiceResponse>(async (resolve, reject) => {
            if (Sanitizer.doesStringContainSpecialChar(userId)) {
                reject(new Error(`UserID (${userId}) contains special char`));
                return;
            }

            const user = await this.authDB.findUserById(userId)
                .catch((reason) => {
                    reject(reason);
                });

            if (user === undefined) return; // We already rejected in the catch
            if (user === null) {
                resolve(ServiceResponse.RESOURCE_NOT_EXIST);
                return;
            }

            const deleteResult = await this.authDB.deleteUser(userId)
                .catch((reason) => {
                    reject(reason);
                });
            if (deleteResult === undefined) return; // We already rejected in the catch

            if (deleteResult) {
                resolve(ServiceResponse.SUCCESS)
            } else {
                resolve(ServiceResponse.FAILED)
            }
        });
    }

    findUserByEmail(email: string): Promise<User | null> {
        return new Promise<User | null>(async (resolve, reject) => {
            email = encode(email, {mode: 'extensive'});

            const user = await this.authDB.findUserByEmail(email)
                .catch((reason) => {
                    reject(reason);
                });

            if (user === undefined) return; // We already rejected in the catch
            if (user === null) {
                resolve(null);
                return;
            }

            // We sanitized at creation, so we have to sanitize when getting it back
            user.username = decode(user.username);
            user.email = decode(user.email);
            user.password = "";

            resolve(user);
        });
    }

    findUserById(userId: string): Promise<User | null> {
        return new Promise<User | null>(async (resolve, reject) => {
            if (Sanitizer.doesStringContainSpecialChar(userId)) {
                reject(new Error(`UserId (${userId}) contains special char`));
                return;
            }

            const user = await this.authDB.findUserById(userId)
                .catch((reason) => {
                    reject(reason);
                });

            if (user === undefined) return; // We already rejected in the catch
            if (user === null) {
                resolve(null);
                return;
            }

            // We sanitized at creation, so we have to sanitize when getting it back
            user.username = decode(user.username);
            user.email = decode(user.email);
            user.password = "";

            resolve(user);
        });
    }

    findUserByUsername(username: string): Promise<User | null> {
        return new Promise<User | null>(async (resolve, reject) => {
            username = encode(username, {mode: 'extensive'});

            const user = await this.authDB.findUserByUsername(username)
                .catch((reason) => {
                    reject(reason);
                });

            if (user === undefined) return; // We already rejected in the catch
            if (user === null) {
                resolve(null);
                return;
            }

            // We sanitized at creation, so we have to sanitize when getting it back
            user.username = decode(user.username);
            user.email = decode(user.email);
            user.password = "";

            resolve(user);
        });
    }

    updateUser(userId: string, partialUser: Partial<User>): Promise<ServiceResponse> {
        return new Promise<ServiceResponse>(async (resolve, reject) => {
            if (Sanitizer.doesStringContainSpecialChar(userId)) {
                reject(new Error(`UserID (${userId}) contains special char`));
                return;
            }

            const user = await this.authDB.findUserById(userId)
                .catch((reason) => {
                    reject(reason);
                });

            if (user === undefined) return; // We already rejected in the catch
            if (user === null) {
                resolve(ServiceResponse.RESOURCE_NOT_EXIST);
                return;
            }
            if (partialUser.id && partialUser.id !== user.id) {
                resolve(ServiceResponse.FORBIDDEN);
                return;
            }

            const cleanedUser: Partial<User> = {
                ...(partialUser.username && {username: encode(partialUser.username, {mode: 'extensive'})}),
                ...(partialUser.email && {email: encode(partialUser.email, {mode: 'extensive'})}),
                ...(partialUser.password && {password: await bcrypt.hash(partialUser.password, await bcrypt.genSalt(10))}),
            };

            const updateResult = await this.authDB.updateUser(userId, cleanedUser)
                .catch((reason) => {
                    reject(reason);
                });
            if (updateResult === undefined) return; // We already rejected in the catch

            if (updateResult) {
                resolve(ServiceResponse.SUCCESS)
            } else {
                resolve(ServiceResponse.FAILED)
            }
        });
    }
}