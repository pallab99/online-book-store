const { failure } = require('../common/response');
const authModel = require('../model/auth');
const LoginAttemptModel = require('../model/loginAttempt');
const { comparePasswords } = require('../util/hashPassword');

const checkUnsuccessfulLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const authUser = await authModel.findOne({ email: email });
        if (!authUser) {
            next();
        } else {
            let user = await LoginAttemptModel.findOne({ email });
            if (!user) {
                user = new LoginAttemptModel();
                user.email = email;
                user?.timestamp?.push(new Date());
                await user.save();
            } else {
                user.timestamp.push(new Date());
                await user.save();
                const earliestTimestamp = user?.timestamp[0];
                const latestTimestamp =
                    user?.timestamp[user?.timestamp?.length - 1];
                const timeDifference =
                    (latestTimestamp - earliestTimestamp) / 1000;

                if (timeDifference > 10 && user?.timestamp?.length > 8) {
                    const userAuth = await authModel.findOne({ email });
                    const passwordExists = await comparePasswords(
                        password,
                        userAuth?.password
                    );
                    if (userAuth && passwordExists) {
                        user?.timestamp.splice(0, user?.timestamp?.length);
                        const currentTimer = new Date();
                        const timeFromDb = user.blockUserFromLogin;
                        const timeDifference = Math.abs(
                            currentTimer - timeFromDb
                        );
                        if (timeDifference <= 9000) {
                            return res
                                .status(400)
                                .json(
                                    failure(
                                        'You cannot login now.Try again after some time'
                                    )
                                );
                        } else {
                            next();
                            await user.save();
                        }
                    } else {
                        user.blockUserFromLogin = new Date();
                        await user.save();
                        return res
                            .status(400)
                            .json(failure('Too many login attempts'));
                    }
                } else {
                    const userAuth = await authModel.findOne({ email });
                    const passwordExists = await comparePasswords(
                        password,
                        userAuth?.password
                    );
                    if (userAuth && passwordExists) {
                        user?.timestamp.splice(0, user?.timestamp?.length);
                        await user.save();
                        next();
                    } else {
                        return res
                            .status(400)
                            .json(failure('wrong Credentials'));
                    }
                }
            }
        }
    } catch (error) {
        return res.status(401).send(failure('Internal Server Error'));
    }
};

module.exports = { checkUnsuccessfulLogin };
