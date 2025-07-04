"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPassportConfig = void 0;
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const { prisma } = require("../prisma/config/validate");
const createPassportConfig = (options) => {
    const { usernameField = "email", errorMessage = {
        missingCredentails: "Email and password are required",
        userNotFound: "Incorrect username",
        incorrectPassword: "Incorrect password"
    }, findUserByEmail, findUserById, verifyPassword = async (password, userPassword) => {
        return await bcrypt.compare(password, userPassword);
    }, serializedUser = (user) => user.id, deserializeUserFields = { id: true, email: true } } = options;
    const initializePassport = () => {
        passport.use(new LocalStrategy({ usernameField }, async (email, password, done) => {
            try {
                if (!email || !password) {
                    return done(null, false, { message: "Incorrect username" });
                }
                const user = await findUserByEmail(email);
                if (!user) {
                    return done(null, false, { message: errorMessage.userNotFound });
                }
                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) {
                    return done(null, false, { message: errorMessage.incorrectPassword });
                }
                return done(null, user);
            }
            catch (err) {
                return done(err);
            }
        }));
        passport.serializeUser((user, done) => {
            done(null, serializedUser(user));
        });
        passport.deserializedUser(async (id, done) => {
            try {
                const user = await findUserById(id, deserializeUserFields);
                return done(null, user || false);
            }
            catch (err) {
                done(err);
            }
        });
    };
    return { initializePassport };
};
exports.createPassportConfig = createPassportConfig;
