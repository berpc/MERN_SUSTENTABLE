const bcrypt = require("bcryptjs");
const KPIs = require("../models/kpis");
const fs = require("fs");
const path = require("path");

async function getKPIs(req, res) {
  const { id } = req.params;
        
  const response = await KPIs.findById(id);
  if (!response) {
    res.status(400).send({ msg: "No se ha encontrado el formulario de KPIs" });
  } else {
    res.status(200).send(response);
    
  }

}

async function getKPIsForms(req, res) {
  const { active } = req.query;
  let response = null;

  if (active === undefined) {
    response = await KPIs.find();
  } else {
    response = await KPIs.find({ active });
  }

  res.status(200).send(response);
}

async function createKPIs(req, res) {
  const kpis = new KPIs({ ...req.body, active: true });

  kpis.save((error, kpisStored) => {
    if (error) {
      res.status(400).send({ msg: "Error al crear el formulario de KPIs" });
    } else {
      res.status(200).send(kpisStored);
    }
  });
}

async function updateKPIs(req, res) {
  const { id } = req.params;
  const kpisData = req.body;

  KPIs.findByIdAndUpdate({ _id: id }, kpisData, (error,response) => {
    if (error) {
      res.status(400).send({ msg: "Error al actualizar el formulario de KPIs" });
    } else {
      res.status(200).send({ msg: "Actualizacion correcta" });
    }
  });
}

async function deleteKPIs(req, res) {
  const { id } = req.params;

  KPIs.findByIdAndDelete(id, (error) => {
    if (error) {
      res.status(400).send({ msg: "Error al eliminar el formulario de KPIs" });
    } else {
      res.status(200).send({ msg: "Formulario eliminado" });
    }
  });
}

async function existsKPIsFormBySiteAndPeriodAndYear(req, res) {
  const { period, year, site } = req.params;

  KPIs.find(
    { period: period, year: year, site: site },
    {},
    (error, energies) => {
      if (error) {
        res
          .status(400)
          .send({ msg: "Error al obtener los formularios de KPIs" });
      } else {
        if (energies && energies.length > 0) {
          res.status(200).send({ code: 200, exist: true });
        } else {
          res.status(200).send({ code: 200, exist: false });
        }
      }
    }
  );
}

async function getPeriodKPIsFormsBySiteAndYear(req, res) {
  const { year, site } = req.params;

  KPIs.find(
    { year: year, site: site },
    { _id: 0, period: 1 },
    (error, periods) => {
      if (error) {
        res
          .status(400)
          .send({
            msg: "Error al obtener los formularios de KPIs de acuerdo al año",
          });
      } else {
        const newData = periods.map((item) => item.period);
        res.status(200).send({ code: 200, periods: newData });
      }
    }
  );
}

async function getKPIsFormsBySiteAndYear(req, res) {
  const { year, site } = req.params;

  KPIs.find(
    {
      $and: [
        { year: { $exists: true, $eq: year } },
        { site: { $exists: true, $eq: site } },
      ],
    },
    {},
    (error, kpisForms) => {
      if (error) {
        res
          .status(400)
          .send({
            msg: "Error al obtener los formularios de KPIs de acuerdo al año",
          });
      } else {
        res.status(200).send({ code: 200, kpisForms: kpisForms });
      }
    }
  );
}

function uploadFile(req, res) {
  const file = req.files.file;

  if (!file) {
    return res.status(400).send("No file uploaded.");
  }

  const filePath = path.join("uploads/files", file.name);

  fs.rename(file.path, filePath, (err) => {
    if (err) {
      return res.status(500).send("Failed to upload file.");
    }
    res.status(200).send({code:200,msg:"File uploaded successfully", fileName: filePath});
  });
}

function getFile(req, res) {
    const fileName = req.params.fileName;
    const filePath = "./uploads/files/" + fileName;
    fs.exists(filePath, (exists) => {
      if (!exists) {
        res.status(404).send({ message: "El archivo que buscás no existe" });
      } else {
        res.sendFile(path.resolve(filePath));
      }
    });
}

function deleteFile(req, res) {
  const { fileName } = req.body;

  if (!fileName) {
    return res.status(400).json({ message: 'Se requiere el nombre del archivo' });
  }

  // Define la ruta del archivo
  const filePath = path.join("uploads/files", fileName);

  // Elimina el archivo
  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ code: 500, message: 'Error al eliminar el archivo' });
    }
    res.status(200).json({ code:200, message: 'Archivo eliminado exitosamente' });
  });
}

module.exports = {
  getKPIs,
  getKPIsForms,
  createKPIs,
  updateKPIs,
  deleteKPIs,
  existsKPIsFormBySiteAndPeriodAndYear,
  getPeriodKPIsFormsBySiteAndYear,
  getKPIsFormsBySiteAndYear,
  uploadFile,
  getFile,
  deleteFile
};
