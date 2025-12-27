import userService from '../services/userService.js';

const createUser = async (req, res) => {
    try {
        const user = await userService.createUser(req.body);

        res.status(201).send(user);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(400).send({ error: 'Failed to create user' });
    }
};

export default { createUser };