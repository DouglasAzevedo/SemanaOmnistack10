const axios = require('axios');
const Dev = require('../models/Dev');
const parseStringAsArray = require('../utils/parseStringAsArray');
const { findConnections, sendMessage } = require('../websocket');

module.exports = {

    async index(request, response) {
        const devs = await Dev.find();

        return response.json(devs);
    },

    async store(request, response) {
        const {
            github_username,
            techs,
            latitude,
            longitude
        } = request.body;

        let dev = await Dev.findOne({
            github_username
        });

        if (!dev) {
            const apiResponse = await axios.get(`https://api.github.com/users/${github_username}`);

            // se name não existir usa o valor padrao, o qual deixamos como login
            const {
                name = login, avatar_url, bio
            } = apiResponse.data;

            const techsArray = parseStringAsArray(techs);

            const location = {
                type: 'Point',
                coordinates: [longitude, latitude],
            }

             dev = await Dev.create({
                github_username,
                name,
                avatar_url,
                bio,
                techs: techsArray,
                location,
            })

            //filtrar as conexões que estão no range de busca definida
            //E que o novo Dev tenha pelo menos uma das techs filtradas

            const sendSocketMessageTo = findConnections(
                { latitude, longitude },
                techsArray,
            )
            sendMessage(sendSocketMessageTo, 'new-Dev', dev);
            console.log(sendSocketMessageTo);
        }

        return response.json(dev)
    }
};