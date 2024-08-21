import React, { useCallback, useState, useEffect } from "react";
import { Form, Image, Message } from "semantic-ui-react";
import { useFormik } from "formik";
import { useDropzone } from "react-dropzone";
import { User, Role, Company, Site } from "../../../../api";
import { useAuth } from "../../../../hooks";
import { image } from "../../../../assets";
import { ENV } from "../../../../utils";
import { isAdmin, isMaster } from "../../../../utils/checkPermission";
import { initialValues, validationSchema } from "./UserForm.form";
import "./UserForm.scss";

const userController = new User();
const roleController = new Role();
const companyController = new Company();
const siteController = new Site();

export function UserForm(props) {
  const { close, onReload, user } = props;
  const {
    accessToken,
    user: { role, company , site},
  } = useAuth();
  const [listRoles, setListRoles] = useState([]);
  const [listCompanies, setListCompanies] = useState([]);
  const [listSites, setListSites] = useState([]);
  const [companyData, setCompanyData] = useState([]);
  const [siteData, setSiteData] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    roleController.getRoles(accessToken, true).then((response) => {
      setListRoles(response);
    });
  }, []);

  useEffect(() => {
    if (isMaster(role)) {
      companyController.getCompanies(accessToken, true).then((response) => {
        setListCompanies(response);
      });
    }else if(isAdmin(role)){
      siteController.getSites(accessToken, true).then((response) => {
        setListSites(response);
      });
      setCompanyData(company);
      if(site){
        console.log(site)
        setSiteData(site);
      }
    }
  }, []);

  const formik = useFormik({
    initialValues: initialValues(user),
    validationSchema:  validationSchema(user,role),
    validateOnChange: false,
    onSubmit: async (formValue) => {
      try {
        if (!user) {
          if(isAdmin(role)){
            formValue.company=companyData._id;
            // formValue.site=siteData._id;
          }
          const response = await userController.createUser(
            accessToken,
            formValue
          );
          if (response.code && response.code === 500) {
          }
        } else {
          if(isAdmin(role) && !user.company){
            formValue.company=companyData._id;
          }else if(isAdmin(role) && !user.site){
            formValue.site=siteData._id;
          }
          const newData=removeNullFields(formValue);
          console.log(newData)
          await userController.updateUser(accessToken, user._id, newData);
        }
        onReload(true);
        close();
      } catch (error) {
        // console.log(2)
        setError(error.msg);
        console.error(error);
      }
    },
  });

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      formik.setFieldValue("avatar", URL.createObjectURL(file));
      formik.setFieldValue("fileAvatar", file);
    },
    [formik]
  );

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/jpeg": [".jpeg"], "image/png": [".png"] },
    onDrop,
  });

  const getAvatar = () => {
    if (formik.values.fileAvatar) {
      return formik.values.avatar;
    } else if (formik.values.avatar) {
      return `${ENV.BASE_PATH}/${formik.values.avatar}`;
    }
    return image.noAvatar;
  };

  return (
    <Form className="user-form" onSubmit={formik.handleSubmit}>
      {/* <div className="user-form__avatar" {...getRootProps()}>
        <input {...getInputProps()} />
        <Image avatar size="small" src={getAvatar()} />
      </div> */}
      {error.length > 0 ? 
    
     <p className="login-form__error">{<Message visible={error.length > 0} negative>{error}</Message>}</p>  : null
      }
      <Form.Group widths="equal">
        <Form.Input
          label="Nombre"
          name="firstname"
          placeholder="Nombre"
          onChange={formik.handleChange}
          value={formik.values.firstname}
          error={formik.errors.firstname}
        />
        <Form.Input
          label="Apellidos"
          name="lastname"
          placeholder="Apellidos"
          onChange={formik.handleChange}
          value={formik.values.lastname}
          error={formik.errors.lastname}
        />
      </Form.Group>


      <Form.Group widths="equal">
        {isMaster(role)? 
        <Form.Dropdown
        label="Empresa"
        placeholder="Seleccióna una empresa"
        options={listCompanies.map((ds) => {
          return {
            key: ds._id,
            text: ds.name,
            value: ds._id,
          };
        })}
        selection
        onChange={(_, data) => formik.setFieldValue("company", data.value)}
        value={formik.values.company}
        error={formik.errors.company}
      />
        :
        isAdmin(role)? siteData.length===0?
        <>
        <Form.Input
        label="Empresa"
        name="company"
        placeholder="Empresa"
        onChange={formik.handleChange}
        value={companyData?companyData.name : ""}
        error={formik.errors.company}
      />
       <Form.Dropdown
        label="Sitio"
        placeholder="Seleccióna un sitio"
        options={listSites.map((ds) => {
          return {
            key: ds._id,
            text: ds.name,
            value: ds._id,
          };
        })}
        selection
        onChange={(_, data) => formik.setFieldValue("site", data.value)}
        value={formik.values.site?formik.values.site: null}
        error={formik.errors.site}
      />
        </>
         :
         <Form.Input
         label="Sitio"
         name="site"
         placeholder="Sitio"
         onChange={formik.handleChange}
         value={siteData?siteData.name : ""}
         error={formik.errors.site}
       />
         
         :  null
      }
      </Form.Group>
      <Form.Group widths="equal">
        <Form.Input
          label="Sector"
          name="sector"
          placeholder="Sector"
          onChange={formik.handleChange}
          value={formik.values.sector}
          error={formik.errors.sector}
        />
        <Form.Input
          label="Posicion"
          name="position"
          placeholder="Posicion"
          onChange={formik.handleChange}
          value={formik.values.position}
          error={formik.errors.position}
        />
      </Form.Group>

      <Form.Group widths="equal">
        <Form.Input
          label="Correo Electronico"
          name="email"
          placeholder="Correo electronico"
          onChange={formik.handleChange}
          value={formik.values.email}
          error={formik.errors.email}
        />
        {isMaster(role) || isAdmin(role) ? (
          <Form.Dropdown
            label="Rol"
            placeholder="Seleccióna un rol"
            options={listRoles.map((ds) => {
              return {
                key: ds._id,
                text: ds.name,
                value: ds._id,
              };
            })}
            selection
            onChange={(_, data) => formik.setFieldValue("role", data.value)}
            value={formik.values.role}
            error={formik.errors.role}
          />
        ) : null}
      </Form.Group>

      <Form.Input
        label="Contraseña"
        type="password"
        name="password"
        placeholder="Contraseña"
        onChange={formik.handleChange}
        value={formik.values.password}
        error={formik.errors.password}
      />

      <Form.Button type="submit" primary fluid loading={formik.isSubmitting}>
        {user ? "Actualizar datos" : "Crear usuario"}
      </Form.Button>
    </Form>
  );
}


function removeNullFields(obj) {
  // Recorre las propiedades del objeto
  for (const key in obj) {
    // Verifica si el campo es null
    if (obj[key] === null) {
      // Elimina el campo del objeto
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      // Si el valor es un objeto, llama a la función recursivamente
      removeNullFields(obj[key]);
    }
  }
  return obj;
}