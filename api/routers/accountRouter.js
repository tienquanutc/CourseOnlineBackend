const controller = require('../controller/accountController');
const auth = require('../middleware/auth');

const router = require('express').Router();

router.post('/register', controller.registerUser);
router.get('/confirmation/:token', controller.confirmationAccount);
router.post('/register/resend', controller.resendEmailVerify);
router.post('/login', controller.login);
router.post('/password', auth({roles: ['*']}), controller.changePassword);
router.post('/password/reset', controller.resetPassword);

router.get('/secret', auth({roles: ['*']}), (req, res, next) => {
    res.status(200).send({message: 'hello'})
});
module.exports = router;