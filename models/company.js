"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`);
    return companiesRes.rows;
  }

  /** Find all companies that match the filter.
   * 
   * checks if the object with the filter paramters has the keys name, minEmployees, and maxEmployees
   * For each matching key, combine it with the appropriate WHERE clause condition and add it to an array of filter parameters
   * It then joins all the clauses with ANDS, does an SQL query with the filters applied and returns the results.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findFiltered(filterParams) {
    let paramArr =[]
    if (Object.hasOwn(filterParams, "name")){
      paramArr.push(`name ILIKE '%${filterParams.name}%'`)
    }
    if (Object.hasOwn(filterParams, "minEmployees")){
      paramArr.push(`num_employees >= ${filterParams.minEmployees}`)
    }
    if (Object.hasOwn(filterParams, "maxEmployees")){
      paramArr.push(`num_employees <= ${filterParams.maxEmployees}`)
    }
    let whereString = paramArr.join(" AND ")
   
    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE ${whereString}
           ORDER BY name`);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   * 
   * Works by destructuring the company into the desired data, then checks if the company has a id value that isn't null.
   * This means that the company has jobs data that should be put into an array. This job data is then mapped into an array
   * after being broken up by the appropriate job object.
   * Then the jobs array is added to the destructured data and returned as the object company with jobs
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl",
                  jobs.id,
                  jobs.title,
                  jobs.salary,
                  jobs.equity,
                  jobs.company_handle AS "companyHandle"
           FROM companies
           LEFT JOIN jobs ON companies.handle = jobs.company_handle
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    const {name, description, numEmployees, logoUrl} = company
    let jobs =[]
    if(company.id !== null){
      jobs= companyRes.rows.map(
        ({id, title, salary, equity, companyHandle}) => ({id, title, salary, equity, companyHandle})
      )
    }
    const companyWithJobs ={handle,name,description, numEmployees, logoUrl,jobs}
    return companyWithJobs;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
