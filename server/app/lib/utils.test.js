
/*
 *
 * This file is only used in the context of the HelloVoter app, not in the Blockpower app.
 *
 */

import { expect } from 'chai';
import { deepCopy } from './common';

import { ov_config } from './ov_config';
import neo4j from './neo4j';

import * as utils from './utils';

var db;

// mock express req/res

var req = {
  connection: {
    remoteAddress: '127.0.0.1',
  },
  header: (header) => {
    return "Mocked value for "+header;
  },
  user: {},
};

var res = {
  status: (code) => {
    return {
      json: (obj) => {
        return {
          body: obj,
          statusCode: code,
        }
      }
    }
  },
};

describe('App Utils', function () {

  before(() => {
    db = new neo4j(ov_config);
    req.db = db;
  });

  after(async () => {
    db.close();
  });

  it('_400 returns 400', () => {
    let r = utils._400(res, "Bad Request");
    expect(r.statusCode).to.equal(400);
    expect(r.body.error).to.equal(true);
    expect(r.body.msg).to.equal("Bad Request");
  });

  it('_401 returns 401', () => {
    let r = utils._401(res, "Unauthorized");
    expect(r.statusCode).to.equal(401);
    expect(r.body.error).to.equal(true);
    expect(r.body.msg).to.equal("Unauthorized");
  });

  it('_403 returns 403', () => {
    let r = utils._403(res, "Forbidden");
    expect(r.statusCode).to.equal(403);
    expect(r.body.error).to.equal(true);
    expect(r.body.msg).to.equal("Forbidden");
  });

  it('_422 returns 422', () => {
    let r = utils._422(res, "Unprocessable Entity");
    expect(r.statusCode).to.equal(422);
    expect(r.body.error).to.equal(true);
    expect(r.body.msg).to.equal("Unprocessable Entity");
  });

  it('_500 returns 500', () => {
    let r = utils._500(res, new Error());
    expect(r.statusCode).to.equal(500);
    expect(r.body.error).to.equal(true);
    expect(r.body.msg).to.equal("Internal server error.");
  });

  it('_501 returns 501', () => {
    let r = utils._501(res, "Not Implemented.");
    expect(r.statusCode).to.equal(501);
    expect(r.body.error).to.equal(true);
    expect(r.body.msg).to.equal("Not Implemented.");
  });

  it('_503 returns 503', () => {
    let r = utils._503(res, "Service Unavailable");
    expect(r.statusCode).to.equal(503);
    expect(r.body.error).to.equal(true);
    expect(r.body.msg).to.equal("Service Unavailable");
  });

  it('getClientIP', () => {
    expect(utils.getClientIP(req)).to.equal('127.0.0.1');
  });

  it('cqdo returns 500 with db error', async () => {
    let reqe = deepCopy(req);
    reqe.db.query = () => {
      throw new Error("mocked");
    };

    let r = await utils.cqdo(reqe, res, "not a cypher query", {}, false);
    expect(r.statusCode).to.equal(500);
    expect(r.body.error).to.equal(true);
    expect(r.body.msg).to.equal("Internal server error.");
  });

  it('cqdo returns 500 with bad query syntax', async () => {
    let r = await utils.cqdo(req, res, "not a cypher query", {}, false);
    expect(r.statusCode).to.equal(500);
    expect(r.body.error).to.equal(true);
    expect(r.body.msg).to.equal("Internal server error.");
  });

  it('cqdo returns 200 with proper query', async () => {
    let r = await utils.cqdo(req, res, "return timestamp()", {});
    expect(r.statusCode).to.equal(200);
    expect(r.body.msg).to.equal("OK");
    expect(r.body.data.length).to.equal(1);
  });

});
