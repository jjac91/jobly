const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  a1Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 5,
    equity: 0.6,
    companyHandle: "c1",
  };

  test("ok for admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "new",
        salary: 5,
        equity: "0.6",
        companyHandle: "c1",
      },
    });
  });

  test("not ok for users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
        salary: 10,
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
        salary: 5,
        equity: 1.6,
        companyHandle: "c1",
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    console.log(resp.body);
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "j3",
          salary: 3,
          equity: "0",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "j2",
          salary: 5,
          equity: "0.1",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "j1",
          salary: 5,
          equity: "0.1",
          companyHandle: "c1",
        },
      ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });

  test("works with minSalary and hasEquity", async function () {
    const resp = await request(app).get(`/jobs?minSalary=2&hasEquity=true`);
    expect(resp.body).toEqual({ jobs:
      [
        {
          id: expect.any(Number),
          title: "j2",
          salary: 5,
          equity: "0.1",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "j1",
          salary: 5,
          equity: "0.1",
          companyHandle: "c1",
        },
      ]});
  });

  test("works with parameters", async function () {
      const resp = await request(app).get(`/jobs?minSalary=2&hasEquity=true&title=1`);
      expect(resp.body).toEqual({ jobs:
        [
          {
            id: expect.any(Number),
            title: "j1",
            salary: 5,
            equity: "0.1",
            companyHandle: "c1",
          }
        ]});
    });
    test("minSalary must be an number", async function () {
      const resp = await request(app).get(`/jobs?minSalary=kek`);
      expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/999`);
    expect(resp.body).toEqual({
      job: {
        id: 999,
        title: "j1",
        salary: 5,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/-1`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/999`)
      .send({
        title: "j1-new",
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.body).toEqual({
      job: {
        id: 999,
        title: "j1-new",
        salary: 5,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("unauth for users", async function () {
    const resp = await request(app)
      .patch(`/jobs/999`)
      .send({
        title: "j1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).patch(`/jobs/999`).send({
      name: "j1-new",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/-1`)
      .send({
        title: "new nope",
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/999`)
      .send({
        id: 777,
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on companyHandle change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/999`)
      .send({
        companyHandle: "no-way",
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/999`)
      .send({
        equity: 5,
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    test("works for admin", async function () {
      const resp = await request(app)
          .delete(`/jobs/999`)
          .set("authorization", `Bearer ${a1Token}`);
      expect(resp.body).toEqual({ deleted: "999" });
    });
  
    test("unauth for users", async function () {
      const resp = await request(app)
          .delete(`/jobs/999`)
          .set("authorization", `Bearer ${u1Token}`);
          expect(resp.statusCode).toEqual(401);
    });
  
    test("unauth for anon", async function () {
      const resp = await request(app)
          .delete(`/jobs/999`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("not found for no such job", async function () {
      const resp = await request(app)
          .delete(`/jobs/-1`)
          .set("authorization", `Bearer ${a1Token}`);
      expect(resp.statusCode).toEqual(404);
    });
  });