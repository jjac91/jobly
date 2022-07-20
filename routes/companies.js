"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureIsAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");
const { response } = require("express");

const router = new express.Router();

/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: admin
 */

router.post("/", ensureLoggedIn, ensureIsAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    if (Object.keys(req.query).length === 0) {
      const companies = await Company.findAll();
      return res.json({ companies });
    } else {
      let filterParams = {};
      /** checks if minEmployees is in the query string and adds it to the list of filters. Returns an error if not a number*/
      if (req.query.minEmployees) {
        let minEmployees = Number(req.query.minEmployees);
        if (isNaN(minEmployees)) {
          return next(new BadRequestError("minEmployees must be a number"));
        } else {
          filterParams.minEmployees = minEmployees;
        }
      }
      /** checks if maxEmployees is in the query string and adds it to the list of filters. Returns an error if not a number*/
      if (req.query.maxEmployees) {
        let maxEmployees = Number(req.query.maxEmployees);
        if (isNaN(maxEmployees)) {
          return next(new BadRequestError("maxEmployees must be a number"));
        } else {
          filterParams.maxEmployees = maxEmployees;
        }
      }
      /** checks if both minEmployees and maxEmployees are both in the query string. If they are it returns an error if maxEmployees is less than minEmployees*/
      if (
        filterParams.minEmployees &&
        filterParams.maxEmployees &&
        Number(filterParams.minEmployees) > Number(filterParams.maxEmployees)
      ) {
        return next(
          new BadRequestError(
            "minEmployees cannot be greater than maxEmployees"
          )
        );
      }
      /** checks if name is in the query string and adds it to the list of filters.*/
      if (req.query.name) {
        filterParams.name = req.query.name;
      }
      /** calls the filter search and returns the results*/
      const companies = await Company.findFiltered(filterParams);
      return res.json({companies});
    }
  } catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.handle);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: admin
 */

router.patch("/:handle", ensureLoggedIn,ensureIsAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: admin
 */

router.delete("/:handle", ensureLoggedIn,ensureIsAdmin, async function (req, res, next) {
  try {
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
