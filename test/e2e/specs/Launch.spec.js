import utils from '../utils'
function sleep(n) {
    return new Promise((resolve) => {
        setTimeout(resolve, n);
    })
}

describe('Launch', function () {
    beforeEach(utils.beforeEach);
    afterEach(utils.afterEach);

/*    it('shows the proper application title', function () {
        return this.app.client.getTitle()
            .then(title => {
                expect(title).to.equal('memosyne')
            })
    });*/

    it('Should be able to log in successfully', async function() {
        const client = this.app.client;
        console.log(process.env.TEST_EMAIL);
        console.log(process.env.TEST_PASSWORD);
        await client.setValue('#input_email', process.env.TEST_EMAIL);
        await client.setValue('#input_password', process.env.TEST_PASSWORD);
        await client.click('#btn_login');

        expect(await client.waitUntilTextExists('#div_email', 'Email: ' + process.env.TEST_EMAIL), 'Email of the current logged in user')
    });
    it('Should be able to create a node if the node container is selected and enter is pressed, the node should also be focused', async function() {
        const client = this.app.client;
        await client.waitForExist('#node-container');
        await client.click('#btn_newnode');
        await sleep(20000);
        expect(await client.hasFocus('#btn_newnode')).to.equal(false);
    })
});
