
var moment = require('moment');

function Supervisor(caching) {

    this.caching = caching;

};

module.exports = Supervisor;

Supervisor.prototype.SetNotices = async function (notices) {

    this.caching.set("supervisor-notices", JSON.stringify(notices));
};

Supervisor.prototype.GetNotices = async function () {

    var that = this;

    return new Promise(async function (resolve, reject) {

        try {

            that.caching.get("supervisor-notices", function (err, reply) {

                var notices = err ? null : JSON.parse(reply);
                resolve(notices);
            });

        } catch (error) {

            resolve(null);
        }
    }).catch(err => {

    });
};
