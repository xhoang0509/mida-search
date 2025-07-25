const SessionController = {
    findAll: async (req, res) => {
        res.status(200).json({
            success: true,
        });
    },
    findOne: async (req, res) => {
        res.status(200).json({
            success: true,
        });
    },
};

module.exports = SessionController;
