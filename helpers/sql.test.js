const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", function () {
  test("doesn't work; missing data", function () {
    const data = {};
    try {
      sqlForPartialUpdate(data);
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
  test("works, irrelavant jsToSql", function () {
    const data = { test1: 1, test2: 2 };
    let update = sqlForPartialUpdate(data,{firstname:"first_name"});
    expect(update).toEqual({ setCols: '"test1"=$1, "test2"=$2', values:[1,2] });
  });
  test("works, relavant jsToSql", function () {
    const data = { test1: 1, test2: 2, firstname:"Sam" };
    let update = sqlForPartialUpdate(data,{firstname:"first_name"});
    expect(update).toEqual({ setCols: '"test1"=$1, "test2"=$2, "first_name"=$3', values:[1,2,"Sam"] });
  });
});
