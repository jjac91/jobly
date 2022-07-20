"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 5,
    equity: 0.6,
    companyHandle: "c1",
  };

  const badJob = {
    title: "new",
    salary: 5,
    equity: 0.6,
    companyHandle: "bad",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "new",
      salary: 5,
      equity: "0.6",
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT title, salary, equity, company_handle AS "companyHandle"
             FROM jobs
             WHERE title = 'new'`
    );
    expect(result.rows).toEqual([
      {
        title: "new",
        salary: 5,
        equity: "0.6",
        companyHandle: "c1",
      },
    ]);
  });

  test("bad request no company handle", async function () {
    try {
      await Job.create(badJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
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
    ]);
  });

  /************************************** findfilter */

describe("findFilter", function () {
  test("works:title filter", async function () {
    let jobs = await Job.findFiltered({ title: "j" });
    expect(jobs).toEqual([
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
    ]);
  });

  test("works:min Salary filter", async function () {
    let jobs = await Job.findFiltered({ minSalary: 5 });
    expect(jobs).toEqual([
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
    ]);
  });

  test("works: Equity filter", async function () {
    let jobs = await Job.findFiltered({ hasEquity: true });
    expect(jobs).toEqual([
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
    ]);
  });

  test("works:Salary filter and title", async function () {
    let jobs = await Job.findFiltered({ title: "c", minSalary: 2 });
    expect(jobs).toEqual([]);
  });

  test("works:Equity and title", async function () {
    let jobs = await Job.findFiltered({ title: "c", hasEquity: true });
    expect(jobs).toEqual([]);
  });

  test("works:Salary and equity", async function () {
    let jobs = await Job.findFiltered({ minSalary: 2, hasEquity: true });
    expect(jobs).toEqual([
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
      }
    ]);
  });

  test("works:equity and salary and title", async function () {
    let jobs = await Job.findFiltered({title: "1", minSalary: 2, hasEquity: false });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 5,
        equity: "0.1",
        companyHandle: "c1",
      }
    ]);
  });
  
  
});

  /************************************** get */

  describe("get", function () {
    test("works", async function () {
      let job = await Job.get(999);
      expect(job).toEqual({
        id: 999,
        title: "j1",
        salary: 5,
        equity: "0.1",
        companyHandle: "c1",
      });
    });

    test("not found if no such job", async function () {
      try {
        let huh = await Job.get("-1");
        console.log(huh);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "updated",
    salary: 15,
    equity: 0.69,
  };

  test("works", async function () {
    let job = await Job.update(999, updateData);
    expect(job).toEqual({
      id: 999,
      companyHandle: "c1",
      title: "updated",
      salary: 15,
      equity: "0.69",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = 999`
    );
    expect(result.rows).toEqual([
      {
        id: 999,
        title: "updated",
        salary: 15,
        equity: "0.69",
        companyHandle: "c1",
      },
    ]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls =  {
        title: "updated",
        salary: 15,
        equity: null,
      };

    let job = await Job.update(999, updateDataSetNulls);
    expect(job).toEqual({
        id: 999,
        title: "updated",
        salary: 15,
        equity: null,
        companyHandle: "c1",
      });

      const result = await db.query(
        `SELECT id, title, salary, equity, company_handle AS "companyHandle"
             FROM jobs
             WHERE id = 999`
      );
    expect(result.rows).toEqual([{
        id: 999,
        title: "updated",
        salary: 15,
        equity: null,
        companyHandle: "c1",
      },
    ]);
  });

  test("not found if no job", async function () {
    try {
      await Job.update(-1, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(999, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
      await Job.remove(999);
      const res = await db.query(
        "SELECT id FROM jobs WHERE id=999"
      );
      expect(res.rows.length).toEqual(0);
    });
  
    test("not found if no such job", async function () {
      try {
        await Job.remove(-1);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  });