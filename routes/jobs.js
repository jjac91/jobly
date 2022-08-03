/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureIsAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const { response } = require("express");

const router = new express.Router();

/** POST / { company } =>  { company }
 *
 * job should be {  title, salary, equity, companyHandle  }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.post(
  "/",
  ensureLoggedIn,
  ensureIsAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const job = await Job.create(req.body);
      return res.status(201).json({ job });
    } catch (err) {
      return next(err);
    }
  }
);

/** GET /  =>
 *   { jobs: { id, title, salary, equity, company_handle AS "companyHandle"}, ...] }
 *
 * Can filter on provided search filters:
 * - minSalary
 * - hasEquity
 * - title Like (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    if (Object.keys(req.query).length === 0) {
      const jobs = await Job.findAll();
      return res.json({ jobs });
    } else {
      let filterParams = {};
      /** checks if minSalary is in the query string and adds it to the list of filters. Returns an error if not a number*/
      if (req.query.minSalary) {
        let minSalary = Number(req.query.minSalary);
        if (isNaN(minSalary)) {
          return next(new BadRequestError("minSalary must be a number"));
        } else {
          filterParams.minSalary = minSalary;
        }
      }
      /** checks if hasEquity is in the query string and adds it to the list of filters. Returns an error if not a number*/
      if (req.query.hasEquity) {
        if (req.query.hasEquity === "true") {
          filterParams.hasEquity = true;
        }
      }
      /** checks if name is in the query string and adds it to the list of filters.*/
      if (req.query.title) {
        filterParams.title = req.query.title;
      }
      /** calls the filter search and returns the results*/
      const jobs = await Job.findFiltered(filterParams);
      return res.json({ jobs });
    }
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  =>  { job }
 *
 * job is [{ id, title, salary, equity, companyHandle }]
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.patch(
  "/:id",
  ensureLoggedIn,
  ensureIsAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const job = await Job.update(req.params.id, req.body);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /[id]  =>  { deleted:id }
 *
 * Authorization: admin
 */

router.delete(
  "/:id",
  ensureLoggedIn,
  ensureIsAdmin,
  async function (req, res, next) {
    try {
      await Job.remove(req.params.id);
      return res.json({ deleted: req.params.id });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
