const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns {id, title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if companyHandle not in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const companyCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [companyHandle]
    );

    if (companyCheck.rows.length === 0)
      throw new BadRequestError(`No company with ${companyHandle}`);

    const result = await db.query(
      `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs
   *
   * Returns [{ id, title, salary, equity, companyHandle  }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
      `SELECT id,
            title, 
            salary, 
            equity, 
            company_handle AS "companyHandle"
            FROM jobs
           ORDER BY id`
    );
    return jobsRes.rows;
  }

  /** Find all companies that match the filter.
   *
   * checks if the object with the filter paramters has the keys title, minSalary, and hasEquity.
   * For each matching key, combine it with the appropriate WHERE clause condition and add it to an array of filter parameters.
   * For hasEquity, it is only applied if true, because it being false filters out nothing
   * It then joins all the clauses with ANDS, does an SQL query with the filters applied and returns the results.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findFiltered(filterParams) {
    let paramArr = [];
    if (Object.hasOwn(filterParams, "title")) {
      paramArr.push(`title ILIKE '%${filterParams.title}%'`);
    }
    if (Object.hasOwn(filterParams, "minSalary")) {
      paramArr.push(`salary >= ${filterParams.minSalary}`);
    }
    if (Object.hasOwn(filterParams, "hasEquity")) {
      if(filterParams.hasEquity === true){
        paramArr.push(`equity > 0`)
      };
    }
    let whereString = paramArr.join(" AND ");
    console.log(whereString)

    const jobsRes = await db.query(
      `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE ${whereString}
           ORDER BY id`
    );
    return jobsRes.rows;
  }

  /** Given a job id, return data about company.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
      title, 
      salary, 
      equity, 
      company_handle AS "companyHandle"
      FROM jobs
    WHERE id = $1`,
      [id]
    );

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include:  { title, salary, equity, }
   *
   * Returns  {id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id,
                      title, 
                      salary, 
                      equity, 
                      company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job= result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;
