const express = require("express");
const multiparty = require("connect-multiparty");
const EnergyController = require("../controllers/energy");
const md_auth = require("../middlewares/authenticated");
const md_upload= multiparty({ uploadDir: "./uploads/files" }); 
const fs = require("fs");
const path = require("path");

if (!fs.existsSync("./uploads/files")) {
    fs.mkdirSync("./uploads/files", { recursive: true });
  }

const api = express.Router();

api.get("/energy/:id", [md_auth.asureAuth], EnergyController.getEnergy);
api.get("/energies", [md_auth.asureAuth], EnergyController.getEnergies);
api.post("/add-energy", [md_auth.asureAuth], EnergyController.createEnergy);
api.put("/update-energy/:id",[md_auth.asureAuth], EnergyController.updateEnergy);
api.delete("/delete-energy/:id", [md_auth.asureAuth], EnergyController.deleteEnergy);
api.get("/energy-exists-site/:site/:period/:year", [md_auth.asureAuth], EnergyController.existsEnergyFormBySiteAndPeriodAndYear);
api.get("/energies-periods-site-year/:site/:year", [md_auth.asureAuth], EnergyController.getPeriodEnergyFormsBySiteAndYear);
api.get("/energies-site-year/:site/:year", [md_auth.asureAuth], EnergyController.getEnergyFormsBySiteAndYear);

api.post("/upload-file-energy/", [md_auth.asureAuth,md_upload], EnergyController.uploadFile);
api.get("/get-file-energy/:fileName", EnergyController.getFile);
api.delete("/delete-file-energy", EnergyController.deleteFile);

module.exports = api;
