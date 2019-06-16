import { Users, Op } from '../models';
import sendVerifyEmail from '../lib/mailSender';
import {
  hashPassword,
  generateToken,
  comparePassword,
  generateCode,
} from '../utils';
import { createObject } from './images';

/**
 * function for creating a new user
 * @name createUser
 * @async
 * @param {Object} req
 * @param {Object} res
 * @returns {JSON} JSON response with details of new user created
 */
const createUser = async (req, res) => {
  try {
    const reqObject = JSON.parse(req.body.body);
    const { username, email, password } = reqObject;
    const name = await Users.findOne({ where: { username } });
    if (name) return res.status(409).json({ error: 'Username in use' });
    const user = await Users.findOne({ where: { email } });
    if (user) return res.status(409).json({ error: 'Email in use' });
    const verifyCode = generateCode(username);
    const hashedPassword = await hashPassword(password);
    let image;
    if (req.file) {
      image = await createObject(req.file);
    }
    const data = {
      ...reqObject,
      password: hashedPassword,
      image,
      verifyCode,
    };
    const newUser = await Users.create(data);
    delete newUser.dataValues.password;
    const token = generateToken(newUser.id);
    sendVerifyEmail(email, verifyCode);
    return res.status(201).json({ data: { ...newUser.dataValues, token } });
  } catch (error) {
    return res.status(500).json(error);
  }
};

/**
 * function for verifying user email
 * @name verifyUser
 * @async
 * @param {Object} req
 * @param {Object} res
 * @returns {JSON} Json response object with status of operation
 */
const verifyUser = async (req, res) => {
  try {
    const { email, verifyCode } = req.params;
    const user = await Users.findOne({ where: { email } });
    const verify = await Users.findOne({ where: { verifyCode } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!verify) return res.status(400).json({ error: 'Invalid code' });
    await Users.update({ verifyCode: null }, { where: { email } });
    return res.status(200).json({ message: 'Email verified' });
  } catch (error) {
    return res.status(500).json(error);
  }
};

/**
 * function for finding user with provided id
 * @findUser
 * @async
 * @param {Object} req
 * @param {Object} res
 * @returns {JSON} Json object with details of user searched for
 */
const findUser = async (req, res) => {
  try {
    const user = await Users.findOne({ where: { id: req.params.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    delete user.dataValues.password;
    return res.status(200).json({ data: user.dataValues });
  } catch (error) {
    return res.status(500).json(error);
  }
};

/**
 * function for finding all users
 * @name findUsers
 * @async
 * @param {Object} _
 * @param {Object} res
 * @returns {JSON} Json object containing all users in the database
 */
const findUsers = async (_, res) => {
  try {
    const users = await Users.findAll();
    const response = users.map((item) => {
      const itemArray = item.dataValues;
      delete itemArray.password;
      return itemArray;
    });
    return res.status(200).json({ data: response });
  } catch (error) {
    return res.status(500).json(error);
  }
};

/**
 * funtion for generating token for user login
 * @name loginUser
 * @async
 * @param {Object} req
 * @param {Object} res
 * @returns {JSON} Json with details of user logged in
 */
const loginUser = async (req, res) => {
  try {
    const value = req.body.username || req.body.email;
    const user = await Users.findOne({
      where: {
        [Op.or]: [{ username: value }, { email: value }],
      },
    });
    if (!user) {
      return res.status(400).json({ error: 'Incorrect login details' });
    }
    const validPassword = comparePassword(
      req.body.password,
      user.dataValues.password,
    );
    if (!validPassword) {
      return res.status(400).json({ error: 'Incorrect login details' });
    }
    delete user.dataValues.password;
    const token = generateToken(user.id);
    return res.status(200).json({ data: { ...user.dataValues, token } });
  } catch (error) {
    return res.status(500).json(error);
  }
};

/**
 * function for deleting users
 * @name deleteUser
 * @async
 * @param {Object} req
 * @param {Object} res
 * @returns {JSON} Json response with status of delete
 */
const deleteUser = async (req, res) => {
  try {
    const deleted = await Users.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(204).json();
  } catch (error) {
    return res.status(500).json(error);
  }
};

export {
  createUser, verifyUser, findUser, findUsers, loginUser, deleteUser,
};
