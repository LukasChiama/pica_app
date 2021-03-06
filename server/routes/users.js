import passport from 'passport';
import { config } from 'dotenv';
import {
  createUser,
  findUser,
  findUsers,
  deleteUser,
  loginUser,
  verifyUser,
} from '../controllers/users';
import { createUserSchema, loginUserSchema } from '../middleware/schema';
import { validateRequest, validateIdParams } from '../middleware/validators';
import '../middleware/passport';

config();

export default (router) => {
  router.route('/users').get(findUsers);

  router
    .route('/users/signup')
    .post(validateRequest(createUserSchema), createUser);

  router.route('/users/verifyEmail/:email/:verifyCode').patch(verifyUser);

  router
    .route('/users/login')
    .post(validateRequest(loginUserSchema), loginUser);

  router
    .route('/users/:id')
    .get(validateIdParams, findUser)
    .delete(
      validateIdParams,
      passport.authenticate('jwt', {
        session: false,
      }),
      deleteUser,
    );

  router
    .route('/auth/google')
    .get(passport.authenticate('google', { scope: ['profile', 'email'] }));

  router
    .route('/auth/google/callback')
    .get(
      passport.authenticate('google', { failureRedirect: '/users/login' }),
      (req, res) => {
        res.redirect(process.env.FRONTEND_URL);
      },
    );

  router.route('/auth/facebook').get(passport.authenticate('facebook'));

  router
    .route('/auth/facebook/callback')
    .get(
      passport.authenticate('facebook', { failureRedirect: '/users/login' }),
      (req, res) => {
        res.redirect(process.env.FRONTEND_URL);
      },
    );
};
