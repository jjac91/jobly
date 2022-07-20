const { BadRequestError } = require("../expressError");

/** readies data for sql update
   *Takes in data in the form of an object (e.g. { test1: 1, test2: 2 })
   *and another object that provides a translation key for turning javascript variables into sql variables
   *(e.g. {firstname:"first_name"}) 
   * Returns an object with the keys setCols and values. setCols has a value that is a string has all sql variable names
   * set to equal their position from the original data object and can be used to set values for an sql query.
   * values has a value that is an array of data taken from the data object
   * (e.g. { setCols: '"test1"=$1, "test2"=$2, "first_name"=$3', values:[1,2,"Sam"] })
   * 
   * Takes in data:{ test1: 1, test2: 2 } and a jst to sql key { test1: 1, test2: 2 }
   * 
   * Returns { setCols: '"test1"=$1, "test2"=$2, "first_name"=$3', values:[1,2,"Sam"] })
   *
   * Throws badRequestError if no data is given.
   **/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
