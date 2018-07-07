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
        await client.setValue('#input_email', process.env.TEST_EMAIL);
        await client.setValue('#input_password', process.env.TEST_PASSWORD);
        await client.click('#btn_login');
        await sleep(1000);
        expect(await client.getText('#div_email'), 'Email of the current logged in user')
            .to.contain(process.env.TEST_EMAIL);
    });
});
