import userService from '../services/userService.js';

const createUser = async (req, res) => {
    try {
        const user = await userService.createUser(req.body);

        res.status(201).send(user);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
};

export default { createUser };