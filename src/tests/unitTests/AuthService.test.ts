import assert from "node:assert";
import test from "node:test";
import {AuthService} from "../../application/services/AuthService.ts";
import {MockAuthDB} from "../mocks/MockAuthDB.ts";
import bcrypt from "bcryptjs";
import {ServiceResponse} from "../../domain/entities/ServiceResponse.ts";

const mockDB = new MockAuthDB();
const authService = new AuthService(mockDB);

const BASE_USER = {
    username: "me42",
    email: "fake.adress@mail.com",
    password: "12s@f3ty45?!()-_#&/;,",
};

const SANITIZED_BASE_USER = {
    username: "me42",
    email: "fake&period;adress&commat;mail&period;com",
    password: "$2b$10$bDZy76qjFH971uJdkWMFZO9X/N3XOGIyGHnIO7j0o5OfO5isKwWqm",
};

const SQL_INJECT_STRING = "' DROP TABLE *;";
const SQL_INJECT_SANITIZED_STRING = "&apos; DROP TABLE &midast;&semi;";

test.describe("createUser", () => {
    test("createUser", async () => {
        const user = await authService.createUser(
            BASE_USER.username,
            BASE_USER.email,
            BASE_USER.password,
        ).catch((reason) => {
            throw new Error(reason);
        });

        assert.ok(user.id);
        const bdUser = await mockDB.findUserById(user.id)
        assert.ok(bdUser);

        assert.deepStrictEqual(
            {...user},
            {
                ...user,
                ...BASE_USER,
                password: "",
            },
            "Password in return value should be removed"
        );
        assert.deepStrictEqual(
            {...bdUser, password: "",},
            {
                ...bdUser,
                ...SANITIZED_BASE_USER,
                password: "",
            }
        );
        assert.ok(
            await bcrypt.compare(BASE_USER.password, bdUser.password),
            "Password in database is not hashed"
            );

        mockDB.reset();
    });
    test("createUser (unique mail)", async () => {
        const user = await authService.createUser(
            BASE_USER.username,
            BASE_USER.email,
            BASE_USER.password,
        ).catch((reason) => {
            throw new Error(reason);
        });

        await assert.rejects(
            authService.createUser(
                "another name",
                BASE_USER.email,
                "another password",
            ),
            "Should not be able to create two user with the same email"
        );

        assert.ok(user.id);
        const bdUser = await mockDB.findUserById(user.id)
        assert.ok(bdUser);

        assert.deepStrictEqual(
            {...user},
            {
                ...user,
                ...BASE_USER,
                password: "",
            },
            "Password in return value should be removed"
        );
        assert.deepStrictEqual(
            {...bdUser, password: "",},
            {
                ...bdUser,
                ...SANITIZED_BASE_USER,
                password: "",
            }
        );
        assert.ok(
            await bcrypt.compare(BASE_USER.password, bdUser.password),
            "Password in database is not hashed"
        );

        mockDB.reset();
    });
    test("createUser (unique name)", async () => {
        const user = await authService.createUser(
            BASE_USER.username,
            BASE_USER.email,
            BASE_USER.password,
        ).catch((reason) => {
            throw new Error(reason);
        });

        await assert.rejects(
            authService.createUser(
                BASE_USER.username,
                "another.mail@mail.com",
                "another password",
            ),
            "Should not be able to create two user with the same username"
        );

        assert.ok(user.id);
        const bdUser = await mockDB.findUserById(user.id)
        assert.ok(bdUser);

        assert.deepStrictEqual(
            {...user},
            {
                ...user,
                ...BASE_USER,
                password: "",
            },
            "Password in return value should be removed"
        );
        assert.deepStrictEqual(
            {...bdUser, password: "",},
            {
                ...bdUser,
                ...SANITIZED_BASE_USER,
                password: "",
            }
        );
        assert.ok(
            await bcrypt.compare(BASE_USER.password, bdUser.password),
            "Password in database is not hashed"
        );

        mockDB.reset();
    });
    test("createUser (sanitize check)", async () => {
        const user = await authService.createUser(
            SQL_INJECT_STRING + " username",
            SQL_INJECT_STRING + " email",
            BASE_USER.password,
        ).catch((reason) => {
            throw new Error(reason);
        });

        assert.ok(user.id);
        const bdUser = await mockDB.findUserById(user.id)
        assert.ok(bdUser);

        assert.deepStrictEqual(
            {...user},
            {
                ...user,
                ...BASE_USER,
                username: SQL_INJECT_STRING + " username",
                email: SQL_INJECT_STRING + " email",
                password: "",
            },
            "User returned by the API must NOT be sanitized"
        );
        assert.deepStrictEqual(
            {...bdUser, password: "",},
            {
                ...bdUser,
                ...user,
                username: SQL_INJECT_SANITIZED_STRING + " username",
                email: SQL_INJECT_SANITIZED_STRING + " email",
                password: "",
            },
            "User sent to DB must be sanitized"
        );
        assert.ok(
            await bcrypt.compare(BASE_USER.password, bdUser.password),
            "Password in database is not hashed"
        );

        mockDB.reset();
    });
});

test.describe("deleteUser", () => {
    test("deleteUser", async () => {
        const user = await authService.createUser(
            BASE_USER.username,
            BASE_USER.email,
            BASE_USER.password,
        ).catch((reason) => {
            throw new Error(reason);
        });

        assert.ok(user.id);
        let bdUser = await mockDB.findUserById(user.id);
        assert.ok(bdUser);

        assert.deepStrictEqual(
            await authService.deleteUser(user.id),
            ServiceResponse.SUCCESS
        );
        bdUser = await mockDB.findUserById(user.id);
        assert.deepStrictEqual(bdUser, null, "User has not been deleted from DB");

        mockDB.reset();
    });
    test("deleteUser (not exist)", async () => {
        const user = await authService.createUser(
            BASE_USER.username,
            BASE_USER.email,
            BASE_USER.password,
        ).catch((reason) => {
            throw new Error(reason);
        });

        assert.ok(user.id);
        const bdUser = await mockDB.findUserById(user.id);
        assert.ok(bdUser);

        assert.deepStrictEqual(
            await authService.deleteUser("RND42"),
            ServiceResponse.RESOURCE_NOT_EXIST
        );
        assert.deepStrictEqual(
            await mockDB.findUserById(user.id),
            bdUser,
            "WTF why this changed"
        );

        mockDB.reset();
    });
    test("deleteUser (sanitize)", async () => {
        const user = await authService.createUser(
            BASE_USER.username,
            BASE_USER.email,
            BASE_USER.password,
        ).catch((reason) => {
            throw new Error(reason);
        });

        assert.ok(user.id);
        const bdUser = await mockDB.findUserById(user.id);
        assert.ok(bdUser);

        await assert.rejects(
            authService.deleteUser(SQL_INJECT_STRING),
            "UserID is not checked for safety"
        );

        assert.deepStrictEqual(
            await mockDB.findUserById(user.id),
            bdUser,
            "WTF why this changed"
        );

        mockDB.reset();
    });
});

test.describe("getUserByID", () => {
    test("getUserByID", async () => {
        const user = await authService.createUser(
            BASE_USER.username,
            BASE_USER.email,
            BASE_USER.password,
        ).catch((reason) => {
            throw new Error(reason);
        });

        assert.ok(user.id);
        const bdUser = await mockDB.findUserById(user.id);
        assert.ok(bdUser);

        const findResult = await authService.findUserById(user.id);

        assert.deepStrictEqual(
            findResult,
            user,
            "This test have the same requirements as 'createUser'. If 'createUser' tests fails, this fails too"
        );

        mockDB.reset();
    });
    test("getUserByID (not exist)", async () => {
        const user = await authService.createUser(
            BASE_USER.username,
            BASE_USER.email,
            BASE_USER.password,
        ).catch((reason) => {
            throw new Error(reason);
        });

        assert.ok(user.id);
        const bdUser = await mockDB.findUserById(user.id);
        assert.ok(bdUser);

        const findResult = await authService.findUserById("Hii42");

        assert.deepStrictEqual(
            findResult,
            null,
        );

        assert.deepStrictEqual(
            await mockDB.findUserById(user.id),
            bdUser,
            "WTF why this changed"
        );

        mockDB.reset();
    });
    test("getUserByID (sanitize)", async () => {
        const user = await authService.createUser(
            BASE_USER.username,
            BASE_USER.email,
            BASE_USER.password,
        ).catch((reason) => {
            throw new Error(reason);
        });

        assert.ok(user.id);
        const bdUser = await mockDB.findUserById(user.id);
        assert.ok(bdUser);

        await assert.rejects(
            authService.findUserById(SQL_INJECT_STRING),
            "UserID is not checked for safety"
        );

        assert.deepStrictEqual(
            await mockDB.findUserById(user.id),
            bdUser,
            "WTF why this changed"
        );

        mockDB.reset();
    });
});

test.describe("getUserByEmail", () => {
    test("getUserByEmail", async () => {
        const user = await authService.createUser(
            BASE_USER.username,
            BASE_USER.email,
            BASE_USER.password,
        ).catch((reason) => {
            throw new Error(reason);
        });

        assert.ok(user.id);
        const bdUser = await mockDB.findUserById(user.id);
        assert.ok(bdUser);

        const findResult = await authService.findUserByEmail(BASE_USER.email);

        assert.deepStrictEqual(
            findResult,
            user,
            "This test have the same requirements as 'createUser'. If 'createUser' tests fails, this fails too"
        );

        mockDB.reset();
    });
    test("getUserByEmail (not exist)", async () => {
        const user = await authService.createUser(
            BASE_USER.username,
            BASE_USER.email,
            BASE_USER.password,
        ).catch((reason) => {
            throw new Error(reason);
        });

        assert.ok(user.id);
        const bdUser = await mockDB.findUserById(user.id);
        assert.ok(bdUser);

        const findResult = await authService.findUserByEmail("another.mail@mail.com");

        assert.deepStrictEqual(
            findResult,
            null,
        );

        assert.deepStrictEqual(
            await mockDB.findUserById(user.id),
            bdUser,
            "WTF why this changed"
        );

        mockDB.reset();
    });
    test("getUserByEmail (sanitize)", async () => {
        const user = await authService.createUser(
            SQL_INJECT_STRING + " username",
            SQL_INJECT_STRING + " email",
            BASE_USER.password,
        ).catch((reason) => {
            throw new Error(reason);
        });

        assert.ok(user.id);
        const bdUser = await mockDB.findUserById(user.id);
        assert.ok(bdUser);

        const findResult = await authService.findUserByEmail(SQL_INJECT_STRING + " email");

        assert.deepStrictEqual(
            findResult,
            user,
            "This test have the same requirements as 'createUser'. If 'createUser' tests fails, this fails too"
        );

        mockDB.reset();
    });
});

test.describe("getUserByUsername", () => {
    test("getUserByUsername", async () => {
        const user = await authService.createUser(
            BASE_USER.username,
            BASE_USER.email,
            BASE_USER.password,
        ).catch((reason) => {
            throw new Error(reason);
        });

        assert.ok(user.id);
        const bdUser = await mockDB.findUserById(user.id);
        assert.ok(bdUser);

        const findResult = await authService.findUserByUsername(BASE_USER.username);

        assert.deepStrictEqual(
            findResult,
            user,
            "This test have the same requirements as 'createUser'. If 'createUser' tests fails, this fails too"
        );

        mockDB.reset();
    });
    test("getUserByUsername (not exist)", async () => {
        const user = await authService.createUser(
            BASE_USER.username,
            BASE_USER.email,
            BASE_USER.password,
        ).catch((reason) => {
            throw new Error(reason);
        });

        assert.ok(user.id);
        const bdUser = await mockDB.findUserById(user.id);
        assert.ok(bdUser);

        const findResult = await authService.findUserByUsername("aRandomName");

        assert.deepStrictEqual(
            findResult,
            null,
        );

        assert.deepStrictEqual(
            await mockDB.findUserById(user.id),
            bdUser,
            "WTF why this changed"
        );

        mockDB.reset();
    });
    test("getUserByUsername (sanitize)", async () => {
        const user = await authService.createUser(
            SQL_INJECT_STRING + " username",
            SQL_INJECT_STRING + " email",
            BASE_USER.password,
        ).catch((reason) => {
            throw new Error(reason);
        });

        assert.ok(user.id);
        const bdUser = await mockDB.findUserById(user.id);
        assert.ok(bdUser);

        const findResult = await authService.findUserByUsername(SQL_INJECT_STRING + " username");

        assert.deepStrictEqual(
            findResult,
            user,
            "This test have the same requirements as 'createUser'. If 'createUser' tests fails, this fails too"
        );

        mockDB.reset();
    });
});