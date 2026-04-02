const companyQueries = require('../db/companyQueries');

async function list(req, res) {
  try {
    const companies = await companyQueries.findAll();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
}

async function getById(req, res) {
  try {
    const company = await companyQueries.findById(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch company' });
  }
}

async function getCars(req, res) {
  try {
    const cars = await companyQueries.findCars(req.params.id);
    res.json(cars);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch company cars' });
  }
}

module.exports = { list, getById, getCars };
